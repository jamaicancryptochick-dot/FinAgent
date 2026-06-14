export class DesktopControls {
  constructor(canvas, input) {
    this.canvas = canvas
    this.input = input
    this.keys = {}
    this.locked = false

    this._onKey = (e) => {
      this.keys[e.code] = e.type === 'keydown'
      if (e.code === 'Escape') document.exitPointerLock?.()
    }

    this._onMouseMove = (e) => {
      if (!this.locked) return
      this.input.look.x += e.movementX * 0.002
      this.input.look.y += e.movementY * 0.002
    }

    this._onClick = (e) => {
      if (!this.locked) {
        canvas.requestPointerLock()
      } else {
        this.input.shoot = true
      }
    }

    this._onLockChange = () => {
      this.locked = document.pointerLockElement === canvas
    }

    document.addEventListener('keydown', this._onKey)
    document.addEventListener('keyup', this._onKey)
    document.addEventListener('mousemove', this._onMouseMove)
    canvas.addEventListener('click', this._onClick)
    document.addEventListener('pointerlockchange', this._onLockChange)
  }

  // Called each frame to update the move vector from WASD
  update() {
    const k = this.keys
    this.input.move.x = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)
    this.input.move.y = (k['KeyS'] || k['ArrowDown'] ? 1 : 0) - (k['KeyW'] || k['ArrowUp'] ? 1 : 0)

    // Normalize diagonal
    const len = Math.sqrt(this.input.move.x ** 2 + this.input.move.y ** 2)
    if (len > 1) { this.input.move.x /= len; this.input.move.y /= len }
  }

  destroy() {
    document.removeEventListener('keydown', this._onKey)
    document.removeEventListener('keyup', this._onKey)
    document.removeEventListener('mousemove', this._onMouseMove)
    this.canvas.removeEventListener('click', this._onClick)
    document.removeEventListener('pointerlockchange', this._onLockChange)
    document.exitPointerLock?.()
  }
}
