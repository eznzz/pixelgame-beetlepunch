// Pure gameplay simulation. Positions in scene pixels; time in seconds.
class BeetleEngine {
  constructor(config,scene,sprites,rng=Math.random){this.c=config;this.scene=scene;this.sprites=sprites;this.rng=rng;this.reset();this.state='menu';}
  emit(name){if(this.onSound)this.onSound(name);}
  reset(){this.state='playing';this.time=0;this.lives=this.c.lives;this.score=0;this.hero={id:'hero',x:this.c.heroStartX,dir:1,anim:'idle',age:0,attack:null,cooldown:0};this.enemies=[];this.effects=[];this.vanishEffects=[];this.items=[];this.itemEffects=[];this.spawnIn=this.c.spawnStart;this.lastSide=0;this.sideStreak=0;this.lastType=-1;this.nextId=1;this.lastDamage=-Infinity;}
  pause(){if(this.state==='playing')this.state='paused';}
  resume(){if(this.state==='paused')this.state='playing';}
  spawn(side,type){const r=this.rng;if(side===undefined){side=this.sideStreak>=2?-this.lastSide:(r()<.5?-1:1);}this.sideStreak=side===this.lastSide?this.sideStreak+1:1;this.lastSide=side;
    if(type===undefined){type=Math.floor(r()*4);if(type===this.lastType&&r()<.6)type=(type+1+Math.floor(r()*3))%4;}this.lastType=type;
    const c=this.c,base=Math.min(c.enemyMaxSpeed,c.enemySpeed+this.time*c.enemySpeedGain)*(0.93+type*.04);
    const fast=r()<Math.min(c.fastChanceMax,c.fastChance+this.time*c.fastChanceGain);
    const speed=fast?Math.min(c.fastSpeedCap,base*(c.fastMin+r()*(c.fastMax-c.fastMin))):base;
    const e={uid:this.nextId++,id:'enemy-0'+(type+1),x:side<0?-this.c.spawnPadding:this.scene.width+this.c.spawnPadding,dir:-side,side,speed,fast,anim:'run',age:0,touched:false};this.enemies.push(e);return e;}
  animationDuration(id,name){const a=this.sprites.characters[id][name];return a.frames.length/a.fps;}
  setAnim(a,name){if(a.anim!==name){a.anim=name;a.age=0;}}
  startPunch(){const h=this.hero;if(h.attack||h.cooldown>0)return false;h.attack={age:0,dir:h.dir,resolved:false};h.cooldown=this.c.punchCooldown;this.setAnim(h,'punch');this.emit('swing');return true;}
  impact(){const h=this.hero,a=h.attack;if(!a||a.resolved)return;a.resolved=true;
    // Ground items are destroyed at the same impact frame, without score or life changes.
    this.items=this.items.filter(item=>{const d=(item.x-h.x)*a.dir;if(item.age>=this.c.itemLifetime||d< -this.c.punchBackTolerance||d>this.c.punchRange)return true;this.effects.push({x:item.x,y:this.scene.groundY-25,age:0});this.emit('destroy');return false;});
    const candidates=this.enemies.filter(e=>e.anim!=='hit'&&!e.touched).map(e=>({e,d:(e.x-h.x)*a.dir})).filter(o=>o.d>=-this.c.punchBackTolerance&&o.d<=this.c.punchRange).sort((u,v)=>Math.abs(u.d)-Math.abs(v.d));
    if(!candidates.length)return;const e=candidates[0].e;this.setAnim(e,'hit');this.emit('hit');e.knockDir=a.dir;e.hitX=e.x;this.score=Math.min(999999,this.score+this.c.points);this.effects.push({x:e.x,y:this.scene.groundY-96,age:0});}
  vanish(e){if(e.remove)return;e.remove=true;this.vanishEffects.push({x:e.x,y:this.scene.groundY-62,uid:e.uid,age:0});}
  advanceVanish(dt){for(const fx of this.vanishEffects)fx.age+=dt;this.vanishEffects=this.vanishEffects.filter(fx=>fx.age<this.c.vanishDuration);}
  // Drop once, at the defeated enemy's final position (not on a successful car touch).
  dropItem(e){if(e.dropped)return null;e.dropped=true;const c=this.c;
    if(this.rng()>=c.itemDropChance)return null;
    const types=c.itemTypes.filter(t=>t.weight>0), total=types.reduce((n,t)=>n+t.weight,0);if(!total)return null;
    let roll=this.rng()*total;let type=types.find(t=>(roll-=t.weight)<0)||types[types.length-1];
    const item={id:type.id,life:type.life,x:Math.max(c.heroPadding,Math.min(this.scene.width-c.heroPadding,e.x)),age:0};this.items.push(item);this.emit('drop');return item;}
  advanceItems(dt,oldX){const c=this.c,h=this.hero;
    for(const fx of this.itemEffects)fx.age+=dt;this.itemEffects=this.itemEffects.filter(fx=>fx.age<.65);
    for(const item of this.items){item.age+=dt;if(item.age+1e-8>=c.itemLifetime){item.remove=true;continue;}
      // Let a punch already in progress reach a nearby item before pickup.
      if(h.attack&&!h.attack.resolved){const d=(item.x-h.x)*h.attack.dir;if(d>=-c.punchBackTolerance&&d<=c.punchRange)continue;}
      const nearest=Math.max(Math.min(oldX,h.x),Math.min(Math.max(oldX,h.x),item.x));
      if(Math.abs(item.x-nearest)>c.itemPickupRadius)continue;
      const previous=this.lives;this.lives=Math.max(0,Math.min(c.lives,this.lives+item.life));item.remove=true;
      this.itemEffects.push({x:item.x,y:this.scene.groundY-55,delta:this.lives-previous,age:0});
      this.emit(item.life<0?'bad':'good');if(item.life<0)this.lastDamage=this.time;
      if(!this.lives){this.state='over';break;}}
    this.items=this.items.filter(item=>!item.remove);}
  step(dt,input={}){if(this.state!=='playing'||dt<=0)return;const c=this.c,h=this.hero;const oldX=h.x;this.time+=dt;h.cooldown=Math.max(0,h.cooldown-dt);const move=Number(!!input.right)-Number(!!input.left);
    if(!h.attack&&move)h.dir=move;
    if(input.punch)this.startPunch();
    if(h.attack){h.attack.age+=dt;h.age=h.attack.age;const a=this.sprites.characters.hero.punch;const impact=this.sprites.effects.punch.heroImpactFrame/a.fps;if(h.attack.age+1e-8>=impact)this.impact();if(h.attack.age>=this.animationDuration('hero','punch')){h.attack=null;this.setAnim(h,'idle');}}
    else{if(move)h.x=Math.max(c.heroPadding,Math.min(this.scene.width-c.heroPadding,h.x+move*c.heroSpeed*dt));this.setAnim(h,move?'run':'idle');h.age+=dt;}
    this.advanceItems(dt,oldX);if(this.state!=='playing')return;
    this.spawnIn-=dt;if(this.spawnIn<=0&&this.enemies.filter(e=>e.anim!=='hit').length<c.maxEnemies){this.spawn();this.spawnIn=Math.max(c.spawnMin,c.spawnInterval-this.time*c.spawnRamp)*(1+(this.rng()-.5)*2*c.spawnJitter);}
    for(const e of this.enemies){e.age+=dt;if(e.anim==='run'){const goal=e.side<0?c.touchLeft:c.touchRight;e.x+=e.dir*e.speed*dt;if((e.x-goal)*e.dir>=0){e.x=goal;this.setAnim(e,'touch');}}
      else if(e.anim==='touch'){const a=this.sprites.characters[e.id].touch;if(!e.touched&&e.age+1e-8>=c.touchFrame/a.fps){e.touched=true;this.emit('damage');this.lives=Math.max(0,this.lives-1);this.lastDamage=this.time;if(!this.lives){this.vanish(e);this.state='over';break;}}if(e.age>=this.animationDuration(e.id,'touch'))this.vanish(e);}
      else if(e.anim==='hit'){e.x=e.hitX+e.knockDir*c.hitKnockback*Math.min(1,e.age/this.animationDuration(e.id,'hit'));if(e.age>=this.animationDuration(e.id,'hit')){this.emit('defeat');this.dropItem(e);e.remove=true;}}}
    this.enemies=this.enemies.filter(e=>!e.remove);this.advanceVanish(dt);for(const fx of this.effects)fx.age+=dt;this.effects=this.effects.filter(fx=>fx.age<this.sprites.effects.punch.durationMs/1000);}
}
if(typeof module!=='undefined')module.exports=BeetleEngine;
