'use strict';
// Sprite cells cropped from the sheet images: [x,y,w,h] in source pixels
const TOWER_CELLS = {
  arrow:[58,98,218,198], bomb:[297,98,210,198], ice:[533,98,210,198], resource:[766,98,215,198],
  pierce:[58,338,218,194], poison:[300,338,210,194], trap:[533,338,210,194], fire:[766,338,215,194]
};
const ENEMY_CELLS = {
  normal:[58,600,166,152], fast:[248,600,166,152], tank:[436,600,166,152], brood:[624,600,115,152], small:[744,592,50,56],
  breaker:[812,600,168,152], boss:[58,808,166,152], shark:[248,808,166,152], frost:[436,808,166,152], fireimp:[624,808,166,152]
};
const TOOL_CELLS = { axe:[0,0,175,262], pickaxe:[0,278,175,262], bucket:[0,556,175,253] };

function loadImg(src) { const i = new Image(); i.src = src; return i; }
const SHEET = loadImg(SHEET_SRC), TOOLSHEET = loadImg(TOOLS_SRC);
const keyed = {}; // canvas + texture per sprite key, drawn once images load

function keyedCanvas(img, c, key) {
  const cv = document.createElement('canvas'); cv.width = c[2]; cv.height = c[3];
  const x = cv.getContext('2d', {willReadFrequently:true}); x.drawImage(img, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]);
  const d = x.getImageData(0, 0, c[2], c[3]), p = d.data, r0 = p[0], g0 = p[1], b0 = p[2];
  for (let i = 0; i < p.length; i += 4) {
    const dist = Math.abs(p[i]-r0) + Math.abs(p[i+1]-g0) + Math.abs(p[i+2]-b0);
    if (dist < 60) p[i+3] = 0;
  }
  x.putImageData(d, 0, 0); return cv;
}
function spriteTex(kind, key) {
  const id = kind + key;
  if (keyed[id]) return keyed[id];
  const cells = kind === 't' ? TOWER_CELLS : ENEMY_CELLS, c = cells[key];
  const cv = document.createElement('canvas'); cv.width = c[2]; cv.height = c[3];
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter;
  const draw = () => { const k = keyedCanvas(SHEET, c); cv.getContext('2d').drawImage(k, 0, 0); tex.needsUpdate = true; };
  if (SHEET.complete && SHEET.naturalWidth) draw(); else SHEET.addEventListener('load', draw);
  return keyed[id] = {tex, aspect:c[2]/c[3]};
}
const enemyTex = {}, towerTex = {};
function makeEnemySprite(key, height) {
  const ar = ENEMY_AR[key];
  if (!enemyTex[key]) { enemyTex[key] = new THREE.TextureLoader().load(ENEMY_PNG[key]); enemyTex[key].magFilter = enemyTex[key].minFilter = THREE.NearestFilter; }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:enemyTex[key], transparent:true, alphaTest:0.3, fog:false}));
  s.scale.set(height*ar, height, 1); s.center.set(0.5, 0.02); return s;
}
function makeSprite(kind, key, height) {
  if (kind === 't') {
    if (!towerTex[key]) { towerTex[key] = new THREE.TextureLoader().load(TOWER_PNG[key]); towerTex[key].magFilter = towerTex[key].minFilter = THREE.NearestFilter; }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:towerTex[key], transparent:true, alphaTest:0.3, fog:false}));
    s.scale.set(height*TOWER_AR[key], height, 1); s.center.set(0.5, 0.2); return s;
  }
  const t = spriteTex(kind, key);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t.tex, transparent:true, alphaTest:0.3, fog:false}));
  s.scale.set(height*t.aspect, height, 1); s.center.set(0.5, 0.08); return s;
}
function toolIcon(key, cb) { cb(TOOL_PNG[key]); }
