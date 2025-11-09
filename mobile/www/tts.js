// www/tts.js
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let inited = false;

export async function ttsSetup() {
  inited = true;
}

export function ttsAvailable() {
  // ネイティブ or Webのどちらかが使えればOK
  if (Capacitor.isNativePlatform()) return true;
  return typeof window.speechSynthesis !== 'undefined';
}

export async function speak(text, { lang = 'ja-JP', rate = 1.0, pitch = 1.0 } = {}) {
  if (!inited) await ttsSetup();

  if (Capacitor.isNativePlatform()) {
    // 端末ネイティブTTS（Android/iOS）
    await TextToSpeech.speak({
      text,
      lang,          // 例: 'ja-JP', 'en-US'
      rate,          // 0.1–2.0（端末依存）
      pitch,         // 0.1–2.0（端末依存）
      volume: 1.0,   // 0–1（端末依存）
      category: 'ambient'
    });
    return;
  }

  // Web fallback（PCブラウザ等）
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

