'use strict';
const cv=document.getElementById('game'),ctx=cv.getContext('2d'),ui=document.getElementById('ui'),statusEl=document.getElementById('status'),liveEl=document.getElementById('live');
const scene=GAME_DATA.scene,sprites=GAME_DATA.sprites,cfg=GAME_CONFIG,images={},prepared={};
const engine=new BeetleEngine(cfg,scene,sprites);let skyClock=0,last=null,acc=0,queuedPunch=false,best=0,lastState=null,lastLives=-1,lastScore=-1,skyTick=-1,skyFrame=null;
const keys=new Set(),touch=new Map();let ready=false,runId=null,runRecorded=false;
const mobileControls=document.getElementById('mobile-controls'),nameForm=document.getElementById('name-form'),nameInput=document.getElementById('record-name'),nameScore=document.getElementById('name-score'),nameError=document.getElementById('name-error');
// Suppress native selection/long-press menus without affecting the record input.
for(const surface of [document.getElementById('stage'),mobileControls]){
  for(const type of ['contextmenu','selectstart','dragstart'])surface.addEventListener(type,e=>e.preventDefault());
}
const touchMedia=matchMedia('(any-pointer: coarse)');
const mobile=()=>touchMedia.matches||navigator.maxTouchPoints>0;
touchMedia.addEventListener('change',()=>{if(ready){clearInput();lastState=null;syncUI();}});
engine.onSound=name=>audio.play(name);
let runBest=0;
function syncAudio(){audioToggle.hidden=!ready||!AUDIO_CONFIG.enabled;audioToggle.setAttribute('aria-pressed',String(audio.enabled));audioToggle.setAttribute('aria-label',audio.enabled?'Выключить звук':'Включить звук');audioToggle.title=audio.enabled?'ЗВУК: ВКЛ':'ЗВУК: ВЫКЛ';}
function toggleAudio(){audio.setEnabled(!audio.enabled);syncAudio();if(audio.enabled)audio.play('menu');}
audioToggle.addEventListener('click',()=>{toggleAudio();audioToggle.blur();});
const fullscreenToggle=document.getElementById('fullscreen-toggle');
const fullscreenRoot=document.documentElement;
const fullscreenActive=()=>Boolean(document.fullscreenElement||document.webkitFullscreenElement);
const fullscreenRequest=fullscreenRoot.requestFullscreen||fullscreenRoot.webkitRequestFullscreen;
const fullscreenExit=document.exitFullscreen||document.webkitExitFullscreen;
function showFullscreenHint(){const msg='Браузер не разрешает полноэкранный режим.';liveEl.textContent=msg;if(window.self!==window.top){if(window.confirm(msg+' Открыть игру отдельно?'))window.open('https://eznzz.github.io/pixelgame-beetlepunch/','_blank','noopener');}else window.alert(msg+' На iPhone можно добавить игру на экран Домой через меню Поделиться.');}
function syncFullscreen(){const active=fullscreenActive();fullscreenToggle.hidden=!ready;fullscreenToggle.setAttribute('aria-pressed',String(active));fullscreenToggle.setAttribute('aria-label',active?'Выйти из полноэкранного режима':'Полноэкранный режим');fullscreenToggle.title=fullscreenToggle.getAttribute('aria-label');}
fullscreenToggle.addEventListener('click',async()=>{try{clearInput();if(fullscreenActive()){if(fullscreenExit)await fullscreenExit.call(document);}else if(fullscreenRequest&&(document.fullscreenEnabled||document.webkitFullscreenEnabled)){await fullscreenRequest.call(fullscreenRoot);}else{showFullscreenHint();}}catch(e){showFullscreenHint();console.warn(e);}finally{fullscreenToggle.blur();syncFullscreen();}});
for(const ev of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(ev,()=>{clearInput();syncFullscreen();});

const helpScreen=document.getElementById('help-screen'),helpControls=document.getElementById('help-controls'),helpBack=document.getElementById('help-back');
const helpGlyphs = {
 A:'0E11111F111111',B:'1E11111E11111E',C:'0F10101010100F',D:'1E11111111111E',E:'1F10101E10101F',F:'1F10101E101010',G:'0F10101711110F',H:'1111111F111111',I:'0E04040404040E',J:'0702020212120C',K:'11121418141211',L:'1010101010101F',M:'111B1515111111',N:'11191513111111',O:'0E11111111110E',P:'1E11111E101010',Q:'0E11111115120D',R:'1E11111E141211',S:'0F10100E01011E',T:'1F040404040404',U:'1111111111110E',V:'11111111110A04',W:'11111115151B11',X:'11110A040A1111',Y:'11110A04040404',Z:'1F01020408101F',
 '0':'0E11131519110E','1':'040C040404040E','2':'0E11010204081F','3':'1E01010601011E','4':'02060A121F0202','5':'1F10101E01011E','6':'0E10101E11110E','7':'1F010204080808','8':'0E11110E11110E','9':'0E11110F01010E',
 'Б':'1F10101E11111E','Г':'1F101010101010','Д':'060A0A1212121F','Ж':'15150E040E1515','З':'1E01010601011E','И':'11111315191111','Й':'0A041113151911','Л':'07090911111111','П':'1F111111111111','У':'1111110F01011E','Ф':'040E1515150E04','Ц':'1111111111111F','Ч':'1111110F010101','Ш':'1515151515151F','Щ':'15151515151F01','Ъ':'1810080E09090E','Ы':'1111111D13131D','Ь':'1010101E11111E','Э':'1E01010701011E','Ю':'1215151D151512','Я':'0F11110F050911','Ё':'0A001F101E101F',
 '.':'00000000000C0C',',':'00000000000C08',':':'000C0C000C0C00','!':'04040404040004','?':'0E110102040004','-':'0000001F000000','—':'0000001F000000','/':'01010204081010','(':'02040808080402',')':'08040202020408','«':'0000050A140A05','»':'0000140A050A14',"'":'04040800000000','"':'0A0A0000000000'
};
const helpGlyphAliases={'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'P','С':'C','Т':'T','Х':'X'};
function helpPixelText(el,value){
 const text=String(value);el.replaceChildren();const sr=document.createElement('span');sr.className='pixel-sr';sr.textContent=text;el.append(sr);
 const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');el.append(visual);
 for(const word of text.toUpperCase().split(/(\s+)/)){
  if(!word)continue;if(/^\s+$/.test(word)){visual.append(document.createTextNode(' '));continue;}
  const span=document.createElement('span');span.className='pixel-word';visual.append(span);
  for(const ch of word){const bits=helpGlyphs[helpGlyphAliases[ch]||ch];if(!bits){span.append(document.createTextNode(ch));continue;}
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 6 7');svg.setAttribute('class','pixel-glyph');
   const path=document.createElementNS(svg.namespaceURI,'path');let d='';for(let y=0;y<7;y++){const n=parseInt(bits.slice(y*2,y*2+2),16);for(let x=0;x<5;x++)if(n&(16>>x))d+=`M${x} ${y}h1v1h-1z`;}
   path.setAttribute('d',d);svg.append(path);span.append(svg);
  }
 }
}

// Loading lettering is static SVG, present before any scripts run.
for(const el of helpScreen.querySelectorAll("h1,p:not(#help-controls),button"))helpPixelText(el,el.textContent);
function showHelp(){engine.state='help';clearInput();syncUI();helpBack.focus({preventScroll:true});}
helpBack.addEventListener('click',()=>{audio.play('menu');title();});
const records=new BeetleRecords(recordStorage, null,()=>{if(ready&&['over','records'].includes(engine.state))liveEl.textContent=`Таблица рекордов: ${records.rows.map((r,i)=>`${i+1}: ${r.score}`).join(', ')}`;});
function recordId(){return (globalThis.crypto?.randomUUID?.()||('run-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));}
function saveRun(name){if(engine.state!=='over'||runRecorded||!runId)return;runRecorded=true;nameForm.hidden=true;nameInput.blur();records.finish({id:runId,name,score:engine.score,date:new Date().toISOString()});lastState=null;syncUI();}
nameForm.addEventListener('submit',e=>{e.preventDefault();const name=normalizeRecordName(nameInput.value);if(!name){nameError.textContent='Введите имя: 1–16 букв, цифр, пробелов или дефисов.';nameInput.focus();return;}nameError.textContent='';saveRun(name);});
nameInput.addEventListener('input',()=>{nameError.textContent='';});

function showRecords(){engine.state='records';clearInput();syncUI();records.refresh();}


try{best=Math.max(0,Number(localStorage.getItem(cfg.storageKey))||0);}catch(e){}
function saveBest(){if(engine.score>best){best=engine.score;try{localStorage.setItem(cfg.storageKey,String(best));}catch(e){}}}
function clearInput(){keys.clear();touch.clear();queuedPunch=false;acc=0;last=null;}
function start(){audio.stop();audio.unlock();audio.play('start');runBest=best;engine.reset();runId=recordId();runRecorded=false;nameInput.value='';nameError.textContent='';clearInput();syncUI();}
function pause(){audio.stop();engine.pause();clearInput();syncUI();}
function resume(){engine.resume();clearInput();syncUI();}
function title(){audio.stop();saveBest();engine.reset();engine.state='menu';clearInput();syncUI();}
function escape(){if(engine.state==='playing')pause();else if(engine.state==='paused')resume();else if((engine.state==='over'&&runRecorded)||engine.state==='help'||engine.state==='records')title();}
function hasControl(name){return keys.has(name)||Array.from(touch.values()).includes(name);}
function bindHold(b,hold){b.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,hold);if(hold==='Space')queuedPunch=true;});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>touch.delete(e.pointerId));b.addEventListener('click',e=>{if(e.detail===0&&hold==='Space')queuedPunch=true;});}
// Resolve touch by viewport coordinates, independent of grid layout and target.
function touchZone(clientX,left,width){const ratio=(clientX-left)/Math.max(1,width);return ratio<.2?'ArrowLeft':ratio<.4?'ArrowRight':'Space';}
mobileControls.addEventListener('pointerdown',e=>{if(engine.state!=='playing'||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();const rect=mobileControls.getBoundingClientRect();const control=touchZone(e.clientX,rect.left,rect.width);touch.set(e.pointerId,control);try{mobileControls.setPointerCapture(e.pointerId);}catch(_){}if(control==='Space')queuedPunch=true;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])mobileControls.addEventListener(type,e=>touch.delete(e.pointerId));
window.addEventListener('pointerup',e=>touch.delete(e.pointerId));
window.addEventListener('pointercancel',e=>touch.delete(e.pointerId));
function addButton(label,x,y,w,h,action,hold){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',label);b.style.cssText=`left:${x/scene.width*100}%;top:${y/scene.height*100}%;width:${w/scene.width*100}%;height:${h/scene.height*100}%`;if(hold)bindHold(b,hold);else b.onclick=()=>{audio.play('menu');action();};ui.append(b);return b;}
function uiState(){return engine.state==='over'&&engine.vanishEffects.length?'ending':engine.state;}
function syncUI(){const s=uiState();if(lastState===s)return;lastState=s;ui.replaceChildren();helpScreen.hidden=s!=='help';helpPixelText(helpControls,mobile()?'На телефоне первые 20% экрана слева перемещают героя влево, следующие 20% — вправо, а правые 60% отвечают за удар.':'На компьютере двигайтесь стрелками влево и вправо, атакуйте пробелом и ставьте игру на паузу клавишей Escape.');mobileControls.hidden=!(s==='playing'&&mobile());nameForm.hidden=!(s==='over'&&!runRecorded);
  if(s==='playing'){if(!mobile()){addButton('Влево',455,833,82,70,null,'ArrowLeft');addButton('Вправо',539,833,82,70,null,'ArrowRight');addButton('Удар',869,833,225,70,null,'Space');}addButton('Пауза',750,25,164,58,pause);}
  else if(s==='menu'){addButton('Как играть',612,398,440,64,showHelp);addButton('Начать игру',612,474,440,64,start);addButton('Рекорды',612,550,440,64,showRecords);}
  else if(s==='paused'){addButton('Продолжить',612,438,440,70,resume);addButton('В меню',612,522,440,70,title);}
  else if(s==='over'&&!runRecorded){nameScore.textContent='SCORE: '+String(engine.score).padStart(6,'0');if(!mobile())nameInput.focus({preventScroll:true});}
  else if(s==='over'||s==='records'){addButton(s==='over'?'Заново':'В меню',420,664,824,64,s==='over'?start:title);}
  syncAudio();syncFullscreen();liveEl.textContent=s==='help'?'Как играть.':s==='menu'?'Начать игру.':s==='paused'?'Пауза.':s==='over'?`Игра окончена. Очки ${engine.score}.` : s==='records'?'Таблица рекордов.':'Игра началась.';}
function drawCentered(txt,y,s=5,color){pxText(ctx,txt,Math.round((scene.width-(txt.length*6-1)*s)/2),y,s,color);}
function menuButton(txt,y,h){const primary=txt==='НАЧАТЬ ИГРУ';panel(ctx,612,y,440,h);if(primary){stepped(ctx,612,y,440,h,7,'#d07872');stepped(ctx,612,y,440,h,10,'#923c46');}drawCentered(txt,y+Math.floor((h-35)/2),5,primary?'#fff2dd':undefined);}
function recordButton(txt,x,y,w,h){panel(ctx,x,y,w,h);pxText(ctx,txt,x+Math.floor((w-(txt.length*6-1)*4)/2),y+Math.floor((h-28)/2),4);}
function drawRecords(state){
  panel(ctx,396,112,872,708);
  drawCentered(state==='over'?'GAME OVER':'TOP 10',140,6,state==='over'?'#e87c77':undefined);
  if(state==='over')drawCentered('SCORE: '+String(engine.score).padStart(6,'0'),192,4);
  else drawCentered('ЛУЧШИЕ РЕЗУЛЬТАТЫ',192,4);
  drawCentered('TOP 10',240,4,'#e7ba81');
  pxText(ctx,'МЕСТО',454,283,3);pxText(ctx,'ИМЯ',620,283,3);pxText(ctx,'SCORE',1060,283,3);
  ctx.fillStyle='#66657e';ctx.fillRect(444,312,776,3);
  for(let i=0;i<10;i++){const r=records.rows[i],y=325+i*28;const color=r&&r.id===runId?'#ffd58e':'#f6e5cc';if(r&&r.id===runId){ctx.fillStyle='#394052';ctx.fillRect(444,y-3,776,27);}pxText(ctx,String(i+1).padStart(2,'0'),470,y,3,color);pxText(ctx,r?r.name:'---',620,y,3,color);pxText(ctx,r?String(r.score).padStart(6,'0'):'------',1060,y,3,color);}
  drawCentered(records.pending?'СОХРАНЕНИЕ...':records.mode==='server'?'ОБЩИЕ РЕКОРДЫ':records.persisted?'ЛОКАЛЬНЫЕ РЕКОРДЫ':'РЕКОРДЫ ТОЛЬКО В ПАМЯТИ',625,3,'#d8c4ad');
  recordButton(state==='over'?'ЗАНОВО':'В МЕНЮ',420,664,824,64);
}
function drawOverlay(){const state=uiState();if(state==='ending')return;if(state==='playing'){panel(ctx,750,25,164,58);pxText(ctx,'ПАУЗА',773,44,4);return;}
  if(state==='help')return;
  ctx.fillStyle='rgba(5,9,21,.69)';ctx.fillRect(0,0,scene.width,scene.height);
  if(state==='over'&&!runRecorded)return;
  if(state==='over'||state==='records'){drawRecords(state);return;}
  panel(ctx,502,224,660,state==='menu'?490:480);
  if(state==='menu'){drawCentered('BEETLE BRAWL',274,7);drawCentered('BEST: '+String(best).padStart(6,'0'),355,4);menuButton('КАК ИГРАТЬ',398,64);menuButton('НАЧАТЬ ИГРУ',474,64);menuButton('РЕКОРДЫ',550,64);}
  else if(state==='paused'){drawCentered('ПАУЗА',285,7);drawCentered('SCORE: '+String(engine.score).padStart(6,'0'),376,4);menuButton('ПРОДОЛЖИТЬ',438,70);menuButton('В МЕНЮ',522,70);}}
function prepare(){const b=scene.colorBalance;for(const l of scene.layers){const key=l.file.split('/').pop().replace('.png','');const src=images[l.file];if(scene.retroBackground.appliesTo.includes(key)){prepared[key]=backgroundWithExhibits(retroBackground(correctedBackground(src,l,b.background,b),l,cfg.retroMode),l,cfg.retroMode,images[scene.backgroundExhibits.file],b.background,b.background,scene.backgroundExhibits);}else if(scene.lighting.appliesTo.includes(key)){const c=document.createElement('canvas');c.width=l.w;c.height=l.h;drawLit(c.getContext('2d'),src,0,0,l.w,l.h,0,0,l.w,l.h,l.x+l.w/2,b.vehicle.night/100,scene.lighting,b.vehicle);prepared[key]=c;}else prepared[key]=src;}
  skyFrame=document.createElement('canvas');skyFrame.width=prepared.background.width;skyFrame.height=prepared.background.height;}
function actor(a){const anim=sprites.characters[a.id][a.anim],i=Math.floor(a.age*anim.fps),f=anim.frames[anim.loop?i%anim.frames.length:Math.min(i,anim.frames.length-1)],s=scene.previewSpriteScale,x=Math.round(a.x),y=scene.groundY;
  ctx.save();if(a.anim==='touch'&&a.touched){const remaining=engine.animationDuration(a.id,'touch')-a.age;ctx.globalAlpha=Math.max(.12,Math.min(1,remaining/.14));}ctx.fillStyle='rgba(4,9,22,.68)';ctx.fillRect(x-29,y-2,58,5);ctx.translate(x,y);ctx.scale(a.dir<0?-1:1,1);drawLit(ctx,images[anim.image],f.x,f.y,f.w,f.h,-sprites.anchor.x*s,-sprites.anchor.y*s,f.w*s,f.h*s,x,scene.colorBalance.characters.night/100,scene.lighting,scene.colorBalance.characters);ctx.restore();}
function effect(fx){const e=sprites.effects.punch,i=Math.floor(fx.age*e.fps),f=e.frames[i];if(!f)return;const s=2;ctx.drawImage(images[e.image],f.x,f.y,f.w,f.h,Math.round(fx.x-e.anchor.x*s),Math.round(fx.y-e.anchor.y*s),f.w*s,f.h*s);}
// Cool pixel dust: separate from the warm PUNCH effect; no random gameplay calls.
function vanishEffect(fx){const t=Math.min(1,fx.age/cfg.vanishDuration),x=fx.x,y=fx.y;ctx.save();
  const snap=v=>Math.round(v/4)*4;
  for(let j=0;j<26;j++){const seed=(fx.uid*131+j*73)%997;const a=j*2.399963+seed*.005;const dist=(20+seed%32)*(0.35+t*1.8);const size=t<.45?8:4;
    const px=snap(x+Math.cos(a)*dist),py=snap(y+Math.sin(a)*dist*.84-28*t);
    ctx.globalAlpha=Math.max(0,1-t)*(j%3===0?.8:1);ctx.fillStyle=['#e9edf5','#93b8d9','#536d9d'][j%3];ctx.fillRect(px,py,size,size);}
  if(t<.26){ctx.globalAlpha=(1-t/.26)*.8;ctx.fillStyle='#ecf3ff';ctx.fillRect(snap(x)-8,snap(y)-24,16,48);ctx.fillRect(snap(x)-24,snap(y)-8,48,16);}ctx.restore();}
// Ground items use original 24x24 RGBA art on the gameplay plane.
function drawItems(){for(const item of engine.items){const x=Math.round(item.x/2)*2,y=scene.groundY;ctx.save();
  if(item.age>cfg.itemLifetime-1&&Math.floor(item.age*8)%2===0)ctx.globalAlpha=.55;
  ctx.fillStyle='rgba(4,9,22,.55)';ctx.fillRect(x-18,y-3,36,5);
  const im=images['assets/items/'+item.id+'.png'];if(im)ctx.drawImage(im,x-24,y-48,48,48);ctx.restore();}}
function drawItemEffect(fx){ctx.save();ctx.globalAlpha=Math.max(0,1-fx.age/.65);const x=Math.round(fx.x),y=Math.round(fx.y-38*fx.age/.65);const color=fx.delta<0?'#ff7b76':fx.delta>0?'#a4df85':'#d8c4ad';
  if(fx.delta>=0){ctx.fillStyle=color;ctx.fillRect(x-15,y+9,15,3);ctx.fillRect(x-9,y+3,3,15);}else{ctx.fillStyle=color;ctx.fillRect(x-15,y+9,15,3);}pxText(ctx,String(Math.abs(fx.delta)),x+4,y,3,color);ctx.restore();}
function render(){ctx.imageSmoothingEnabled=false;ctx.fillStyle='#111b2b';ctx.fillRect(0,0,cv.width,cv.height);const tick=Math.floor(skyClock/1000*12);if(tick!==skyTick){skyTick=tick;const g=skyFrame.getContext('2d');g.imageSmoothingEnabled=false;drawAnimatedSky(g,prepared.background,images[scene.skyAnimation.mask],cfg.retroMode,skyClock,{clouds:cfg.skyClouds});}
  for(const key of scene.renderOrder){if(key==='characters'){if(engine.state==='menu'||engine.state==='help'||engine.state==='records'){for(const p of scene.previewActors)actor({...p,dir:p.flip?-1:1,age:skyClock/1000});}else{drawItems();for(const e of engine.enemies)actor(e);actor(engine.hero);}continue;}if(key==='effects'){for(const fx of engine.effects)effect(fx);for(const fx of engine.vanishEffects)vanishEffect(fx);for(const fx of engine.itemEffects)drawItemEffect(fx);continue;}if(key==='hud'){if(mobile()&&['playing','ending'].includes(uiState())){ctx.save();ctx.beginPath();ctx.rect(0,0,scene.width,120);ctx.clip();drawHUD(ctx,engine.lives,engine.score);ctx.restore();}else drawHUD(ctx,engine.lives,engine.score);continue;}const l=scene.layers.find(x=>x.file.endsWith('/'+key+'.png'));ctx.drawImage(key==='background'?skyFrame:prepared[key],l.x,l.y);}
  drawOverlay();}
function frame(now){if(!ready)return;const dt=last===null?0:Math.max(0,Math.min(.08,(now-last)/1000));last=now;if(!document.hidden&&(engine.state==='playing'||engine.state==='menu'||engine.state==='help'||engine.state==='records'))skyClock+=dt*1000;
  if(engine.state==='playing'){acc+=dt;while(acc>=cfg.fixedStep&&engine.state==='playing'){engine.step(cfg.fixedStep,{left:hasControl('ArrowLeft'),right:hasControl('ArrowRight'),punch:queuedPunch});queuedPunch=false;acc-=cfg.fixedStep;}saveBest();if(engine.state==='over'){audio.stop();audio.play(engine.score>runBest?'record':'over');}}
  if(lastLives!==engine.lives||lastScore!==engine.score){lastLives=engine.lives;lastScore=engine.score;if(engine.state==='playing')liveEl.textContent=`Жизни: ${lastLives}. Очки: ${lastScore}.`;}
  if(uiState()==='ending')engine.advanceVanish(dt);
  if(lastState!==uiState()){clearInput();syncUI();}render();requestAnimationFrame(frame);}
window.addEventListener('keydown',e=>{if(!ready)return;if(uiState()==='ending')return;if(!nameForm.hidden||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.isComposing)return;const code=e.code;if((engine.state!=='playing'||e.target===audioToggle||e.target===fullscreenToggle)&&e.target instanceof HTMLButtonElement&&['Space','Enter'].includes(code))return;if(['ArrowLeft','ArrowRight','Space','Escape','Enter'].includes(code))e.preventDefault();else return;if(code==='Escape'&&!e.repeat){escape();return;}if(code==='Enter'&&!e.repeat){if(engine.state==='menu'||engine.state==='over')start();else if(engine.state==='paused')resume();else if(engine.state==='records'||engine.state==='help')title();return;}if(engine.state!=='playing')return;if(code==='Space'&&!e.repeat&&!keys.has(code))queuedPunch=true;keys.add(code);});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{if(ready&&engine.state==='playing')pause();else clearInput();});document.addEventListener('visibilitychange',()=>{audio.setMusicAllowed(!document.hidden);if(!document.hidden)audio.unlock();if(document.hidden&&ready&&engine.state==='playing')pause();else clearInput();});
Promise.all(Object.entries(GAME_DATA.sources).map(([file,url])=>new Promise((ok,fail)=>{const img=new Image();img.onload=()=>{images[file]=img;ok();};img.onerror=()=>fail(new Error(file));img.src=url;}))).then(()=>{prepare();ready=true;statusEl.hidden=true;syncUI();audio.setMusicAllowed(!document.hidden);if(!document.hidden)audio.unlock();window.gameReady=true;records.refresh();requestAnimationFrame(frame);}).catch(e=>{statusEl.setAttribute('aria-label','Ошибка загрузки ресурсов: '+e.message);helpPixelText(statusEl,'Ошибка загрузки ресурсов: '+e.message);console.error(e);});
