// mobile/www/hiragana/view.js
import { t } from "../i18n.js";
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS } from "./data.hira.js";

// かな変換ユーティリティ
const ROW_K = {
  ka: ["か","き","く","け","こ"],
  sa: ["さ","し","す","せ","そ"],
  ta: ["た","ち","つ","て","と"],
  ha: ["は","ひ","ふ","へ","ほ"],
};
const DAKU = {
  ka: ["が","ぎ","ぐ","げ","ご"],
  sa: ["ざ","じ","ず","ぜ","ぞ"],
  ta: ["だ","ぢ","づ","で","ど"],
  ha: ["ば","び","ぶ","べ","ぼ"],
};
const HANDAKU = ["ぱ","ぴ","ぷ","ぺ","ぽ"];
const SMALL_MAP = { や:"ゃ", ゆ:"ゅ", よ:"ょ", つ:"っ", わ:"ゎ", あ:"ぁ", い:"ぃ", う:"ぅ", え:"ぇ", お:"ぉ" };
const UNSMALL_MAP = Object.fromEntries(Object.entries(SMALL_MAP).map(([k,v])=>[v,k]));

// 清音 → 対応ダク点/半濁/小字への変換（必要な所だけ）
function applyKanaTransform(k, flags){
  const { daku=false, handaku=false, small=false } = flags || {};
  let out = k;

  // 行・列を特定
  for (const rowKey of ["ka","sa","ta","ha"]) {
    const idx = ROW_K[rowKey].indexOf(k);
    if (idx !== -1) {
      if (handaku && rowKey==="ha")      out = HANDAKU[idx];
      else if (daku)                     out = DAKU[rowKey][idx];
      return small ? (SMALL_MAP[out] || out) : out;
    }
  }
  // 清音以外の普通の行（あ/な/ま/ら/…）
  out = small ? (SMALL_MAP[out] || out) : out;
  return out;
}

// 例語検索用：表示文字を清音へ戻す
function normalizeKana(k){
  if (UNSMALL_MAP[k]) k = UNSMALL_MAP[k];
  // 濁点/半濁 → 清音
  for (const rowKey of ["ka","sa","ta","ha"]) {
    const idxD = (DAKU[rowKey]||[]).indexOf(k);
    if (idxD !== -1) return ROW_K[rowKey][idxD];
  }
  const idxH = HANDAKU.indexOf(k);
  if (idxH !== -1) return ROW_K.ha[idxH];
  return k;
}


// ========== 例語ルックアップ（仮名→{kanji,yomi}） ==========
const KANA_MAP = new Map();
for (const row of ROWS) {
  for (const it of (row.items || [])) {
    if (it?.k && it.k !== "・") {
      KANA_MAP.set(it.k, it.ex || { kanji: "", yomi: "" });
    }
  }
}

// ========== スタイル注入 ==========
function ensureStyle() {
  if (document.getElementById("hira-style-v2")) return;
  const st = document.createElement("style");
  st.id = "hira-style-v2";
  st.textContent = `
    .hira-wrap { display:flex; flex-direction:column; gap:12px; max-width:560px; margin:0 auto; }

    /* 例語ボタン（押せる感） */
    .hira-exbtn {
      display:inline-flex; align-items:baseline; gap:.5rem;
      padding:.45rem .7rem; border:1px solid #e5e7eb; border-radius:12px;
      background:#fff; box-shadow:0 1px 0 rgba(0,0,0,.02);
      width:100%; justify-content:flex-start;
    }
    .hira-exbtn:hover { filter:brightness(0.98); }

    /* 格子 */
    .hira-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
    .hira-grid .btn { font-weight:700; height:48px; }

    /* 行のシマ模様（見やすさ）*/
    .hiraA { background:#f0f7ff; border-color:#d7e8ff; }
    .hiraB { background:#f7f9ff; border-color:#e5e9ff; }

    /* モードによって全体の色味を切替 */
    .mode-dakuten .hiraA, .mode-dakuten .hiraB { background:#fff3f3; border-color:#ffd9d9; }
    .mode-handaku .hiraA, .mode-handaku .hiraB { background:#fff8e8; border-color:#ffe6b3; }
    .mode-small   .hiraA, .mode-small   .hiraB { background:#eefaf4; border-color:#cfeedd; }

    /* トグル群 */
    .hira-toggles { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .hira-toggles .tbtn { padding:.4rem .7rem; border-radius:999px; border:1px solid #e5e7eb; background:#fff; }
    .hira-toggles .tbtn.on { border-color:#0ea5e9; box-shadow:0 0 0 2px rgba(14,165,233,.15) inset; background:#eaf6ff; }

    /* カード */
    .hira-card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fafafa; }
    .hira-card .kana { font-size:2.6rem; font-weight:700; line-height:1; }
    .row-full { width:100%; }

    .hiraChanged { background:#fee2e2 !important; border-color:#fecaca !important; }

  `;
  document.head.appendChild(st);
}

// ==========================================================
export async function render(el, deps = {}) {
  ensureStyle();
  ttsSetLang("ja-JP");

  let mode = "base";           // "base" | "dakuten" | "handaku" | "small"
  let curKana = "あ";          // 直近でタップされた仮名（変形後を保持）
  let flags = { daku:false, handaku:false, small:false };

  const root = document.createElement("div");
  root.className = "screen";
  el.appendChild(root);

  const wrap = document.createElement("div");
  wrap.className = "hira-wrap";
  root.appendChild(wrap);

  function headerHTML() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1 style="margin:0;">ひらがな</h1>
      <button id="back" class="btn" style="padding:.35rem .7rem;">
        ${t("common.back") || "Back"}
      </button>
    </div>
  `;
}


 function togglesHTML(){
  return `
    <div id="hira-toggles" class="hira-toggles"
         style="display:flex;gap:8px;margin:10px 0 6px;align-items:center;border:1px dashed #cbd5e1;padding:6px 8px;border-radius:10px;background:#f8fafc;">
      <span style="font-size:.9rem;color:#475569;">モード：</span>
      <button class="btn tbtn" id="btnDaku"    title="濁点">゛</button>
      <button class="btn tbtn" id="btnHandaku" title="半濁点">゜</button>
      <button class="btn tbtn" id="btnSmall"   title="小書き">小</button>
      <button class="btn tbtn" id="btnReset"   title="リセット">⟳</button>
    </div>`;
}



function gridHTML(){
  return ROWS.map((row,rowIdx)=>{
    const cells = row.items.map(it=>{
      const base = it.k;
      const hole = !base || base==="・";
      if (hole) {
        return `<button class="btn" disabled style="opacity:0;pointer-events:none;height:48px;"></button>`;
      }
      // 表示文字
      const disp = transformKana(base, flags);
      const changed = (disp !== base) ? "hiraChanged" : "";
      return `<button class="btn ${changed}" data-k="${disp}" data-base="${base}"
                style="height:48px;font-size:1.2rem;">${disp}</button>`;
    }).join("");
    return `<div class="hira-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">${cells}</div>`;
  }).join("");
}


  function cardHTML(curKana){
  const base = normalizeKana(curKana);
  const ex = KANA_MAP.get(base) || { kanji:"", yomi:"" };
  return `
    <div id="card" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:2.4rem;font-weight:700;line-height:1">${curKana}</div>
        <button class="btn" id="again" style="padding:.32rem .6rem;font-size:.95rem;">🔁 ${t("hira.again")||"Play again"}</button>
      </div>
      <button id="ex" class="hira-exbtn" style="margin-top:8px;">
        <span style="font-size:1.2rem;">${ex.kanji}</span>
        <span style="font-size:1rem;color:#374151;">${ex.yomi ? `（${ex.yomi}）` : ""}</span>
      </button>
    </div>`;
}

// 追加：描画後にi18nラベルを確定させる
function applyI18nLabels() {
  const backBtn  = wrap.querySelector("#back");
  if (backBtn) backBtn.textContent = t("common.back") || "Back";

  const againBtn = wrap.querySelector("#again");
  if (againBtn) againBtn.innerHTML = `🔁 ${t("hira.again") || "Play again"}`;
}


function mountGrid(){
  // 1) 見出し + トグル + グリッド + カード
  wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML(curKana);
  applyI18nLabels();


  // 1.5) デバッグ：今トグルが DOM に居るかログ
  try {
    console.log("[hiragana] has toggles:", !!wrap.querySelector("#hira-toggles"));
  } catch (_) {}

  // 2) 念のため：見当たらなければ強制挿入（グリッドの直前）
  if (!wrap.querySelector("#hira-toggles")) {
    const tmp = document.createElement("div");
    tmp.innerHTML = togglesHTML();
    const firstGrid = wrap.querySelector(".hira-grid");
    if (firstGrid) firstGrid.parentNode.insertBefore(tmp.firstElementChild, firstGrid);
    else wrap.insertBefore(tmp.firstElementChild, wrap.firstChild?.nextSibling || null);
  }

  // 3) 戻る
  wrap.querySelector("#back")?.addEventListener("click", () => deps.goto?.("menu1"));

  // 4) 再描画ヘルパ
  const refresh = () => {
    wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML(curKana);
    wireEvents();
    applyI18nLabels();
  };

  // 5) トグル配線
  wrap.querySelector("#btnDaku")?.addEventListener("click", () => {
    flags.daku = !flags.daku; if (flags.daku) flags.handaku = false; refresh();
  });
  wrap.querySelector("#btnHandaku")?.addEventListener("click", () => {
    flags.handaku = !flags.handaku; if (flags.handaku) flags.daku = false; refresh();
  });
  wrap.querySelector("#btnSmall")?.addEventListener("click", () => {
    flags.small = !flags.small; refresh();
  });
  wrap.querySelector("#btnReset")?.addEventListener("click", () => {
    flags = { daku:false, handaku:false, small:false }; refresh();
  });

  // 6) 表クリック配線
  wireEvents();
}



function wireEvents(){
  // 50音表：ボタンクリック → curKana 更新 → カード差し替え → 読み上げ
  wrap.querySelectorAll("button[data-k]").forEach((b) => {
    b.onclick = () => {
      const k = b.getAttribute("data-k");
      if (!k || k === "・") return;
      curKana = k;

      // カード差し替え（id="card" を使う）
      const card = wrap.querySelector("#card");
      if (card) card.outerHTML = cardHTML(curKana);

      wireCardEvents();
      applyI18nLabels();
      speak(curKana);
    };
  });

  wireCardEvents(); // 初期カードにもイベント張る
}

function wireCardEvents(){
  // もう一回 → かなを読む
  wrap.querySelector("#again")?.addEventListener("click", () => speak(curKana));

  // 例語ボタン → よみを読む（清音に戻してから例語を取得）
  const base = normalizeKana(curKana);
  const ex   = KANA_MAP.get(base);
  wrap.querySelector("#ex")?.addEventListener("click", () => {
    if (ex?.yomi) speak(ex.yomi);
  });
}

  // 初期描画
  mountGrid();

  // 画面離脱でTTS停止
  const onHide = () => stop();
  window.addEventListener("pagehide", onHide, { once:true });
}
