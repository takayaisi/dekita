'use strict';
(() => {
 const modal = document.getElementById('differenceGame');
 const boards = document.getElementById('differenceBoards');
 const status = document.getElementById('differenceStatus');
 const hint = document.getElementById('differenceHint');
 const next = document.getElementById('differenceNext');
 const scenes = [
  {name:'おはなの おにわ', sky:'#dff4ff', ground:'#d7edbb', items:['☀️','☁️','🌳','🏠','🌷','🐈','🦋','🌼','🍎','🐦','🍄','🌻'], changes:{0:'🌙',4:'🌻',5:'🐕',8:'🍐',10:'🌼'}},
  {name:'うみの ぼうけん', sky:'#dff7ff', ground:'#bde9f0', items:['☀️','☁️','⛵','🏝️','🐠','🐙','🐬','🦀','🐚','⭐','🐢','🪸'], changes:{1:'🌈',4:'🐡',7:'🦐',9:'🐚',10:'🐟'}},
  {name:'うちゅうの たび', sky:'#e2e1fa', ground:'#d1d1ed', items:['⭐','🌙','🪐','🌍','🚀','👽','☄️','🛸','🌟','🤖','🛰️','🌑'], changes:{0:'☀️',3:'🌕',5:'🤖',7:'🚀',10:'⭐'}}
 ];
 const positions = [[48,43],[150,43],[250,43],[350,43],[48,128],[150,128],[250,128],[350,128],[48,213],[150,213],[250,213],[350,213]];
 let level = 0, found = new Set();
 const ns = 'http://www.w3.org/2000/svg';
 function svgElement(tag, attrs) {
  const el = document.createElementNS(ns, tag);
  for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  return el;
 }
 function mark(index) {
  boards.querySelectorAll(`[data-item="${index}"]`).forEach(el => {
   el.classList.add('difference-found');
   el.setAttribute('aria-label', ageText(`ばしょ ${index+1}、みつけた！`));
   el.setAttribute('aria-disabled','true');
   const [x,y] = positions[index];
   el.append(svgElement('circle',{cx:x,cy:y,r:36,fill:'none',stroke:'#b43d62','stroke-width':4,'pointer-events':'none'}));
  });
 }
 function choose(index) {
  if (found.has(index)) { status.textContent=ageText('ここは もう みつけたよ。ほかも さがそう！'); return; }
  if (!Object.hasOwn(scenes[level].changes,index)) { status.textContent=ageText('ここは おなじみたい。ゆっくり くらべてみよう。'); return; }
  found.add(index); mark(index);
  document.getElementById('differenceCount').textContent=ageText(`${found.size} / 5 みつけた！`);
  const complete = found.size === 5;
  status.textContent = complete ? ageText('🎉 はなまる！ 5つ ぜんぶ みつけたね！') : ageText('せいかい！ あと ')+(5-found.size)+'こ。';
  hint.disabled=complete; next.hidden=!complete;
 }
 function render() {
  found = new Set(); boards.replaceChildren(); hint.disabled=false; next.hidden=true;
  document.getElementById('differenceTitle').textContent='まちがいさがし：'+ageText(scenes[level].name);
  document.getElementById('differenceCount').textContent=ageText('0 / 5 みつけた！');
  status.textContent=ageText('ちがうところを、どちらの えでも タップしてね。');
  for (let side=0;side<2;side++) {
   const figure=document.createElement('figure'), caption=document.createElement('figcaption');
   caption.textContent=side?ageText('くらべる え'):ageText('おてほん');
   const svg=svgElement('svg',{viewBox:'0 0 400 260',role:'group','aria-label':caption.textContent});
   svg.append(svgElement('rect',{width:400,height:260,rx:18,fill:scenes[level].sky}));
   svg.append(svgElement('path',{d:'M0 100 Q100 75 200 105 T400 95 V260 H0Z',fill:scenes[level].ground}));
   scenes[level].items.forEach((item,index) => {
    const [x,y]=positions[index];
    const group=svgElement('g',{'data-item':index,role:'button',tabindex:0,'aria-label':ageText(`ばしょ ${index+1}（${Math.floor(index/4)+1}だんめの ${index%4+1}ばんめ）`)});
    group.append(svgElement('rect',{x:x-43,y:y-40,width:86,height:80,rx:12,fill:'transparent'}));
    const text=svgElement('text',{x,y:y+18,'text-anchor':'middle','font-size':49,'aria-hidden':'true','pointer-events':'none'});
    text.textContent=side && Object.hasOwn(scenes[level].changes,index)?scenes[level].changes[index]:item;
    group.append(text);
    group.addEventListener('click',()=>choose(index));
    group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(index);}});
    svg.append(group);
   });
   figure.append(caption,svg); boards.append(figure);
  }
 }
 document.getElementById('openDifferences').addEventListener('click',()=>{render();modal.showModal();});
 document.getElementById('closeDifferences').addEventListener('click',()=>modal.close());
 document.getElementById('differenceLevel').addEventListener('change',event=>{level=Number(event.target.value);render();});
 document.getElementById('differenceReset').addEventListener('click',render);
 next.addEventListener('click',()=>{level=(level+1)%scenes.length;document.getElementById('differenceLevel').value=String(level);render();});
 hint.addEventListener('click',()=>{
  const index=Object.keys(scenes[level].changes).map(Number).find(i=>!found.has(i));
  if(index===undefined)return;
  status.textContent=ageText(`💡 ${Math.floor(index/4)+1}だんめの、ひだりから ${index%4+1}ばんめを くらべてみよう。`);
 });
})();
