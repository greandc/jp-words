// mobile/www/title/view.js
import { t } from "../i18n.js";

export async function render(el, deps = {}) {
  // ===== 既存CSSを必ず置き換える（古い定義が残って無効になるのを防ぐ）=====
  (function ensureStyle() {
    const id = "title-anim-css";
    let node = document.getElementById(id);
    if (node) node.remove(); // ← 古いのを必ず消す
    node = document.createElement("style");
    node.id = id;
    node.textContent = `
      @keyframes titleFadeIn{
        0%{opacity:0;transform:scale(.96);filter:blur(2px)}
        60%{opacity:1;transform:scale(1.005);filter:blur(.4px)}
        100%{opacity:1;transform:scale(1);filter:blur(0)}
      }
      @keyframes cFlash{
        0%  {opacity:0; transform:scale(.9);   filter:brightness(1)}
        25% {opacity:1; transform:scale(1.20); filter:brightness(2) drop-shadow(0 0 8px rgba(255,255,160,.95))}
        55% {opacity:1; transform:scale(1.00); filter:brightness(1.15) drop-shadow(0 0 5px rgba(255,255,140,.7))}
        100%{opacity:1; transform:scale(1.00); filter:brightness(1)}
      }
      @keyframes tapFade{
        from{opacity:0;transform:translateY(4px)}
        to  {opacity:1;transform:translateY(0)}
      }
      .c-on{ animation:cFlash .9s ease-in-out forwards; }
      @media (prefers-reduced-motion:reduce){
        *{animation:none!important;transition:none!important}
      }
    `;
    document.head.appendChild(node);
  })();

  // ===== 画面 =====
  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:#fff;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    pointer-events:auto;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    position:relative; display:flex; flex-direction:column; align-items:center;
    transform: translateY(-6vh);
  `;

  // ロゴ（じわー）
  const img = document.createElement("img");
  img.src = "./img/title.png";
  img.alt = "GreandC";
  img.style.cssText = `
    width:min(68vw,360px); height:auto; display:block;
    opacity:0; transform:scale(.96); filter:blur(2px);
    will-change:opacity,transform,filter; z-index:1;
    animation:titleFadeIn .9s ease-out .1s forwards;
  `;

  // C（キラーン） ← 最前面に固定、アニメは後でクラス付与で開始
  const imgC = document.createElement("img");
  imgC.src = "./img/title-c.png";
  imgC.alt = "";
  imgC.style.cssText = `
    position:absolute; right:6.5%; top:7%;
    width:min(10vw,56px); height:auto;
    opacity:0; transform:scale(.9) rotate(0.001deg);
    will-change:opacity,transform,filter; z-index:2;
    pointer-events:none;
  `;

  // TAP（ふわっ）
  const tap = document.createElement("div");
  tap.textContent = "—  TAP TO START  —";
  tap.style.cssText = `
    margin-top:12px; color:#94a3b8; letter-spacing:.12em; font-weight:600;
    font-size:clamp(14px,2.9vw,16px);
    opacity:0; transform:translateY(4px);
    will-change:opacity,transform;
    animation:tapFade .5s ease-out 1.7s forwards;
  `;

  // クリック抜け防止して menu1 へ
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

  // ===== Cのアニメを「確実に」発火させる =====
  // 1) 画像が既にキャッシュ済みでも動くように complete をチェック
  // 2) 次フレーム（requestAnimationFrame）で .c-on を付けて確実にReflow
  const startC = () => {
    requestAnimationFrame(() => {
      imgC.classList.remove("c-on"); // 念のため初期化
      // ロゴの“じわー”が見えたあとに開始（1.1s 遅延）
      setTimeout(() => { imgC.classList.add("c-on"); }, 1100);
    });
  };
  if (imgC.complete) startC();
  else imgC.addEventListener("load", startC);
}


