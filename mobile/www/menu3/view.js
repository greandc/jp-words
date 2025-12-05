// app/features/menu3/view.js
import { t, getLang, setLang } from "../i18n.js";

// ★ Practice チュートリアル表示済みフラグ
const LS_PRACTICE_HINT = "jpVocab.tutorial.practiceHintShown";

function ensureMenu3HintStyle() {
  if (document.getElementById("menu3-hint-style")) return;
  const st = document.createElement("style");
  st.id = "menu3-hint-style";
  st.textContent = `
    .menu3-hint {
      background:#0f172a;
      color:#e5e7eb;
      border-radius:12px;
      padding:10px 12px;
      margin:0 0 12px;
      box-shadow:0 10px 25px rgba(15,23,42,.28);
      font-size:.85rem;
      line-height:1.5;
      width:100%;
      max-width:480px;
      box-sizing:border-box;
    }
    .menu3-hint-title {
      font-weight:600;
      margin-bottom:4px;
      font-size:.9rem;
    }
    .menu3-hint-footer {
      margin-top:6px;
      text-align:right;
    }
    .menu3-hint-footer .btn-mini {
      font-size:.8rem;
      padding:.25rem .7rem;
      border-radius:999px;
    }
  `;
  document.head.appendChild(st);
}

/**
 * Mode 選択画面（Practice / Test）
 * - 直前に選んだレベルを state / storage から復元
 */
export async function render(el, deps = {}) {
  ensureMenu3HintStyle();

  // ---- レベル確定（state → storage の順に復元）----
  const ensureLevel = () => {
    let n = deps.level?.(); // state から

    if (!n) {
      const s =
        sessionStorage.getItem("selectedLevel") ??
        localStorage.getItem("jpVocab.level");
      if (s) n = Number(s);
    }

    if (n) {
      // state に反映（range / set を整える）
      const st = deps.getState?.();
      const cur = st?.range || [1, 20];
      const inRange = n >= cur[0] && n <= cur[1];
      if (!inRange) {
        const base = Math.floor((n - 1) / 20) * 20 + 1; // 1,21,41,...
        deps.setRange?.([base, base + 19]);
      }
      const [a] = deps.getState?.().range || [1, 20];
      const set = n - a + 1;
      deps.setSet?.(set);
    }
    return n;
  };

  const levelNum = ensureLevel();
  if (!levelNum) {
    alert("Select a set first.");
    return deps.goto?.("menu2");
  }

  // ---- 画面骨組み ----
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <div style="
      position:fixed; inset:0;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      padding:24px 16px; box-sizing:border-box;
      overflow:hidden;
    ">
      <h1 style="text-align:center;margin:0 0 16px;">
        ${t("level.label", { n: levelNum }) || `${t("level") || "Level"} ${levelNum}`}
      </h1>

      <!-- Practice ヒント差し込み用スロット -->
      <div id="menu3-practice-hint-slot" style="width:100%;max-width:480px;"></div>

      <div style="
        display:grid; gap:12px;
        grid-template-columns:1fr;
        width:100%; max-width:480px;
      ">
        <button class="btn" id="btnPractice">${t("menu3.practice") || "Practice"}</button>
        <button class="btn" id="btnTest">${t("menu3.test") || "Test"}</button>
        <button class="btn" id="btnBack">${t("common.back") || "Back"}</button>
      </div>
    </div>
  `;

  el.appendChild(div);

  // ---- Practice ヒント（初回だけ）----
  (function maybeShowPracticeHint() {
    try {
      if (localStorage.getItem(LS_PRACTICE_HINT) === "1") return;
    } catch {}

    const slot = div.querySelector("#menu3-practice-hint-slot");
    if (!slot) return;

    const box = document.createElement("div");
    box.className = "menu3-hint";

    const title =
      t("tutorial.practiceTitle") || "Tip: Practice before Test";
    const body =
      t("tutorial.practiceBody") ||
      'You can use "Practice" to review this level before starting the Test.';

    box.innerHTML = `
      <div class="menu3-hint-title">${title}</div>
      <div>${body}</div>
      <div class="menu3-hint-footer">
        <button type="button" class="btn btn-mini" id="menu3PracticeHintOk">
          ${t("tutorial.ok") || "OK"}
        </button>
      </div>
    `;

    slot.replaceWith(box);

    box.querySelector("#menu3PracticeHintOk")?.addEventListener("click", () => {
      box.remove();
      try { localStorage.setItem(LS_PRACTICE_HINT, "1"); } catch {}
    });
  })();

  // ---- ボタン配線 ----
  div.querySelector("#btnPractice")?.addEventListener("click", () => {
    deps.setMode?.("practice");
    try {
      localStorage.setItem("jpVocab.level", String(levelNum));
    } catch {}
    deps.goto?.("practice");
  });

  div.querySelector("#btnTest")?.addEventListener("click", () => {
    // A) localStorage から直読み（あれば優先）
    let lv = Number(localStorage.getItem("jpVocab.level")) || 0;

    // B) 無ければ state から復元
    if (!lv) {
      const st = deps.getState?.();
      const [a] = st?.range || [1, 20]; // 範囲の先頭
      const set = st?.set || 1;         // セット (1..20)
      lv = a + (set - 1);
    }
    if (!lv) lv = 1;

    // C) 3か所に揃えて保存
    try {
      sessionStorage.setItem("selectedLevel", String(lv));
      localStorage.setItem("jpVocab.currentLevel", String(lv));
      localStorage.setItem("jpVocab.level", String(lv));
    } catch {}

    console.log("[menu3] set level =", lv);

    // D) testTitle へ
    deps.goto?.("testTitle");
  });

  div.querySelector("#btnBack")?.addEventListener("click", () => {
    deps.goto?.("menu2");
  });
}
