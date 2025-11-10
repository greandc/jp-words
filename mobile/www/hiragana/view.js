// mobile/www/hiragana/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS } from "./data.hira.js";

export async function render(el, deps = {}) {
  ttsSetLang("ja-JP");

  let mode = "grid";          // "grid" | "test"
  let curRow = 0;
  let curKana = "あ";
  let q = 0, maxQ = 10, hearts = 3, score = 0, answer = null;

  const root = document.createElement("div");
  root.className = "screen";
  el.appendChild(root);

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;max-width:520px;margin:0 auto;";
  root.appendChild(wrap);

  function toast(msg=""){ let t=document.getElementById("hiragana-toast");
    if(!t){ t=document.createElement("div"); t.id="hiragana-toast";
      t.style.cssText="position:fixed;top:12px;right:12px;background:#10b981;color:#fff;padding:8px 12px;border-radius:10px;z-index:9999";
      document.body.appendChild(t);
    }
    t.textContent=msg; t.style.opacity="1"; setTimeout(()=>t.style.opacity="0",1200);
  }

  // 現在行からかなアイテムを取得
  function findItem(rowIdx, k){
    const row = ROWS[rowIdx];
    return row?.items?.find(it => it.k === k) || null;
  }


  function header(){
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h1 style="margin:0;">${"ひらがな"}</h1>
        <button id="back" class="btn" style="padding:.35rem .7rem;">${"Back"}</button>
      </div>`;
  }

  function gridHTML(){
  return ROWS.map(row=>{
    const cells = row.items.map(it=>{
      const hole = !it.k || it.k === "・";
      return `<button class="btn" data-k="${it.k||""}" ${
        hole ? "disabled" : ""
      } style="height:48px;font-size:1.2rem;${hole?"opacity:0;pointer-events:none;":""}">
        ${hole?"":it.k}
      </button>`;
    }).join("");
    return `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">${cells}</div>`;
  }).join("");
}

  // ----- カードHTML -----
function cardHTML(){
  const it = findItem(curRow, curKana) || { ex:{kanji:"", yomi:""} };
  return `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa">
      <div style="font-size:2.2rem;font-weight:700">${curKana || ""}</div>
      <div style="margin-top:6px;font-size:1.1rem;display:flex;gap:12px;align-items:center">
        <button class="btn" id="again" style="padding:.35rem .6rem;">🔁 もう一回</button>
        <span id="ex" style="cursor:pointer">
          ${it.ex?.kanji ?? ""}${it.ex?.yomi ? `（${it.ex.yomi}）` : ""}
        </span>
      </div>
    </div>`;
}

// カードを差し替えてイベントを張り直す
function renderCard(root){
  const card = root.querySelector("#card");
  if (!card) return;
  card.innerHTML = cardHTML();

  // もう一回
  root.querySelector("#again")?.addEventListener("click", () => {
    if (curKana) speak(curKana);
  });
  // 例語を読む
  const it = findItem(curRow, curKana);
  root.querySelector("#ex")?.addEventListener("click", () => {
    const y = it?.ex?.yomi;
    if (y) speak(y);
  });
}


  function selectorHTML(){
  return `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <select id="rowSel">
        ${ROWS.map((row,i)=>`<option value="${i}">${row.name}</option>`).join("")}
      </select>
      <button class="btn" id="start">この行をテスト</button>
    </div>`;
}


  function testHTML(){
  const set = ROWS[curRow].items
    .filter(it=>it.k && it.k!=="・")
    .map(it=>it.k);
  const btns = set.map(k=>`<button class="btn" data-k="${k}" style="height:56px;font-size:1.2rem;">${k}</button>`).join("");
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>${ROWS[curRow].name} · ${q}/${maxQ}</div>
      <div>${"❤️".repeat(hearts)}${"🤍".repeat(Math.max(0,3-hearts))}</div>
    </div>
    <div style="display:flex;gap:8px;margin:8px 0 12px;">
      <button class="btn" id="listen">🔁 もう一回</button>
      <button class="btn" id="quit">終了</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">${btns}</div>
  `;
}

function nextQ(){
  const set = ROWS[curRow].items
    .filter(it=>it.k && it.k!=="・")
    .map(it=>it.k);
  answer = set[Math.floor(Math.random()*set.length)];
  speak(answer);
}

  function mountGrid(){
  // 1) 画面を描画（カードは“入れ物”を用意して中身は cardHTML()）
  wrap.innerHTML = header() + gridHTML() + `<div id="card">${cardHTML()}</div>` + selectorHTML();

  // 2) 戻る
  wrap.querySelector("#back").onclick = ()=> deps.goto?.("menu1");

  // 3) グリッド（かな）クリック → curKana 更新 → カード再描画 → 発声
  wrap.querySelectorAll("button[data-k]").forEach(b=>{
    b.onclick=()=>{
      const k = b.getAttribute("data-k");
      if (!k || k === "・") return;
      curKana = k;
      renderCard(wrap);     // ← ここでカードを差し替え
      speak(k);
    };
  });

  // 4) 行セレクタ変更 → その行の先頭の有効かなに切替 → カード再描画
  const sel = wrap.querySelector("#rowSel");
  sel.value = String(curRow);
  sel.onchange = e=>{
    curRow = Number(e.target.value);
    const first = (ROWS[curRow].items.find(it=>it.k && it.k!=="・") || {}).k || "あ";
    curKana = first;
    renderCard(wrap);
  };

  // 5) テスト開始（行テスト）
  const startBtn = wrap.querySelector("#start");
  if (startBtn){
    startBtn.onclick = ()=>{
      mode="test"; q=0; score=0; hearts=3; answer=null;
      nextQ(); mountTest();
    };
  }

  // 6) 初期カードのイベントを“確実に”張る
  renderCard(wrap);
}

  
  // 初期表示
  mountGrid();

  // 画面離脱時にTTS停止
  const onHide = ()=> stop();
  window.addEventListener("pagehide", onHide, { once:true });
}
