'use strict';
function arithmeticProblem(mode,hard=false,random=Math.random){
 const integer=(min,max)=>min+Math.floor(random()*(max-min+1));
 if(mode==='multiply'){
  const a=integer(12,hard?99:49),b=integer(hard?12:2,hard?99:9);
  const steps=[{label:'一の位をかけた答え',answer:a*(b%10),hint:`${a} × ${b%10} を計算しよう。一の位から順にかけて、くり上がりも足そう。`,row:String(a*(b%10))}];
  if(b>=10){steps.push({label:'十の位をかけた答え（右の0も入れてね）',answer:a*Math.floor(b/10)*10,hint:`${a} × ${Math.floor(b/10)} を計算して、右に0を1つつけよう。`,row:String(a*Math.floor(b/10))+'·'});steps.push({label:'最後に足した答え',answer:a*b,hint:'上の2つの答えを、位をそろえて足そう。',row:String(a*b)});}
  return {mode,a,b,answer:a*b,steps};
 }
 const b=integer(2,9),a=integer(hard?100:20,hard?999:99),steps=[];let remainder=0;
 for(const digit of String(a)){
  const current=remainder*10+Number(digit);
  if(!steps.length&&current<b){remainder=current;continue;}
  const quotient=Math.floor(current/b),product=quotient*b;remainder=current-product;
  steps.push({label:`${current} ÷ ${b} の商（1けた）`,answer:quotient,hint:`${b}の段で、${current}をこえない一番大きな答えをさがそう。`,row:`${current} ÷ ${b} → 商 ${quotient}`});
  steps.push({label:`今の商 × ${b}`,answer:product,hint:`今書いた商 ${quotient} に ${b} をかけよう。`,row:`− ${product}`});
  steps.push({label:`${current} − ${product} の残り`,answer:remainder,hint:`引いた残りだよ。次の数字があれば、おろして続けよう。`,row:`残り ${remainder}`});
 }
 return {mode,a,b,answer:Math.floor(a/b),remainder:a%b,steps};
}
function createArithmeticMemo(){
 const memo=document.createElement('section');memo.className='arithmetic-memo';
 const heading=document.createElement('h3');heading.textContent='✏️ 計算メモ';
 const help=document.createElement('p');help.textContent='指・ペン・マウスで書けるよ。答えをチェックしても残るよ。次の問題では新しいメモになるよ。';
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=576;canvas.setAttribute('aria-label','途中の計算を自由に書くメモ。文字で入力するメモ欄も使えます。');
 const context=canvas.getContext('2d'),strokes=[];let active=null,pointer=null;
 const controls=document.createElement('div');controls.className='maze-actions';
 const undo=button('↶ 1つもどす',()=>{strokes.pop();active=null;pointer=null;paint();});
 const clear=button('🧹 手書きを全部消す',()=>{strokes.length=0;active=null;pointer=null;paint();});
 function paint(){
  context.clearRect(0,0,canvas.width,canvas.height);context.strokeStyle='#344f83';context.lineWidth=4;context.lineCap='round';context.lineJoin='round';
  for(const stroke of strokes){context.beginPath();context.moveTo(...stroke[0]);if(stroke.length===1)context.lineTo(stroke[0][0]+.1,stroke[0][1]);else for(const point of stroke.slice(1))context.lineTo(...point);context.stroke();}
  undo.disabled=clear.disabled=strokes.length===0;
 }
 function point(e){const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(canvas.width,(e.clientX-rect.left)*canvas.width/rect.width)),Math.max(0,Math.min(canvas.height,(e.clientY-rect.top)*canvas.height/rect.height))];}
 canvas.onpointerdown=e=>{if(pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;active=[point(e)];strokes.push(active);canvas.setPointerCapture(pointer);paint();};
 canvas.onpointermove=e=>{if(e.pointerId!==pointer||!active)return;e.preventDefault();active.push(point(e));paint();};
 const end=e=>{if(e.pointerId!==pointer)return;active=null;pointer=null;};
 canvas.onpointerup=end;canvas.onpointercancel=end;canvas.onlostpointercapture=end;
 const label=document.createElement('label');label.textContent='⌨️ 文字でメモする';const text=document.createElement('textarea');text.rows=3;text.maxLength=2000;text.placeholder='くり上がりや、途中の計算を書こう';label.append(text);
 controls.append(undo,clear);memo.append(heading,help,canvas,controls,label);paint();return memo;
}
function startArithmetic(host){
 let mode='multiply',hard=false,problem,index=0,gems=0,finished=false,memo;
 const root=document.createElement('section');root.className='arithmetic';host.append(root);
 function element(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
 function newProblem(){problem=arithmeticProblem(mode,hard);index=0;finished=false;memo=createArithmeticMemo();draw();}
 function draw(){
  root.replaceChildren();const intro=element('p','計算のカギで、お宝のとびらを開こう！ まちがえても何回でもチャレンジ。');
  const choices=element('div',undefined,'maze-settings');for(const [key,label]of [['multiply','✖ 掛け算'],['divide','➗ 割り算']]){const choice=button(label,()=>{mode=key;newProblem();});choice.setAttribute('aria-pressed',String(mode===key));choices.append(choice);}
  for(const [value,label]of [[false,'🌱 きほん'],[true,'🚀 チャレンジ']]){const choice=button(label,()=>{hard=value;newProblem();});choice.setAttribute('aria-pressed',String(hard===value));choices.append(choice);}
  const meter=element('p',`💎 ${gems} / 5　${'💎'.repeat(gems)}${'◇'.repeat(5-gems)}`,'arithmetic-meter');
  const notebook=element('div',undefined,'arithmetic-paper');
  notebook.append(element('p',mode==='multiply'?'位をそろえて、右からかけよう':'たてる → かける → 引く → おろす','arithmetic-caption'));
  const written=element('pre',mode==='multiply'?String(problem.a).padStart(7)+'\n'+('× '+problem.b).padStart(7)+'\n───────':(' '.repeat(String(problem.b).length+3)+'？\n'+problem.b+' ⟌ '+problem.a),'arithmetic-written');written.setAttribute('aria-label',`${problem.a} ${mode==='multiply'?'かける':'わる'} ${problem.b}`);notebook.append(written);
  const work=element('ol',undefined,'arithmetic-work');for(const step of problem.steps.slice(0,index))work.append(element('li',step.row));notebook.append(work);
  const status=element('p',undefined,'game-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  root.append(intro,choices,meter,notebook,memo);
  if(finished){status.textContent=gems===5?'🎉 お宝のとびらが開いた！ ひっさんマスター！':`✨ 正解！ ${problem.a} ${mode==='multiply'?'×':'÷'} ${problem.b} = ${problem.answer}${mode==='divide'?' あまり '+problem.remainder:''}。ダイヤを1こゲット！`;root.append(status,button(gems===5?'🗺 新しいたんけんへ':'💎 次の問題へ',()=>{if(gems===5)gems=0;newProblem();},'primary'));return;}
  const step=problem.steps[index],form=element('form'),label=element('label',`${index+1} / ${problem.steps.length}：${step.label}`);const input=element('input');input.type='text';input.inputMode='numeric';input.pattern='[0-9０-９]+';input.required=true;input.autocomplete='off';input.maxLength=6;input.setAttribute('aria-label',step.label);label.append(input);const submit=element('button','🔑 答えをチェック','primary');submit.type='submit';form.append(label,submit);
  form.onsubmit=e=>{e.preventDefault();const value=input.value.trim().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0));if(!/^\d+$/.test(value)){status.textContent='数字を入れてね。';return;}if(Number(value)!==step.answer){status.textContent='🌱 おしい！ ヒントを見て、もう一度やってみよう。';input.select();return;}index++;if(index===problem.steps.length){finished=true;gems++;playSound(gems===5?'all':'check');if(gems===5)celebrate(true);}else playSound('check');draw();root.querySelector('input')?.focus();};
  root.append(form,status,button('💡 ヒント',()=>{status.textContent=step.hint;}),button('別の問題にする',newProblem));
 }
 newProblem();
}
