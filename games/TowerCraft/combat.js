'use strict';
const G = {
  phase:'day', t:DAY_LEN, wave:1, res:{gold:0,wood:0,stone:0,metal:0,ice:0,poison:0,lava:0,crystal:0},
  inv:{}, unlocked:{arrow:true,bomb:true}, sel:'arrow', towers:[], enemies:[], proj:[], fx:[], helpers:[],
  shrineHp:300, shrineMax:300, shrineLv:1, spawnQ:[], spawnT:0, over:false, started:false,
  stats:{wood:0,stone:0,metal:0,ice:0,poison:0,lava:0,crystal:0,crafted:0,placed:0,hired:0,nights:0,unlocked:0,upgraded:0,kills:0,breakers:0,shrineUp:0,boss:0,shark:0},
  questDone:[], player:{y:0,vy:0,x:DAYC.x,z:DAYC.z+4,yaw:0,pitch:0,hp:100,max:100,cd:0,aim:{x:0,z:0}}
};
for (const k in TOWERS) G.inv[k] = 0;

const fxGroup = new THREE.Group(); scene.add(fxGroup);
function addFx(mesh, life, vy, grow) { fxGroup.add(mesh); G.fx.push({mesh, life, vy:vy||0, grow:grow||0}); }
function canAfford(cost) { for (const k in cost) if (G.res[k] < cost[k]) return false; return true; }
function pay(cost) { for (const k in cost) G.res[k] -= cost[k]; }
function craft(type) {
  const T = TOWERS[type];
  if (!G.unlocked[type] || !canAfford(T.cost)) return false;
  pay(T.cost); G.inv[type]++; G.stats.crafted++; return true;
}
function unlock(type) {
  const T = TOWERS[type];
  if (G.unlocked[type] || G.res.gold < T.unlock) return false;
  G.res.gold -= T.unlock; G.unlocked[type] = true; G.stats.unlocked++; return true;
}

// ---------- shrine ----------
function healShrine() {
  if (G.res.gold < 5 || G.shrineHp >= G.shrineMax) return false;
  G.res.gold -= 5; G.shrineHp = Math.min(G.shrineMax, G.shrineHp + 100); return true;
}
function shrineUpCost() { return 20 * G.shrineLv; }
function upgradeShrine() {
  if (G.shrineLv >= MAX_SHRINE_LV || G.res.gold < shrineUpCost()) return false;
  G.res.gold -= shrineUpCost(); G.shrineLv++; G.shrineMax += 100; G.shrineHp = G.shrineMax; G.stats.shrineUp++; return true;
}

// ---------- towers ----------
function buildTowerMesh(type) {
  const T = TOWERS[type], g = new THREE.Group();
  g.add(makeSprite('t', type, type==='trap'?1.5:2.3));
  if (type==='pierce') { const ar=new THREE.Group(); ar.name='arrow'; const c=cone(.35,1.1,0xff4040,0,0,.9); c.rotation.x=Math.PI/2; ar.add(c); ar.position.y=2.0; g.add(ar); }
  const bar = box(1.2,.12,.12,0x4cd964,0,2.7,0); bar.name='bar'; g.add(bar);
  const lv = box(.3,.3,.3,0xffd23f,0,3.1,0); lv.name='lv'; lv.visible=false; g.add(lv);
  return g;
}
function onPath(x, z) { return distToPath(x, z) < 1.3; }
function cellFree(type, x, z) {
  if (Math.abs(x)>HALF-1 || Math.abs(z)>HALF-1) return false;
  if (Math.hypot(x-SHRINE.x, z-SHRINE.z) < 2.6 || Math.hypot(x-GATE.x, z-GATE.z) < 3) return false;
  if (onPath(x,z) !== (type==='trap')) return false;
  for (const t of G.towers) if (Math.abs(t.x-x)<=1 && Math.abs(t.z-z)<=1) return false;
  return true;
}
function placeTower(type, x, z, lv, hp) {
  x = Math.round(x); z = Math.round(z);
  if (!G.inv[type] || !cellFree(type,x,z)) return false;
  G.inv[type]--; G.stats.placed++;
  const mesh = buildTowerMesh(type); mesh.position.set(x,0,z); setTowerDir(mesh,G.placeDir||0); nightGroup.add(mesh);
  const T = TOWERS[type];
  G.towers.push({type, dir:G.placeDir||0, x, z, lv:1, hp:T.hp, max:T.hp, cd:T.rate*Math.random(), mesh});
  return true;
}
function removeTower(t, refund) {
  nightGroup.remove(t.mesh); G.towers.splice(G.towers.indexOf(t),1);
  if (refund) G.inv[t.type]++;
}
function towerAt(x, z) { x=Math.round(x); z=Math.round(z); return G.towers.find(t=>t.x===x&&t.z===z); }
function towerUpCost(t) { return 12 * t.lv; }
function upgradeTower(t) {
  if (!t || t.lv >= MAX_TOWER_LV || G.res.gold < towerUpCost(t)) return false;
  G.res.gold -= towerUpCost(t); t.lv++; t.max = Math.round(TOWERS[t.type].hp*(1+0.4*(t.lv-1))); t.hp = t.max;
  G.stats.upgraded++; return true;
}
const tDmg = t => TOWERS[t.type].dmg * (1 + 0.5*(t.lv-1));
const tRange = t => TOWERS[t.type].range + 0.7*(t.lv-1);
const tRate = t => TOWERS[t.type].rate / (1 + 0.2*(t.lv-1));
function destroyTower(t) {
  const c = TOWERS[t.type].cost;
  for (const k in c) G.res[k] += Math.floor(c[k]/2);
  toast(TOWERS[t.type].n+' tower destroyed!');
  removeTower(t,false);
}
function repairCost() { for (const k of ['wood','stone','metal']) if (G.res[k]>0) return k; return null; }
function repairNear() {
  const p = G.player, k = repairCost();
  if (!k) { toast('Need wood, stone or metal to repair'); return; }
  let best=null, bd=3.5;
  for (const t of G.towers) if (t.hp<t.max) { const d=Math.hypot(t.x-p.x,t.z-p.z); if (d<bd){bd=d;best=t;} }
  if (best) { G.res[k]--; best.hp=Math.min(best.max,best.hp+20); return; }
  if (Math.hypot(SHRINE.x-p.x,SHRINE.z-p.z)<5 && G.shrineHp<G.shrineMax) { G.res[k]--; G.shrineHp=Math.min(G.shrineMax,G.shrineHp+15); }
}

// ---------- quests ----------
function questIdx() { return QUESTS.findIndex((q,i)=>!G.questDone[i]); }
function checkQuests() {
  const i = questIdx(); if (i<0) return;
  const q = QUESTS[i];
  if (G.stats[q.k] >= q.n) { G.questDone[i]=true; G.res.gold+=q.gold; toast('Objective complete: '+q.t+' (+'+q.gold+' gold)'); }
}
const tAoe = t => (TOWERS[t.type].aoe||0) * (1 + 0.2*(t.lv-1));
const tSlow = t => Math.max(0.15, TOWERS.ice.slow - 0.08*(t.lv-1));
const tTrapT = t => 3 + 0.8*(t.lv-1);
function upgradeAll(t) {
  const group = G.towers.filter(o=>o.type===t.type && o.lv===t.lv);
  if (t.lv>=MAX_TOWER_LV || !group.length) return 0;
  const total = towerUpCost(t)*group.length;
  if (G.res.gold < total) return 0;
  G.res.gold -= total;
  for (const o of group) { o.lv++; const ratio=o.hp/o.max; o.max=Math.round(TOWERS[o.type].hp*(1+0.4*(o.lv-1))); o.hp=Math.min(o.max,Math.max(o.hp,o.max*ratio+o.max*0.4)); G.stats.upgraded++; }
  return group.length;
}
function setTowerDir(mesh, d) { const a=mesh.getObjectByName('arrow'); if (a) a.rotation.y=Math.atan2(DIRS[d][0],DIRS[d][1]); }
function rotateTower(t) { t.dir=((t.dir||0)+1)%4; setTowerDir(t.mesh,t.dir); }
