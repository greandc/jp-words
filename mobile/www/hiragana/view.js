// mobile/www/hiragana/view.js
import { t } from "../i18n.js";
import { speak, stop, setLang as ttsSetLang } from "../tts.v2.js";
import { ROWS } from "./data.hira.js";
import { transformKana, normalizeKana } from "./transformKana.js";

console.log("HIRAGANA SRC = v2");

// ========== 例語ルックアップ（仮名→{kanji,yomi}） ==========
// data.hira.js 側で rows 以外に {k,ex} だけの要素があっても拾えるようにしている
const KANA_MAP = new Map();
for (const row of ROWS) {
  if (row.items) {
    for (const it of (row.items || [])) {
      if (it?.k && it.k !== "・") {
        KANA_MAP.set(it.k, it.ex || { kanji: "", yomi: "" });
      }
    }
  } else if (row?.k) {
    KANA_MAP.set(row.k, row.ex || { kanji: "", yomi: "" });
  }
}

// ========== スタイル注入 ==========
// ひらがな / カタカナで共通して使うクラス
function ensureStyle() {
  if (document.getElementById("hira-style-v2")) return;
  const st = document.createElement("style");
  st.id = "hira-style-v2";
  st.textContent = `
    .hira-wrap {
      display:flex;
      flex-direction:column;
      gap:12px;
      max-width:560px;
      margin:0 auto;
    }

    /* 行コンテナ（左に🔉、右に 5×n グリッド） */
    .hira-row {
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:4px;
    }

    .hira-row .row-speaker.btn {
      width:40px;
      min-width:40px;
      padding:0;
      font-size:1.1rem;
    }

    /* 例語ボタン（押せる感） */
    .hira-exbtn {
      display:inline-flex;
      align-items:baseline;
      gap:.5rem;
      padding:.45rem .7rem;
      border:1px solid #e5e7eb;
      border-radius:12px;
      background:#fff;
      box-shadow:0 1px 0 rgba(0,0,0,.02);
      width:100%;
      justify-content:flex-start;
      box-sizing:border-box;
    }
    .hira-exbtn:hover { filter:brightness(0.98); }

    /* 格子 */
    .hira-grid {
      display:grid;
      grid-template-columns:repeat(5,1fr);
      gap:8px;
      flex:1;
    }
    .hira-grid .btn {
      font-weight:700;
      height:48px;
    }

    /* 行のシマ模様（見やすさ）*/
    .hiraA { background:#f0f7ff; border-color:#d7e8ff; }
    .hiraB { background:#f7f9ff; border-color:#e5e9ff; }

    /* モードによって全体の色味を切替 */
    .mode-dakuten .hiraA, .mode-dakuten .hiraB {
      background:#fff3f3;
      border-color:#ffd9d9;
    }
    .mode-handaku .hiraA, .mode-handaku .hiraB {
      background:#fff8e8;
      border-color:#ffe6b3;
    }
    .mode-small   .hiraA, .mode-small   .hiraB {
      background:#eefaf4;
      border-color:#cfeedd;
    }

    /* トグル群 */
    .hira-toggles {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      align-items:center;
    }
    .hira-toggles .tbtn {
      padding:.4rem .7rem;
      border-radius:999px;
      border:1px solid #e5e7eb;
      background:#fff;
    }
    .hira-toggles .tbtn.on {
      border-color:#0ea5e9;
      box-shadow:0 0 0 2px rgba(14,165,233,.15) inset;
      background:#eaf6ff;
    }

    /* カード */
    .hira-card {
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:12px;
      background:#fafafa;
      box-sizing:border-box;
    }
    .hira-card .kana {
      font-size:2.6rem;
      font-weight:700;
      line-height:1;
    }

    .hiraChanged {
      background:#fee2e2 !important;
      border-color:#fecaca !important;
    }
  `;
  document.head.appendChild(st);
}

// ==========================================================
export async function render(el, deps = {}) {
  ensureStyle();
  ttsSetLang("ja-JP");

  let curKana = "あ";
  let flags = { daku:false, handaku:false, small:false };

  const root = document.createElement("div");
  root.className = "screen";
  el.appendChild(root);

  const wrap = document.createElement("div");
  wrap.className = "hira-wrap mode-base";
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

  function togglesHTML() {
    return `
      <div id="hira-toggles" class="hira-toggles"
           style="display:flex;gap:8px;margin:10px 0 6px;align-items:center;border:1px dashed #cbd5e1;padding:6px 8px;border-radius:10px;background:#f8fafc;">
        <span style="font-size:.9rem;color:#475569;">モード：</span>
        <button class="btn tbtn" id="btnDaku"    title="濁点">゛</button>
        <button class="btn tbtn" id="btnHandaku" title="半濁点">゜</button>
        <button class="btn tbtn" id="btnSmall"   title="小書き">小</button>
        <button class="btn tbtn" id="btnReset"   title="リセット">⟳</button>
      </div>
    `;
  }

  // 行＋グリッド＋🔉
  function gridHTML() {
    return ROWS.map((row, rowIdx) => {
      if (!row.items) return ""; // 追加の {k,ex} などが混じっていてもスルー

      const cells = row.items.map(it => {
        const base = it.k;
        const hole = !base || base === "・";
        if (hole) {
          return `<button class="btn" disabled style="opacity:0;pointer-events:none;height:48px;"></button>`;
        }
        const disp = transformKana(base, flags);
        const changed = disp !== base ? "hiraChanged" : "";
        return `<button class="btn ${changed}" data-k="${disp}" data-base="${base}"
                  style="height:48px;font-size:1.2rem;">${disp}</button>`;
      }).join("");

      // 小モードのとき、た行・や行の 🔉 は非表示
      const hideSpeaker = flags.small && (row.name === "た行" || row.name === "や行");
      const speakerPart = hideSpeaker
        ? `<div style="width:40px;min-width:40px;"></div>`
        : `<button class="btn row-speaker" data-row-idx="${rowIdx}"
                   title="この行をまとめて再生">🔉</button>`;

      return `
        <div class="hira-row" data-row-name="${row.name || ""}">
          ${speakerPart}
          <div class="hira-grid">${cells}</div>
        </div>
      `;
    }).join("");
  }

  function cardHTML(kana) {
    const base = normalizeKana(kana);
    const ex = KANA_MAP.get(base) || { kanji:"", yomi:"" };
    return `
      <div id="card" class="hira-card">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="kana">${kana}</div>
          <button class="btn" id="again"
                  style="padding:.32rem .6rem;font-size:.95rem;">
            🔁 ${t("hira.again") || "Play again"}
          </button>
        </div>
        <button id="ex" class="hira-exbtn" style="margin-top:8px;">
          <span style="font-size:1.2rem;">${ex.kanji}</span>
          <span style="font-size:1rem;color:#374151;">${ex.yomi ? `（${ex.yomi}）` : ""}</span>
        </button>
      </div>
    `;
  }

  function applyI18nLabels() {
    const backBtn  = wrap.querySelector("#back");
    if (backBtn) backBtn.textContent = t("common.back") || "Back";

    const againBtn = wrap.querySelector("#again");
    if (againBtn) againBtn.innerHTML = `🔁 ${t("hira.again") || "Play again"}`;
  }

  function updateModeClass() {
    wrap.classList.remove("mode-base","mode-dakuten","mode-handaku","mode-small");
    if (flags.handaku)      wrap.classList.add("mode-handaku");
    else if (flags.daku)    wrap.classList.add("mode-dakuten");
    else if (flags.small)   wrap.classList.add("mode-small");
    else                    wrap.classList.add("mode-base");
  }

  function mountGrid() {
    wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML(curKana);
    applyI18nLabels();
    updateModeClass();
    wireEvents();
  }

  function wireEvents() {
    // 戻る
    wrap.querySelector("#back")?.addEventListener("click", () => {
      deps.goto?.("menu1");
    });

    // 50音表：1文字タップ
    wrap.querySelectorAll("button[data-k]").forEach((b) => {
      b.onclick = () => {
        const k = b.getAttribute("data-k");
        if (!k || k === "・") return;
        curKana = k;

        const card = wrap.querySelector("#card");
        if (card) card.outerHTML = cardHTML(curKana);

        wireCardEvents();
        applyI18nLabels();
        speak(curKana);
      };
    });

    // 行読み上げ 🔉
    wrap.querySelectorAll(".row-speaker").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-row-idx") || "-1");
        const row = ROWS[idx];
        if (!row || !row.items) return;

        const chars = row.items
          .map(it => it.k)
          .filter(k => k && k !== "・")
          .map(k => transformKana(k, flags))
          .join("");

        if (chars) speak(chars);
      };
    });

    // トグル
    const btnD = wrap.querySelector("#btnDaku");
    const btnH = wrap.querySelector("#btnHandaku");
    const btnS = wrap.querySelector("#btnSmall");
    const btnR = wrap.querySelector("#btnReset");

    const refresh = () => {
      wrap.innerHTML = headerHTML() + togglesHTML() + gridHTML() + cardHTML(curKana);
      wireEvents();
      applyI18nLabels();
      updateModeClass();
    };

    btnD?.addEventListener("click", () => {
      flags.daku = !flags.daku;
      if (flags.daku) flags.handaku = false;
      refresh();
    });

    btnH?.addEventListener("click", () => {
      flags.handaku = !flags.handaku;
      if (flags.handaku) flags.daku = false;
      refresh();
    });

    btnS?.addEventListener("click", () => {
      flags.small = !flags.small;
      refresh();
    });

    btnR?.addEventListener("click", () => {
      flags = { daku:false, handaku:false, small:false };
      refresh();
    });

    wireCardEvents();
  }

  function wireCardEvents() {
    wrap.querySelector("#again")?.addEventListener("click", () => speak(curKana));

    const base = normalizeKana(curKana);
    const ex   = KANA_MAP.get(base);
    wrap.querySelector("#ex")?.addEventListener("click", () => {
      if (ex?.yomi) speak(ex.yomi);
    });
  }

  // 初期描画
  mountGrid();

  // 画面離脱でTTS停止
  const onHide = () => stop();
  window.addEventListener("pagehide", onHide, { once:true });
}
