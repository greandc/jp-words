// mobile/www/tts.v2.js
// ==========================================================
// Capacitor / Web 両対応の TTS + 画面ログ付き（デバッグ用）
// ==========================================================
// ここを追加（ファイルの一番上あたりでOK）
const ENABLE_TTS_UI_LOG = false;  // ← 本番では false

// === 画面右上に出す簡易ログ ===
function ttsUILog(label, data) {
  if (!ENABLE_TTS_UI_LOG) return;   // ★ 追加：OFF のときは何もしない

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
  volume: 1.0,
};

export function setLang(v) {
  if (v) cfg.lang = v;
}
export function setRate(v) {
  if (typeof v === "number") cfg.rate = v;
}
export function setPitch(v) {
  if (typeof v === "number") cfg.pitch = v;
}

function isNative() {
  try {
    return !!(Cap?.isNativePlatform && Cap.isNativePlatform());
  } catch {
    return false;
  }
}

export function ttsAvailable() {
  if (isNative() && NativeTTS) return true;
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

export async function stop() {
  ttsUILog("stop() called");
  try {
    if (isNative() && NativeTTS?.stop) {
      await NativeTTS.stop();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    ttsUILog("stop() err", String(e && e.message || e));
  }
  ttsUILog("stop() done");
}

async function ensureNativeVoice(lang) {
  ttsUILog("ensureNativeVoice", { tryLang: lang });
  try {
    if (NativeTTS?.getSupportedVoices) {
      const res = await NativeTTS.getSupportedVoices();
      const has = (res?.voices || []).some(
        (v) => (v?.lang || v?.locale) === lang
      );
      if (!has && NativeTTS?.openInstall) {
        await NativeTTS.openInstall();
      }
    }
  } catch (e) {
    ttsUILog("ensureNativeVoice warn", String(e && e.message || e));
  }
}

export async function speak(text, opts = {}){
  // 元のテキスト
  let msg = String(text || "").trim();
  if (!msg) return;

  const lang  = opts.lang  || cfg.lang;
  const rate  = typeof opts.rate  === "number" ? opts.rate  : cfg.rate;
  const pitch = typeof opts.pitch === "number" ? opts.pitch : cfg.pitch;

  // 🔧 日本語用の読み補正（端末依存バグ対策）
  if (lang && lang.startsWith("ja")) {
    // 「のむ」だけ、漢字の「飲む」として読ませる
    if (msg === "のむ") {
      msg = "飲む";
    }
  }

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


// （ダミー）
export async function ttsSetup() {
  return true;
}
