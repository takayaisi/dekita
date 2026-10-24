'use strict';
let inputMode='kana',smallKanaMode=false;
const smallKanaMap={'あ':'ぁ','い':'ぃ','う':'ぅ','え':'ぇ','お':'ぉ','つ':'っ','や':'ゃ','ゆ':'ゅ','よ':'ょ','わ':'ゎ'};
const modes=[['kana','あ ひらがな'],['keyboard','⌨ キーボード']];
function insertKana(text,back=false){
 if(selected!==0||viewDay()!==day())return;
 const field=$('reflectionText'),a=field.selectionStart??field.value.length,b=field.selectionEnd??a;
 const start=back&&a===b?Math.max(0,a-1):a;
 const value=field.value.slice(0,start)+(back?'':text)+field.value.slice(b);
 if(value.length>200)return;
 field.value=value;field.setSelectionRange(start+(back?0:text.length),start+(back?0:text.length));
 const ok=storeReflection(value);if(ok&&typeof playSound==='function')playSound('kana');$('reflectionCount').textContent=value.length+' / 200';$('reflectionStatus').textContent=ok?'ほぞんしたよ ✓':'保存できませんでした。';
}
function transformKana(kind){
 const field=$('reflectionText'),p=field.selectionStart;if(!p)return;
 const groups=kind==='small'?['あぁ','いぃ','うぅ','えぇ','おぉ','つっ','やゃ','ゆゅ','よょ']:['かが','きぎ','くぐ','けげ','こご','さざ','しじ','すず','せぜ','そぞ','ただ','ちぢ','つづ','てで','とど','はばぱ','ひびぴ','ふぶぷ','へべぺ','ほぼぽ','うゔ'];
 const ch=field.value[p-1],group=groups.find(g=>g.includes(ch));if(!group)return;
 field.setSelectionRange(p-1,p);insertKana(group[(group.indexOf(ch)+1)%group.length]);
}
function renderInputTools(){
 const editable=viewDay()===day(),context=selected+':'+viewDay();
 $('inputModes').hidden=!editable;
 $('inputModes').replaceChildren(...modes.map(([key,label])=>{const b=button(label,()=>{inputMode=key;renderReflection();});b.setAttribute('aria-pressed',String(inputMode===key));return b;}));
 const field=$('reflectionText');field.readOnly=!editable||inputMode==='kana';
 const tools=$('inputTools');
 if(tools.dataset.context===context+':'+inputMode+':'+smallKanaMode)return;
 tools.dataset.context=context+':'+inputMode+':'+smallKanaMode;tools.replaceChildren();
 const note=text=>{const p=document.createElement('p');p.className='hint';p.textContent=text;tools.append(p);};
 if(!editable){renderDrawing(tools,false);return;}
 if(inputMode==='keyboard'){note('文章欄をタップして、キーボードでじぶんのことばをかこう。');}
 if(inputMode==='kana'){
  note(smallKanaMode?'小さい字モード：ぁ ぃ ぅ ぇ ぉ っ ゃ ゅ ょ ゎ を入力できるよ。':'じぶんの ことばを 1もじずつ タップしよう。文字の位置は ← → でかえられるよ。');
  const grid=document.createElement('div');grid.className='kana-grid';
  const kanaRows=['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','や ゆ よ','らりるれろ','わ を ん'];
  for(let vowel=0;vowel<5;vowel++)for(const row of kanaRows){const ch=row[vowel];
   if(ch===' '){grid.append(document.createElement('span'));continue;}
   const letter=smallKanaMode?(smallKanaMap[ch]||ch):ch;const key=button(letter,()=>insertKana(letter));if(smallKanaMode&&smallKanaMap[ch]){key.className='small-kana';key.setAttribute('aria-label','小さい '+letter);}grid.append(key);
  }tools.append(grid);
  const row=document.createElement('div');row.className='kana-actions';
  for(const [label,action]of [['゛゜',()=>transformKana('voice')],[smallKanaMode?'小さい字 ON':'小さい字 OFF',()=>{smallKanaMode=!smallKanaMode;renderInputTools();}],['、',()=>insertKana('、')],['。',()=>insertKana('。')],['ー',()=>insertKana('ー')],['あける',()=>insertKana(' ')],['←',()=>{const n=Math.max(0,field.selectionStart-1);field.setSelectionRange(n,n);}],['→',()=>{const n=Math.min(field.value.length,field.selectionStart+1);field.setSelectionRange(n,n);}],['1もじけす',()=>insertKana('',true)]]){const key=button(label,action);if(label.startsWith('小さい字')){key.setAttribute('aria-pressed',String(smallKanaMode));key.className='small-mode';}row.append(key);}
  tools.append(row);
 }
}
function renderDrawing(container,editable){
 const date=viewDay(),child=state.children[0];let strokes=structuredClone(child.drawings?.[date]||[]);
 if(!editable&&!strokes.length)return;
 const canvas=document.createElement('canvas');canvas.width=600;canvas.height=360;canvas.className='handwriting';canvas.setAttribute('aria-label','手書き欄。指やペンで書けます');container.append(canvas);
 const ctx=canvas.getContext('2d');ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#704b79';
 function redraw(){ctx.clearRect(0,0,600,360);for(const line of strokes){ctx.beginPath();line.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(line.length===1){ctx.lineTo(line[0][0]+.1,line[0][1]+.1);}ctx.stroke();}}
 redraw();if(!editable)return;
 let active=null,pointer=null;
 function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(600,(e.clientX-r.left)*600/r.width)),Math.max(0,Math.min(360,(e.clientY-r.top)*360/r.height))];}
 function persist(){if(selected!==0||date!==day()||viewDay()!==date)return;child.drawings||={};if(strokes.length)child.drawings[date]=strokes;else delete child.drawings[date];const ok=save();$('reflectionStatus').textContent=ok?'てがきを ほぞんしたよ ✓':'保存できませんでした。';}
 canvas.onpointerdown=e=>{e.preventDefault();if(active||selected!==0||viewDay()!==day())return;if(strokes.flat().length>=3000){$('reflectionStatus').textContent='この日の手書きがいっぱいです。少し消してください。';return;}pointer=e.pointerId;canvas.setPointerCapture(pointer);active=[point(e)];strokes.push(active);redraw();};
 canvas.onpointermove=e=>{e.preventDefault();if(!active||pointer!==e.pointerId)return;if(strokes.flat().length<3000)active.push(point(e));redraw();};
 canvas.onpointerup=canvas.onpointercancel=e=>{if(e.pointerId!==pointer)return;active=null;pointer=null;persist();};
 const undo=button('ひとふで もどす',()=>{strokes.pop();redraw();persist();});container.append(undo,button('てがきを ほぞん',persist));
}
renderReflection();
