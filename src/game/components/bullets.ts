export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setSize(22, 22)

    scene.physics.add.collider(this, scene.stars)
    scene.physics.add.collider(this, scene.playersGroup)
  }

  fire(x1, y1, x2, y2) {
    var vector = new Phaser.Math.Vector2(x2, y2)
    var norVec = vector.subtract({ x: x1, y: y1 }).normalize()

    this.body.reset(x1, y1)

    this.setActive(true)
    this.setVisible(true)

    this.setVelocity(norVec.x * 700, norVec.y * 700)
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
