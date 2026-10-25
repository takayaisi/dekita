'use strict';
const $=id=>document.getElementById(id), KEY='dekita.family.v1';
const uid=()=>crypto.randomUUID();
const initial=()=>({version:1,pin:null,children:[{name:'9さい',stars:0,days:{}},{name:'6さい',stars:0,days:{}}],tasks:[{id:uid(),emoji:'🪥',title:'はみがき'},{id:uid(),emoji:'👕',title:'おきがえ'},{id:uid(),emoji:'🧸',title:'おかたづけ'}],reward:'すきなおやつ',cost:10});
function valid(s){return s&&s.version===1&&(s.pin===null||typeof s.pin==='string')&&Array.isArray(s.children)&&s.children.length===2&&s.children.every(c=>typeof c.name==='string'&&Number.isSafeInteger(c.stars)&&c.stars>=0&&(c.debt===undefined||(Number.isSafeInteger(c.debt)&&c.debt>=0))&&(c.theme===undefined||['magic','space'].includes(c.theme))&&(c.snapshots===undefined||(c.snapshots&&typeof c.snapshots==='object'&&!Array.isArray(c.snapshots)&&Object.values(c.snapshots).every(ts=>Array.isArray(ts)&&ts.length<=30&&ts.every(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&typeof t.emoji==='string'))))&&(c.notes===undefined||(c.notes&&typeof c.notes==='object'&&!Array.isArray(c.notes)&&Object.entries(c.notes).every(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&typeof v==='string'&&v.length<=200)))&&(c.drawings===undefined||(c.drawings&&typeof c.drawings==='object'&&!Array.isArray(c.drawings)&&Object.values(c.drawings).every(lines=>Array.isArray(lines)&&lines.flat().length<=3000&&lines.every(line=>Array.isArray(line)&&line.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=600))))))&&(c.pokemon===undefined||(c.pokemon&&typeof c.pokemon==='object'&&!Array.isArray(c.pokemon)&&Object.entries(c.pokemon).every(([d,id])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isInteger(id)&&id>=1&&id<=151)))&&c.days&&typeof c.days==='object'&&!Array.isArray(c.days)&&Object.values(c.days).every(d=>Array.isArray(d)&&d.every(x=>typeof x==='string')))&&(s.schoolHolidays===undefined||(Array.isArray(s.schoolHolidays)&&s.schoolHolidays.every(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d))))&&Array.isArray(s.tasks)&&s.tasks.length<=60&&s.tasks.every(t=>typeof t.id==='string'&&typeof t.title==='string'&&typeof t.emoji==='string'&&(t.owner===undefined||t.owner===0||t.owner===1))&&new Set(s.tasks.map(t=>t.id)).size===s.tasks.length&&typeof s.reward==='string'&&Number.isInteger(s.cost)&&s.cost>=1&&s.cost<=999;}
const eightTasks=[['👕','あさ おきてすぐ おきがえ'],['🪥','はみがき'],['🎹','ピアノの れんしゅう'],['📚','しゅくだい'],['🧸','おかたづけ']];
function addYoungerPiano(data){
 if(!data.schoolTimeRevision){
  for(let owner=0;owner<2;owner++){
   const task={id:uid(),title:'じかんどおりに がっこうに いけた',emoji:'🏫',owner,weekdaysOnly:true};data.tasks.push(task);
   const snapshot=data.children[owner].snapshots?.[day()];if(snapshot&&schoolDay(day(),data))snapshot.push(structuredClone(task));
  }
  data.schoolTimeRevision=1;
 }

 if(!data.familyMealRevision){
  for(let owner=0;owner<2;owner++)if(!data.tasks.some(t=>t.owner===owner&&t.title.includes('ごはん'))){
   const task={id:uid(),title:'ごはんを のこさず たべる',emoji:'🍚',owner};data.tasks.push(task);
   const snapshot=data.children[owner].snapshots?.[day()];if(snapshot)snapshot.push(structuredClone(task));
  }
  data.familyMealRevision=1;
 }

 if(!data.youngerBedtimeRevision){
  if(!data.tasks.some(t=>t.owner===1&&t.title.includes('おしっこ'))){
   const task={id:uid(),title:'ねるまえに おしっこ',emoji:'🚽',owner:1};data.tasks.push(task);
   const snapshot=data.children[1].snapshots?.[day()];if(snapshot)snapshot.push(structuredClone(task));
  }
  data.youngerBedtimeRevision=1;
 }
 if(data.youngerPianoRevision)return;
 if(!data.tasks.some(t=>t.owner===1&&t.title.includes('ピアノ'))){const task={id:uid(),title:'ピアノの れんしゅう',emoji:'🎹',owner:1};data.tasks.push(task);const snapshot=data.children[1].snapshots?.[day()];if(snapshot)snapshot.push(structuredClone(task));}
 data.youngerPianoRevision=1;
}
function migrate(data){
 if(!data.profileRevision){
  if(data.children[0].name==='8さい')data.children[0].name='9さい';
  if(data.children[1].name==='5さい')data.children[1].name='6さい';
  data.children[0].theme='magic';data.children[1].theme='space';
  data.profileRevision=1;
 }

 if(data.taskRevision===2){addYoungerPiano(data);return data;}
 const old=data.tasks;
 data.tasks=old.map(t=>({...t,owner:1}));
 for(const [emoji,title] of eightTasks){
   const match=old.find(t=>t.emoji===emoji);
   data.tasks.push({id:match?match.id+'-older':uid(),emoji,title,owner:0});
   if(match)for(const checked of Object.values(data.children[0].days))if(checked.includes(match.id))checked.push(match.id+'-older');
 }
 data.taskRevision=2;
 addYoungerPiano(data);
 return data;
}
function schoolDay(date,data=state){const weekday=dateObject(date).getDay();return weekday!==0&&weekday!==6&&!data.schoolHolidays?.includes(date);}
function scheduledTasks(owner,date){return state.tasks.filter(t=>t.owner===owner&&(!t.weekdaysOnly||schoolDay(date)));}
function tasksOn(owner,date){const c=state.children[owner];return date<=day()&&c.snapshots?.[date]?c.snapshots[date]:scheduledTasks(owner,date);}
function tasksFor(){return tasksOn(selected,viewDay());}
let selectedDay=null;
function viewDay(){return selectedDay||day();}
function dateObject(key){const [y,m,d]=key.split('-').map(Number);return new Date(y,m-1,d,12);}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function shiftDay(amount){const d=dateObject(viewDay());d.setDate(d.getDate()+amount);selectedDay=dateKey(d);render();}
function snapshotToday(){for(let i=0;i<2;i++){const c=state.children[i];c.snapshots||={};if(!c.snapshots[day()])c.snapshots[day()]=structuredClone(scheduledTasks(i,day()));}}
function renderCalendar(){
 const key=viewDay(),date=dateObject(key),c=state.children[selected],today=day();
 $('dayPicker').value=key;$('monthTitle').textContent=date.toLocaleDateString('ja-JP',{year:'numeric',month:'long'});
 const start=new Date(date.getFullYear(),date.getMonth(),1,12),end=new Date(date.getFullYear(),date.getMonth()+1,0,12);
 const cells=[];for(const label of ['日','月','火','水','木','金','土']){const el=document.createElement('span');el.className='weekday';el.textContent=label;cells.push(el);}
 for(let i=0;i<start.getDay();i++){const el=document.createElement('span');el.setAttribute('aria-hidden','true');cells.push(el);}
 for(let n=1;n<=end.getDate();n++){
  const d=new Date(date.getFullYear(),date.getMonth(),n,12),k=dateKey(d),ids=c.days[k]||[];
  const tasks=tasksOn(selected,k),count=tasks.filter(t=>ids.includes(t.id)).length;
  const full=tasks.length>0&&count===tasks.length,known=!!c.snapshots?.[k]||Object.hasOwn(c.days,k);
  const mark=k>today?'・':full?'🌟':count?'🌱':known?'○':'－';
  const b=button(`${n}\n${mark}`,()=>{selectedDay=k===today?null:k;render();},'calendar-day');b.setAttribute('aria-label',`${n}日、${k>today?'予定':full?'全部できた':count?count+'個できた':known?'チェックなし':'記録なし'}`);b.setAttribute('aria-pressed',String(k===key));if(k===today)b.classList.add('is-today');cells.push(b);
 }
 $('calendarGrid').replaceChildren(...cells);
 $('dayNote').textContent=key>today?'これからの よてい（いまの設定を表示）':key<today?((c.snapshots?.[key]||Object.hasOwn(c.days,key))?'この日の きろく。チェックは きょうだけ かえられるよ。':'この日の記録はありません。現在のやることを参考表示しています。'):'できたら タップ！ まちがえたら もういちど。';
 $('taskHeading').textContent=key>today?'この日の よてい':key<today?'この日の きろく':'きょうの やること';
}

function storeReflection(text,date=viewDay()){
 if(date!==day()||viewDay()!==day())return false;
 const c=state.children[selected];c.notes||={};
 if(text.length)c.notes[date]=text.slice(0,200);else delete c.notes[date];
 const saved=save();if(typeof $('historyList')?.replaceChildren==='function')renderHistory();return saved;
}
function renderReflection(){
 const section=$('reflection'),input=$('reflectionText'),date=viewDay(),editable=date===day();
 section.hidden=false;
 const context=selected+':'+date,changed=input.dataset.context!==context;
 if(changed||document.activeElement!==input){input.value=state.children[selected].notes?.[date]||'';input.dataset.context=context;}
 input.readOnly=!editable;input.disabled=date>day();
 input.placeholder=date>day()?'この日になったら、ひとことを かこう。':date<day()?'この日の ひとことは まだありません。':'たのしかったこと、がんばったこと… なんでも かいてね。';
 $('reflectionTitle').textContent=editable?'きょうは どんな いちにちだった？':'この日の ひとこと';
 $('reflectionHelp').textContent=editable?'すきな にゅうりょくほうほうを えらぼう。':date>day()?'みらいの ひとことは、まだ かけないよ。':'この日に かいたことを よみかえせるよ。';
 if(typeof renderInputTools==='function')renderInputTools();
 $('reflectionCount').textContent=input.value.length+' / 200';
 if(changed)$('reflectionStatus').textContent=editable?(input.value?'保存したひとこと':'') : '';
}
function renderHistory(){
 const c=state.children[selected],all=$('historyAll').checked;
 const keys=[...new Set([...Object.keys(c.days),...Object.keys(c.snapshots||{}),...Object.keys(c.notes||{}),...Object.keys(c.drawings||{})])].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d<=day()).sort().reverse();
 const dates=all?keys:keys.slice(0,30);
 $('historyTitle').textContent=c.name+'の まいにちの きろく';
 const host=$('historyList');host.replaceChildren();
 if(!dates.length){host.textContent='きろくは これから ふえていくよ。';return;}
 const taskMap=new Map(state.tasks.filter(t=>t.owner===selected).map(t=>[t.id,t]));
 for(const d of dates)for(const t of c.snapshots?.[d]||[])if(!taskMap.has(t.id))taskMap.set(t.id,t);
 const columns=[...taskMap.values()];
 const hint=document.createElement('p');hint.className='history-legend';hint.textContent='○ できた　× まだ　— その日の対象外・記録なし。表は左右に動かせます。';
 const wrap=document.createElement('div');wrap.className='history-table-wrap';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','日別の達成一覧表。左右にスクロールできます');
 const table=document.createElement('table');table.className='history-table';const caption=document.createElement('caption');caption.textContent=c.name+'の 日べつチェックと ひとこと';table.append(caption);
 const head=document.createElement('thead'),header=document.createElement('tr');
 for(const label of ['ひづけ',...columns.map(t=>t.emoji+' '+t.title),'できた かず','🎁 おたから','📖 その日の ひとこと']){const cell=document.createElement('th');cell.scope='col';cell.textContent=label;header.append(cell);}head.append(header);table.append(head);
 const body=document.createElement('tbody');
 for(const d of dates){
  const row=document.createElement('tr'),dateCell=document.createElement('th');dateCell.scope='row';dateCell.append(button(dateObject(d).toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'short'}),()=>{selectedDay=d===day()?null:d;switchView('today');}));row.append(dateCell);
  const known=!!c.snapshots?.[d]||Object.hasOwn(c.days,d),tasks=tasksOn(selected,d),ids=c.days[d]||[];
  for(const t of columns){const included=known&&tasks.some(x=>x.id===t.id),yes=included&&ids.includes(t.id),cell=document.createElement('td');cell.textContent=included?(yes?'○':'×'):'—';cell.className='result '+(included?(yes?'yes':'no'):'na');cell.setAttribute('aria-label',t.title+'：'+(included?(yes?'できた':'まだ'):'対象外または記録なし'));row.append(cell);}
  const count=document.createElement('td');count.textContent=known?tasks.filter(t=>ids.includes(t.id)).length+' / '+tasks.length:'—';row.append(count);
  const treasureCell=document.createElement('td'),earned=dailyPokemon(selected,d);if(earned){const img=document.createElement('img');img.src=earned.image;img.alt='';img.className='history-pokemon';const name=document.createElement('span');name.textContent=earned.name;treasureCell.append(img,name);}else treasureCell.textContent='—';row.append(treasureCell);
  {const note=document.createElement('td');note.className='table-note';note.textContent=c.notes?.[d]||'—';row.append(note);}body.append(row);
 }
 table.append(body);wrap.append(table);host.append(hint,wrap);
}
function dailyPokemon(childIndex,date,draw=false){
 const child=state.children[childIndex],pool=typeof POKEMON_TREASURES==='undefined'?[]:POKEMON_TREASURES;
 let id=child.pokemon?.[date];
 if(!id&&draw&&date<=day()){
  const tasks=tasksOn(childIndex,date),done=child.days[date]||[];
  if(!pool.length||!tasks.length||tasks.filter(t=>done.includes(t.id)).length<Math.min(3,tasks.length))return null;
  id=pool[Math.floor(Math.random()*pool.length)].id;child.pokemon||={};child.pokemon[date]=id;save();
 }
 return pool.find(p=>p.id===id)||null;
}
function showTreasure(reward=false){
 const pokemon=reward?null:dailyPokemon(selected,viewDay(),true);if(!reward&&!pokemon)return;
 render();let modal=$('treasureModal');if(!modal){modal=document.createElement('dialog');modal.id='treasureModal';document.body.append(modal);}
 modal.replaceChildren();modal.className=reward?'':'pokemon-reveal';const box=document.createElement('div');box.className='treasure-party';
 const heading=document.createElement('h2');heading.textContent=reward?'🎉 ごほうびと こうかん！':'✨ だれが でてくるかな？ ✨';
 const chest=document.createElement('div');chest.className='opening-chest';chest.textContent='🎁';
 const burst=document.createElement('div');burst.className='pokemon-burst';burst.setAttribute('aria-hidden','true');
 const item=document.createElement('div');item.className='treasure-prize';
 if(pokemon){const img=document.createElement('img');img.src=pokemon.image;img.alt=pokemon.name;img.className='pokemon-art';item.append(img);}else item.textContent='🏆';
 const caption=document.createElement('p');caption.className='prize-caption';caption.textContent=reward?state.reward:pokemon.name+' が あらわれた！';
 const encouragement=document.createElement('p');encouragement.textContent=reward?'おうちのひとから ごほうびを もらおう！':'３つ できたね！ このポケモンが きょうの おたから！';
 const credit=document.createElement('small');credit.className='pokemon-credit';credit.textContent='ポケモン画像・名前：PokéAPI / Pokémon ©各権利者';
 box.append(heading,chest,burst,item,caption,encouragement,button('やったー！',()=>modal.close(),'primary'));if(pokemon)box.append(credit);modal.append(box);modal.showModal();celebrate(true);playSound('all');
}
function celebrate(all){
 const tray=document.createElement('div');tray.className='celebration';tray.setAttribute('aria-hidden','true');
 for(let i=0;i<(all?22:7);i++){const star=document.createElement('span');star.textContent=all?(state.children[selected].theme==='space'?['🚀','🪐','⭐','☄️']:['🌸','🦋','✨','🌈'])[i%4]:(state.children[selected].theme==='space'?'⭐':'🌸');star.style.left=(5+Math.random()*90)+'%';star.style.animationDelay=(Math.random()*.4)+'s';tray.append(star);}
 document.body.append(tray);setTimeout(()=>tray.remove(),2400);
}
let state,selected=0,unlocked=false,draft=[],pendingWorker;
let currentView='today';
function switchView(view){currentView=view;document.querySelector('main').dataset.view=view;document.querySelector('.history-panel').hidden=view!=='history';$('todayView').setAttribute('aria-pressed',String(view==='today'));$('historyView').setAttribute('aria-pressed',String(view==='history'));render();window.scrollTo({top:0,behavior:'smooth'});}
try{let raw=localStorage.getItem(KEY);state=raw?JSON.parse(raw):initial();if(!valid(state))throw Error('invalid');}catch(e){state=initial();$('notice').textContent='保存された記録を読めませんでした。バックアップがある場合は設定から復元してください。';}
state=migrate(state);state.pin=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){$('notice').textContent='記録を保存できません。ブラウザの保存設定を確認し、バックアップしてください。';return false;}}
function day(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function button(text,fn,cls){const b=document.createElement('button');b.type='button';b.textContent=text;if(cls)b.className=cls;b.onclick=fn;return b;}
function render(){const tasks=tasksFor(),child=state.children[selected],done=child.days[viewDay()]||[],count=tasks.filter(t=>done.includes(t.id)).length;document.body.dataset.theme=child.theme||'magic';document.querySelector('.garden').setAttribute('aria-label',child.theme==='space'?'ぼうけんの うちゅう':'まほうの おにわ');document.querySelector('.flower').textContent=child.theme==='space'?'✨ 🪐 ✨':'🌷 🌸 🌷';$('profiles').replaceChildren(...state.children.map((c,i)=>{const b=button(`${c.theme==='space'?'🚀':'🦄'} ${c.name}`,()=>{selected=i;render();});b.setAttribute('aria-pressed',String(i===selected));return b;}));snapshotToday();renderCalendar();renderReflection();renderHistory();$('date').textContent=dateObject(viewDay()).toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'long'});$('greeting').textContent=`${child.name}の ${viewDay()===day()?'きょう':viewDay()>day()?'よてい':'きろく'}`;$('balance').textContent=`⭐ ${child.stars} こ`;$('tree').textContent=child.theme==='space'?(child.stars>=20?'🛸':child.stars>=5?'🚀':'🌍'):(child.stars>=20?'🏰':child.stars>=5?'🦄':'🌸');$('progressText').textContent=`${count} / ${tasks.length} できた`;$('progress').max=Math.max(1,tasks.length);$('progress').value=count;$('progress').setAttribute('aria-label','今日のできた数');$('tasks').replaceChildren(...tasks.map(t=>{const yes=done.includes(t.id),b=button('',()=>complete(t.id),'task'+(yes?' done':''));for(const [cls,text]of [['emoji',t.emoji],['title',t.title],['check',yes?'✓':'']]){const span=document.createElement('span');span.className=cls;span.textContent=text;b.append(span);}b.disabled=viewDay()!==day();b.setAttribute('aria-pressed',String(yes));b.setAttribute('aria-label',`${t.title}、${viewDay()!==day()?(yes?'できた':'チェックなし'):yes?'できた。もういちど押すと取り消し':'タップでできた'}`);return b;}));$('cheer').textContent=count&&count===tasks.length?'🎉 ぜんぶ できたね！ はなまる！':tasks.length?'ひとつずつ、じぶんのペースで。':'おうちのひとに やることを いれてもらおう';let treasure=$('dailyTreasure');if(!treasure){treasure=document.createElement('div');treasure.id='dailyTreasure';treasure.className='daily-treasure';$('cheer').after(treasure);}
 const completeToday=tasks.length>0&&count===tasks.length;
 const pokemon=dailyPokemon(selected,viewDay());
 const treasureReady=viewDay()<=day()&&(!!pokemon||(tasks.length>0&&count>=Math.min(3,tasks.length)));
 const medals=Object.values(child.days).filter(ids=>tasks.length&&tasks.every(t=>ids.includes(t.id))).length;
 treasure.replaceChildren();const gift=document.createElement('div');gift.className='treasure-icon';if(pokemon){const img=document.createElement('img');img.src=pokemon.image;img.alt=pokemon.name;img.className='treasure-thumb';gift.append(img);}else gift.textContent='🎁';const title=document.createElement('strong');title.textContent=viewDay()>day()?'この日も おたからを めざそう！':treasureReady?(pokemon?pokemon.name+' を ゲット！':'ポケモンの たからばこ！'):'３つ できたら ポケモンゲット！';const note=document.createElement('p');note.textContent=completeToday?`はなまる ${medals}にち！ あしたは なにが でるかな？`:'151しゅるいから ランダム！ なにが でるかな？';treasure.append(gift,title,note);const open=button(treasureReady?'🎁 おたからを ひらく':'あと '+Math.max(0,Math.min(3,tasks.length)-count)+' こで オープン！',()=>showTreasure());open.disabled=!treasureReady;open.className='open-treasure';treasure.append(open);
 $('rewardTitle').textContent=state.reward;$('rewardStatus').textContent=child.stars>=state.cost?'⭐ こうかんできるよ！ おうちのひとに みせよう':`あと ⭐ ${state.cost-child.stars} こで ごほうび！`;}
let audioContext;
let kanaSoundIndex=0;
function playSound(kind){
 if(state.soundEnabled===false)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  audioContext||=new Audio();
  const ctx=audioContext;
  const play=()=>{
   const magic=state.children[selected].theme!=='space';
   const kanaNotes=[784,1046.5,880,1318.51,987.77,1174.66,1567.98,1396.91];
   const notes=kind==='kana'?[kanaNotes[(kanaSoundIndex++)%kanaNotes.length]]:kind==='undo'?[783.99,659.25]:kind==='all'?(magic?[783.99,987.77,1174.66,987.77,1567.98]:[659.25,783.99,987.77,1174.66,1318.51]):(magic?[1046.5,1318.51,1567.98]:[987.77,1174.66,1479.98]);
   const start=ctx.currentTime+.02;
   notes.forEach((frequency,i)=>{
    const t=start+i*(kind==='all'?.17:.11),duration=kind==='kana'?.24:kind==='undo'?.22:.52;
    // Rounded bell tone with a quiet octave shimmer and a soft, fading echo.
    for(const [ratio,volume,delay] of [[1,.033,0],[2,.006,0],[1,.006,.085]]){
     const osc=ctx.createOscillator(),gain=ctx.createGain(),at=t+delay;
     osc.type='sine';osc.frequency.setValueAtTime(frequency*ratio,at);
     gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
     osc.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+duration+.02);
    }
   });
  };
  if(ctx.state==='suspended')ctx.resume().then(play).catch(()=>{});else play();
 }catch(error){/* Audio support must not affect saving a check. */}
}
function renderSound(){const enabled=state.soundEnabled!==false;$('soundToggle').textContent=enabled?'🔊 音':'🔇 音';$('soundToggle').setAttribute('aria-pressed',String(enabled));$('soundToggle').setAttribute('aria-label',enabled?'音をオフにする':'音をオンにする');}
function complete(id){
 if(viewDay()!==day())return;
 snapshotToday();
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
 if(checked){$('cheer').textContent='チェックを とりけしたよ。まちがえても だいじょうぶ！';playSound('undo');}
 else {const all=tasks.length>0&&tasks.every(t=>c.days[d].includes(t.id));const ready=tasks.filter(t=>c.days[d].includes(t.id)).length>=Math.min(3,tasks.length);if(ready&&!c.pokemon?.[d])showTreasure();else {celebrate(all);playSound(all?'all':'check');}}
}
$('settings').onclick=()=>{unlocked=true;$('editor').hidden=false;fillEditor();$('parent').showModal();};
$('close').onclick=()=>$('parent').close();
$('parent').addEventListener('close',()=>{unlocked=false;});
function renderSchoolHoliday(){
 let label=$('schoolHolidayLabel');if(!label){label=document.createElement('label');label.id='schoolHolidayLabel';const input=document.createElement('input');input.type='checkbox';input.id='schoolHoliday';input.onchange=()=>{state.schoolHolidays||=[];state.schoolHolidays=state.schoolHolidays.filter(d=>d!==day());if(input.checked)state.schoolHolidays.push(day());for(let i=0;i<2;i++)state.children[i].snapshots[day()]=structuredClone(scheduledTasks(i,day()));save();render();};label.append(input,document.createTextNode(' きょうは がっこう おやすみ（２人とも）'));$('taskEditor').after(label);}
 $('schoolHoliday').checked=!!state.schoolHolidays?.includes(day());
}
function fillEditor(){renderSchoolHoliday();draft=structuredClone(state.tasks.filter(t=>t.owner===selected));$('name0').value=state.children[0].name;$('name1').value=state.children[1].name;$('rewardInput').value=state.reward;$('cost').value=state.cost;for(let i=0;i<2;i++)$('theme'+i).value=state.children[i].theme;renderEditor();exchangeInfo();$('taskEditor').previousElementSibling.textContent=state.children[selected].name+'の 毎日やること';}
function exchangeInfo(){$('exchangeInfo').textContent=`${state.children[selected].name}：星${state.children[selected].stars}個${state.children[selected].debt?'（取消分の調整：あと'+state.children[selected].debt+'個）':''} ／ 「${state.reward}」に${state.cost}個`;$('exchange').disabled=state.children[selected].stars<state.cost;}
function renderEditor(){$('taskEditor').replaceChildren(...draft.map(t=>{const row=document.createElement('div');row.className='edit-row';for(const prop of ['emoji','title']){const input=document.createElement('input');input.value=t[prop];input.maxLength=prop==='emoji'?12:40;input.setAttribute('aria-label',prop==='emoji'?'絵文字':'やること');input.oninput=()=>t[prop]=input.value;row.append(input);}row.append(button('削除',()=>{draft=draft.filter(x=>x.id!==t.id);renderEditor();}));return row;}));$('addTask').disabled=draft.length>=30;}
$('addTask').onclick=()=>{if(draft.length<30){draft.push({id:uid(),title:'',emoji:'⭐'});renderEditor();}};
$('parentForm').onsubmit=e=>{e.preventDefault();if(!unlocked)return;state.children[0].name=$('name0').value.trim()||'9さい';state.children[1].name=$('name1').value.trim()||'6さい';for(let i=0;i<2;i++)state.children[i].theme=$('theme'+i).value;state.tasks=[...state.tasks.filter(t=>t.owner!==selected),...draft.filter(t=>t.title.trim()).map(t=>({...t,title:t.title.trim(),emoji:t.emoji||'⭐',owner:selected}))];state.reward=$('rewardInput').value.trim()||'ごほうび';state.cost=Math.max(1,Math.min(999,Number($('cost').value)||10));state.children[selected].snapshots[day()]=structuredClone(scheduledTasks(selected,day()));save();render();$('parent').close();};
$('exchange').onclick=()=>{if(!unlocked||state.children[selected].stars<state.cost)return;if(confirm(`「${state.reward}」と交換して、星${state.cost}個を使いますか？`)){state.children[selected].stars-=state.cost;save();render();exchangeInfo();$('parent').close();showTreasure(true);}};
$('export').onclick=()=>{if(!unlocked)return;const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`dekita-${day()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{if(!unlocked)return;const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error();const data=JSON.parse(await file.text());if(!valid(data))throw Error();if(confirm('現在の記録を保存ファイルの内容で置き換えますか？')){state=migrate(data);save();render();$('parent').close();}}catch(err){alert('保存ファイルを読めませんでした。正しいバックアップを選んでください。');}e.target.value='';};
setInterval(render,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
window.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue){try{const data=JSON.parse(e.newValue);if(valid(data)){state=migrate(data);$('parent').close();render();}}catch(err){}}});
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>{function offer(w){pendingWorker=w;$('update').hidden=false;}if(reg.waiting)offer(reg.waiting);reg.addEventListener('updatefound',()=>{const w=reg.installing;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)offer(w);});});}).catch(()=>{$('notice').textContent='オフラインの準備ができませんでした。通信できる状態でお使いください。';});let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload();}});}
$('reflectionText').oninput=e=>{const input=e.target;if(input.dataset.context!==selected+':'+day()||selected===1||viewDay()!==day()){renderReflection();return;}const ok=storeReflection(input.value);$('reflectionCount').textContent=input.value.length+' / 200';$('reflectionStatus').textContent=ok?'ほぞんしたよ ✓':'保存できません。文章をコピーして残してください。';};
$('prevDay').onclick=()=>shiftDay(-1);$('nextDay').onclick=()=>shiftDay(1);$('todayButton').onclick=()=>{selectedDay=null;render();};$('dayPicker').onchange=e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){selectedDay=e.target.value===day()?null:e.target.value;render();}};
$('update').onclick=()=>pendingWorker?.postMessage('activate');
$('historyAll').onchange=renderHistory;$('todayView').onclick=()=>switchView('today');$('historyView').onclick=()=>switchView('history');$('backToday').onclick=()=>switchView('today');
$('refreshApp').onclick=async()=>{
 if(!save())return;
 const button=$('refreshApp');button.disabled=true;button.textContent='更新中…';
 try{
  if('serviceWorker'in navigator){
   const registration=await navigator.serviceWorker.getRegistration();
   if(registration){
    await Promise.race([registration.update(),new Promise(resolve=>setTimeout(resolve,4000))]);
    if(registration.waiting){registration.waiting.postMessage('activate');return;}
    if(registration.installing){
     const worker=registration.installing;
     await Promise.race([new Promise(resolve=>{
      const check=()=>{if(worker.state==='installed'||worker.state==='redundant')resolve();};
      worker.addEventListener('statechange',check);check();
     }),new Promise(resolve=>setTimeout(resolve,4000))]);
     if(registration.waiting){registration.waiting.postMessage('activate');return;}
    }
   }
  }
 }catch(error){/* Offline refresh still loads the stored application. */}
 const url=new URL(location.href);url.searchParams.set('refresh',String(Date.now()));location.replace(url.href);
};
$('soundToggle').onclick=()=>{state.soundEnabled=state.soundEnabled===false;save();renderSound();if(state.soundEnabled)playSound('check');};
renderSound();
render();
save();
