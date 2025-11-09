// mobile/www/title/view.js
import { t } from "../i18n.js"; // 使うならそのまま。未使用でも害なし。

export async function render(el, deps = {}) {
  const wrap = document.createElement("div");
  wrap.className = "screen";
  wrap.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:#fff;
    display:flex; flex-direction:column;
    justify-content:center; align-items:center;
    pointer-events:auto;
  `;

  // ロゴブロック（少しだけ上寄せ）
  const box = document.createElement("div");
  box.style.cssText = `
    position:relative;
    transform: translateY(-6vh);
    display:flex; flex-direction:column; align-items:center;
  `;

  // メインロゴ
  const img = document.createElement("img");
  img.src = "./img/title.png";
  img.alt = "GreandC";
  img.style.cssText = `
    width:min(68vw, 360px);
    height:auto; display:block;
    filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
  `;

  // “C” キラーン
  const imgC = document.createElement("img");
  imgC.src = "./img/title-c.png";
  imgC.alt = "";
  imgC.style.cssText = `
    position:absolute; right:6.5%; top:7%;
    width:min(10vw,56px); height:auto; opacity:0;
    animation:cflash .9s ease-in-out .9s forwards;
    pointer-events:none;
  `;

  // TAP
  const tap = document.createElement("div");
  tap.textContent = "—  TAP TO START  —";
  tap.style.cssText = `
    margin-top:12px;
    color:#94a3b8; letter-spacing:.12em; font-weight:600;
    font-size:clamp(14px,2.9vw,16px);
  `;

  box.appendChild(img);
  box.appendChild(imgC);
  wrap.appendChild(box);
  wrap.appendChild(tap);
  el.appendChild(wrap);

  // キーフレーム（重複追加しない）
  if (!document.getElementById("title-anim-css")) {
    const st = document.createElement("style");
    st.id = "title-anim-css";
    st.textContent = `
      @keyframes cflash{
        0%{opacity:0;transform:scale(.9);filter:brightness(1)}
        30%{opacity:1;transform:scale(1.08);filter:brightness(1.8)}
        100%{opacity:1;transform:scale(1);filter:brightness(1)}
      }
    `;
    document.head.appendChild(st);
  }

  // 下層への貫通防止付きのワンタップ遷移（1回だけ）
  let navigated = false;
  wrap.addEventListener("pointerdown", (ev) => {
    if (navigated) return;
    navigated = true;
    ev.preventDefault();
    ev.stopPropagation();

    // 盾で同フレーム貫通を吸収
    const shield = document.createElement("div");
    shield.style.cssText = `
      position:fixed; inset:0; z-index:10000;
      background:transparent; pointer-events:auto;
    `;
    document.body.appendChild(shield);

    // 次フレームで遷移、少しして盾を外す
    setTimeout(() => {
      deps.goto?.("menu1");
      setTimeout(() => shield.remove(), 300);
    }, 0);
  }, { once: true });
}
