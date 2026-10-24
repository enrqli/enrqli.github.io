'use strict';
const joy = {x:0, z:0};
let MOBILE = false, atkHeld = false;
const mbEl = document.createElement('div'); mbEl.id = 'mob';
mbEl.innerHTML = `<div id="joy"><div id="knob"></div></div>
<div id="mbtns"><button id="mAtk">Attack</button><button id="mMine">Mine</button><button id="mPlace">Place</button><button id="mTool">Next</button><button id="mRot">Rotate</button><button id="mMenu">Menu</button></div>`;
document.body.appendChild(mbEl);
const joyEl = $('joy'), knob = $('knob');
let joyId = null, lookId = null, lastX = 0, lastY = 0, moved = 0, startT = 0;

function setMobile(on) {
  MOBILE = on; SET.mobile = on; saveSet();
  document.body.classList.toggle('mobile', on);
  mbEl.style.display = on ? 'block' : 'none';
  if (!on) { joy.x = joy.z = 0; atkHeld = false; mouseDown = false; }
}
function mobPhase() {
  if (!MOBILE) return;
  const d = G.phase === 'day', p = G.phase;
  $('mMine').style.display = d ? '' : 'none';
  $('mAtk').style.display = p === 'night' ? '' : 'none';
  $('mPlace').style.display = p === 'day' ? 'none' : '';
  $('mRot').style.display = p === 'day' ? 'none' : '';
  $('mTool').textContent = d ? 'Tool' : 'Tower';
}
setInterval(mobPhase, 400);

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
      ndc.set(t.clientX/innerWidth*2-1, -(t.clientY/innerHeight)*2+1);
    }
  }
}, {passive:false});
addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { joyId = null; joy.x = joy.z = 0; knob.style.transform = ''; }
    else if (t.identifier === lookId) {
      lookId = null;
      if (moved < 12 && performance.now() - startT < 350 && G.phase !== 'day') {
        ndc.set(t.clientX/innerWidth*2-1, -(t.clientY/innerHeight)*2+1);
        canvas.dispatchEvent(new MouseEvent('mousedown', {button: 0, clientX: t.clientX, clientY: t.clientY}));
      }
    }
  }
});
canvas.addEventListener('touchstart', e => {
  if (!MOBILE || !G.started || G.over) return;
  e.preventDefault();
  const t = e.changedTouches[0]; if (lookId !== null) return;
  lookId = t.identifier; lastX = t.clientX; lastY = t.clientY; moved = 0; startT = performance.now();
  ndc.set(t.clientX/innerWidth*2-1, -(t.clientY/innerHeight)*2+1);
}, {passive:false});

const hold = (id, on, off) => { const b = $(id); b.addEventListener('touchstart', e => { e.preventDefault(); on(); }, {passive:false}); b.addEventListener('touchend', e => { e.preventDefault(); off && off(); }, {passive:false}); b.addEventListener('touchcancel', () => off && off()); };
hold('mMine', () => { locked = true; mouseDown = true; }, () => { mouseDown = false; });
hold('mAtk', () => { atkHeld = true; }, () => { atkHeld = false; keys.Space = false; });
hold('mPlace', () => {
  canvas.dispatchEvent(new MouseEvent('mousedown', {button: G.phase === 'night' ? 2 : 0}));
});
hold('mTool', () => cycleSlot(1));
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
}
requestAnimationFrame(mobAim);
const coarse = matchMedia('(pointer:coarse)').matches && 'ontouchstart' in window;
setMobile(SET.mobile !== undefined ? SET.mobile : coarse);
