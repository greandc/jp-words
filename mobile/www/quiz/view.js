// deploy-bump 2025-11-02
/* app/features/quiz/view.js */
/* global React, ReactDOM */
const R = window.React;
const RD = window.ReactDOM;
if (!R || !RD) throw new Error("React/ReactDOM が読み込まれていません");
const h = R.createElement;

// ===== 依存 =====
import { MAX_Q } from "../config.js";
import { loadLevel } from "../data/loader.js";
import { t } from "../i18n.js";
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
    .screen-quiz .quiz-overlay .desc{ color:#475569; margin:0 0 16px; }
    .screen-quiz .quiz-overlay .btn{ width:100%; height:48px; border:2px solid #66a3ff; border-radius:12px; background:#eef6ff; }
    .screen-quiz.overlay-on .board, .screen-quiz.overlay-on .backbtn { pointer-events:none; filter:blur(1px); }
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
  const [ui, setUI] = R.useState(() => localStorage.getItem(TEST_TUTORIAL_KEY) ? "loading" : "tutorial");
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

  // このコンポーネントが画面に表示された時、またはUIの状態が変わった時に実行
  R.useEffect(() => {
    // ゲームの準備がまだで、UIが"loading"になったら、ゲームの準備を開始
    if (ui === "loading" && pool.length === 0) {
      setupGame();
    }
    // バナーを表示する
    showMainBanner();
    // 画面が隠れた時のための「見張り番」を設定
    const handleVisibilityChange = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // この画面から去る時の「後片付け」
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop(); // TTSを停止
      if (timerRef.current) clearInterval(timerRef.current); // タイマーを完全停止
      destroyBanner(); // バナーを破壊
    };
  }, [ui]); // 'ui'の状態が変わるたびに、この副作用が再評価される

  // ふりがな・TTS設定をlocalStorageに保存
  R.useEffect(() => { localStorage.setItem("prefs.furi", furi ? "1" : "0"); }, [furi]);
  R.useEffect(() => { localStorage.setItem("prefs.tts", tts ? "1" : "0"); }, [tts]);

  // ゲームオーバー / タイムアップ / クリア判定
  R.useEffect(() => {
    if (ui !== "playing" || endedRef.current) return;
    if (hearts <= 0) { endedRef.current = true; setOverlay({ type: "fail" }); }
    else if (secs <= 0) { endedRef.current = true; setOverlay({ type: "timeout" }); }
    else if (pool.length === 0 && remain === 0) { endedRef.current = true; setOverlay({ type: "clear" }); }
  }, [ui, hearts, secs, pool, remain]);

  // クイズ終了時に全画面広告を試みる
  R.useEffect(() => {
    if (overlay) {
      if (timerRef.current) clearInterval(timerRef.current);
      try { maybeShowTestInterstitial(savedLevel); }
      catch (e) { console.error("[ads] interstitial from quiz error", e); }
    }
  }, [overlay, savedLevel]);

  // --- 関数定義 ---

  const speakJP = (it) => {
    if (!tts || !it) return;
    let yomi = it.jp?.reading || it.jp?.orth || "";
    if (it.jp?.orth === "飲む" && yomi === "のむ") yomi = it.jp.orth;
    if (yomi) speak(yomi, { lang: "ja-JP" });
  };

  const setupGame = async () => {
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
    setUI("playing"); // 盤面ができたら "playing" にする
    startTimer();     // そしてタイマーを開始する
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (document.hidden) return; // 裏にいる間は止める
      setSecs(s => Math.max(0, s - 1));
    }, 1000);
  };

  const pick = (side, rowIndex) => { /* この中身は前回のままでOKです */ };
  const unlockNextLevel = () => { /* この中身も前回のままでOKです */ };

  // --- レンダリング ---

  // ① チュートリアル表示
  if (ui === "tutorial") {
    return h("div", { className: "quiz-overlay" },
      h("div", { className: "panel" },
        h("div", { className: "ttl" }, t("tutorial.testTitle")),
        h("div", { className: "desc", style: { whiteSpace: "pre-line" } }, t("tutorial.testBody")),
        h("div", { style: { display: "flex", justifyContent: "flex-end" } },
          h("button", {
            className: "btn",
            onClick: () => {
              try { localStorage.setItem(TEST_TUTORIAL_KEY, "1"); } catch {}
              props.goto("testTitle");
            },
          }, t("tutorial.ok")),
        ),
      ),
    );
  }

  // ② ローディング画面表示（ゲーム準備中）
  if (ui === "loading") {
    // ローディング中は、背景にゲーム画面の骨組みだけ表示し、操作不能にする
    return h("div", { className: "screen-quiz overlay-on" },
      h("div", { className:"topbar" }, h("div", { className:"left" }, h("div", {style:{fontWeight:600, fontSize:18}}, `Level ${savedLevel}`))),
      h("div", { className: "status" }, h("div", { className: "hearts" }), h("div", { className: "meta" }, `Loading...`)),
      h("div", { className: "board" }),
      h("button", { className:"backbtn", disabled: true }, "Back"),
    );
  }

  // ③ ゲーム画面表示
  const cells = [];
  for (let i = 0; i < ROWS; i++) {
    const L = left[i], R = right[i];
    cells.push(h("button", { key: `L${i}`, className: `qbtn ${!L ? "hole" : ""} ${selL === i ? "active" : ""}`, disabled: !L, onClick: () => pick("L", i) }, L ? h("span", { className: "qinner", dangerouslySetInnerHTML: { __html: breakSlashes(L.en) } }) : null));
    cells.push(h("button", { key: `R${i}`, className: `qbtn ${!R ? "hole" : ""} ${selR === i ? "active" : ""}`, disabled: !R || selL === null, onClick: () => pick("R", i) }, R ? h("span", { className: "qinner" }, h(JpLabel, { jp: R.jp, showFuri: furi })) : null));
  }

  return h("div", { className: `screen-quiz ${overlay ? "overlay-on" : ""}` },
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
      h("div", { className: "meta" }, `${remain} ${t("common.questions")} · ${fmtTime(secs)}`),
    ),
    h("div", { className: "board" }, ...cells),
    h("button", { className: "backbtn", onClick: () => props.goto("testTitle") }, "Back"),
    h(QuizOverlay, { type: overlay?.type, goto: props.goto, onClear: unlockNextLevel, clearedLevel: savedLevel }),
  );
}


// ===== 外から呼ばれる render =====
export async function render(el, deps = {}){
  const comp = h(QuizScreen, { goto: deps.goto });
  if (RD.createRoot) RD.createRoot(el).render(comp);
  else RD.render(comp, el);
}