// mobile/www/tts.v2.js
const __VER = 'v2-20251109d';

// 画面表示はしない最小ロガー（空実装）
function ttsUILog(){ /* noop */ }

// ===== ここで “読まれた印” を即出す
(function bootLog(){
  const Cap = window.Capacitor || {};
  const info = {
    cap: !!Cap,
    plat: Cap?.getPlatform?.() || 'n/a',
    native: !!(Cap?.isNativePlatform?.() && Cap.isNativePlatform()),
    plugin: !!(Cap?.Plugins?.TextToSpeech)
  };
  window.__TTS_MOD_VER__ = __VER;   // 外からも分かる印
  ttsUILog('LOADED', info);
})();

// ==========================================================
// TTS 本体
// ==========================================================
const Cap = window.Capacitor || {};
const NativeTTS = Cap?.Plugins?.TextToSpeech || null;

let cfg = { lang: "ja-JP", rate: 1.0, pitch: 1.0, volume: 1.0 };

export function setLang(v){ if (v) cfg.lang = v; }
export function setRate(v){ if (typeof v === "number") cfg.rate = v; }
export function setPitch(v){ if (typeof v === "number") cfg.pitch = v; }

function isNative(){ try { return !!(Cap?.isNativePlatform && Cap.isNativePlatform()); } catch { return false; } }

export function ttsAvailable(){ return (isNative() && NativeTTS) || (!!window.speechSynthesis && !!window.SpeechSynthesisUtterance); }

export async function stop(){
  ttsUILog('stop() called');
  try {
    if (isNative() && NativeTTS?.stop) await NativeTTS.stop();
    else if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch(e){ ttsUILog('stop() err', String(e?.message || e)); }
  ttsUILog('stop() done');
}

async function ensureNativeVoice(lang){
  ttsUILog('ensureNativeVoice', { tryLang: lang });
  try {
    if (NativeTTS?.getSupportedVoices) {
      const res = await NativeTTS.getSupportedVoices();
      const has = (res?.voices || []).some(v => (v?.lang || v?.locale) === lang);
      if (!has && NativeTTS?.openInstall) await NativeTTS.openInstall();
    }
  } catch(e){ ttsUILog('ensureNativeVoice warn', String(e?.message || e)); }
}

export async function speak(text, opts = {}){
  const msg = String(text || "").trim();
  if (!msg) return;

  const lang  = opts.lang  || cfg.lang;
  const rate  = typeof opts.rate  === "number" ? opts.rate  : cfg.rate;
  const pitch = typeof opts.pitch === "number" ? opts.pitch : cfg.pitch;

  ttsUILog('speak() enter', { msg, lang });

  if (isNative() && NativeTTS) {
    try {
      await stop();
      await ensureNativeVoice(lang);
      const payload = { text: msg, lang, rate, pitch, volume: cfg.volume };
      ttsUILog('native speak try', payload);
      await NativeTTS.speak(payload);
      ttsUILog('native speak OK');
      return;
    } catch (e) {
      ttsUILog('native speak ERR', String(e?.message || e));
      ttsUILog('→ web fallback');
    }
  }

  try {
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = lang; u.rate = rate; u.pitch = pitch;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    ttsUILog('web speak OK', { msg, lang, rate, pitch });
  } catch(e){
    ttsUILog('web speak ERR', String(e?.message || e));
  }
}

export async function ttsSetup(){ return true; }
