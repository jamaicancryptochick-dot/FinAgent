import * as THREE from 'three'
import { PROP_TYPES } from '../../shared/constants.js'

const FLOOR_SIZE = 40
const WALL_H = 4
const ROOM_COLOR = 0x1a1a2e
const FLOOR_COLOR = 0x0d0d1a

export class World {
  constructor(scene) {
    this.scene = scene
    this.staticProps = [] // { mesh, aabb } for collision / disguise reference
    this._build()
  }

  _build() {
    this._addLighting()
    this._addFloor()
    this._addWalls()
    this._addCeiling()
    this._addStaticProps()
    this._addDecor()
  }

  _addLighting() {
    const ambient = new THREE.AmbientLight(0x404060, 1.5)
    this.scene.add(ambient)

    const sunLight = new THREE.DirectionalLight(0xffeedd, 2)
    sunLight.position.set(5, 10, 5)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 60
    sunLight.shadow.camera.left = -25
    sunLight.shadow.camera.right = 25
    sunLight.shadow.camera.top = 25
    sunLight.shadow.camera.bottom = -25
    this.scene.add(sunLight)

    // Accent point lights
    const colors = [0xff6b35, 0xa855f7, 0x22d3ee]
    const positions = [[-8, 3, -8], [8, 3, 8], [0, 3, -10]]
    colors.forEach((c, i) => {
      const light = new THREE.PointLight(c, 1.5, 12)
      light.position.set(...positions[i])
      this.scene.add(light)
    })
  }

  _addFloor() {
    const geo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE, 20, 20)
    const mat = new THREE.MeshLambertMaterial({ color: FLOOR_COLOR })
    const floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    // Grid overlay
    const grid = new THREE.GridHelper(FLOOR_SIZE, 40, 0x333366, 0x222244)
    grid.position.y = 0.01
    this.scene.add(grid)
  }

  _addWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: ROOM_COLOR })
    const walls = [
      { pos: [0, WALL_H/2, -FLOOR_SIZE/2], rot: [0,0,0], w: FLOOR_SIZE, h: WALL_H },
      { pos: [0, WALL_H/2,  FLOOR_SIZE/2], rot: [0, Math.PI, 0], w: FLOOR_SIZE, h: WALL_H },
      { pos: [-FLOOR_SIZE/2, WALL_H/2, 0], rot: [0, Math.PI/2, 0], w: FLOOR_SIZE, h: WALL_H },
      { pos: [ FLOOR_SIZE/2, WALL_H/2, 0], rot: [0, -Math.PI/2, 0], w: FLOOR_SIZE, h: WALL_H },
    ]
    walls.forEach(({ pos, rot, w, h }) => {
      const geo = new THREE.PlaneGeometry(w, h)
      const mesh = new THREE.Mesh(geo, wallMat)
      mesh.position.set(...pos)
      mesh.rotation.set(...rot)
      mesh.receiveShadow = true
      this.scene.add(mesh)
    })

    // Inner room dividers
    this._addWallSegment([-5, WALL_H/2, 0], [0,0,0], 8, WALL_H, wallMat)
    this._addWallSegment([5, WALL_H/2, 5], [0, Math.PI/2, 0], 6, WALL_H, wallMat)
  }

  _addWallSegment(pos, rot, w, h, mat) {
    const geo = new THREE.BoxGeometry(w, h, 0.2)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...pos)
    mesh.rotation.set(...rot)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
  }

  _addCeiling() {
    const geo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE)
    const mat = new THREE.MeshLambertMaterial({ color: 0x111122, side: THREE.BackSide })
    const ceiling = new THREE.Mesh(geo, mat)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = WALL_H
    this.scene.add(ceiling)
  }

  _addStaticProps() {
    // Place disguisable props around the scene
    const placements = [
      { type: 'crate',    pos: [3, 0, -5],   rot: 0.3 },
      { type: 'crate',    pos: [-4, 0, 3],   rot: -0.5 },
      { type: 'barrel',   pos: [7, 0, -2],   rot: 0 },
      { type: 'barrel',   pos: [-7, 0, 6],   rot: 1.2 },
      { type: 'chair',    pos: [2, 0, 4],    rot: 0.8 },
      { type: 'chair',    pos: [-3, 0, -8],  rot: -0.2 },
      { type: 'lamp',     pos: [-9, 0, -9],  rot: 0 },
      { type: 'lamp',     pos: [9, 0, 9],    rot: 0 },
      { type: 'tv',       pos: [-1, 0.4, -9.5], rot: 0 },
      { type: 'trashcan', pos: [4, 0, 8],    rot: 0 },
      { type: 'plant',    pos: [-8, 0, 4],   rot: 0 },
      { type: 'sofa',     pos: [0, 0, 6],    rot: 0 },
    ]

    for (const { type, pos, rot } of placements) {
      const def = PROP_TYPES[type]
      const mesh = this._makePropMesh(type, def)
      mesh.position.set(pos[0], def.size[1] / 2, pos[2])
      mesh.rotation.y = rot
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.staticProps.push({ type, mesh, def })
    }
  }

  _makePropMesh(type, def) {
    let geo
    switch (type) {
      case 'barrel':
        geo = new THREE.CylinderGeometry(def.size[0]/2, def.size[0]/2, def.size[1], 12)
        break
      case 'lamp':
        geo = new THREE.CylinderGeometry(0.05, 0.1, def.size[1] * 0.8, 8)
        break
      case 'tv': {
        const g = new THREE.BoxGeometry(...def.size)
        const m = new THREE.Mesh(g, [
          new THREE.MeshLambertMaterial({ color: def.color }),
          new THREE.MeshLambertMaterial({ color: def.color }),
          new THREE.MeshLambertMaterial({ color: def.color }),
          new THREE.MeshLambertMaterial({ color: def.color }),
          new THREE.MeshLambertMaterial({ color: 0x111133, emissive: 0x223366, emissiveIntensity: 0.5 }),
          new THREE.MeshLambertMaterial({ color: def.color }),
        ])
        return m
      }
      case 'sofa':
        geo = new THREE.BoxGeometry(...def.size)
        break
      default:
        geo = new THREE.BoxGeometry(...def.size)
    }
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: def.color }))
  }

  // Public: build a prop mesh for disguising (same visuals as static version)
  buildPropMesh(type) {
    const def = PROP_TYPES[type]
    if (!def) return null
    const mesh = this._makePropMesh(type, def)
    mesh.castShadow = true
    return mesh
  }

  _addDecor() {
    // Scattered small boxes for visual interest
    for (let i = 0; i < 15; i++) {
      const size = 0.2 + Math.random() * 0.3
      const geo = new THREE.BoxGeometry(size, size, size)
      const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.3, 0.2) })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        (Math.random() - 0.5) * 30,
        size / 2,
        (Math.random() - 0.5) * 30
      )
      mesh.rotation.y = Math.random() * Math.PI
      mesh.castShadow = true
      this.scene.add(mesh)
    }
  }
}
