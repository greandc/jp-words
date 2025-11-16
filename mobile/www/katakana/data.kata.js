// jp-words/mobile/src/katakana/data.kata.js

export const ROWS = [
  { name: "ア行", items: [
    { k:"ア", ex:{ kanji:"アイス",      yomi:"あいす" } },
    { k:"イ", ex:{ kanji:"インク",      yomi:"いんく" } },
    { k:"ウ", ex:{ kanji:"ウサギ",      yomi:"うさぎ" } },
    { k:"エ", ex:{ kanji:"エンジン",    yomi:"えんじん" } },
    { k:"オ", ex:{ kanji:"オレンジ",    yomi:"おれんじ" } },
  ]},

  { name: "カ行", items: [
    { k:"カ", ex:{ kanji:"カメラ",      yomi:"かめら" } },
    { k:"キ", ex:{ kanji:"キウイ",      yomi:"きうい" } },
    { k:"ク", ex:{ kanji:"クッキー",    yomi:"くっきー" } }, // 小さい「ッ」入り
    { k:"ケ", ex:{ kanji:"ケーキ",      yomi:"けーき" } },
    { k:"コ", ex:{ kanji:"コーヒー",    yomi:"こーひー" } },
  ]},

  { name: "サ行", items: [
    { k:"サ", ex:{ kanji:"サラダ",      yomi:"さらだ" } },
    { k:"シ", ex:{ kanji:"シャツ",      yomi:"しゃつ" } }, // 小さい「ャ」
    { k:"ス", ex:{ kanji:"スープ",      yomi:"すーぷ" } },
    { k:"セ", ex:{ kanji:"センター",    yomi:"せんたー" } },
    { k:"ソ", ex:{ kanji:"ソファー",    yomi:"そふぁー" } },
  ]},

  { name: "タ行", items: [
    { k:"タ", ex:{ kanji:"タクシー",    yomi:"たくしー" } },
    { k:"チ", ex:{ kanji:"チャンス",    yomi:"ちゃんす" } }, // 小「ョ」
    { k:"ツ", ex:{ kanji:"ツナ",        yomi:"つな" } },
    { k:"テ", ex:{ kanji:"テレビ",      yomi:"てれび" } },
    { k:"ト", ex:{ kanji:"トマト",      yomi:"とまと" } },
  ]},

  { name: "ナ行", items: [
    { k:"ナ", ex:{ kanji:"ナイフ",      yomi:"ないふ" } },
    { k:"ニ", ex:{ kanji:"ニュース",    yomi:"にゅーす" } }, // 小「ュ」
    { k:"ヌ", ex:{ kanji:"ヌードル",    yomi:"ぬーどる" } },
    { k:"ネ", ex:{ kanji:"ネクタイ",    yomi:"ねくたい" } },
    { k:"ノ", ex:{ kanji:"ノート",      yomi:"のーと" } },
  ]},

  { name: "ハ行", items: [
    { k:"ハ", ex:{ kanji:"ハム",  yomi:"はむ" } },
    { k:"ヒ", ex:{ kanji:"ヒーター",    yomi:"ひーたー" } },
    { k:"フ", ex:{ kanji:"フライト",  yomi:"ふらいと" } },
    { k:"ヘ", ex:{ kanji:"ヘアー",yomi:"へあー" } },
    { k:"ホ", ex:{ kanji:"ホテル",      yomi:"ほてる" } },
  ]},

  { name: "マ行", items: [
    { k:"マ", ex:{ kanji:"マスク",      yomi:"ますく" } },
    { k:"ミ", ex:{ kanji:"ミルク",      yomi:"みるく" } },
    { k:"ム", ex:{ kanji:"ムービー",    yomi:"むーびー" } },
    { k:"メ", ex:{ kanji:"メロン",      yomi:"めろん" } },
    { k:"モ", ex:{ kanji:"モーター",    yomi:"もーたー" } },
  ]},

  { name: "ヤ行", items: [
    { k:"ヤ", ex:{ kanji:"ヤギ",        yomi:"やぎ" } },
    { k:"ユ", ex:{ kanji:"ユニット",yomi:"ゆにっと" } },
    { k:"ヨ", ex:{ kanji:"ヨット",  yomi:"よっと" } },
    { k:"・", ex:null },
    { k:"・", ex:null },
  ]},

  { name: "ラ行", items: [
    { k:"ラ", ex:{ kanji:"ラジオ",      yomi:"らじお" } },
    { k:"リ", ex:{ kanji:"リボン",      yomi:"りぼん" } },
    { k:"ル", ex:{ kanji:"ルール",      yomi:"るーる" } },
    { k:"レ", ex:{ kanji:"レモン",      yomi:"れもん" } },
    { k:"ロ", ex:{ kanji:"ロケット",    yomi:"ろけっと" } },
  ]},

  { name: "ワ行", items: [
    { k:"ワ", ex:{ kanji:"ワイン",      yomi:"わいん" } },
    { k:"ヲ", ex:{ kanji:"ヲタク",      yomi:"おたく" } }, // ネタ枠w いらなければ消してOK
    { k:"ン", ex:{ kanji:"パン",        yomi:"ぱん" } },
    { k:"・", ex:null },
    { k:"・", ex:null },
  ]},
];
// カタカナ用：濁音・半濁音＋小さい ャュョッ
const EXTRA_KATA_EXAMPLES = [
  // ガ行
  { k: "ガ", ex: { kanji: "ガラス",   yomi: "がらす" } },
  { k: "ギ", ex: { kanji: "ギター",   yomi: "ぎたー" } },
  { k: "グ", ex: { kanji: "グローブ", yomi: "ぐろーぶ" } },
  { k: "ゲ", ex: { kanji: "ゲーム",   yomi: "げーむ" } },
  { k: "ゴ", ex: { kanji: "ゴール",   yomi: "ごーる" } },

  // ザ行
  { k: "ザ", ex: { kanji: "ザリガニ", yomi: "ざりがに" } },
  { k: "ジ", ex: { kanji: "ジーパン", yomi: "じーぱん" } },
  { k: "ズ", ex: { kanji: "ズボン",   yomi: "ずぼん" } },
  { k: "ゼ", ex: { kanji: "ゼリー",   yomi: "ぜりー" } },
  { k: "ゾ", ex: { kanji: "ゾウ",     yomi: "ぞう" } },

  // ダ行
  { k: "ダ", ex: { kanji: "ダンス",   yomi: "だんす" } },
  { k: "ヂ", ex: { kanji: "ジヂミ",   yomi: "ぢぢみ" } }, // ちょい変則だけど音は「ぢ」
  { k: "ヅ", ex: { kanji: "ヅラ",     yomi: "づら" } },
  { k: "デ", ex: { kanji: "データ",   yomi: "でーた" } },
  { k: "ド", ex: { kanji: "ドーナツ", yomi: "どーなつ" } },

  // バ行
  { k: "バ", ex: { kanji: "バス",     yomi: "ばす" } },
  { k: "ビ", ex: { kanji: "ビール",   yomi: "びーる" } },
  { k: "ブ", ex: { kanji: "ブルー",   yomi: "ぶるー" } },
  { k: "ベ", ex: { kanji: "ベッド",   yomi: "べっど" } },
  { k: "ボ", ex: { kanji: "ボール",   yomi: "ぼーる" } },

  // パ行
  { k: "パ", ex: { kanji: "パンダ",   yomi: "ぱんだ" } },
  { k: "ピ", ex: { kanji: "ピザ",     yomi: "ぴざ" } },
  { k: "プ", ex: { kanji: "プリン",   yomi: "ぷりん" } },
  { k: "ペ", ex: { kanji: "ペンギン", yomi: "ぺんぎん" } },
  { k: "ポ", ex: { kanji: "ポケット", yomi: "ぽけっと" } },

  // 小さい ャュョッ
  { k: "ャ", ex: { kanji: "キャベツ", yomi: "きゃべつ" } },
  { k: "ュ", ex: { kanji: "シュート", yomi: "しゅーと" } },
  { k: "ョ", ex: { kanji: "ジョギング", yomi: "じょぎんぐ" } },
  { k: "ッ", ex: { kanji: "チケット", yomi: "ちけっと" } },
];

