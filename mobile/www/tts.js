// tts.ts / tts.js
import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'

let currentLang = 'ja-JP'
let currentRate = 1.0
let currentPitch = 1.0

let speakingTicket = 0 // 連打対策

export function ttsAvailable() {
  if (Capacitor.isNativePlatform()) return true
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
}

export function setLang(v) { currentLang = v || 'ja-JP' }
export function setRate(v) { currentRate = Number(v) || 1.0 }
export function setPitch(v) { currentPitch = Number(v) || 1.0 }

export async function stop() {
  if (Capacitor.isNativePlatform()) {
    try { await TextToSpeech.stop() } catch (_) {}
    return
  }
  try { window.speechSynthesis?.cancel() } catch (_) {}
}

// 重要：毎回 stop() → speak()
export async function speak(text, opts = {}) {
  if (!text) return
  const ticket = ++speakingTicket

  const lang  = opts.lang  ?? currentLang
  const rate  = opts.rate  ?? currentRate
  const pitch = opts.pitch ?? currentPitch

  await stop()
  if (ticket !== speakingTicket) return // 直前でさらに押されたら棄却

  if (Capacitor.isNativePlatform()) {
    await TextToSpeech.speak({
      text,
      lang,
      rate,           // 0.1–2.0
      pitch,          // 0.1–2.0
      volume: 1.0,
      category: 'ambient'
    })
    return
  }

  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = rate
  u.pitch = pitch
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}
