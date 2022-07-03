export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, '')
    this.setDisplaySize(10, 10)
  }

  fire(x, y) {
    this.body.reset(x, y)

    this.setActive(true)
    this.setVisible(true)

    this.setVelocityY(-700)
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
      frameQuantity: 5,
      key: 'bullet',
      active: false,
      visible: false,
      classType: Bullet,
    })
  }

  fireBullet(x, y) {
    let bullet = this.getFirstDead(false)

    if (bullet) {
      bullet.fire(x, y)
    }
  }
}
