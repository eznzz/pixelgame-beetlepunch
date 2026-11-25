// BEETLE BRAWL v0.1.13 — fixed run FPS, touch zones and drops.
const GAME_CONFIG = Object.freeze({
  lives:5, points:100, heroSpeed:395, enemySpeed:155, enemyMaxSpeed:265,
  enemySpeedGain:1.2, fastChance:0.14, fastChanceGain:0.004, fastChanceMax:0.42,
  fastMin:1.12, fastMax:1.32, fastSpeedCap:320, vanishDuration:0.38, spawnStart:0.85, spawnInterval:2.15, spawnMin:0.8,
  spawnRamp:0.019, spawnJitter:0.24, maxEnemies:12,
  dashWindow:0.25, dashDuration:0.15, dashMultiplier:2.5, dashCooldown:1,
  punchCooldown:0.35, punchRange:118, punchBackTolerance:10,
  touchFrame:2, hitKnockback:95, heroStartX:832, heroPadding:48,
  spawnPadding:65, touchLeft:665, touchRight:1009,
  // Chance per enemy defeated by a punch. Five items have equal weights by default.
  itemDropChance:0.10, itemLifetime:5, itemPickupRadius:30,
  energyDuration:15, energySpeedBonus:0.15,
  itemTypes:Object.freeze([
    Object.freeze({id:'bottle',life:-1,weight:1}), Object.freeze({id:'apple',life:1,weight:1}),
    Object.freeze({id:'cigarettes',life:-1,weight:1}), Object.freeze({id:'banana',life:1,weight:1}),
    Object.freeze({id:'energy',life:0,weight:1})
  ]),
  carShineEnabled:true, carShineMinDelay:2, carShineMaxDelay:5,
  carShineDurationMin:0.6, carShineDurationMax:1.1, carShineScale:1,
  skyClouds:true, retroMode:'retro', fixedStep:1/120,
  storageKey:'stance-crimea.game-beetle.best.v1'
});

const AUDIO_CONFIG = Object.freeze({enabled:true, effectsEnabled:true, masterVolume:.5, effectsVolume:.7, musicEnabled:true, musicVolume:.34, swingPreset:"heavy", storageKey:"stance-crimea.game-beetle.audio.v1"});
