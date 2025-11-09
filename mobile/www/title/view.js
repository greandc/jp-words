// app/features/title/view.js
import { t } from "../i18n.js";
// mobile/www/title/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";

// ...冒頭のimportなどはそのまま...

export async function render(el, deps = {}) {
  const wrap = document.createElement("div");
  wrap.className = "screen";
  // 画面全面の独立レイヤ（タップ吸収＆メニュー貫通防止）
  wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:#fff;
    display:flex; flex-direction:column;
    justify-content:center; align-items:center;
    pointer-events:auto;               /* ← これで下に貫通しない */
  `;

  // ロゴ＋キラーンを包むボックス（少しだけ上にオフセット）
  const box = document.createElement("div");
  box.style.cssText = `
    position:relative;
    transform: translateY(-6vh);       /* ほんの少し上寄せ */
    display:flex; flex-direction:column; align-items:center;
  `;

  // メインロゴ
  const img = document.createElement("img");
  img.src = "./img/title.png";         // ← 画像名修正済み版
  img.alt = "GreandC";
  img.style.cssText = `
    width:min(68vw, 360px);
    height:auto;
    display:block;
    filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
  `;

  // “C”キラーン
  const imgC = document.createElement("img");
  imgC.src = "./img/title-c.png";      // ← 画像名修正済み版
  imgC.alt = "";
  imgC.style.cssText = `
    position:absolute; right:6.5%; top:7%;
    width: min(10vw, 56px); height:auto; opacity:0;
    animation: cflash .9s ease-in-out .9s forwards;
    pointer-events:none;
  `;

  // TAP
  const tap = document.createElement("div");
  tap.textContent = "—  TAP TO START  —";
  tap.style.cssText = `
    margin-top: 12px;                  /* ロゴとの距離：ここで調整 */
    color:#94a3b8; letter-spacing:.12em; font-weight:600;
    font-size: clamp(14px, 2.9vw, 16px);
  `;

  // クリックでmenu1へ
  wrap.addEventListener("click", () => deps.goto?.("menu1"));

  box.appendChild(img);
  box.appendChild(imgC);
  wrap.appendChild(box);
  wrap.appendChild(tap);
  el.appendChild(wrap);

  // キーフレーム（1回だけ付与）
  const styleId = "title-anim-css";
  if (!document.getElementById(styleId)) {
    const st = document.createElement("style");
    st.id = styleId;
    st.textContent = `
      @keyframes cflash {
        0% { opacity:0; transform:scale(.9); filter:brightness(1); }
        30%{ opacity:1; transform:scale(1.08); filter:brightness(1.8); }
        100%{ opacity:1; transform:scale(1); filter:brightness(1); }
      }
    `;
    document.head.appendChild(st);
  }


  // クリック抜け防止の盾（300ms）を用意
  let navigated = false;
  const go = (ev) => {
    if (navigated) return;
    navigated = true;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();

    // 盾を張って同フレームの下層クリックを吸収
    const shield = document.createElement("div");
    shield.style.cssText = `
      position:fixed; inset:0; z-index:10000;
      background:transparent; pointer-events:auto;
    `;
    document.body.appendChild(shield);

    setTimeout(() => {
      deps.goto?.("menu1");
      // 万一残っても300msで消す
      setTimeout(() => shield.remove(), 300);
    }, 0);
  };

  // 画面全体で一回だけ
  div.addEventListener("pointerdown", go, { once: true });
}
