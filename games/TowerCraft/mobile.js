'use strict';
const joy = {x:0, z:0};
let shownTool = null, MOBILE = false, atkHeld = false, pend = null;
const mbEl = document.createElement('div'); mbEl.id = 'mob';
const SWORD_SVG = '<svg viewBox="0 0 64 64" width="46" height="46"><path d="M50 6 L58 6 L58 14 L28 44 L20 36 Z" fill="#dfe6ee" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="M14 30 L34 50 L28 56 L8 36 Z" fill="#d4a017" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="M16 42 L22 48 L10 60 L4 54 Z" fill="#6b3f1e" stroke="#000" stroke-width="3" stroke-linejoin="round"/></svg>';
mbEl.innerHTML = `<div id="joy"><div id="knob"></div></div>
<div id="mbtns"><button id="mAtk" class="rb">${SWORD_SVG}</button><button id="mSwap" class="rb">&#8644;</button><button id="mMine" class="rb"><img id="mPick" alt=""></button><button id="mPlace" class="rb">&#10003;</button><button id="mRot" class="rb">&#8635;</button><button id="mMenu" class="rb"><i></i><i></i><i></i></button></div>`;
document.body.appendChild(mbEl);
$('mPick').src = TOOL_PNG.pickaxe;
const joyEl = $('joy'), knob = $('knob');
let joyId = null, lookId = null, lastX = 0, lastY = 0, moved = 0, startT = 0;

function setMobile(on) {
  MOBILE = on; SET.mobile = on; saveSet();
  document.body.classList.toggle('mobile', on);
  mbEl.style.display = on ? 'block' : 'none';
  if (!on) { joy.x = joy.z = 0; atkHeld = false; mouseDown = false; pend = null; }
}
function mobPhase() {
  if (!MOBILE) return;
  const p = G.phase, d = p === 'day';
  if (d) pend = null;
  $('mMine').style.display = d ? '' : 'none';
  $('mSwap').style.display = d ? '' : 'none';
  if (d && shownTool !== G.tool) { shownTool = G.tool; $('mPick').src = TOOL_PNG[G.tool] || TOOL_PNG.pickaxe; }
  $('mAtk').style.display = d ? 'none' : '';
  $('mPlace').style.display = pend && !d ? '' : 'none';
  $('mRot').style.display = !d && G.sel === 'pierce' ? '' : 'none';
}
setInterval(mobPhase, 150);

joyEl.addEventListener('touchstart', e => { e.preventDefault(); joyId = e.changedTouches[0].identifier; moveJoy(e.changedTouches[0]); }, {passive:false});
function moveJoy(t) {
  const r = joyEl.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
  let dx = (t.clientX - cx) / (r.width/2), dy = (t.clientY - cy) / (r.height/2); const L = Math.hypot(dx, dy);
  if (L > 1) { dx /= L; dy /= L; }
  joy.x = Math.abs(dx) < .12 ? 0 : dx; joy.z = Math.abs(dy) < .12 ? 0 : dy;
  knob.style.transform = `translate(${dx*34}px,${dy*34}px)`;
}
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { e.preventDefault(); moveJoy(t); }
    else if (t.identifier === lookId) {
      const dx = t.clientX - lastX, dy = t.clientY - lastY; lastX = t.clientX; lastY = t.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (G.phase === 'day') { const p = G.player; p.yaw -= dx * .006; p.pitch = Math.max(-1.3, Math.min(1.3, p.pitch - dy * .006)); }
    }
  }
}, {passive:false});
addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { joyId = null; joy.x = joy.z = 0; knob.style.transform = ''; }
    else if (t.identifier === lookId) {
      lookId = null;
      if (moved < 12 && performance.now() - startT < 350 && G.phase !== 'day' && !menuOpen) {
        ndc.set(t.clientX/innerWidth*2-1, -(t.clientY/innerHeight)*2+1); updateMouseGround();
        const tw = nearTowerAt(mouseGround.x, mouseGround.z);
        if (tw) { showTowerPop(tw); pend = null; }
        else { pend = {x:Math.round(mouseGround.x), z:Math.round(mouseGround.z)}; }
        mobPhase();
      }
    }
  }
});
canvas.addEventListener('touchstart', e => {
  if (!MOBILE || !G.started || G.over) return;
  e.preventDefault();
  const t = e.changedTouches[0]; if (lookId !== null) return;
  lookId = t.identifier; lastX = t.clientX; lastY = t.clientY; moved = 0; startT = performance.now();
}, {passive:false});

const hold = (id, on, off) => { const b = $(id); b.addEventListener('touchstart', e => { e.preventDefault(); on(); }, {passive:false}); b.addEventListener('touchend', e => { e.preventDefault(); off && off(); }, {passive:false}); b.addEventListener('touchcancel', () => off && off()); };

function gestureButton(id, down, up, aim, noSwipe) {
  const b = $(id); let tid = null, lx = 0, ly = 0, ox = 0, oy = 0, swipe = false, lastTap = 0, t0 = 0;
  b.addEventListener('touchstart', e => {
    e.preventDefault(); const t = e.changedTouches[0]; tid = t.identifier; lx = ox = t.clientX; ly = oy = t.clientY; t0 = performance.now();
    swipe = !noSwipe && t0 - lastTap < 330; if (swipe) { lastTap = 0; return; }
    down();
  }, {passive:false});
  b.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === tid) {
      if (swipe) {
        const dx = t.clientX - ox, dy = t.clientY - oy;
        if (Math.hypot(dx, dy) > 28) { cycleSlot((Math.abs(dx) > Math.abs(dy) ? dx : dy) > 0 ? 1 : -1); sfx('click'); ox = t.clientX; oy = t.clientY; }
      } else if (aim && G.phase === 'day') {
        const p = G.player; p.yaw -= (t.clientX - lx) * .006; p.pitch = Math.max(-1.3, Math.min(1.3, p.pitch - (t.clientY - ly) * .006)); lx = t.clientX; ly = t.clientY;
      }
    }
  }, {passive:false});
  const end = e => { if (e) e.preventDefault(); if (tid === null) return; tid = null; if (!swipe) { up(); if (performance.now() - t0 < 250) lastTap = performance.now(); } swipe = false; };
  b.addEventListener('touchend', end, {passive:false}); b.addEventListener('touchcancel', () => end());
}
gestureButton('mMine', () => { locked = true; mouseDown = true; }, () => { mouseDown = false; }, true, true);
{
  const b = $('mSwap'); let tid = null, ox = 0, oy = 0;
  b.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; tid = t.identifier; ox = t.clientX; oy = t.clientY; }, {passive:false});
  b.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === tid && G.phase === 'day' && Math.hypot(t.clientX-ox, t.clientY-oy) > 24) { cycleSlot(1); sfx('click'); tid = null; mobPhase(); }
  }, {passive:false});
  const end = e => { e && e.preventDefault(); tid = null; };
  b.addEventListener('touchend', end, {passive:false}); b.addEventListener('touchcancel', () => end());
}
gestureButton('mAtk', () => { atkHeld = true; pend = null; }, () => { atkHeld = false; keys.Space = false; }, false);
hold('mPlace', () => {
  if (!pend) return;
  mouseGround.set(pend.x, 0, pend.z); tryPlace(); pend = null; mobPhase();
});
hold('mRot', () => { window.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyQ', key:'q'})); });
hold('mMenu', () => toggleMenu());

function mobAim() {
  requestAnimationFrame(mobAim);
  if (!MOBILE) return;
  if (G.phase === 'day') locked = true;
  keys.Space = false;
  if (atkHeld && G.phase === 'night' && G.enemies.length) {
    const p = G.player; let best = null, bd = 1e9;
    for (const e of G.enemies) { const d = Math.hypot(e.x-p.x, e.z-p.z); if (d < bd) { bd = d; best = e; } }
    const v = new THREE.Vector3(best.x, 0.5, best.z).project(camera); ndc.set(v.x, v.y); keys.Space = true;
  }
  if (pend && G.phase !== 'day') { mouseGround.set(pend.x, 0, pend.z); ghost.position.set(pend.x, 0.15, pend.z); }
}
requestAnimationFrame(mobAim);
const coarse = matchMedia('(pointer:coarse)').matches && 'ontouchstart' in window;
setMobile(SET.mobile !== undefined ? SET.mobile : coarse);

let pinchD = 0;
const pinchTouches = e => [...e.touches].filter(t => t.identifier !== joyId);
addEventListener('touchmove', e => {
  if (!MOBILE || !G.started) return;
  const ts = pinchTouches(e); if (ts.length < 2) { pinchD = 0; return; }
  const d = Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
  if (pinchD && (G.phase === 'prep' || (G.phase === 'night' && !thirdPerson))) { zoom = Math.max(0, Math.min(1, zoom + (d - pinchD) * 0.004)); moved = 99; }
  pinchD = d;
}, {passive:false});
addEventListener('touchend', () => { pinchD = 0; });
