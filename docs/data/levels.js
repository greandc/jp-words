// app/data/levels.js
// レベルデータのローダ（JSON）＋フォールバック

const CACHE = new Map(); // level -> items[]

function two(n){ return String(n).padStart(2, "0"); }
function urlFor(level){
  return `./data/levels/lv${two(level)}.json`;
}

// フォールバック（Lv1だけ・最低限）
const FALLBACK_LV1 = [
  { id: "lv01-01", defs: { en: "dog"   }, jp: { orth: "犬",   reading: "いぬ"   } },
  { id: "lv01-02", defs: { en: "cat"   }, jp: { orth: "猫",   reading: "ねこ"   } },
  { id: "lv01-03", defs: { en: "book"  }, jp: { orth: "本",   reading: "ほん"   } },
  { id: "lv01-04", defs: { en: "water" }, jp: { orth: "水",   reading: "みず"   } },
  { id: "lv01-05", defs: { en: "school"}, jp: { orth: "学校", reading: "がっこう"} },
  { id: "lv01-06", defs: { en: "teacher"},jp: { orth: "先生", reading: "せんせい"} },
  { id: "lv01-07", defs: { en: "to go" }, jp: { orth: "行く", reading: "いく"   } },
  { id: "lv01-08", defs: { en: "to eat"}, jp: { orth: "食べる",reading: "たべる" } },
  { id: "lv01-09", defs: { en: "big"   }, jp: { orth: "大きい",reading: "おおきい"} },
  { id: "lv01-10", defs: { en: "small" }, jp: { orth: "小さい",reading: "ちいさい"} },
];

export async function loadLevel(level){
  if (CACHE.has(level)) return CACHE.get(level);

  try {
    const res = await fetch(urlFor(level), { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    // ざっくりバリデーション（最低限）
    if (!Array.isArray(items)) throw new Error("bad json");
    CACHE.set(level, items);
    return items;
  } catch (_) {
    // 失敗時：Lv1はフォールバックを返す / それ以外は空配列
    const items = (level === 1) ? FALLBACK_LV1 : [];
    CACHE.set(level, items);
    return items;
  }
}
