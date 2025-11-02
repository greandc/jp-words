// app/data/loader.js
// JSON（data/levels/lvNN.json）を読む共通ローダー
// ====== pos（品詞）自動補完 ======
function ensurePos(it){
  if (it.pos) return it; // すでにあるなら何もしない
  const en = (it.defs?.en || "").toLowerCase().trim();
  const orth = (it.jp?.orth || "");
  if (en.startsWith("to ")) it.pos = "verb";
  else if (/い$/.test(orth)) it.pos = "adj"; // 「〜い」で終わる単語を形容詞扱い
  else it.pos = "noun";
  return it;
}
// ====== タグ正規化（配列を必ず配列に）======
function ensureTags(it) {
  // class / applies は配列で統一
  if (!Array.isArray(it.class))  it.class  = it.class  ? [it.class]  : [];
  if (!Array.isArray(it.applies)) it.applies = it.applies ? [it.applies] : [];

  // frames は配列、かつ中の obj/dest も配列に
  if (!Array.isArray(it.frames)) it.frames = [];
  it.frames = it.frames.map(fr => {
    const f = { ...fr };
    if (f.obj && !Array.isArray(f.obj))   f.obj   = [f.obj];
    if (f.dest && !Array.isArray(f.dest)) f.dest  = [f.dest];
    return f;
  });

  return it;
}

export async function loadLevel(n) {
  const pad = String(n).padStart(2, "0");

   // ✅ ここを修正：このファイル(loader.js)自身を基準にする
  const base = new URL("./", import.meta.url);

  // ✅ URL は base を使って絶対URLに解決する
  const cand = [
    new URL(`levels/lv${pad}.json`, base).href,
    new URL(`levels/lv${n}.json`,   base).href,
    // 予備（開発環境の相対パスでも一応試す）
    `data/levels/lv${pad}.json`,
    `data/levels/lv${n}.json`,
    `./data/levels/lv${pad}.json`,
  `./data/levels/lv${n}.json`,
  ];

  for (const url of cand) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const raw = await res.json();
      // pos / tags を補完してから返す
      const data = raw.map(x => ensureTags(ensurePos(x)));
      console.log("[QUIZ] load", n, "from", url, "→", data.length);
      return data;
    }
  } catch (_) {
    // 失敗したら次の候補を試す
  }
}



  // ---- フォールバック（最低限）----
  if (n === 1) {
    const data = [
      { id:"lv01-01", defs:{ en:"dog" },     jp:{ orth:"犬",   reading:"いぬ" } },
      { id:"lv01-02", defs:{ en:"cat" },     jp:{ orth:"猫",   reading:"ねこ" } },
      { id:"lv01-03", defs:{ en:"book" },    jp:{ orth:"本",   reading:"ほん" } },
      { id:"lv01-04", defs:{ en:"water" },   jp:{ orth:"水",   reading:"みず" } },
      { id:"lv01-05", defs:{ en:"school" },  jp:{ orth:"学校", reading:"がっこう" } },
      { id:"lv01-06", defs:{ en:"teacher" }, jp:{ orth:"先生", reading:"せんせい" } },
      { id:"lv01-07", defs:{ en:"to go" },   jp:{ orth:"行く", reading:"いく" } },
      { id:"lv01-08", defs:{ en:"to eat" },  jp:{ orth:"食べる", reading:"たべる" } },
      { id:"lv01-09", defs:{ en:"big" },     jp:{ orth:"大きい", reading:"おおきい" } },
      { id:"lv01-10", defs:{ en:"small" },   jp:{ orth:"小さい", reading:"ちいさい" } },
    ];
    return data.map(x => ensureTags(ensurePos(x)));

  }
  if (n === 2) {
    const data = [
      { id:"lv02-01", defs:{ en:"car" },     jp:{ orth:"車",   reading:"くるま" } },
      { id:"lv02-02", defs:{ en:"train" },   jp:{ orth:"電車", reading:"でんしゃ" } },
      { id:"lv02-03", defs:{ en:"station" }, jp:{ orth:"駅",   reading:"えき" } },
      { id:"lv02-04", defs:{ en:"house" },   jp:{ orth:"家",   reading:"いえ" } },
      { id:"lv02-05", defs:{ en:"friend" },  jp:{ orth:"友達", reading:"ともだち" } },
      { id:"lv02-06", defs:{ en:"morning" }, jp:{ orth:"朝",   reading:"あさ" } },
      { id:"lv02-07", defs:{ en:"night" },   jp:{ orth:"夜",   reading:"よる" } },
      { id:"lv02-08", defs:{ en:"food" },    jp:{ orth:"食べ物", reading:"たべもの" } },
      { id:"lv02-09", defs:{ en:"drink" },   jp:{ orth:"飲み物", reading:"のみもの" } },
      { id:"lv02-10", defs:{ en:"time" },    jp:{ orth:"時間", reading:"じかん" } },
    ];
    return data.map(x => ensureTags(ensurePos(x)));

  }

  return [];
}
