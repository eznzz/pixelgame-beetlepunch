let recordStorage;try{recordStorage=window.localStorage;}catch(e){}
const audio=new BeetleAudio(AUDIO_CONFIG,recordStorage),audioToggle=document.getElementById('audio-toggle');
// A gesture anywhere in the menu (including the backdrop) can unlock audio.
for(const event of ['pointerdown','pointerup','touchstart','touchend','mousedown','keydown','click'])window.addEventListener(event,e=>{if(!document.hidden&&!audioToggle.contains(e.target))audio.unlock();},{capture:true,passive:true});
window.addEventListener('pageshow',()=>{if(!document.hidden)audio.unlock();});
window.addEventListener('focus',()=>{if(!document.hidden)audio.unlock();});
if(!document.hidden)audio.unlock();
