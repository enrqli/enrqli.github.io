'use strict';
const M = c => new THREE.MeshLambertMaterial({color:c});
const sph = (r,c,x,y,z,sx,sy,sz) => { const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),M(c)); m.position.set(x,y,z); if (sx) m.scale.set(sx,sy,sz); return m; };
const cyl = (rt,rb,h,c,x,y,z) => { const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,10),M(c)); m.position.set(x,y,z); return m; };
const cone = (r,h,c,x,y,z) => cyl(0,r,h,c,x,y,z);
const oct = (r,c,x,y,z) => { const m=new THREE.Mesh(new THREE.OctahedronGeometry(r),M(c)); m.position.set(x,y,z); return m; };
const eyes = (g,s,y,z) => { g.add(sph(s*.09,0xff2a2a,-s*.2,y,z), sph(s*.09,0xff2a2a,s*.2,y,z)); };
function buildEnemy(type, E, g) {
  const s = E.r*2, c = E.col; let body;
  if (ENEMY_CELLS[type]) { body = makeEnemySprite(type==='small'?'brood':type, type==='small'?s*1.7+0.2:s*1.7+0.5); g.add(body); return body; }
  switch (type) {
    case 'normal': // blob with ears
      body = sph(s*.55,c,0,s*.55,0,1,.95,1); g.add(body, cone(s*.16,s*.35,0x4a2a80,-s*.3,s*1.1,0), cone(s*.16,s*.35,0x4a2a80,s*.3,s*1.1,0)); eyes(g,s,s*.65,s*.48); break;
    case 'fast': // sleek wedge on legs
      body = sph(s*.5,c,0,s*.55,0,.7,.7,1.5); g.add(body, cone(s*.14,s*.6,0xffffff,0,s*.75,-s*.65), cyl(s*.05,s*.05,s*.4,0xffffff,-s*.2,s*.2,s*.2), cyl(s*.05,s*.05,s*.4,0xffffff,s*.2,s*.2,-s*.2)); eyes(g,s,s*.65,s*.6); break;
    case 'tank': // armoured dome with spikes
      body = sph(s*.6,c,0,s*.55,0,1.05,.85,1.05); g.add(body, cyl(s*.65,s*.7,s*.25,0x333845,0,s*.2,0), cone(s*.12,s*.4,0xb0b6c8,-s*.4,s*1.0,0), cone(s*.12,s*.4,0xb0b6c8,s*.4,s*1.0,0), cone(s*.12,s*.4,0xb0b6c8,0,s*1.1,-s*.3)); eyes(g,s,s*.6,s*.55); break;
    case 'brood': // egg sac with pods
      body = sph(s*.55,c,0,s*.55,0,1,1.15,1); g.add(body); for (const [x,z] of [[-.4,-.2],[.35,.25],[0,-.45],[.3,-.3]]) g.add(sph(s*.17,0xe87ac0,x*s,s*(.6+Math.random()*.4),z*s)); eyes(g,s,s*.7,s*.5); break;
    case 'small':
      body = sph(s*.5,c,0,s*.5,0); g.add(body, sph(s*.18,0xffc0e0,0,s*1.0,0)); eyes(g,s,s*.55,s*.42); break;
    case 'breaker': // brute with pickaxe
      body = cyl(s*.4,s*.55,s*1.0,c,0,s*.5,0); g.add(body, sph(s*.3,0xe0a060,0,s*1.15,0), cyl(s*.05,s*.05,s*1.3,0x6a4a2a,s*.6,s*.8,s*.3), cone(s*.25,s*.6,0xaaaaaa,s*.6,s*1.5,s*.3)); eyes(g,s,s*1.2,s*.25); break;
    case 'fireimp': // flame teardrop
      body = sph(s*.45,c,0,s*.5,0,1,1.1,1); g.add(body, cone(s*.32,s*.8,0xffdd30,0,s*1.15,0), cone(s*.14,s*.4,0xff3000,-s*.3,s*1.0,0), cone(s*.14,s*.4,0xff3000,s*.3,s*1.0,0)); eyes(g,s,s*.6,s*.4); break;
    case 'frost': // crystal golem
      body = oct(s*.55,c,0,s*.6,0); g.add(body, oct(s*.22,0xffffff,-s*.55,s*.8,0), oct(s*.22,0xffffff,s*.55,s*.8,0), cone(s*.15,s*.5,0x5ab8e8,0,s*1.3,0)); eyes(g,s,s*.65,s*.4); break;
    case 'boss': // horned demon
      body = sph(s*.55,c,0,s*.6,0,1,1.1,1); g.add(body, cone(s*.12,s*.7,0xffc400,-s*.3,s*1.35,0), cone(s*.12,s*.7,0xffc400,s*.3,s*1.35,0), cyl(s*.5,s*.5,s*.1,0xffc400,0,s*1.1,0), cone(s*.1,s*.4,0xff2a2a,0,s*1.35,s*.25)); eyes(g,s,s*.75,s*.5); break;
    case 'shark': // shark
      body = sph(s*.5,c,0,s*.5,0,.8,.8,2); g.add(body, cone(s*.2,s*.8,0x2a5a80,0,s*1.1,-s*.1), sph(s*.35,0xffffff,0,s*.35,s*.35,.9,.5,1.4), cone(s*.25,s*.7,c,0,s*.55,-s*.95)); eyes(g,s,s*.65,s*.7); break;
    default: body = sph(s*.55,c,0,s*.55,0); g.add(body); eyes(g,s,s*.65,s*.48);
  }
  return body;
}
function spawnEnemy(type, x, z, wp) {
  const E = ENEMIES[type], g = new THREE.Group(), s = E.r*2;
  const body = buildEnemy(type, E, g);
  const hbBack = box(s+0.4,.14,.14,0x000000,0,s*1.5+0.6,0), hb = box(s+0.3,.16,.16,0xff3a3a,0,s*1.5+0.62,0);
  const hbg = new THREE.Group(); hbg.add(hbBack, hb); g.add(hbg);
  g.position.set(x,0,z); nightGroup.add(g);
  const hpMul = 1 + 0.2*(G.wave-1), hp0 = Math.round(E.hp*(E.boss||E.shark ? 1+0.05*(G.wave-1) : hpMul));
  const e = {type, hp:hp0, max:hp0, hb, hbg, hbw:s+0.3, x, z, wp:wp||1, off:rnd(-0.5,0.5), mesh:g, body, slowT:0, trapT:0, poisonT:0, burnT:0, atkCd:0, dead:false, flash:0, wob:Math.random()*6};
  G.enemies.push(e); return e;
}
function dropFor(e) {
  const E = ENEMIES[e.type]; G.res.gold += E.gold;
  const n = E.boss||E.shark ? 12 : (Math.random()<0.6 ? 1 : 0);
  const pool = ['wood','wood','stone','stone','metal','metal','ice','poison','lava'];
  for (let i=0;i<n;i++) G.res[pool[Math.floor(Math.random()*pool.length)]]++;
}
function hurt(e, d, src) {
  if (e.dead) return;
  const el = ENEMIES[e.type].elem;
  if (src==='fire' && el==='fire') return;
  if (src==='ice' && el==='ice') return;
  if (src==='fire' && el==='ice') d *= 2.5;
  if (src==='ice' && el==='fire') d *= 1.5;
  e.hp -= d; e.flash = 0.12;
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; nightGroup.remove(e.mesh);
  G.enemies.splice(G.enemies.indexOf(e),1);
  dropFor(e);
  G.stats.kills++;
  if (e.type==='breaker') G.stats.breakers++;
  if (e.type==='boss') G.stats.boss++;
  if (e.type==='shark') G.stats.shark++;
  if (e.type==='brood') for (let i=0;i<5;i++) spawnEnemy('small', e.x+rnd(-1,1), e.z+rnd(-1,1), e.wp);
}
function burst(x,z,r,col) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r,8,6), new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.6}));
  m.position.set(x,0.6,z); addFx(m,0.3,0,2);
}
function beam(x1,z1,x2,z2,col) {
  const len = Math.hypot(x2-x1,z2-z1), m = box(0.15,0.15,len,col,(x1+x2)/2,1.8,(z1+z2)/2);
  m.rotation.y = Math.atan2(x2-x1, z2-z1); addFx(m,0.12,0,0);
}
function nearestEnemy(x, z, range) {
  let b=null, bd=range;
  for (const e of G.enemies) { const d=Math.hypot(e.x-x,e.z-z); if (d<bd){bd=d;b=e;} }
  return b;
}
function shoot(t, e) {
  const T = TOWERS[t.type];
  const m = new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.25), new THREE.MeshBasicMaterial({color: t.type==='bomb'?0x111111:T.col}));
  m.position.set(t.x,2,t.z); nightGroup.add(m);
  G.proj.push({m, x:t.x, z:t.z, e, type:t.type, dmg:tDmg(t), aoe:tAoe(t), pdur:5+(t.lv-1), sp:t.type==='bomb'?9:16});
}
function updateTowers(dt) {
  const _now = performance.now()/1000;
  for (const t of G.towers) {
    const sp = t.mesh.children[0]; if (!sp || !sp.isSprite) continue;
    if (!sp.userData.bs) sp.userData.bs = sp.scale.clone();
    if (t.pcd!==undefined && t.cd>t.pcd) t.kick = 1;
    t.pcd = t.cd; t.kick = Math.max(0,(t.kick||0)-dt*5);
    const b = sp.userData.bs, ph = _now*2+t.x*1.7+t.z*.9, k = t.kick;
    sp.scale.set(b.x*(1+Math.sin(ph)*.012+k*.1), b.y*(1+Math.cos(ph)*.02-k*.08), 1);
    sp.material.rotation = Math.sin(ph*.7)*.015;
  }
  for (const t of G.towers) {
    const T = TOWERS[t.type]; t.cd -= dt;
    const bar = t.mesh.getObjectByName('bar'); bar.scale.x = Math.max(0.01, t.hp/t.max); bar.visible = t.hp<t.max;
    const lv = t.mesh.getObjectByName('lv'); lv.visible = t.lv>1; lv.scale.setScalar(t.lv-0.5);
    if (t.type==='resource') {
      if (t.cd<=0) { t.cd=T.rate/(1+0.3*(t.lv-1)); const k=['wood','stone','gold','metal'][Math.floor(Math.random()*4)]; G.res[k]++; toast('Resource tower: +1 '+RES[k].n); }
      continue;
    }
    if (t.type==='ice') { for (const e of G.enemies) if (Math.hypot(e.x-t.x,e.z-t.z)<tRange(t)) { if (ENEMIES[e.type].elem!=='ice') { e.slowT=0.3; e.slowF=Math.min(e.slowF||1,tSlow(t)); } if (ENEMIES[e.type].elem==='fire') hurt(e,6*(1+0.5*(t.lv-1))*dt,'ice'); } continue; }
    if (t.cd>0) continue;
    if (t.type==='trap') {
      const e = G.enemies.find(e=>e.trapT<=0 && !ENEMIES[e.type].shark && Math.hypot(e.x-t.x,e.z-t.z)<tRange(t));
      if (e) { t.cd=tRate(t); e.trapT=tTrapT(t); hurt(e,tDmg(t)); burst(t.x,t.z,.8,0x6a4a2a); }
      continue;
    }
    if (t.type==='pierce') {
      const [ux,uz]=DIRS[t.dir||0], R=ux>0?HALF-t.x:ux<0?HALF+t.x:uz>0?HALF-t.z:HALF+t.z;
      const hit=G.enemies.filter(o=>{ const ox=o.x-t.x, oz=o.z-t.z, along=ox*ux+oz*uz, side=Math.abs(ox*uz-oz*ux); return along>0 && along<R && side<ENEMIES[o.type].r+0.5; });
      if (!hit.length) continue;
      t.cd = tRate(t);
      beam(t.x,t.z,t.x+ux*R,t.z+uz*R,0xff5050);
      for (const o of hit) hurt(o,tDmg(t));
      continue;
    }
    const e = nearestEnemy(t.x,t.z,tRange(t)); if (!e) continue;
    t.cd = tRate(t);
    if (t.type==='fire') { beam(t.x,t.z,e.x,e.z,0xff7a1a); if (ENEMIES[e.type].elem!=='fire') e.burnT=3.5+(t.lv-1); hurt(e,tDmg(t),'fire'); }
    else shoot(t,e);
  }
}
function updateProj(dt) {
  for (const p of G.proj.slice()) {
    const e = p.e;
    if (e.dead) { nightGroup.remove(p.m); G.proj.splice(G.proj.indexOf(p),1); continue; }
    const dx=e.x-p.x, dz=e.z-p.z, d=Math.hypot(dx,dz), st=p.sp*dt;
    if (d<=st+0.4) {
      if (p.type==='bomb') {
        const R=p.aoe||TOWERS.bomb.aoe; burst(e.x,e.z,R,0xffa030);
        for (const o of G.enemies.slice()) if (Math.hypot(o.x-e.x,o.z-e.z)<R) hurt(o,p.dmg);
      } else { hurt(e,p.dmg); if (p.type==='poison') e.poisonT=p.pdur; }
      nightGroup.remove(p.m); G.proj.splice(G.proj.indexOf(p),1);
    } else { p.x+=dx/d*st; p.z+=dz/d*st; p.m.position.set(p.x,2,p.z); }
  }
}
function updateEnemies(dt) {
  const pl = G.player;
  for (const e of G.enemies.slice()) {
    const E = ENEMIES[e.type];
    e.atkCd -= dt; e.flash -= dt; e.wob += dt*6;
    if (e.poisonT>0) { e.poisonT-=dt; hurt(e,TOWERS.poison.dmg*dt); }
    if (e.burnT>0) {
      e.burnT-=dt; hurt(e,TOWERS.fire.dmg*dt,'fire');
      if (Math.random()<0.9*dt) { const o=G.enemies.find(o=>o!==e&&o.burnT<=0&&ENEMIES[o.type].elem!=='fire'&&Math.hypot(o.x-e.x,o.z-e.z)<1.6); if(o) o.burnT=3; }
    }
    if (e.dead) continue;
    const slow = e.slowT>0 ? (e.slowF||TOWERS.ice.slow) : 1; e.slowT-=dt; if (e.slowT<=0) e.slowF=1;
    // path following
    const wpt = PATH[Math.min(e.wp, PATH.length-1)];
    let dx=wpt[0]-e.x, dz=wpt[1]-e.z, d=Math.hypot(dx,dz);
    const atEnd = e.wp >= PATH.length-1;
    if (d<0.4 && !atEnd) { e.wp++; }
    // tower interaction
    let blocker=null, bd=E.breaker ? E.r+2.2 : E.r+0.8;
    for (const t of G.towers) { const dd=Math.hypot(t.x-e.x,t.z-e.z); if (dd<bd) { bd=dd; blocker=t; } }
    if (E.shark) for (const t of G.towers.slice()) if (Math.hypot(t.x-e.x,t.z-e.z)<E.r+1) destroyTower(t);
    const toShrine = Math.hypot(SHRINE.x-e.x, SHRINE.z-e.z) < E.r+2.2;
    if (e.trapT>0) e.trapT-=dt;
    else if (blocker && E.breaker) { /* stop and smash */ }
    else if (!toShrine) { const s=E.sp*slow*dt; if (d>0.01) { e.x+=dx/d*s; e.z+=dz/d*s; } }
    if (e.atkCd<=0) {
      if (toShrine) { e.atkCd=1; G.shrineHp-=E.dmg; flash(); }
      else if (blocker) { e.atkCd=1; blocker.hp-=E.dmg*(E.breaker?1.5:0.6); if (blocker.hp<=0) destroyTower(blocker); }
      else if (Math.hypot(pl.x-e.x,pl.z-e.z)<E.r+0.6) { e.atkCd=1; pl.hp-=E.dmg; flash(); }
    }
    e.mesh.position.set(e.x, Math.abs(Math.sin(e.wob))*0.15, e.z);
    e.mesh.rotation.y = Math.atan2(dx,dz);
    if (e.body.isSprite) {
      if (!e.body.userData.bs) e.body.userData.bs = e.body.scale.clone();
      const b = e.body.userData.bs, s = Math.sin(e.wob*2), spd = e.trapT>0 ? 0 : 1;
      e.body.scale.set(b.x*(1-s*.06*spd), b.y*(1+s*.08*spd), 1);
      e.body.material.rotation = Math.sin(e.wob)*.08*spd;
    }
    const f = Math.max(0.01, e.hp/e.max); e.hb.scale.x = f; e.hb.position.x = -(1-f)*e.hbw/2; e.hbg.rotation.y = -e.mesh.rotation.y;
    e.body.material.color.setHex(e.flash>0 ? 0xff8080 : (e.burnT>0 ? 0xff9a4a : (e.poisonT>0 ? 0xb4f060 : (e.slowT>0 ? 0x9aeaff : 0xffffff))));
  }
}
function updateFx(dt) {
  for (const f of G.fx.slice()) {
    f.life-=dt; f.mesh.position.y+=f.vy*dt;
    if (f.grow) f.mesh.scale.addScalar(f.grow*dt);
    if (f.life<=0) { fxGroup.remove(f.mesh); G.fx.splice(G.fx.indexOf(f),1); }
  }
}
function playerAttack() {
  const p = G.player; if (p.cd>0) return; p.cd=0.4/(1+0.25*G.up.atk);
  const ax=p.aim.x-p.x, az=p.aim.z-p.z, L=Math.hypot(ax,az)||1, ux=ax/L, uz=az/L;
  p.swing=0.001;
  const phi=Math.atan2(-uz,ux), arc=new THREE.Mesh(new THREE.RingGeometry(1.1,2.6,20,1,phi-1.0,2.0), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.55,side:THREE.DoubleSide}));
  arc.rotation.x=-Math.PI/2; arc.position.set(p.x,0.9,p.z); addFx(arc,0.16,0,0.4);
  for (const e of G.enemies.slice()) {
    const dx=e.x-p.x, dz=e.z-p.z, d=Math.hypot(dx,dz);
    if (d<2.4+ENEMIES[e.type].r && (dx*ux+dz*uz)/(d||1)>0.2) hurt(e,14);
  }
}

// ---------- helpers ----------
G.prio = {wood:2,stone:2,metal:2,ice:1,poison:1,lava:1,crystal:1};
function hireHelper(kind) {
  const H = HELPERS[kind], count = G.helpers.filter(h=>h.kind===kind).length;
  if (count >= H.max || G.res.gold < H.cost) return false;
  G.res.gold -= H.cost; G.stats.hired++;
  const g = new THREE.Group();
  g.add(box(.6,.9,.6,H.col,0,.45,0), box(.45,.45,.45,0xf0c8a0,0,1.15,0));
  scene.add(g);
  G.helpers.push({kind, mesh:g, x:DAYC.x+rnd(-2,2), z:DAYC.z+rnd(-2,2), area:'day', target:null, cd:0});
  return true;
}
function pickNode(h) {
  let best=null, bs=-1e9;
  for (const n of nodes) {
    if (!n.alive || (n.claimed && n.claimedBy!==h)) continue;
    const p = G.prio[n.type]; if (!p) continue;
    const s = p*40 - Math.hypot(n.x-h.x,n.z-h.z);
    if (s>bs) { bs=s; best=n; }
  }
  if (best) { best.claimed=true; best.claimedBy=h; }
  return best;
}
function updateHelpers(dt) {
  const night = G.phase==='night' || G.phase==='prep';
  for (const h of G.helpers) {
    h.cd -= dt;
    const home = night ? {x:SHRINE.x, z:SHRINE.z-4} : {x:DAYC.x, z:DAYC.z+2};
    if (h.area !== (night?'night':'day')) { h.area = night?'night':'day'; h.x = home.x+rnd(-3,3); h.z = home.z+rnd(-2,2); if (h.target) h.target.claimed=false; h.target=null; }
    let tx=null, tz=null, reach=1.2, act=null;
    if (h.kind==='gatherer' && !night) {
      if (!h.target || !h.target.alive) h.target = pickNode(h);
      if (h.target) { tx=h.target.x; tz=h.target.z; reach=1.6; act='mine'; }
    } else if (h.kind==='gatherer' && G.phase==='night') {
      let t=null, bd=1e9; for (const o of G.towers) if (o.hp<o.max) { const d=Math.hypot(o.x-h.x,o.z-h.z); if (d<bd){bd=d;t=o;} }
      if (t) { tx=t.x; tz=t.z; reach=1.8; act={t}; }
      else if (G.shrineHp<G.shrineMax) { tx=SHRINE.x; tz=SHRINE.z; reach=3.2; act='shrine'; }
    } else if (h.kind==='fighter' && G.phase==='night') {
      let t=null, bd=1e9; for (const e of G.enemies) { const d=Math.hypot(e.x-h.x,e.z-h.z); if (d<bd){bd=d;t=e;} }
      if (t) { tx=t.x; tz=t.z; reach=1.6; act={e:t}; }
    }
    if (tx===null) { tx=home.x; tz=home.z; reach=2.5; act=null; }
    const dx=tx-h.x, dz=tz-h.z, d=Math.hypot(dx,dz);
    if (d>reach) { h.x+=dx/d*4*dt; h.z+=dz/d*4*dt; h.mesh.rotation.y=Math.atan2(dx,dz); }
    else if (h.cd<=0 && act) {
      if (act==='mine') {
        h.cd=0.7; const n=h.target; n.hp--; n.g.scale.set(1.15,.9,1.15); setTimeout(()=>n.g.scale.set(1,1,1),80);
        if (n.hp<=0) { const T=NODE_TYPES[n.type]; G.res[T.res]+=T.amt[0]+Math.floor(Math.random()*(T.amt[1]-T.amt[0]+1)); G.stats[T.res]++; killNode(n); h.target=null; }
      } else if (act==='shrine') { h.cd=0.5; G.shrineHp=Math.min(G.shrineMax,G.shrineHp+5); }
      else if (act.t) { h.cd=0.5; act.t.hp=Math.min(act.t.max,act.t.hp+8); }
      else if (act.e && !act.e.dead) { h.cd=0.6; hurt(act.e,9); burst(act.e.x,act.e.z,.5,0xff8080); }
    }
    h.mesh.position.set(h.x, 0, h.z);
  }
}
