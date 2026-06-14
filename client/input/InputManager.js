import { DesktopControls } from './DesktopControls.js'
import { MobileControls } from './MobileControls.js'

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas
    this.move = { x: 0, y: 0 }   // -1..1, x=strafe, y=forward
    this.look = { x: 0, y: 0 }   // accumulated yaw/pitch delta
    this.shoot = false

    this.isMobile = window.matchMedia('(pointer: coarse)').matches

    if (this.isMobile) {
      this.controls = new MobileControls(canvas, this)
    } else {
      this.controls = new DesktopControls(canvas, this)
    }
  }

  // Call each frame; returns accumulated look delta and resets it
  consumeLook() {
    const l = { x: this.look.x, y: this.look.y }
    this.look.x = 0; this.look.y = 0
    return l
  }

  consumeShoot() {
    const s = this.shoot
    this.shoot = false
    return s
  }

  destroy() {
    this.controls.destroy()
  }
}
