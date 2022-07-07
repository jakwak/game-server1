import geckos, { ServerChannel } from '@geckos.io/server'
import type { GeckosServer } from '@geckos.io/server'
import Game from './game.js'
import pkg from 'phaser'
const { Scene } = pkg

import { Player } from './components/player.js'
import { Star } from './components/star.js'
import { Bullet, Bullets } from './components/bullets.js'

export class GameScene extends Scene {
  declare game: Game
  channel: ServerChannel
  playerId: number
  io: GeckosServer
  playersGroup: pkg.GameObjects.Group
  stars: pkg.Physics.Arcade.Group
  platform: pkg.Tilemaps.TilemapLayer
  bullets: Bullets

  constructor() {
    super({ key: 'GameScene' })
    this.playerId = 0
  }

  init() {
    this.io = geckos({
      iceServers: [
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    })
    this.io.addServer(this.game.server)
  }

  getId() {
    return this.playerId++
  }

  prepareToSync(player: Player) {
    return `${player.playerId},${Math.round(player.x).toString(
      36
    )},${Math.round(player.y).toString(36)},${player.dead === true ? 1 : 0},${
      player.uname
    },`
  }

  getState() {
    let state = ''
    this.playersGroup.children.iterate((player: Player) => {
      state += this.prepareToSync(player)
    })
    return state
  }

  getItems() {
    let state = ''
    this.stars.children.iterate((star: Star) => {
      state += `${star.id},${Math.round(star.x).toString(36)},${Math.round(
        star.y
      ).toString(36)},${star.dead === true ? 1 : 0},`
    })
    return state
  }

  preload() {
    const publicPath = '../../../../public/'

    this.load.image(
      'tiles',
      publicPath + 'tmx-test/tilesets/platformPack_tilesheet.png'
    )
    this.load.tilemapTiledJSON(
      'map',
      publicPath + 'tmx-test/tilemaps/test2.json'
    )
  }

  createPlatform() {
    const map = this.make.tilemap({ key: 'map' })
    const tileset = map.addTilesetImage('platformPack_tilesheet', 'tiles')

    this.platform = map
      .createLayer('Platform', tileset, 0, 0)
      .setName('platform')
      .setCollisionByExclusion([-1], true)
      .forEachTile((tile) => {
        if (tile.index === 75) {
          tile.setCollision(false, false, true, false, true)
        }
      })

    this.stars = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })

    map.getObjectLayer('Items').objects.forEach((star, index) => {
      this.stars.add(new Star(this, star.x, star.y, index))
    })

    this.events.on('add_star', (pos) => {
      let star = this.stars.getFirstDead(
        false,
        Phaser.Math.Between(pos.x - 200 < 50 ? 50 : pos.x - 200, pos.x + 200),
        Phaser.Math.Between(50, this.scale.height),
        'star'
      ) as Star

      star.setActive(true)
      star.setVisible(true)
    })
  }

  initCollider(channel) {
    this.physics.add.collider(
      this.bullets.getChildren(),
      this.bullets.getChildren(),
      collideHandler1
    )
    this.physics.add.collider(
      this.platform,
      this.bullets.getChildren(),
      collideHandler2
    )

    function collideHandler1(g1: Phaser.Physics.Arcade.Sprite, g2) {
      if (g1.active && g2.active) {
        g1.disableBody(true, true)
        g1.setActive(false)
        g1.setVisible(false)

        g2.disableBody(true, true)
        g2.setActive(false)
        g2.setVisible(false)

        channel.room.emit('collide', {
          x: Math.round(g1.body.x),
          y: Math.round(g1.body.y),
        })
      }
    }

    function collideHandler2(g1: Phaser.Physics.Arcade.Sprite, g2) {
      if (g1.name === 'bullet' && g1.active) {
        g1.disableBody(true, true)
        g1.setActive(false)
        g1.setVisible(false)

        channel.room.emit('collide', {
          x: Math.round(g1.body.x),
          y: Math.round(g1.body.y),
        })
      }
    }

    this.physics.add.overlap(
      this.bullets.getChildren(),
      this.stars,
      collideHandler
    )
    this.physics.add.overlap(
      this.bullets.getChildren(),
      this.playersGroup,
      collideHandler
    )

    function collideHandler(bullet: Bullet, gameObject) {
      bullet.disableBody(true, true)
      bullet.setActive(false)
      bullet.setVisible(false)

      if (gameObject.name === 'star' || gameObject.name === 'player')
        gameObject.emit('hit', { x: bullet.x, y: bullet.y })

      // scene.channel.room.emit('collide', {
      //   x: Math.round(bullet.x),
      //   y: Math.round(bullet.y),
      // })
    }
  }

  create() {
    this.physics.world.setBounds(0, 0, 1000 * 3, 650)

    this.createPlatform()

    this.playersGroup = this.add.group()
    this.bullets = new Bullets(this)

    this.io.onConnection((channel) => {
      this.channel = channel

      this.initCollider(channel)

      channel.onDisconnect(() => {
        console.log('Disconnect user ' + channel.userData.uname)
        this.playersGroup.children.each((player: Player) => {
          if (player.playerId === channel.userData.playerId) {
            player.kill()
          }
        })
        channel.room.emit('removePlayer', channel.userData.playerId)
      })

      // channel.on('addDummy', (name) => addDummy(name))

      channel.on('getId', (uname) => {
        channel.userData = { uname: uname, playerId: this.getId() }
        channel.emit('getId', channel.userData.playerId)
      })

      channel.on('playerMove', (data) => {
        this.playersGroup.children.iterate((player: Player) => {
          if (player.playerId === channel.userData.playerId) {
            player.setMove(data)
          }
        })
      })

      channel.on('shoot', (data) => {
        this.playersGroup.children.iterate((player: Player) => {
          if (player.playerId === channel.userData.playerId) {
            //@ts-ignore
            this.bullets.fireBullet(player.x, player.y, data.x, data.y)
          }
        })
      })

      channel.on('addPlayer', () => {
        let dead = this.playersGroup.getFirstDead()
        if (dead) {
          dead.revive(channel.userData.playerId, channel.userData.uname, false)
        } else {
          this.playersGroup.add(
            new Player(
              this,
              channel.userData.playerId,
              Phaser.Math.RND.integerInRange(100, 700),
              Phaser.Math.RND.integerInRange(0, 500),
              channel.userData.uname
            )
          )
        }
      })

      channel.emit('ready')
    })
  }

  update() {
    let playerUpdates = ''
    this.playersGroup.children.iterate((player: Player) => {
      let x = Math.abs(player.x - player.prevX) > 0.5
      let y = Math.abs(player.y - player.prevY) > 0.5
      let dead = player.dead != player.prevDead

      if (x || y || dead) {
        if (dead || !player.dead) {
          playerUpdates += this.prepareToSync(player)
        }
      }
      player.postUpdate()
    })

    let bulletUpdates = ''
    this.bullets.getChildren().forEach((bullet: Bullet, id: number) => {
      bulletUpdates += `${id},${Math.round(bullet.x).toString(36)},${Math.round(
        bullet.y
      ).toString(36)},${bullet.visible ? '1' : '0'},`
    })

    let starUpdates = ''
    this.stars.getChildren().forEach((star: Star) => {
      starUpdates += star.active
        ? `${star.id},${Math.round(star.x).toString(36)},${Math.round(
            star.y
          ).toString(36)},${star.visible ? '1' : '0'},`
        : ''
    })

    // if (
    //   playerUpdates.length > 0 ||
    //   bulletUpdates.length > 0 ||
    //   starUpdates.length > 0
    // ) {
    this.io
      .room()
      .emit('updateObjects', [playerUpdates, bulletUpdates, starUpdates])
    // }
  }
}
