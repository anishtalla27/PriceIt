import { useRef, useCallback } from 'react'

interface UseSoundOptions {
  volume?: number
  src?: string
}

export function useSound(options: UseSoundOptions = {}) {
  const { volume = 0.3, src } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playSound = useCallback(() => {
    // If src is provided, use audio file
    if (src) {
      const audio = new Audio(src)
      audio.volume = volume
      audio.play().catch((error) => {
        // Silently handle autoplay restrictions
        console.debug('Sound play prevented:', error)
      })
      return
    }

    // Fallback: Generate a simple click sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Create a friendly, short click sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.001)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.05)
    } catch (error) {
      // Silently handle errors (e.g., autoplay restrictions)
      console.debug('Sound generation failed:', error)
    }
  }, [volume, src])

  return playSound
}

