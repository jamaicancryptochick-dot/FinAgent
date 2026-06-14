import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createRoom, joinRoom, leaveRoom, getRoomBySocket } from './RoomManager.js'
import { EVENTS } from '../shared/constants.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(express.static(join(__dirname, '../dist')))
app.get('*', (req, res) => res.sendFile(join(__dirname, '../dist/index.html')))

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`)

  socket.on(EVENTS.ROOM_CREATE, ({ name }) => {
    const { code, room } = createRoom(io, socket, name)
    socket.emit(EVENTS.ROOM_UPDATE, {
      code,
      phase: room.phase,
      players: [{ id: socket.id, name, role: 'prop', ready: false }],
      isHost: true,
    })
  })

  socket.on(EVENTS.ROOM_JOIN, ({ code, name }) => {
    const result = joinRoom(io, socket, code, name)
    if (result.error) {
      socket.emit(EVENTS.ROOM_ERROR, { message: result.error })
      return
    }
    // Emit current state to the new joiner
    const room = result.room
    socket.emit(EVENTS.ROOM_UPDATE, {
      code: room.code,
      phase: room.phase,
      players: [...room.players.values()].map(p => ({
        id: p.id, name: p.name, role: p.role, ready: p.ready,
      })),
    })
  })

  socket.on(EVENTS.PLAYER_READY, ({ ready }) => {
    const room = getRoomBySocket(socket.id)
    if (room) room.setReady(socket.id, ready)
  })

  socket.on(EVENTS.GAME_START, ({ singlePlayer, aiCount }) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    if (singlePlayer) {
      room.startSinglePlayer(socket, aiCount || 3)
    } else {
      room.startGame()
    }
  })

  socket.on(EVENTS.PLAYER_MOVE, ({ dir, yaw, dt }) => {
    const room = getRoomBySocket(socket.id)
    if (room) room.handleMove(socket.id, dir, yaw, dt)
  })

  socket.on(EVENTS.PROP_DISGUISE, ({ propType }) => {
    const room = getRoomBySocket(socket.id)
    if (room) room.handleDisguise(socket.id, propType)
  })

  socket.on(EVENTS.HUNTER_SHOOT, ({ origin, direction }) => {
    const room = getRoomBySocket(socket.id)
    if (room) room.handleShoot(socket.id, origin, direction)
  })

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`)
    leaveRoom(socket)
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`))
