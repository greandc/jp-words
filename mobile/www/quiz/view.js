// deploy-bump 2025-11-02
/* app/features/quiz/view.js */
/* global React, ReactDOM */
const R  = window.React;
const RD = window.ReactDOM;
if (!R || !RD) throw new Error("React/ReactDOM が読み込まれていません");
const h  = R.createElement;   // ← ここに移動


// ===== 依存 =====
import { MAX_Q }   from "../config.js";
import { loadLevel } from "../data/loader.js";
import { t, getLang } from "../i18n.js"; // getLang 使うなら一緒に
import {
  speak, stop, ttsAvailable,
  setLang as ttsSetLang,
  setRate as ttsSetRate,
  setPitch as ttsSetPitch
} from "../tts.v2.js?v=v2-20251109d";


// ===== 定数（レイアウト固定）=====
const ROWS       = 5;      // 5行固定
const CELL_MIN   = 76;
const CELL_MAX   = 112;
const GAP_Y      = 12;
const BACK_H     = 48;
const HEARTS     = 5;
const SECS_PER_Q = 5;      // 1問=5秒

// ===== ヘルパ =====
function fmtTime(sec){
  const m = Math.max(0, Math.floor(sec/60));
  const s = Math.max(0, sec%60);
  return `${m}:${String(s).padStart(2,"0")}`;
}

function breakSlashes(text){
  return String(text ?? "").replace(/\s*\/\s*/g, " /&#8203;");
}

// 配列をその場でシャッフル（Fisher–Yates）
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ★ これが今回追加する共通ヘルパ：盤面が空なら true
function boardEmpty(L, R){
  return Array.isArray(L) && Array.isArray(R)
      && L.every(v => v == null)
      && R.every(v => v == null);
}

// TTS（ふりがな優先で読む）
function speakJPFromItem(item, useFuri){
  try{
    const text = (useFuri && (item?.jp?.reading || item?.kana))
      ? (item.jp.reading || item.kana)
      : (item?.jp?.orth || "");
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch{}
}

function readCurrentLevel(){
  const lv =
    Number(localStorage.getItem("jpVocab.currentLevel")) ||
    Number(sessionStorage.getItem("selectedLevel")) ||
    Number(localStorage.getItem("jpVocab.level")) ||
    1;
  console.log("[quiz] read level =", lv);
  return lv;
}

// hearts 表示
function renderHearts(n){
  const kids = [];
  for (let i=0;i<n;i++){
    kids.push(R.createElement("span", { key:i, style:{fontSize:22, marginRight:8}}, "💗"));
  }
  return R.createElement(R.Fragment, null, ...kids);
}

function QuizOverlay({ type, goto, onClear }) {
  if (!type) return null;

  const title =
  type === "clear"   ? t("result.clearTitle") :
     type === "fail"    ? t("result.failTitle") :
     type === "timeout" ? t("result.timeoutTitle") : "";

  const desc =
    type === "clear"   ? t("result.clearDesc") :
     type === "fail"    ? t("result.failDesc") :
     type === "timeout" ? t("result.timeoutDesc") : "";

  const onPrimary = () => {
    if (type === "clear") {
      try { onClear?.(); } catch {}
      goto?.("menu2");
      return;
    }
    if (type === "fail") { goto?.("menu3"); return; }
    goto?.("testTitle");
  };

  return h("div", { className: "quiz-overlay" },
    h("div", { className: "panel" },
      h("div", { className: "ttl"  }, title),
      h("div", { className: "desc" }, desc),
      h("button", { className: "btn", onClick: onPrimary },
        type === "clear" ? t("result.nextLevel") : t("result.returnMenu")
      ),
    )
  );
}

// === Level unlock helpers ===
function getPlayedLevel() {
  return Number(
    localStorage.getItem("jpVocab.currentLevel") ||
    sessionStorage.getItem("selectedLevel") ||
    localStorage.getItem("jpVocab.level") ||
    1
  );
}

// ===== スタイル =====
function ensureStyle(){
  if (document.querySelector('style[data-quiz-style="1"]')) return;
  const st = document.createElement("style");
  st.setAttribute("data-quiz-style","1");
  st.textContent = `

/* ==== Quiz 全画面レイアウト：余白ゼロでフルブリード ==== */
.screen-quiz{
  /* 画面にピッタリ貼り付けて、ページ全体のスクロールを止める */
  position: fixed;
  inset: 0;             /* 上下左右ぜんぶ 0 */
  height: 100svh;       /* 高さ固定 */
  width: 100vw;
  overflow: hidden;     /* 画面の外にはみ出してもページはスクロールさせない */

  /* 上下左右の安全域だけ残す（ノッチ対応）。余計な余白は作らない */
  padding: env(safe-area-inset-top)
           max(8px, env(safe-area-inset-left))
           env(safe-area-inset-bottom)
           max(8px, env(safe-area-inset-right));

  margin: 0;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1.2vh, 12px) !important;
  max-width: none !important;      /* 既存の max-width を無効化 */
}

/* ヘッダー部分（そのまま高さ可変でOK） */
.screen-quiz .topbar{ padding: 0 2px; }
.screen-quiz .hearts{ padding: 0 2px; }

/* ここが“残り全部”の高さになる。5段×2列で均等割り */
.screen-quiz .board{
  flex: 1 1 auto;                  /* 余った縦を全部ここに配分 */
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  grid-template-rows: repeat(5, 1fr) !important;  /* ← 5段均等 */
  gap: clamp(8px, 1.2vh, 12px) clamp(10px, 1.5vw, 16px) !important;
  width: 100%;
  max-width: 100vw !important;     /* 横はみ出し防止 */
}

/* 各セル（ボタン）はグリッドの枠に100%で貼り付け。サイズ不動。 */
.screen-quiz .qbtn{
  box-sizing: border-box !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  border: 2px solid #66a3ff;
  border-radius: clamp(10px, 1.4vh, 16px);
  background:#fff;
  display:flex; align-items:center; justify-content:center;
  padding: 10px 12px;
  overflow: hidden !important;     /* 中身が増えても外へ膨らまさない */
}

/* ボタン内テキストは2行で打ち止め（枠は伸びない） */
.screen-quiz .qinner{
  display:-webkit-box !important;
  -webkit-box-orient: vertical !important;
  -webkit-line-clamp: 2 !important;  /* 必要なら 3 にしてもOK */
  overflow:hidden !important;
  text-overflow: ellipsis !important;
  line-height:1.2;
  text-align:center;
  width:100%;
  white-space:normal;
  word-break: break-word;
  font-size: clamp(14px, 2.2vw, 22px);
}

/* 日本語側（ふりがな＋漢字）も中央で縦詰め、枠は不動 */
.screen-quiz .jp{
  height:100%;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
}
.screen-quiz .jp .furi{ font-size: clamp(12px, 1.6vw, 14px); line-height:1; color:#16a34a; }
.screen-quiz .jp .orth{ font-size: clamp(18px, 3vw, 22px); line-height:1.2; }

/* 空マスは不可視に（右に空枠だけ残る問題の対策） */
.screen-quiz .qbtn.hole{ visibility: hidden !important; }

/* 下の Back は高さだけ固定、横は全幅 */
.screen-quiz .backbtn{
  grid-column: 1 / -1;
  height: clamp(44px, 6vh, 56px);
  border:2px solid #66a3ff; border-radius:14px; background:#fff; font-size:18px;
}
  
  /* 選択中の強調 */
  .screen-quiz .qbtn.active{
    background: #eaf2ff;
    border-color: #3b82f6;
    box-shadow: inset 0 0 0 3px rgba(59,130,246,.25);
  }

  /* キーボード操作のフォーカス可視化も一応 */
  .screen-quiz .qbtn:focus-visible{
    outline: none;
    box-shadow: 0 0 0 3px rgba(59,130,246,.35);
  }
  /* 穴は完全に透明（グリッドだけ保持） */
  .screen-quiz .qbtn.hole{
  visibility: hidden;
  border-color: transparent;
  background: transparent;
  pointer-events: none;
  }
/* ===== Overlay (clear / game over) ===== */
.screen-quiz .overlay{
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,.35);
  display:flex; align-items:center; justify-content:center;
}
.screen-quiz .overlay .panel{
  width:min(680px, 92vw); max-width:680px;
  background:#fff; border-radius:16px;
  box-shadow:0 8px 28px rgba(0,0,0,.18);
  padding:24px; text-align:left;
}
.screen-quiz .overlay h2{ margin:0 0 10px; font-size:24px; }
.screen-quiz .overlay p{ margin:0 0 16px; color:#334155; }
.screen-quiz .overlay .primary{
  display:block; width:100%; height:48px;
  border:2px solid #66a3ff; border-radius:12px;
  background:#eef6ff; font-size:18px;
}

.screen-quiz .overlayCard{
  width:min(520px,92vw);
  background:#fff; border-radius:16px; padding:20px;
  box-shadow: 0 10px 25px rgba(0,0,0,.15);
}
.screen-quiz .overlayTitle{ font-size:22px; font-weight:700; margin:0 0 8px; }
.screen-quiz .overlayMsg{ color:#475569; margin:0 0 16px; }
.screen-quiz .overlayBtns{
  display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end;
}
.screen-quiz .overlayBtns .btn{
  padding:10px 14px; border-radius:12px; border:2px solid #66a3ff;
  background:#eef6ff; font-weight:600;
}
/* overlay */
.screen-quiz .quiz-overlay{
  position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,.35); z-index:50;
}
.screen-quiz .quiz-overlay .panel{
  width:min(640px,94vw); background:#fff; border-radius:16px; padding:20px;
  box-shadow:0 10px 30px rgba(0,0,0,.25);
}
.screen-quiz .quiz-overlay .ttl{ font-size:22px; font-weight:700; margin:0 0 8px; }
.screen-quiz .quiz-overlay .desc{ color:#475569; margin:0 0 16px; }
.screen-quiz .quiz-overlay .btn{
  width:100%; height:48px; border:2px solid #66a3ff; border-radius:12px; background:#eef6ff;
}

/* オーバーレイ表示中は盤面を触れない */
.screen-quiz.overlay-on .board{ pointer-events:none; filter:blur(1px); }

/* 英単語（左側）を少し大きく・太く */
.screen-quiz .qinner {
  font-size: clamp(18px, 2.6vw, 28px);  /* ← 元の14–22pxより大きめ */
  font-weight: 600;                     /* ← 太字 */
}

/* 日本語（右側の漢字部分）を少し大きく・太く */
.screen-quiz .jp .orth {
  font-size: clamp(22px, 3.4vw, 28px);  /* ← 3vw→3.4vwに上げる */
  font-weight: 600;                     /* ← 太字 */
}

/* ふりがな（小さいままでOK。調整するならここ） */
.screen-quiz .jp .furi {
  font-size: clamp(13px, 1.8vw, 16px);
  font-weight: 500;
}

/* ==== iPhoneの □Furigana / □TTS の重なり対策 ==== */
.screen-quiz .switches{
  display:flex;
  align-items:center;
  flex-wrap:nowrap;              /* 折り返さない */
}

.screen-quiz .switches label{
  display:inline-flex;
  align-items:center;
  white-space:nowrap;            /* 文言を折り返さない */
  margin-left:12px;              /* ← gap の代わり */
}

.screen-quiz .switches label:first-child{
  margin-left:0;
}

/* チェックボックスの余白を明示（iOSでの重なりを防ぐ） */
.screen-quiz .switches input[type="checkbox"]{
  margin:0 6px 0 0;              /* チェックとテキストの間 */
  flex:0 0 auto;                 /* 幅が潰れないように固定 */
}
/* ==== Quiz ヘッダーのレイアウト安定化（iPhone含む） ==== */
.screen-quiz .topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;  /* 左右に分離 */
  flex-wrap:nowrap;               /* 折り返さない */
  gap:0;                          /* gap は使わない（古Safari対策） */
}

/* 左側ブロック（Level + スイッチ） */
.screen-quiz .topbar .left{
  display:flex;
  align-items:center;
  min-width:0;     /* ここ重要：右側に押し負けない */
  flex:1 1 auto;   /* 余白は左側が受け持つ */
}

/* スイッチ行（Furigana / TTS） */
.screen-quiz .switches{
  display:flex;
  align-items:center;
  flex-wrap:nowrap;       /* 折り返し禁止 */
  margin-left:12px;       /* 「Level」との間隔 */
}
.screen-quiz .switches label{
  display:inline-flex;
  align-items:center;
  white-space:nowrap;     /* 文字を折り返さない */
  margin-right:12px;      /* gap代わりの間隔 */
}
.screen-quiz .switches label:last-child{ margin-right:0; }
.screen-quiz .switches input[type="checkbox"]{
  margin:0 6px 0 0;       /* チェックと文字の間 */
  flex:0 0 auto;
}

/* 右側のメタ（'50 questions · 1:50'）は縮ませない＋折り返さない */
.screen-quiz .topbar .meta{
  flex:0 0 auto;
  white-space:nowrap;
  margin-left:12px;       /* 左と軽く離す */
}
/* --- iPhoneでの ☑ と文字の重なり対策 --- */
.screen-quiz .topbar{ display:flex; align-items:center; justify-content:space-between; }
.screen-quiz .topbar .left{ display:flex; align-items:center; min-width:0; flex:1 1 auto; }
.screen-quiz .switches{ display:flex; align-items:center; flex-wrap:nowrap; margin-left:12px; }
.screen-quiz .switches label{
  display:inline-flex; align-items:center; white-space:nowrap; margin-right:12px;
}
/* ←ここが効きます */
.screen-quiz .switches input[type="checkbox"]{
  position: static !important;          /* 絶対配置などを強制リセット */
  appearance: auto;                     /* デフォルト見た目に戻す */
  -webkit-appearance: checkbox;         /* iOS/Safari 明示 */
  margin: 0 6px 0 0;                    /* チェックと文字の間 */
  vertical-align: middle;
  transform: none !important;           /* 変形を無効化（念のため） */
}
.screen-quiz .topbar .meta{ flex:0 0 auto; white-space:nowrap; margin-left:12px; }

/* --- Checkboxes row: Safari/Windows での重なり対策（強制リセット） --- */
.screen-quiz .topbar{
  display:flex; align-items:center; justify-content:space-between;
}
.screen-quiz .topbar .left{
  display:flex; align-items:center; min-width:0; flex:1 1 auto;
}
.screen-quiz .switches{
  display:flex; align-items:center; gap:16px; margin-left:12px;
}
.screen-quiz .switches label{
  display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
  position:static !important;
}
.screen-quiz .switches input[type="checkbox"]{
  /* ここが肝：どんなグローバル指定でも“普通の配置”に戻す */
  position: static !important;
  inset: auto !important;
  transform: none !important;
  z-index: auto !important;

  appearance: auto;
  -webkit-appearance: checkbox; /* iOS */
  display:inline-block;
  width: 1em; height: 1em;
  margin: 0;          /* 文字との隙間は label の gap で作る */
  vertical-align: middle;
}
.screen-quiz .switches span{
  line-height:1;      /* テキストのベースラインを安定させる */
}
.screen-quiz .topbar .meta{
  flex:0 0 auto; white-space:nowrap; margin-left:12px;
}

/* ==== header rows ==== */
.screen-quiz .topbar{
  display:flex; align-items:center; justify-content:space-between;
  gap: 12px;
}
.screen-quiz .topbar .left{ display:flex; align-items:center; gap: 14px; }
.screen-quiz .switches{ display:flex; align-items:center; gap:16px; }
.screen-quiz .switches label{ display:inline-flex; align-items:center; gap:8px; }
.screen-quiz .switches input[type="checkbox"]{
  position: static !important; inset:auto !important; transform:none !important;
  appearance:auto; -webkit-appearance:checkbox; width:1em; height:1em; margin:0;
}

/* 2段目：ハート＋メタ情報（iPhoneでも崩れない） */
.screen-quiz .status{
  display:flex; align-items:center; justify-content:space-between;
  padding: 0 2px;
}
.screen-quiz .status .hearts{ display:flex; gap:8px; }
.screen-quiz .status .meta{ white-space:nowrap; }

.screen-quiz .status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 8px;          /* ← 左右に少し余白を追加 */
  gap: 6px;               /* ← ハートと時間の間隔を確保 */
}

.screen-quiz .status .hearts {
  display: flex;
  gap: 4px;               /* ← ハートの間隔を詰める */
  flex-shrink: 0;         /* ← 右が潰れないように固定 */
}

.screen-quiz .status .meta {
  white-space: nowrap;
  font-size: 0.9rem;      /* ← 少しだけ小さく */
  flex-shrink: 0;         /* ← 時間が途中で切れないように */
}
 `;

  document.head.appendChild(st);
}

// ===== Quiz 用レイアウト調整 & バナー領域 =====
function ensureQuizLayoutStyle() {
  if (document.getElementById("quiz-layout-style")) return;

  const st = document.createElement("style");
  st.id = "quiz-layout-style";
  st.textContent = `
    /* 画面全体を上下フレックスに */
    .quiz-screen {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* 上側（ヘッダー + カード + Back）をまとめるコンテナ */
    .quiz-main {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
    }

    /* カード部分を伸び縮みさせるためのラッパー（既存の cards が中に入る想定） */
    .quiz-main-body {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    /* 下固定バナー（今はプレースホルダーとして常に表示） */
    .quiz-banner {
      flex: 0 0 auto;
      height: 56px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: #6b7280;
    }

    /* 実際に広告ONのときは高さそのままで中身を差し替える想定 */
    .quiz-banner span {
      opacity: 0.8;
    }
    .quiz-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    height: 60px;      /* バナー高さ。後で調整OK */
    background: #ececec;
    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 9999;
    border-top: 1px solid #ccc;
    }
    .quiz-main {
    padding-bottom: 70px; /* バナー高さ + 少し余裕 */
    }

  `;
  document.head.appendChild(st);
}


// ふりがな対応ラベル
function JpLabel({ jp, kana, showFuri }){
  const orth = jp?.orth ?? "";
  const reading = jp?.reading ?? kana ?? "";
  return R.createElement("span", { className:"jp" },
    (showFuri && reading) ? R.createElement("span", { className:"furi" }, reading) : null,
    R.createElement("span", { className:"orth" }, orth || "　")
  );
}

// ======================================================
//  本体
// ======================================================
 function QuizScreen(props){
  ensureStyle();

  // --- TTS 初期化（この画面中は日本語・標準速度） ---
ttsSetLang('ja-JP');
ttsSetRate(1.0);
ttsSetPitch(1.0);

// 画面が隠れたり回転したら必ず止める
const handleHide = () => stop();
window.addEventListener('visibilitychange', handleHide);
window.addEventListener('pagehide', handleHide);
window.addEventListener('freeze', handleHide);
window.addEventListener('resize', handleHide);

// この画面を離れる時に呼ぶ（Backや他画面遷移の直前で使う）
function cleanupTTS(){
  window.removeEventListener('visibilitychange', handleHide);
  window.removeEventListener('pagehide', handleHide);
  window.removeEventListener('freeze', handleHide);
  window.removeEventListener('resize', handleHide);
  stop();
}

// 右（日本語）を押した時だけ読む
function speakJPFromItem(it, preferReading = true){
  if (!tts) return;                                   // チェックボックス尊重
  const yomi =
    (preferReading ? (it?.jp?.reading || it?.kana) : '') ||
    it?.jp?.orth || '';
  if (!yomi) return;
  stop();
  speak(yomi, { lang: 'ja-JP' });
}

  // 状態
  const savedLevel = Number(localStorage.getItem("jpVocab.level") || "1");
  const [ui, setUI]       = R.useState("title");   // title / playing
  const [furi, setFuri]   = R.useState(localStorage.getItem("prefs.furi") !== "0");

  // ★ ここを「初回は ON」にする
  const [tts,  setTTS]    = R.useState(() => {
    try {
      const v = localStorage.getItem("prefs.tts");
      if (v === null) {
      // まだ一度も保存されていない → 初回なので ON でスタート
        return true;
      }
      return v === "1";
    } catch {
      // 何かあったらとりあえず ON
      return true;
    }
  });

const [hearts, setHearts] = R.useState(HEARTS);


  const [left,  setLeft ] = R.useState(Array(ROWS).fill(null));
  const [right, setRight] = R.useState(Array(ROWS).fill(null));

  const [pool, setPool]     = R.useState([]);   // 供給元
  const [remain, setRemain] = R.useState(0);    // 表示用残数
  const [secs, setSecs]     = R.useState(0);    // 残り秒

  // 2ペア後の補充トリガ
  const refillRef = R.useRef({ cleared:0, armed:false });

  const [end, setEnd] = R.useState(null); // null | { kind: "clear"|"gameover"|"timeout" }

  // クリア/ゲームオーバー/タイムアップの表示用
  const [overlay, setOverlay] = R.useState(null); // null | {kind:"clear"|"gameover"|"timeout"}

  const onNextLevel = () => {
  try {
    const cur = Number(localStorage.getItem("jpVocab.level") || "1");
    localStorage.setItem("jpVocab.level", String(Math.min(100, cur + 1)));
  } catch {}
  // クリア後はメニュー2へ
  props.goto?.("menu2");
 };

 // タイマー開始・停止
const timerRef = R.useRef(null);
const endedRef = R.useRef(false); // 二重終了防止

function stopTimer() {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
}
function startTimer() {
  stopTimer();
  timerRef.current = setInterval(() => {
    setSecs((s) => {
      if (s <= 1) {
        stopTimer();
        if (!endedRef.current) setOverlay({ type: "timeout" });
        return 0;
      }
      return s - 1;
    });
  }, 1000);
}

// playing 開始でタイマー起動、停止で終了
R.useEffect(() => {
  if (ui === "playing") startTimer();
  return stopTimer;
}, [ui]);

// overlay が出たら必ず停止
R.useEffect(() => {
  if (overlay) stopTimer();
}, [overlay]);


// QuizScreen 内
function unlockNextLevel() {
  try {
    // 今回プレイしていた絶対レベル
    const cur =
      Number(localStorage.getItem("jpVocab.currentLevel")) ||
      Number(localStorage.getItem("jpVocab.level")) || 1;

    // ★ 最高クリアLvを更新（最大値で持つ）
    const prev = Number(localStorage.getItem("jpVocab.progress.highestCleared") || "0");
    const high = Math.max(prev, cur);
    localStorage.setItem("jpVocab.progress.highestCleared", String(cur));

    // 便宜上、次レベルも更新（UIの表示用）
    const next = Math.min(100, cur + 1);
    localStorage.setItem("jpVocab.currentLevel", String(next));
    localStorage.setItem("jpVocab.level",         String(next));
    localStorage.setItem("jpVocab.maxLevel",      String(Math.max(
      Number(localStorage.getItem("jpVocab.maxLevel") || "1"),
      next
    )));
  } catch {}
}


 const onBackToTitle = () => {
  // 失敗 or タイムアップ時の戻り先
  props.goto?.("testTitle");
 };

  // 開始一回
  R.useEffect(() => { startGame(); }, []);

  R.useEffect(() => {
   if (ui !== "playing") return;
   if (secs <= 0) setOverlay({ type: "timeout" });
  }, [ui, secs]);

  R.useEffect(() => { localStorage.setItem("prefs.furi", furi ? "1":"0"); }, [furi]);
  R.useEffect(() => { localStorage.setItem("prefs.tts",  tts  ? "1":"0"); }, [tts]);

  R.useEffect(() => {
   if (ui === "playing" && hearts <= 0) {
      setOverlay({ type: "fail" });   // ← これだけ
    }
  }, [ui, hearts]);


  R.useEffect(() => {
   if (ui !== "playing") return;
   if (hearts <= 0) {
     setOverlay({ type: "fail" });
   }
  }, [ui, hearts]);

  R.useEffect(() => {
  if (ui !== "playing") return;
  if (secs <= 0) setOverlay({ type: "timeout" });
  }, [ui, secs]);

  // ライフ0になった瞬間
  R.useEffect(() => {
    if (ui === "playing" && hearts <= 0) setOverlay({type: "fail" });
  }, [ui, hearts]);

  const Header = () => h("div", { className:"topbar" },
  h("div", { className:"left" },
    h("div", { className:"level", style:{fontWeight:600, fontSize:18} }, `Level ${savedLevel}`),
    h("div", { className:"switches" },
      h("label", null,
        h("input", { type:"checkbox", checked:furi, onChange:e=>setFuri(e.target.checked) }),
        h("span", null, "Furigana")
      ),
      h("label", null,
        h("input", { type:"checkbox", checked:tts, onChange:e=>setTTS(e.target.checked) }),
        h("span", null, t("practice.autoTTS"))
      ),
    ),
  )
);


  
  // ===== クリック（左→右の順しか受けない）=====
  const [selL, setSelL] = R.useState(null);
  const [selR, setSelR] = R.useState(null);

function pick(side, rowIndex){
  // 2ペア消化後：左を押した瞬間に補充し、そのタップを左選択として継続
  if (refillRef.current.armed && side === "L"){
    refillRowsOnLeftTrigger(rowIndex);
    return;
  }

  // 左からしか始められない
  if (side === "R" && selL === null) return;

  // 左を選んだらハイライトだけ付けて待機
  if (side === "L"){
    setSelL(rowIndex);
    return;
  }

  // --- ここから右を押したときだけ走る（side === "R") ---
  setSelR(rowIndex);

  const Lidx = selL;
  const Ridx = rowIndex;
  const L    = left[Lidx];
  const R    = right[Ridx];

  // どちらか欠けてたらリセット
  if (!L || !R){
    setSelL(null);
    setSelR(null);
    return;
  }

  if (L.id === R.id){
    // ✅ 一致：消す・残数-1・クリア判定
    const nl = left.slice();  nl[Lidx]  = null;
    const nr = right.slice(); nr[Ridx]  = null;
    setLeft(nl); setRight(nr);

    setRemain(n => Math.max(0, n - 1));

    // クリア判定（プール0 & 盤面空）
if (pool.length === 0 && boardEmpty(nl, nr)) {
  if (!endedRef.current) {
    endedRef.current = true;

    // ★ ここで「今のレベル」を highestCleared に保存する（next じゃない）
    try {
      const cur =
        Number(localStorage.getItem("jpVocab.currentLevel")) ||
        Number(localStorage.getItem("jpVocab.level")) || 1;

      const prev = Number(localStorage.getItem("jpVocab.progress.highestCleared") || "0");
      if (cur > prev) {
        localStorage.setItem("jpVocab.progress.highestCleared", String(cur));
      }
    } catch {}

    // （任意）今の仕様のまま「次レベルへ進める用のキー」は別で上げてOK
    // unlockNextLevel(); ← これがあっても highestCleared は “cur” のまま

    setOverlay({ type: "clear" });
  }
  return;
}


    // 2ペア貯まったら次の左タップで補充
    refillRef.current.cleared = (refillRef.current.cleared || 0) + 1;
    if (refillRef.current.cleared >= 2){
      refillRef.current.armed = true;
    }
  } else {
    // ❌ 不一致：ライフを1だけ減らす（連打での多重減算防止）
    if (!refillRef.current.justMissed) {
      refillRef.current.justMissed = true;
      setHearts(h => {
        const next = Math.max(0, h - 1);
        if (next === 0) setOverlay({ type: "fail" });
        return next;
      });
      setTimeout(() => { refillRef.current.justMissed = false; }, 250);
    }
    // ハイライト解除
    setSelL(null);
    setSelR(null);
    // 必要なら次の補充待ちも解除
    // refillRef.current.armed = false;
  }
}

  // ===== ゲーム開始 =====
  async function startGame(){
    const lv =
     Number(localStorage.getItem("jpVocab.currentLevel")) ||
     Number(sessionStorage.getItem("selectedLevel")) ||
     Number(localStorage.getItem("jpVocab.level")) ||
     savedLevel || 1;

    const start = Math.max(1, lv - 4);
    const lang  = getLang?.() || "en";

    let all = [];
    for (let L=start; L<=lv; L++){
      const items = await loadLevel(L);
      for (const it of items){
        all.push({
          id: it.id,
          en: it.defs?.[lang] ?? it.defs?.en ?? "",
          jp: it.jp,
          kana: it.jp?.reading || ""
        });
      }
    }
    // all に Lv(start..lv) の全語を push し終わった直後に入れる
    shuffle(all);                 // ← 全体シャッフル
    if (all.length > MAX_Q) all = all.slice(0, MAX_Q);

    const L0 = all.slice(0, ROWS);
    const R0 = all.slice(0, ROWS).map(x => ({ ...x }));
    shuffle(R0);                  // 右だけ初期シャッフル
    setLeft(L0);
    setRight(R0);
    setPool(all.slice(ROWS));

    setRemain(all.length);
    setSecs(all.length * SECS_PER_Q);
    setHearts(HEARTS);
    refillRef.current = { cleared:0, armed:false };
    setUI("playing");
  }
  
  // 左に“空いている行”へだけ補充する版
  function refillRowsOnLeftTrigger(rowIndex){
  // 1) いまの左をコピー
  const Ls = left.slice();

  // 2) 空いている行のインデックスを上から集める
  const holes = [];
  for (let i = 0; i < ROWS; i++){
    if (!Ls[i]) holes.push(i);
  }
  if (holes.length === 0){           // 空きがなければ何もしない
    refillRef.current.armed   = false;
    refillRef.current.cleared = 0;
    return;
  }

  // 3) 空きの数だけプールから取り出す（足りなければあるだけ）
  const take = Math.min(holes.length, pool.length);
  const add  = pool.slice(0, take);
  const rest = pool.slice(take);

  // 4) 取り出した分を “穴の位置にそのまま” 入れる（上から順）
  for (let k = 0; k < take; k++){
    Ls[holes[k]] = add[k];
  }

  // 5) 右は左の内容をコピーして“右だけシャッフル”
  const Rs = Ls.map(x => (x ? { ...x } : null));
  shuffle(Rs);

  // 6) 反映＋状態リセット（色は一旦クリア）
  setLeft(Ls);
  setRight(Rs);
  setPool(rest);

  refillRef.current.armed   = false;
  refillRef.current.cleared = 0;

  setSelL(typeof rowIndex === "number" ? rowIndex : null); // 左続行なら選び直し
  setSelR(null);
  }


  // ====== PLAYING ======
  if (ui === "playing"){
    const cells = [];
    for (let i = 0; i < ROWS; i++) {
  const L = left[i];
  const RItem = right[i];

  // 共通のスタイル（枠/背景は穴の時に無効化する）
  const baseBtnStyle = {
    justifySelf: "stretch",
    alignSelf: "stretch",
    width: "100%",
    height: "100%",
  };

  // 左列
  const L_isHole = !L;
  cells.push(
    h("button", {
      key: `L${i}`,
      className: `qbtn qbtnL ${L_isHole ? "hole" : ""} ${selL === i ? "active" : ""}`,
      style: L_isHole
        ? { ...baseBtnStyle, border: "0", background: "transparent", boxShadow: "none", pointerEvents: "none" }
        : baseBtnStyle,
      disabled: L_isHole,
      onClick: () => L && pick("L", i),
    }, L ? h("span", {
      className: "qinner",
      dangerouslySetInnerHTML: { __html: breakSlashes(L.en) }
    }) : null)
  );

  // 右列
  const R_isHole = !RItem;
  cells.push(
    h("button", {
      key: `R${i}`,
      className: `qbtn qbtnR ${R_isHole ? "hole" : ""} ${selR === i ? "active" : ""}`,
      style: R_isHole
        ? { ...baseBtnStyle, border: "0", background: "transparent", boxShadow: "none", pointerEvents: "none" }
        : baseBtnStyle,
      disabled: R_isHole,

    onClick: () => {
     if (tts && RItem) speakJPFromItem(RItem, true); // ← ふりがな優先
     pick("R", i);
    }

    }, RItem ? h("span", { className: "qinner" },
      h(JpLabel, { jp: RItem.jp, kana: RItem.kana, showFuri: furi })
    ) : null)
  );
 }
      // ★★★ ここから下の return 部分を差し替え ★★★
    return h(
      "div",
      {
        // 既存クラスに quiz-screen を足す
        className: `quiz screen-quiz quiz-screen ${overlay ? "overlay-on" : ""}`,
      },
      // 上側：クイズ本体
      h(
        "div",
        { className: "quiz-main" },
        Header(),

        // 2段目：左=ハート 右=残り問題数・時間
        h(
          "div",
          { className: "status" },
          h("div", { className: "hearts" }, renderHearts(hearts)),
          h(
            "div",
            { className: "meta" },
            `${remain} questions · ${fmtTime(secs)}`
          )
        ),

        // ボード＋Back ボタン
        h(
          "div",
          { className: "quiz-main-body" },
          h("div", { className: "board" }, ...cells),
          h(
            "button",
            {
              className: "backbtn",
              onClick: () => {
                cleanupTTS();
                props.goto?.("testTitle");
              },
            },
            t("common.back")
          )
        ),

        // オーバーレイ（クリア / 失敗 / タイムアップ）
        h(QuizOverlay, {
          type: overlay?.type,
          goto: props.goto,
          onClear: unlockNextLevel,
        })
      ),

      // 下固定バナー（今はプレースホルダー表示）
      h(
        "div",
        { id: "quizBanner", className: "quiz-banner" },
        h("span", null, "［バナー広告スペース（仮）］")
      )
    );
    // ★★★ 差し替えここまで ★★★

  
  }
  return null;
}

 // ===== 外から呼ばれる render =====
 export async function render(el, deps = {}){
  ensureQuizLayoutStyle();
  const comp = R.createElement(QuizScreen, { goto: deps.goto });
  if (RD.createRoot){
    const root = RD.createRoot(el);
    root.render(comp);
  }else{
    RD.render(comp, el);
  }
}
