'use strict';
const HUD_IDS = ['res','top','vit','quest','wave','tcount','hotbar','setpanel'];
const HUD_NAMES = {res:'Resources',top:'Timer',vit:'Health bars',quest:'Objectives',wave:'Wave info',tcount:'Tower counts',hotbar:'Hotbar',setpanel:'Settings'};
let SET = {fs:1, pos:{}};
try { SET = Object.assign(SET, JSON.parse(localStorage.getItem('emberfall-settings')||'{}')); } catch (e) {}
const saveSet = () => { try { localStorage.setItem('emberfall-settings', JSON.stringify(SET)); } catch (e) {} };

function applyFont() {
  document.documentElement.style.setProperty('--ui', SET.fs);
  for (const id of HUD_IDS) applyPos(id);
}
function applyPos(id) {
  const el = $(id), p = SET.pos[id]; if (!el || !p) return;
  el.style.left = p.x+'px'; el.style.top = p.y+'px'; el.style.right = 'auto'; el.style.bottom = 'auto'; el.style.transform = 'none';
}
let moveMode = false, dragEl = null, dragOff = null;
function setMoveMode(on) {
  moveMode = on; $('setpanel').classList.toggle('compact', on);
  for (const id of HUD_IDS) { const el=$(id); el.classList.toggle('movable', on); }
  $('setpanel').querySelector('#mvbtn').textContent = on ? 'Done moving' : 'Move info panels';
  if (on) toast('Drag any highlighted panel to move it');
}
function buildSettings() {
  const p = $('setpanel');
  p.innerHTML = `<h3>Settings</h3>
  <div>Font / UI size: <b id="fsv">${Math.round(SET.fs*100)}%</b></div>
  <input type="range" id="fs" min="0.7" max="1.6" step="0.1" value="${SET.fs}" style="width:100%">
  <div class="mvrow"><button id="fsbtn">Fullscreen</button><button id="mvbtn">Move info panels</button><button id="mobtn">Mobile mode: ${MOBILE?"ON":"OFF"}</button><button id="rst">Reset layout</button><button id="setx">Close</button></div>`;
  $('fs').oninput = e => { SET.fs = +e.target.value; $('fsv').textContent = Math.round(SET.fs*100)+'%'; applyFont(); saveSet(); };
  $('mobtn').onclick = () => { setMobile(!MOBILE); $('mobtn').textContent = 'Mobile mode: '+(MOBILE?'ON':'OFF'); };
  $('fsbtn').onclick = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} };
  $('mvbtn').onclick = () => setMoveMode(!moveMode);
  $('rst').onclick = () => { SET.pos = {}; SET.fs = 1; saveSet(); for (const id of HUD_IDS) { const el=$(id); el.style.left=el.style.top=el.style.right=el.style.bottom=el.style.transform=''; } applyFont(); buildSettings(); };
  $('setx').onclick = () => toggleSettings(false);
}
function toggleSettings(open) {
  const p = $('setpanel'), show = open===undefined ? p.classList.contains('hidden') : open;
  p.classList.toggle('hidden', !show);
  if (show) { if (document.pointerLockElement) document.exitPointerLock(); buildSettings(); }
  else if (moveMode) setMoveMode(false);
}
$('setbtn').onclick = () => toggleSettings();
addEventListener('keydown', e => { if (e.code==='Escape' && !$('setpanel').classList.contains('hidden')) toggleSettings(false); });

document.addEventListener('mousedown', e => {
  if (!moveMode) return;
  if (e.target.closest && e.target.closest('button,input')) return;
  const el = e.target.closest && e.target.closest('.movable'); if (!el) return;
  e.preventDefault(); e.stopPropagation();
  const r = el.getBoundingClientRect(), z = el.id==='setpanel' ? 1 : SET.fs;
  dragEl = el; dragOff = {x:e.clientX/z - r.left/z, y:e.clientY/z - r.top/z};
}, true);
addEventListener('mousemove', e => {
  if (!dragEl) return;
  const z = dragEl.id==='setpanel' ? 1 : SET.fs; SET.pos[dragEl.id] = {x:Math.max(0, e.clientX/z - dragOff.x), y:Math.max(0, e.clientY/z - dragOff.y)};
  applyPos(dragEl.id);
});
addEventListener('mouseup', () => { if (dragEl) { dragEl = null; saveSet(); } });
applyFont();

(() => {
  document.addEventListener('touchstart', e => {
    if (!moveMode || e.target.closest('button,input')) return;
    const el = e.target.closest('.movable'); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    const t = e.changedTouches[0], r = el.getBoundingClientRect(), z = el.id==='setpanel' ? 1 : SET.fs;
    dragEl = el; dragOff = {x:t.clientX/z - r.left/z, y:t.clientY/z - r.top/z};
  }, {capture:true, passive:false});
  addEventListener('touchmove', e => {
    if (!dragEl) return; e.preventDefault();
    const t = e.changedTouches[0], z = dragEl.id==='setpanel' ? 1 : SET.fs;
    SET.pos[dragEl.id] = {x:Math.max(0, t.clientX/z - dragOff.x), y:Math.max(0, t.clientY/z - dragOff.y)}; applyPos(dragEl.id);
  }, {passive:false});
  addEventListener('touchend', () => { if (dragEl) { dragEl = null; saveSet(); } });
})();
