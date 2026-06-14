import { GAME_PHASES, PROP_TYPES } from '../../shared/constants.js'

export class HUD {
  constructor() {
    this.timerEl = document.getElementById('hud-timer')
    this.phaseEl = document.getElementById('hud-phase')
    this.roleEl = document.getElementById('hud-role')
    this.crosshairEl = document.getElementById('hud-crosshair')
    this.killFeedEl = document.getElementById('kill-feed')
    this.propPickerEl = document.getElementById('prop-picker')
    this.propPickerBtnEl = document.getElementById('prop-picker-btn')
    this.resultsEl = document.getElementById('results-overlay')
    this.resultsTitleEl = document.getElementById('results-title')
    this.resultsSubEl = document.getElementById('results-sub')
    this.phaseAnnounceEl = document.getElementById('phase-announce-text')
    this.eliminatedBannerEl = document.getElementById('eliminated-banner')

    this.onDisguise = null
    this.onResultsBack = null

    document.getElementById('btn-results-lobby').addEventListener('click', () => {
      this.onResultsBack?.()
    })

    this._buildPropPicker()

    this.propPickerBtnEl.addEventListener('click', () => {
      this.propPickerEl.classList.toggle('hidden')
    })
  }

  _buildPropPicker() {
    const icons = { crate:'📦', barrel:'🛢️', chair:'🪑', lamp:'💡', tv:'📺', trashcan:'🗑️', plant:'🌱', sofa:'🛋️' }
    for (const [type, def] of Object.entries(PROP_TYPES)) {
      const item = document.createElement('div')
      item.className = 'prop-item'
      item.dataset.type = type
      item.innerHTML = `<span class="prop-icon">${icons[type] || '📦'}</span><span class="prop-label">${def.label}</span>`
      item.addEventListener('click', () => {
        document.querySelectorAll('.prop-item').forEach(i => i.classList.remove('selected'))
        item.classList.add('selected')
        this.onDisguise?.(type)
        this.propPickerEl.classList.add('hidden')
      })
      this.propPickerEl.appendChild(item)
    }
  }

  setRole(role) {
    this.roleEl.className = `role-badge ${role}`
    this.roleEl.textContent = role.toUpperCase()
    this.crosshairEl.className = role
    const isProp = role === 'prop'
    this.propPickerBtnEl.classList.toggle('hidden', !isProp)
    document.getElementById('shoot-btn').classList.toggle('hidden', isProp)
  }

  setTimer(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    this.timerEl.textContent = `${m}:${s}`
    if (seconds <= 10) this.timerEl.style.color = '#f87171'
    else this.timerEl.style.color = '#fff'
  }

  setPhase(phase) {
    const labels = {
      [GAME_PHASES.WAITING]: 'Waiting',
      [GAME_PHASES.HIDE]: '🕵️ HIDE!',
      [GAME_PHASES.HUNT]: '🔫 HUNT!',
      [GAME_PHASES.RESULTS]: 'Round Over',
    }
    this.phaseEl.textContent = labels[phase] || phase
    this._announce(labels[phase] || phase, phase)
  }

  _announce(text, phase) {
    const el = this.phaseAnnounceEl
    el.style.display = 'block'
    el.textContent = text
    el.style.color = phase === GAME_PHASES.HIDE ? '#4ade80'
                   : phase === GAME_PHASES.HUNT ? '#f87171' : '#a855f7'
    el.style.animation = 'none'
    requestAnimationFrame(() => {
      el.style.animation = 'announceAnim 2.5s forwards'
    })
    setTimeout(() => { el.style.display = 'none' }, 2600)
  }

  addKillFeed(msg) {
    const entry = document.createElement('div')
    entry.className = 'kill-entry'
    entry.textContent = msg
    this.killFeedEl.appendChild(entry)
    setTimeout(() => entry.remove(), 4100)
  }

  showEliminated() {
    this.eliminatedBannerEl.classList.remove('hidden')
  }

  showResults(winner) {
    this.resultsEl.classList.remove('hidden')
    const huntersWin = winner === 'hunters'
    this.resultsTitleEl.textContent = huntersWin ? '🔫 Hunters Win!' : '🪴 Props Win!'
    this.resultsTitleEl.className = `results-title ${huntersWin ? 'hunters-win' : 'props-win'}`
    this.resultsSubEl.textContent = huntersWin
      ? 'All props have been found!'
      : 'Hunters ran out of time!'
  }

  hideResults() {
    this.resultsEl.classList.add('hidden')
  }

  showMobileControls(isMobile) {
    const jz = document.getElementById('joystick-zone')
    const cz = document.getElementById('camera-zone')
    if (isMobile) {
      jz.style.display = 'block'
      cz.style.display = 'block'
    }
  }
}
