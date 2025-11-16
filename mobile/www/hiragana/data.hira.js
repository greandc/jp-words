// mobile/www/hiragana/data.hira.js
// 各かなに 例語 ex:{kanji, yomi} を持たせる
export const ROWS = [
  { name:"あ行", items:[
    {k:"あ", ex:{kanji:"朝", yomi:"あさ"}},
    {k:"い", ex:{kanji:"犬", yomi:"いぬ"}},
    {k:"う", ex:{kanji:"海", yomi:"うみ"}},
    {k:"え", ex:{kanji:"駅", yomi:"えき"}},
    {k:"お", ex:{kanji:"音", yomi:"おと"}},
  ]},
  { name:"か行", items:[
    {k:"か", ex:{kanji:"紙", yomi:"かみ"}},
    {k:"き", ex:{kanji:"北",  yomi:"きた"}},
    {k:"く", ex:{kanji:"雲", yomi:"くも"}},
    {k:"け", ex:{kanji:"化粧",  yomi:"けしょう"}},
    {k:"こ", ex:{kanji:"子供",  yomi:"こども"}},
  ]},
  { name:"さ行", items:[
    {k:"さ", ex:{kanji:"先", yomi:"さき"}},
    {k:"し", ex:{kanji:"島", yomi:"しま"}},
    {k:"す", ex:{kanji:"砂", yomi:"すな"}},
    {k:"せ", ex:{kanji:"背中", yomi:"せなか」"}},
    {k:"そ", ex:{kanji:"空", yomi:"そら"}},
  ]},
  { name:"た行", items:[
    {k:"た", ex:{kanji:"竹", yomi:"たけ"}},
    {k:"ち", ex:{kanji:"地図", yomi:"ちず"}},
    {k:"つ", ex:{kanji:"月", yomi:"つき"}},
    {k:"て", ex:{kanji:"手紙", yomi:"てがみ"}},
    {k:"と", ex:{kanji:"鳥", yomi:"とり"}},
  ]},
  { name:"な行", items:[
    {k:"な", ex:{kanji:"夏", yomi:"なつ"}},
    {k:"に", ex:{kanji:"虹", yomi:"にじ"}},
    {k:"ぬ", ex:{kanji:"布", yomi:"ぬの"}},
    {k:"ね", ex:{kanji:"猫", yomi:"ねこ"}},
    {k:"の", ex:{kanji:"野山", yomi:"のやま"}},
  ]},
  { name:"は行", items:[
    {k:"は", ex:{kanji:"花", yomi:"はな"}},
    {k:"ひ", ex:{kanji:"人", yomi:"ひと"}},
    {k:"ふ", ex:{kanji:"冬", yomi:"ふゆ"}},
    {k:"へ", ex:{kanji:"部屋", yomi:"へや"}},
    {k:"ほ", ex:{kanji:"星", yomi:"ほし"}},
  ]},
  { name:"ま行", items:[
    {k:"ま", ex:{kanji:"松", yomi:"まつ"}},
    {k:"み", ex:{kanji:"耳", yomi:"みみ"}},
    {k:"む", ex:{kanji:"村", yomi:"むら"}},
    {k:"め", ex:{kanji:"目薬", yomi:"めぐすり"}},
    {k:"も", ex:{kanji:"森", yomi:"もり"}},
  ]},
  { name:"や行", items:[
    {k:"や", ex:{kanji:"山", yomi:"やま"}},
    {k:"・"}, // 空き
    {k:"ゆ", ex:{kanji:"雪", yomi:"ゆき"}},
    {k:"・"},
    {k:"よ", ex:{kanji:"夜", yomi:"よる"}},
  ]},
  { name:"ら行", items:[
    {k:"ら", ex:{kanji:"来週", yomi:"らいしゅう"}},
    {k:"り", ex:{kanji:"林檎", yomi:"りんご"}},
    {k:"る", ex:{kanji:"留守", yomi:"るす"}},
    {k:"れ", ex:{kanji:"列", yomi:"れつ"}},
    {k:"ろ", ex:{kanji:"路線", yomi:"ろせん"}},
  ]},
  { name:"わ行", items:[
    {k:"わ", ex:{kanji:"私", yomi:"わたし"}},
    {k:"を", ex:{kanji:"私を", yomi:"わたしを"}},
    {k:"ん", ex:{kanji:"新幹線", yomi:"しんかんせん"}}, // 仕様通り“わ行”に配置
    {k:"・"}, {k:"・"},
  ]},
  { name:"が行", items:[
    {k:"が", ex:{kanji:"外国", yomi:"がいこく"}},
    {k:"ぎ", ex:{kanji:"銀行",  yomi:"ぎんこう"}},
    {k:"ぐ", ex:{kanji:"軍隊", yomi:"ぐんたい"}},
    {k:"げ", ex:{kanji:"芸者",  yomi:"げいしゃ"}},
    {k:"ご", ex:{kanji:"誤解",  yomi:"ごかい"}},
  ]},
  { name:"ざ行", items:[
    {k:"ざ", ex:{kanji:"座席", yomi:"ざせき"}},
    {k:"じ", ex:{kanji:"自分",  yomi:"じぶん"}},
    {k:"ず", ex:{kanji:"頭痛", yomi:"ずつう"}},
    {k:"ぜ", ex:{kanji:"全員",  yomi:"ぜんいん"}},
    {k:"ぞ", ex:{kanji:"象",  yomi:"ぞう"}},
  ]},
  { name:"だ行", items:[
    {k:"だ", ex:{kanji:"大工", yomi:"だいく"}},
    {k:"ぢ", ex:{kanji:"地面",  yomi:"ぢめん（じめん）"}},
    {k:"づ", ex:{kanji:"続く", yomi:"つづく"}},
    {k:"で", ex:{kanji:"出口",  yomi:"でぐち"}},
    {k:"ど", ex:{kanji:"道路",  yomi:"どうろ"}},
  ]},
   { name:"ば行", items:[
    {k:"ば", ex:{kanji:"場所", yomi:"ばしょ"}},
    {k:"び", ex:{kanji:"瓶",  yomi:"びん"}},
    {k:"ぶ", ex:{kanji:"武道", yomi:"ぶどう"}},
    {k:"べ", ex:{kanji:"勉強",  yomi:"べんきょう"}},
    {k:"ぼ", ex:{kanji:"帽子",  yomi:"ぼうし"}},
  ]},
  { name:"ぱ行", items:[
    {k:"ぱ", ex:{kanji:"乾杯", yomi:"かんぱい"}},
    {k:"ぴ", ex:{kanji:"金品",  yomi:"きんぴん"}},
    {k:"ぷ", ex:{kanji:"切符", yomi:"きっぷ"}},
    {k:"ぺ", ex:{kanji:"完璧",  yomi:"かんぺき"}},
    {k:"ぽ", ex:{kanji:"散歩",  yomi:"さんぽ"}},
  ]},
   { k: "ゃ", ex: { kanji: "客",     yomi: "きゃく" } },      // きゃ
  { k: "ゅ", ex: { kanji: "牛乳",   yomi: "ぎゅうにゅう" } },// ぎゅ
  { k: "ょ", ex: { kanji: "旅行",   yomi: "りょこう" } },    // りょ
  { k: "っ", ex: { kanji: "切手",   yomi: "きって" } },      // っ
];
