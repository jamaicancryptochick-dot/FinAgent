import * as THREE from 'three'

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor(0x1a1a2e)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.Fog(0x1a1a2e, 15, 40)

    this.camera = new THREE.PerspectiveCamera(75, this._aspect(), 0.1, 100)
    this.camera.position.set(0, 1.5, 0)

    this._onResize = this._onResize.bind(this)
    window.addEventListener('resize', this._onResize)
    this._onResize()
  }

  _aspect() {
    return this.canvas.clientWidth / this.canvas.clientHeight
  }

  _onResize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    window.removeEventListener('resize', this._onResize)
    this.renderer.dispose()
  }
}
