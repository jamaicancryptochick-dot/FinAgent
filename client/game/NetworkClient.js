import { io } from 'socket.io-client'
import { EVENTS } from '../../shared/constants.js'

export class NetworkClient {
  constructor() {
    this.socket = io({ autoConnect: true, reconnection: true })
    this.myId = null
    this.myRole = null

    this.onRoomUpdate = null
    this.onRoomError = null
    this.onGameStart = null
    this.onReturnToLobby = null
    this.onPlayerState = null
    this.onPlayerLeft = null
    this.onPropDisguise = null
    this.onPlayerEliminated = null
    this.onPhaseChange = null
    this.onTimerTick = null
    this.onRoundEnd = null
    this.onAIAdd = null

    this.socket.on('connect', () => { this.myId = this.socket.id })

    this.socket.on(EVENTS.ROOM_UPDATE, (data) => {
      // Find our role from the player list
      const me = data.players?.find(p => p.id === this.socket.id)
      if (me) this.myRole = me.role
      this.onRoomUpdate?.(data)
    })

    this.socket.on(EVENTS.ROOM_ERROR, ({ message }) => this.onRoomError?.(message))

    this.socket.on(EVENTS.GAME_START, (data) => this.onGameStart?.(data))

    this.socket.on(EVENTS.PLAYER_STATE, (data) => this.onPlayerState?.(data))
    this.socket.on(EVENTS.PLAYER_LEFT, (data) => this.onPlayerLeft?.(data))
    this.socket.on(EVENTS.PROP_DISGUISE, (data) => this.onPropDisguise?.(data))
    this.socket.on(EVENTS.PLAYER_ELIMINATED, (data) => this.onPlayerEliminated?.(data))
    this.socket.on(EVENTS.PHASE_CHANGE, (data) => {
      const me = data.players?.find(p => p.id === this.socket.id)
      if (me) this.myRole = me.role
      this.onPhaseChange?.(data)
    })
    this.socket.on(EVENTS.TIMER_TICK, (data) => this.onTimerTick?.(data))
    this.socket.on(EVENTS.ROUND_END, (data) => this.onRoundEnd?.(data))
    this.socket.on(EVENTS.AI_ADD, (data) => this.onAIAdd?.(data))
  }

  get id() { return this.socket.id }

  createRoom(name, singlePlayer = false) {
    this._pendingSinglePlayer = singlePlayer
    this._pendingName = name
    this.socket.emit(EVENTS.ROOM_CREATE, { name })
  }

  joinRoom(name, code) {
    this.socket.emit(EVENTS.ROOM_JOIN, { name, code: code.toUpperCase() })
  }

  leaveRoom() {
    this.socket.emit(EVENTS.ROOM_LEAVE)
  }

  startGame(singlePlayer = false, aiCount = 3) {
    this.socket.emit(EVENTS.GAME_START, { singlePlayer, aiCount })
  }

  sendMove(dir, yaw, dt) {
    this.socket.emit(EVENTS.PLAYER_MOVE, { dir, yaw, dt })
  }

  sendDisguise(propType) {
    this.socket.emit(EVENTS.PROP_DISGUISE, { propType })
  }

  sendShoot(origin, direction) {
    this.socket.emit(EVENTS.HUNTER_SHOOT, { origin, direction })
  }

  setReady(ready) {
    this.socket.emit(EVENTS.PLAYER_READY, { ready })
  }

  setRole(role) {
    this.myRole = role
    this.socket.emit('player:setRole', { role })
  }
}
