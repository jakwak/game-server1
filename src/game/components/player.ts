import 'phaser'
import { GameScene } from '../gameScene'

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene
  prevX = -1
  prevY = -1
  dead = false
  prevDead = false
  playerId = null
  uname = ''
  move = { left: false, up: false, right: false, none: true }

  constructor(scene: GameScene, playerId, x = 200, y = 200, uname) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene
    this.playerId = playerId
    this.uname = uname

    // this.setDummy(dummy)

    this.body.setSize(24, 48)

    this.setCollideWorldBounds(true)
    scene.physics.add.collider(this, scene.platform)
    scene.physics.add.collider(this, scene.stars)
    scene.physics.add.collider(this, scene.playersGroup)

    scene.events.on('update', this.update, this)

    this.on('hit', (pos) => {
      this.scene.channel.room.emit('collide', {
        x: Math.round(pos.x),
        y: Math.round(pos.y),
      })
      // this.setAlpha(0.5)
      // this.scene.time.delayedCall(3000, () => {
      //   this.setAlpha(1)
      // })
    })
  }

  // setDummy(dummy) {
  //   if (dummy) {
  //     this.body.setBounce(1)
  //     this.scene.time.addEvent({
  //       delay: Phaser.Math.RND.integerInRange(45, 90) * 1000,
  //       callback: () => this.kill()
  //     })
  //   } else {
  //     this.body.setBounce(0)
  //   }
  // }

  kill() {
    this.dead = true
    this.setActive(false)
    this.body.enable = false
  }

  revive(playerId, uname, dummy) {
    this.playerId = playerId
    this.uname = uname
    this.dead = false
    this.setActive(true)
    this.body.enable = true
    // this.setDummy(dummy)
    this.setVelocity(0)

    this.x = 20
    this.y = 20
  }

  setMove(data) {
    let int = parseInt(data, 36)

    let move = {
      left: int === 1 || int === 5,
      right: int === 2 || int === 6,
      up: int === 4 || int === 6 || int === 5,
      none: int === 0,
    }

    this.move = move
  }

  update() {
    if (this.move.left) this.setVelocityX(-160)
    else if (this.move.right) this.setVelocityX(160)
    else this.setVelocityX(0)

    if (this.move.up && this.body.blocked.down) this.setVelocityY(-400)
  }

  postUpdate() {
    this.prevX = this.x
    this.prevY = this.y
    this.prevDead = this.dead
  }
}

export class Star extends Phaser.Physics.Arcade.Sprite {
  id: number
  prevX = -1
  prevY = -1
  dead = false
  prevDead = false
  constructor(scene, x, y, id) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(24, 22)

    this.scene = scene
    this.id = id

    scene.physics.add.collider(this, scene.platform)
  }
}
