// mobile/www/katakana/transformKana.js

// 行テーブル（清音）
const ROW_K = {
  ka: ["カ","キ","ク","ケ","コ"],
  sa: ["サ","シ","ス","セ","ソ"],
  ta: ["タ","チ","ツ","テ","ト"],
  ha: ["ハ","ヒ","フ","ヘ","ホ"],
};

// 濁音
const DAKU = {
  ka: ["ガ","ギ","グ","ゲ","ゴ"],
  sa: ["ザ","ジ","ズ","ゼ","ゾ"],
  ta: ["ダ","ヂ","ヅ","デ","ド"],
  ha: ["バ","ビ","ブ","ベ","ボ"],
};

// 半濁音
const HANDAKU = ["パ","ピ","プ","ペ","ポ"];

// 小文字（カタカナ版）…今回は や行＋っ だけに限定
const SMALL_MAP = {
  ヤ: "ャ",
  ユ: "ュ",
  ヨ: "ョ",
  ツ: "ッ",
};

const UNSMALL_MAP = Object.fromEntries(
  Object.entries(SMALL_MAP).map(([big, small]) => [small, big])
);

// ==== 画面表示用：清音 → （゛/゜/小）に変換 ==== //
export function transformKana(base, flags) {
  let k = base;
  const { daku = false, handaku = false, small = false } = flags || {};

  // カ・サ・タ・ハ行だけ特別扱い
  for (const rowKey of ["ka", "sa", "ta", "ha"]) {
    const idx = ROW_K[rowKey].indexOf(k);
    if (idx !== -1) {
      if (handaku && rowKey === "ha") {
        k = HANDAKU[idx];
      } else if (daku) {
        k = DAKU[rowKey][idx];
      }
      return small ? (SMALL_MAP[k] || k) : k;
    }
  }

  // それ以外（ナ行とかマ行）は小文字だけ対応
  if (small) {
    return SMALL_MAP[k] || k;
  }
  return k;
}

// ==== 例語検索用：表示文字 → 清音に戻す ==== //
export function normalizeKana(k) {
  // 小さい文字 → 大きい文字
  if (UNSMALL_MAP[k]) k = UNSMALL_MAP[k];

  // 濁音 → 清音
  for (const rowKey of ["ka", "sa", "ta", "ha"]) {
    const idxD = (DAKU[rowKey] || []).indexOf(k);
    if (idxD !== -1) return ROW_K[rowKey][idxD];
  }

  // 半濁音 → 清音
  const idxH = HANDAKU.indexOf(k);
  if (idxH !== -1) return ROW_K.ha[idxH];

  return k;
}
