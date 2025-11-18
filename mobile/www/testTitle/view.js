// app/testTitle/view.js
import { t } from "../i18n.js";
import { loadLevel } from "../data/loader.js";
import { MAX_Q } from "../config.js";

function readCurrentLevel() {

  // ===== スタイルを追加（中央寄せレイアウト）=====
if (!document.querySelector('style[data-testtitle-style]')) {
  const st = document.createElement('style');
  st.setAttribute('data-testtitle-style', '1');
  st.textContent = `
  .screen-testtitle {
    display: flex;
    flex-direction: column;
    align-items: center;       /* 横中央 */
    justify-content: center;   /* 縦中央 */
    min-height: 100svh;        /* 画面全体で中央寄せ */
    text-align: center;
    padding: 24px;
    box-sizing: border-box;
  }

  .screen-testtitle h1 {
    font-size: clamp(22px, 4vw, 36px);
    margin-bottom: 16px;
  }

  .screen-testtitle p {
    font-size: clamp(15px, 2vw, 18px);
    color: #374151;
    margin-bottom: 24px;
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
     <div id="meta"></div>
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
  const secs = q * 5;
   wrap.querySelector("#meta").textContent =
     `${q} ${t("quiz.questions")} · ${Math.floor(secs/60)}:${String(secs%60).padStart(2,"0")}`;
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
