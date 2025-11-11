// mobile/www/hiragana/view.js
import { t } from "../i18n.js";
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS } from "./data.hira.js";

// ========== 例語ルックアップ（仮名→{kanji,yomi}） ==========
const KANA_MAP = new Map();
for (const row of ROWS) {
  for (const it of (row.items || [])) {
    if (it?.k && it.k !== "・") {
      KANA_MAP.set(it.k, it.ex || { kanji: "", yomi: "" });
    }
  }
}

// ========== 変形テーブル ==========
const FIVE = ["あ","い","う","え","お"];
const BASE_TO_DAKU = {
  // か→が / さ→ざ / た→だ / は→ば
  "か":"が","き":"ぎ","く":"ぐ","け":"げ","こ":"ご",
  "さ":"ざ","し":"じ","す":"ず","せ":"ぜ","そ":"ぞ",
  "た":"だ","ち":"ぢ","つ":"づ","て":"で","と":"ど",
  "は":"ば","ひ":"び","ふ":"ぶ","へ":"べ","ほ":"ぼ",
};
const BASE_TO_HANDAKU = {
  // は→ぱ
  "は":"ぱ","ひ":"ぴ","ふ":"ぷ","へ":"ぺ","ほ":"ぽ",
};
// 小書き（ゃゅょっ＋母音小文字）
const SMALL_OF = {
  "あ":"ぁ","い":"ぃ","う":"ぅ","え":"ぇ","お":"ぉ",
  "や":"ゃ","ゆ":"ゅ","よ":"ょ","つ":"っ","わ":"ゎ"
};

// ========== ユーティリティ ==========
function transformKana(k, mode) {
  if (!k || k === "・") return k;

  if (mode === "dakuten") {
    return BASE_TO_DAKU[k] || k;
  }
  if (mode === "handaku") {
    return BASE_TO_HANDAKU[k] || k;
  }
  if (mode === "small") {
    // “や行”は ゃ・ゅ・ょ / “つ”は っ / 母音は ぁぃぅぇぉ
    if (k === "や" || k === "ゆ" || k === "よ" || k === "つ" || FIVE.includes(k) || k === "わ") {
      return SMALL_OF[k] || k;
    }
    // その他は小書きが無いので穴にする
    return "・";
  }
  return k; // base
}

function exampleOf(k) {
  const ex = KANA_MAP.get(k);
  if (ex?.kanji || ex?.yomi) return ex;
  return null;
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
  `;
  document.head.appendChild(st);
}

// ==========================================================
export async function render(el, deps = {}) {
  ensureStyle();
  ttsSetLang("ja-JP");

  let mode = "base";           // "base" | "dakuten" | "handaku" | "small"
  let curKana = "あ";          // 直近でタップされた仮名（変形後を保持）
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
        <button id="back" class="btn" style="padding:.35rem .7rem;">${t("common.back") || "Back"}</button>
      </div>
    `;
  }

  function togglesHTML() {
    return `
      <div class="hira-toggles">
        <button class="tbtn ${mode==="dakuten"?"on":""}" id="tg-daku">゛</button>
        <button class="tbtn ${mode==="handaku"?"on":""}" id="tg-handaku">゜</button>
        <button class="tbtn ${mode==="small"?"on":""}" id="tg-small">小</button>
        <button class="tbtn" id="tg-reset">⟳</button>
      </div>
    `;
  }

  function gridHTML() {
    return ROWS.map((row, rowIdx) => {
      const rowClass = (rowIdx % 2 === 0) ? "hiraA" : "hiraB";
      const cells = row.items.map(it => {
        let k = it.k || "";
        if (!k || k === "・") return `<button class="btn ${rowClass}" disabled style="opacity:0;pointer-events:none;"> </button>`;
        const tk = transformKana(k, mode);
        const hole = (!tk || tk === "・");
        return `<button class="btn ${rowClass}" data-base="${k}" data-k="${hole?"":tk}" ${hole?"disabled":""}>${hole?"":tk}</button>`;
      }).join("");
      return `<div class="hira-grid">${cells}</div>`;
    }).join("");
  }

  function cardHTML() {
    const ex = exampleOf(curKana);
    const exHtml = ex
      ? `<button id="ex" class="hira-exbtn row-full">
           <span>🔊</span>
           <span style="font-size:1.2rem;">${ex.kanji}</span>
           <span style="font-size:1rem;color:#374151;">${ex.yomi ? `（${ex.yomi}）` : ""}</span>
         </button>`
      : "";
    return `
      <div class="hira-card">
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="kana">${curKana}</div>
          <button class="btn" id="again" style="padding:.32rem .6rem;font-size:.95rem;">${t("hira.again")||"Play again"}</button>
        </div>
        ${exHtml ? `<div style="margin-top:8px;">${exHtml}</div>` : ""}
      </div>
    `;
  }

  function renderAll() {
    // ラッパにモード用クラス
    root.classList.remove("mode-dakuten","mode-handaku","mode-small");
    if (mode==="dakuten") root.classList.add("mode-dakuten");
    if (mode==="handaku") root.classList.add("mode-handaku");
    if (mode==="small")   root.classList.add("mode-small");

    wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML();

    // 戻る
    wrap.querySelector("#back")?.addEventListener("click", () => deps.goto?.("menu1"));

    // トグル
    wrap.querySelector("#tg-daku")?.addEventListener("click", () => {
      mode = (mode==="dakuten") ? "base" : "dakuten";
      // は行問題時のリセット用は ⟳ で明示対応
      renderAll();
      // 現在の表示仮名をモードに合わせて再計算（音も一声）
      const base = wrap.querySelector('button[data-base][data-k]')?.getAttribute("data-base") || curKana;
      const next = transformKana(base, mode);
      if (next && next !== "・") { curKana = next; speak(curKana); }
    });
    wrap.querySelector("#tg-handaku")?.addEventListener("click", () => {
      mode = (mode==="handaku") ? "base" : "handaku";
      renderAll();
      const base = wrap.querySelector('button[data-base][data-k]')?.getAttribute("data-base") || curKana;
      const next = transformKana(base, mode);
      if (next && next !== "・") { curKana = next; speak(curKana); }
    });
    wrap.querySelector("#tg-small")?.addEventListener("click", () => {
      mode = (mode==="small") ? "base" : "small";
      renderAll();
      // small は対象外が多いので curKana はそのまま読み直し
      speak(curKana);
    });
    wrap.querySelector("#tg-reset")?.addEventListener("click", () => {
      mode = "base";
      renderAll();
      // 現在の仮名を可能なら基底に戻す（濁点/半濁点を外す）
      const base = [...KANA_MAP.keys()].find(b => transformKana(b,"dakuten")===curKana || transformKana(b,"handaku")===curKana) || curKana;
      curKana = base;
      speak(curKana);
    });

    // 表タップ → curKana更新 → カード差し替え＆読み上げ
    wrap.querySelectorAll("button[data-k]").forEach(b => {
      b.addEventListener("click", () => {
        const k = b.getAttribute("data-k");
        if (!k || k === "・") return;
        curKana = k;
        // カード差し替え
        const cardWrap = wrap.querySelector(".hira-card");
        if (cardWrap) cardWrap.outerHTML = cardHTML();
        wireCardEvents();
        speak(curKana);
      });
    });

    wireCardEvents();
  }

  function wireCardEvents() {
    // もう一回
    wrap.querySelector("#again")?.addEventListener("click", () => speak(curKana));
    // 例語（あるときだけ）
    const exBtn = wrap.querySelector("#ex");
    if (exBtn) {
      exBtn.addEventListener("click", () => {
        const ex = exampleOf(curKana);
        if (ex?.yomi) speak(ex.yomi);
      });
    }
  }

  // 初期描画
  renderAll();

  // 画面離脱でTTS停止
  const onHide = () => stop();
  window.addEventListener("pagehide", onHide, { once:true });
}
