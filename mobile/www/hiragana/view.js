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
  ttsSetLang("ja-JP");

  let curKana = "あ"; // 直近でタップされた仮名

  const root = document.createElement("div");
  root.className = "screen";
  el.appendChild(root);

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:520px;margin:0 auto;";
  root.appendChild(wrap);

  function header() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h1 style="margin:0;">ひらがな</h1>
        <button id="back" class="btn" style="padding:.35rem .7rem;">Back</button>
      </div>`;
  }

  // --- 2) 50音表（行セレクタなし・テストなし） ---
  function gridHTML() {
    return ROWS.map(row => {
      const cells = row.items.map(it => {
        const hole = !it.k || it.k === "・";
        return `<button class="btn" data-k="${it.k || ""}" ${
          hole ? "disabled" : ""
        } style="height:48px;font-size:1.2rem;${hole ? "opacity:0;pointer-events:none;" : ""}">
          ${hole ? "" : it.k}
        </button>`;
      }).join("");
      return `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">${cells}</div>`;
    }).join("");
  }

  // --- 3) カード ---
  function cardHTML() {
    const ex = KANA_MAP.get(curKana) || { kanji: "", yomi: "" };
    const exText = ex.kanji ? `${ex.kanji}${ex.yomi ? `（${ex.yomi}）` : ""}` : "";
    return `
      <div id="card" style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa">
        <div style="font-size:2.2rem;font-weight:700">${curKana}</div>
        <div style="margin-top:6px;font-size:1.1rem;display:flex;gap:12px;align-items:center">
          <button class="btn" id="again" style="padding:.35rem .6rem;">🔁 もう一回</button>
          <span id="ex" style="cursor:pointer">${exText}</span>
        </div>
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

  function wireCardEvents() {
    wrap.querySelector("#again")?.addEventListener("click", () => speak(curKana));
    wrap.querySelector("#ex")?.addEventListener("click", () => {
      const ex = KANA_MAP.get(curKana);
      if (ex?.yomi) speak(ex.yomi);
    });
  }

  // 初期表示
  mountGrid();

  // 画面離脱時にTTS停止
  const onHide = () => stop();
  window.addEventListener("pagehide", onHide, { once: true });
}
