'use strict';
const orbs = [];
let orbT = 6, orbToasted = false;
const orbHalo = new THREE.SphereGeometry(0.75, 12, 10);
const orbIcons = {};
function resIconSrc(k) {
  if (orbIcons[k]) return orbIcons[k];
  const src = {wood:TEX_PNG.bark, stone:TEX_PNG.stone, metal:TEX_PNG.metal, ice:TEX_PNG.ice, lava:NODE_PNG.lava, poison:NODE_PNG.poison}[k];
  if (src) return orbIcons[k] = src;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), c = RES[k].c;
  x.fillStyle = c; x.strokeStyle = '#000'; x.lineWidth = 4;
  if (k === 'gold') { x.beginPath(); x.arc(32,32,24,0,7); x.fill(); x.stroke(); x.fillStyle = '#fff3a0'; x.beginPath(); x.arc(32,32,13,0,7); x.fill(); }
  else { x.beginPath(); x.moveTo(32,4); x.lineTo(54,28); x.lineTo(32,60); x.lineTo(10,28); x.closePath(); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.moveTo(32,10); x.lineTo(22,28); x.lineTo(32,52); x.lineTo(32,10); x.fill(); }
  return orbIcons[k] = cv.toDataURL();
}
function orbSprite(k, amt) {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160;
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter;
  const draw = img => {
    const x = cv.getContext('2d'); x.clearRect(0,0,128,160);
    x.fillStyle = 'rgba(40,10,70,.8)'; x.beginPath(); x.arc(64,60,56,0,7); x.fill();
    x.lineWidth = 5; x.strokeStyle = '#ffd23f'; x.stroke();
    if (img) { x.imageSmoothingEnabled = false; x.drawImage(img, 28, 24, 72, 72); }
    x.font = 'bold 40px monospace'; x.textAlign = 'center'; x.lineWidth = 6; x.strokeStyle = '#000'; x.fillStyle = '#fff';
    x.strokeText('+'+amt, 64, 148); x.fillText('+'+amt, 64, 148); tex.needsUpdate = true;
  };
  draw(null);
  const img = new Image(); img.onload = () => draw(img); img.src = resIconSrc(k);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, fog:false, depthTest:false}));
  s.scale.set(1.6, 2, 1); s.renderOrder = 6; return s;
}
function clearOrbs() { for (const o of orbs) dayGroup.remove(o.g); orbs.length = 0; }
function rollOrb() {
  const have = Object.keys(G.res).filter(k => G.res[k] > 0 && RES[k]);
  if (!have.length) return {k:'wood', amt:10};
  const k = have[Math.floor(Math.random()*have.length)];
  return {k, amt:Math.max(10,Math.floor(G.res[k]*(0.1 + Math.random()*0.4)))};
}
function spawnOrb() {
  const x = DAYC.x + rnd(-DHALF+3, DHALF-3), z = DAYC.z + rnd(-DHALF+3, DHALF-3);
  if (Math.hypot(x-DAYC.x, z-DAYC.z) < 4) return;
  const r = rollOrb(), g = new THREE.Group();
  g.add(new THREE.Mesh(orbHalo, new THREE.MeshBasicMaterial({color:0xb86bff, transparent:true, opacity:0.3})));
  g.add(orbSprite(r.k, r.amt));
  g.position.set(x, groundY(x,z)+1.5, z); dayGroup.add(g);
  orbs.push({g, x, z, y:groundY(x,z)+1.5, life:40, t:Math.random()*6, k:r.k, amt:r.amt});
  if (!orbToasted) { orbToasted = true; toast('A glowing orb appeared! Walk into it and watch an ad for resources'); }
}
function collectOrb(o) {
  G.res[o.k] = (G.res[o.k]||0) + o.amt;
  toast('Orb: +' + o.amt + ' ' + RES[o.k].n); sfx('collect');
}
function removeOrb(o) { const i = orbs.indexOf(o); if (i >= 0) orbs.splice(i,1); dayGroup.remove(o.g); }
function orbPrompt(o) {
  G.over = true; o.skip = true;
  if (document.pointerLockElement) document.exitPointerLock();
  const ov = $('ov'); ov.classList.remove('hidden');
  ov.innerHTML = `<div class="card"><h2>Glowing Orb</h2>
    <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:10px 0"><img src="${resIconSrc(o.k)}" style="width:64px;height:64px;image-rendering:pixelated"><span class="num" style="font-size:40px;color:${RES[o.k].c}">+${o.amt} ${RES[o.k].n}</span></div>
    <p style="text-align:center">Watch a short ad to collect this?</p>
    <button id="orbYes">Watch ad</button> <button id="orbNo" style="margin-left:12px">No thanks</button></div>`;
  const close = () => { ov.classList.add('hidden'); G.over = false; };
  $('orbNo').onclick = close;
  $('orbYes').onclick = () => {
    $('orbYes').disabled = true; $('orbNo').disabled = true; cgStop();
    cgRewarded(
      () => { cgStart(); close(); collectOrb(o); removeOrb(o); },
      () => { cgStart(); close(); toast('No ad available right now'); }
    );
  };
}
function updateOrbs(dt) {
  if (G.phase !== 'day') { if (orbs.length) clearOrbs(); orbT = 6; orbToasted = false; return; }
  orbT -= dt;
  if (orbT <= 0) { orbT = 14 + Math.random()*16; if (CG.ready && orbs.length < 3) spawnOrb(); }
  const p = G.player;
  for (let i = orbs.length-1; i >= 0; i--) {
    const o = orbs[i]; o.life -= dt; o.t += dt;
    o.g.position.y = o.y + Math.sin(o.t*2.2)*0.25; o.g.rotation.y = o.t;
    o.g.scale.setScalar(o.life < 5 ? 0.4 + 0.6*Math.abs(Math.sin(o.t*8)) : 1);
    const d = Math.hypot(p.x-o.x, p.z-o.z);
    if (o.life <= 0) { removeOrb(o); continue; }
    if (o.skip && d > 3.5) o.skip = false;
    if (!o.skip && d < 1.8) { orbPrompt(o); return; }
  }
}
