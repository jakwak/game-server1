import type { GameScene } from '../gameScene'
import type { Player } from './player.js'

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene
  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.scene.physics.add.collider(this, scene.stars)
    this.scene.physics.add.overlap(
      this,
      this.scene.playersGroup,
      this.collideToPlayer
    )
    this.scene.physics.add.collider(this, scene.platform)
  }

  collideToPlayer(bullet: this, player: Player) {
    bullet.disableBody(true, true)
    bullet.setActive(false)
    bullet.setVisible(false)
    player.emit('hit', { x: bullet.x, y: bullet.y })
  }

  fire(x1, y1, x2, y2) {
    var vector = new Phaser.Math.Vector2(x2, y2)
    var norVec = vector.subtract({ x: x1, y: y1 }).normalize()

    // x1 = norVec.x > 0 ? x1 + 50 : x1 - 50

    // this.body.reset(x1, y1 - 30)
    this.enableBody(true, x1, y1 - 30, true, true)

    this.body.setCircle(11)
    this.setCollideWorldBounds(true)

    this.setBounce(0.5)
    this.setMass(50)
    this.setActive(true)
    this.setVisible(true)

    this.setVelocity(norVec.x * 700, norVec.y * 700)

    // this.scene.time.delayedCall(3000, () => {
    //   this.setActive(false)
    //   this.setVisible(false)
    // })
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta)
    if (this.y > 1000) {
      this.setActive(false)
      this.setVisible(false)
    }
  }
}

export class Bullets extends Phaser.Physics.Arcade.Group {
  constructor(scene) {
    super(scene.physics.world, scene)

    this.createMultiple({
      frameQuantity: 30,
      key: 'bullet',
      active: false,
      visible: false,
      classType: Bullet,
    })
  }

  fireBullet(x1, y1, x2, y2) {
    let bullet = this.getFirstDead(false)

    if (bullet) {
      bullet.fire(x1, y1, x2, y2)
    }
  }
}
