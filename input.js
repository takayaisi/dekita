'use strict';
let inputMode='kana',recognition=null,voiceContext=null,drawContext=null;
const modes=[['keyboard','⌨ キーボード'],['kana','あ ひらがな'],['voice','🎤 おんせい'],['hand','✍ てがき']];
function stopVoice(){if(recognition){recognition.abort();recognition=null;}voiceContext=null;}
function insertKana(text,back=false){
 if(selected!==0||viewDay()!==day())return;
 const field=$('reflectionText'),a=field.selectionStart??field.value.length,b=field.selectionEnd??a;
 const start=back&&a===b?Math.max(0,a-1):a;
 const value=field.value.slice(0,start)+(back?'':text)+field.value.slice(b);
 if(value.length>200)return;
 field.value=value;field.setSelectionRange(start+(back?0:text.length),start+(back?0:text.length));
 const ok=storeReflection(value);$('reflectionCount').textContent=value.length+' / 200';$('reflectionStatus').textContent=ok?'ほぞんしたよ ✓':'保存できませんでした。';
}
function transformKana(kind){
 const field=$('reflectionText'),p=field.selectionStart;if(!p)return;
 const groups=kind==='small'?['あぁ','いぃ','うぅ','えぇ','おぉ','つっ','やゃ','ゆゅ','よょ']:['かが','きぎ','くぐ','けげ','こご','さざ','しじ','すず','せぜ','そぞ','ただ','ちぢ','つづ','てで','とど','はばぱ','ひびぴ','ふぶぷ','へべぺ','ほぼぽ','うゔ'];
 const ch=field.value[p-1],group=groups.find(g=>g.includes(ch));if(!group)return;
 field.setSelectionRange(p-1,p);insertKana(group[(group.indexOf(ch)+1)%group.length]);
}
function startVoice(){
 if(selected!==0||viewDay()!==day())return;
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){$('voiceStatus').textContent='このブラウザでは直接録音できません。下の文章欄をタップし、iPad・iPhoneのキーボードにあるマイクから音声入力してください。';$('reflectionText').focus();return;}
 stopVoice();const rec=new Speech();recognition=rec;const target=day();voiceContext=target;
 rec.lang='ja-JP';rec.interimResults=false;rec.continuous=false;
 rec.onresult=e=>{if(selected!==0||viewDay()!==target||day()!==target||voiceContext!==target)return;const text=Array.from(e.results).map(r=>r[0].transcript).join('');const current=state.children[0].notes?.[target]||'';const next=(current+text).slice(0,200);storeReflection(next);$('reflectionText').value=next;renderReflection();};
 rec.onerror=e=>{const el=$('voiceStatus');if(el)el.textContent=e.error==='not-allowed'?'マイクを許可するか、キーボードのマイクから入力してください。':'音声入力を開始できませんでした。キーボードのマイクも使えます。';};
 rec.onend=()=>{if(recognition===rec)recognition=null;const el=$('voiceStatus');if(el&&el.textContent==='きいているよ…')el.textContent='おわったよ。文字をたしかめてね。';};
 try{rec.start();$('voiceStatus').textContent='きいているよ…';}catch(e){$('voiceStatus').textContent='音声入力を開始できませんでした。';}
}
function renderInputTools(){
 const editable=viewDay()===day(),context=selected+':'+viewDay();
 if(voiceContext&&voiceContext!==day())stopVoice();
 $('inputModes').hidden=!editable;
 $('inputModes').replaceChildren(...modes.map(([key,label])=>{const b=button(label,()=>{stopVoice();inputMode=key;drawContext=null;renderReflection();});b.setAttribute('aria-pressed',String(inputMode===key));return b;}));
 const field=$('reflectionText');field.readOnly=!editable||inputMode==='kana';
 const tools=$('inputTools');
 if(tools.dataset.context===context+':'+inputMode)return;
 stopVoice();tools.dataset.context=context+':'+inputMode;tools.replaceChildren();
 const note=text=>{const p=document.createElement('p');p.className='hint';p.textContent=text;tools.append(p);};
 if(!editable){renderDrawing(tools,false);return;}
 if(inputMode==='keyboard'){note('文章欄をタップして入力。iPadの予測変換や音声入力も使えます。');}
 if(inputMode==='kana'){
  note('じぶんの ことばを 1もじずつ タップしよう。文字の位置は ← → でかえられるよ。');
  const grid=document.createElement('div');grid.className='kana-grid';
  for(const ch of 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもや ゆ よらりるれろわ を ん'){
   if(ch===' '){grid.append(document.createElement('span'));continue;}
   grid.append(button(ch,()=>insertKana(ch)));
  }tools.append(grid);
  const row=document.createElement('div');row.className='kana-actions';
  for(const [label,action]of [['゛゜',()=>transformKana('voice')],['小さい字',()=>transformKana('small')],['、',()=>insertKana('、')],['。',()=>insertKana('。')],['ー',()=>insertKana('ー')],['あける',()=>insertKana(' ')],['←',()=>{const n=Math.max(0,field.selectionStart-1);field.setSelectionRange(n,n);}],['→',()=>{const n=Math.min(field.value.length,field.selectionStart+1);field.setSelectionRange(n,n);}],['1もじけす',()=>insertKana('',true)]])row.append(button(label,action));
  tools.append(row);
 }
 if(inputMode==='voice'){
  note('「はなす」を押して自分の言葉を話そう。音声はブラウザ・OSの認識サービスに送信される場合があります。マイクの許可が必要です。');
  tools.append(button('🎤 はなす',startVoice),button('■ とめる',stopVoice));const p=document.createElement('p');p.id='voiceStatus';p.setAttribute('role','status');tools.append(p);
  note('直接入力が使えない場合：文章欄をタップ → キーボードのマイクを押す。');
 }
 if(inputMode==='hand'){
  note('指やペンで下に書けます。これは手書きのまま保存します。文字へ変換したいときは、対応するiPadとApple Pencilで下の文章欄にスクリブル入力してください。');renderDrawing(tools,true);
 }
}
function renderDrawing(container,editable){
 const date=viewDay(),child=state.children[0];let strokes=structuredClone(child.drawings?.[date]||[]);
 if(!editable&&!strokes.length)return;
 const canvas=document.createElement('canvas');canvas.width=600;canvas.height=240;canvas.className='handwriting';canvas.setAttribute('aria-label','手書き欄。指やペンで書けます');container.append(canvas);
 const ctx=canvas.getContext('2d');ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#704b79';
 function redraw(){ctx.clearRect(0,0,600,240);for(const line of strokes){ctx.beginPath();line.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(line.length===1){ctx.lineTo(line[0][0]+.1,line[0][1]+.1);}ctx.stroke();}}
 redraw();if(!editable)return;
 let active=null,pointer=null;
 function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(600,(e.clientX-r.left)*600/r.width)),Math.max(0,Math.min(240,(e.clientY-r.top)*240/r.height))];}
 function persist(){if(selected!==0||date!==day()||viewDay()!==date)return;child.drawings||={};if(strokes.length)child.drawings[date]=strokes;else delete child.drawings[date];const ok=save();$('reflectionStatus').textContent=ok?'てがきを ほぞんしたよ ✓':'保存できませんでした。';}
 canvas.onpointerdown=e=>{if(selected!==0||viewDay()!==day())return;if(strokes.flat().length>=3000){$('reflectionStatus').textContent='この日の手書きがいっぱいです。少し消してください。';return;}pointer=e.pointerId;canvas.setPointerCapture(pointer);active=[point(e)];strokes.push(active);redraw();};
 canvas.onpointermove=e=>{if(!active||pointer!==e.pointerId)return;if(strokes.flat().length<3000)active.push(point(e));redraw();};
 canvas.onpointerup=canvas.onpointercancel=e=>{if(e.pointerId!==pointer)return;active=null;pointer=null;persist();};
 const undo=button('ひとふで もどす',()=>{strokes.pop();redraw();persist();});container.append(undo);
}
renderReflection();
