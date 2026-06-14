import { ROLES, MAP_BOUNDS, PLAYER_HEIGHT, PLAYER_SPEED } from '../shared/constants.js'

export class AIPlayer {
  constructor(id, name, role, spawn) {
    this.id = id
    this.name = name
    this.role = role
    this.x = spawn.x
    this.y = PLAYER_HEIGHT / 2
    this.z = spawn.z
    this.yaw = 0
    this.isAI = true
    this.eliminated = false
    this.propType = null
    this._target = null
    this._wanderTimer = 0
  }

  tick(dt, players) {
    if (this.role === ROLES.HUNTER) this._hunterTick(dt, players)
    else this._propTick(dt)
  }

  _hunterTick(dt, players) {
    // Find nearest non-eliminated prop
    let nearest = null, nearestDist = Infinity
    for (const p of players.values()) {
      if (p.role !== ROLES.PROP || p.eliminated) continue
      const dx = p.x - this.x, dz = p.z - this.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < nearestDist) { nearestDist = dist; nearest = p }
    }

    if (nearest && nearestDist < 15) {
      // Chase
      const dx = nearest.x - this.x, dz = nearest.z - this.z
      this.yaw = Math.atan2(dx, dz)
    } else {
      // Wander
      this._wanderTimer -= dt
      if (this._wanderTimer <= 0) {
        this.yaw = Math.random() * Math.PI * 2
        this._wanderTimer = 2 + Math.random() * 3
      }
    }

    const speed = PLAYER_SPEED * 0.6 * dt
    this.x += Math.sin(this.yaw) * speed
    this.z += Math.cos(this.yaw) * speed
    this.x = Math.max(-MAP_BOUNDS.x, Math.min(MAP_BOUNDS.x, this.x))
    this.z = Math.max(-MAP_BOUNDS.z, Math.min(MAP_BOUNDS.z, this.z))
  }

  _propTick(dt) {
    this._wanderTimer -= dt
    if (this._wanderTimer <= 0) {
      this.yaw = Math.random() * Math.PI * 2
      this._wanderTimer = 3 + Math.random() * 5
    }
    const speed = PLAYER_SPEED * 0.3 * dt
    this.x += Math.sin(this.yaw) * speed
    this.z += Math.cos(this.yaw) * speed
    this.x = Math.max(-MAP_BOUNDS.x, Math.min(MAP_BOUNDS.x, this.x))
    this.z = Math.max(-MAP_BOUNDS.z, Math.min(MAP_BOUNDS.z, this.z))
  }
}
