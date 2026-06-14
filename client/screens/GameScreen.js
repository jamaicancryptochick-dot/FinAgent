import { Game } from '../game/Game.js'

export class GameScreen {
  constructor(net) {
    this.net = net
    this.game = null
  }

  start(roomData) {
    const canvas = document.getElementById('game-canvas')
    const hud = document.getElementById('hud')
    canvas.classList.remove('hidden')
    hud.classList.remove('hidden')

    if (this.game) this.game.destroy()
    this.game = new Game(canvas, this.net, roomData)
    this.game.onReturnToLobby = (data) => {
      this.stop()
      this.net.onReturnToLobby?.(data)
    }
    this.game.init()
  }

  stop() {
    if (this.game) {
      this.game.destroy()
      this.game = null
    }
    document.getElementById('game-canvas').classList.add('hidden')
    document.getElementById('hud').classList.add('hidden')
    document.getElementById('results-overlay').classList.add('hidden')
  }
}
