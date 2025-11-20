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

  // ===== ラッパ（画面全体＋バナー）=====
  const shell = document.createElement("div");
  shell.className = "screen-menu1-shell";
  shell.style.cssText = `
    width: 100vw;
    min-height: 100svh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 0;
    margin: 0;
  `;

  // ===== 上側（コンテンツ本体）=====
  const div = document.createElement("div");
  div.className = "screen";
  div.style.cssText = `
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    padding: 0 20px 16px 20px;   /* ← 下だけ少し空けておく */
    box-sizing: border-box;
  `;

  div.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr auto;align-items:end;gap:12px;">
      <H1 style="margin:0;">${t("Menu")}</h1>
      <div style="text-align:right;">
        <div style="font-weight:600;color:#0ea5e9;">
          ${t("stats.total", { n: total })} · ${t("stats.streak", { n: streak })}
        </div>
        <div style="font-size:.8rem;color:#64748b;">${t("stats.note")}</div>
      </div>
    </div>

    <p style="margin:.5rem 0 0;">${t("")}</p>

    <!-- ボタンリスト -->
    <div id="list" style="
      display:grid;
      gap:14px;
      width:100%;
    "></div>
  `;

  // ===== 下側バナー（左右MAX）=====
  const banner = document.createElement("div");
  banner.className = "menu1-banner";
  banner.style.cssText = `
    flex: 0 0 auto;
    width: 100%;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    /* 広告らしい見た目 */
    background: #f3f4f6;
    border-top: 1px solid #e5e7eb;

    font-size: 0.85rem;
    color: #6b7280;
  `;
  banner.textContent = "[ バナー広告スペース（仮） ]";

  // ラッパに追加
  shell.appendChild(div);
  shell.appendChild(banner);
  el.appendChild(shell);

  // ====== ここから下は今まで通り（list の構築）=====


  list.appendChild(bannerRow);
}

