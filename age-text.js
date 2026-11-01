'use strict';
// Use familiar elementary-school kanji only in app-owned copy.
// Names, journal entries and custom task/reward text stay as entered.
const olderWords = [
 ['まいにち','毎日'],['きょう','今日'],['あした','明日'],['いちにち','一日'],
 ['ひづけ','日付'],['よてい','予定'],['ひとこと','一言'],
 ['しゅくだい','宿題'],['れんしゅう','練習'],['あさ','朝'],['おきてすぐ','起きてすぐ'],
 ['たべる','食べる'],['ぜんぶ','全部'],
 ['じぶん','自分'],['ひとつずつ','一つずつ'],['もういちど','もう一度'],
 ['かいて','書いて'],['かいた','書いた'],['かこう','書こう'],['かけない','書けない'],
 ['よみかえせる','読み返せる'],['たのしかった','楽しかった'],['きもち','気持ち'],
 ['ほぞん','保存'],['てがき','手書き'],
 ['1もじ','1文字'],['にゅうりょくほうほう','入力のしかた'],['すきな','好きな'],
 ['みせよう','見せよう'],['でてくる','出てくる'],
 ['みつけ','見つけ'],['せいかい','正解（せいかい）'],['おなじ','同じ'],
 ['もんだい','問題'],['つぎの','次の'],['はじめから','初めから'],
 ['おてほん','お手本'],['おはなの おにわ','お花の 庭'],['うみの ぼうけん','海の ぼうけん'],
 ['うちゅうの たび','うちゅうの 旅'],['ひだりから','左から'],['ばんめ','番目'],
 ['2つの え','2つの 絵'],['どちらの え','どちらの 絵'],['くらべる え','くらべる 絵'],['できた かず','できた 数'],['ばしょ','場所'],['だんめ','だん目'],['ひらく','開く'],
];
function ageText(text) {
 if (selected !== 0) return text;
 return olderWords.reduce((value,[from,to])=>value.split(from).join(to),text);
}
const olderTaskTitles = new Map([
 ['あさ おきてすぐ おきがえ','朝 起きてすぐ おきがえ'],
 ['ピアノの れんしゅう','ピアノの 練習'],['しゅくだい','宿題'],
 ['ごはんを のこさず たべる','ごはんを のこさず 食べる']
]);
function taskDisplayTitle(title) {
 return selected === 0 ? olderTaskTitles.get(title) || title : title;
}
const originalAgeLabels = new WeakMap();
function renderAgeLabels() {
 const selectors = ['.brand','#todayView','#historyView','#todayButton','#backToday',
  '.hero p:not(.eyebrow)','.reward .eyebrow','.reflection .eyebrow','.reflection-label',
  '#openDifferences','#closeDifferences','#differenceGame>p','#differenceGame label',
  '#differenceLevel option','#differenceHint','#differenceReset','#differenceNext','footer'];
 for (const selector of selectors) for (const host of document.querySelectorAll(selector)) {
  const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);
  let node;
  while ((node=walker.nextNode())) {
   // Live notices and update controls own their text.
   if (node.parentElement.closest('#notice,#update')) continue;
   if (!originalAgeLabels.has(node)) originalAgeLabels.set(node,node.nodeValue);
   node.nodeValue=ageText(originalAgeLabels.get(node));
  }
 }
}
