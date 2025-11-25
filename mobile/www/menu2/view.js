// app/features/menu2/view.js
import { t, getLang, setLang } from "../i18n.js";


export async function render(el, deps = {}) {
  const [a, b] = deps.getRange?.() || [1, 20];

  // 画面全体
  const root = document.createElement("div");
  root.className = "screen screen-sub screen-menu2";

  // 中身用のラッパ（位置調整用）
  root.innerHTML = `
    <div class="menu2-inner">
      <h1>${t("menu2.title")}</h1>
      <p>${t("menu2.subtitle")}</p>
      <div id="grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px;"></div>
      <div style="display:grid;gap:12px;margin-top:16px;">
        <button class="btn" id="back">${t("common.back")}</button>
      </div>
    </div>
  `;
  el.appendChild(root);

  // ===== ボタン生成（以下はそのまま）=====
  const grid = root.querySelector("#grid");


// どのキーを見ていても解放になるように、最大値を総合判定
let maxUnlocked = 1;
try {
  const byMax     = Number(localStorage.getItem("jpVocab.maxLevel")        || "0"); // 新
  const byCurrent = Number(localStorage.getItem("jpVocab.currentLevel")    || "0"); // 互換
  const byLegacy  = Number(localStorage.getItem("jpVocab.progress.highestCleared") || "0") + 1; // 旧仕様(+1で次が解放)
  maxUnlocked = Math.max(1, byMax, byCurrent, byLegacy);
} catch {}

// このページの範囲に丸めておく（1..20 / 21..40 など）
const pageMax = Math.min(b, Math.max(a, maxUnlocked));

for (let i = a; i <= b; i++) {
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.textContent = String(i);          // 表示は絶対番号 21..40 など
  btn.dataset.abs = String(i);          // 絶対番号
  btn.dataset.set = String(i - a + 1);  // セット番号 1..20

  const locked = i > pageMax;           // ★ ロック判定は pageMax 基準

  if (locked) {
    btn.disabled = true;
    btn.style.opacity = 0.5;
    btn.title = (t?.("locked")) || "Locked";
  } else {
    btn.addEventListener("click", (e) => {
      const abs = Number(e.currentTarget.dataset.abs);
      const set = Number(e.currentTarget.dataset.set);

      // 選択状態の保存（メニュー遷移先がどのキーを見てもOKにする）
      sessionStorage.setItem("selectedLevel", String(abs));
      try {
        localStorage.setItem("jpVocab.level",         String(abs));
        localStorage.setItem("jpVocab.currentLevel",  String(abs));
        // maxLevel は「解放上限」なので、押したレベルが上なら更新
        const prevMax = Number(localStorage.getItem("jpVocab.maxLevel") || "1");
        if (abs > prevMax) localStorage.setItem("jpVocab.maxLevel", String(abs));
      } catch {}

      deps.setSet?.(set);   // ← 状態はセット番号で渡す
      deps.goto?.("menu3");
    });
  }

  grid.appendChild(btn);
}

    root.querySelector("#back").addEventListener("click", () => deps.goto?.("menu1"));

  // === Menu2 画面用の下固定バナー ===
  const bannerRow = document.createElement("div");
  bannerRow.className = "banner-slot";
  bannerRow.textContent = "";
  el.appendChild(bannerRow);
}

