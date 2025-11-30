// mobile/www/numbers/view.js
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { t } from "../i18n.js";
import { showMainBanner, destroyBanner } from "../ads.js"; // ←★ この一行を追加


const KANA = ["ゼロ","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"];

function readUnder10000(n){
  if (n === 0) return "";
  let s = "";
  const th = Math.floor(n/1000); n%=1000;
  const h  = Math.floor(n/100);  n%=100;
  const t  = Math.floor(n/10);   const u = n%10;

  if (th){
    if (th===1) s+="せん";
    else if (th===3) s+="さんぜん";
    else if (th===8) s+="はっせん";
    else s+=KANA[th]+"せん";
  }
  if (h){
    if (h===1) s+="ひゃく";
    else if (h===3) s+="さんびゃく";
    else if (h===6) s+="ろっぴゃく";
    else if (h===8) s+="はっぴゃく";
    else s+=KANA[h]+"ひゃく";
  }
  if (t){
    if (t===1) s+="じゅう";
    else s+=KANA[t]+"じゅう";
  }
  if (u) s+=KANA[u];
  return s;
}

// 0～9,999,999,999 くらいまで対応（～兆）
function numberToJa(n){
  if (!Number.isFinite(n)) return "";
  if (n===0) return "ゼロ";
  const units = ["","まん","おく","ちょう"];
  let s = "", i = 0;
  while(n>0 && i<units.length){
    const part = n % 10000;
    if (part){
      const head = readUnder10000(part);
      s = head + (units[i]??"") + s;
    }
    n = Math.floor(n/10000); i++;
  }
  return s || "ゼロ";
}

export async function render(el, deps = {}){
  showMainBanner();
  ttsSetLang("ja-JP");

  let digits = "";        // 入力中の数字（文字列）
  let auto = true;        // 自動読み上げ

  const root = document.createElement("div");
 root.className = "screen-numbers";

  root.innerHTML = `
  <div class="numbers-inner">
    <h1 style="margin:0 0 12px;">${t("numbers.title")} </h1>

    <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;">
      <div style="font-size:.9rem;color:#64748b">
        <label style="display:inline-flex;align-items:center;gap:6px;">
          <input id="auto" type="checkbox" checked />
          <span>${t("practice.autoTTS")}</span>
        </label>
      </div>
      <button id="back" class="btn" style="padding:.35rem .8rem;">${t("common.back")}</button>
    </div>

    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:0 0 12px;background:#fafafa">
      <div id="disp" style="font-size:1.6rem;font-weight:700;letter-spacing:.04em;word-break:break-all;min-height:2.2em">0</div>
      <div id="reading" style="margin-top:6px;color:#374151;font-size:1.1rem">ゼロ</div>
    </div>

    <div id="pad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
      ${[1,2,3,4,5,6,7,8,9,"⌫",0,"C"].map(v => `
        <button class="btn" data-k="${v}" style="height:56px;font-size:1.2rem;">${v}</button>
      `).join("")}
    </div>
  </div>
`;

  el.appendChild(root);

  const $disp = root.querySelector("#disp");
  const $reading = root.querySelector("#reading");
  const $pad = root.querySelector("#pad");
  const $auto = root.querySelector("#auto");

  function updateView(){
    const n = digits.length ? Number(digits) : 0;
    $disp.textContent = digits.length ? digits : "0";
    $reading.textContent = numberToJa(n);
  }

    async function speakStep(lastDigit){
    const n = digits.length ? Number(digits) : 0;
    if (!digits.length) return;

    // ✅ 1桁のときは「全体」だけ読む（例：1 → 「いち」1回だけ）
    if (digits.length === 1){
      await speak(numberToJa(n));
      return;
    }

    // ✅ 2桁以上のときは、今まで通り
    // 1) 押した桁
    if (lastDigit !== undefined){
      await speak(KANA[lastDigit]);
    }
    // 2) 全体
    await speak(numberToJa(n));
  }

  function pushDigit(d){
    // 先頭ゼロ連打は抑制
    if (digits === "" && d === 0) { updateView(); return; }
    // 桁数ガード（お好みで拡張OK）
    if (digits.length >= 12) return;
    digits += String(d);
    updateView();
    if (auto) speakStep(d);
  }

  function backspace(){
    if (!digits) return;
    digits = digits.slice(0, -1);
    updateView();
    if (auto){
      const n = digits.length ? Number(digits) : 0;
      speak(numberToJa(n));
    }
  }

  function clearAll(){
    digits = "";
    updateView();
    if (auto) speak("クリア");
  }

  $pad.addEventListener("click", (e)=>{
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    const k = b.getAttribute("data-k");
    if (k === "⌫") backspace();
    else if (k === "C") clearAll();
    else pushDigit(Number(k));
  });

  $auto.addEventListener("change", ()=> auto = $auto.checked);
    root.querySelector("#back").addEventListener("click",async () => {
      await destroyBanner();
      deps.goto?.("menu1");
    });

    updateView();

  // === Numbers 画面用のバナー（画面下に固定） ===
  const bannerRow = document.createElement("div");
  bannerRow.className = "banner-slot";
  bannerRow.textContent = "";
  el.appendChild(bannerRow);
}

