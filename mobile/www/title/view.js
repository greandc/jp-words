// app/features/title/view.js
import { t } from "../i18n.js";
// mobile/www/title/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";

export async function render(el, deps = {}) {
  ttsSetLang("ja-JP");

  const root = document.createElement("div");
  root.className = "title-screen";
  root.innerHTML = `
    <style>
      .title-screen{display:flex;align-items:center;justify-content:center;
        height:100vh; background:#fff; position:relative}
      .title-wrap{position:relative; width:72vw; max-width:420px; aspect-ratio:3/1;}
      .title-wrap img{position:absolute; inset:0; width:100%; height:100%; object-fit:contain}
      .t-main{opacity:0; transition:opacity .9s ease}
      .t-main.show{opacity:1}
      /* Cだけのキラーン（明→元） */
      @keyframes flashC{
        0%{filter:brightness(1)}
        20%{filter:brightness(2.4)}
        100%{filter:brightness(1)}
      }
      .t-c{opacity:0; pointer-events:none}
      .t-c.flash{opacity:1; animation:flashC .28s ease}
      .tap{position:absolute; left:0; right:0; bottom:18vh; text-align:center;
        color:#94a3b8; letter-spacing:.2em; font-weight:700}
    </style>
    <div class="title-wrap">
      <img class="t-main" src="./img/title.png" alt="title">
      <img class="t-c"    src="./img/title-c.png" alt="C">
    </div>
    <div class="tap">— TAP TO START —</div>
  `;
  el.appendChild(root);

  const main = root.querySelector(".t-main");
  const cImg = root.querySelector(".t-c");

  // じわっと表示 → 少し後にCだけキラーン
  requestAnimationFrame(() => main.classList.add("show"));
  setTimeout(() => cImg.classList.add("flash"), 1100);

  const go = () => { stop(); deps.goto?.("menu1"); };
  root.addEventListener("click", go);
  root.addEventListener("touchend", go, { passive:true });

  // 画面離脱時の後片付け
  return () => { stop(); };
}

