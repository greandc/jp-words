// mobile/www/testTitle/view.js (最終完成版)
import { t } from "../i18n.js";
import { loadLevel } from "../data/loader.js";
import { MAX_Q } from "../config.js";

// --- 定数 ---
const DIFF_KEY = "jpVocab.test.diff"; // "normal" | "hard"
const SEC_PER_Q_KEY = "jpVocab.test.secPerQ";
const NORMAL_SEC_PER_Q = 10;
const HARD_SEC_PER_Q   = 5;

// --- ヘルパー関数 ---

function ensureStyle() {
  if (document.querySelector('style[data-testtitle-style]')) return;
  const st = document.createElement('style');
  st.setAttribute('data-testtitle-style', '1');
  st.textContent = `
    .screen-testtitle {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 100svh;
      text-align: center; padding: 24px; box-sizing: border-box;
    }
    .screen-testtitle h1, .screen-testtitle #title {
      font-size: clamp(28px, 5vw, 40px); font-weight: 700; margin-bottom: 16px;
    }
    .screen-testtitle p {
      font-size: clamp(15px, 2vw, 18px); color: #374151; margin-bottom: 24px;
    }
    .testtitle-mode-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      width: 100%; max-width: 420px; margin: 4px 0 16px;
    }
    .mode-btn {
      border-radius: 999px; border: 1px solid #bfdbfe; background: #eff6ff;
      color: #1e3a8a; font-size: 0.9rem; font-weight: 600;
      padding: 10px 8px; cursor: pointer;
    }
    .mode-btn span {
      display: block; font-size: 0.8rem; opacity: 0.9;
    }
    .mode-btn--active {
      background: #1d4ed8; border-color: #1d4ed8; color: #ffffff;
    }
    .testtitle-btnwrap {
      display: grid; gap: 16px; width: 100%;
      max-width: 480px; margin-top: 24px;
    }
    .bigbtn {
      width: 100%; padding: 14px 0; font-size: 1rem;
      border-radius: 12px; border: 2px solid #66a3ff; background: #eef6ff;
    }
  `;
  document.head.appendChild(st);
}

function readCurrentLevel() {
  return Number(localStorage.getItem("jpVocab.currentLevel") ||
                sessionStorage.getItem("selectedLevel") ||
                localStorage.getItem("jpVocab.level") || 1);
}

// --- メインの描画関数 ---
export async function render(el, deps = {}) {
  ensureStyle();

  const wrap = document.createElement("div");
  wrap.className = "screen screen-testtitle";
  
  wrap.innerHTML = `
    <h1 id="title"></h1>
    <div class="testtitle-mode-row">
      <button type="button" class="mode-btn" data-mode="normal">
        10s / question
        <span></span>
      </button>
      <button type="button" class="mode-btn" data-mode="hard">
        5s / question
        <span></span>
      </button>
    </div>
    <p id="meta"></p>
    <div class="testtitle-btnwrap">
      <button class="btn bigbtn" id="start">${t("common.start")}</button>
      <button class="btn bigbtn" id="back">${t("common.back")}</button>
    </div>
  `;
  el.appendChild(wrap);

  // --- ロジック ---
  const lv = readCurrentLevel();
  const titleEl = wrap.querySelector("#title");
  const metaEl = wrap.querySelector("#meta");
  const normalBtn = wrap.querySelector('[data-mode="normal"]');
  const hardBtn = wrap.querySelector('[data-mode="hard"]');

  const startLv = Math.max(1, lv - 4);
  let count = 0;
  for (let L = startLv; L <= lv; L++) {
    count += (await loadLevel(L)).length;
  }
  const q = Math.min(MAX_Q, count);

  let mode = "normal";
  try {
    if (localStorage.getItem(DIFF_KEY) === "hard") mode = "hard";
  } catch {}

  const secPerQuestion = (m) => m === "hard" ? HARD_SEC_PER_Q : NORMAL_SEC_PER_Q;

  const updateUI = () => {
    // ★★★ UIの更新ロジックを、ユーザーさんのデザインに合わせました！ ★★★
    titleEl.textContent = t("level.label", { n: lv }) || `Level ${lv}`;

    const totalSecs = q * secPerQuestion(mode);
    const mm = Math.floor(totalSecs / 60);
    const ss = String(totalSecs % 60).padStart(2, "0");
    metaEl.textContent = `${q} ${t("common.questions")} · ${mm}:${ss}`; 

    normalBtn.querySelector("span").textContent = `${NORMAL_SEC_PER_Q}s × ${q} = ${q * NORMAL_SEC_PER_Q}s`;
    hardBtn.querySelector("span").textContent = `${HARD_SEC_PER_Q}s × ${q} = ${q * HARD_SEC_PER_Q}s`;

    normalBtn.classList.toggle("mode-btn--active", mode === "normal");
    hardBtn.classList.toggle("mode-btn--active", mode === "hard");
  };

  const saveState = () => {
    try {
      localStorage.setItem(DIFF_KEY, mode);
      localStorage.setItem(SEC_PER_Q_KEY, String(secPerQuestion(mode)));
    } catch {}
  };

  normalBtn.addEventListener("click", () => { mode = "normal"; updateUI(); saveState(); });
  hardBtn.addEventListener("click", () => { mode = "hard"; updateUI(); saveState(); });

  updateUI();
  saveState();

  wrap.querySelector("#start").addEventListener("click", () => deps.goto?.("quiz"));
  wrap.querySelector("#back").addEventListener("click", () => deps.goto?.("menu3"));
}