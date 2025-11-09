// mobile/www/tts.js
// 依存に失敗しないよう window.Capacitor を直接使う
const Cap = window.Capacitor || {};
const NativeTTS = Cap?.Plugins?.TextToSpeech || null;

let cfg = {
  lang:  "ja-JP",
  rate:  1.0,   // Androidは 0.1〜2.0 程度（端末依存）
  pitch: 1.0,   // 0.1〜2.0
  volume: 1.0
};

export function setLang(v){ if (v) cfg.lang = v; }
export function setRate(v){ if (typeof v === "number") cfg.rate = v; }
export function setPitch(v){ if (typeof v === "number") cfg.pitch = v; }

function isNative(){
  try { return !!(Cap?.isNativePlatform && Cap.isNativePlatform()); }
  catch { return false; }
}

export function ttsAvailable(){
  if (isNative() && NativeTTS) return true;
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

export async function stop(){
  try {
    if (isNative() && NativeTTS?.stop) {
      await NativeTTS.stop();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch(e){
    console.log("[TTS] stop err", e);
  }
}

async function ensureNativeVoice(lang){
  // 壊れても無視（オプショナル）
  try {
    if (NativeTTS?.getSupportedVoices) {
      const res = await NativeTTS.getSupportedVoices();
      const has = (res?.voices || []).some(v => (v?.lang || v?.locale) === lang);
      if (!has && NativeTTS?.openInstall) {
        // 端末に該当言語が無ければ、音声データの画面を開く（ユーザーがDL）
        await NativeTTS.openInstall();
      }
    }
  } catch(e){
    console.log("[TTS] ensureNativeVoice warn", e);
  }
}

export async function speak(text, opts = {}){
  const msg = String(text || "").trim();
  if (!msg) return;

  const lang  = opts.lang  || cfg.lang;
  const rate  = typeof opts.rate  === "number" ? opts.rate  : cfg.rate;
  const pitch = typeof opts.pitch === "number" ? opts.pitch : cfg.pitch;

  if (isNative() && NativeTTS) {
    try {
      await stop();                       // 先に必ず止める
      await ensureNativeVoice(lang);      // 言語データの有無チェック（任意）

      // iOS向け category は渡さない（Androidで無視されるが念のため）
      const payload = { text: msg, lang, rate, pitch, volume: cfg.volume };
      console.log("[TTS] native speak", payload);
      await NativeTTS.speak(payload);
      return;
    } catch (e) {
      console.log("[TTS] native speak err → web fallback", e);
      // ネイティブが沈黙したら Web にフォールバック
    }
  }

  // ---- Web フォールバック ----
  try {
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = lang; u.rate = rate; u.pitch = pitch;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    console.log("[TTS] web speak", {msg, lang, rate, pitch});
  } catch(e){
    console.log("[TTS] web speak err", e);
  }
}

// 互換用（いまは何もしないが、将来の初期化待ちに使える）
export async function ttsSetup(){ return true; }

