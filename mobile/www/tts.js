// ======== mobile/www/tts.js すべて置き換え ========
// 重要：importは一切しない

let currentLang  = 'ja-JP';
let currentRate  = 1.0;
let currentPitch = 1.0;
let speakingTicket = 0;

// ---- Capacitor検出（v4〜v7を全部カバー）----
function C() { return globalThis.Capacitor || globalThis.capacitor || null; }
function isNative() {
  const c = C();
  if (!c) return false;
  if (typeof c.isNativePlatform === 'function') return !!c.isNativePlatform();
  if (typeof c.getPlatform === 'function') return c.getPlatform() !== 'web';
  // 最後の保険（Android WebView では device info が入る）
  return !!c.platform && c.platform !== 'web';
}
function ttsPlugin() {
  const c = C();
  if (!c) return null;
  // どれかに入ってる
  return c.Plugins?.TextToSpeech
      || (typeof c.getPlugin === 'function' ? c.getPlugin('TextToSpeech') : null)
      || globalThis.TextToSpeech
      || null;
}

export function ttsAvailable() {
  if (isNative()) return !!ttsPlugin();
  return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
}

export function setLang(v)  { currentLang  = v || 'ja-JP'; }
export function setRate(v)  { const n = Number(v);  currentRate  = Number.isFinite(n) ? n : 1.0; }
export function setPitch(v) { const n = Number(v);  currentPitch = Number.isFinite(n) ? n : 1.0; }

export async function stop() {
  try {
    if (isNative() && ttsPlugin()) {
      await ttsPlugin().stop();
    } else if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
  } catch (_) {}
}

export async function speak(text, opts = {}) {
  if (!text) return;
  const ticket = ++speakingTicket;

  const lang  = opts.lang  ?? currentLang;
  const rate  = opts.rate  ?? currentRate;
  const pitch = opts.pitch ?? currentPitch;

  await stop();
  if (ticket !== speakingTicket) return;

  if (isNative() && ttsPlugin()) {
    await ttsPlugin().speak({
      text, lang, rate, pitch, volume: 1.0, category: 'ambient'
    });
    return;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = rate; u.pitch = pitch;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// --- デバッグ（必要ならコメントアウト解除）---
// console.log('[TTS] platform=', C()?.getPlatform?.(), 'native=', isNative(), 'plugin=', !!ttsPlugin());


