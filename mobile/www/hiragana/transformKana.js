// mobile/www/hiragana/transformKana.js

// 濁点
const DAKU = {
  "か":"が","き":"ぎ","く":"ぐ","け":"げ","こ":"ご",
  "さ":"ざ","し":"じ","す":"ず","せ":"ぜ","そ":"ぞ",
  "た":"だ","ち":"ぢ","つ":"づ","て":"で","と":"ど",
  "は":"ば","ひ":"び","ふ":"ぶ","へ":"べ","ほ":"ぼ"
};

// 半濁点
const HANDAKU = {
  "は":"ぱ","ひ":"ぴ","ふ":"ぷ","へ":"ぺ","ほ":"ぽ"
};

// 小文字
const SMALL = {
  "や":"ゃ","ゆ":"ゅ","よ":"ょ",
  "つ":"っ",
  "い":"ぃ","う":"ぅ","え":"ぇ",
};


export function transformKana(base, flags) {
  let k = base;

  // --- 小文字変換 ---
  if (flags.small && SMALL[k]) {
    k = SMALL[k];
  }

  // --- 濁点 ---
  if (flags.daku && DAKU[k]) {
    k = DAKU[k];
  }

  // --- 半濁点 ---
  if (flags.handaku && HANDAKU[k]) {
    k = HANDAKU[k];
  }

  return k;
}
