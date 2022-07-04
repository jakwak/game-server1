import type { GameScene } from '../gameScene'

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  declare scene: GameScene
  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, '')
    this.scene = scene
    scene.physics.add.existing(this)

    scene.physics.add.collider(this, scene.stars)
    scene.physics.add.overlap(this, scene.playersGroup, this.collideToPlayer)
    scene.physics.add.collider(this, scene.platform)
  }

  collideToPlayer(bullet, player) {
    bullet.setActive(false)
    bullet.setVisible(false)
  }

  fire(x1, y1, x2, y2) {
    var vector = new Phaser.Math.Vector2(x2, y2)
    var norVec = vector.subtract({ x: x1, y: y1 }).normalize()

    // x1 = norVec.x > 0 ? x1 + 50 : x1 - 50

    this.body.reset(x1, y1 - 30)
    this.body.setCircle(11)
    this.setCollideWorldBounds(true)
    // this.scene.physics.add.collider(this, this.scene.bullets)
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
      frameQuantity: 100,
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
