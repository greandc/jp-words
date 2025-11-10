// mobile/www/hiragana/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS } from "./data.hira.js";

// --- 1) すべての仮名→例語 を行に依存せず引けるマップを用意 ---
const KANA_MAP = new Map();
for (const row of ROWS) {
  for (const it of (row.items || [])) {
    if (it?.k && it.k !== "・") {
      KANA_MAP.set(it.k, it.ex || { kanji: "", yomi: "" });
    }
  }
}

export async function render(el, deps = {}) {
  ensureStyle();
  ttsSetLang("ja-JP");
  const getEx = (k) => KANA_MAP.get(k) || { kanji:"", yomi:"" };

  let curKana = "あ"; // 直近でタップされた仮名

  const root = document.createElement("div");
  root.className = "screen";
  el.appendChild(root);

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:520px;margin:0 auto;";
  root.appendChild(wrap);

 function ensureStyle(){
  if (document.getElementById("hira-style")) return;
  const st = document.createElement("style");
  st.id = "hira-style";
  st.textContent = `
    :root{
  --hiraA-bg:#E0F2FE;  /* ← 案A: sky-200 */
  --hiraA-bd:#93C5FD;  /* sky-300 */
  --hiraB-bg:#E2E8F0;  /* slate-200 */
  --hiraB-bd:#CBD5E1;  /* slate-300 */

  --hira-btn-fg:#0F172A;      /* slate-900 */
  --hira-btn-shadow:0 1px 0 rgba(0,0,0,.06);
  --hira-ring:#60A5FA;        /* ring color */
}

/* 50音ボタン */
.hira-grid .btn{
  font-weight:600;
  border-radius:12px;
  box-shadow:var(--hira-btn-shadow);
  color:var(--hira-btn-fg);
  transition:transform .04s ease, filter .12s ease, box-shadow .12s ease;
}
.hiraA{ background:var(--hiraA-bg); border-color:var(--hiraA-bd); }
.hiraB{ background:var(--hiraB-bg); border-color:var(--hiraB-bd); }
.hira-grid .btn:hover{ filter:brightness(.98); }
.hira-grid .btn:active{ transform:translateY(1px); }
.hira-grid .btn:focus-visible{
  outline:2px solid var(--hira-ring);
  outline-offset:2px;
}

/* 例語ボタン（カード内） */
.hira-exbtn{
  display:inline-flex; align-items:baseline; gap:.5rem;
  padding:.45rem .7rem;
  border:1px solid #CBD5E1; border-radius:10px;
  background:#FFFFFF; box-shadow:var(--hira-btn-shadow);
  transition:transform .04s ease, filter .12s ease, box-shadow .12s ease;
}
.hira-exbtn:hover{ filter:brightness(.98); }
.hira-exbtn:active{ transform:translateY(1px); }
.hira-exbtn:focus-visible{
  outline:2px solid var(--hira-ring); outline-offset:2px;
}

  `;
  document.head.appendChild(st);
}

  function header() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h1 style="margin:0;">ひらがな</h1>
        <button id="back" class="btn" style="padding:.35rem .7rem;">Back</button>
      </div>`;
  }

  // --- 2) 50音表（行セレクタなし・テストなし） ---
 function gridHTML(){
  return ROWS.map((row, rowIdx)=>{
    const rowClass = (rowIdx % 2 === 0) ? "hiraA" : "hiraB"; // 1段飛ばし
    const cells = row.items.map(it=>{
      const hole = !it.k || it.k === "・";
      return `<button class="btn ${rowClass}" data-k="${it.k||""}" ${
        hole ? "disabled" : ""
      } style="height:48px;font-size:1.2rem;${hole?"opacity:0;pointer-events:none;":""}">
        ${hole?"":it.k}
      </button>`;
    }).join("");
    return `<div class="hira-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">${cells}</div>`;
  }).join("");
}

  // --- 3) カード ---
  function cardHTML(){
  const ex = getEx(curKana);
  return `
    <div id="card" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa">
      <!-- 1段目：仮名 + もう一回 -->
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:2.4rem;font-weight:700;line-height:1">${curKana}</div>
        <button class="btn" id="again" style="padding:.32rem .6rem;font-size:.95rem;">🔁 もう一回</button>
      </div>

      <!-- 2段目：例語（ボタン化） -->
      <button id="ex" class="hira-exbtn" style="margin-top:8px;">
        <span style="font-size:1.1rem;">🔊</span> <!-- ←ここ追加：音声アイコン -->
        <span style="font-size:1.2rem;">${ex.kanji}</span>
        <span style="font-size:1rem;color:#374151;">${ex.yomi ? `（${ex.yomi}）` : ""}</span>
      </button>
    </div>`;
}


  // --- 4) 一括描画（超シンプル） ---
  function mountGrid() {
    wrap.innerHTML = header() + gridHTML() + cardHTML();

    // 戻る
    wrap.querySelector("#back")?.addEventListener("click", () => deps.goto?.("menu1"));

    // 表タップ → curKana更新 → カード描画＆読み上げ
    wrap.querySelectorAll("button[data-k]").forEach(b => {
      b.onclick = () => {
        const k = b.getAttribute("data-k");
        if (!k || k === "・") return;
        curKana = k;
        // カード差し替え
        const card = wrap.querySelector("#card");
        if (card) card.outerHTML = cardHTML();
        // イベント再張り（again/ex）
        wireCardEvents();
        // 読み上げ
        speak(curKana);
      };
    });

    // 初期カードのイベント
    wireCardEvents();
  }

  function wireCardEvents(){
  // もう一回 → かな
  wrap.querySelector("#again")?.addEventListener("click", () => speak(curKana));

  // 例語 → よみ（かな）
  const ex = getEx(curKana);
  wrap.querySelector("#ex")?.addEventListener("click", () => {
    if (ex.yomi) speak(ex.yomi);
  });
}


  // 初期表示
  mountGrid();

  // 画面離脱時にTTS停止
  const onHide = () => stop();
  window.addEventListener("pagehide", onHide, { once: true });
}
