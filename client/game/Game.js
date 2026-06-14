import * as THREE from 'three'
import { Renderer } from './Renderer.js'
import { World } from './World.js'
import { PlayerManager } from './PlayerManager.js'
import { HUD } from './HUD.js'
import { InputManager } from '../input/InputManager.js'
import { GAME_PHASES, ROLES, PLAYER_HEIGHT } from '../../shared/constants.js'

export class Game {
  constructor(canvas, net, roomData) {
    this.canvas = canvas
    this.net = net
    this.roomData = roomData

    this.myId = net.id
    this.myRole = net.myRole || ROLES.PROP
    this.phase = GAME_PHASES.WAITING
    this.eliminated = false

    this.yaw = 0
    this.pitch = 0
    this.pos = new THREE.Vector3(0, PLAYER_HEIGHT, 0)

    this._raf = null
    this._lastTime = 0

    this.onReturnToLobby = null
  }

  init() {
    this.renderer = new Renderer(this.canvas)
    this.world = new World(this.renderer.scene)
    this.playerManager = new PlayerManager(this.renderer.scene, this.world)
    this.hud = new HUD()
    this.input = new InputManager(this.canvas)

    // Set initial role from room data
    const me = this.roomData?.players?.find(p => p.id === this.myId)
    if (me) { this.myRole = me.role; this.net.myRole = me.role }

    this.hud.setRole(this.myRole)
    this.hud.showMobileControls(this.input.isMobile)

    // Add other players already in room
    for (const p of this.roomData?.players || []) {
      if (p.id !== this.myId) {
        this.playerManager.addPlayer(p.id, p)
      }
    }

    this._bindNetEvents()
    this._bindHUDEvents()

    // If server immediately sends phase (single-player start)
    if (this.roomData?.phase && this.roomData.phase !== GAME_PHASES.WAITING) {
      this.hud.setPhase(this.roomData.phase)
      this.phase = this.roomData.phase
    }

    this._raf = requestAnimationFrame(this._loop.bind(this))
  }

  _bindNetEvents() {
    const net = this.net

    net.onRoomUpdate = (data) => {
      // Handle players joining/leaving during game
      const currentIds = new Set(data.players.map(p => p.id))
      for (const id of this.playerManager.players.keys()) {
        if (!currentIds.has(id)) this.playerManager.removePlayer(id)
      }
      for (const p of data.players) {
        if (p.id !== this.myId && !this.playerManager.players.has(p.id)) {
          this.playerManager.addPlayer(p.id, p)
        }
      }
    }

    net.onPlayerState = (state) => {
      if (state.id === this.myId) {
        // Server reconciliation
        this.pos.x = state.x; this.pos.y = state.y + PLAYER_HEIGHT / 2; this.pos.z = state.z
      } else {
        if (!this.playerManager.players.has(state.id)) {
          this.playerManager.addPlayer(state.id, { ...state, name: state.name || state.id.slice(0,6), role: ROLES.PROP })
        }
        this.playerManager.updateState(state.id, state)
      }
    }

    net.onPlayerLeft = ({ id }) => this.playerManager.removePlayer(id)

    net.onPropDisguise = ({ id, propType }) => {
      if (id === this.myId) {
        this._applyMyDisguise(propType)
      } else {
        this.playerManager.applyDisguise(id, propType, this.world)
      }
    }

    net.onPlayerEliminated = ({ id, name, killedBy }) => {
      this.playerManager.eliminatePlayer(id)
      this.hud.addKillFeed(`🔫 ${killedBy} found ${name}!`)
      if (id === this.myId) {
        this.eliminated = true
        this.hud.showEliminated()
      }
    }

    net.onPhaseChange = ({ phase, timeLeft }) => {
      this.phase = phase
      this.hud.setPhase(phase)
      if (timeLeft !== undefined) this.hud.setTimer(timeLeft)
      // Re-read role in case server assigned it
      const myRole = this.net.myRole || this.myRole
      this.myRole = myRole
      this.hud.setRole(myRole)
    }

    net.onTimerTick = ({ timeLeft }) => this.hud.setTimer(timeLeft)

    net.onRoundEnd = ({ winner }) => {
      this.hud.showResults(winner)
    }

    net.onAIAdd = (data) => {
      if (!this.playerManager.players.has(data.id)) {
        this.playerManager.addPlayer(data.id, data)
      }
    }
  }

  _bindHUDEvents() {
    this.hud.onDisguise = (propType) => {
      if (this.myRole !== ROLES.PROP || this.eliminated) return
      this.net.sendDisguise(propType)
      this._applyMyDisguise(propType)
    }

    this.hud.onResultsBack = () => {
      this.hud.hideResults()
      this.onReturnToLobby?.({})
    }
  }

  _applyMyDisguise(propType) {
    // In first-person we don't see our own body, but update for third-person spectators
    this._myPropType = propType
  }

  _loop(now) {
    this._raf = requestAnimationFrame(this._loop.bind(this))
    const dt = Math.min((now - this._lastTime) / 1000, 0.1)
    this._lastTime = now

    this.input.controls.update?.()

    const look = this.input.consumeLook()
    this.yaw -= look.x
    this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch - look.y))

    const shouldMove = !this.eliminated && (
      this.phase === GAME_PHASES.HIDE ||
      (this.phase === GAME_PHASES.HUNT)
    )
    const frozenAsHunter = this.phase === GAME_PHASES.HIDE && this.myRole === ROLES.HUNTER

    if (shouldMove && !frozenAsHunter) {
      const move = this.input.move
      if (move.x !== 0 || move.y !== 0) {
        this.net.sendMove({ x: move.x, y: move.y }, this.yaw, dt)
        // Local prediction
        const speed = 5 * dt
        this.pos.x += (Math.sin(this.yaw) * move.y + Math.cos(this.yaw) * move.x) * speed
        this.pos.z += (Math.cos(this.yaw) * move.y - Math.sin(this.yaw) * move.x) * speed
      }
    }

    // Shoot
    if (this.input.consumeShoot() && this.myRole === ROLES.HUNTER && !this.eliminated && this.phase === GAME_PHASES.HUNT) {
      const cam = this.renderer.camera
      const dir = new THREE.Vector3()
      cam.getWorldDirection(dir)
      this.net.sendShoot(
        { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        { x: dir.x, y: dir.y, z: dir.z }
      )
    }

    // Update camera to follow local player (first-person)
    const cam = this.renderer.camera
    cam.position.copy(this.pos)
    cam.position.y = PLAYER_HEIGHT
    cam.rotation.order = 'YXZ'
    cam.rotation.y = this.yaw
    cam.rotation.x = this.pitch

    // Make name labels always face camera
    for (const p of this.playerManager.players.values()) {
      if (p.label) p.label.lookAt(cam.position)
    }

    this.playerManager.tick(dt)
    this.renderer.render()
  }

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this.input.destroy()
    this.renderer.destroy()

    // Reset net callbacks
    const net = this.net
    net.onRoomUpdate = null
    net.onPlayerState = null
    net.onPlayerLeft = null
    net.onPropDisguise = null
    net.onPlayerEliminated = null
    net.onPhaseChange = null
    net.onTimerTick = null
    net.onRoundEnd = null
    net.onAIAdd = null
  }
}
