// www/tts.js  ← 全置き換え
// ※ 何も import しない（重要）

// ---- 内部状態 ----
let currentLang  = 'ja-JP';
let currentRate  = 1.0;
let currentPitch = 1.0;
let speakingTicket = 0;

// ---- Capacitor 検出（グローバル）----
function cap() {
  return globalThis.Capacitor || globalThis.capacitor || null;
}
function isNative() {
  const C = cap();
  return !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());
}
function ttsPlugin() {
  const C = cap();
  return C?.Plugins?.TextToSpeech || null;
}

// ---- 公開API ----
export function ttsAvailable() {
  if (isNative()) return !!ttsPlugin(); // ネイティブ優先
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

// 重要：毎回 stop() → speak()。連打は最新だけ有効にする
export async function speak(text, opts = {}) {
  if (!text) return;
  const ticket = ++speakingTicket;

  const lang  = opts.lang  ?? currentLang;
  const rate  = opts.rate  ?? currentRate;
  const pitch = opts.pitch ?? currentPitch;

  await stop();
  if (ticket !== speakingTicket) return; // 直前でさらに押されたら棄却

  if (isNative() && ttsPlugin()) {
    // Capacitor ネイティブ
    await ttsPlugin().speak({
      text,
      lang,
      rate,         // 端末依存: 0.1–2.0 目安
      pitch,        // 端末依存: 0.5–2.0 目安
      volume: 1.0,
      category: 'ambient'
    });
    return;
  }

  // Web フォールバック
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  u.pitch = pitch;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

