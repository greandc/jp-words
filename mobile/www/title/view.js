// mobile/www/title/view.js
import { t } from "../i18n.js";

// ===== ここから丸ごと置き換え =====
export async function render(el, deps = {}) {
  // 覆い（下の画面にタップが貫通しない）
  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:#fff;
    display:flex; flex-direction:column; justify-content:center; align-items:center;
    pointer-events:auto;
  `;

  // ロゴ箱（相対配置）
  const box = document.createElement("div");
  box.style.cssText = `
    position:relative;
    transform: translateY(-6vh);
    display:flex; flex-direction:column; align-items:center;
  `;

  // メインロゴ（じわー は既存CSS側でやってOK）
  const img = document.createElement("img");
  img.src = "./img/title.png";
  img.alt = "GreandC";
  img.style.cssText = `
    width:min(68vw, 360px);
    height:auto; display:block;
    filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
    opacity:0; animation: logoIn .9s ease-out forwards;
  `;

  // C 画像（重ねる専用）
  const imgC = document.createElement("img");
  imgC.src = "./img/title-c.png";
  imgC.alt = "";
  imgC.style.cssText = `
    position:absolute; opacity:0; pointer-events:none; transform-origin:center;
  `;

  // 「TAP TO START」
  const tap = document.createElement("div");
  tap.textContent = "—  TAP TO START  —";
  tap.style.cssText = `
    margin-top: 12px; color:#94a3b8; letter-spacing:.12em; font-weight:600;
    font-size: clamp(14px, 2.9vw, 16px);
    opacity:0; animation: tapIn .6s ease-out .9s forwards;
  `;

  // クリック抜け防止して menu1 へ
  let navigated = false;
  const go = (ev) => {
    if (navigated) return;
    navigated = true;
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation?.();
    const shield = document.createElement("div");
    shield.style.cssText = `position:fixed; inset:0; z-index:10000; background:transparent; pointer-events:auto;`;
    document.body.appendChild(shield);
    setTimeout(() => { deps.goto?.("menu1"); setTimeout(()=>shield.remove(), 300); }, 0);
  };
  wrap.addEventListener("pointerdown", go, { once:true });

  // ---- ここがポイント：C の位置/サイズ算出＆アニメ発火 ----
  function placeC() {
    const w = img.clientWidth;
    const h = img.clientHeight;
    // 調整係数（必要なら微調整：sizeK 0.20→0.22 など）
    const sizeK = 0.20;   // C 幅 = ロゴ幅の 20%
    const leftK = 0.62;   // 左位置 = ロゴ幅の 62%
    const topK  = 0.15;   // 上位置 = ロゴ高の 15%
    imgC.style.width = (w * sizeK) + "px";
    imgC.style.left  = (w * leftK) + "px";
    imgC.style.top   = (h * topK)  + "px";
  }

  function setupC() {
    placeC();
    // “確実に”発火：一度止めて reflow → 再度 animation を付ける
    imgC.style.opacity = "1";
    imgC.style.animation = "none";
    // reflow
    // eslint-disable-next-line no-unused-expressions
    imgC.offsetWidth;
    imgC.style.animation = "cFlash .9s ease-in-out forwards";
  }

  const startAfterLogo = () => setTimeout(setupC, 1100);
  if (img.complete) startAfterLogo();
  else img.addEventListener("load", startAfterLogo);
  window.addEventListener("resize", placeC, { passive:true });

  // 追加：キーフレーム（未注入なら注入）
  const styleId = "title-anim-css";
  if (!document.getElementById(styleId)) {
    const st = document.createElement("style");
    st.id = styleId;
    st.textContent = `
      @keyframes logoIn { from{opacity:0; transform:translateY(6px) scale(.98);} to{opacity:1; transform:none;} }
      @keyframes tapIn  { from{opacity:0; transform:translateY(4px);}       to{opacity:1; transform:none;} }
      @keyframes cFlash{
        0%   { opacity:0; transform:scale(.92); filter:brightness(1); }
        30%  { opacity:1; transform:scale(1.10); filter:brightness(1.9); }
        100% { opacity:1; transform:scale(1);    filter:brightness(1); }
      }
    `;
    document.head.appendChild(st);
  }

  // DOMに載せる
  box.appendChild(img);
  box.appendChild(imgC);
  wrap.appendChild(box);
  wrap.appendChild(tap);
  el.appendChild(wrap);
}





