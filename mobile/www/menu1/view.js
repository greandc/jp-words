// mobile/www/menu1/view.js
import { t, getLang, setLang } from "../i18n.js";

// 一度だけ「ひらがなチュートリアル」を出したかどうか（ひらがな画面と同じキー）
const HIRA_TUTORIAL_KEY = "jpVocab.tutorial.hiraHintShown";

const LS_MENU1_HINT = "jpVocab.tutorial.menu1HintShown";

function ensureMenu1HintStyle() {
  if (document.getElementById("menu1-hint-style")) return;
  const st = document.createElement("style");
  st.id = "menu1-hint-style";
  st.textContent = `
    .menu1-hint {
      background:#0f172a;
      color:#f9fafb;
      border-radius:12px;
      padding:10px 12px;
      margin:8px 0 4px;
      box-shadow:0 10px 25px rgba(15,23,42,.25);
      font-size:.9rem;
      line-height:1.5;
    }
    .menu1-hint-title {
      font-weight:600;
      margin-bottom:4px;
      font-size:.95rem;
    }
    .menu1-hint-body {
      opacity:.95;
    }
    .menu1-hira-highlight {
      background:#fffbeb !important;
      border-color:#facc15 !important;
      box-shadow:0 0 0 2px rgba(250,204,21,.55);
    }
  `;
  document.head.appendChild(st);
}

function showMenu1Hint(root) {
  // 既に表示済みなら何もしない
  try {
    if (localStorage.getItem(LS_MENU1_HINT) === "1") return;
  } catch {}

  ensureMenu1HintStyle();

  // 「ひらがな」ボタンを探す（テキストで判定）
  const buttons = root.querySelectorAll("button, .btn");
  let hiraBtn = null;
  for (const b of buttons) {
    if (b.textContent.trim() === "ひらがな") {
      hiraBtn = b;
      break;
    }
  }
  if (!hiraBtn) return;

  // 「ひらがな」より少し上に入れたいので、その直前に挿入する
  const bubble = document.createElement("div");
  bubble.className = "menu1-hint";
  const title =
    t("tutorial.menu1Title") || "Start from Hiragana";
  const body =
    t("tutorial.menu1Hint") ||
    "First, tap this 「ひらがな」 button to begin. Other menus will unlock after this step.";

  bubble.innerHTML = `
    <div class="menu1-hint-title">${title}</div>
    <div class="menu1-hint-body">${body}</div>
  `;

  // 「ひらがな」ボタンを目立たせる
  hiraBtn.classList.add("menu1-hira-highlight");

  // ボタンのすぐ上に吹き出しを挿入
  const parent = hiraBtn.parentElement || root;
  parent.insertBefore(bubble, hiraBtn);

  // 「ひらがな」を押したらヒント終了
  const finish = () => {
    try { localStorage.setItem(LS_MENU1_HINT, "1"); } catch {}
    bubble.remove();
    hiraBtn.classList.remove("menu1-hira-highlight");
    hiraBtn.removeEventListener("click", finish);
  };
  hiraBtn.addEventListener("click", finish);
}



// === Stats (日本時間で日付カウント) ===
const LS_STATS_KEY = "jpVocab.stats.days"; // ["YYYY-MM-DD", ...]

function tokyoDateId(d = new Date()){
  // 日本時間(Asia/Tokyo)で YYYY-MM-DD を作る
  const z = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(d).reduce((o,p)=> (o[p.type]=p.value, o), {});
  return `${z.year}-${z.month}-${z.day}`;
}
function loadDays(){
  try { return JSON.parse(localStorage.getItem(LS_STATS_KEY) || "[]"); } catch { return []; }
}
function saveDays(arr){
  try { localStorage.setItem(LS_STATS_KEY, JSON.stringify(arr)); } catch {}
}
function touchToday(){
  const days = loadDays();
  const today = tokyoDateId();
  if (!days.includes(today)){ days.push(today); saveDays(days); }
  return days;
}
function calcStreak(days){
  if (!days.length) return { total: 0, streak: 0 };
  const set = new Set(days);
  let streak = 0;
  // 今日から過去へ連続しているかチェック（日本時間ベース）
  let cur = new Date();
  while (true){
    const id = tokyoDateId(cur);
    if (!set.has(id)) break;
    streak++;
    cur.setDate(cur.getDate()-1);
  }
  return { total: days.length, streak };
}

export async function render(el, deps = {}) {
  ensureMenu1HintStyle();
  const days = touchToday();
  const { total, streak } = calcStreak(days);

  // ===== ラッパ（画面全体）=====
  const shell = document.createElement("div");
  shell.className = "screen screen-menu1-shell";

  
  // 隠れてしまわないよう、画面全体を包むこの要素の下に、あらかじめ隙間を空けておきます。
  shell.style.paddingBottom = "52px";

  const div = document.createElement("div");
  div.className = "screen";

  div.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr auto;align-items:end;gap:12px;">
      <h1 style="margin:0;">${t("Menu")}</h1>
      <div style="text-align:right;">
        <div style="font-weight:600;color:#0ea5e9;">
          ${t("stats.total", { n: total })} · ${t("stats.streak", { n: streak })}
        </div>
        <div style="font-size:.8rem;color:#64748b;">${t("stats.note")}</div>
      </div>
    </div>
    <p style="margin:.5rem 0 0;">${t("")}</p>
    <div id="list" style="display:grid;gap:10px;"></div>
  `;

  shell.appendChild(div);
  el.appendChild(shell);

  const list = div.querySelector("#list");
  const ranges = [[1, 20], [21, 40], [41, 60], [61, 80], [81, 100],];
  let highestCleared = 0;
  try { highestCleared = Number(localStorage.getItem("jpVocab.progress.highestCleared") || "0"); } catch {}
  let unlockedIndex = Math.floor((Math.max(0, highestCleared - 1)) / 20);
  if (highestCleared > 0 && highestCleared % 20 === 0) { unlockedIndex += 1; }
  unlockedIndex = Math.max(0, Math.min(ranges.length - 1, unlockedIndex));
  const hiraTutorialDone = localStorage.getItem(HIRA_TUTORIAL_KEY) === "1";
  const tutorialHiraOnly = !hiraTutorialDone;
  const mk = (label, onClick, locked = false) => {
    const b = document.createElement("button");
    b.className = `btn ${locked ? "btn--locked" : ""}`;
    b.textContent = label;
    b.disabled = !!locked;
    if (!locked) b.addEventListener("click", onClick);
    return b;
  };
  ranges.forEach(([a, b], idx) => {
    const lockedByProgress = idx > unlockedIndex;
    const locked = tutorialHiraOnly ? true : lockedByProgress;
    list.appendChild(
      mk(`Lv${a}–${b}`, () => {
        if (locked) return;
        deps.setRange?.([a, b]);
        deps.goto?.("menu2");
      }, locked)
    );
  });

  // ひらがなボタンは変数に保持
  const hiraBtn = mk("ひらがな", () => deps.goto?.("hiragana"));
  list.appendChild(hiraBtn);

  const lockOthers = tutorialHiraOnly;
  list.appendChild(
    mk("カタカナ", () => { if (lockOthers) return; deps.goto?.("katakana"); }, lockOthers)
  );
  list.appendChild(
    mk(t("numbers.title"), () => { if (lockOthers) return; deps.goto?.("numbers"); }, lockOthers)
  );
  list.appendChild(mk(t("common.back"), () => deps.goto?.("title")));
  const LANG_NAME = { en:"English", ja:"日本語", zh:"中文", ko:"한국어", es:"Español", fr:"Français", de:"Deutsch", it:"Italiano", pt:"Português", vi:"Tiếng Việt", id:"Bahasa Indonesia", th:"ไทย", ru:"Русский", tr:"Türkçe", ar:"العربية", fa:"فارسی", hi:"हिन्दी", ms:"Bahasa Melayu", nl:"Nederlands", pl:"Polski", sv:"Svenska", uk:"Українська", el:"Ελληνικά", cs:"Čeština", hu:"Magyar", ro:"Română", he:"עברית", km:"ខ្មែរ", lo:"ລາວ", ne:"नेपाली", tl:"Filipino", };
  const label = `${t("settings.language")}: ${LANG_NAME[getLang()] || getLang()}`;
  list.appendChild(mk(label, () => deps.goto?.("lang")));

  showMenu1Hint(div);

  // --- 一番下のバナー行 ---
  const bannerRow = document.createElement("div");

  bannerRow.className = "banner-slot";
  bannerRow.textContent = "［ バナー広告スペース（仮かり） ］";

  
  shell.appendChild(bannerRow);
}


