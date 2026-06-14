import nipplejs from 'nipplejs'

export class MobileControls {
  constructor(canvas, input) {
    this.canvas = canvas
    this.input = input

    // Show mobile zones
    const joystickZone = document.getElementById('joystick-zone')
    const cameraZone = document.getElementById('camera-zone')
    joystickZone.style.display = 'block'
    cameraZone.style.display = 'block'

    // Left joystick for movement
    this.joystick = nipplejs.create({
      zone: joystickZone,
      mode: 'dynamic',
      color: 'rgba(255,255,255,0.4)',
      fadeTime: 150,
    })

    this.joystick.on('move', (evt, data) => {
      const angle = data.angle.radian
      const force = Math.min(data.force, 1)
      // nipplejs angle: 0=right, PI/2=up — convert to game: x=strafe, y=forward
      this.input.move.x = Math.cos(angle) * force
      this.input.move.y = -Math.sin(angle) * force
    })

    this.joystick.on('end', () => {
      this.input.move.x = 0; this.input.move.y = 0
    })

    // Right side: camera drag
    this._camPtrId = null
    this._camLastX = 0
    this._camLastY = 0

    this._onPtrDown = (e) => {
      if (e.target.closest('#joystick-zone')) return
      if (this._camPtrId !== null) return
      this._camPtrId = e.pointerId
      this._camLastX = e.clientX
      this._camLastY = e.clientY
      cameraZone.setPointerCapture(e.pointerId)
    }

    this._onPtrMove = (e) => {
      if (e.pointerId !== this._camPtrId) return
      const dx = e.clientX - this._camLastX
      const dy = e.clientY - this._camLastY
      this._camLastX = e.clientX
      this._camLastY = e.clientY
      this.input.look.x += dx * 0.005
      this.input.look.y += dy * 0.003
    }

    this._onPtrUp = (e) => {
      if (e.pointerId === this._camPtrId) this._camPtrId = null
    }

    cameraZone.addEventListener('pointerdown', this._onPtrDown)
    cameraZone.addEventListener('pointermove', this._onPtrMove)
    cameraZone.addEventListener('pointerup', this._onPtrUp)
    cameraZone.addEventListener('pointercancel', this._onPtrUp)

    // Shoot button
    const shootBtn = document.getElementById('shoot-btn')
    shootBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation()
      this.input.shoot = true
    })

    this._cameraZone = cameraZone
    this._joystickZone = joystickZone
  }

  update() {
    // Move is handled by joystick events, nothing to poll
  }

  destroy() {
    this.joystick.destroy()
    this._cameraZone.removeEventListener('pointerdown', this._onPtrDown)
    this._cameraZone.removeEventListener('pointermove', this._onPtrMove)
    this._cameraZone.removeEventListener('pointerup', this._onPtrUp)
    this._cameraZone.removeEventListener('pointercancel', this._onPtrUp)
    this._joystickZone.style.display = 'none'
    this._cameraZone.style.display = 'none'
  }
}
