type WebAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

let audioContext: AudioContext | null = null

function getAudioContext() {
  const AudioCtor = window.AudioContext || (window as WebAudioWindow).webkitAudioContext
  if (!AudioCtor) return null
  audioContext ||= new AudioCtor()
  return audioContext
}

export function playTone(kind: 'start' | 'stop' | 'win') {
  try {
    const context = getAudioContext()
    if (!context) return

    const now = context.currentTime
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.connect(gain)
    gain.connect(context.destination)

    oscillator.type = kind === 'win' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(kind === 'start' ? 440 : kind === 'stop' ? 260 : 660, now)
    if (kind === 'win') {
      oscillator.frequency.exponentialRampToValueAtTime(990, now + 0.22)
    }

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    oscillator.start(now)
    oscillator.stop(now + 0.3)
  } catch {
    // Audio is best-effort because mobile browsers can block it.
  }
}
