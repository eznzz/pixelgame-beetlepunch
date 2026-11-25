const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),Engine=require('../engine.js');
const c=vm.runInNewContext(fs.readFileSync(__dirname+'/../config.js','utf8')+'\nGAME_CONFIG'),scene=require('../assets/scene.json'),sprites=require('../assets/sprites.json');
function fresh(){const g=new Engine(c,scene,sprites,()=>.3);g.reset();g.spawnIn=999;return g;}
function step(g,t){for(let i=0;i<Math.round(t*120);i++)g.step(1/120);}
for(const dir of [-1,1]){const g=fresh(),x=g.hero.x,sounds=[];g.onSound=n=>sounds.push(n);assert.equal(g.tapDirection(dir,0),false);assert.equal(g.tapDirection(dir,.2),true);step(g,.15);assert(Math.abs(g.hero.x-x-dir*c.heroSpeed*c.dashMultiplier*.15)<1e-7);assert.deepEqual(sounds,['dash']);g.tapDirection(dir,.3);assert.equal(g.tapDirection(dir,.4),false);step(g,.85);g.tapDirection(dir,1.2);assert.equal(g.tapDirection(dir,1.3),true);}
let g=fresh();g.energyUntil=15;g.tapDirection(1,0);g.tapDirection(1,.2);step(g,.15);assert(Math.abs(g.hero.x-c.heroStartX-c.heroSpeed*1.15*2.5*.15)<1e-7);
g=fresh();g.hero.x=c.heroPadding+1;g.tapDirection(-1,0);g.tapDirection(-1,.1);step(g,.15);assert.equal(g.hero.x,c.heroPadding);
g=fresh();g.tapDirection(1,0);assert.equal(g.tapDirection(-1,.1),false);assert.equal(g.tapDirection(-1,.5),false);g.reset();assert.equal(g.dashUntil,0);assert.equal(g.lastTap,null);
console.log('PASS: dash directions, timing, cooldown, energy, edge, reset');
