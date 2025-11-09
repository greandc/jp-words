// mobile/www/title/view.js
import { t } from "../i18n.js";

export async function render(el, deps = {}) {
  // 画面全面（下の画面にタップが貫通しない）
  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:#fff;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    pointer-events:auto;
  `;

  // ロゴコンテナ（少し上に寄せる）
  const box = document.createElement("div");
  box.style.cssText = `
    position:relative; display:flex; flex-direction:column; align-items:center;
    transform: translateY(-6vh);
  `;

  // メインロゴ（じわー）
  const img = document.createElement("img");
  img.src = "./img/title.png";
  img.alt = "GreandC";
  img.style.cssText = `
    width:min(68vw,360px); height:auto; display:block;
    opacity:0; transform:scale(.96); filter:blur(2px);
    will-change:opacity,transform,filter; z-index:1;   /* ← 前後関係 */
    animation:titleFadeIn .9s ease-out .1s forwards;
  `;

  // “C”（キラーン）
  const imgC = document.createElement("img");
  imgC.src = "./img/title-c.png";
  imgC.alt = "";
  imgC.style.cssText = `
    position:absolute; right:6.5%; top:7%;
    width:min(10vw,56px); height:auto;
    opacity:0; transform:scale(.9) rotate(0.001deg);
    will-change:opacity,transform,filter; z-index:2;   /* ← 常に最前面 */
    pointer-events:none;
  `;

  // TAP TO START（最後にふわっと）
  const tap = document.createElement("div");
  tap.textContent = "—  TAP TO START  —";
  tap.style.cssText = `
    margin-top:12px; color:#94a3b8; letter-spacing:.12em; font-weight:600;
    font-size:clamp(14px,2.9vw,16px);
    opacity:0; transform: translateY(4px);
    will-change: opacity, transform;
    animation: tapFade .5s ease-out 1.7s forwards;
  `;

  // クリックで menu1（クリック抜け防止の“盾”付き）
  const go = (ev) => {
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation?.();
    const shield = document.createElement("div");
    shield.style.cssText = `position:fixed; inset:0; z-index:10000; pointer-events:auto;`;
    document.body.appendChild(shield);
    setTimeout(() => { deps.goto?.("menu1"); setTimeout(() => shield.remove(), 300); }, 0);
  };
  wrap.addEventListener("pointerdown", go, { once:true });

  box.appendChild(img);
  box.appendChild(imgC);
  wrap.appendChild(box);
  wrap.appendChild(tap);
  el.appendChild(wrap);

  const kickC = () => {
    imgC.classList.add("c-on");  // ← Cにアニメ開始クラスを付ける
  };
  if (imgC.complete) setTimeout(kickC, 1100);
  else imgC.addEventListener("load", () => setTimeout(kickC, 1100));

  // 一度だけキーフレーム注入
  if (!document.getElementById("title-anim-css")) {
  const st = document.createElement("style");
  st.id = "title-anim-css";
  st.textContent = `
    @keyframes titleFadeIn{
      0%{opacity:0;transform:scale(.96);filter:blur(2px)}
      60%{opacity:1;transform:scale(1.005);filter:blur(.4px)}
      100%{opacity:1;transform:scale(1);filter:blur(0)}
    }
    @keyframes cFlash{
      0%  {opacity:0; transform:scale(.9);   filter:brightness(1)}
      25% {opacity:1; transform:scale(1.18); filter:brightness(2) drop-shadow(0 0 6px rgba(255,255,180,.9))}
      55% {opacity:1; transform:scale(1.00); filter:brightness(1.15) drop-shadow(0 0 4px rgba(255,255,160,.6))}
      100%{opacity:1; transform:scale(1.00); filter:brightness(1)}
    }
    @keyframes tapFade{
      from{opacity:0;transform:translateY(4px)}
      to{opacity:1;transform:translateY(0)}
    }
    .c-on{ animation:cFlash .9s ease-in-out forwards; }
    @media (prefers-reduced-motion:reduce){
      *{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(st);
}

}

