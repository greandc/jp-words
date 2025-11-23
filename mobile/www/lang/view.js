// app/features/lang/view.js
import { t, setLang } from "../i18n.js";

// =====================
//  TTS チュートリアル用 フラグ
// =====================
const LS_FIRST_RUN   = "tango.firstRunDone";   // 初回起動かどうか
const LS_TTS_STATUS  = "tango.ttsStatus";      // 別の画面で保存している TTS 状態 (unknown / ok / off / missing)

function isFirstRun() {
  try {
    return localStorage.getItem(LS_FIRST_RUN) !== "1";
  } catch {
    return true;
  }
}

function markFirstRunDone() {
  try {
    localStorage.setItem(LS_FIRST_RUN, "1");
  } catch {}
}

function getTtsStatus() {
  try {
    return localStorage.getItem(LS_TTS_STATUS) || "unknown";
  } catch {
    return "unknown";
  }
}

// =====================
//  TTS の案内モーダル
// =====================
let modalOkHandler = null;   // OK を押したときに実行する処理をここに入れておく

function ensureTtsHintModal() {
  if (document.getElementById("ttsHintModal")) return;

  const wrap = document.createElement("div");
  wrap.id = "ttsHintModal";
  wrap.style.cssText = `
    position:fixed; inset:0;
    display:none;
    align-items:center; justify-content:center;
    background:rgba(0,0,0,.35);
    z-index:9999;
  `;

  wrap.innerHTML = `
    <div id="ttsHintBox"
         style="background:#fff;border-radius:16px;padding:18px 20px;
                max-width:360px;width:88%;box-shadow:0 10px 30px rgba(15,23,42,.25);
                text-align:left;font-size:.95rem;">
      <h2 id="ttsHintTitle"
          style="margin:0 0 8px;font-size:1.05rem;font-weight:700;"></h2>
      <p id="ttsHintText"
         style="margin:0 0 14px;line-height:1.5;color:#374151;"></p>
      <button id="ttsHintOk" class="btn">OK</button>
    </div>
  `;

  document.body.appendChild(wrap);

  const okBtn = wrap.querySelector("#ttsHintOk");
  okBtn.addEventListener("click", () => {
    wrap.style.display = "none";
    if (modalOkHandler) {
      const fn = modalOkHandler;
      modalOkHandler = null;
      fn();
    }
  });
}


function openTtsHintModal(onOk) {
  ensureTtsHintModal();
  modalOkHandler = onOk;

  const wrap = document.getElementById("ttsHintModal");
  if (wrap) wrap.style.display = "flex";

  // タイトル
  const titleEl = document.getElementById("ttsHintTitle");
  if (titleEl) {
    const rawTitle = t("tutorial.ttsTitle");
    const title =
      !rawTitle || rawTitle === "tutorial.ttsTitle"
        ? "About voice reading"
        : rawTitle;
    titleEl.textContent = title;
  }

  // 本文
  const msg = document.getElementById("ttsHintText");
  if (msg) {
    const rawHint = t("tutorial.ttsHint");
    const hint =
      !rawHint || rawHint === "tutorial.ttsHint"
        ? "This app reads Japanese words aloud.\n"
          + "If you do not hear any sound, please check the volume, "
          + "silent mode, and the Text-to-Speech settings on your device."
        : rawHint;

    // i18n の中で \n を使っているので <br> に変換
    msg.innerHTML = hint.replace(/\n/g, "<br>");
  }

  // OK ボタンテキスト
  const okBtn = document.getElementById("ttsHintOk");
  if (okBtn) {
    const rawOk = t("tutorial.ok");
    okBtn.textContent =
      !rawOk || rawOk === "tutorial.ok" ? "OK" : rawOk;
  }
}


// =====================
//  画面本体
// =====================
export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen screen-lang";
  div.innerHTML = `
    <h1>${t("Language")}</h1>
    <div id="grid" class="lang-vert" style="margin-top:8px;"></div>

    <div style="display:grid;gap:12px;margin-top:16px;">
      <button class="btn" id="back">${t("common.back")}</button>
    </div>
  `;
  el.appendChild(div);

  // 言語ボタン群
  const grid = div.querySelector("#grid");
  // OPTIONS は元のコードと同じくグローバルを使用（ここはそのまま）
  OPTIONS.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.innerHTML = `
      <div class="lang-strong" lang="${opt.code}">${opt.native}</div>
      <div style="color:#666">${opt.english}</div>
    `;

    btn.addEventListener("click", () => {
      const first  = isFirstRun();
      const tts    = getTtsStatus();
      const needHint = (tts === "off" || tts === "missing" || tts === "unknown");

      // 初回かつ TTS が怪しいときだけ案内を出す
      if (first && needHint) {
        openTtsHintModal(() => {
          setLang(opt.code);
          markFirstRunDone();
          // 言語を適用し直す
          location.reload();
        });
      } else {
        setLang(opt.code);
        markFirstRunDone();
        location.reload();
      }
    });

    grid.appendChild(btn);
  });

  // 戻る
  div.querySelector("#back")?.addEventListener("click", () => {
    deps.goto?.("menu1");
  });
}



const OPTIONS = [
  // Common
  { code: "en", native: "English",    english: "English" },
  { code: "zh", native: "中文",         english: "Chinese" },
  { code: "ko", native: "한국어",        english: "Korean" },

  { code: "vi", native: "Tiếng Việt",  english: "Vietnamese" },
  { code: "es", native: "Español",     english: "Spanish" },
  { code: "fr", native: "Français",    english: "French" },

  { code: "de", native: "Deutsch",     english: "German" },
  { code: "it", native: "Italiano",    english: "Italian" },
  { code: "pt", native: "Português",   english: "Portuguese" },

  { code: "id", native: "Bahasa Indonesia", english: "Indonesian" },
  { code: "tl", native: "Filipino", english: "Tagalog/Filipino" },
  { code: "th", native: "ไทย",          english: "Thai" },

  { code: "ru", native: "Русский",     english: "Russian" },
  { code: "hi", native: "हिन्दी",        english: "Hindi" },
  { code: "km", native: "ភាសាខ្មែរ", english: "Khmer" },
  
  { code: "lo", native: "ລາວ", english: "Lao" },
  { code: "ne", native: "नेपाली", english: "Nepali" },

];

