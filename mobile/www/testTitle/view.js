// mobile/www/testTitle/view.js
import { t } from "../i18n.js";
import { loadLevel } from "../data/loader.js";
import { MAX_Q } from "../config.js";

// --- 定数 ---
const DIFF_KEY          = "jpVocab.test.diff";          // "normal" | "hard"
const SEC_PER_Q_KEY     = "jpVocab.test.secPerQ";
const NORMAL_SEC_PER_Q  = 10;
const HARD_SEC_PER_Q    = 5;

// ★ 追加：チュートリアル用キー
const TEST_TUTORIAL_KEY    = "jpVocab.tutorial.testShown";
const PRACTICE_HINT_KEY    = "jpVocab.tutorial.practiceHintShown";

// --- ヘルパー関数 ---

function ensureStyle() {
  if (document.querySelector('style[data-testtitle-style]')) return;
  const st = document.createElement("style");
  st.setAttribute("data-testtitle-style", "1");
  st.textContent = `
    .screen-testtitle {
      display:flex;flex-direction:column;align-items:center;
      justify-content:center;min-height:100svh;
      text-align:center;padding:24px;box-sizing:border-box;
    }
    .screen-testtitle h1, .screen-testtitle #title {
      font-size:clamp(28px,5vw,40px);font-weight:700;margin-bottom:16px;
    }
    .screen-testtitle p {
      font-size:clamp(15px,2vw,18px);color:#374151;margin-bottom:24px;
    }
    .testtitle-mode-row {
      display:grid;grid-template-columns:1fr 1fr;gap:10px;
      width:100%;max-width:420px;margin:4px 0 16px;
    }
    .mode-btn {
      border-radius:999px;border:1px solid #bfdbfe;background:#eff6ff;
      color:#1e3a8a;font-size:.9rem;font-weight:600;
      padding:10px 8px;cursor:pointer;
    }
    .mode-btn span {
      display:block;font-size:.8rem;opacity:.9;
    }
    .mode-btn--active {
      background:#1d4ed8;border-color:#1d4ed8;color:#ffffff;
    }
    .testtitle-btnwrap {
      display:grid;gap:16px;width:100%;
      max-width:480px;margin-top:24px;
    }
    .bigbtn {
      width:100%;padding:14px 0;font-size:1rem;
      border-radius:12px;border:2px solid #66a3ff;background:#eef6ff;
    }

    /* ★ Practice ヒント用 */
    .testtitle-hint {
      width:100%;max-width:480px;
      margin:4px auto 12px;
      padding:8px 10px;
      border-radius:10px;
      background:#0f172a;
      color:#e5e7eb;
      font-size:.85rem;
      text-align:left;
      box-shadow:0 10px 25px rgba(15,23,42,.25);
    }
    .testtitle-hint-title {
      font-weight:600;
      margin-bottom:4px;
      font-size:.9rem;
    }
    .testtitle-hint-footer {
      margin-top:6px;
      text-align:right;
    }

    /* ★ Test チュートリアルモーダル用 */
    .testtitle-modal-backdrop {
      position:fixed;inset:0;
      background:rgba(15,23,42,.45);
      display:flex;align-items:center;justify-content:center;
      z-index:9999;
    }
    .testtitle-modal {
      max-width:420px;width:calc(100% - 40px);
      background:#ffffff;
      border-radius:16px;
      padding:16px 18px 14px;
      box-shadow:0 20px 40px rgba(15,23,42,.35);
      text-align:left;
      font-size:.9rem;
      line-height:1.5;
      box-sizing:border-box;
    }
    .testtitle-modal h2 {
      margin:0 0 8px;
      font-size:1rem;
      font-weight:600;
    }
    .testtitle-modal-footer {
      margin-top:12px;
      display:flex;
      justify-content:flex-end;
    }
  `;
  document.head.appendChild(st);
}

function readCurrentLevel() {
  return Number(
    localStorage.getItem("jpVocab.currentLevel") ||
    sessionStorage.getItem("selectedLevel")      ||
    localStorage.getItem("jpVocab.level")        ||
    1
  );
}

// --- メインの描画関数 ---
export async function render(el, deps = {}) {
  ensureStyle();

  const wrap = document.createElement("div");
  wrap.className = "screen screen-testtitle";

  wrap.innerHTML = `
    <h1 id="title"></h1>
    <div id="practiceHintAnchor"></div>
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
  const lv        = readCurrentLevel();
  const titleEl   = wrap.querySelector("#title");
  const metaEl    = wrap.querySelector("#meta");
  const normalBtn = wrap.querySelector('[data-mode="normal"]');
  const hardBtn   = wrap.querySelector('[data-mode="hard"]');
  const startBtn  = wrap.querySelector("#start");
  const backBtn   = wrap.querySelector("#back");

  // ★ Practiceヒントを表示する（初回だけ）
  const maybeShowPracticeHint = () => {
    try {
      if (localStorage.getItem(PRACTICE_HINT_KEY) === "1") return;
    } catch {}

    const anchor = wrap.querySelector("#practiceHintAnchor");
    if (!anchor) return;

    const hint = document.createElement("div");
    hint.className = "testtitle-hint";
    const title = t("tutorial.practiceTitle") || "Tip: Practice before Test";
    const body  =
      t("tutorial.practiceBody") ||
      'You can review this level in "Practice" before starting the Test.';

    hint.innerHTML = `
      <div class="testtitle-hint-title">${title}</div>
      <div>${body}</div>
      <div class="testtitle-hint-footer">
        <button type="button" class="btn btn--small" id="practiceHintOk">
          ${t("tutorial.ok") || "OK"}
        </button>
      </div>
    `;

    anchor.replaceWith(hint);

    hint.querySelector("#practiceHintOk")?.addEventListener("click", () => {
      hint.remove();
      try { localStorage.setItem(PRACTICE_HINT_KEY, "1"); } catch {}
    });
  };

  // ★ Testチュートリアルモーダル（OKで閉じるだけ）
  const showTestTutorial = () => {
    const overlay = document.createElement("div");
    overlay.className = "testtitle-modal-backdrop";

    const title = t("tutorial.testTitle") || "How to use Test mode";
    const bodyHtml =
      t("tutorial.testBody") ||
      [
        "・First, tap a word on the left.",
        "・Then tap the matching Japanese on the right.",
        "・You have limited time and 3 hearts.",
        "・You can turn off Read Aloud and Furigana at the top of the screen.",
        "・If you leave the app (phone call / LINE), the timer will pause."
      ].join("<br>");

    overlay.innerHTML = `
      <div class="testtitle-modal">
        <h2>${title}</h2>
        <div>${bodyHtml}</div>
        <div class="testtitle-modal-footer">
          <button type="button" class="btn" id="testTutOk">
            ${t("tutorial.ok") || "OK"}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#testTutOk")?.addEventListener("click", () => {
      try { localStorage.setItem(TEST_TUTORIAL_KEY, "1"); } catch {}
      overlay.remove();      // ★ Quiz には進まず、この画面に残る
    });
  };

  // --- 問題数と時間の計算 ---
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

  const secPerQuestion = (m) => (m === "hard" ? HARD_SEC_PER_Q : NORMAL_SEC_PER_Q);

  const updateUI = () => {
    titleEl.textContent = t("level.label", { n: lv }) || `Level ${lv}`;

    const totalSecs = q * secPerQuestion(mode);
    const mm = Math.floor(totalSecs / 60);
    const ss = String(totalSecs % 60).padStart(2, "0");
    metaEl.textContent = `${q} ${t("common.questions")} · ${mm}:${ss}`;

    normalBtn.querySelector("span").textContent =
      `${NORMAL_SEC_PER_Q}s × ${q} = ${q * NORMAL_SEC_PER_Q}s`;
    hardBtn.querySelector("span").textContent =
      `${HARD_SEC_PER_Q}s × ${q} = ${q * HARD_SEC_PER_Q}s`;

    normalBtn.classList.toggle("mode-btn--active", mode === "normal");
    hardBtn.classList.toggle("mode-btn--active", mode === "hard");
  };

  const saveState = () => {
    try {
      localStorage.setItem(DIFF_KEY, mode);
      localStorage.setItem(SEC_PER_Q_KEY, String(secPerQuestion(mode)));
    } catch {}
  };

  normalBtn.addEventListener("click", () => {
    mode = "normal";
    updateUI();
    saveState();
  });

  hardBtn.addEventListener("click", () => {
    mode = "hard";
    updateUI();
    saveState();
  });

  // --- 初期表示 ---
  updateUI();
  saveState();
  maybeShowPracticeHint();   // ★ Practice ヒント（初回だけ）

  // --- ボタン ---
  startBtn.addEventListener("click", () => {
    let seen = false;
    try {
      seen = localStorage.getItem(TEST_TUTORIAL_KEY) === "1";
    } catch {}

    if (!seen) {
      // ★ まだ見ていない場合はチュートリアルだけ出して終わり
      showTestTutorial();
      return;
    }

    // ★ 2回目以降は普通にテストへ
    deps.goto?.("quiz");
  });

  backBtn.addEventListener("click", () => deps.goto?.("menu3"));
}
