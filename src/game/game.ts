import '@geckos.io/phaser-on-nodejs'
import { Server } from 'https'
import Phaser from 'phaser'
import { GameScene } from './gameScene.js'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.HEADLESS,
  width: 900,
  height: 450,
  banner: false,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
    },
  },
}

export default class Game extends Phaser.Game {
  private _server!: Server
  public get server(): Server {
    return this._server
  }
  public set server(value: Server) {
    this._server = value
  }
  constructor(server: Server) {
    super(config)
    this.server = server
  }
}
