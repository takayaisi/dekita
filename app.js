'use strict';
const $=id=>document.getElementById(id), KEY='dekita.family.v1';
const uid=()=>crypto.randomUUID();
const initial=()=>({version:1,pin:null,children:[{name:'9さい',stars:0,days:{}},{name:'6さい',stars:0,days:{}}],tasks:[{id:uid(),emoji:'🪥',title:'はみがき'},{id:uid(),emoji:'👕',title:'おきがえ'},{id:uid(),emoji:'🧸',title:'おかたづけ'}],reward:'すきなおやつ',cost:10});
function valid(s){return s&&s.version===1&&(s.pin===null||typeof s.pin==='string')&&Array.isArray(s.children)&&s.children.length===2&&s.children.every(c=>typeof c.name==='string'&&Number.isSafeInteger(c.stars)&&c.stars>=0&&(c.debt===undefined||(Number.isSafeInteger(c.debt)&&c.debt>=0))&&(c.theme===undefined||['magic','space'].includes(c.theme))&&c.days&&typeof c.days==='object'&&!Array.isArray(c.days)&&Object.values(c.days).every(d=>Array.isArray(d)&&d.every(x=>typeof x==='string')))&&Array.isArray(s.tasks)&&s.tasks.length<=60&&s.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string'&&typeof t.emoji==='string'&&(t.owner===undefined||t.owner===0||t.owner===1))&&new Set(s.tasks.map(t=>t.id)).size===s.tasks.length&&typeof s.reward==='string'&&Number.isInteger(s.cost)&&s.cost>=1&&s.cost<=999;}
const eightTasks=[['👕','あさ おきてすぐ おきがえ'],['🪥','はみがき'],['🎹','ピアノの れんしゅう'],['📚','しゅくだい'],['🧸','おかたづけ']];
function migrate(data){
 if(!data.profileRevision){
  if(data.children[0].name==='8さい')data.children[0].name='9さい';
  if(data.children[1].name==='5さい')data.children[1].name='6さい';
  data.children[0].theme='magic';data.children[1].theme='space';
  data.profileRevision=1;
 }

 if(data.taskRevision===2)return data;
 const old=data.tasks;
 data.tasks=old.map(t=>({...t,owner:1}));
 for(const [emoji,title] of eightTasks){
   const match=old.find(t=>t.emoji===emoji);
   data.tasks.push({id:match?match.id+'-older':uid(),emoji,title,owner:0});
   if(match)for(const checked of Object.values(data.children[0].days))if(checked.includes(match.id))checked.push(match.id+'-older');
 }
 data.taskRevision=2;
 return data;
}
function tasksFor(){return state.tasks.filter(t=>t.owner===selected);}
function celebrate(all){
 const tray=document.createElement('div');tray.className='celebration';tray.setAttribute('aria-hidden','true');
 for(let i=0;i<(all?22:7);i++){const star=document.createElement('span');star.textContent=all?(state.children[selected].theme==='space'?['🚀','🪐','⭐','☄️']:['🌸','🦋','✨','🌈'])[i%4]:(state.children[selected].theme==='space'?'⭐':'🌸');star.style.left=(5+Math.random()*90)+'%';star.style.animationDelay=(Math.random()*.4)+'s';tray.append(star);}
 document.body.append(tray);setTimeout(()=>tray.remove(),2400);
}
let state,selected=0,unlocked=false,draft=[],pendingWorker;
try{let raw=localStorage.getItem(KEY);state=raw?JSON.parse(raw):initial();if(!valid(state))throw Error('invalid');}catch(e){state=initial();$('notice').textContent='保存された記録を読めませんでした。バックアップがある場合は設定から復元してください。';}
state=migrate(state);
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){$('notice').textContent='記録を保存できません。ブラウザの保存設定を確認し、バックアップしてください。';return false;}}
function day(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function button(text,fn,cls){const b=document.createElement('button');b.type='button';b.textContent=text;if(cls)b.className=cls;b.onclick=fn;return b;}
function render(){const tasks=tasksFor(),child=state.children[selected],done=child.days[day()]||[],count=tasks.filter(t=>done.includes(t.id)).length;document.body.dataset.theme=child.theme||'magic';document.querySelector('.garden').setAttribute('aria-label',child.theme==='space'?'ぼうけんの うちゅう':'まほうの おにわ');document.querySelector('.flower').textContent=child.theme==='space'?'✨ 🪐 ✨':'🌷 🌸 🌷';$('profiles').replaceChildren(...state.children.map((c,i)=>{const b=button(`${c.theme==='space'?'🚀':'🦄'} ${c.name}`,()=>{selected=i;render();});b.setAttribute('aria-pressed',String(i===selected));return b;}));$('date').textContent=new Date().toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long'});$('greeting').textContent=`${child.name}の きょう`;$('balance').textContent=`⭐ ${child.stars} こ`;$('tree').textContent=child.theme==='space'?(child.stars>=20?'🛸':child.stars>=5?'🚀':'🌍'):(child.stars>=20?'🏰':child.stars>=5?'🦄':'🌸');$('progressText').textContent=`${count} / ${tasks.length} できた`;$('progress').max=Math.max(1,tasks.length);$('progress').value=count;$('progress').setAttribute('aria-label','今日のできた数');$('tasks').replaceChildren(...tasks.map(t=>{const yes=done.includes(t.id),b=button('',()=>complete(t.id),'task'+(yes?' done':''));for(const [cls,text]of [['emoji',t.emoji],['title',t.title],['check',yes?'✓':'']]){const span=document.createElement('span');span.className=cls;span.textContent=text;b.append(span);}b.setAttribute('aria-pressed',String(yes));b.setAttribute('aria-label',`${t.title}、${yes?'できた。もういちど押すと取り消し':'タップでできた'}`);return b;}));$('cheer').textContent=count&&count===tasks.length?'🎉 ぜんぶ できたね！ はなまる！':tasks.length?'ひとつずつ、じぶんのペースで。':'おうちのひとに やることを いれてもらおう';let treasure=$('dailyTreasure');if(!treasure){treasure=document.createElement('div');treasure.id='dailyTreasure';treasure.className='daily-treasure';$('cheer').after(treasure);}
 const completeToday=tasks.length>0&&count===tasks.length;
 const sticker=(child.theme==='space'?['🚀','🪐','🛸','🌠','🌍','👨‍🚀','☄️']:['🦄','🦋','🌷','👑','🌈','🧚','💎'])[Math.floor(Date.UTC(new Date().getFullYear(),new Date().getMonth(),new Date().getDate())/86400000)%7];
 const medals=Object.values(child.days).filter(ids=>tasks.length&&tasks.every(t=>ids.includes(t.id))).length;
 treasure.replaceChildren();const gift=document.createElement('div');gift.className='treasure-icon';gift.textContent=completeToday?sticker:'🎁';const title=document.createElement('strong');title.textContent=completeToday?'きょうの おたから ゲット！':'ぜんぶ できたら おたからが ひらくよ';const note=document.createElement('p');note.textContent=completeToday?`はなまる ${medals}にち！ あしたは なにが でるかな？`:'まいにち ちがう シールが もらえるよ';treasure.append(gift,title,note);
 $('rewardTitle').textContent=state.reward;$('rewardStatus').textContent=child.stars>=state.cost?'⭐ こうかんできるよ！ おうちのひとに みせよう':`あと ⭐ ${state.cost-child.stars} こで ごほうび！`;}
function complete(id){
 const tasks=tasksFor(),c=state.children[selected],d=day();
 if(!tasks.some(t=>t.id===id))return;
 c.days[d]||=[];
 const checked=c.days[d].includes(id);
 if(checked){
  c.days[d]=c.days[d].filter(x=>x!==id);
  if(c.stars>0)c.stars--;else c.debt=(c.debt||0)+1;
 }else{
  c.days[d].push(id);
  if(c.debt)c.debt--;else c.stars++;
 }
 save();render();
 if(checked)$('cheer').textContent='チェックを とりけしたよ。まちがえても だいじょうぶ！';
 else celebrate(tasks.length>0&&tasks.every(t=>c.days[d].includes(t.id)));
}
async function hash(pin){const bytes=new TextEncoder().encode('dekita-parent:'+pin);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');}
$('settings').onclick=()=>{unlocked=false;$('editor').hidden=true;$('gate').hidden=false;$('pin').value='';$('gateError').textContent='';$('gateHint').textContent=state.pin?'親用の暗証番号を入力してください。':'最初に親用の4けたの暗証番号を決めてください。';$('parent').showModal();};
$('close').onclick=()=>$('parent').close();
$('parent').addEventListener('close',()=>{unlocked=false;$('pin').value='';});
$('unlock').onclick=async()=>{const p=$('pin').value;if(!/^\d{4}$/.test(p)){$('gateError').textContent='数字4けたを入力してください。';return;}try{const h=await hash(p);if(state.pin&&state.pin!==h){$('gateError').textContent='暗証番号が違います。';return;}if(!state.pin){state.pin=h;save();}unlocked=true;$('gate').hidden=true;$('editor').hidden=false;fillEditor();}catch(e){$('gateError').textContent='HTTPSの公開URL、またはlocalhostで開いてください。';}};
function fillEditor(){draft=structuredClone(tasksFor());$('name0').value=state.children[0].name;$('name1').value=state.children[1].name;$('rewardInput').value=state.reward;$('cost').value=state.cost;for(let i=0;i<2;i++)$('theme'+i).value=state.children[i].theme;renderEditor();exchangeInfo();$('taskEditor').previousElementSibling.textContent=state.children[selected].name+'の 毎日やること';}
function exchangeInfo(){$('exchangeInfo').textContent=`${state.children[selected].name}：星${state.children[selected].stars}個${state.children[selected].debt?'（取消分の調整：あと'+state.children[selected].debt+'個）':''} ／ 「${state.reward}」に${state.cost}個`;$('exchange').disabled=state.children[selected].stars<state.cost;}
function renderEditor(){$('taskEditor').replaceChildren(...draft.map(t=>{const row=document.createElement('div');row.className='edit-row';for(const prop of ['emoji','title']){const input=document.createElement('input');input.value=t[prop];input.maxLength=prop==='emoji'?12:40;input.setAttribute('aria-label',prop==='emoji'?'絵文字':'やること');input.oninput=()=>t[prop]=input.value;row.append(input);}row.append(button('削除',()=>{draft=draft.filter(x=>x.id!==t.id);renderEditor();}));return row;}));$('addTask').disabled=draft.length>=30;}
$('addTask').onclick=()=>{if(draft.length<30){draft.push({id:uid(),title:'',emoji:'⭐'});renderEditor();}};
$('parentForm').onsubmit=e=>{e.preventDefault();if(!unlocked)return;state.children[0].name=$('name0').value.trim()||'9さい';state.children[1].name=$('name1').value.trim()||'6さい';for(let i=0;i<2;i++)state.children[i].theme=$('theme'+i).value;state.tasks=[...state.tasks.filter(t=>t.owner!==selected),...draft.filter(t=>t.title.trim()).map(t=>({...t,title:t.title.trim(),emoji:t.emoji||'⭐',owner:selected}))];state.reward=$('rewardInput').value.trim()||'ごほうび';state.cost=Math.max(1,Math.min(999,Number($('cost').value)||10));save();render();$('parent').close();};
$('exchange').onclick=()=>{if(!unlocked||state.children[selected].stars<state.cost)return;if(confirm(`「${state.reward}」と交換して、星${state.cost}個を使いますか？`)){state.children[selected].stars-=state.cost;save();render();exchangeInfo();}};
$('export').onclick=()=>{if(!unlocked)return;const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`dekita-${day()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{if(!unlocked)return;const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error();const data=JSON.parse(await file.text());if(!valid(data))throw Error();if(confirm('現在の記録を保存ファイルの内容で置き換えますか？')){state=migrate(data);save();render();$('parent').close();}}catch(err){alert('保存ファイルを読めませんでした。正しいバックアップを選んでください。');}e.target.value='';};
setInterval(render,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{const data=JSON.parse(e.newValue);if(valid(data)){state=migrate(data);$('parent').close();render();}}catch(err){}}});
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>{function offer(w){pendingWorker=w;$('update').hidden=false;}if(reg.waiting)offer(reg.waiting);reg.addEventListener('updatefound',()=>{const w=reg.installing;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)offer(w);});});}).catch(()=>{$('notice').textContent='オフラインの準備ができませんでした。通信できる状態でお使いください。';});let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload();}});}
$('update').onclick=()=>pendingWorker?.postMessage('activate');
render();
save();
