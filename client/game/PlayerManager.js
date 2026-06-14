import * as THREE from 'three'
import { ROLES, PROP_TYPES } from '../../shared/constants.js'

const CAPSULE_MAT = {
  [ROLES.PROP]:    new THREE.MeshLambertMaterial({ color: 0x4ade80 }),
  [ROLES.HUNTER]:  new THREE.MeshLambertMaterial({ color: 0xf87171 }),
  spectator:        new THREE.MeshLambertMaterial({ color: 0x888888 }),
}

export class PlayerManager {
  constructor(scene, world) {
    this.scene = scene
    this.world = world
    this.players = new Map() // id -> { mesh, label, role, propType, ... }
  }

  addPlayer(id, data) {
    const group = new THREE.Group()
    group.position.set(data.x ?? 0, data.y ?? 0.85, data.z ?? 0)

    // Body (capsule approximation with cylinder + spheres)
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12)
    const mat = CAPSULE_MAT[data.role] || CAPSULE_MAT.spectator
    const body = new THREE.Mesh(bodyGeo, mat)
    body.position.y = 0.6
    body.castShadow = true

    const headGeo = new THREE.SphereGeometry(0.3, 12, 12)
    const head = new THREE.Mesh(headGeo, mat)
    head.position.y = 1.5
    head.castShadow = true

    // Direction indicator (nose)
    const noseGeo = new THREE.ConeGeometry(0.08, 0.3, 8)
    const noseMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
    const nose = new THREE.Mesh(noseGeo, noseMat)
    nose.rotation.x = Math.PI / 2
    nose.position.set(0, 1.5, 0.35)

    group.add(body, head, nose)

    // Name label (canvas texture)
    const label = this._makeLabel(data.name || id.slice(0, 6))
    label.position.y = 2.1
    group.add(label)

    this.scene.add(group)
    this.players.set(id, {
      group, body, head, label,
      role: data.role,
      propType: null,
      propMesh: null,
      capsuleParts: [body, head, nose],
      x: data.x ?? 0, y: data.y ?? 0, z: data.z ?? 0,
      yaw: data.yaw ?? 0,
      targetX: data.x ?? 0, targetY: data.y ?? 0, targetZ: data.z ?? 0,
      targetYaw: data.yaw ?? 0,
    })
  }

  updateState(id, state) {
    const p = this.players.get(id)
    if (!p) return
    p.targetX = state.x; p.targetY = state.y; p.targetZ = state.z
    p.targetYaw = state.yaw
  }

  applyDisguise(id, propType, world) {
    const p = this.players.get(id)
    if (!p) return

    // Remove old prop mesh
    if (p.propMesh) { p.group.remove(p.propMesh); p.propMesh.geometry.dispose() }

    // Hide capsule
    p.capsuleParts.forEach(m => m.visible = false)

    // Add prop mesh
    const mesh = world.buildPropMesh(propType)
    if (mesh) {
      const def = PROP_TYPES[propType]
      mesh.position.y = 0 // group is already at ground level + half height
      p.group.add(mesh)
      p.propMesh = mesh
    }

    p.propType = propType
  }

  removeDisguise(id) {
    const p = this.players.get(id)
    if (!p) return
    if (p.propMesh) { p.group.remove(p.propMesh); p.propMesh = null }
    p.capsuleParts.forEach(m => m.visible = true)
    p.propType = null
  }

  eliminatePlayer(id) {
    const p = this.players.get(id)
    if (!p) return
    // Turn grey and translucent
    const ghostMat = new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 0.3 })
    p.capsuleParts.forEach(m => m.material = ghostMat)
    if (p.propMesh) p.propMesh.material = ghostMat
  }

  removePlayer(id) {
    const p = this.players.get(id)
    if (!p) return
    this.scene.remove(p.group)
    this.players.delete(id)
  }

  tick(dt) {
    for (const p of this.players.values()) {
      // Smooth interpolation of remote positions
      const alpha = Math.min(1, dt * 15)
      p.group.position.x += (p.targetX - p.group.position.x) * alpha
      p.group.position.y += (p.targetY - p.group.position.y) * alpha
      p.group.position.z += (p.targetZ - p.group.position.z) * alpha

      // Yaw interpolation (shortest path)
      let dyaw = p.targetYaw - p.group.rotation.y
      while (dyaw > Math.PI) dyaw -= Math.PI * 2
      while (dyaw < -Math.PI) dyaw += Math.PI * 2
      p.group.rotation.y += dyaw * alpha
    }
  }

  _makeLabel(name) {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.roundRect(4, 4, 248, 56, 12)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, 128, 34)

    const tex = new THREE.CanvasTexture(canvas)
    const geo = new THREE.PlaneGeometry(1, 0.25)
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false })
    const sprite = new THREE.Mesh(geo, mat)
    sprite.renderOrder = 999
    return sprite
  }
}
