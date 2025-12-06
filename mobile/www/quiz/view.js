// deploy-bump 2025-11-02
/* app/features/quiz/view.js (最終完成版) */
/* global React, ReactDOM */
const R = window.React;
const RD = window.ReactDOM;
if (!R || !RD) throw new Error("React/ReactDOM が読み込まれていません");
const h = R.createElement;

// ===== 依存 =====
import { MAX_Q } from "../config.js";
import { loadLevel } from "../data/loader.js";
import { t, getLang } from "../i18n.js";
import { speak, stop } from "../tts.v2.js?v=v2-20251109d";
import { showMainBanner, destroyBanner } from "../ads.js";
import { maybeShowTestInterstitial } from "../../ads.js";

// ===== 定数 =====
const ROWS = 5;
const HEARTS = 5;
const TEST_TUTORIAL_KEY = "jpVocab.tutorial.testHintShown";
const SEC_PER_Q_KEY = "jpVocab.test.secPerQ";
const DEFAULT_SEC_PER_Q = 10;

// ===== ヘルパー関数 =====
function readSecPerQuestion() {
  try {
    const savedSecStr = localStorage.getItem(SEC_PER_Q_KEY);
    if (savedSecStr) {
      const sec = Number(savedSecStr);
      if (sec === 5 || sec === 10) return sec;
    }
  } catch {}
  return DEFAULT_SEC_PER_Q;
}

function fmtTime(sec) {
  const m = Math.max(0, Math.floor(sec / 60));
  const s = Math.max(0, sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function breakSlashes(text) {
  return String(text ?? "").replace(/\s*\/\s*/g, " /&#8203;");
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== スタイル定義 =====
function ensureStyle() {
  if (document.querySelector('style[data-quiz-style="1"]')) return;
  const st = document.createElement("style");
  st.setAttribute("data-quiz-style", "1");
  st.textContent = `
    .screen-quiz{ position: fixed; inset: 0; height: 100svh; width: 100vw; overflow: hidden; padding: calc(12px + env(safe-area-inset-top)) max(8px, env(safe-area-inset-left)) calc(64px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-right)); margin: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: clamp(6px, 1.2vh, 12px) !important; max-width: none !important; }
    .screen-quiz .topbar{ padding: 0 2px; display:flex; align-items:center; justify-content:space-between; gap: 12px; }
    .screen-quiz .topbar .left{ display:flex; align-items:center; gap: 14px; }
    .screen-quiz .switches{ display:flex; align-items:center; gap:16px; }
    .screen-quiz .switches label{ display:inline-flex; align-items:center; gap:8px; }
    .screen-quiz .switches input[type="checkbox"]{ position: static !important; inset:auto !important; transform:none !important; appearance:auto; -webkit-appearance:checkbox; width:1em; height:1em; margin:0; }
    .screen-quiz .status { display: flex; justify-content: space-between; align-items: center; margin: 0 8px; gap: 6px; }
    .screen-quiz .status .hearts { display: flex; gap: 4px; flex-shrink: 0; }
    .screen-quiz .status .meta { white-space: nowrap; font-size: 0.9rem; flex-shrink: 0; }
    .screen-quiz .board{ flex: 1 1 auto; display: grid !important; grid-template-columns: 1fr 1fr !important; grid-template-rows: repeat(5, 1fr) !important; gap: clamp(8px, 1.2vh, 12px) clamp(10px, 1.5vw, 16px) !important; width: 100%; max-width: 100vw !important; }
    .screen-quiz .qbtn{ box-sizing: border-box !important; width: 100% !important; height: 100% !important; min-width: 0 !important; min-height: 0 !important; border: 2px solid #66a3ff; border-radius: clamp(10px, 1.4vh, 16px); background:#fff; display:flex; align-items:center; justify-content:center; padding: 10px 12px; overflow: hidden !important; }
    .screen-quiz .qinner{ display:-webkit-box !important; -webkit-box-orient: vertical !important; -webkit-line-clamp: 2 !important; overflow:hidden !important; text-overflow: ellipsis !important; line-height:1.2; text-align:center; width:100%; white-space:normal; word-break: break-word; font-size: clamp(18px, 2.6vw, 28px); font-weight: 600; }
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
    .screen-quiz .quiz-overlay .desc{ color:#475569; margin:0 0 16px; white-space: pre-line; }
    .screen-quiz .quiz-overlay .btn{ width:100%; height:48px; border:2px solid #66a3ff; border-radius:12px; background:#eef6ff; }
    .screen-quiz.overlay-on .board, .screen-quiz.overlay-on .backbtn, .screen-quiz.overlay-on .topbar, .screen-quiz.overlay-on .status { pointer-events:none; filter:blur(2px); }
  `;
  document.head.appendChild(st);
}

// ===== 小さな部品（コンポーネント）=====
function JpLabel({ jp, showFuri }) {
  const reading = jp?.reading || "";
  return h("span", { className: "jp" },
    (showFuri && reading) ? h("span", { className: "furi" }, reading) : null,
    h("span", { className: "orth" }, jp?.orth || "　")
  );
}

function QuizOverlay({ type, goto, onClear, clearedLevel }) {
  if (!type) return null;
  const title = type === "clear" ? t("result.clearTitle") : type === "fail" ? t("result.failTitle") : t("result.timeoutTitle");
  const desc = type === "clear" ? t("result.clearDesc") : type === "fail" ? t("result.failDesc") : t("result.timeoutDesc");
  const onPrimary = () => {
    if (type === "clear") {
      onClear?.();
      if (clearedLevel > 0 && clearedLevel % 20 === 0) {
        goto?.("menu1");
      } else {
        goto?.("menu2");
      }
      return;
    }
    if (type === "fail") { goto?.("menu3"); return; }
    goto?.("testTitle");
  };
  return h("div", { className: "quiz-overlay" },
    h("div", { className: "panel" },
      h("div", { className: "ttl" }, title),
      h("div", { className: "desc" }, desc),
      h("button", { className: "btn", onClick: onPrimary }, type === "clear" ? t("result.nextLevel") : t("result.returnMenu")),
    )
  );
}

// ======================================================
//  本体コンポーネント（最終完成版）
// ======================================================
function QuizScreen(props) {
  ensureStyle();

  // --- 状態管理 ---
  const savedLevel = Number(localStorage.getItem("jpVocab.level") || "1");
  const [isLoading, setIsLoading] = R.useState(true);
  const [showTutorial, setShowTutorial] = R.useState(false);
  const [furi, setFuri] = R.useState(localStorage.getItem("prefs.furi") !== "0");
  const [tts, setTTS] = R.useState(() => localStorage.getItem("prefs.tts") !== "0");
  const [hearts, setHearts] = R.useState(HEARTS);
  const [left, setLeft] = R.useState(Array(ROWS).fill(null));
  const [right, setRight] = R.useState(Array(ROWS).fill(null));
  const [pool, setPool] = R.useState([]);
  const [remain, setRemain] = R.useState(0);
  const [secs, setSecs] = R.useState(0);
  const [selL, setSelL] = R.useState(null);
  const [selR, setSelR] = R.useState(null);
  const [overlay, setOverlay] = R.useState(null);

  // --- Ref（内部的な状態管理） ---
  const timerRef = R.useRef(null);
  const endedRef = R.useRef(false);

  // --- 副作用（ライフサイクル管理） ---
  R.useEffect(() => {
    setupGame();
    showMainBanner();
    const handleVisibilityChange = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
      if (timerRef.current) clearInterval(timerRef.current);
      destroyBanner();
    };
  }, []);

  R.useEffect(() => { localStorage.setItem("prefs.furi", furi ? "1" : "0"); }, [furi]);
  R.useEffect(() => { localStorage.setItem("prefs.tts", tts ? "1" : "0"); }, [tts]);
  R.useEffect(() => {
    if (isLoading || endedRef.current) return;
    if (hearts <= 0) { endedRef.current = true; setOverlay({ type: "fail" }); }
    else if (secs <= 0) { endedRef.current = true; setOverlay({ type: "timeout" }); }
    else if (pool.length === 0 && remain === 0) { endedRef.current = true; setOverlay({ type: "clear" }); }
  }, [hearts, secs, pool, remain, isLoading]);
  R.useEffect(() => {
    if (overlay) {
      if (timerRef.current) clearInterval(timerRef.current);
      try { maybeShowTestInterstitial(savedLevel); }
      catch (e) { console.error("[ads] interstitial from quiz error", e); }
    }
  }, [overlay, savedLevel]);

  // --- 関数定義 ---
  const speakJP = (it) => { /* 変更なし */ };
  const setupGame = async () => {
    setIsLoading(true);
    const lv = Number(localStorage.getItem("jpVocab.level") || "1");
    const startLv = Math.max(1, lv - 4);
    let all = [];
    for (let L = startLv; L <= lv; L++) {
      for (const it of await loadLevel(L)) {
        all.push({ id: it.id, en: it.defs?.[getLang() || "en"] ?? it.defs?.en ?? "", jp: it.jp });
      }
    }
    shuffle(all);
    if (all.length > MAX_Q) all = all.slice(0, MAX_Q);
    const L0 = all.slice(0, ROWS), R0 = all.slice(0, ROWS).map(x => ({ ...x }));
    shuffle(R0);
    setLeft(L0); setRight(R0); setPool(all.slice(ROWS));
    setRemain(all.length); setHearts(HEARTS);
    setSecs(all.length * readSecPerQuestion());
    endedRef.current = false;
    setIsLoading(false);
    const firstTime = !localStorage.getItem(TEST_TUTORIAL_KEY);
    if (firstTime) {
      setShowTutorial(true);
    } else {
      startTimer();
    }
  };
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (document.hidden || showTutorial) return;
      setSecs(s => Math.max(0, s - 1));
    }, 1000);
  };
  const pick = (side, rowIndex) => { /* 変更なし */ };
  const unlockNextLevel = () => { /* 変更なし */ };

  // --- レンダリング ---
  const gameUI = h("div", { className: `screen-quiz ${overlay || showTutorial ? "overlay-on" : ""}` },
    h("div", { className: "topbar" },
      h("div", { className: "left" },
        h("div", { style: { fontWeight: 600, fontSize: 18 } }, `Level ${savedLevel}`),
        h("div", { className: "switches" },
          h("label", null, h("input", { type: "checkbox", checked: furi, onChange: e => setFuri(e.target.checked) }), h("span", null, "Furigana")),
          h("label", null, h("input", { type: "checkbox", checked: tts, onChange: e => setTTS(e.target.checked) }), h("span", null, t("practice.autoTTS"))),
        ),
      ),
    ),
    h("div", { className: "status" },
      h("div", { className: "hearts" }, Array.from({ length: hearts }, (_, i) => h("span", { key: i }, "💗"))),
      h("div", { className: "meta" }, isLoading ? "Loading..." : `${remain} ${t("common.questions")} · ${fmtTime(secs)}`),
    ),
    h("div", { className: "board" }, isLoading ? null : Array.from({ length: ROWS * 2 }).map((_, i) => {
        const side = i % 2 === 0 ? 'L' : 'R';
        const rowIndex = Math.floor(i / 2);
        const item = side === 'L' ? left[rowIndex] : right[rowIndex];
        return h("button", { key: `${side}${rowIndex}`, className: `qbtn ${!item ? "hole" : ""} ${side === 'L' && selL === rowIndex ? "active" : ""} ${side === 'R' && selR === rowIndex ? "active" : ""}`, disabled: !item || (side === 'R' && selL === null), onClick: () => pick(side, rowIndex) },
          item ? h("span", { className: "qinner" }, side === 'L' ? h("span", { dangerouslySetInnerHTML: { __html: breakSlashes(item.en) } }) : h(JpLabel, { jp: item.jp, showFuri: furi })) : null
        );
    })),
    h("button", { className: "backbtn", onClick: () => props.goto("testTitle") }, "Back"),
    h(QuizOverlay, { type: overlay?.type, goto: props.goto, onClear: unlockNextLevel, clearedLevel: savedLevel }),
  );

  return h(R.Fragment, null,
    gameUI,
    showTutorial && h("div", { className: "quiz-overlay" },
      h("div", { className: "panel" },
        h("div", { className: "ttl" }, t("tutorial.testTitle")),
        h("div", { className: "desc" }, t("tutorial.testBody")),
        h("div", { style: { display: "flex", justifyContent: "flex-end" } },
          h("button", {
            className: "btn",
            onClick: () => {
              try { localStorage.setItem(TEST_TUTORIAL_KEY, "1"); } catch {}
              props.goto("testTitle");
            },
          }, t("tutorial.ok")),
        )
      )
    )
  );
}

// ===== 外から呼ばれる render =====
export async function render(el, deps = {}) {
  const comp = h(QuizScreen, { goto: deps.goto });
  if (RD.createRoot) RD.createRoot(el).render(comp);
  else RD.render(comp, el);
}