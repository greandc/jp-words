// app/features/title/view.js
import { t } from "../i18n.js";
// mobile/www/title/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";

export async function render(el, deps = {}) {
  // 画面全体を覆う（下の画面を触れなくする）
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

  // タップ（またはクリック）で menu1 へ
  const go = (ev) => {
    // これで“下のボタン”にイベントが抜けない
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    // 同フレームでルーティングすると稀にバブリングが残るので遅延
    setTimeout(() => deps.goto?.("menu1"), 0);
  };
  // 1回だけ発火
  div.addEventListener("pointerdown", go, { once: true });

  // 画面離脱時の後片付け
  return () => { stop(); };
}

