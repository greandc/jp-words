// app/features/lang/view.js
import { t, setLang } from "../i18n.js";

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
      setLang(opt.code);     // 選択言語を保存
      location.reload();     // 全画面をその言語で再読込
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

