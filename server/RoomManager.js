import { GameRoom } from './GameRoom.js'

const rooms = new Map()

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (rooms.has(code))
  return code
}

export function createRoom(io, socket, playerName) {
  const code = generateCode()
  const room = new GameRoom(io, code)
  rooms.set(code, room)
  room.addPlayer(socket, playerName)
  socket.join(code)
  return { code, room }
}

export function joinRoom(io, socket, code, playerName) {
  const room = rooms.get(code.toUpperCase())
  if (!room) return { error: 'Room not found' }
  if (room.isFull()) return { error: 'Room is full' }
  if (room.gameStarted) return { error: 'Game already in progress' }
  room.addPlayer(socket, playerName)
  socket.join(code)
  return { room }
}

export function leaveRoom(socket) {
  for (const [code, room] of rooms) {
    if (room.hasPlayer(socket.id)) {
      room.removePlayer(socket.id)
      socket.leave(code)
      if (room.isEmpty()) {
        room.destroy()
        rooms.delete(code)
      }
      return
    }
  }
}

export function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.hasPlayer(socketId)) return room
  }
  return null
}
