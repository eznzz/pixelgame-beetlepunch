const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Engine=require('../engine.js'),scene=require('../assets/scene.json'),sprites=require('../assets/sprites.json');
const cfg=vm.runInNewContext(fs.readFileSync(__dirname+'/../config.js','utf8')+'\nGAME_CONFIG');
let g;const fresh=(c=cfg,rng=()=>.99)=>{g=new Engine(c,scene,sprites,rng);g.reset();g.spawnIn=999;return g};
const step=(seconds,input={})=>{for(let i=0;i<Math.round(seconds/cfg.fixedStep);i++)g.step(cfg.fixedStep,input)};
for(let i=0;i<4;i++){
 fresh({...cfg,itemDropChance:1});let rng=[0,(i+.5)/4];g.rng=()=>rng.shift();const e={x:1200};let item=g.dropItem(e);assert.equal(item.id,cfg.itemTypes[i].id);assert.equal(g.dropItem(e),null);assert.equal(g.items.length,1);
 g.lives=3;g.hero.x=1200;step(.01);assert.equal(g.lives,3+cfg.itemTypes[i].life);assert.equal(g.items.length,0);assert.equal(g.score,0);assert.equal(g.itemEffects.length,1);
}
fresh(cfg,()=>.1);assert.equal(g.dropItem({x:1000}),null);fresh(cfg,()=>.09999);assert(g.dropItem({x:1000}));
fresh({...cfg,itemDropChance:0},()=>0);assert.equal(g.dropItem({x:1000}),null);
fresh();g.items=[{id:'banana',life:1,x:g.hero.x,age:0}];step(.01);assert.equal(g.lives,5);assert.equal(g.items.length,0);
fresh();g.lives=1;g.items=[{id:'bottle',life:-1,x:g.hero.x,age:0}];step(.01);assert.equal(g.lives,0);assert.equal(g.state,'over');
fresh();g.items=[{id:'apple',life:1,x:1200,age:0}];step(4.99);assert.equal(g.items.length,1);g.pause();step(2);assert.equal(g.items.length,1);g.resume();step(.02);assert.equal(g.items.length,0);
fresh();g.lives=3;g.items=[{id:'banana',life:1,x:900,age:0}];step(.4,{right:true});assert.equal(g.lives,4);assert.equal(g.items.length,0);
fresh({...cfg,itemDropChance:1},()=>.3);g.hero.x=600;let e=g.spawn(-1,0);e.x=690;e.speed=0;step(.01,{punch:true});step(.2);assert.equal(g.score,100);assert.equal(g.items.length,0);step(.6);assert.equal(g.items.length,1);assert.equal(g.items[0].id,'apple');assert.equal(g.enemies.length,0);step(.5);assert.equal(g.items.length,1);g.reset();assert.equal(g.items.length,0);assert.equal(g.itemEffects.length,0);
fresh({...cfg,itemDropChance:1},()=>0);e=g.spawn(-1,0);e.x=cfg.touchLeft;step(.7);assert.equal(g.lives,4);assert.equal(g.items.length,0);
// Running speed affects x only. Renderer has no speed multiplier on frame index.
const src=fs.readFileSync(__dirname+'/../game.js','utf8');assert(src.includes('i=Math.floor(a.age*anim.fps)'));assert(!src.includes('speedFactor'));
console.log('PASS: 4 types, weighted drop, probability boundary and disable, one roll, pickup, life cap, lethal item, pause/5s expiry, walk pickup, natural punch drop, no touch drop, reset, fixed frame formula.');
// All item types, both directions, exact impact frame; no life or score changes.
for(const dir of [-1,1])for(const type of cfg.itemTypes){
 fresh();g.hero.dir=dir;g.lives=3;g.items=[{...type,x:g.hero.x+dir*80,age:0}];step(.01,{punch:true});step(.10);assert.equal(g.items.length,1);step(.10);assert.equal(g.items.length,0);assert.equal(g.lives,3);assert.equal(g.score,0);assert.equal(g.effects.length,1);
}
fresh();g.lives=3;g.items=[{id:'bottle',life:-1,x:g.hero.x+20,age:0},{id:'apple',life:1,x:g.hero.x-80,age:0},{id:'banana',life:1,x:g.hero.x+130,age:0}];step(.01,{punch:true});step(.2);assert.equal(g.lives,3);assert.deepEqual(g.items.map(i=>i.id),['apple','banana']);
fresh();g.hero.x=600;let target=g.spawn(-1,0);target.x=690;target.speed=0;g.items=[{id:'bottle',life:-1,x:680,age:0}];step(.01,{punch:true});step(.2);assert.equal(g.score,100);assert.equal(g.items.length,0);assert.equal(g.effects.length,2);
console.log('PASS: item destruction, both directions, impact timing, close-range priority, miss, enemy and item same punch.');
