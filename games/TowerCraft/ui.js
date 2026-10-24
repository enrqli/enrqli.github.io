'use strict';
const $ = id => document.getElementById(id);
let toastT = 0, menuOpen = false, menuTab = 'craft', lastSig = '';
function toast(msg) { const t=$('toast'); t.textContent=msg; t.style.opacity=1; clearTimeout(toastT); toastT=setTimeout(()=>t.style.opacity=0,2200); }
function flash() { const f=$('flash'); f.style.opacity=.35; setTimeout(()=>f.style.opacity=0,120); }
const towerKeys = Object.keys(TOWERS);

G.tool = 'axe'; G.up = {mine:0, move:0, atk:0, drops:0}; G.speed = 1;
const UPS = {mine:{n:'Mining speed',d:'+25% mining speed per level'}, move:{n:'Movement speed',d:'+15% move speed per level'}, atk:{n:'Attack speed',d:'+25% attack speed per level'}, drops:{n:'Resource drops',d:'+1 resource per mined node and +20% enemy drops per level'}};
const upCost = k => 15*(G.up[k]+1), MAX_UP = 5;
function buildHotbar() {
  const hb=$('hotbar'); hb.innerHTML='';
  if (G.phase==='day') {
    toolKeys.forEach((k,i)=>{
      const d=document.createElement('div');
      d.className='slot'+(G.tool===k?' sel':'');
      d.innerHTML=`<b>${i+1}</b><img alt='${TOOLS[k].n}' title='${TOOLS[k].n}'>`; toolIcon(k,u=>{d.querySelector('img').src=u;}); d.style.borderColor=G.tool===k?'#ffd23f':TOOLS[k].col;
      d.onclick=()=>{G.tool=k;refreshUI(true);};
      hb.appendChild(d);
    });
    return;
  }
  towerKeys.forEach((k,i)=>{
    const T=TOWERS[k], d=document.createElement('div');
    d.className='slot'+(G.sel===k?' sel':'')+(G.unlocked[k]?'':' lock');
    d.innerHTML=`<b>${i+1}</b>${T.n}<span class="n">${G.inv[k]||''}</span>`;
    d.onclick=()=>{G.sel=k;refreshUI(true);};
    hb.appendChild(d);
  });
}
const costHtml = c => Object.keys(c).map(k=>`<span class="${G.res[k]>=c[k]?'ok':'bad'}">${c[k]} ${RES[k].n}</span>`).join('');
function menuHtml() {
  const tabs=[['craft','Towers'],['player','Warden'],['helpers','Helpers'],['base','Sunstone']];
  let h=`<div class="tabs">${tabs.map(([k,n])=>`<button data-tab="${k}" class="${menuTab===k?'on':''}">${n}</button>`).join('')}<button data-close="1">Close (E)</button></div>`;
  if (menuTab==='craft') {
    h+='<h3>Warden Codex</h3>';
    for (const k of towerKeys) {
      const T=TOWERS[k];
      h+=`<div class="row"><div class="nm">${T.n}</div><div class="ds">${T.d}</div><div class="cost">${costHtml(T.cost)}</div>`;
      h+=G.unlocked[k] ? `<button data-c="${k}" ${canAfford(T.cost)?'':'disabled'}>Craft</button>` : `<button data-u="${k}" ${G.res.gold>=T.unlock?'':'disabled'}>Unlock ${T.unlock} Gold</button>`;
      h+='</div>';
    }
  } else if (menuTab==='player') {
    h+='<h3>Warden upgrades</h3>';
    for (const k in UPS) h+=`<div class="row"><div class="nm">${UPS[k].n} Lv${G.up[k]}/${MAX_UP}</div><div class="ds">${UPS[k].d}</div><button data-pu="${k}" ${G.up[k]>=MAX_UP||G.res.gold<upCost(k)?'disabled':''}>${G.up[k]>=MAX_UP?'Max level':'Upgrade '+upCost(k)+' Gold'}</button></div>`;
  } else if (menuTab==='helpers') {
    h+='<h3>Hire Helpers</h3>';
    for (const k in HELPERS) {
      const H=HELPERS[k], n=G.helpers.filter(x=>x.kind===k).length;
      h+=`<div class="row"><div class="nm">${H.n} (${n}/${H.max})</div><div class="ds">${H.d}</div>
      <button data-h="${k}" ${n>=H.max||G.res.gold<H.cost?'disabled':''}>Hire ${H.cost} Gold</button></div>`;
    }
    h+='<h3>Gatherer priorities</h3><div class="ds">Higher = gathered first. 0 = ignored.</div>';
    for (const k in G.prio) h+=`<div class="row"><span style="color:${RES[k].c}">${RES[k].n}</span> <button data-pm="${k}">-</button><b> ${G.prio[k]} </b><button data-pp="${k}">+</button></div>`;
  } else {
    h+=`<h3>The Sunstone (Lv ${G.shrineLv})</h3><div class="ds">HP ${Math.ceil(G.shrineHp)} / ${G.shrineMax}</div>
    <div class="row"><button data-heal="1" ${G.res.gold<5||G.shrineHp>=G.shrineMax?'disabled':''}>Heal +100 (5 Gold)</button>
    <button data-sup="1" ${G.shrineLv>=MAX_SHRINE_LV||G.res.gold<shrineUpCost()?'disabled':''}>${G.shrineLv>=MAX_SHRINE_LV?'Max level':'Upgrade +100 max HP ('+shrineUpCost()+' Gold)'}</button></div>
    <h3 style="color:#d36bff">Crystals (${G.res.crystal})</h3><div class="row"><button data-cheal="1" ${G.res.crystal<2||G.shrineHp>=G.shrineMax?'disabled':''}>Full heal Sunstone (2 Crystals)</button>
    <button data-cmax="1" ${G.res.crystal<3?'disabled':''}>+250 max HP & heal (3 Crystals)</button>
    <button data-csell="1" ${G.res.crystal<1?'disabled':''}>Sell 1 for 60 Gold</button></div>`;
  }
  return h;
}
function buildMenu() {
  const m=$('menu'); m.innerHTML=menuHtml();
  const on=(sel,fn)=>m.querySelectorAll(sel).forEach(b=>b.onclick=()=>{fn(b);refreshUI(true);});
  on('[data-tab]',b=>menuTab=b.dataset.tab);
  on('[data-close]',()=>toggleMenu(false));
  on('[data-c]',b=>{ if(craft(b.dataset.c)) toast('Crafted '+TOWERS[b.dataset.c].n); });
  on('[data-u]',b=>{ if(unlock(b.dataset.u)) toast('Unlocked '+TOWERS[b.dataset.u].n); });
  on('[data-pu]',b=>{ const k=b.dataset.pu; if (G.up[k]<MAX_UP && G.res.gold>=upCost(k)) { G.res.gold-=upCost(k); G.up[k]++; G.stats.upgraded++; toast(UPS[k].n+' upgraded'); } });
  on('[data-pm]',b=>G.prio[b.dataset.pm]=Math.max(0,G.prio[b.dataset.pm]-1));
  on('[data-pp]',b=>G.prio[b.dataset.pp]=Math.min(5,G.prio[b.dataset.pp]+1));
  on('[data-h]',b=>{ if(hireHelper(b.dataset.h)) toast('Helper hired'); });
  on('[data-heal]',()=>healShrine());
  on('[data-cheal]',()=>{ if(G.res.crystal>=2){ G.res.crystal-=2; G.shrineHp=G.shrineMax; toast('Sunstone fully healed'); } });
  on('[data-cmax]',()=>{ if(G.res.crystal>=3){ G.res.crystal-=3; G.shrineMax+=250; G.shrineHp=Math.min(G.shrineMax,G.shrineHp+250); toast('Sunstone empowered +250 max HP'); } });
  on('[data-csell]',()=>{ if(G.res.crystal>=1){ G.res.crystal--; G.res.gold+=60; toast('+60 gold'); } });
  on('[data-sup]',()=>{ if(upgradeShrine()) toast('Sunstone upgraded'); });
}
function toggleMenu(open) {
  menuOpen = open===undefined ? !menuOpen : open;
  $('menu').classList.toggle('hidden', !menuOpen);
  if (menuOpen) { if (document.pointerLockElement) document.exitPointerLock(); buildMenu(); }
}
function refreshUI(force) {
  const r=G.res; $('res').innerHTML=Object.keys(RES).map(k=>`<div><i style="background:${RES[k].c}"></i>${RES[k].n}: ${r[k]}</div>`).join('');
  const sig=JSON.stringify([r,G.inv,G.unlocked,G.sel,G.tool,G.phase,G.prio,G.up,G.towers.map(t=>[t.lv,Math.ceil(t.hp)]),G.helpers.length,G.shrineLv,Math.ceil(G.shrineHp)]);
  if (force||sig!==lastSig) { lastSig=sig; buildHotbar(); if (menuOpen) buildMenu(); }
  const qi=questIdx(), q=QUESTS[qi];
  $('quest').innerHTML = '<h4>Objectives</h4>' + (q ? QUESTS.slice(Math.max(0,qi-1),qi+3).map(x=>{
    const i=QUESTS.indexOf(x), done=G.questDone[i];
    return `<div class="${done?'done':''}">${done?'[x]':'[ ]'} ${x.t}${done?'':' ('+Math.min(G.stats[x.k],x.n)+'/'+x.n+', +'+x.gold+'g)'}</div>`;
  }).join('') : '<div>All objectives complete!</div>');
}
let popTower = null;
function towerStats(t) {
  const T=TOWERS[t.type], f=x=>Math.round(x*10)/10;
  let s=`HP ${Math.ceil(t.hp)}/${t.max}`;
  if (T.dmg) s+=` | Damage ${f(tDmg(t))}`;
  if (T.range) s+=` | Range ${f(tRange(t))}`;
  if (t.type==='bomb') s+=` | Blast ${f(tAoe(t))}`;
  if (t.type==='ice') s+=` | Slow ${Math.round((1-tSlow(t))*100)}%`;
  if (t.type==='trap') s+=` | Hold ${f(tTrapT(t))}s`;
  if (t.type==='poison') s+=` | Poison ${5+(t.lv-1)}s`;
  if (t.type==='fire') s+=` | Burn ${f(3.5+(t.lv-1))}s`;
  if (t.type==='resource') s+=` | Every ${f(TOWERS.resource.rate/(1+0.3*(t.lv-1)))}s`;
  return s;
}
function showTowerPop(t) {
  popTower = t; const p=$('tpop'); if (!t) { p.classList.add('hidden'); return; }
  const max=t.lv>=MAX_TOWER_LV, group=G.towers.filter(o=>o.type===t.type&&o.lv===t.lv), allCost=towerUpCost(t)*group.length;
  p.classList.remove('hidden');
  p.innerHTML=`<h3>${TOWERS[t.type].n} Lv${t.lv}</h3><div class="ds">${towerStats(t)}</div><div class="ds">Upgrade boosts health, damage, range and special effect.</div>
  <button id="tup" ${max||G.res.gold<towerUpCost(t)?'disabled':''}>${max?'Max level':'Upgrade '+towerUpCost(t)+' Gold'}</button>
  <button id="tall" ${max||group.length<2||G.res.gold<allCost?'disabled':''}>Upgrade all ${group.length} ${TOWERS[t.type].n} Lv${t.lv} (${allCost} Gold)</button>${t.type==='pierce'?'<button id="trot">Rotate ('+DIR_NAMES[t.dir||0]+')</button>':''}<button id="tx">Close</button>`;
  $('tup').onclick=()=>{ if(upgradeTower(t)) toast('Tower upgraded'); showTowerPop(t); };
  $('tall').onclick=()=>{ const n=upgradeAll(t); if(n) toast(n+' towers upgraded'); showTowerPop(t); };
  if ($('trot')) $('trot').onclick=()=>{ rotateTower(t); showTowerPop(t); };
  $('tx').onclick=()=>showTowerPop(null);
}
function waveHtml(list) {
  const c=waveCounts(list);
  return Object.keys(c).map(k=>`<span style="margin-right:10px">${c[k]}x ${ENEMIES[k].n}</span>`).join('');
}
function showCard(html, btn, cb) {
  const ov=$('ov'); ov.classList.remove('hidden');
  ov.innerHTML=`<div class="card">${html}<button id="go">${btn}</button></div>`;
  $('go').onclick=()=>{ov.classList.add('hidden');cb&&cb();};
}
function updateHud() {
  const names={day:'DAY',prep:'NIGHT FALLS - PREPARE',night:'NIGHT'};
  $('phase').textContent=(names[G.phase]||'')+' '+G.wave;
  const skip=$('skip');
  if (G.phase==='night') {
    skip.classList.add('hidden');
    $('timer').textContent=(G.enemies.length+G.spawnQ.length)+' foes left';
    $('sub').textContent=G.wave>=SHARK_WAVE?'Sharky eats everything it touches!':G.wave===BOSS_WAVE?'Defeat the Boss, Aldric!':'Defend the Sunstone';
  } else {
    skip.classList.remove('hidden'); skip.textContent=G.phase==='day'?'Skip day':'Skip preparation';
    const m=Math.max(0,Math.ceil(G.t)); $('timer').textContent=Math.floor(m/60)+':'+String(m%60).padStart(2,'0');
    $('sub').textContent=G.phase==='day'?'Gather, craft (E), then return at dusk':'Place or move towers';
  }
  $('shv').textContent=Math.max(0,Math.ceil(G.shrineHp))+'/'+G.shrineMax; $('shl').textContent=G.shrineLv;
  $('shb').style.width=Math.max(0,G.shrineHp/G.shrineMax*100)+'%';
  $('plv').textContent=Math.max(0,Math.ceil(G.player.hp)); $('plb').style.width=Math.max(0,G.player.hp/G.player.max*100)+'%';
  $('hint').textContent=G.phase==='day'?(locked?'Wheel or 1-3: tool | hold click (1 Axe: wood, 2 Pickaxe: stone, metal, ice, crystal, 3 Bucket: lava, poison) to mine | E: menu':'Click the game to look around | E: menu'):G.phase==='prep'?'Wheel: change slot | Q: rotate (hover a One Direction tower to turn it) | Shift+Wheel: zoom | Click: place tower near you | Right-drag: select towers to remove | Click a tower nearby: upgrade':'Space or click: attack | Right-click: place tower | Q: rotate One Direction (hover it) | V: third person | Wheel: zoom | R: repair | Click a nearby tower: upgrade';
  if (G.waveList) $('wave').innerHTML='<b>Wave '+G.wave+'</b><br>'+waveHtml(G.phase==='night'?G.spawnQ.concat(G.enemies.map(e=>e.type)):G.waveList);
  stone.rotation.y+=0.02; campStone.rotation.y+=0.02;
}
function liveCounts() {
  const c={}; for (const t of G.spawnQ) c[t]=(c[t]||0)+1; for (const e of G.enemies) c[e.type]=(c[e.type]||0)+1;
  return c;
}
function chip(k){ return `<i style="display:inline-block;width:10px;height:10px;background:${hexOf(ENEMIES[k].col)};border:1px solid #000;margin-right:3px"></i>`; }
const _hud = updateHud;
updateHud = function() {
  _hud();
  const night=G.phase==='night';
  $('spd').style.display=night?'block':'none';
  if (night) {
    const c=liveCounts();
    $('timer').innerHTML='<span style="font-size:15px">'+Object.keys(c).map(k=>`<span style="margin:0 6px;white-space:nowrap">${chip(k)}${c[k]}x ${ENEMIES[k].n}</span>`).join('')+'</span>';
  }
  const tc=$('tcount');
  if (G.phase==='day') {
    tc.classList.remove('hidden');
    tc.innerHTML='<b>Towers (in hand / placed)</b>'+towerKeys.map(k=>`<div>${TOWERS[k].n}: ${G.inv[k]} / ${G.towers.filter(t=>t.type===k).length}</div>`).join('');
  } else tc.classList.add('hidden');
  if (G.waveList) $('wave').innerHTML='<b>Wave '+G.wave+'</b><br>'+(night?Object.keys(liveCounts()).map(k=>`<div>${chip(k)}${liveCounts()[k]}x ${ENEMIES[k].n}</div>`).join(''):Object.keys(waveCounts(G.waveList)).map(k=>`<div>${chip(k)}${waveCounts(G.waveList)[k]}x ${ENEMIES[k].n}${ENEMIES[k].elem?' ('+ENEMIES[k].elem+' immune)':''}</div>`).join(''));
};
