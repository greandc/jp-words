// app/features/title/view.js
import { t } from "../i18n.js";
// mobile/www/title/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";

// mobile/www/title/view.js
export async function render(el, deps = {}) {
  const div = document.createElement("div");
  div.className = "title-screen";
  div.innerHTML = `
    <div class="title-wrap">
      <div class="logo-stack">
        <img src="./img/title.png" class="title-logo" alt="GreandC">
        <img src="./img/title-C.png"    class="title-c"    alt="">
      </div>
      <div class="tap">— TAP TO START —</div>
    </div>
  `;
  el.appendChild(div);

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
