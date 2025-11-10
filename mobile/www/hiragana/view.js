// mobile/www/hiragana/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS } from "./data.hira.js";

export async function render(el, deps = {}) {
  ttsSetLang("ja-JP");
  let mode = "grid";
  let curKana = "あ", curRow = 0;
  let q = 0, maxQ = 12, hearts = 3, score = 0, answer = null;

  const root = document.createElement("div");
  root.className = "screen";
  el.appendChild(root);

  function ui(){ root.innerHTML =
`<h1 style="margin:0 0 8px;">ひらがな</h1>
<div id="wrap"></div>`;
    if(mode==="grid") renderGrid();
    else renderTest();
  }

  function renderGrid(){
    const r = ROWS[curRow];
    const g = document.createElement("div");
    g.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:8px 0 12px;">
        ${ROWS.map(row=>row.kana.map(k=>`<button class="btn" data-k="${k}">${k}</button>`).join("")).join("")}
      </div>
      <div style="border:1px solid #eee;border-radius:12px;padding:12px;margin:0 0 12px;">
        <div style="font-size:2rem;font-weight:700">${curKana}</div>
        <div style="margin-top:6px;font-size:1.1rem;display:flex;gap:12px;align-items:center">
          <button class="btn" id="again">🔁 もう一回</button>
          <span id="ex" style="cursor:pointer">${r.ex.kanji}（${r.ex.yomi}）</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="rowSel">${ROWS.map((row,i)=>`<option value="${i}">${row.name}</option>`).join("")}</select>
        <button class="btn" id="start">この行をテスト</button>
        <button class="btn" id="back">Back</button>
      </div>`;
    root.querySelector("#wrap").replaceWith(g);

    g.querySelectorAll("button[data-k]").forEach(b=>{
      b.onclick=()=>{ curKana=b.dataset.k; speak(curKana); };
    });
    g.querySelector("#again").onclick=()=>speak(curKana);
    g.querySelector("#ex").onclick = ()=> speak(ROWS[curRow].ex.yomi);
    g.querySelector("#rowSel").value = String(curRow);
    g.querySelector("#rowSel").onchange = e=>{ curRow=Number(e.target.value); };
    g.querySelector("#start").onclick = startTest;
    g.querySelector("#back").onclick  = ()=> deps.goto?.("menu1");
  }

  function startTest(){
    mode="test"; q=0; hearts=3; score=0; answer=null;
    nextQ();
    ui();
  }
  function nextQ(){
    const set = ROWS[curRow].kana;
    answer = set[Math.floor(Math.random()*set.length)];
    speak(answer);
  }

  function renderTest(){
    const set = ROWS[curRow].kana;
    const w = document.createElement("div");
    w.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;">
        <div>${ROWS[curRow].name} · ${q}/${maxQ}</div>
        <div>❤${"❤".repeat(hearts-1)}</div>
      </div>
      <div style="display:flex;gap:8px;margin:0 0 12px;">
        <button class="btn" id="again">🔁 もう一回</button>
        <button class="btn" id="quit">終了</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">
        ${set.map(k=>`<button class="btn" data-k="${k}">${k}</button>`).join("")}
      </div>`;
    root.querySelector("#wrap").replaceWith(w);

    w.querySelector("#again").onclick = ()=>speak(answer);
    w.querySelector("#quit").onclick  = ()=>{ mode="grid"; ui(); };
    w.querySelectorAll("button[data-k]").forEach(b=>{
      b.onclick=()=>{
        const ok = b.dataset.k === answer;
        if(ok) score++; else hearts = Math.max(0, hearts-1);
        q++;
        if(q>=maxQ || hearts===0){ toast(`${score}/${q} ✔`); mode="grid"; ui(); return; }
        nextQ(); renderTest();
      };
    });
  }

  function toast(m){ const t=document.createElement("div");
    t.style.cssText="position:fixed;top:12px;right:12px;background:#10b981;color:#fff;padding:8px 12px;border-radius:10px;z-index:9999";
    t.textContent=m; document.body.appendChild(t); setTimeout(()=>t.remove(),1200);
  }

  window.addEventListener("pagehide", stop, {once:true});
  ui();
}

