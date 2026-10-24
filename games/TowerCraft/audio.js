'use strict';
let AC = null;
function tone(f, d, type, vol, slide) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
    g.gain.setValueAtTime((vol || .08) * (SET.vol === undefined ? 1 : SET.vol), t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
  } catch (e) {}
}
const lastSfx = {};
function sfx(n) {
  const now = performance.now(); if (now - (lastSfx[n] || 0) < 60) return; lastSfx[n] = now;
  switch (n) {
    case 'mine': tone(180, .09, 'square', .09, 90); break;
    case 'collect': tone(660, .08, 'triangle', .08, 990); break;
    case 'swing': tone(300, .12, 'sawtooth', .05, 120); break;
    case 'shoot': tone(520, .08, 'square', .04, 260); break;
    case 'boom': tone(120, .3, 'sawtooth', .1, 40); break;
    case 'kill': tone(240, .12, 'triangle', .07, 80); break;
    case 'place': tone(220, .07, 'square', .08, 330); setTimeout(() => tone(330, .08, 'square', .07), 70); break;
    case 'hurt': tone(150, .18, 'sawtooth', .09, 60); break;
    case 'click': tone(500, .04, 'square', .05); break;
    case 'horn': tone(110, .6, 'sawtooth', .12, 90); setTimeout(() => tone(147, .6, 'sawtooth', .1, 120), 300); break;
    case 'win': [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, .18, 'triangle', .09), i * 120)); break;
  }
}
const _wrap = (name, snd, pre) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function () { if (!pre || pre.apply(null, arguments)) sfx(snd); return f.apply(this, arguments); }; };
_wrap('shoot', 'shoot'); _wrap('killEnemy', 'kill'); _wrap('playerAttack', 'swing', () => G.player.cd <= 0);
_wrap('startNight', 'horn'); _wrap('endNight', 'win'); _wrap('flash', 'hurt'); _wrap('destroyTower', 'boom'); _wrap('burst', 'boom');
{ const f = placeTower; window.placeTower = function () { const r = f.apply(this, arguments); if (r) sfx('place'); return r; }; }
{ const f = killNode; window.killNode = function (n) { sfx('collect'); return f(n); }; }
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button')) sfx('click'); }, true);
