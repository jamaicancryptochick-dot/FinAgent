import { EVENTS, GAME_PHASES, ROLES, ROUND_TIMES, PROP_TYPES, MAX_PLAYERS, MIN_PLAYERS_TO_START, PLAYER_SPEED, MAP_BOUNDS, PLAYER_HEIGHT } from '../shared/constants.js'
import { AIPlayer } from './AIPlayer.js'

export class GameRoom {
  constructor(io, code) {
    this.io = io
    this.code = code
    this.players = new Map()   // socketId -> playerData
    this.phase = GAME_PHASES.WAITING
    this.gameStarted = false
    this.timer = null
    this.timeLeft = 0
    this.aiPlayers = new Map()
    this.aiIdCounter = 0
  }

  addPlayer(socket, name) {
    const player = {
      id: socket.id,
      name: name || `Player${this.players.size + 1}`,
      role: ROLES.PROP,
      ready: false,
      x: 0, y: PLAYER_HEIGHT / 2, z: 0,
      yaw: 0,
      propType: null,
      eliminated: false,
      isAI: false,
    }
    this.players.set(socket.id, player)
    this._broadcastRoomUpdate()
  }

  removePlayer(id) {
    this.players.delete(id)
    if (this.gameStarted) this._checkRoundEnd()
    this._broadcastRoomUpdate()
  }

  hasPlayer(id) { return this.players.has(id) }
  isEmpty() { return this.players.size === 0 && this.aiPlayers.size === 0 }
  isFull() { return this.players.size >= MAX_PLAYERS }

  setReady(socketId, ready) {
    const p = this.players.get(socketId)
    if (p) { p.ready = ready; this._broadcastRoomUpdate() }
  }

  setRole(socketId, role) {
    const p = this.players.get(socketId)
    if (p && !this.gameStarted) { p.role = role; this._broadcastRoomUpdate() }
  }

  startGame() {
    if (this.players.size < MIN_PLAYERS_TO_START) return false
    this.gameStarted = true
    // Assign spawn positions
    const spawns = this._generateSpawns()
    let i = 0
    for (const p of this.players.values()) {
      const s = spawns[i % spawns.length]; i++
      p.x = s.x; p.z = s.z; p.y = PLAYER_HEIGHT / 2
      p.eliminated = false
    }
    this._startPhase(GAME_PHASES.HIDE)
    return true
  }

  startSinglePlayer(playerSocket, aiCount = 3) {
    this.gameStarted = true
    const p = this.players.get(playerSocket.id)
    if (p) { p.role = ROLES.PROP; p.x = 0; p.y = PLAYER_HEIGHT / 2; p.z = 0 }

    for (let i = 0; i < aiCount; i++) {
      const aiId = `ai_${this.code}_${++this.aiIdCounter}`
      const spawn = { x: (Math.random() - 0.5) * MAP_BOUNDS.x, z: (Math.random() - 0.5) * MAP_BOUNDS.z }
      const ai = new AIPlayer(aiId, `Hunter${i + 1}`, ROLES.HUNTER, spawn)
      this.aiPlayers.set(aiId, ai)
    }
    this._broadcastAIState()
    this._startPhase(GAME_PHASES.HIDE)
  }

  handleMove(socketId, dir, yaw, dt) {
    const p = this.players.get(socketId)
    if (!p || p.eliminated || this.phase === GAME_PHASES.WAITING) return
    if (this.phase === GAME_PHASES.HIDE && p.role === ROLES.HUNTER) return

    const speed = PLAYER_SPEED * dt
    p.x += Math.sin(yaw) * dir.y * speed + Math.cos(yaw) * dir.x * speed
    p.z += Math.cos(yaw) * dir.y * speed - Math.sin(yaw) * dir.x * speed
    p.x = Math.max(-MAP_BOUNDS.x, Math.min(MAP_BOUNDS.x, p.x))
    p.z = Math.max(-MAP_BOUNDS.z, Math.min(MAP_BOUNDS.z, p.z))
    p.yaw = yaw

    this.io.to(this.code).emit(EVENTS.PLAYER_STATE, {
      id: socketId, x: p.x, y: p.y, z: p.z, yaw: p.yaw,
    })
  }

  handleDisguise(socketId, propType) {
    const p = this.players.get(socketId)
    if (!p || p.role !== ROLES.PROP || !PROP_TYPES[propType]) return
    p.propType = propType
    this.io.to(this.code).emit(EVENTS.PROP_DISGUISE, { id: socketId, propType })
  }

  handleShoot(socketId, origin, direction) {
    const shooter = this.players.get(socketId)
    if (!shooter || shooter.role !== ROLES.HUNTER || this.phase !== GAME_PHASES.HUNT) return

    // Server-side raycast against prop players
    let hit = null
    let minDist = Infinity

    for (const p of this.players.values()) {
      if (p.role !== ROLES.PROP || p.eliminated || p.id === socketId) continue
      const dist = this._raycastAABB(origin, direction, p)
      if (dist !== null && dist < minDist) { minDist = dist; hit = p }
    }

    if (hit) {
      hit.eliminated = true
      this.io.to(this.code).emit(EVENTS.PLAYER_ELIMINATED, {
        id: hit.id, name: hit.name, killedBy: shooter.name,
      })
      this._checkRoundEnd()
    }
  }

  _raycastAABB(origin, dir, player) {
    const pt = PROP_TYPES[player.propType]
    const hs = pt ? [pt.size[0] / 2, pt.size[1] / 2, pt.size[2] / 2] : [0.4, 0.85, 0.4]
    const min = { x: player.x - hs[0], y: player.y - hs[1], z: player.z - hs[2] }
    const max = { x: player.x + hs[0], y: player.y + hs[1], z: player.z + hs[2] }

    let tmin = -Infinity, tmax = Infinity
    for (const axis of ['x', 'y', 'z']) {
      if (Math.abs(dir[axis]) < 1e-6) {
        if (origin[axis] < min[axis] || origin[axis] > max[axis]) return null
      } else {
        const t1 = (min[axis] - origin[axis]) / dir[axis]
        const t2 = (max[axis] - origin[axis]) / dir[axis]
        tmin = Math.max(tmin, Math.min(t1, t2))
        tmax = Math.min(tmax, Math.max(t1, t2))
      }
    }
    return tmax >= tmin && tmin >= 0 ? tmin : null
  }

  _startPhase(phase) {
    this.phase = phase
    clearInterval(this.timer)

    const duration = phase === GAME_PHASES.HIDE ? ROUND_TIMES.HIDE
                   : phase === GAME_PHASES.HUNT ? ROUND_TIMES.HUNT
                   : ROUND_TIMES.RESULTS

    this.timeLeft = duration
    this.io.to(this.code).emit(EVENTS.PHASE_CHANGE, { phase, timeLeft: this.timeLeft })

    this.timer = setInterval(() => {
      this.timeLeft--
      this.io.to(this.code).emit(EVENTS.TIMER_TICK, { timeLeft: this.timeLeft })

      if (this.timeLeft <= 0) {
        clearInterval(this.timer)
        if (phase === GAME_PHASES.HIDE) {
          this._startPhase(GAME_PHASES.HUNT)
        } else if (phase === GAME_PHASES.HUNT) {
          this._endRound('hunters')
        } else {
          this._resetToLobby()
        }
      }
    }, 1000)

    // Start AI tick if in hunt phase
    if (phase === GAME_PHASES.HUNT) this._startAITick()
  }

  _startAITick() {
    this._aiTick = setInterval(() => {
      for (const ai of this.aiPlayers.values()) {
        ai.tick(0.1, this.players)
        this.io.to(this.code).emit(EVENTS.PLAYER_STATE, {
          id: ai.id, x: ai.x, y: ai.y, z: ai.z, yaw: ai.yaw, isAI: true,
        })
      }
    }, 100)
  }

  _checkRoundEnd() {
    if (this.phase !== GAME_PHASES.HUNT) return
    const props = [...this.players.values()].filter(p => p.role === ROLES.PROP)
    const alive = props.filter(p => !p.eliminated)
    if (alive.length === 0) this._endRound('hunters')

    const hunters = [...this.players.values()].filter(p => p.role === ROLES.HUNTER)
    if (hunters.length === 0) this._endRound('props')
  }

  _endRound(winner) {
    clearInterval(this.timer)
    clearInterval(this._aiTick)
    this.io.to(this.code).emit(EVENTS.ROUND_END, { winner })
    this._startPhase(GAME_PHASES.RESULTS)
  }

  _resetToLobby() {
    clearInterval(this.timer)
    clearInterval(this._aiTick)
    this.gameStarted = false
    this.phase = GAME_PHASES.WAITING
    this.aiPlayers.clear()
    for (const p of this.players.values()) {
      p.ready = false; p.eliminated = false; p.propType = null
    }
    this._broadcastRoomUpdate()
  }

  _broadcastRoomUpdate() {
    this.io.to(this.code).emit(EVENTS.ROOM_UPDATE, {
      code: this.code,
      phase: this.phase,
      players: [...this.players.values()].map(p => ({
        id: p.id, name: p.name, role: p.role, ready: p.ready,
      })),
    })
  }

  _broadcastAIState() {
    for (const ai of this.aiPlayers.values()) {
      this.io.to(this.code).emit(EVENTS.AI_ADD, {
        id: ai.id, name: ai.name, role: ai.role,
        x: ai.x, y: ai.y, z: ai.z, yaw: ai.yaw,
      })
    }
  }

  _generateSpawns() {
    const spawns = []
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const angle = (i / MAX_PLAYERS) * Math.PI * 2
      spawns.push({ x: Math.cos(angle) * 5, z: Math.sin(angle) * 5 })
    }
    return spawns
  }

  destroy() {
    clearInterval(this.timer)
    clearInterval(this._aiTick)
  }
}
