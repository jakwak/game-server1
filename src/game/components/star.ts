import { GameScene } from '../gameScene'

export class Star extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene
  id: number
  prevX = -1
  prevY = -1
  dead = false
  prevDead = false
  constructor(scene: GameScene, x, y, id) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(24, 22)

    this.setGravityY(0)

    this.scene = scene
    this.id = id

    this.setName('star')

    scene.physics.add.collider(this, scene.platform)

    this.on('hit', (pos) => {
      this.setImmovable(false)
      this.setAccelerationY(200)
      this.setCollideWorldBounds(true)
      this.setBounce(0.5)

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
}
