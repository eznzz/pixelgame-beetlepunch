// Original procedural arcade effects. No external assets or network requests.
const BEETLE_SOUNDS = Object.freeze({
 menu:[[520,780,.055,'triangle',.32],[780,1040,.045,'square',.18]],start:[[220,330,.12],[330,440,.12],[440,660,.18]],
 swing:[[420,85,.16,'noise',.62]],hit:[[190,65,.105,'punch',1]],
 defeat:[[150,48,.12,'fall-punch',1]],damage:[[260,65,.26,'sawtooth',.88],[130,45,.17,'noise',.58]],
 drop:[[440,880,.10,'triangle',.47],[880,1200,.08,'triangle',.28]],good:[[440,550,.09],[660,880,.12],[880,1320,.14,'triangle',.5]],
 bad:[[390,220,.13,'sawtooth',.6],[220,75,.18,'sawtooth',.5]],destroy:[[420,90,.21,'noise',.88],[110,35,.14,'sawtooth',.65]],
 over:[[440,330,.19],[330,220,.19],[220,82,.36,'sawtooth',.55]],record:[[523,659,.12],[659,784,.12],[784,1047,.14],[1047,1319,.28,'triangle',.55]]
});
// 16-bit console-inspired FM / PCM synthesis, not a hardware emulator.
function chipVoice(phase, t, kind){
  const p=phase*2*Math.PI;
  if(kind==='noise')return Math.sin(p*.61+3*Math.sin(p*1.73))*0.55+Math.sin(p*2.37)*.25;
  if(kind==='bass')return .78*Math.sin(p+1.4*Math.exp(-t*5)*Math.sin(p*2))+.22*Math.sin(p*2);
  if(kind==='bell')return .8*Math.sin(p+2.1*Math.exp(-t*9)*Math.sin(p*3))+.2*Math.sin(p*2);
  return .72*Math.sin(p+(.8+1.9*Math.exp(-t*10))*Math.sin(p*2))+.18*Math.sin(p*3)+.10*Math.sin(p*.997);
}
function pcm16(v){return Math.round(Math.max(-1,Math.min(1,v))*32767)/32767;}
// Layered 16-bit-style effects: transient, body, harmonics and short tail.
const SWING_PRESETS=Object.freeze({wide:[980,120,.28,'swing-wide',.86],heavy:[680,65,.30,'swing-heavy',.92],double:[1200,100,.32,'swing-double',.85]});
function makeSwing(ctx,preset){
 const [from,to,duration,type,volume]=SWING_PRESETS[preset]||SWING_PRESETS.heavy;
 const rate=ctx.sampleRate,n=Math.ceil(rate*duration),b=ctx.createBuffer(2,n,rate);let seed=9171;
 for(let ch=0;ch<2;ch++){const data=b.getChannelData(ch);let low=0,mid=0,phase=0;for(let i=0;i<n;i++){const t=i/rate,u=t/duration;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.045*(noise-low);mid+=.23*(noise-mid);phase+=from*(to/from)**u/rate;const env=Math.sin(Math.PI*u)**.8;const sweep=type==='swing-double'?.45+.55*Math.abs(Math.sin(2*Math.PI*u)):1;const pan=ch===0?1.15-.30*u:.85+.30*u;const body=type==='swing-heavy'?.55:.22;data[i]=pcm16(Math.tanh((1.5*(mid-low)+.32*(noise-mid)+body*Math.sin(phase*2*Math.PI)+.25*low)*2.1)*env*sweep*pan*volume);}}
 return b;
}
// Compact punch: dry crack, dense low-mid body, no long echo.
function makePunch(ctx){
 const rate=ctx.sampleRate,n=Math.ceil(rate*.105),b=ctx.createBuffer(2,n,rate);let seed=3181,low=0,mid=0,phase=0;
 for(let i=0;i<n;i++){const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.08*(noise-low);mid+=.37*(noise-mid);phase+=(65+125*Math.exp(-t*55))/rate;
 const crack=(noise-mid)*1.3*Math.exp(-t*165),smack=(mid-low)*1.9*Math.exp(-t*65),body=.85*Math.sin(phase*2*Math.PI)*Math.exp(-t*42)+.24*Math.sin(phase*4*Math.PI)*Math.exp(-t*55);const env=Math.min(1,t/.0015,(n-i)/(rate*.012));const v=Math.tanh((crack+smack+body)*1.7)*env*.95;
 for(let ch=0;ch<2;ch++)b.getChannelData(ch)[i]=pcm16(v);}
 return b;
}
// Short landing punch: dry slap, lower body impact and a tiny grit tail.
function makeFallPunch(ctx){
 const rate=ctx.sampleRate,n=Math.ceil(rate*.12),b=ctx.createBuffer(2,n,rate),l=b.getChannelData(0),r=b.getChannelData(1);let seed=7193,low=0,mid=0,phase=0;
 for(let i=0;i<n;i++){const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.09*(noise-low);mid+=.36*(noise-mid);phase+=(48+102*Math.exp(-t*48))/rate;
 const slap=1.2*(noise-mid)*Math.exp(-t*140)+1.65*(mid-low)*Math.exp(-t*57),body=.95*Math.sin(phase*2*Math.PI)*Math.exp(-t*34)+.30*Math.sin(phase*4*Math.PI)*Math.exp(-t*49),grit=.19*(mid-low)*Math.exp(-t*29);const env=Math.min(1,t/.0015,(n-i)/(rate*.012));
 l[i]=pcm16(Math.tanh((slap+body+grit)*1.7)*env*.93);r[i]=pcm16(Math.tanh((slap+body-grit*.3)*1.7)*env*.93);}
 return b;
}
// Stereo arcade impact: sharp attack, falling body, debris and short spatial reflections.
function makeBeetleEffect(ctx,from,to,duration,type,volume){
 const rate=ctx.sampleRate,n=Math.ceil(rate*duration),buffer=ctx.createBuffer(2,n,rate),dry=new Float32Array(n);let phase=0,low=0,mid=0,seed=92345;
 const heavy=type==='noise'||type==='sawtooth'||from<200;
 for(let i=0;i<n;i++){const t=i/rate,u=t/duration;phase+=from*(to/from)**u/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=.045*(noise-low);mid+=.24*(noise-mid);const p=phase*2*Math.PI,attack=Math.exp(-t*48),body=Math.exp(-t*9),tail=Math.min(1,t/.002,(duration-t)/.025);let v;
 if(heavy){const thump=Math.sin(2*Math.PI*(48*t+2.4*(1-Math.exp(-t*35))));v=.72*thump*body+.45*Math.tanh(2*Math.sin(p)+Math.sin(p*2.01))*body+.95*(noise-mid)*attack+.65*(mid-low)*Math.exp(-t*15);if(type==='noise')v+=.45*(noise-low)*Math.exp(-t*12);}
 else v=.62*chipVoice(phase,t,'lead')*body+.28*chipVoice(phase*1.5,t,'bell')*Math.exp(-t*5)+.20*chipVoice(phase*.5,t,'bass')*body+.18*(noise-mid)*attack;
 dry[i]=Math.tanh(v*1.7)*Math.max(0,tail)*volume;}
 for(let ch=0;ch<2;ch++){const data=buffer.getChannelData(ch),delay=Math.round(rate*(ch===0?.018:.029)),delay2=Math.round(rate*(ch===0?.043:.051));for(let i=0;i<n;i++){const end=Math.min(1,(n-i)/(rate*.018));data[i]=pcm16(Math.tanh(dry[i]+.27*(dry[i-delay]||0)-.13*(dry[i-delay2]||0))*end);}}
 return buffer;
}
// Original stereo rock'n'roll loop: power chords, walking bass, lead guitar and drums.
function makeBeetleMusic(ctx){
 const beat=60/138, roots=[45,45,50,45,52,50,45,52], riffs=[[0,0,3,4,7,4,3,0],[0,3,4,7,9,7,4,3],[0,0,3,4,7,4,3,0],[7,4,3,0,3,4,7,9],[0,0,3,4,7,9,7,4],[0,3,4,7,4,3,0,3],[0,0,3,4,7,4,3,0],[7,6,5,4,3,2,1,0]];
 const rate=ctx.sampleRate,length=Math.round(roots.length*4*beat*rate),buffer=ctx.createBuffer(2,length,rate),left=buffer.getChannelData(0),right=buffer.getChannelData(1);let seed=777;
 function put(i,v,pan){left[i]+=v*(1-pan*.55);right[i]+=v*(1+pan*.55);}
 function note(midi,start,duration,amp,kind,pan=0){const f=440*2**((midi-69)/12),first=Math.round(start*rate),n=Math.round(duration*rate);for(let i=0;i<n;i++){const t=i/rate,p=2*Math.PI*f*t;const env=Math.min(1,t/.004,Math.max(0,(duration-t)/.035))*Math.exp(-t*(kind==='bass'?2:3));let v;if(kind==='bass')v=.8*Math.sin(p)+.2*Math.sin(2*p);else{const q=p+.06*Math.sin(t*34);v=Math.tanh(2.1*(Math.sin(q)+.42*Math.sin(2*q)+.25*Math.sin(3*q)+.12*Math.sin(5*q)));}put((first+i)%length,v*env*amp,pan);}}
 function drum(start,kind){const first=Math.round(start*rate),dur=kind==='kick'?.19:kind==='snare'?.15:.055,n=Math.round(rate*dur);let filt=0;for(let i=0;i<n;i++){const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;filt=.65*filt+.35*noise;const e=Math.min(1,t/.002)*(1-i/n);let v=kind==='kick'?.34*Math.sin(2*Math.PI*(48*t+4*(1-Math.exp(-t*42))))*Math.exp(-t*18):kind==='snare'?(.23*(noise-filt*.4)+.10*Math.sin(2*Math.PI*175*t))*Math.exp(-t*23):.085*(noise-filt)*Math.exp(-t*45);put((first+i)%length,v*e,kind==='hat'?.35:0);}}
 roots.forEach((r,b)=>{for(let k=0;k<8;k++){const t=(b*4+k/2)*beat;const fifth=k%4>=2?9:7;note(r,t,beat*.43,.105,'guitar',-.8);note(r+fifth,t,beat*.43,.08,'guitar',-.8);note(r+12,t+.008,beat*.42,.075,'guitar',.8);note(r+fifth,t+.008,beat*.42,.075,'guitar',.8);note(r-12+[0,0,7,9,10,9,7,3][k],t,beat*.44,.22,'bass');note(r+12+riffs[b][k],t,beat*.39,.13,'lead',.15);drum(t,'hat');if(k===0||k===4||k===5)drum(t,'kick');if(k===2||k===6)drum(t,'snare');}});
 for(let i=0;i<length;i++){left[i]=pcm16(Math.tanh(left[i]*1.5)*.87);right[i]=pcm16(Math.tanh(right[i]*1.5)*.87);}return buffer;
}
class BeetleAudio {
  constructor(config, storage, Context=globalThis.AudioContext||globalThis.webkitAudioContext){
    this.config=config;this.storage=storage;this.Context=Context;this.enabled=config.effectsEnabled||config.musicEnabled;this.musicSource=null;this.musicBuffer=null;this.musicAllowed=true;this.ctx=null;this.voices=new Set();this.effectBuffers=new Map();
    try{const v=storage?.getItem(config.storageKey);if(v==='off'||v==='on')this.enabled=v==='on';}catch(e){}
  }
  unlock(){if(!this.config.enabled||!this.enabled||!this.Context)return;try{if(!this.ctx){this.ctx=new this.Context();this.master=this.ctx.createGain();this.master.gain.value=this.config.masterVolume*this.config.effectsVolume;this.master.connect(this.ctx.destination);this.musicGain=this.ctx.createGain();this.musicGain.gain.value=this.config.masterVolume*this.config.musicVolume;this.musicGain.connect(this.ctx.destination);}if(this.ctx.state!=='running')Promise.resolve(this.ctx.resume()).then(()=>this.syncMusic()).catch(()=>{});else this.syncMusic();}catch(e){}}
  setEnabled(value){this.enabled=!!value;try{this.storage?.setItem(this.config.storageKey,value?'on':'off');}catch(e){}if(!value){this.stop();this.stopMusic();}else this.unlock();}
  setMusicAllowed(value){this.musicAllowed=!!value;this.syncMusic();}
  stopMusic(){if(this.musicSource){const source=this.musicSource;this.musicSource=null;try{source.stop();source.disconnect();}catch(e){}}}
  syncMusic(){if(!this.config.enabled||!this.enabled||!this.config.musicEnabled||!this.musicAllowed){this.stopMusic();return;}if(!this.ctx||this.ctx.state!=='running'||this.musicSource)return;try{this.musicBuffer ||= makeBeetleMusic(this.ctx);const source=this.ctx.createBufferSource();source.buffer=this.musicBuffer;source.loop=true;source.connect(this.musicGain);source.start();this.musicSource=source;}catch(e){}}
  stop(){for(const v of this.voices){try{v.stop();}catch(e){}}this.voices.clear();}
  play(name){const ctx=this.ctx;if(!this.config.enabled||!this.enabled||!this.config.effectsEnabled||!ctx||ctx.state!=='running'||!BEETLE_SOUNDS[name])return;try{let t=ctx.currentTime+.005;for(const [from,to,duration,type='square',volume=.3] of (name==='swing'?[SWING_PRESETS[this.config.swingPreset]||SWING_PRESETS.heavy]:BEETLE_SOUNDS[name])){if(this.voices.size>=24)break;const source=ctx.createBufferSource();const key=[name,from,to,duration,type,volume,this.config.swingPreset].join(':');if(!this.effectBuffers.has(key))this.effectBuffers.set(key,name==='swing'?makeSwing(ctx,this.config.swingPreset):name==='hit'?makePunch(ctx):name==='defeat'?makeFallPunch(ctx):makeBeetleEffect(ctx,from,to,duration,type,volume));source.buffer=this.effectBuffers.get(key);const gain=ctx.createGain();gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(1,t+.005);gain.gain.exponentialRampToValueAtTime(.001,t+duration);source.connect(gain);gain.connect(this.master);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};source.start(t);source.stop(t+duration+.005);t+=duration;}}catch(e){}}
}
if(typeof module!=='undefined')module.exports={BeetleAudio,BEETLE_SOUNDS,makeBeetleMusic,makeBeetleEffect,makeSwing,makePunch,makeFallPunch,SWING_PRESETS};
