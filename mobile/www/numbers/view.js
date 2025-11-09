import { speak, stop } from "../tts.v2.js";

export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h1>数字</h1>
    <div id="disp" style="font:700 28px/1.2 system-ui;margin:8px 0 12px;">0</div>
    <div id="pad" style="display:grid;grid-template-columns:repeat(3,80px);gap:10px"></div>
    <div style="margin-top:12px">
      <button class="btn" id="speakBtn">読み上げ</button>
      <button class="btn" id="clearBtn">クリア</button>
      <button class="btn" id="backBtn">Back</button>
    </div>
  `;
  el.appendChild(div);

  const disp = div.querySelector("#disp");
  const pad  = div.querySelector("#pad");

  // 0-9 ＋ 00
  const keys = ["7","8","9","4","5","6","1","2","3","0","00"];
  keys.forEach(k=>{
    const b=document.createElement("button");
    b.className="btn"; b.textContent=k;
    b.onclick=()=>{
      const cur = disp.textContent.replace(/^0+$/,'');
      const next = (cur + k).replace(/^0+(?=\d)/,'');
      disp.textContent = next || "0";
    };
    pad.appendChild(b);
  });

  div.querySelector("#clearBtn").onclick = ()=>{ disp.textContent="0"; stop(); };
  div.querySelector("#backBtn").onclick  = ()=>{ stop(); deps.goto?.("menu1"); };
  div.querySelector("#speakBtn").onclick = ()=>{
    const n = Number(disp.textContent || "0");
    speak(toJPNumber(n), { lang:"ja-JP" });
  };
}

// 0〜9999 の日本語読み
function toJPNumber(n){
  n = Math.max(0, Math.min(9999, Math.floor(n)));
  if (n===0) return "ゼロ";
  const ichi = ["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"];
  const hyakuSp = {3:"さんびゃく",6:"ろっぴゃく",8:"はっぴゃく"};
  const senSp   = {3:"さんぜん",8:"はっせん"};
  const parts = [];

  const s = Math.floor(n/1000)%10;
  const h = Math.floor(n/100)%10;
  const t = Math.floor(n/10)%10;
  const o = n%10;

  if (s){
    parts.push(senSp[s] || (s===1 ? "せん" : ichi[s] + "せん"));
  }
  if (h){
    parts.push(hyakuSp[h] || (h===1 ? "ひゃく" : ichi[h] + "ひゃく"));
  }
  if (t){
    parts.push(t===1 ? "じゅう" : (ichi[t] + "じゅう"));
  }
  if (o){
    parts.push(ichi[o]);
  }
  return parts.join("");
}
