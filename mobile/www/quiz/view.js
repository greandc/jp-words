// deploy-bump 2025-11-02
/* app/features/quiz/view.js */
/* global React, ReactDOM */
const R  = window.React;
const RD = window.ReactDOM;
if (!R || !RD) throw new Error("React/ReactDOM が読み込まれていません");
const h  = R.createElement;


// ===== 依存 =====
import { MAX_Q }   from "../config.js";
import { loadLevel } from "../data/loader.js";
import { t, getLang } from "../i18n.js";
import {
  speak, stop, ttsAvailable,
  setLang as ttsSetLang,
  setRate as ttsSetRate,
  setPitch as ttsSetPitch
} from "../tts.v2.js?v=v2-20251109d";
import { showMainBanner, destroyBanner } from "../ads.js";
import { maybeShowTestInterstitial } from "../../ads.js";


// ===== 定数 =====
const ROWS   = 5;
const HEARTS = 5;

// testTitle画面と、このキーを完全に一致させます
const SEC_PER_Q_KEY     = "jpVocab.test.secPerQ"; // 1問あたりの秒数を保存するキー
const DEFAULT_SEC_PER_Q = 10;                     // 未設定だった場合の初期値は10秒

// localStorageから秒数を読み取る、唯一の正しい関数
function readSecPerQuestion() {
  try {
    // testTitleで保存された秒数を文字列として読み取る
    const savedSecStr = localStorage.getItem(SEC_PER_Q_KEY);
    if (savedSecStr) {
      const sec = Number(savedSecStr);
      // 5秒か10秒のどちらかなので、それ以外の値は無視する
      if (sec === 5 || sec === 10) {
        return sec;
      }
    }
  } catch {}
  // 何か問題があったり、未設定の場合は、安全な10秒を返す
  return DEFAULT_SEC_PER_Q;
}


// ===== ヘルパ =====
function fmtTime(sec){
  const m = Math.max(0, Math.floor(sec/60));
  const s = Math.max(0, sec%60);
  return `${m}:${String(s).padStart(2,"0")}`;
}

function breakSlashes(text){
  return String(text ?? "").replace(/\s*\/\s*/g, " /&#8203;");
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function boardEmpty(L, R){
  return Array.isArray(L) && Array.isArray(R)
      && L.every(v => v == null)
      && R.every(v => v == null);
}

// ===== スタイル定義 =====
function ensureStyle(){
  if (document.querySelector('style[data-quiz-style="1"]')) return;
  const st = document.createElement("style");
  st.setAttribute("data-quiz-style","1");
  st.textContent = `
    .screen-quiz{
      position: fixed; inset: 0; height: 100svh; width: 100vw;
      overflow: hidden;
      padding: calc(12px + env(safe-area-inset-top))
               max(8px, env(safe-area-inset-left))
               calc(64px + env(safe-area-inset-bottom))
               max(8px, env(safe-area-inset-right));
      margin: 0; box-sizing: border-box;
      display: flex; flex-direction: column;
      gap: clamp(6px, 1.2vh, 12px) !important;
      max-width: none !important;
    }
    .screen-quiz .topbar{ padding: 0 2px; }
    .screen-quiz .status { display: flex; justify-content: space-between; align-items: center; margin: 0 8px; gap: 6px; }
    .screen-quiz .status .hearts { display: flex; gap: 4px; flex-shrink: 0; }
    .screen-quiz .status .meta { white-space: nowrap; font-size: 0.9rem; flex-shrink: 0; }
    .screen-quiz .board{
      flex: 1 1 auto;
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      grid-template-rows: repeat(5, 1fr) !important;
      gap: clamp(8px, 1.2vh, 12px) clamp(10px, 1.5vw, 16px) !important;
      width: 100%; max-width: 100vw !important;
    }
    .screen-quiz .qbtn{
      box-sizing: border-box !important; width: 100% !important; height: 100% !important;
      min-width: 0 !important; min-height: 0 !important;
      border: 2px solid #66a3ff; border-radius: clamp(10px, 1.4vh, 16px);
      background:#fff; display:flex; align-items:center; justify-content:center;
      padding: 10px 12px; overflow: hidden !important;
    }
    .screen-quiz .qinner{
      display:-webkit-box !important; -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 2 !important; overflow:hidden !important;
      text-overflow: ellipsis !important; line-height:1.2; text-align:center;
      width:100%; white-space:normal; word-break: break-word;
      font-size: clamp(18px, 2.6vw, 28px); font-weight: 600;
    }
    .screen-quiz .jp{ height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .screen-quiz .jp .furi{ font-size: clamp(13px, 1.8vw, 16px); font-weight: 500; line-height:1; color:#16a34a; }
    .screen-quiz .jp .orth{ font-size: clamp(22px, 3.4vw, 28px); font-weight: 600; line-height:1.2; }
    .screen-quiz .qbtn.hole{ visibility: hidden !important; border:0; background:transparent; pointer-events:none; }
    .screen-quiz .backbtn{ grid-column: 1 / -1; height: clamp(44px, 6vh, 56px); border:2px solid #66a3ff; border-radius:14px; background:#fff; font-size:18px; }
    .screen-quiz .qbtn.active{ background: #eaf2ff; border-color: #3b82f6; box-shadow: inset 0 0 0 3px rgba(59,130,246,.25); }
    .screen-quiz .qbtn:focus-visible{ outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.35); }
    .screen-quiz .quiz-overlay{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.35); z-index:50; }
    .screen-quiz .quiz-overlay .panel{ width:min(640px,94vw); background:#fff; border-radius:16px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
    .screen-quiz .quiz-overlay .ttl{ font-size:22px; font-weight:700; margin:0 0 8px; }
    .screen-quiz .quiz-overlay .desc{ color:#475569; margin:0 0 16px; }
    .screen-quiz .quiz-overlay .btn{ width:100%; height:48px; border:2px solid #66a3ff; border-radius:12px; background:#eef6ff; }
    .screen-quiz.overlay-on .board, .screen-quiz.overlay-on .backbtn { pointer-events:none; filter:blur(1px); }
    .screen-quiz .topbar{ display:flex; align-items:center; justify-content:space-between; gap: 12px; }
    .screen-quiz .topbar .left{ display:flex; align-items:center; gap: 14px; }
    .screen-quiz .switches{ display:flex; align-items:center; gap:16px; }
    .screen-quiz .switches label{ display:inline-flex; align-items:center; gap:8px; }
    .screen-quiz .switches input[type="checkbox"]{ position: static !important; inset:auto !important; transform:none !important; appearance:auto; -webkit-appearance:checkbox; width:1em; height:1em; margin:0; }
  `;
  document.head.appendChild(st);
}

// ふりがな対応ラベル
function JpLabel({ jp, kana, showFuri }){
  const orth = jp?.orth ?? "";
  const reading = jp?.reading ?? kana ?? "";
  return h("span", { className:"jp" },
    (showFuri && reading) ? h("span", { className:"furi" }, reading) : null,
    h("span", { className:"orth" }, orth || "　")
  );
}

// リザルト画面
function QuizOverlay({ type, goto, onClear }) {
  if (!type) return null;
  const title = type === "clear" ? t("result.clearTitle") : type === "fail" ? t("result.failTitle") : t("result.timeoutTitle");
  const desc = type === "clear" ? t("result.clearDesc") : type === "fail" ? t("result.failDesc") : t("result.timeoutDesc");
  const onPrimary = () => {
    if (type === "clear") { try { onClear?.(); } catch {} goto?.("menu2"); return; }
    if (type === "fail") { goto?.("menu3"); return; }
    goto?.("testTitle");
  };
  return h("div", { className: "quiz-overlay" },
    h("div", { className: "panel" },
      h("div", { className: "ttl"  }, title),
      h("div", { className: "desc" }, desc),
      h("button", { className: "btn", onClick: onPrimary }, type === "clear" ? t("result.nextLevel") : t("result.returnMenu")),
    )
  );
}

// ======================================================
//  本体コンポーネント
// ======================================================
 function QuizScreen(props){
  ensureStyle();

  // --- 状態管理 (useState
  const savedLevel = Number(localStorage.getItem("jpVocab.level") || "1");
  const [ui, setUI]       = R.useState("title");
  const [furi, setFuri]   = R.useState(localStorage.getItem("prefs.furi") !== "0"
  );
  const [tts,  setTTS]    = R.useState(() => localStorage.getItem("prefs.tts") !== "0");
  const [hearts, setHearts] = R.useState(HEARTS);
  const [left,  setLeft ] = R.useState(Array(ROWS
  ).fill(null));
  const [right, setRight] = R.useState(Array(ROWS).fill(null));
  const [pool, setPool]     = R.useState([]);
  const [remain, setRemain] = R.useState(0);  const [secs, setSecs]     =
   R.useState(0);
  const [selL, setSelL] = R.useState(null);
  const [selR, setSelR] = R.useState(null);
  const [overlay, setOverlay] = R.useState(null);

  // --- 副作用 (useEffect) & Refs ---
    const refillRef = R.useRef({ cleared:0, armed:false, justMissed: false });
  const timerRef = R.useRef(null);
  const endedRef = R.useRef(false);

  // ライフサイクル：マウント時にゲーム開始、アンマウント時に色々停止
  R.useEffect(() => {
    startGame();
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop(); // TTS音声も止める
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ライフサイクル：バナーの表示・非表示
  R.useEffect(() => {
    showMainBanner();
    return () => destroyBanner();
  }, []);

  // 状態の変更をlocalStorageに保存
  R.useEffect(() => { localStorage.setItem("prefs.furi", furi ? "1":"0"); }, [furi]);
  R.useEffect(() => { localStorage.setItem("prefs.tts",  tts  ? "1":"0"); }, [tts]);

  // ゲームオーバー判定
  R.useEffect(() => {
    if (ui === "playing" && hearts <= 0 && !endedRef.current) {
      endedRef.current = true;
      setOverlay({ type: "fail" });
    }
  }, [ui, hearts]);

  // タイムアップ判定
  R.useEffect(() => {
    if (ui === "playing" && secs <= 0 && !endedRef.current) {
      endedRef.current = true;
      setOverlay({ type: "timeout" });
    }
  }, [ui, secs]);

  // クイズ終了時にインタースティシャル広告を試みる
  R.useEffect(() => {
    if (overlay) {
      if (timerRef.current) clearInterval(timerRef.current);
      try { maybeShowTestInterstitial(savedLevel); }
      catch (e) { console.error("[ads] interstitial from quiz error", e); }
    }
  }, [overlay, savedLevel]);


  // --- 関数 ---
  const speakJP = (it) => {
    if (!tts || !it) return;
    let yomi = it.jp?.reading || it.jp?.orth || "";
    if (it.jp?.orth === "飲む" && yomi === "のむ") yomi = it.jp.orth;
    if (yomi) speak(yomi, { lang: "ja-JP" });
  };

  const startGame = async () => {
    const lv = Number(localStorage.getItem("jpVocab.level") || "1");
    const start = Math.max(1, lv - 4);
    const lang  = getLang?.() || "en";
    let all = [];
    for (let L=start; L<=lv; L++){
      for (const it of await loadLevel(L)){
        all.push({ id: it.id, en: it.defs?.[lang] ?? it.defs?.en ?? "", jp: it.jp });
      }
    }
    shuffle(all);
    if (all.length > MAX_Q) all = all.slice(0, MAX_Q);

    const L0 = all.slice(0, ROWS);
    const R0 = all.slice(0, ROWS).map(x => ({ ...x }));
    shuffle(R0);

    setLeft(L0); setRight(R0); setPool(all.slice(ROWS));
    setRemain(all.length); setHearts(HEARTS);
    setSecs(all.length * readSecPerQuestion());

    endedRef.current = false;
    refillRef.current = { cleared:0, armed:false, justMissed: false };
    
    // ★★★ここが、新しいタイマーのロジックです！★★★
    timerRef.current = setInterval(() => {
      // アプリが非表示の間は、何もせずに処理をスキップする
      if (document.hidden) return;
      // 表示されている時だけ、秒を減らす
      setSecs(s => s - 1);
    }, 1000);
    
    setUI("playing");
  };

  const refillRows = (triggeredRowIndex) => {
    const Ls = left.slice();
    const holes = [];
    for (let i = 0; i < ROWS; i++) if (!Ls[i]) holes.push(i);
    if (holes.length === 0) return;
    const take = Math.min(holes.length, pool.length);
    const add  = pool.slice(0, take);
    const rest = pool.slice(take);
    for (let k = 0; k < take; k++) Ls[holes[k]] = add[k];
    const Rs = Ls.map(x => (x ? { ...x } : null));
    shuffle(Rs);
    setLeft(Ls); setRight(Rs); setPool(rest);
    refillRef.current = { cleared:0, armed:false, justMissed: false };
    setSelL(triggeredRowIndex); setSelR(null);
  };

  const pick = (side, rowIndex) => {
    if (refillRef.current.armed && side === "L") return refillRows(rowIndex);
    if (side === "R" && selL === null) return;
    if (side === "L") return setSelL(rowIndex);

    setSelR(rowIndex);
    const L = left[selL], R = right[rowIndex];
    if (!L || !R) return setSelL(null);

    if (L.id === R.id) {
      speakJP(R);
      const nl = left.slice(), nr = right.slice();
      nl[selL] = null, nr[rowIndex] = null;
      setLeft(nl); setRight(nr); setSelL(null); setSelR(null);
      const newRemain = remain - 1;
      setRemain(newRemain);
      if (pool.length === 0 && newRemain === 0 && !endedRef.current) {
        endedRef.current = true;
        setOverlay({ type: "clear" });
        return;
      }
      refillRef.current.cleared++;
      if (refillRef.current.cleared >= 2) refillRef.current.armed = true;
    } else {
      if (refillRef.current.justMissed) return;
      refillRef.current.justMissed = true;
      setHearts(h => h - 1);
      setTimeout(() => {
        setSelL(null); setSelR(null);
        refillRef.current.justMissed = false;
      }, 300);
    }
  };

  const unlockNextLevel = () => {
    try {
      const cur = Number(localStorage.getItem("jpVocab.level") || "1");
      const prev = Number(localStorage.getItem("jpVocab.progress.highestCleared") || "0");
      if (cur > prev) localStorage.setItem("jpVocab.progress.highestCleared", String(cur));
      const next = Math.min(100, cur + 1);
      localStorage.setItem("jpVocab.currentLevel", String(next));
      localStorage.setItem("jpVocab.level", String(next));
    } catch {}
  };


  // --- レンダリング ---
  if (ui !== "playing") return null;

  const cells = [];
  for (let i = 0; i < ROWS; i++) {
    const L = left[i], R = right[i];
    cells.push(h("button", { key:`L${i}`, className:`qbtn ${!L?"hole":""} ${selL===i?"active":""}`, disabled:!L, onClick:()=>pick("L",i)}, L ? h("span",{className:"qinner", dangerouslySetInnerHTML:{__html:breakSlashes(L.en)}}) : null));
    cells.push(h("button", { key:`R${i}`, className:`qbtn ${!R?"hole":""} ${selR===i?"active":""}`, disabled:!R || selL===null, onClick:()=>pick("R",i)}, R ? h("span",{className:"qinner"}, h(JpLabel,{jp:R.jp, showFuri:furi})) : null));
  }

  return h("div", { className: `screen-quiz ${overlay ? "overlay-on" : ""}`},
    h("div", { className:"topbar" },
      h("div", { className:"left" },
        h("div", {style:{fontWeight:600, fontSize:18}}, `Level ${savedLevel}`),
        h("div", { className:"switches" },
          h("label", null, h("input",{type:"checkbox",checked:furi,onChange:e=>setFuri(e.target.checked)}), h("span", null, "Furigana")),
          h("label", null, h("input",{type:"checkbox",checked:tts, onChange:e=>setTTS(e.target.checked)}), h("span", null, t("practice.autoTTS"))), 
        ),
      ),
    ),
    h("div", { className: "status" },
      h("div", { className: "hearts" }, Array.from({length:hearts},(_,i)=>h("span",{key:i},"💗"))),
      h("div", { className: "meta" }, `${remain} ${t("common.questions")} · ${fmtTime(secs)}`), 
    ),
    h("div", { className: "board" }, ...cells),
    h("button", { className:"backbtn", onClick:()=>props.goto("testTitle")}, "Back"),
    h(QuizOverlay, { type: overlay?.type, goto: props.goto, onClear: unlockNextLevel }),
  );
}


 // ===== 外から呼ばれる render =====
 export async function render(el, deps = {}){
  const comp = h(QuizScreen, { goto: deps.goto });
  if (RD.createRoot) RD.createRoot(el).render(comp);
  else RD.render(comp, el);
}