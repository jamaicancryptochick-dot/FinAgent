export class MenuScreen {
  constructor(net) {
    this.net = net
    this.el = document.getElementById('screen-menu')
    this.nameInput = document.getElementById('menu-name')
    this.errorEl = document.getElementById('menu-error')
    this.joinCodeInput = document.getElementById('join-code')

    document.getElementById('btn-singleplayer').addEventListener('click', () => {
      const name = this._name()
      if (!name) return this.showError('Enter your name first')
      this.onSinglePlayer?.(name)
    })

    document.getElementById('btn-create').addEventListener('click', () => {
      const name = this._name()
      if (!name) return this.showError('Enter your name first')
      this.onCreateRoom?.(name)
    })

    document.getElementById('btn-join').addEventListener('click', () => {
      const name = this._name()
      const code = this.joinCodeInput.value.trim().toUpperCase()
      if (!name) return this.showError('Enter your name first')
      if (code.length !== 6) return this.showError('Enter a 6-character room code')
      this.onJoinRoom?.(name, code)
    })

    // Auto-uppercase code input
    this.joinCodeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase()
    })
  }

  _name() {
    return this.nameInput.value.trim().slice(0, 16)
  }

  show() {
    this.el.classList.remove('hidden')
    this.errorEl.textContent = ''
  }

  hide() {
    this.el.classList.add('hidden')
  }

  showError(msg) {
    this.errorEl.textContent = msg
    setTimeout(() => { this.errorEl.textContent = '' }, 4000)
  }

  onCreateRoom = null
  onJoinRoom = null
  onSinglePlayer = null
}
