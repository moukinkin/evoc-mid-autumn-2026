'use strict';
const $ = id => document.getElementById(id);
const experience = document.querySelector('.experience');
const film = $('film');
let state = 'intro';
let soundOn = true;
let waitTimer;
let playAttempt = 0;
const passed=new Set();let checkpointKind=null;let holdFrame=0;let holdStart=0;let swipeY=null;
const checkpoints=[{time:2.9,kind:'swipe'},{time:6.6,kind:'hold'}];
function announce(message){ $('announcement').textContent=message; }
function setState(next){
  state=next;experience.dataset.state=next;
 document.body.classList.toggle('red-finale',next==='revealed');document.querySelector('meta[name="theme-color"]').content='#bd001b';$('checkpoint').hidden=next!=='checkpoint';
  $('intro').hidden=next!=='intro';
  $('moonScene').hidden=!['moon','revealed'].includes(next);
  $('filmControls').hidden=next!=='playing';
  $('progressTrack').hidden=next!=='playing';
  $('greeting').hidden=next!=='revealed';
  $('moonHint').hidden=next!=='moon';
  $('moon').hidden=next!=='moon';
  $('footerLabel').textContent=next==='playing'?'与祥仔一起，共赏明月':'中秋 · 与您共赏';
}
function clearWaiting(){clearTimeout(waitTimer);$('notice').hidden=true;}
function fail(message){
 clearWaiting();$('errorText').textContent=message;$('errorPanel').hidden=false;
 $('retry').focus({preventScroll:true});
}
async function playFilm(restart=true){
 const attempt=++playAttempt;
 $('errorPanel').hidden=true;clearWaiting();$('particles').replaceChildren();
 cancelHold();if(restart){passed.clear();checkpointKind=null;announce('');$('time').textContent='00:00 / '+formatTime(film.duration||15);film.currentTime=0;$('progressFill').style.width='0%';}
 film.muted=!soundOn;setState('playing');syncSound();syncPlayback();
 $('notice').textContent='正在加载月光…';$('notice').hidden=false;
 waitTimer=setTimeout(()=>{if(state==='playing'&&film.readyState<3)fail('加载时间有些长，请重试或直接开启祝福。');},15000);
 try{
   await film.play();
   if(attempt!==playAttempt)return;
   clearWaiting();syncPlayback();$('pause').focus({preventScroll:true});
 }catch(error){
   if(attempt!==playAttempt)return;
   if(error.name==='AbortError')return;
   fail('短片暂时未能播放，请点击重新播放。');
 }
}
function openMoon(){
 ++playAttempt;cancelHold();film.pause();clearWaiting();$('errorPanel').hidden=true;
 setState('moon');announce('轻触明月，开启中秋祝福。');$('moon').focus({preventScroll:true});
}
function reveal(){
 if(state!=='moon')return;
 setState('revealed');$('greeting').hidden=true;announce('月光已点亮，祝福即将呈现。');
 film.muted=!soundOn;
 film.play().catch(()=>{$('greeting').hidden=false;announce('研祥集团祝您中秋快乐');});
}
function showGreeting(){
 if(!$('greeting').hidden)return;
 $('greeting').hidden=false;announce('研祥集团祝您中秋快乐');
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  for(let i=0;i<38;i++){
   const dot=document.createElement('i');dot.className='spark';
   dot.style.left='51%';dot.style.top='22%';
   const angle=Math.random()*Math.PI*2;
   const distance=60+Math.random()*240;
   dot.style.setProperty('--dx',Math.cos(angle)*distance+'px');
   dot.style.setProperty('--dy',Math.sin(angle)*distance+120+'px');
   dot.style.animationDelay=(Math.random()*.18)+'s';$('particles').append(dot);
  }
  setTimeout(()=>$('particles').replaceChildren(),2100);
 }
 $('replay').focus({preventScroll:true});
}
function syncPlayback(){
 $('pause').textContent=film.paused?'继续':'暂停';
 $('pause').setAttribute('aria-label',film.paused?'继续播放':'暂停播放');
}
function syncSound(){
 $('sound').textContent=soundOn?'声音 开':'声音 关';
 $('sound').setAttribute('aria-pressed',String(soundOn));
 $('sound').setAttribute('aria-label',soundOn?'关闭声音':'开启声音');
}
function formatTime(n){return '00:'+String(Math.max(0,Math.floor(n||0))).padStart(2,'0');}
$('start').onclick=()=>playFilm();
$('retry').onclick=()=>{if(film.error)film.load();playFilm();};
$('toMoon').onclick=openMoon;
$('replay').onclick=()=>playFilm();
$('moon').onclick=reveal;
$('pause').onclick=()=>{if(film.paused)playFilm(false);else film.pause();};
$('sound').onclick=()=>{soundOn=!soundOn;film.muted=!soundOn;syncSound();};
film.addEventListener('play',syncPlayback);
film.addEventListener('pause',syncPlayback);
film.addEventListener('ended',openMoon);
film.addEventListener('playing',clearWaiting);
film.addEventListener('timeupdate',()=>{
 if(state==='playing'){const pending=checkpoints.find(p=>!passed.has(p.kind)&&film.currentTime>=p.time);if(pending){pauseForInteraction(pending.kind);return;}if(film.currentTime>=9.9){openMoon();return;}}
 if(state==='revealed'){
  if(film.currentTime>=11.35)showGreeting();
  if(film.currentTime>=14.05){film.pause();showGreeting();}
 }
 const ratio=film.duration?film.currentTime/film.duration:0;
 $('progressFill').style.width=Math.min(100,ratio*100)+'%';
 $('time').textContent=formatTime(film.currentTime)+' / '+formatTime(film.duration||15);
});
film.addEventListener('waiting',()=>{if(state==='playing'){clearWaiting();$('notice').textContent='正在加载月光…';$('notice').hidden=false;waitTimer=setTimeout(()=>{if(state==='playing'&&!film.paused&&film.readyState<3)fail('网络有些慢，请重试或直接开启祝福。');},15000);}});
film.addEventListener('error',()=>{if(state==='playing')fail('视频加载失败，请检查网络后重试。');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelHold();if(document.hidden&&state==='playing'){film.pause();clearWaiting();}});
window.addEventListener('pagehide',()=>film.pause());
const context=document.modelContext;
if(context?.registerTool){
 const lifecycle=new AbortController();
 const tools=[
 {name:'get_midautumn_state',title:'读取中秋体验状态',description:'读取当前中秋短片与祝福状态。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){validateEmpty(input);return {state,paused:film.paused,soundOn,currentTime:film.currentTime};}},
 {name:'reveal_midautumn_greeting',title:'揭开中秋祝福',description:'仅在短片结束后的触月画面，执行与轻触明月相同的操作。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){validateEmpty(input);if(state!=='moon')throw new Error('祝福只能在触月画面开启');reveal();return {state,greeting:'研祥集团祝您中秋快乐'};}}
 ];
 function validateEmpty(input){if(input===null||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('需要空对象参数');}
 for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}


function pauseForInteraction(kind){
 ++playAttempt;film.pause();clearWaiting();checkpointKind=kind;setState('checkpoint');
 const isSwipe=kind==='swipe';
 $('checkpointHint').textContent=isSwipe?'随祥仔出发':'让月光汇聚';
 $('gestureLabel').textContent=isSwipe?'向上轻滑':'长按点亮';
 $('gestureIcon').textContent=isSwipe?'↑':'✦';
 $('gesture').setAttribute('aria-label',isSwipe?'向上轻滑，随祥仔出发':'长按一秒，让月光汇聚');
 $('gesture').classList.toggle('hold',!isSwipe);
 announce(isSwipe?'向上轻滑，或点击继续。':'长按一秒，让月光汇聚，也可点击继续。');
 $('gesture').focus({preventScroll:true});
}
function continueCheckpoint(){
 if(state!=='checkpoint')return;
 passed.add(checkpointKind);cancelHold();checkpointKind=null;playFilm(false);if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&$('stage').animate){$('stage').animate([{boxShadow:'0 0 65px #f3ce8790'},{boxShadow:'0 14px 70px #0008'}],{duration:650,easing:'ease-out'});}
}
function cancelHold(){
 cancelAnimationFrame(holdFrame);holdFrame=0;holdStart=0;swipeY=null;
 $('holdFill').style.width='0%';$('gesture').style.setProperty('--charge','0deg');$('gesture').classList.toggle('charging',false);
}
function beginHold(){
 if(state!=='checkpoint'||checkpointKind!=='hold'||holdFrame)return;
 holdStart=performance.now();$('gesture').classList.toggle('charging',true);
 const tick=now=>{
  if(state!=='checkpoint'||checkpointKind!=='hold'){cancelHold();return;}
  const progress=Math.min(1,(now-holdStart)/1100);
  $('holdFill').style.width=progress*100+'%';$('gesture').style.setProperty('--charge',progress*360+'deg');
  if(progress>=1){continueCheckpoint();return;}
  holdFrame=requestAnimationFrame(tick);
 };
 holdFrame=requestAnimationFrame(tick);
}
$('continueCheckpoint').onclick=continueCheckpoint;
$('gesture').addEventListener('pointerdown',event=>{
 if(state!=='checkpoint')return;
 event.preventDefault();$('gesture').setPointerCapture(event.pointerId);
 if(checkpointKind==='swipe')swipeY=event.clientY;else beginHold();
});
$('gesture').addEventListener('pointermove',event=>{
 if(state==='checkpoint'&&checkpointKind==='swipe'&&swipeY!==null&&swipeY-event.clientY>45)continueCheckpoint();
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('gesture').addEventListener(name,cancelHold);
$('gesture').addEventListener('contextmenu',event=>event.preventDefault());
$('gesture').addEventListener('keydown',event=>{
 if(event.key==='ArrowUp'&&checkpointKind==='swipe'){event.preventDefault();continueCheckpoint();}
 if((event.key===' '||event.key==='Enter')&&checkpointKind==='hold'){event.preventDefault();if(!event.repeat)beginHold();}
});
$('gesture').addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')cancelHold();});
$('gesture').addEventListener('blur',cancelHold);
