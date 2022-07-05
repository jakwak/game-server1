import geckos, { ServerChannel } from '@geckos.io/server'
import type { GeckosServer } from '@geckos.io/server'
import Game from './game.js'
import pkg from 'phaser'
const { Scene } = pkg

import { Player, Star } from './components/player.js'
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

    this.platform = map.createLayer('Platform', tileset, 0, 0)
    this.platform.setCollisionByExclusion([-1], true)

    this.platform.forEachTile((tile) => {
      if (tile.index === 75) {
        tile.setCollision(false, false, true, false, true)
      }
    })

    this.stars = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    })

    map.getObjectLayer('Items').objects.forEach((star, index) => {
      this.stars.add(new Star(this, star.x, star.y, 'star' + index))
    })
  }

  create() {
    this.physics.world.setBounds(0, 0, 1000 * 3, 650)

    this.createPlatform()

    this.playersGroup = this.add.group()
    this.bullets = new Bullets(this)

    // const addDummy = (name) => {
    //   if (this.playersGroup.countActive(true) > 300) return

    //   let x = Phaser.Math.RND.integerInRange(10, 890)
    //   let y = Phaser.Math.RND.integerInRange(0, 400)
    //   let id = Math.random()

    //   let dead = this.playersGroup.getFirstDead()
    //   if (dead) {
    //     dead.revive(id, name, true)
    //     dead.setPosition(x, y)
    //   } else {
    //     this.playersGroup.add(new Player(this, id, x, y, name, true))
    //   }
    // }

    this.io.onConnection((channel) => {
      this.channel = channel

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

      channel.on('pointerdown', (data) => {
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
    let updates = ''
    this.playersGroup.children.iterate((player: Player) => {
      let x = Math.abs(player.x - player.prevX) > 0.5
      let y = Math.abs(player.y - player.prevY) > 0.5
      let dead = player.dead != player.prevDead

      if (x || y || dead) {
        if (dead || !player.dead) {
          updates += this.prepareToSync(player)
        }
      }
      player.postUpdate()
    })

    let bullets_visible = ''
    this.bullets.getChildren().forEach((bullet: Bullet, index: number) => {
      bullets_visible += `${index},${Math.round(bullet.x).toString(
        36
      )},${Math.round(bullet.y).toString(36)},${bullet.visible ? '1' : '0'},`
    })

    if (updates.length > 0 || bullets_visible.length > 0) {
      this.io.room().emit('updateObjects', [updates, bullets_visible])
    }
  }
}
