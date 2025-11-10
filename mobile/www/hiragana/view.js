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

  function cardHTML(){
  // 現在行の items から該当かなを探す
  const it = ROWS[curRow].items.find(x=>x.k===curKana) || { ex:{kanji:"", yomi:""} };
  return `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fafafa">
      <div style="font-size:2.2rem;font-weight:700">${curKana}</div>
      <div style="margin-top:6px;font-size:1.1rem;display:flex;gap:12px;align-items:center">
        <button class="btn" id="again" style="padding:.35rem .6rem;">🔁 もう一回</button>
        <span id="ex" style="cursor:pointer">${it.ex?.kanji ?? ""}${it.ex?.yomi ? `（${it.ex.yomi}）` : ""}</span>
      </div>
    </div>`;
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
  const set = ROWS[curRow].items.filter(it=>it.k && it.k!=="・").map(it=>it.k);
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
  function mountGrid(){
    wrap.innerHTML = header() + gridHTML() + cardHTML() + selectorHTML();

    wrap.querySelector("#back").onclick = ()=> deps.goto?.("menu1");

    wrap.querySelectorAll("button[data-k]").forEach(b=>{
      b.onclick=()=>{
        const k = b.getAttribute("data-k");
        if (k==="・") return;
        curKana = k;
        speak(k);
        // 例は選択行を維持
      };
    });

    wrap.querySelector("#again").onclick = ()=> speak(curKana);

    wrap.querySelector("#ex").onclick = ()=> {
      const r = ROWS[curRow]; speak(r.ex.yomi);
    };

    const sel = wrap.querySelector("#rowSel");
    sel.value = String(curRow);
    sel.onchange = e=>{ curRow = Number(e.target.value); };

    wrap.querySelector("#start").onclick = ()=>{
      mode="test"; q=0; score=0; hearts=3; answer=null;
      nextQ(); mountTest();
    };
  }

  function nextQ(){
    const set = ROWS[curRow].kana.filter(k=>k!=="・");
    answer = set[Math.floor(Math.random()*set.length)];
    // 出題音声
    speak(answer);
  }

  function mountTest(){
    wrap.innerHTML = header() + testHTML();

    wrap.querySelector("#back").onclick = ()=> { mode="grid"; mountGrid(); };
    wrap.querySelector("#listen").onclick = ()=> speak(answer);
    wrap.querySelector("#quit").onclick   = ()=> { mode="grid"; mountGrid(); };

    wrap.querySelectorAll("button[data-k]").forEach(b=>{
      b.onclick=()=>{
        const ok = b.getAttribute("data-k") === answer;
        if (ok) score++; else hearts = Math.max(0, hearts-1);
        q++;
        if (q>=maxQ || hearts===0){
          toast(`結果: ${score}/${q}`);
          mode="grid"; mountGrid(); return;
        }
        nextQ(); mountTest();
      };
    });
  }

  // 初期表示
  mountGrid();

  // 画面離脱時にTTS停止
  const onHide = ()=> stop();
  window.addEventListener("pagehide", onHide, { once:true });
}
