// Lightweight Web Audio API synthesizer for sound effects
class SoundController {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  toggleMute() {
    this.muted = !this.muted
    return this.muted
  }

  playTone(freq, type = 'sine', duration = 0.1, gainValue = 0.15) {
    if (this.muted) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

      gain.gain.setValueAtTime(gainValue, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  }

  playMove(player = 'X') {
    if (player === 'X') {
      this.playTone(520, 'sine', 0.12, 0.18)
    } else {
      this.playTone(380, 'triangle', 0.14, 0.18)
    }
  }

  playWin() {
    if (this.muted) return
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.2)
      }, idx * 90)
    })
  }

  playDraw() {
    if (this.muted) return
    const notes = [440, 392, 349.23]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.15)
      }, idx * 100)
    })
  }

  playClick() {
    this.playTone(660, 'sine', 0.05, 0.08)
  }
}

export const sounds = new SoundController()
