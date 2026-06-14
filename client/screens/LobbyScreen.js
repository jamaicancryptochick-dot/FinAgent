import { EVENTS } from '../../shared/constants.js'

export class LobbyScreen {
  constructor(net) {
    this.net = net
    this.el = document.getElementById('screen-lobby')
    this.codeDisplay = document.getElementById('lobby-code-display')
    this.playerList = document.getElementById('lobby-player-list')
    this.errorEl = document.getElementById('lobby-error')
    this.currentRole = 'prop'
    this._roomData = null

    document.getElementById('btn-role-prop').addEventListener('click', () => this._setRole('prop'))
    document.getElementById('btn-role-hunter').addEventListener('click', () => this._setRole('hunter'))

    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.onStartGame?.(false)
    })

    document.getElementById('btn-leave-lobby').addEventListener('click', () => {
      this.onLeave?.()
    })

    // Listen for room updates while in lobby
    net.onRoomUpdate = (data) => {
      if (!this.el.classList.contains('hidden')) this.show(data)
    }
  }

  _setRole(role) {
    this.currentRole = role
    document.getElementById('btn-role-prop').classList.toggle('active', role === 'prop')
    document.getElementById('btn-role-hunter').classList.toggle('active', role === 'hunter')
    this.net.setRole(role)
  }

  show(data) {
    this._roomData = data
    this.el.classList.remove('hidden')
    this.codeDisplay.textContent = data.code || '------'

    this.playerList.innerHTML = ''
    for (const p of data.players || []) {
      const row = document.createElement('div')
      row.className = 'player-row'
      row.innerHTML = `
        <span>${p.name}${p.id === this.net.id ? ' (you)' : ''}</span>
        <span class="role-badge ${p.role}">${p.role}</span>
      `
      this.playerList.appendChild(row)
    }
  }

  hide() {
    this.el.classList.add('hidden')
  }

  onStartGame = null
  onLeave = null
}
