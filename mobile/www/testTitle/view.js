// app/testTitle/view.js
import { t } from "../i18n.js";
import { loadLevel } from "../data/loader.js";
import { MAX_Q } from "../config.js";

const DIFF_KEY = "jpVocab.test.diff";   // "normal" | "hard"
const SEC_PER_Q_KEY = "jpVocab.test.secPerQ";
const NORMAL_SEC_PER_Q = 10;           // 1問あたり10秒
const HARD_SEC_PER_Q   = 5;            // 1問あたり5秒

function readCurrentLevel() {

  // ===== スタイルを追加（中央寄せレイアウト）=====
if (!document.querySelector('style[data-testtitle-style]')) {
  const st = document.createElement('style');
  st.setAttribute('data-testtitle-style', '1');
  st.textContent = `
  .screen-testtitle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100svh;
  text-align: center;
  padding: 24px;
  box-sizing: border-box;
}

    /* Level 1 を大きく（menu3 と同じくらい） */
  .screen-testtitle h1,
  .screen-testtitle h2,
  .screen-testtitle #title {
    font-size: clamp(28px, 5vw, 40px);
    font-weight: 700;
    margin-bottom: 16px;
  }

  .screen-testtitle p {
    font-size: clamp(15px, 2vw, 18px);
    color: #374151;
    margin-bottom: 24px;
  }
  
  /* ▼ ここから追加 ─ 難易度(秒数)モードボタン */
.testtitle-mode-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 420px;
  margin: 4px 0 16px;
}

.mode-btn {
  border-radius: 999px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 10px 8px;
  cursor: pointer;
}

.mode-btn span {
  display: block;
  font-size: 0.8rem;
  opacity: 0.9;
}

/* 選択中 */
.mode-btn--active {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}

  .screen-testtitle .btn {
  margin: 0;              /* 余白はラッパー側で管理 */
  border-radius: 12px;
  border: 2px solid #66a3ff;
  background: #eef6ff;
  font-size: 17px;
  font-weight: 600;
  width: auto;            /* 幅指定は外す */
  height: auto;           /* 高さも外す */
 }

  
  /* menu3 と同じ感じのボタン */
  .testtitle-btnwrap {
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: 480px;
  margin-top: 24px;
 }

 .bigbtn {
  width: 100%;
  padding: 14px 0;
  font-size: 1rem;
  border-radius: 12px;
 }

  `;
  document.head.appendChild(st);
}

  const lv =
    Number(localStorage.getItem("jpVocab.currentLevel")) ||
    Number(sessionStorage.getItem("selectedLevel")) ||
    Number(localStorage.getItem("jpVocab.level")) ||
    1;
  console.log("[testTitle] read level =", lv);
  return lv;
}

export async function render(el, deps = {}) {
  const wrap = document.createElement("div");
  wrap.className = "screen screen-testtitle";
  wrap.innerHTML = `
    <h1 id="title"></h1>

    <!-- ★ 1問あたりの秒数を選ぶボタン（数字だけ） -->
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

  const lv = readCurrentLevel();
  // “レベル {n}” のフォーマットを使う
   wrap.querySelector("#title").textContent = t("level.label", { n: lv });

  // プレビュー（問題数×時間）
  const startLv = Math.max(1, lv - 4);
  let count = 0;
  for (let L = startLv; L <= lv; L++) {
    const items = await loadLevel(L);
    count += items.length;
  }
  const q = Math.min(MAX_Q, count);

// ① 前回の選択を復元
let mode = "normal";
try {
  const saved = localStorage.getItem(DIFF_KEY);
  if (saved === "hard" || saved === "normal") {
    mode = saved;
  }
} catch {}


// ② モードごとの秒数
function secPerQuestion(m) {
  return m === "hard" ? HARD_SEC_PER_Q : NORMAL_SEC_PER_Q;
}

let secs = q * secPerQuestion(mode);

// ③ タイトル / メタ表記を書き出す
wrap.querySelector("#title").textContent =
  t("level.label", { n: lv }) || `Level ${lv}`;

const metaEl = wrap.querySelector("#meta");
function updateMeta() {
  secs = q * secPerQuestion(mode);
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, "0");
  metaEl.textContent =
    `${q} quiz.questions · ${mm}:${ss}`;
}
updateMeta();

// ④ 秒数モードボタンを作る
const modeRow = wrap.querySelector(".testtitle-mode-row");
const normalBtn = modeRow.querySelector('[data-mode="normal"]');
const hardBtn   = modeRow.querySelector('[data-mode="hard"]');

function updateModeButtons() {
  normalBtn.classList.toggle("mode-btn--active", mode === "normal");
  hardBtn.classList.toggle("mode-btn--active",   mode === "hard");
}

// ボタンの表示テキスト（数字だけ）
function updateModeLabels() {
  const normalTotal = q * NORMAL_SEC_PER_Q;
  const hardTotal   = q * HARD_SEC_PER_Q;
  normalBtn.querySelector("span").textContent =
    `${NORMAL_SEC_PER_Q}s × ${q} = ${normalTotal}s`;
  hardBtn.querySelector("span").textContent =
    `${HARD_SEC_PER_Q}s × ${q} = ${hardTotal}s`;
}

updateModeLabels();
updateModeButtons();

// ⑤ クリック時の処理
function saveMode() {
  try {
    localStorage.setItem(DIFF_KEY, mode);
    // いま選ばれているモードの「1問あたり秒数」も保存
    const sec = secPerQuestion(mode); // ← NORMAL/HARD から計算する関数
    localStorage.setItem(SEC_PER_Q_KEY, String(sec));
  } catch {}
}

normalBtn.addEventListener("click", () => {
  mode = "normal";
  saveMode();
  updateModeButtons();
  updateMeta();
});

hardBtn.addEventListener("click", () => {
  mode = "hard";
  saveMode();
  updateModeButtons();
  updateMeta();
});

// 初期表示時にも一度保存しておく（初回起動用）
saveMode();


  // Start → quiz
  wrap.querySelector("#start").addEventListener("click", () => {
    // 念のためもう一度保存（戻ってきた時の保険）
    try {
      localStorage.setItem("jpVocab.currentLevel", String(lv));
      localStorage.setItem("jpVocab.level", String(lv));
      sessionStorage.setItem("selectedLevel", String(lv));
    } catch {}
    deps.goto?.("quiz");
  });

  // Back
  wrap.querySelector("#back").addEventListener("click", () => deps.goto?.("menu3"));
}
