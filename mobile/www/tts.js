// mobile/www/tts.js
// ==========================================================
// Capacitor / Web 両対応の TTS + 画面ログ付き
// ==========================================================

// === UIログ（画面右上に表示） ===
function ttsUILog(label, data) {
  try {
    let box = document.getElementById('tts-ui-log');
    if (!box) {
      box = document.createElement('div');
      box.id = 'tts-ui-log';
      box.style.cssText =
        'position:fixed;top:8px;right:8px;z-index:999999;padding:6px 8px;' +
        'background:rgba(0,0,0,.75);color:#fff;border-radius:6px;' +
        'font:12px/1.3 system-ui;max-width:60vw';
      document.body.appendChild(box);
    }
    const line = document.createElement('div');
    line.textContent = `[TTS] ${label}` + (data ? ` ${JSON.stringify(data)}` : '');
    box.appendChild(line);
    // 10行以上は古い行を削除
    while (box.childElementCount > 10) box.removeChild(box.firstChild);
    console.log('[TTS]', label, data || '');
  } catch (_) {}
}

// ==========================================================
// TTS 本体
// ==========================================================
const Cap = window.Capacitor || {};
const NativeTTS = Cap?.Plugins?.TextToSpeech || null;

let cfg = {
  lang: "ja-JP",
  rate: 1.0,
  pitch: 1.0,
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
  ttsUILog('stop() called');
  try {
    if (isNative() && NativeTTS?.stop) {
      await NativeTTS.stop();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch(e){
    ttsUILog('stop() err', String(e && e.message || e));
  }
  ttsUILog('stop() done');
}

async function ensureNativeVoice(lang){
  ttsUILog('ensureNativeVoice', { tryLang: lang });
  try {
    if (NativeTTS?.getSupportedVoices) {
      const res = await NativeTTS.getSupportedVoices();
      const has = (res?.voices || []).some(v => (v?.lang || v?.locale) === lang);
      if (!has && NativeTTS?.openInstall) {
        await NativeTTS.openInstall();
      }
    }
  } catch(e){
    ttsUILog('ensureNativeVoice warn', String(e && e.message || e));
  }
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
      ttsUILog('native speak ERR', String(e && e.message || e));
      ttsUILog('→ web fallback');
    }
  }

  // ---- Web フォールバック ----
  try {
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = lang; u.rate = rate; u.pitch = pitch;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    ttsUILog('web speak OK', { msg, lang, rate, pitch });
  } catch(e){
    ttsUILog('web speak ERR', String(e && e.message || e));
  }
}

// （ダミー初期化）
export async function ttsSetup(){ return true; }
