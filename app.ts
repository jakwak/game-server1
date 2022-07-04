// @ts-nocheck
import express, { Request, Response } from 'express'
import https from 'https'
import http from 'http'
import cors from 'cors'
import Game from './src/game/game.js'
import fs from 'fs'
import ip from 'ip'

const port = 1444
const app = express()

const sslOptions =
  ip.address() === '10.201.16.132'
    ? ''
    : {
        ca: fs.readFileSync('/private/etc/ssl/ca_bundle.crt'),
        key: fs.readFileSync('/private/etc/ssl/certs/private.key'),
        cert: fs.readFileSync('/private/etc/ssl/certificate.crt'),
      }

const server =
  ip.address() === '10.201.16.132'
    ? http.createServer(app)
    : https.createServer(sslOptions, app)
const game = new Game(server)

app.use(cors())
// app.use(express.static('public'))

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server')
})

app.get('/getState', (req, res) => {
  try {
    let gameScene = game.scene.keys['GameScene']

    return res.json({
      state: gameScene.getState(),
      items: gameScene.getItems(),
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

server.listen(port, () => {
  console.log(
    `⚡️[server]: Game1 Server is running at https://localhost:${port}`
  )
})
