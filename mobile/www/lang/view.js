// app/features/lang/view.js
import { t, setLang } from "../i18n.js";

// 言語初期設定が終わったかどうか
const LS_LANG_INIT_DONE = "lang_init_done_v1";
function setLangInitDone() {
  try { localStorage.setItem(LS_LANG_INIT_DONE, "1"); } catch {}
}

btn.addEventListener("click", () => {
  setLang(opt.code);

  if (!isTtsOnboardDone()) {
    showTtsOnboardModal(opt.code); // モーダル側の OK でも setLangInitDone()
    return;
  }

  setLangInitDone();
  location.reload();
});



// ===== 初回チュートリアル用フラグ =====
const LS_ONBOARD_TTS = "onboard_tts_v1";

function isTtsOnboardDone() {
  try {
    return localStorage.getItem(LS_ONBOARD_TTS) === "1";
  } catch {
    return false;
  }
}

function setTtsOnboardDone() {
  try {
    localStorage.setItem(LS_ONBOARD_TTS, "1");
  } catch {}
}

// ==== TTS チュートリアル用モーダル ====
function showTtsTutorial({ langCode, langName, ttsOk }) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.inset = "0";
    wrap.style.background = "rgba(0,0,0,.35)";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";
    wrap.style.zIndex = "9999";

    const box = document.createElement("div");
    box.style.maxWidth = "420px";
    box.style.width = "90vw";
    box.style.background = "#fff";
    box.style.borderRadius = "16px";
    box.style.padding = "16px 18px 14px";
    box.style.boxShadow = "0 10px 30px rgba(15,23,42,.25)";
    box.style.boxSizing = "border-box";

    // ここはあとで i18n に差し替えられるよう、日本語ベタ書き
    const title = document.createElement("h2");
    title.textContent = "音声読み上げについて";
    title.style.margin = "0 0 8px";
    title.style.fontSize = "18px";

    const p = document.createElement("p");
    p.style.margin = "0 0 12px";
    p.style.fontSize = "14px";
    p.style.lineHeight = "1.6";

    if (ttsOk) {
      p.textContent =
        "このアプリでは、単語や文字を選ぶときに、音声読み上げをよく使います。" +
        "音量やマナーモードの設定を確認してからご利用ください。";
    } else {
      p.textContent =
        `${langName} の音声読み上げ(TTS)が、この端末では使えないか、OFFになっている可能性があります。\n` +
        "このアプリでは音声があると学習しやすくなります。端末の設定でTTSを有効にしてから使うことをおすすめします。";
    }

    const btn = document.createElement("button");
    btn.textContent = "OK";
    btn.className = "btn";
    btn.style.width = "100%";
    btn.style.marginTop = "4px";

    btn.addEventListener("click", () => {
      document.body.removeChild(wrap);
      resolve();
    });

    box.appendChild(title);
    box.appendChild(p);
    box.appendChild(btn);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  });
}


export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h1>${t("Language")}</h1>
    <div id="grid" class="lang-vert" style="margin-top:8px;"></div>

    <div style="display:grid;gap:12px;margin-top:16px;">
      <button class="btn" id="back">${t("common.back")}</button>
    </div>
  `;
  el.appendChild(div);

  const grid = div.querySelector("#grid");
  OPTIONS.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.innerHTML = `
      <div class="lang-strong" lang="${opt.code}">${opt.native}</div>
      <div style="color:#666">${opt.english}</div>
    `;
    btn.addEventListener("click", () => {

  // まず言語設定
  setLang(opt.code);

  // --- 初回のみ、TTSガイドを表示 ---
  if (!isTtsOnboardDone()) {
    showTtsOnboardModal(opt.code);
    return;   // ← 案内を見るまでは reload しない
  }

  // --- 2回目以降は普通にリロード ---
  location.reload();


    });
    grid.appendChild(btn);
  });

  div.querySelector("#back").addEventListener("click", () => deps.goto?.("menu1"));
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

