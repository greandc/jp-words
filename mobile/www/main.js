// mobile/www/main.js
import * as Quiz     from "./quiz/view.js?v=20251102";
import * as Title    from "./title/view.js";
import * as Menu     from "./menu1/view.js";
import * as Results  from "./results/view.js";
import * as Menu2    from "./menu2/view.js";
import * as Menu3    from "./menu3/view.js";
import * as Lang     from "./lang/view.js";
import * as Practice from "./practice/view.js";
import { getLang } from "./i18n.js";
import { createState, setRange, setSet, setMode, computeAbsoluteLevel } from "./state.js";
import * as TestTitle from "./testTitle/view.js";
import * as Numbers  from "./numbers/view.js";
import * as ViewHira    from "./hiragana/view.js";
import * as ViewKata    from "./katakana/view.js";
import * as Hira     from "./hiragana/view.js";   
import * as Kata     from "./katakana/view.js";
import * as ViewRemoveAds from "../removeAds/view.js";

 // ====== グローバル状態（範囲・レベル） ======
let currentRange = [1, 20]; // ← デフォルト値（初回はLv1〜20）

 const elApp = document.getElementById("app");

 const routes = {
   title: Title,
   menu1: Menu,   
   hiragana: Hira,     
   katakana: Kata,
   menu2: Menu2,
   menu3: Menu3,
   lang: Lang,
   practice: Practice,
   quiz: Quiz,
   results: Results,
   testTitle: TestTitle,
   numbers: Numbers,
   hiragana: ViewHira,
   katakana: ViewKata,
   removeAds: ViewRemoveAds,
 };

 // 追加：グローバル状態の作成
 const state = createState();

async function goto(name) {
  console.log("[router] goto:", name);
  const mod = routes[name];
  if (!mod?.render) {
    elApp.innerHTML = `<p style="color:red;">Route not found: ${name}</p>`;
    return;
  }
  try {
    elApp.innerHTML = ""; // 画面クリア
    await mod.render(elApp, {
  goto,

  // ====== menu1 / menu2 用の範囲管理 ======
  getRange: () => currentRange,
  setRange: (r) => { currentRange = r; },

  // ====== 既存のAPI（他の画面用） ======
  getState: () => state,
  setSet: (n) => setSet(state, n),
  setMode: (m) => setMode(state, m),
  level: () => computeAbsoluteLevel(state),
});
  } catch (e) {
    elApp.innerHTML = `<p style="color:red;">Route "${name}" crashed: ${e?.message || e}</p>`;
  }
}

async function boot() {
  elApp.innerHTML = "<p>Loading…</p>";
  await goto("title");
}

boot();
