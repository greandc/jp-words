// app/tts.js
let _voices = [];
let _ready = false;

/** voicesが揃うまで待つ（Androidで重要） */
export async function ttsSetup(timeoutMs = 3000) {
  if (!('speechSynthesis' in window)) return false;

  // すでに準備済み？
  if (_ready && _voices.length) return true;

  // 1) 今取れるものを読む
  _voices = window.speechSynthesis.getVoices();
  if (_voices.length) {
    _ready = true;
    return true;
  }

  // 2) voiceschanged を待つ（Chrome/Android対策）
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };

    // イベントで来るのを待つ
    const onChange = () => {
      _voices = window.speechSynthesis.getVoices();
      if (_voices.length) {
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
        finish();
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', onChange);

    // 念のためポーリングも少し
    const iv = setInterval(() => {
      _voices = window.speechSynthesis.getVoices();
      if (_voices.length) {
        clearInterval(iv);
        window.speechSynthesis.removeEventListener('voiceschanged', onChange);
        finish();
      }
    }, 100);

    // タイムアウト
    setTimeout(() => {
      clearInterval(iv);
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      finish();
    }, timeoutMs);
  });

  _ready = _voices.length > 0;
  return _ready;
}

export function ttsAvailable() {
  return ('speechSynthesis' in window) && _voices.length > 0;
}

/** できるだけ言語に合うvoiceを選ぶ */
function pickVoice(langPrefer = 'ja-JP') {
  if (!_voices.length) return null;
  // 完全一致
  let v = _voices.find(v => v.lang === langPrefer);
  if (v) return v;
  // ja- で前方一致
  const base = langPrefer.split('-')[0];
  v = _voices.find(v => v.lang?.toLowerCase().startsWith(base.toLowerCase()));
  if (v) return v;
  // Google系があれば優先
  v = _voices.find(v => /google/i.test(v.name));
  return v || _voices[0];
}

/** 読み上げ。最初は必ずユーザー操作（タップ）から呼ぶこと */
export function speak(text, { lang = 'ja-JP', rate = 0.95, pitch = 1, volume = 1 } = {}) {
  if (!ttsAvailable() || !text) return false;
  const u = new SpeechSynthesisUtterance(String(text));
  u.voice = pickVoice(lang);
  u.lang = u.voice?.lang || lang;
  u.rate = rate;
  u.pitch = pitch;
  u.volume = volume;

  // 直前の読み上げを止めてから
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return true;
}
