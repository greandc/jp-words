// mobile/www/hiragana/view.js
import { t } from "../i18n.js";
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS, EXTRA_HIRA_EXAMPLES } from "./data.hira.js";
import { transformKana } from "./transformKana.js";
import { showMainBanner, destroyBanner } from "../ads.js"; // ←★ この一行を追加


// ==== ひらがなチュートリアル（初回だけふきだし表示） ====
const HIRA_TUTORIAL_KEY = "jpVocab.tutorial.hiraHintShown";


// ひらがなチュートリアル（初回だけ・中央ポップアップ）
function showHiraTutorialBubble() {
  // すでに表示済みなら何もしない
  try {
    if (localStorage.getItem(HIRA_TUTORIAL_KEY) === "1") return;
  } catch {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "hiraHintOverlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;        /* ★ 画面の縦方向センター */
    justify-content: center;    /* ★ 横方向もセンター */
    background: rgba(15,23,42,0.35);
    z-index: 9999;
    pointer-events: auto;
  `;

  const box = document.createElement("div");
  box.style.cssText = `
    max-width: 520px;
    width: calc(100% - 32px);
    background: #111827;
    color: #f9fafb;
    border-radius: 18px;
    padding: 14px 16px 12px;
    box-shadow: 0 10px 25px rgba(15,23,42,0.35);
    box-sizing: border-box;
  `;

  box.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;font-size:1rem;">
      ${t("tutorial.hiraTitle") || "How to use"}
    </div>
    <div style="font-size:.9rem;line-height:1.5;margin-bottom:10px;">
      ${t("tutorial.hiraBody")
        || "Tap the 🔊 button or a hiragana character to hear the sound. After closing this message you can use the Back button to return to the menu."}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:4px;">
      <button class="btn" id="hiraTutOk"
              style="min-width:84px;padding:.35rem .9rem;">
        ${t("tutorial.ok") || "OK"}
      </button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function close() {
    try { localStorage.setItem(HIRA_TUTORIAL_KEY, "1"); } catch {}
    overlay.remove();
  }

  overlay.querySelector("#hiraTutOk")?.addEventListener("click", close);

  // 黒い部分をタップしても閉じる
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
}

console.log("HIRAGANA SRC = v1");

const BUILD_TAG = "ps-fix-01";

// かな変換ユーティリティ
const ROW_K = {
  ka: ["か","き","く","け","こ"],
  sa: ["さ","し","す","せ","そ"],
  ta: ["た","ち","つ","て","と"],
  ha: ["は","ひ","ふ","へ","ほ"],
};
const DAKU = {
  ka: ["が","ぎ","ぐ","げ","ご"],
  sa: ["ざ","じ","ず","ぜ","ぞ"],
  ta: ["だ","ぢ","づ","で","ど"],
  ha: ["ば","び","ぶ","べ","ぼ"],
};
const HANDAKU = ["ぱ","ぴ","ぷ","ぺ","ぽ"];

// 小書きにするのは「や・ゆ・よ・つ」だけ
const SMALLABLE = new Set(["や","ゆ","よ","つ"]);
const SMALL_MAP = {
  "や": "ゃ",
  "ゆ": "ゅ",
  "よ": "ょ",
  "つ": "っ",
};

// 例語側で使う「小→大」の逆変換
const UNSMALL_MAP = {};
for (const [big, small] of Object.entries(SMALL_MAP)) {
  UNSMALL_MAP[small] = big;
}


// 清音 → 対応ダク点 / 半濁 / 小字への変換（必要な所だけ）
function applyKanaTransform(k, flags){
  const { daku=false, handaku=false, small=false } = flags || {};
  let out = k;

  // 行・列を特定（か・さ・た・は行）
  for (const rowKey of ["ka","sa","ta","ha"]) {
    const idx = ROW_K[rowKey].indexOf(k);
    if (idx !== -1) {
      if (handaku && rowKey === "ha") {
        out = HANDAKU[idx];
      } else if (daku) {
        out = DAKU[rowKey][idx];
      }
      // 小書きは「や・ゆ・よ・つ」だけ
      if (small && SMALLABLE.has(out)) {
        out = SMALL_MAP[out];
      }
      return out;
    }
  }

  // それ以外の行（あ行・な行・ま行・ら行 など）
  if (small && SMALLABLE.has(out)) {
    out = SMALL_MAP[out];
  }
  return out;
}


// 例語検索用：表示文字を清音へ戻す
function normalizeKana(k){
  if (UNSMALL_MAP[k]) k = UNSMALL_MAP[k];
  // 濁点/半濁 → 清音
  for (const rowKey of ["ka","sa","ta","ha"]) {
    const idxD = (DAKU[rowKey]||[]).indexOf(k);
    if (idxD !== -1) return ROW_K[rowKey][idxD];
  }
  const idxH = HANDAKU.indexOf(k);
  if (idxH !== -1) return ROW_K.ha[idxH];
  return k;
}

// ひらがな → カタカナ（読み上げ用）変換
function hiraToKata(str) {
  // ぁ(3041)〜ゖ(3096) をカタカナにずらす
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}


// ========== 例語ルックアップ（仮名→{kanji,yomi}） ==========
const KANA_MAP = new Map();
for (const row of ROWS) {
  for (const it of (row.items || [])) {
    if (it?.k && it.k !== "・") {
      KANA_MAP.set(it.k, it.ex || { kanji: "", yomi: "" });
    }
  }
}
for (const { k, ex } of EXTRA_HIRA_EXAMPLES) {
  KANA_MAP.set(k, ex);   // 小さい文字用の例語を上書き追加
}


function ensureStyle() {
  if (document.getElementById("hira-style-v2")) return;
  const st = document.createElement("style");
  st.id = "hira-style-v2";
  st.textContent = `
    .hira-wrap {
  display:flex;
  flex-direction:column;
  gap:8px;
  max-width:560px;
  margin:0 auto;
  padding-bottom:72px;   /* ← 下にバナーぶんの余白を確保 */
}


    /* 例語ボタン（押せる感） */
    .hira-exbtn {
      display:inline-flex; align-items:baseline; gap:.5rem;
      padding:.45rem .7rem; border:1px solid #e5e7eb; border-radius:12px;
      background:#fff; box-shadow:0 1px 0 rgba(0,0,0,.02);
      width:100%; justify-content:flex-start;
    }
    .hira-exbtn:hover { filter:brightness(0.98); }

    /* 格子 */
    .hira-grid {
      display:grid;
      grid-template-columns:repeat(5,1fr);
      gap:6px;                 /* ★ 8px → 6px：行と行のスキマを少しだけ圧縮 */
    }
    .hira-grid .btn { font-weight:700; height:48px; }

    /* 行のシマ模様（見やすさ）*/
    .hiraA { background:#f0f7ff; border-color:#d7e8ff; }
    .hiraB { background:#f7f9ff; border-color:#e5e9ff; }

    /* モードによって全体の色味を切替 */
    .mode-dakuten .hiraA, .mode-dakuten .hiraB { background:#fff3f3; border-color:#ffd9d9; }
    .mode-handaku .hiraA, .mode-handaku .hiraB { background:#fff8e8; border-color:#ffe6b3; }
    .mode-small   .hiraA, .mode-small   .hiraB { background:#eefaf4; border-color:#cfeedd; }

    /* トグル群 */
    .hira-toggles { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .hira-toggles .tbtn { padding:.4rem .7rem; border-radius:999px; border:1px solid #e5e7eb; background:#fff; }
    .hira-toggles .tbtn.on { border-color:#0ea5e9; box-shadow:0 0 0 2px rgba(14,165,233,.15) inset; background:#eaf6ff; }

    /* カード */
    .hira-card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fafafa; }
    .hira-card .kana { font-size:2.6rem; font-weight:700; line-height:1; }
    .row-full { width:100%; }

    .hiraChanged { background:#fee2e2 !important; border-color:#fecaca !important; }

    .hira-row {
     display:flex;
     align-items:center;
     justify-content:center;  
     gap:6px;
    }

    .hira-row .row-speaker {
      font-size:1.1rem;
    }

    /* ★ 画面上部の余白だけ少し減らす用クラス */
    .screen.hira-tight {
      padding-top:44px;       /* たぶん元が 24px 前後 → ちょっとだけ上に詰まる */
    }
    /* 画面が低い端末では、ボタンを少しだけ小さくして縦を詰める */
    @media (max-height: 640px){
     .hira-grid .btn {
      height:42px;
      font-size:1.05rem;
     }
    .hira-card .kana {
     font-size:2.3rem;
     }
    }

    @media (max-height: 580px){
     .hira-grid .btn {
      height:38px;
      font-size:1rem;
     }
     .hira-wrap {
      gap:6px;
     }
    }

  `;
  document.head.appendChild(st);
}

// ==========================================================
export async function render(el, deps = {}) {
  showMainBanner();
  ensureStyle();
  ttsSetLang("ja-JP");

  let mode = "base";           // "base" | "dakuten" | "handaku" | "small"
  let curKana = "あ";          // 直近でタップされた仮名（変形後を保持）
  let flags = { daku:false, handaku:false, small:false };

    const MAX_COMPOSE = 5;      // 最高5文字まで
  let composeChars = [];      // 押されたかなのリスト

  function updateComposeText() {
    const el = wrap.querySelector("#compose-text");
    if (!el) return;
    el.textContent = composeChars.length ? composeChars.join(" ") : "";
  }


  const root = document.createElement("div");
  root.className = "screen screen-sub hira-tight";

  el.appendChild(root);


  const wrap = document.createElement("div");
  wrap.className = "hira-wrap";
  root.appendChild(wrap);

 function headerHTML() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1 style="margin:0;">ひらがな</h1>
      <button id="back" class="btn" style="padding:.35rem .7rem;">
        ${t("common.back") || "Back"}
      </button>
    </div>
  `;
}

function togglesHTML(){
  return `
    <div id="hira-toggles" class="hira-toggles"
     style="display:flex;gap:8px;margin:4px 0 6px;align-items:center;border:1px dashed #cbd5e1;padding:6px 8px;border-radius:10px;background:#f8fafc;">


      <button class="btn tbtn" id="btnDaku"
              title="${t("hira.mode.daku") || "Add dakuten"}">゛</button>

      <button class="btn tbtn" id="btnHandaku"
              title="${t("hira.mode.handaku") || "Add handakuten"}">゜</button>

      <button class="btn tbtn" id="btnSmall"
              title="${t("hira.mode.small") || "Small kana"}">小</button>

      <button class="btn tbtn" id="btnReset"
              title="${t("hira.mode.reset") || "Reset"}">⟳</button>
    </div>`;
}

// ==== 行のレンダリング：ここだけ差し替え ====
function gridHTML(){
  return ROWS.map((row) => {
    // この行の清音だけをつないだ文字列（小さい行判定用）
    const rowKana = row.items
      .map(it => (it?.k && it.k !== "・") ? it.k : "")
      .join("");

    const isSmallRow = /[ゃゅょっ]/.test(rowKana);

    // 🔊ボタン（小さい文字の行はなし）
    const speakerHtml = isSmallRow
      ? `<div style="width:24px;"></div>`
      : `<button class="btn row-speaker"
                  style="padding:0 .3rem;min-width:24px;">🔊</button>`;

    const cells = row.items.map(it => {
      const base = it.k;
      const hole = !base || base === "・";
      if (hole) {
        return `<button class="btn" disabled
                        style="opacity:0;pointer-events:none;height:48px;"></button>`;
      }
      const disp = transformKana(base, flags);
      const changed = (disp !== base) ? "hiraChanged" : "";
      return `<button class="btn ${changed}"
                      data-k="${disp}"
                      data-base="${base}"
                      style="height:48px;font-size:1.2rem;">${disp}</button>`;
    }).join("");

    return `
      <div class="hira-row" style="display:flex;align-items:center;gap:6px;">
        ${speakerHtml}
        <div class="hira-grid"
             style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
          ${cells}
        </div>
      </div>`;
  }).join("");
}

function cardHTML(curKana){
  return `
    <div id="compose-area"
         style="margin-top:12px;border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fafafa;">
      <div id="compose-text"
           style="min-height:32px;font-size:1.4rem;margin-bottom:8px;word-wrap:break-word;">
        &nbsp;
      </div>
      <button id="compose-clear" class="btn"
        style="padding:.32rem .8rem;font-size:.9rem;">
  ${t("common.clear")}
</button>

    </div>`;
}


// 追加：描画後にi18nラベルを確定させる
function applyI18nLabels() {
  const backBtn  = wrap.querySelector("#back");
  if (backBtn) backBtn.textContent = t("common.back") || "Back";

  const againBtn = wrap.querySelector("#again");
  if (againBtn) againBtn.innerHTML = `🔁 ${t("hira.again") || "Play again"}`;
}

function mountGrid(){
  // 1) 最初の描画
  wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML(curKana);
  applyI18nLabels();

  console.log("[hiragana] mountGrid()");

function showHiraTutorialBubble() {
  // もう表示済みなら出さない
  if (localStorage.getItem(LS_HIRA_TUTORIAL)) return;

  // ここで「チュートリアル完了」とみなす
  localStorage.setItem(LS_HIRA_TUTORIAL, "1");

  // 画面全体おおう薄いオーバーレイ
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.35);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 9999;
    pointer-events: auto;
  `;

  // 吹き出しっぽいボックス
  const box = document.createElement("div");
  box.style.cssText = `
    max-width: 520px;
    width: calc(100% - 32px);
    margin-bottom: 40px;
    background: #ffffff;
    border-radius: 18px;
    padding: 14px 16px 12px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
    text-align: left;
    box-sizing: border-box;
  `;
  box.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;font-size:1rem;">
      ${t("tutorial.hiraTitle") || "使い方"}
    </div>
    <div style="font-size:.9rem;line-height:1.5;margin-bottom:10px;">
      ${t("tutorial.hiraBody")
        || "🔊ボタンや文字をタップすると、ひらがなを読み上げます。終わったら「Back」でメニューに戻れます。"}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:4px;">
      <button class="btn" id="hiraTutOk"
              style="min-width:84px;padding:.35rem .9rem;">
        ${t("tutorial.ok") || "OK"}
      </button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.querySelector("#hiraTutOk")?.addEventListener("click", () => {
    overlay.remove();
  });

  // オーバーレイ外クリックでも閉じたい場合
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
}

  // Back & モードボタンにイベントを付ける関数
function bindHeaderAndToggles(){
    // Back
    wrap.querySelector("#back")?.addEventListener("click", async () => { // ←★ async を追加
      await destroyBanner();                                    // ←★ await を追加
      deps.goto?.("menu1");
});

    // 濁点
    wrap.querySelector("#btnDaku")?.addEventListener("click", () => {
      flags.daku = !flags.daku;
      if (flags.daku) flags.handaku = false;   // 濁点ONなら半濁をOFF
      refresh();
    });

    // 半濁点
    wrap.querySelector("#btnHandaku")?.addEventListener("click", () => {
      flags.handaku = !flags.handaku;
      if (flags.handaku) flags.daku = false;   // 半濁ONなら濁点をOFF
      refresh();
    });

    // 小書き
    wrap.querySelector("#btnSmall")?.addEventListener("click", () => {
      flags.small = !flags.small;
      refresh();
    });

    // リセット
    wrap.querySelector("#btnReset")?.addEventListener("click", () => {
      flags = { daku:false, handaku:false, small:false };
      refresh();
    });

  }

  // 2) 再描画ヘルパ（画面を描き直してイベントを張り直す）
  const refresh = () => {
    wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML(curKana);
    applyI18nLabels();
    wireEvents();          // かなボタン & カードのイベント
    bindHeaderAndToggles(); // Back & モードボタンのイベント
  };

  // 3) 最初のイベント付け
  wireEvents();
  bindHeaderAndToggles();
}

function wireEvents(){
    // 50音ボタン
  wrap.querySelectorAll("button[data-k]").forEach((b) => {
    b.onclick = () => {
      const k = b.getAttribute("data-k"); // 画面に表示されてるかな
      if (!k || k === "・") return;

      // 最大5文字まで
      if (composeChars.length >= MAX_COMPOSE) return;

      const beforeLen = composeChars.length;

      // 文字を追加
      composeChars.push(k);
      updateComposeText();

      
      // --- 読み上げロジック（async/awaitを使った新しい方法）---
      const runSpeakSequence = async () => {
        // まず、今押した文字を読み上げる
        await speak(k);

        // もし、これで2文字以上になったら…
        if (composeChars.length > 1) {
          // 少しだけ間を置いてから（0.1秒）、出来上がった単語全体を読む
          const full = composeChars.join("");
          setTimeout(() => speak(full), 100);
        }
      };
      runSpeakSequence(); // 作成した読み上げ処理を実行

    };
  });


            // 🔊 行読み上げ（1文字ずつ順番に再生）
  wrap.querySelectorAll(".row-speaker").forEach((btn) => {
    btn.onclick = () => {
      const rowDiv = btn.closest(".hira-row");
      if (!rowDiv) return;

      const grid = rowDiv.querySelector(".hira-grid");
      if (!grid) return;

      // ベースかな → 現在の flags で変換 → カタカナに
      const kanaList = Array.from(
        grid.querySelectorAll("button[data-base]")
      )
        .map((b) => b.getAttribute("data-base"))
        .filter((base) => base && base !== "・")
        .map((base) => transformKana(base, flags)); // 濁点・小書き反映

      if (!kanaList.length) return;

      const seq = kanaList.map((k) => hiraToKata(k)); // 「あ→ア」

      let i = 0;
      const playNext = () => {
        if (i >= seq.length) return;
        speak(seq[i++]);          // 1文字だけ読み上げ
        setTimeout(playNext, 450); // 0.45秒ごとに次へ（好みで調整OK）
      };

      playNext();
    };
  });

  wireCardEvents();  // カード側のイベント
}

function wireCardEvents(){
  const clearBtn = wrap.querySelector("#compose-clear");
  if (!clearBtn) return;

  // 画面を描き直したあとにも、今の内容を反映
  updateComposeText();

  clearBtn.onclick = () => {
    composeChars = [];
    updateComposeText();
  };
}


   // 初期描画
  mountGrid();

  // 初回だけ、ひらがなチュートリアル吹き出し
  showHiraTutorialBubble();

  // === ひらがな画面用の下固定バナー ===
  const bannerRow = document.createElement("div");
  bannerRow.className = "banner-slot";
  bannerRow.textContent = "";
  el.appendChild(bannerRow);

  // 画面離脱でTTS停止
  const onHide = () => stop();
  window.addEventListener("pagehide", onHide, { once:true });
}

