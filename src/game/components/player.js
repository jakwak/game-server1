export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, playerId, x = 200, y = 200, uname, dummy = false) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.prevX = -1
    this.prevY = -1

    this.dead = false
    this.prevDead = false

    this.playerId = playerId
    this.uname = uname
    this.move = {}

    // this.setDummy(dummy)

    this.body.setSize(24, 48)

    this.setCollideWorldBounds(true)
    scene.physics.add.collider(this, scene.platform)
    scene.physics.add.collider(this, scene.stars)
    scene.physics.add.collider(this, scene.playersGroup)

    scene.events.on('update', this.update, this)
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
      none: int === 0
    }

    this.move = move
  }

  update() {
    if (this.move.left) this.setVelocityX(-160)
    else if (this.move.right) this.setVelocityX(160)
    else this.setVelocityX(0)

    if (this.move.up && this.body.onFloor()) this.setVelocityY(-400)
  }

  postUpdate() {
    this.prevX = this.x
    this.prevY = this.y
    this.prevDead = this.dead
  }
}

export class Star extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id) {
    super(scene, x, y, '')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    this.id = id

    this.prevX = -1
    this.prevY = -1

    this.dead = false
    this.prevDead = false

    this.body.setSize(24, 22)

    scene.physics.add.collider(this, scene.platform)
  }
}