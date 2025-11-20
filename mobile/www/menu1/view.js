// mobile/www/menu1/view.js
import { t, getLang, setLang } from "../i18n.js";

// 一度だけ「ひらがなチュートリアル」を出したかどうか（ひらがな画面と同じキー）
const HIRA_TUTORIAL_KEY = "jpVocab.tutorial.hiraHintShown";

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
  const days = touchToday();
  const { total, streak } = calcStreak(days);

  // ===== ラッパ（画面全体＋バナー枠） =====
  const shell = document.createElement("div");
  shell.className = "screen-menu1-shell";
  shell.style.cssText = `
    min-height: 100svh;
    width: 100vw;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
  `;

  // ===== いままでの screen 本体 =====
  const div = document.createElement("div");
  div.className = "screen";
  // 上は普通に伸ばして、下バナー分だけ余白少なめにしてもOK
  div.style.flex = "1 0 auto";

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
    <div id="list" style="display:grid;gap:12px;"></div>
  `;

  // ===== 下バナー枠（いまはダミー表示）=====
  const banner = document.createElement("div");
  banner.className = "menu1-banner";
  banner.style.cssText = `
    flex: 0 0 auto;
    height: 52px;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    color: #64748b;
    background: #f3f4f6;
    border-top: 1px solid #e5e7eb;
  `;
  banner.textContent = "[ バナー広告スペース（仮） ]";

  // ラッパに詰めてから画面に追加
  shell.appendChild(div);
  shell.appendChild(banner);
  el.appendChild(shell);

  // ===== ここから下は今までと同じ =====
  const list = div.querySelector("#list");

  // 20 レベル刻みのレンジ定義
  const ranges = [
    [1, 20],
    [21, 40],
    [41, 60],
    [61, 80],
    [81, 100],
  ];

  // === 最高クリアLvを読む ===
  let highestCleared = 0;
  try {
    highestCleared = Number(
      localStorage.getItem("jpVocab.progress.highestCleared") || "0"
    );
  } catch {}

  // === ブロックごとの解放ロジック ===
  let unlockedIndex = Math.floor((Math.max(0, highestCleared - 1)) / 20);
  if (highestCleared > 0 && highestCleared % 20 === 0) {
    unlockedIndex += 1;
  }
  unlockedIndex = Math.max(0, Math.min(ranges.length - 1, unlockedIndex));

  // ===== ひらがなチュートリアルの状態 =====
const HIRA_TUTORIAL_KEY = "jpVocab.tutorial.hiraHintShown";  // ← ひらがな側と合わせる

const hiraTutorialDone =
  localStorage.getItem(HIRA_TUTORIAL_KEY) === "1";

const tutorialHiraOnly = !hiraTutorialDone;  // true のあいだは「ひらがなだけ」モード


  // ボタン生成ヘルパ
  const mk = (label, onClick, locked = false) => {
    const b = document.createElement("button");
    b.className = `btn ${locked ? "btn--locked" : ""}`;
    b.textContent = label;
    b.disabled = !!locked;
    if (!locked) b.addEventListener("click", onClick);
    return b;
  };

  // レンジのボタンを並べる
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

  // ひらがなは常に有効
  list.appendChild(
    mk("ひらがな", () => deps.goto?.("hiragana"))
  );

  const lockOthers = tutorialHiraOnly;

  list.appendChild(
    mk("カタカナ", () => {
      if (lockOthers) return;
      deps.goto?.("katakana");
    }, lockOthers)
  );

  list.appendChild(
    mk(t("numbers.title"), () => {
      if (lockOthers) return;
      deps.goto?.("numbers");
    }, lockOthers)
  );

  // Back
  list.appendChild(
    mk(t("common.back"), () => deps.goto?.("title"))
  );

  // 言語名表示
  const LANG_NAME = {
    en:"English", ja:"日本語", zh:"中文", ko:"한국어",
    es:"Español", fr:"Français", de:"Deutsch",
    it:"Italiano", pt:"Português", vi:"Tiếng Việt",
    id:"Bahasa Indonesia", th:"ไทย", ru:"Русский", tr:"Türkçe",
    ar:"العربية", fa:"فارسی", hi:"हिन्दी", ms:"Bahasa Melayu",
    nl:"Nederlands", pl:"Polski", sv:"Svenska", uk:"Українська",
    el:"Ελληνικά", cs:"Čeština", hu:"Magyar", ro:"Română", he:"עברית",
    km:"ខ្មែរ", lo:"ລາວ", ne:"नेपाली", tl:"Filipino",
  };
  const label =
    `${t("settings.language")}: ${LANG_NAME[getLang()] || getLang()}`;
  list.appendChild(mk(label, () => deps.goto?.("lang")));
}
