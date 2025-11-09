import { t, getLang, setLang as setUILang } from "../i18n.js";
import { MAX_Q, SECS_PER_Q } from "../config.js";
import { loadLevel } from "../data/loader.js";
import { speak, stop, ttsAvailable, setLang as ttsSetLang, setRate as ttsSetRate, setPitch as ttsSetPitch } from "../tts.js";



export async function render(el, deps = {}) {
  // レベルを復元（deps → localStorage）
  let levelNum = deps.level?.();
  if (!levelNum) {
    try { const s = localStorage.getItem("jpVocab.level"); if (s) levelNum = Number(s); } catch {}
  }
  // --- TTS 初期化（言語・速度）＆ 画面遷移/回転時の停止 ---
ttsSetLang('ja-JP');
ttsSetRate(1.0);
ttsSetPitch(1.0);

const handleHide = () => stop();
window.addEventListener('visibilitychange', handleHide);
window.addEventListener('pagehide', handleHide);
window.addEventListener('freeze', handleHide);
window.addEventListener('resize', handleHide);

// この画面を離れる時に呼ぶクリーンアップ
function cleanup() {
  window.removeEventListener('visibilitychange', handleHide);
  window.removeEventListener('pagehide', handleHide);
  window.removeEventListener('freeze', handleHide);
  window.removeEventListener('resize', handleHide);
  stop();
}

  if (!levelNum) { alert("Select a set first."); return deps.goto?.("menu2"); }

  const div = document.createElement("div");
  div.className = "screen";
  div.innerHTML = `
    <h1>${t("level.label",{n:levelNum})}</h1>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 16px;">
  <p id="counter" style="color:#666;margin:0;">1/10</p>

  <!-- 小さめの右寄せボタン：.btn を使わず幅を自前指定 -->
  <button id="reportBtn"
          title="Report this item"
          style="display:inline-flex;align-items:center;gap:6px;
                 padding:.35rem .7rem;font-size:.9rem;
                 border:1px solid #93c5fd;border-radius:999px;
                 background:#eef6ff;color:#1d4ed8;
                 width:auto;min-width:unset;">
    🚩 Report
  </button>
</div>


    <div id="card" style="border:1px solid #eee;border-radius:12px;padding:16px;">
   <div
  id="controls"
  style="
    display:flex;
    align-items:center;
    justify-content:flex-start;  /* 左寄せに固定 */
    gap:6px;                      /* 🔊 と □ の距離 */
    margin-bottom:8px;
    flex-wrap:nowrap;             /* 折り返し防止（iPhone対策） */
  "
>
  <!-- 🔊 は縮めるけど transform は使わない（重なり対策） -->
  <button
    class="btn"
    id="speakBtn"
    title="${t("practice.speak")}"
    style="height:28px; line-height:1; padding:4px 8px;"
  >🔊</button>

  <!-- □ とラベルは “一塊” として並べる -->
  <label
    style="
      display:inline-flex;
      align-items:center;
      gap:6px;          /* □ と文字の距離 */
      margin:0;         /* 余計な左右マージンを殺す（Safari対策） */
      font-size:.9rem;
      white-space:nowrap; /* はみ出し防止（折り返さない） */
    "
  >
    <input
      type="checkbox"
      id="autoTts"
      style="margin:0; width:18px; height:18px;"  /* □の余白ゼロに */
    />
    <span>${t("practice.autoTTS")}</span>
  </label>
</div>


      <div style="display:flex;flex-direction:column;gap:10px;">
        <div id="en" style="font-size:1.25rem;font-weight:600;"></div>
        <div id="orth" style="font-size:2.2rem;font-weight:700;"></div>
        <div id="reading" style="font-size:1.1rem;color:#444;"></div>
        <div id="romaji" style="font-size:.95rem;color:#777;"></div>
      </div>

      <div id="altWrap" style="margin-top:12px;display:none;">
        <div style="font-weight:600;">${t("practice.related")}</div>
        <div id="altOrth" style="font-size:1.2rem;font-weight:600;cursor:pointer;" role="button">—</div>
        <div id="altReading" style="font-size:1rem;color:#444;"></div>
      </div>

      <div id="msg" style="margin-top:10px;color:#b45309;display:none;"></div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;">
      <button class="btn" id="prev">${t("practice.prev")}</button>
      <button class="btn" id="back">${t("practice.back")}</button>
      <button class="btn" id="next">${t("practice.next")}</button>
    </div>
  `;
  el.appendChild(div);

// ===== Google Form: 自動送信用 =====
const FORM_ACTION = "https://docs.google.com/forms/d/e/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/formResponse"; 
// ↑ あなたのフォームの formResponse URL に差し替え（必須）

// 各質問の entry ID（あなたが貼ってくれたIDに合わせる）
const F = {
  level:   "entry.334853358",   // Level
  itemId:  "entry.1489623203",  // 単語ID (lv01-01 など)
  issue:   "entry.623900410",   // 種別（'spelling' 等でもOK。今回は 'flag' 固定にします）
  orth:    "entry.1237300608",  // 表記
  reading: "entry.125390521",   // よみ
  en:      "entry.355116408",   // 英語
  ui:      "entry.1115912742"   // UI言語（任意）
};

// 右上トースト
function toast(msg="Sent", ms=1600){
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;top:12px;right:12px;padding:8px 12px;background:#10b981;color:#fff;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);z-index:9999;font-size:.9rem;transition:opacity .2s";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  setTimeout(()=> t.style.opacity="0", ms);
}

// 1タップ通報（裏で送信）
async function sendReport(kind="flag"){
  const it = items?.[idx-1];           // ← あなたの既存の items / idx を利用
  if (!it) return;

  const fd = new FormData();
  fd.append(F.level,   String(levelNum));
  fd.append(F.itemId,  it.id || "");
  fd.append(F.issue,   kind);                  // いまは固定 'flag'
  fd.append(F.orth,    it.jp?.orth || "");
  fd.append(F.reading, it.jp?.reading || "");
  fd.append(F.en,      it.defs?.en || "");
  try { fd.append(F.ui, (typeof getLang==="function" ? getLang() : "")); } catch {}

  try {
    await fetch(FORM_ACTION, { method:"POST", mode:"no-cors", body: fd });
    toast("Thanks! Report sent ✅");
  } catch {
    toast("Failed to send ❌");
  }
}

// ボタン配線（Report）
div.querySelector("#reportBtn")?.addEventListener("click", ()=> sendReport("flag"));


// ===== データ取得（ここで JSON を読む）=====
const items = await loadLevel(levelNum);
if (!items || items.length === 0) {
  div.innerHTML = `
    <h2>Level ${levelNum}</h2>
    <p style="color:#c0392b">Level data not found. For now, only Level 1 exists.</p>
    <button class="btn" onclick="history.back()">Back</button>
  `;
  return;
}

console.log('[chk]', !!window.Capacitor, window.Capacitor?.getPlatform?.(), 'native?', (window.Capacitor?.isNativePlatform?.()), 'plugin?', !!(window.Capacitor?.Plugins?.TextToSpeech));


  // ===== TTS（統一ラッパ使用）=====
const speakBtn   = div.querySelector("#speakBtn");
const autoTtsChk = div.querySelector("#autoTts");
const msgEl      = div.querySelector("#msg");
const LS_AUTO    = "jpVocab.practice.autoTTS";
try { autoTtsChk.checked = localStorage.getItem(LS_AUTO) === "1"; } catch {}

// 初回判定（この時点で false でも、後で再判定する）
function applyTtsUI(can) {
  if (!can) {
    if (speakBtn) speakBtn.disabled = true;
    if (autoTtsChk) autoTtsChk.disabled = true;
    if (msgEl) { msgEl.textContent = 'tts.unsupported'; msgEl.style.display = ''; }
  } else {
    if (speakBtn) speakBtn.disabled = false;
    if (autoTtsChk) autoTtsChk.disabled = false;
    if (msgEl) msgEl.style.display = 'none';
  }
}
applyTtsUI(ttsAvailable());

// 200ms 後にもう一度判定（capacitor.js の読み込み遅延に対応）
setTimeout(() => applyTtsUI(ttsAvailable()), 200);

autoTtsChk.addEventListener("change", () => {
  try { localStorage.setItem(LS_AUTO, autoTtsChk.checked ? "1" : "0"); } catch {}
});




  // ===== レンダリング =====
  let idx = 1; // 1..10
  const elCounter = div.querySelector("#counter");
  const elEn = div.querySelector("#en");
  const elOrth = div.querySelector("#orth");
  const elReading = div.querySelector("#reading");
  const elRomaji = div.querySelector("#romaji");
  const elAltWrap = div.querySelector("#altWrap");
  const elAltOrth = div.querySelector("#altOrth");
  const elAltReading = div.querySelector("#altReading");

  function renderCard(){
    elCounter.textContent = `${idx}/10`;
    const it = items[idx-1]; // 0..9
    const lang = (getLang && getLang()) || "en";
    const en = it?.defs?.[lang] || it?.defs?.en || "";

    const orth = it?.jp?.orth ?? "";
    const reading = it?.jp?.reading ?? "";

    elEn.textContent = en;
    elOrth.textContent = orth;
    elReading.textContent = reading;
    elRomaji.textContent = ""; // ローマ字は今は空（将来対応）

    // 関連（同義語など）— いまは非表示のまま（将来使う）
    elAltWrap.style.display = "none";

   if (autoTtsChk.checked) speak(reading);

  }

  renderCard();

  // ===== ボタン =====
const btnPrev = div.querySelector("#prev");
const btnBack = div.querySelector("#back");
const btnNext = div.querySelector("#next");

if (btnPrev) btnPrev.textContent = t("practice.prev");
if (btnBack) btnBack.textContent = t("practice.back");
if (btnNext) btnNext.textContent = t("practice.next");

btnPrev.addEventListener("click", () => { 
  stop();                               // 先に止める
  idx = idx > 1 ? idx - 1 : items.length; 
  renderCard(); 
});

btnNext.addEventListener("click", () => { 
  stop();                               // 先に止める
  idx = idx < items.length ? idx + 1 : 1; 
  renderCard(); 
});

btnBack.addEventListener("click", () => {
  cleanup();                            // 画面離脱時の後片付け
  deps.goto?.("menu3");
});

speakBtn.addEventListener("click", () => {
  const it = items[idx - 1];
  speak(it?.jp?.reading || it?.jp?.orth || "");
});

}
