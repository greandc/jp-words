// app/features/menu3/view.js
import { t, getLang, setLang } from "../i18n.js";

/**
 * Mode 選択画面（Practice / Test）
 * - 直前に選んだレベルを state / storage から復元
 */
export async function render(el, deps = {}) {
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
    position:fixed; inset:0;                   /* ← 画面ぜんぶを覆う */
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;/* ← 完全センター */
    padding:24px 16px; box-sizing:border-box;
    overflow:hidden;                           /* ← スクロール禁止 */
  ">
    <h1 style="text-align:center;margin:0 0 20px;">
      ${t("level.label", { n: levelNum }) || `${t("level") || "Level"} ${levelNum}`}
    </h1>

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

  // ---- ボタン配線 ----
  div.querySelector("#btnPractice").addEventListener("click", () => {
    deps.setMode?.("practice");
    // 念のため現在レベルを保存
    try { localStorage.setItem("jpVocab.level", String(levelNum)); } catch {}
    deps.goto?.("practice");
  });

// --- 省略: 先頭の import と画面作成部分はそのまま ---

div.querySelector("#btnTest").addEventListener("click", () => {
  // A) まず localStorage から直読み（過去に選んだ値があれば最優先）
  let levelNum = Number(localStorage.getItem("jpVocab.level")) || 0;

  // B) 無ければ state から復元（range + set → 絶対レベル）
  if (!levelNum) {
    const st  = deps.getState?.();
    const [a] = st?.range || [1, 20];   // 範囲の先頭 (1,21,41,...)
    const set = st?.set   || 1;         // セット (1..20)
    levelNum = a + (set - 1);
  }

  if (!levelNum) levelNum = 1;

  // C) 3か所に**同じ値**を保存（どこからでも読めるようにする）
  try {
    sessionStorage.setItem("selectedLevel", String(levelNum));
    localStorage.setItem("jpVocab.currentLevel", String(levelNum));
    localStorage.setItem("jpVocab.level", String(levelNum));
  } catch {}

  console.log("[menu3] set level =", levelNum);

  // D) testTitle へ
  deps.goto?.("testTitle");
});

  div.querySelector("#btnBack").addEventListener("click", () => {
    deps.goto?.("menu2");
  });
}
