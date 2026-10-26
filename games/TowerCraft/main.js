'use strict';
let locked = false;
const keys = {}, mouseGround = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const ghost = box(1,0.3,1,0xffff66,0,0.15,0); ghost.material.transparent=true; ghost.material.opacity=.5; scene.add(ghost);
const avatar = new THREE.Group();
const knight = new THREE.Group(); avatar.add(knight);
knight.add(box(.24,.65,.28,0x7c828c,-.17,.33,0), box(.24,.65,.28,0x7c828c,.17,.33,0),
  box(.78,.72,.46,0xc3c8d0,0,1,0), box(.82,.2,.5,0xd02a2a,0,1.4,0), box(.16,.4,.1,0xd02a2a,.2,1.15,.28),
  box(.24,.6,.26,0xaeb4bd,-.52,1.02,0), box(.24,.6,.26,0xaeb4bd,.52,1.02,0),
  box(.5,.5,.5,0xf0c8a0,0,1.75,0), box(.56,.18,.56,0x6b3f1e,0,2.07,0), box(.56,.4,.14,0x6b3f1e,0,1.9,-.27), box(.56,.2,.1,0x6b3f1e,0,1.98,.27),
  box(.08,.08,.04,0x222222,-.12,1.78,.26), box(.08,.08,.04,0x222222,.12,1.78,.26),
  box(.74,1.05,.08,0xb82424,0,.95,-.3));
const shield = new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.1,16), new THREE.MeshLambertMaterial({color:0x9a6a36}));
shield.rotation.x = Math.PI/2; shield.position.set(-.62,1.05,.2); knight.add(shield);
const rim = new THREE.Mesh(new THREE.TorusGeometry(.42,.04,6,16), new THREE.MeshLambertMaterial({color:0x8a9099}));
rim.position.set(-.62,1.05,.26); knight.add(rim);
knight.add(box(.26,.26,.05,0xe8b83a,-.62,1.05,.28), box(.14,.14,.05,0xb8861e,-.62,1.2,.29));
avatar.userData.blade = box(.15,1.4,.15,0xdddddd,.55,1,.4); avatar.add(avatar.userData.blade);
scene.add(avatar);

function story() {
  showCard(`<h2>The Legend</h2>${STORY.intro.map(s=>`<p>${s}</p>`).join('')}
  <div class="ctl">Gather by day, build towers at dusk, survive the night.</div>`,
  'Start', ()=>{G.started=true; startDay(true); cgStart();});
  const back=document.createElement('button'); back.textContent='Back'; back.style.marginLeft='12px';
  back.onclick=intro; $('go').after(back);
}
function intro() {
  const ov=$('ov'); ov.classList.remove('hidden');
  ov.innerHTML=`<div class="card" style="min-width:min(380px,86vw)"><h1>${TITLE}</h1>
  <p style="text-align:center;font-style:italic;margin:0 0 18px">Gather by day. Build at dusk. Survive the night.</p>
  <button id="hBegin" style="display:block;width:100%;margin:10px 0">Begin</button>
  <button id="hHow" style="display:block;width:100%;margin:10px 0">How to Play</button>
  <button id="hSet" style="display:block;width:100%;margin:10px 0">Settings</button></div>`;
  $('hBegin').onclick=story;
  $('hHow').onclick=()=>howToPlay();
  $('hSet').onclick=()=>toggleSettings(true);
}
const hKey=(t,w)=>`<span style="display:inline-block;min-width:${w||30}px;padding:6px 8px;margin:2px;background:#2b2548;border:2px solid #f6e7b4;border-bottom-width:5px;border-radius:6px;font:bold 14px monospace;text-align:center;color:#fff">${t}</span>`;
const hCirc=(inner,sz,bg)=>`<span style="display:inline-flex;align-items:center;justify-content:center;width:${sz||44}px;height:${sz||44}px;border-radius:50%;border:3px solid #000;box-shadow:2px 2px 0 #fff;background:${bg||'#ddd'};color:#000;font-size:20px;vertical-align:middle">${inner}</span>`;
const hRow=(pic,txt)=>`<div style="display:flex;align-items:center;gap:12px;margin:6px 0;text-align:left"><div style="flex:0 0 170px;text-align:center">${pic}</div><div style="font-family:Georgia,serif;font-size:17px;font-weight:bold">${txt}</div></div>`;
const MOUSE_SVG='<svg viewBox="0 0 40 56" width="34" height="48"><rect x="3" y="3" width="34" height="50" rx="17" fill="#2b2548" stroke="#f6e7b4" stroke-width="3"/><line x1="20" y1="3" x2="20" y2="24" stroke="#f6e7b4" stroke-width="3"/><line x1="3" y1="24" x2="37" y2="24" stroke="#f6e7b4" stroke-width="3"/><path d="M3 24 L3 20 Q3 3 20 3 L20 24Z" fill="#ffd23f" opacity=".85"/></svg>';
const MOUSE_R_SVG=MOUSE_SVG.replace('<path d="M3 24 L3 20 Q3 3 20 3 L20 24Z"','<path d="M37 24 L37 20 Q37 3 20 3 L20 24Z"');
function controlsHtml(m) {
  const T=k=>`<img src="${TOOL_PNG[k]}" style="width:26px;height:26px;image-rendering:pixelated;vertical-align:middle">`;
  const H=`<h3 style="color:#ffd23f;margin:14px 0 4px">Controls</h3>`;
  if (!m) return H+
  hRow(hKey('W',34)+'<br>'+hKey('A',34)+hKey('S',34)+hKey('D',34),'Move')+
  hRow(MOUSE_SVG,'Look (mouse)')+
  hRow(MOUSE_SVG+' hold','Collect / Attack')+
  hRow(MOUSE_R_SVG,'Place tower (night)')+
  hRow(hKey('SPACE',90),'Jump')+
  hRow(hKey('1')+hKey('2')+hKey('3')+'<br>'+T('axe')+T('pickaxe')+T('bucket'),'Change tool')+
  hRow(hKey('E'),'Menu')+
  hRow(hKey('R')+hKey('Q'),'Repair / Rotate');
  const stick='<span style="display:inline-block;width:76px;height:76px;border-radius:50%;border:3px solid #fff;background:#0006;position:relative"><span style="position:absolute;left:21px;top:21px;width:28px;height:28px;border-radius:50%;background:#fff"></span></span>';
  const bars='<span style="display:flex;flex-direction:column;gap:4px"><i style="display:block;width:20px;height:3px;background:#000"></i><i style="display:block;width:20px;height:3px;background:#000"></i><i style="display:block;width:20px;height:3px;background:#000"></i></span>';
  return H+
  hRow(stick,'Move')+
  hRow('<span style="font-size:30px">&#9758;</span>','Drag to look')+
  hRow(hCirc(T('pickaxe'),72),'Hold: collect')+
  hRow(hCirc('&#8644;',50),'Tap: change tool')+
  hRow(hCirc('&#8679;',58,'#8fd0ff'),'Jump')+
  hRow(hCirc(SWORD_SVG.replace(/width="46" height="46"/,'width="42" height="42"'),72),'Hold: attack')+
  hRow(hCirc('&#10003;',58,'#6fe06f'),'Place tower')+
  hRow(hCirc('&#8635;',50),'Rotate tower')+
  hRow(hCirc(bars,50),'Menu')+
  hRow('<span style="font-size:28px">&#9996;</span>','Pinch to zoom');
}
function howToPlay(mode) {
  const m = mode===undefined ? MOBILE : mode==='mobile';
  $('ov').classList.remove('hidden');
  $('ov').innerHTML=`<div class="card" style="max-height:88vh;overflow:auto"><h2>How to Play</h2>
  <div style="margin-bottom:8px"><button id="hKb" style="font-size:16px;${m?'':'background:#ffd23f;color:#000'}">Computer</button> <button id="hMob" style="font-size:16px;${m?'background:#ffd23f;color:#000':''}">Mobile</button></div>
  <p><b>Goal:</b> Keep the Sunstone alive. Monsters attack it every night.</p>
  <p><b>1. Day:</b> Collect wood, stone, metal, ice, lava and poison.<br>Axe = wood. Pickaxe = stone, metal, ice, crystal. Bucket = lava, poison.</p>
  <p><b>2. Craft:</b> Open the menu and turn resources into towers.</p>
  <p><b>3. Dusk:</b> Place towers beside the path. Traps go on the path.</p>
  <p><b>4. Night:</b> Towers shoot for you. You can fight too.</p>
  ${controlsHtml(m)}
  <button id="back">Back</button></div>`;
  $('back').onclick=intro;
  $('hKb').onclick=()=>howToPlay('keyboard'); $('hMob').onclick=()=>howToPlay('mobile');
}

function setSky(day) {
  const c = day?0x87ceeb:0x0a0a24; scene.background.setHex(c); scene.fog.color.setHex(c);
  sun.intensity=day?0.9:0.25; amb.intensity=day?0.6:0.4;
  scene.fog.near = day?20:40; scene.fog.far = day?60:120;
  portal.material.color.setHex(day?0x3a2a50:0xb040ff);
}
function startDay(first) {
  G.phase='day'; G.t=DAY_LEN; setSky(true); showArea(true); showTowerPop(null);
  for (const n of nodes) n.claimed=false;
  G.waveList = waveList(G.wave);
  const p=G.player; p.x=DAYC.x; p.z=DAYC.z+4; p.yaw=0; p.hp=p.max;
  $('cross').classList.remove('hidden');
  if (!first) toast('Day '+G.wave+' dawns');
}
function startPrep() {
  G.phase='prep'; G.t=PREP_LEN; setSky(false); showArea(false);
  if (document.pointerLockElement) document.exitPointerLock();
  const p=G.player; p.x=SHRINE.x; p.z=SHRINE.z-5; p.hp=p.max;
  $('cross').classList.add('hidden'); toast('Night falls! 1 minute to place towers');
}
function startNight() {
  G.phase='night'; G.spawnQ=G.waveList.slice(); G.spawnT=1; showTowerPop(null); $('sel').classList.add('hidden');
  toast(G.wave>=SHARK_WAVE ? 'SHARKY APPROACHES' : G.wave===BOSS_WAVE ? 'ALDRIC RISES' : 'Night '+G.wave+': Defend!');
  if (G.wave===BOSS_WAVE) setTimeout(()=>toast(STORY.boss),2600);
}
function endNight() {
  G.stats.nights++; G.over=true; showTowerPop(null); cgStop();
  const cleared=G.wave, bonus=10+cleared*3; G.res.gold+=bonus;
  const body = cleared===BOSS_WAVE ? `<p>${STORY.win}</p>` : '';
  G.wave++;
  showCard(`<h2>Wave ${cleared} Cleared!</h2>${body}<p>Sunstone: ${Math.ceil(G.shrineHp)}/${G.shrineMax} HP<br>Enemies defeated: ${G.stats.kills}<br>Bonus: +${bonus} gold</p>`,
    cleared===BOSS_WAVE?'Descend to the Deeper Gates':'Begin Day '+G.wave, ()=>{G.over=false; startDay(); cgStart();});
  if (!CG.ready) return;
  const adBtn=(label, grant, done)=>{
    const b=document.createElement('button'); b.textContent=label; b.style.cssText='display:block;margin:10px auto 0;font-size:16px';
    b.onclick=()=>{ b.disabled=true; cgRewarded(()=>{ grant(); b.textContent=done; }, ()=>{ b.textContent='No ad available'; }); };
    $('go').before(b);
  };
  adBtn('Double gold (watch an ad)', ()=>{ G.res.gold+=bonus; toast('+'+bonus+' bonus gold'); }, 'Gold doubled!');
  if (G.towers.some(t=>t.lv<MAX_TOWER_LV))
    adBtn('Free upgrade all towers (watch an ad)', freeUpgradeAll, 'Towers upgraded!');
}
function freeUpgradeAll() {
  let n=0;
  for (const o of G.towers) if (o.lv<MAX_TOWER_LV) { o.lv++; o.max=Math.round(TOWERS[o.type].hp*(1+0.4*(o.lv-1))); o.hp=o.max; G.stats.upgraded++; n++; }
  toast('Upgraded '+n+' towers!');
}
function revive() {
  G.reviveWave=G.wave; G.shrineHp=G.shrineMax; G.player.hp=G.player.max;
  for (const e of G.enemies.slice()) if (Math.hypot(e.x-SHRINE.x,e.z-SHRINE.z)<16) { e.dead=true; nightGroup.remove(e.mesh); G.enemies.splice(G.enemies.indexOf(e),1); }
  $('ov').classList.add('hidden'); G.over=false; G.phase='night'; cgStart();
  toast('The Sunstone is restored!');
}
function gameOver() {
  G.over=true; G.phase='over'; cgStop();
  showCard(`<h2>The Sunstone Shatters</h2><p>${STORY.lose}</p><p>You reached night ${G.wave}.</p>`, 'Try Again', ()=>location.reload());
  if (CG.ready && G.reviveWave!==G.wave) {
    const rv=document.createElement('button'); rv.textContent='Revive (watch an ad)'; rv.style.marginRight='12px';
    rv.onclick=()=>{ rv.disabled=true; cgRewarded(revive, ()=>{ rv.textContent='No ad available'; }); };
    $('go').before(rv);
  }
}
$('skip').onclick=()=>{ if (G.phase==='day') startPrep(); else if (G.phase==='prep') startNight(); };

// ---------- input ----------
const PLACE_R = 9, UPG_R = 5;
let jumpReq=false, mouseDown=false, mineCd=0, warnCd=0, drag=null;
addEventListener('keydown', e=>{ if (e.code==='Space' && G.started) e.preventDefault();
  if (!G.started||G.over) return;
  if (e.code==='KeyE') { toggleMenu(); return; }
  keys[e.code]=true;
  const n=parseInt(e.key);
  if (G.phase==='day') { if (n>=1&&n<=toolKeys.length) { G.tool=toolKeys[n-1]; refreshUI(true); } }
  else if (n>=1&&n<=8) { G.sel=towerKeys[n-1]; refreshUI(true); }
  if (e.code==='KeyR' && G.phase==='night') repairNear();
  if (e.code==='Space') e.preventDefault();
  if (e.code==='KeyQ' && (G.phase==='prep'||G.phase==='night')) { const ht=towerAt(mouseGround.x,mouseGround.z); if (ht && ht.type==='pierce' && Math.hypot(ht.x-G.player.x,ht.z-G.player.z)<=UPG_R) { rotateTower(ht); toast('Tower faces '+DIR_NAMES[ht.dir]); return; } G.placeDir=((G.placeDir||0)+1)%4; toast('One Direction tower faces '+DIR_NAMES[G.placeDir]); }
});
addEventListener('keyup', e=>keys[e.code]=false);
addEventListener('contextmenu', e=>e.preventDefault());
document.addEventListener('pointerlockchange', ()=>locked=document.pointerLockElement===canvas);
addEventListener('mousemove', e=>{
  if (G.phase==='day' && locked) { const p=G.player; p.yaw-=e.movementX*0.0025; p.pitch=Math.max(-1.3,Math.min(1.3,p.pitch-e.movementY*0.0025)); }
  ndc.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1);
  if (drag) {
    const s=$('sel'), x=Math.min(drag.x,e.clientX), y=Math.min(drag.y,e.clientY);
    s.style.left=x+'px'; s.style.top=y+'px'; s.style.width=Math.abs(e.clientX-drag.x)+'px'; s.style.height=Math.abs(e.clientY-drag.y)+'px';
    s.classList.remove('hidden');
  }
});
function updateMouseGround() {
  ray.setFromCamera(ndc,camera);
  const o=ray.ray.origin,d=ray.ray.direction; if (d.y>=0) return;
  const s=-o.y/d.y; mouseGround.set(o.x+d.x*s,0,o.z+d.z*s);
}
function nearTowerAt(x, z) {
  const t=towerAt(x,z), p=G.player;
  return t && Math.hypot(t.x-p.x,t.z-p.z)<=UPG_R ? t : null;
}
canvas.addEventListener('mousedown', e=>{
  if (!G.started||G.over||menuOpen) return;
  if (G.phase==='day') { if (!locked) canvas.requestPointerLock(); else mouseDown=true; return; }
  updateMouseGround(); const p=G.player;
  if (G.phase==='prep' && e.button===2) { drag={x:e.clientX,y:e.clientY}; return; }
  if (G.phase==='night' && e.button===2) { tryPlace(); return; }
  const t=nearTowerAt(mouseGround.x,mouseGround.z);
  if (t) { showTowerPop(t); return; }
  if (G.phase==='prep') { tryPlace(); return; }
  if (G.phase==='night') { G.player.aim.x=mouseGround.x; G.player.aim.z=mouseGround.z; playerAttack(); }
});
addEventListener('mouseup', e=>{
  if (e.button===0) mouseDown=false;
  if (drag && e.button===2) {
    const x1=Math.min(drag.x,e.clientX), x2=Math.max(drag.x,e.clientX), y1=Math.min(drag.y,e.clientY), y2=Math.max(drag.y,e.clientY);
    drag=null; $('sel').classList.add('hidden');
    const small = x2-x1<6 && y2-y1<6, v=new THREE.Vector3(); let n=0;
    for (const t of G.towers.slice()) {
      v.set(t.x,0.8,t.z).project(camera);
      const sx=(v.x+1)/2*innerWidth, sy=(1-v.y)/2*innerHeight;
      const hit = small ? Math.hypot(sx-e.clientX,sy-e.clientY)<28 : (sx>=x1&&sx<=x2&&sy>=y1&&sy<=y2);
      if (hit) { removeTower(t,true); n++; }
    }
    if (n) { toast('Picked up '+n+' tower'+(n>1?'s':'')); refreshUI(true); }
  }
});
addEventListener('blur', ()=>{ mouseDown=false; });
function spaceAttack() { if (keys.Space && G.phase==='night' && !menuOpen) { G.player.aim.x=mouseGround.x; G.player.aim.z=mouseGround.z; playerAttack(); } }
function mineTick(dt) {
  mineCd-=dt; warnCd-=dt;
  if (!mouseDown || !(locked||MOBILE) || mineCd>0 || G.phase!=='day') return;
  const p=G.player, fx=-Math.sin(p.yaw), fz=-Math.cos(p.yaw); let best=null, bd=3.6;
  for (const n of nodes) { if (!n.alive) continue; const dx=n.x-p.x, dz=n.z-p.z, d=Math.hypot(dx,dz); if (d<bd && (dx*fx+dz*fz)/(d||1)>0.7) {bd=d;best=n;} }
  if (!best) return;
  const T=NODE_TYPES[best.type];
  if (G.tool!==T.tool) { if (warnCd<=0) { warnCd=1.2; toast('Switch to the '+TOOLS[T.tool].n+' ('+(toolKeys.indexOf(T.tool)+1)+') to collect '+RES[T.res].n); } return; }
  mineCd=0.35/(1+0.25*G.up.mine);
  sfx(MINE_SFX[best.type]||"mine"); best.hp--; best.g.scale.set(1.15,.9,1.15); setTimeout(()=>best.g.scale.set(1,1,1),80);
  if (best.hp<=0) {
    const a=T.amt[0]+Math.floor(Math.random()*(T.amt[1]-T.amt[0]+1))+(best.type==='crystal'?0:G.up.drops);
    G.res[T.res]+=a; G.stats[T.res]+=a; toast('+'+a+' '+RES[T.res].n); killNode(best);
  }
}

// ---------- loop ----------
function updatePlayer(dt) {
  const p=G.player; p.cd-=dt;
  let mx=0,mz=0;
  if (keys.KeyW||keys.ArrowUp) mz-=1; if (keys.KeyS||keys.ArrowDown) mz+=1;
  if (keys.KeyA||keys.ArrowLeft) mx-=1; if (keys.KeyD||keys.ArrowRight) mx+=1;
  mx+=joy.x; mz+=joy.z;
  const L=Math.max(1,Math.hypot(mx,mz)); mx/=L; mz/=L;
  const sp=(G.phase==='day'?6:G.phase==='prep'?12:5.5)*(1+0.15*G.up.move)*dt; let vx,vz;
  if (G.phase==='day') { const s=Math.sin(p.yaw),c=Math.cos(p.yaw); vx=(mx*c+mz*s)*sp; vz=(-mx*s+mz*c)*sp; }
  else { vx=mx*sp; vz=mz*sp; }
  const cx=G.phase==='day'?DAYC.x:0, h=G.phase==='day'?DHALF-1:HALF-1;
  let nx=Math.max(cx-h,Math.min(cx+h,p.x+vx)), nz=Math.max(-h,Math.min(h,p.z+vz));
  if (G.phase==='day') {
    if (groundY(nx,p.z)>p.y+0.01) nx=p.x;
    if (groundY(p.x,nz)>p.y+0.01) nz=p.z;
    for (const n of nodes) { if (!n.alive || !NODE_TYPES[n.type].r) continue; const R=NODE_TYPES[n.type].r+0.35, dx=nx-n.x, dz=nz-n.z, d=Math.hypot(dx,dz); if (d<R) { const k=d>0.001?R/d:0; nx=n.x+(d>0.001?dx*k:R); nz=n.z+(d>0.001?dz*k:0); } }
    const gy=groundY(p.x,p.z);
    if (p.y<=gy+0.001 && (keys.Space||jumpReq) && !menuOpen) p.vy=7;
    jumpReq=false;
    p.vy=(p.vy||0)-25*dt; p.y=Math.max(groundY(nx,nz),(p.y||0)+p.vy*dt);
    if (p.y<=groundY(nx,nz)) p.vy=0;
  } else { p.y=0; p.vy=0; }
  p.x=nx; p.z=nz;
  if (p.hp<=0) { p.hp=p.max; p.x=SHRINE.x; p.z=SHRINE.z-5; toast('Knocked out! Back at the shrine'); }
}
let zoom=0, zoomS=0, thirdPerson=false, camPos=new THREE.Vector3(0,46,16), camLook=new THREE.Vector3();
addEventListener('wheel', e=>{ if (menuOpen||!G.started||G.over) return; const dir=Math.sign(e.deltaY); if (G.phase==='day'||(G.phase==='prep'&&!e.shiftKey)) { cycleSlot(dir); return; } if (G.phase==='prep'||(G.phase==='night'&&!thirdPerson)) zoom=Math.max(0,Math.min(1,zoom-dir*0.12)); });
addEventListener('keydown', e=>{ if (e.code==='KeyV' && G.phase==='night' && !menuOpen) { thirdPerson=!thirdPerson; toast(thirdPerson?'Third person':'Top-down view'); } });
function updateCamera() {
  const p=G.player;
  if (G.phase==='day') {
    camera.position.set(p.x,p.y+1.7,p.z); camera.rotation.order='YXZ'; camera.rotation.set(p.pitch,p.yaw,0);
    ghost.visible=false; avatar.visible=false; return;
  }
  zoomS += (zoom-zoomS)*0.15;
  let tp, tl;
  if (G.phase==='night' && thirdPerson) { tp=new THREE.Vector3(p.x,7,p.z+9); tl=new THREE.Vector3(p.x,1,p.z-2); }
  else {
    tp=new THREE.Vector3(0,46,16).lerp(new THREE.Vector3(p.x,13,p.z+8),zoomS);
    tl=new THREE.Vector3(0,0,0).lerp(new THREE.Vector3(p.x,0,p.z),zoomS);
  }
  camPos.lerp(tp,0.2); camLook.lerp(tl,0.2);
  camera.position.copy(camPos); camera.up.set(0,1,0); camera.lookAt(camLook);
  camera.updateMatrixWorld();
  updateMouseGround();
  ghost.visible=true; ghost.position.set(Math.round(mouseGround.x),0.15,Math.round(mouseGround.z));
  avatar.visible=true; avatar.position.set(p.x,0,p.z);
  if (G.phase==='prep') { const mvx=p.x-(p.lx===undefined?p.x:p.lx), mvz=p.z-(p.lz===undefined?p.z:p.lz); if (mvx*mvx+mvz*mvz>1e-5) avatar.rotation.y=Math.atan2(mvx,mvz); p.lx=p.x; p.lz=p.z; }
  if (G.phase==='night') { const ax=mouseGround.x-p.x, az=mouseGround.z-p.z; avatar.rotation.y=Math.atan2(ax,az); p.aim.x=mouseGround.x; p.aim.z=mouseGround.z; }
}
let last=performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt=Math.min(0.05,(now-last)/1000)*(G.phase==='night'?G.speed:1); last=now;
  if (G.started && !G.over) {
    updatePlayer(dt);
    if (G.phase==='day'||G.phase==='prep') { G.t-=dt; if (G.t<=0) { if (G.phase==='day') startPrep(); else startNight(); } }
    if (G.phase==='night') {
      G.spawnT-=dt;
      if (G.spawnQ.length && G.spawnT<=0) { G.spawnT=Math.max(0.35,1.6-G.wave*0.05); spawnEnemy(G.spawnQ.pop(), GATE.x+rnd(-1,1), GATE.z+1); }
      updateTowers(dt); updateProj(dt); updateEnemies(dt);
      if (!G.enemies.length && !G.spawnQ.length) endNight();
    }
    updateHelpers(dt); updateNodes(dt); updateOrbs(dt); mineTick(dt); spaceAttack(); updateSword(dt); updateFx(dt); checkQuests();
    if (G.shrineHp<=0 && !G.over) gameOver();
    refreshUI(); updateHud();
  }
  updateCamera(); updateRings();
  renderer.render(scene,camera);
}
refreshUI(true); intro(); requestAnimationFrame(loop);
function tryPlace() {
  const p=G.player;
  if (placeTower(G.sel,mouseGround.x,mouseGround.z)) refreshUI(true);
  else if (!G.inv[G.sel]) toast('No '+TOWERS[G.sel].n+' towers - craft one (E)');
  else toast(G.sel==='trap' ? 'Traps must be placed on the path' : 'Towers go beside the path, not on it');
}
document.querySelectorAll('#spd button').forEach(b=>b.onclick=()=>{ G.speed=+b.dataset.s; document.querySelectorAll('#spd button').forEach(x=>x.classList.toggle('on',x===b)); });
document.querySelector('#spd button').classList.add('on');
const mkRing=(r,c)=>{ const m=new THREE.Mesh(new THREE.RingGeometry(r-0.06,r,48),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.8,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; m.position.y=0.3; m.visible=false; scene.add(m); return m; };
const reachRing=mkRing(PLACE_R,0x66ccff), atkRing=mkRing(2.4,0xff6666), rangeRing=mkRing(1,0xffffff);
function updateRings() {
  const p=G.player, show=(G.phase==='prep'||G.phase==='night');
  reachRing.visible=false; atkRing.visible=G.phase==='night'; rangeRing.visible=false;
  if (!show) return;
  reachRing.position.set(p.x,0.3,p.z); atkRing.position.set(p.x,0.32,p.z);
  const T=TOWERS[G.sel];
  if (G.phase==='prep' && ghost.visible && T && T.range>0 && G.sel!=='pierce') { rangeRing.scale.setScalar(T.range); rangeRing.position.set(ghost.position.x,0.34,ghost.position.z); rangeRing.visible=true; }
}
function cycleSlot(dir) {
  if (G.phase==='day') { const i=(toolKeys.indexOf(G.tool)+dir+toolKeys.length)%toolKeys.length; G.tool=toolKeys[i]; }
  else { const i=(towerKeys.indexOf(G.sel)+dir+towerKeys.length)%towerKeys.length; G.sel=towerKeys[i]; }
  refreshUI(true);
}
// player sword (uses supplied sword image)
const swordTex = new THREE.TextureLoader().load(SWORD_SRC);
swordTex.magFilter = THREE.NearestFilter; swordTex.minFilter = THREE.NearestFilter;
const swordMat = new THREE.MeshBasicMaterial({map:swordTex, transparent:true, alphaTest:0.5, side:THREE.DoubleSide});
// the image background is sky blue; key it out in the shader
swordMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
  if (diffuseColor.b > 0.7 && diffuseColor.r < 0.65 && diffuseColor.b - diffuseColor.r > 0.15) discard;`); };
const swordPivot = new THREE.Group();
const swordMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.1), swordMat);
swordMesh.rotation.set(-Math.PI/2, 0, 0); swordMesh.position.set(0.9,0,0.9);
const sw = new THREE.Group(); sw.add(swordMesh); sw.rotation.y = 0; swordPivot.add(sw);
swordPivot.position.y = 1.2; avatar.remove(avatar.userData.blade); avatar.add(swordPivot);
function updateSword(dt) {
  const p=G.player;
  if (p.swing>0) { p.swing+=dt; if (p.swing>0.22) p.swing=0; }
  const k = p.swing>0 ? p.swing/0.22 : 0;
  swordPivot.rotation.y = p.swing>0 ? -1.3 + 2.6*k : 0.5;
  swordPivot.rotation.z = p.swing>0 ? Math.sin(k*Math.PI)*0.3 : 0;
}
