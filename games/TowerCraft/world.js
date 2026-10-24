'use strict';
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:false});
renderer.setPixelRatio(0.6);
renderer.setSize(innerWidth, innerHeight, false);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 60);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 300);
const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(20,30,10);
const amb = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(sun, amb);
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
});

const mat = c => new THREE.MeshLambertMaterial({color:c});
function box(w,h,d,c,x,y,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c)); m.position.set(x,y,z); return m; }
function rnd(a,b){ return a + Math.random()*(b-a); }

// ---------- areas ----------
const HALF = 22;                       // night arena half-size, centred on origin
const DAYC = {x:200, z:0}, DHALF = 30; // day field
const nightGroup = new THREE.Group(), dayGroup = new THREE.Group();
scene.add(nightGroup, dayGroup);

function makeTiles(group, cx, cz, half, colorFn) {
  const n = half*2*half*2, im = new THREE.InstancedMesh(new THREE.BoxGeometry(1,0.2,1), new THREE.MeshLambertMaterial(), n);
  const m = new THREE.Matrix4(), c = new THREE.Color(); let i = 0;
  for (let x=-half; x<half; x++) for (let z=-half; z<half; z++) {
    m.setPosition(cx+x+0.5, -0.1, cz+z+0.5); im.setMatrixAt(i, m);
    c.setHex(colorFn(x+0.5, z+0.5)); im.setColorAt(i, c); i++;
  }
  im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  group.add(im);
}

// ---------- night arena: winding path ----------
const GATE = new THREE.Vector3(-17, 0, -20);
const SHRINE = new THREE.Vector3(0, 0, 18);
const PATH = [[-17,-20],[-17,-9],[14,-9],[14,1],[-13,1],[-13,10],[9,10],[9,14],[0,16]];
function distToPath(x, z) {
  let best = 1e9;
  for (let i=0; i<PATH.length-1; i++) {
    const [ax,az]=PATH[i], [bx,bz]=PATH[i+1], dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz;
    const t = Math.max(0, Math.min(1, ((x-ax)*dx+(z-az)*dz)/L2));
    best = Math.min(best, Math.hypot(x-(ax+dx*t), z-(az+dz*t)));
  }
  return best;
}
makeTiles(nightGroup, 0, 0, HALF, (x,z) => distToPath(x,z) < 1.3 ? (((x+z)&1)?0x8b5a2b:0x96622f) : (((Math.floor(x)+Math.floor(z))&1)?0x5fae3a:0x68b942));

const shrine = new THREE.Group();
shrine.add(box(3,0.6,3,0xb8b8c0,0,0.3,0), box(2,0.4,2,0x9a9aa4,0,0.8,0));
const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), new THREE.MeshBasicMaterial({color:0xffc400}));
stone.position.y = 2; shrine.add(stone);
shrine.position.copy(SHRINE); nightGroup.add(shrine);

const gate = new THREE.Group();
gate.add(box(0.8,4,0.8,0x2a1a3a,-2,2,0), box(0.8,4,0.8,0x2a1a3a,2,2,0), box(4.8,0.8,0.8,0x2a1a3a,0,4,0));
const portal = box(3.2,3.2,0.2,0x6a1aa0,0,1.8,0); gate.add(portal);
gate.position.copy(GATE); nightGroup.add(gate);

// border decoration so the arena edge reads clearly
for (let i=-HALF; i<HALF; i+=2) for (const [x,z] of [[i,-HALF-1],[i,HALF+1],[-HALF-1,i],[HALF+1,i]]) {
  const t = new THREE.Group(); t.add(box(.5,1.4,.5,0x6b4423,0,.7,0), box(1.6,1.4,1.6,0x2f8f2f,0,2,0)); t.position.set(x,0,z); nightGroup.add(t);
}

// ---------- day field: resource zones ----------
const ZONES = [
  {type:'wood',   x:-18,z:-14,r:10,n:46,ground:0x4f9a32,name:'Forest'},
  {type:'stone',  x:16, z:-16,r:6, n:18,ground:0x80858c,name:'Quarry'},
  {type:'metal',  x:22, z:4,  r:5, n:12,ground:0x4a4f5a,name:'Iron Mine'},
  {type:'ice',    x:-20,z:18, r:6, n:12,ground:0xd8f4ff,name:'Ice Cave'},
  {type:'poison', x:0,  z:22, r:6, n:12,ground:0x3d5a1c,name:'Poison Swamp'},
  {type:'lava',   x:20, z:20, r:5, n:9, ground:0x4a1c14,name:'Lava Pit'},
  {type:'crystal',x:0,  z:-22,r:4, n:5, ground:0x3a2a5a,name:'Crystal Cavern'}
];
function zoneAt(x, z) {
  for (const zn of ZONES) if (Math.hypot(x-zn.x, z-zn.z) < zn.r) return zn;
  return null;
}
makeTiles(dayGroup, DAYC.x, DAYC.z, DHALF, (x,z) => {
  const zn = zoneAt(x,z);
  if (zn) return ((Math.floor(x)+Math.floor(z))&1) ? zn.ground : (zn.ground & 0xfefefe) >> 0 | 0x080808;
  return ((Math.floor(x)+Math.floor(z))&1) ? 0x5fae3a : 0x68b942;
});

const NODE_TYPES = {
  wood:{res:'wood',tool:'axe',hits:4,amt:[2,3]}, stone:{res:'stone',tool:'pickaxe',hits:4,amt:[1,2]}, metal:{res:'metal',tool:'pickaxe',hits:6,amt:[1,2]},
  ice:{res:'ice',tool:'pickaxe',hits:5,amt:[1,2]}, poison:{res:'poison',tool:'bucket',hits:5,amt:[1,2]}, lava:{res:'lava',tool:'bucket',hits:6,amt:[1,2]},
  crystal:{res:'crystal',tool:'pickaxe',hits:8,amt:[1,1]}
};
const nodes = [];
const nodeTex = {}, texMat = {};
function loadTex(src) { const t = new THREE.TextureLoader().load(src); t.magFilter = t.minFilter = THREE.NearestFilter; return t; }
function tmat(k) { return texMat[k] || (texMat[k] = new THREE.MeshLambertMaterial({map:loadTex(TEX_PNG[k])})); }
function tbox(w,h,d,k,x,y,z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), tmat(k)); m.position.set(x,y,z); return m; }
function pool(g, type, size) {
  if (!nodeTex[type]) nodeTex[type] = loadTex(NODE_PNG[type]);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size/NODE_AR[type]), new THREE.MeshBasicMaterial({map:nodeTex[type], transparent:true, alphaTest:0.05}));
  p.rotation.x = -Math.PI/2; p.position.y = 0.04; g.add(p);
}
const nodeAnim = [];
let _sd = 7; const srnd = () => (_sd = (_sd*16807) % 2147483647) / 2147483647;
const stdM = (color, o) => new THREE.MeshStandardMaterial(Object.assign({color, flatShading:true}, o||{}));
const mBox = (w,h,d,mat,x,y,z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(x,y,z); return m; };
const mMesh = (geo,mat,x,y,z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); return m; };
const M_ICE = [0xeaf8ff,0xc4ecff,0x8fd0f2,0x6fb8e8,0xd8f4ff,0xa6dcf7].map(c => stdM(c,{transparent:true,opacity:.7,emissive:0x2a6a9a,emissiveIntensity:.2}));
const M_GREENS = [0x6fc04a,0x5aae3c,0x4b9a33,0x7acd55].map(c => stdM(c)), M_BARK = stdM(0x6b4423);
const M_ROCK = [0x8e939c,0x70757f,0x4e5461].map(c => stdM(c));
const M_METAL = new THREE.MeshStandardMaterial({color:0xc9ced6,metalness:.6,roughness:.4,flatShading:true});
const M_METAL2 = new THREE.MeshStandardMaterial({color:0x8a919b,metalness:.6,roughness:.5,flatShading:true});
const M_LAVA = new THREE.MeshStandardMaterial({color:0xff6a00,emissive:0xff5000,emissiveIntensity:1.4,flatShading:true});
const M_CRUST = stdM(0xd23a00,{emissive:0xaa2200,emissiveIntensity:.8});
const M_LIQ = new THREE.MeshStandardMaterial({color:0x7aff1a,emissive:0x3fbf00,emissiveIntensity:.9,transparent:true,opacity:.92});
const M_BUB = new THREE.MeshStandardMaterial({color:0xe8ff9a,emissive:0xb0ff40,emissiveIntensity:.8});
const M_SMOKE = new THREE.MeshStandardMaterial({color:0x9aff4a,emissive:0x66cc22,emissiveIntensity:.4,transparent:true,opacity:.45});
function buildModel(type) {
  const g = new THREE.Group();
  if (type==='wood') {
    g.add(mBox(.9,2.4,.9,M_BARK,0,1.2,0));
    [[3,2.2],[3,3],[3,3.8],[2,4.6],[1,5.3]].forEach(([h,y],i) => {
      const n = [3,3,2,2,1][i];
      for (let x=-n+1;x<n;x++) for (let z=-n+1;z<n;z++) {
        if (n===3 && Math.abs(x)===2 && Math.abs(z)===2) continue;
        g.add(mBox(.9,.9,.9,M_GREENS[Math.floor(srnd()*4)],x*.9,y+.2,z*.9));
      }
    });
    g.scale.set(.42,.62,.42);
  } else if (type==='stone') {
    const part = (geo,mat,x,y,z,ry) => { const m = mMesh(geo,mat,x,y,z); m.rotation.y = ry; g.add(m); };
    part(new THREE.DodecahedronGeometry(1.2,0),M_ROCK[0],0,1.9,0,.3);
    part(new THREE.BoxGeometry(1.8,1.6,1.8),M_ROCK[1],0,1,0,.2);
    part(new THREE.BoxGeometry(1.3,1.2,1.4),M_ROCK[0],-1.4,.75,.5,.4);
    part(new THREE.BoxGeometry(1.4,1.3,1.4),M_ROCK[2],1.3,.8,.4,-.3);
    part(new THREE.BoxGeometry(1,.8,1),M_ROCK[1],.1,.55,1.3,.1);
    g.scale.setScalar(.5);
  } else if (type==='metal') {
    [[-1.1,.5,-.8],[1.1,.5,-.8],[-1.1,.5,.9],[1.1,.5,.9]].forEach(p => g.add(mBox(1.8,1,1.3,M_METAL2,p[0],p[1],p[2])));
    [[0,1.5,-.8],[0,1.5,.9]].forEach(p => g.add(mBox(1.8,1,1.3,M_METAL,p[0],p[1],p[2])));
    g.scale.setScalar(.5);
  } else if (type==='ice') {
    const core = mMesh(new THREE.BoxGeometry(2.6,2.6,2.6),stdM(0x9fd6f5,{transparent:true,opacity:.6,roughness:.1,emissive:0x2a6a9a,emissiveIntensity:.25}),0,1.5,0); g.add(core);
    const geos = [()=>new THREE.IcosahedronGeometry(1,0),()=>new THREE.OctahedronGeometry(1,0),()=>new THREE.TetrahedronGeometry(1,0),()=>new THREE.DodecahedronGeometry(1,0),()=>new THREE.ConeGeometry(.7,1.8,5)];
    for (let i=0;i<14;i++) {
      const b = mMesh(geos[Math.floor(srnd()*5)](),M_ICE[Math.floor(srnd()*6)],(srnd()-.5)*1.9,1.5+(srnd()-.5)*1.9,(srnd()-.5)*1.9);
      b.scale.set(.12+srnd()*.35,.12+srnd()*.4,.12+srnd()*.35); b.rotation.set(srnd()*3,srnd()*3,srnd()*3); g.add(b);
    }
    const frost = stdM(0xf2fbff,{transparent:true,opacity:.85});
    for (let i=0;i<8;i++) { const sh = mMesh(new THREE.ConeGeometry(.1+srnd()*.1,.4+srnd()*.6,4),frost,(srnd()-.5)*2,2.9,(srnd()-.5)*2); sh.rotation.set((srnd()-.5)*.5,srnd()*3,(srnd()-.5)*.5); g.add(sh); }
    g.scale.setScalar(.5);
  } else if (type==='lava') {
    g.add(mMesh(new THREE.CylinderGeometry(2.2,2.5,.5,16),stdM(0x5a3626),0,.25,0));
    g.add(mMesh(new THREE.CylinderGeometry(1.8,1.8,.1,32),M_LAVA,0,.52,0));
    for (let i=0;i<9;i++) { const a = srnd()*6.283, r = srnd()*1.2; g.add(mMesh(new THREE.CylinderGeometry(.3+srnd()*.2,.35,.08,7),M_CRUST,Math.cos(a)*r,.6,Math.sin(a)*r)); }
    for (let i=0;i<7;i++) { const a = srnd()*6.283, r = 2.7+srnd()*.8; g.add(mMesh(new THREE.DodecahedronGeometry(.15+srnd()*.15,0),stdM(0x4a2c20),Math.cos(a)*r,.15,Math.sin(a)*r)); }
    g.scale.set(.7,.5,.7);
  } else if (type==='poison') {
    const stone = stdM(0x666a5a), N = 16;
    for (let i=0;i<N;i++) { const a = i/N*6.283; const b = mBox(.8,.8,.55,stone,Math.cos(a)*2,.5,Math.sin(a)*2); b.rotation.y = -a+Math.PI/2; b.scale.y = .9+srnd()*.4; g.add(b); }
    g.add(mMesh(new THREE.CylinderGeometry(1.8,1.8,.1,32),M_LIQ,0,.7,0));
    const bubbles = [];
    for (let i=0;i<10;i++) { const a = srnd()*6.283, r = Math.sqrt(srnd())*1.5; const b = mMesh(new THREE.SphereGeometry(.06+srnd()*.08,6,6),M_BUB,Math.cos(a)*r,.8,Math.sin(a)*r); b.userData.o = srnd()*6; g.add(b); bubbles.push(b); }
    const pts = []; for (let i=0;i<=10;i++) pts.push(new THREE.Vector3(Math.sin(i*.7)*.4,.8+i*.4,Math.cos(i*.5)*.3));
    const tube = mMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.45,8),M_SMOKE,0,0,0); g.add(tube);
    nodeAnim.push(t => { for (const b of bubbles) b.position.y = .8+Math.abs(Math.sin(t*1.5+b.userData.o))*.25; });
    g.scale.set(.7,.6,.7);
  } else {
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(.5), new THREE.MeshBasicMaterial({color:0xd36bff})); c.position.y = 1; g.add(c);
  }
  return g;
}
function makeNode(type, x, z) {
  const g = new THREE.Group(); g.add(buildModel(type));
  g.position.set(x,0,z); dayGroup.add(g);
  const n = {type, g, x, z, hp:NODE_TYPES[type].hits, alive:true, claimed:false, regen:0};
  nodes.push(n); return n;
}
for (const zn of ZONES) {
  let placed = 0, tries = 0;
  while (placed < zn.n && tries < 600) {
    tries++;
    const a = Math.random()*6.283, d = Math.sqrt(Math.random())*(zn.r-0.8);
    const x = DAYC.x+zn.x+Math.cos(a)*d, z = DAYC.z+zn.z+Math.sin(a)*d;
    if (nodes.some(n => Math.hypot(n.x-x,n.z-z) < 1.7)) continue;
    makeNode(zn.type, x, z); placed++;
  }
}
const STRAY = {wood:16, stone:10, metal:7, ice:7, poison:6, lava:6, crystal:3};
for (const t in STRAY) for (let i=0;i<STRAY[t];i++) {
  for (let tries=0; tries<40; tries++) {
    const x = DAYC.x+rnd(-DHALF+2,DHALF-2), z = DAYC.z+rnd(-DHALF+2,DHALF-2);
    const zn0=zoneAt(x-DAYC.x,z-DAYC.z); if ((zn0 && zn0.type!==t) || Math.hypot(x-DAYC.x,z-DAYC.z)<4 || nodes.some(n=>Math.hypot(n.x-x,n.z-z)<1.7)) continue;
    makeNode(t,x,z); break;
  }
}
function updateNodes(dt) {
  const _t = performance.now()/1000; M_LAVA.emissiveIntensity = 1.2+Math.sin(_t*2)*.35; for (const f of nodeAnim) f(_t);
  for (const n of nodes) if (!n.alive) { n.regen-=dt; if (n.regen<=0) { n.alive=true; n.hp=NODE_TYPES[n.type].hits; n.g.visible=true; n.claimed=false; } }
}
function killNode(n) { n.alive=false; n.g.visible=false; n.regen=14+Math.random()*14; n.claimed=false; }
// zone signposts
for (const zn of ZONES) dayGroup.add(box(.2,2.4,.2,0x6b4423,DAYC.x+zn.x,1.2,DAYC.z+zn.z+zn.r+0.2), box(1.6,.7,.15,0xd8b878,DAYC.x+zn.x,2.4,DAYC.z+zn.z+zn.r+0.2));
// camp at the day spawn
dayGroup.add(box(2,.5,2,0xb8b8c0,DAYC.x,.25,DAYC.z));
const campStone = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshBasicMaterial({color:0xffc400}));
campStone.position.set(DAYC.x,1.4,DAYC.z); dayGroup.add(campStone);

function showArea(day) { dayGroup.visible = day; nightGroup.visible = !day; }
