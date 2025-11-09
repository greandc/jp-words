// mobile/www/title/view.js
import { t } from "../i18n.js";

/* -------------------------------------------------------
   タイトル画面（ロゴじわー / Cキラーン / TAPふわっ）
   ・下の画面にタップが貫通しない
   ・C画像がロゴと同寸キャンバスでもOK（自動トリミング）
------------------------------------------------------- */

// 透明余白を自動トリミング（Cだけ切り出し）して dataURL を返す
async function autoCropTransparent(imgEl) {
  await (imgEl.complete ? Promise.resolve()
        : new Promise(res => imgEl.addEventListener("load", res, { once:true })));

  const w = imgEl.naturalWidth, h = imgEl.naturalHeight;
  const cvs = document.createElement("canvas");
  cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext("2d");
  ctx.drawImage(imgEl, 0, 0);

  const data = ctx.getImageData(0, 0, w, h).data;
  let top=h, left=w, right=0, bottom=0, hit=false;
  for (let y=0; y<h; y++){
    for (let x=0; x<w; x++){
      const a = data[(y*w + x)*4 + 3];
      if (a>0){ hit=true;
        if (x<left) left=x;
        if (x>right) right=x;
        if (y<top) top=y;
        if (y>bottom) bottom=y;
      }
    }
  }
  if (!hit) return null;

  const cw = right-left+1, ch = bottom-top+1;
  const out = document.createElement("canvas");
  out.width = cw; out.height = ch;
  out.getContext("2d").drawImage(cvs, left, top, cw, ch, 0, 0, cw, ch);
  return { dataUrl: out.toDataURL("image/png") };
}

export async function render(el, deps = {}) {
  // 覆い（貫通防止）
  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:#fff;
    display:flex; flex-direction:column; justify-content:center; align-items:center;
    pointer-events:auto;
  `;

  // ロゴ箱
  const box = document.createElement("div");
  box.style.cssText = `
    position:relative;
    transform: translateY(-6vh);
    display:flex; flex-direction:column; align-items:center;
  `;

  // メインロゴ（じわー）
  const img = document.createElement("img");
  img.src = "./img/title.png";
  img.alt = "GreandC";
  img.style.cssText = `
    width:min(68vw, 360px);
    height:auto; display:block;
    filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
    opacity:0; animation: logoIn .9s ease-out forwards;
  `;

  // C（重ねる）
  const imgC = document.createElement("img");
  imgC.src = "./img/title-c.png";   // キラーン用の透明PNG（キャンバスサイズはロゴと同じでOK）
  imgC.alt = "";
  imgC.style.cssText = `
   position:absolute; left:0; top:0;       /* ロゴにピッタリ重ねる */
   width:100%; height:auto;                /* ロゴと同じスケールで追従 */
   opacity:0; pointer-events:none;
 `;

  // TAP（ふわっ）
  const tap = document.createElement("div");
  tap.textContent = "—  TAP TO START  —";
  tap.style.cssText = `
    margin-top: 12px; color:#94a3b8; letter-spacing:.12em; font-weight:600;
    font-size: clamp(14px, 2.9vw, 16px);
    opacity:0; animation: tapIn .6s ease-out .9s forwards;
  `;

  // クリック抜け防止 → menu1
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

  // C の位置/サイズ（ロゴ基準の相対配置）
  const placeC = () => {
    const w = img.clientWidth;
    const h = img.clientHeight;
    const sizeK = 0.20; // 0.20→0.22 等で微調整
    const leftK = 0.62;
    const topK  = 0.15;
    imgC.style.width = (w * sizeK) + "px";
    imgC.style.left  = (w * leftK) + "px";
    imgC.style.top   = (h * topK)  + "px";
  };

  // C を確実に発火：トリミング→配置→アニメ
  function flashC() {
  imgC.style.opacity = "1";
  imgC.style.animation = "none";
  // reflow
  // eslint-disable-next-line no-unused-expressions
  imgC.offsetWidth;
  imgC.style.animation = "cFlash 850ms ease-in-out forwards";
  }

  const startAfterLogo = () => setTimeout(flashC, 1100);
  if (img.complete) startAfterLogo();
  else img.addEventListener("load", startAfterLogo);
  window.addEventListener("resize", placeC, { passive:true });

  // キーフレーム（未注入なら注入）
  const styleId = "title-anim-css";
  if (!document.getElementById(styleId)) {
    const st = document.createElement("style");
    st.id = styleId;
    st.textContent = `
      @keyframes logoIn { from{opacity:0; transform:translateY(6px) scale(.98);} to{opacity:1; transform:none;} }
      @keyframes tapIn  { from{opacity:0; transform:translateY(4px);}       to{opacity:1; transform:none;} }
      // 既存の style 要素生成部の中の cFlash をこれに差し替え
      @keyframes cFlash {
       0%   { opacity:0; filter:brightness(1) drop-shadow(0 0 0 rgba(255,215,0,0)); }
       20%  { opacity:1; filter:brightness(2.0) drop-shadow(0 0 6px rgba(255,215,0,.9)); }
       50%  { opacity:1; filter:brightness(1.6) drop-shadow(0 0 3px rgba(255,215,0,.6)); }
       100% { opacity:1; filter:brightness(1) drop-shadow(0 0 0 rgba(255,215,0,0)); }
      }

    `;
    document.head.appendChild(st);
  }

  // DOM 反映
  box.appendChild(img);
  box.appendChild(imgC);
  wrap.appendChild(box);
  wrap.appendChild(tap);
  el.appendChild(wrap);
}
