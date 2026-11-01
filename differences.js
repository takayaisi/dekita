'use strict';
(() => {
 const modal = document.getElementById('differenceGame');
 const boards = document.getElementById('differenceBoards');
 const status = document.getElementById('differenceStatus');
 const hint = document.getElementById('differenceHint');
 const next = document.getElementById('differenceNext');
 const TOTAL=8, COLS=8, ROWS=6, HINTS=3;
 let changes=new Set(), variants=[], hintsUsed=0, zoom=1;
 const scenes = [
  {name:'おはなの おにわ', sky:'#dff4ff'},
  {name:'うみの ぼうけん', sky:'#dff7ff'},
  {name:'うちゅうの たび', sky:'#e2e1fa'}
 ];
 const positions=Array.from({length:COLS*ROWS},(_,i)=>[i%COLS*80+40,Math.floor(i/COLS)*80+40]);
 let level = 0, found = new Set();
 const ns = 'http://www.w3.org/2000/svg';
 function svgElement(tag, attrs) {
  const el = document.createElementNS(ns, tag);
  for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  return el;
 }
 // Draw the same object with a subtle change in count or position.
 function motif(kind,v){
  const color=[['#91b188','#d59d94','#d6ba76','#b1a8c7'],['#91b8c5','#d3b3a3','#b6b4ce','#d6bd86'],['#a2adc6','#c1adca','#9fbcb7','#cbb592']][level][kind];
  const dot=(x,y,r,c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'"/>';
  const p=(d,fill='none')=>'<path d="'+d+'" fill="'+fill+'"/>';
  const lines=(n,fn)=>Array.from({length:n},(_,i)=>fn(i)).join('');
  if(level===0){
   if(kind===0)return p('M-3 10V29H3V10','#b69b80')+dot(-11,0,15,color)+dot(10,0,16,color)+dot(0,-13,17,color)+dot(-10+v*6,-8,3,'#d5a17d')+p('M0 17l9 -5');
   if(kind===1)return p('M-6 3L-8 27Q0 31 8 27L6 3','#eee2c9')+p('M-27 4Q-24 -26 0 -27Q24 -26 27 4Z',color)+lines(v+2,i=>dot(-12+i*7,-7,2.3,'#faf5dc'))+p('M-4 13L-3 24M3 13L4 24');
   if(kind===2)return p('M0 0V29M0 20Q-21 7 -15 24Q-5 28 0 20','#93b687')+lines(v+5,i=>{const a=i*Math.PI*2/(v+5);return dot(Math.cos(a)*13,Math.sin(a)*13-7,8,color);})+dot(0,-7,7,'#e7c77c');
   return p('M0 -13Q-31 -35 -25 -4Q-29 21 -3 9Q0 21 3 9Q29 21 25 -4Q31 -35 0 -13Z',color)+p('M0 -12V15M0 -12Q-11 -31 -14 -23M0 -12Q11 -31 14 -23')+dot(-15,-8,5,'#e9d4b5')+dot(15,-8,5,'#e9d4b5')+dot(v%2?-15:15,6,2.8,'#faf5dc')+p('M-5 '+(-3+v*3)+'H5');
  }
  if(level===1){
   if(kind===0)return p('M-25 0Q-5 -29 23 0Q-5 29 -25 0L-34 -12V12Z',color)+dot(14,-3,2.5,'#465968')+lines(v+2,i=>p('M'+(-13+i*6)+' -10q-5 10 0 20'))+p('M-3 -14L5 -23L10 -12',color);
   if(kind===1)return p('M-24 8Q-34 -10 -16 -20Q0 -39 16 -20Q34 -10 24 8L5 25H-5Z',color)+lines(v+3,i=>p('M0 23L'+(-21+i*42/(v+2))+' -12'));
   if(kind===2)return lines(v+4,i=>p('M'+(-21+i*42/(v+3))+' 3q-6 12 0 23'))+p('M-27 5Q-27 -28 0 -28Q27 -28 27 5Z',color)+dot(-9,-5,2,'#465968')+dot(9,-5,2,'#465968')+p('M-3 1Q0 4 3 1');
   let points='';for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?12:29;points+=Math.cos(a)*r+','+Math.sin(a)*r+' ';}return '<polygon points="'+points+'" fill="'+color+'"/>'+lines(v+2,i=>dot(-8+i*5,-2+i*2,1.9,'#f7ead5'));
  }
  if(kind===0)return p('M-12 15V-5Q-12 -24 0 -31Q12 -24 12 -5V15Z',color)+p('M-12 2L-23 21L-12 16M12 2L23 21L12 16',color)+dot(0,-9,7,'#eef1f1')+dot(0,-9,3,'#9caec2')+p('M-6 18L0 31L6 18','#d4b17d')+lines(v+1,i=>p('M-6 '+(3+i*3)+'H6'));
  if(kind===1)return dot(0,0,23,color)+'<ellipse cx="0" cy="0" rx="35" ry="9" transform="rotate(-25)" fill="none"/>'+dot(-8,-9,5,'#e3d7df')+dot(8,8,4,'#e3d7df')+dot(-8+v*5,9-v*3,2.6,'#eef0ed');
  if(kind===2)return p('M-20 -20H20V10H-20ZM-13 15H13V30H-13Z',color)+p('M0 -20V-29M-13 23H13M-25 -8H-20M20 -8H25')+dot(0,-31,3,'#d6b989')+dot(-9,-7,4,'#eff3e8')+dot(9,-7,4,'#eff3e8')+lines(v+2,i=>p('M'+(-9+i*5)+' 2v4'));
  return p('M-9 -14H9V14H-9Z',color)+p('M-30 -15H-14V15H-30ZM14 -15H30V15H14Z','#acbccc')+p('M-14 0H14M-22 -15V15M22 -15V15M-30 -5H-14M14 -5H30M-30 5H-14M14 5H30')+p('M0 -14L'+(-14+v*9)+' -29')+dot(-14+v*9,-29,3,'#d7bd8b');
 }
 function mark(index) {
  boards.querySelectorAll(`[data-item="${index}"]`).forEach(el => {
   el.classList.add('difference-found');
   el.setAttribute('aria-label', ageText(`ばしょ ${index+1}、みつけた！`));
   el.setAttribute('aria-disabled','true');
   const [x,y] = positions[index];
   el.append(svgElement('circle',{cx:x,cy:y,r:37,fill:'none',stroke:'#b43d62','stroke-width':4,'pointer-events':'none'}));
  });
 }
 function choose(index) {
  if (found.has(index)) { status.textContent=ageText('ここは もう みつけたよ。ほかも さがそう！'); return; }
  if (!changes.has(index)) { status.textContent=ageText('ここは おなじみたい。ゆっくり くらべてみよう。'); return; }
  found.add(index); mark(index);
  document.getElementById('differenceCount').textContent=ageText(`${found.size} / ${TOTAL} みつけた！`);
  const complete = found.size === TOTAL;
  status.textContent = complete ? ageText('🎉 はなまる！ 8つ ぜんぶ みつけたね！') : ageText('せいかい！ あと ')+(TOTAL-found.size)+'こ。';
  hint.disabled=complete||hintsUsed>=HINTS; next.hidden=!complete;
 }
 function render() {
  found = new Set(); boards.replaceChildren(); hint.disabled=false; next.hidden=true; hintsUsed=0;
  hint.textContent=ageText('💡 ヒント（あと 3回）');
  const order=positions.map((_,i)=>i);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  changes=new Set(order.slice(0,TOTAL));
  variants=positions.map(()=>Math.floor(Math.random()*4));
  document.getElementById('differenceTitle').textContent='まちがいさがし：'+ageText(scenes[level].name)+'〈ちょうむずかしい〉';
  document.getElementById('differenceCount').textContent=ageText(`0 / ${TOTAL} みつけた！`);
  status.textContent=ageText('48この 絵に、8つの ちがい。小さな もようや むきを よく くらべよう！');
  for (let side=0;side<2;side++) {
   const figure=document.createElement('figure'), caption=document.createElement('figcaption');
   caption.textContent=side?ageText('くらべる え'):ageText('おてほん');
   const svg=svgElement('svg',{viewBox:'0 0 640 480',role:'group','aria-label':caption.textContent});
   svg.append(svgElement('rect',{width:640,height:480,rx:18,fill:scenes[level].sky}));
   const viewport=document.createElement('div');viewport.className='difference-viewport';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label',caption.textContent+'。大きくしたら スクロールできるよ。');
   positions.forEach((_,index) => {
    const [x,y]=positions[index];
    const group=svgElement('g',{'data-item':index,role:'button',tabindex:0,'aria-label':ageText(`ばしょ ${index+1}（${Math.floor(index/COLS)+1}だんめの ${index%COLS+1}ばんめ）`)});
    group.append(svgElement('rect',{x:x-39,y:y-39,width:78,height:78,rx:12,fill:'transparent'}));
    const drawing=svgElement('g',{transform:'translate('+x+' '+y+') rotate('+((index%3-1)*7)+')',stroke:'#5b6d70','stroke-width':1.3,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true','pointer-events':'none'});
    drawing.innerHTML=motif(index%4,side&&changes.has(index)?(variants[index]+1)%4:variants[index]);
    group.append(drawing);
    group.addEventListener('click',()=>choose(index));
    group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(index);}});
    svg.append(group);
   });
   viewport.append(svg);figure.append(caption,viewport); boards.append(figure);
  }
 }
 const zoomButton=document.createElement('button');zoomButton.type='button';zoomButton.id='differenceZoom';zoomButton.textContent='🔍 1×';zoomButton.setAttribute('aria-label','絵の大きさを切りかえる');
 zoomButton.addEventListener('click',()=>{zoom=zoom===1?1.5:zoom===1.5?2:1;zoomButton.textContent='🔍 '+zoom+'×';boards.style.setProperty('--difference-zoom',zoom);});hint.after(zoomButton);
 document.getElementById('openDifferences').addEventListener('click',()=>{render();modal.showModal();});
 document.getElementById('closeDifferences').addEventListener('click',()=>modal.close());
 document.getElementById('differenceLevel').addEventListener('change',event=>{level=Number(event.target.value);render();});
 document.getElementById('differenceReset').addEventListener('click',render);
 next.addEventListener('click',()=>{level=(level+1)%scenes.length;document.getElementById('differenceLevel').value=String(level);render();});
 hint.addEventListener('click',()=>{
  if(hintsUsed>=HINTS||found.size===TOTAL)return;
  const remaining=[...changes].filter(i=>!found.has(i));const index=remaining[hintsUsed%remaining.length];hintsUsed++;
  status.textContent=ageText('💡 '+(Math.floor(index/COLS)<ROWS/2?'上':'下')+'はんぶんの、'+(index%COLS<COLS/2?'左':'右')+'がわを よく くらべよう。');
  hint.textContent=ageText('💡 ヒント（あと '+(HINTS-hintsUsed)+'回）');hint.disabled=hintsUsed>=HINTS;
 });
})();
