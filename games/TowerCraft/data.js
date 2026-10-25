'use strict';
const TITLE = "TowerCraft";
const DAY_LEN = 180, PREP_LEN = 60, BOSS_WAVE = 10, SHARK_WAVE = 50;
const RES = {
  gold:{n:'Gold',c:'#ffd23f'}, wood:{n:'Wood',c:'#a0642d'}, stone:{n:'Stone',c:'#9aa0a6'},
  metal:{n:'Metal',c:'#c9d6e2'}, ice:{n:'Ice',c:'#7be8ff'}, poison:{n:'Poison',c:'#8be03a'},
  lava:{n:'Lava',c:'#ff5a1f'}, crystal:{n:'Crystal',c:'#d36bff'}
};
const TOWERS = {
  arrow:{n:'Arrow',cost:{wood:2,stone:2},unlock:0,hp:60,range:7,rate:0.8,dmg:6,col:0x8a8f98,d:'Regular tower. Steady arrows.'},
  bomb:{n:'Bomb',cost:{wood:1,stone:2,metal:1,lava:1},unlock:0,hp:70,range:7,rate:2.2,dmg:22,aoe:2.6,col:0x333340,d:'Cannon. Area damage.'},
  ice:{n:'Ice',cost:{wood:3,stone:2,ice:5},unlock:22,hp:60,range:5.5,rate:0.5,dmg:0,slow:0.45,col:0x7be8ff,d:'Slows nearby enemies.'},
  resource:{n:'Resources',cost:{wood:4,stone:3,gold:1},unlock:15,hp:50,range:0,rate:12,dmg:0,col:0xe0b040,d:'Slowly produces resources.'},
  pierce:{n:'One Direction',cost:{wood:4,metal:2},unlock:30,hp:60,range:9,rate:1.6,dmg:14,col:0xd05050,d:'Piercing bolt in a line.'},
  poison:{n:'Poison',cost:{wood:3,stone:2,poison:4},unlock:34,hp:60,range:6,rate:1.4,dmg:5,col:0x6fd02a,d:'Poison: damage over time.'},
  trap:{n:'Trap',cost:{wood:1,metal:2},unlock:26,hp:40,range:1.1,rate:6,dmg:6,col:0x6a4a2a,d:'Traps one enemy. Can sit on the path.'},
  fire:{n:'Fire',cost:{wood:2,stone:3,metal:2,lava:3},unlock:45,hp:70,range:5.5,rate:1.2,dmg:7,col:0xff6a1a,d:'Burns; fire can spread.'}
};
const MAX_TOWER_LV = 3, MAX_SHRINE_LV = 5;
const ENEMIES = {
  normal:{n:'Normal',hp:60,sp:2.0,dmg:5,r:0.5,col:0x7a4fb0,gold:2},
  fast:{n:'Fast',hp:34,sp:3.8,dmg:3,r:0.4,col:0x4fd0b0,gold:2},
  tank:{n:'Tank',hp:240,sp:1.2,dmg:12,r:0.8,col:0x555a70,gold:5},
  brood:{n:'Split',hp:130,sp:1.6,dmg:6,r:0.75,col:0xb04f8a,gold:3},
  small:{n:'Split Spawn',hp:26,sp:2.6,dmg:3,r:0.3,col:0xd08ab8,gold:1},
  breaker:{n:'Tower Destroyer',hp:160,sp:1.8,dmg:8,r:0.65,col:0xd0802a,gold:6,breaker:true},
  fireimp:{n:'Fire Imp',hp:90,sp:2.2,dmg:6,r:0.55,col:0xff5a1a,gold:4,elem:'fire'},
  frost:{n:'Frost Golem',hp:110,sp:1.7,dmg:7,r:0.65,col:0xa8e8ff,gold:4,elem:'ice'},
  boss:{n:'Aldric',hp:4500,sp:1.0,dmg:40,r:1.5,col:0x3a1a5a,gold:200,boss:true},
  shark:{n:'Sharky',hp:16000,sp:1.5,dmg:80,r:1.8,col:0x3a7bb0,gold:1000,shark:true}
};
const HELPERS = {
  gatherer:{n:'Gatherer',cost:15,max:6,col:0x3aa85a,d:'Harvests nodes by day, repairs towers at night.'},
  fighter:{n:'Fighter',cost:20,max:5,col:0xd04040,d:'Attacks enemies at night.'},
};
const TOOLS = {
  axe:{n:'Axe',col:'#a0642d'}, pickaxe:{n:'Pickaxe',col:'#9aa0a6'},
  bucket:{n:'Bucket',col:'#ff5a1f'}
};
const toolKeys = Object.keys(TOOLS);
const hexOf = c => '#'+c.toString(16).padStart(6,'0');
function waveCounts(list){ const c={}; for (const t of list) c[t]=(c[t]||0)+1; return c; }
const QUESTS = [
  {t:'Collect 10 wood',k:'wood',n:10,gold:5},
  {t:'Collect 8 stone',k:'stone',n:8,gold:5},
  {t:'Craft a tower',k:'crafted',n:1,gold:5},
  {t:'Place a tower',k:'placed',n:1,gold:5},
  {t:'Collect 5 metal',k:'metal',n:5,gold:8},
  {t:'Hire a helper',k:'hired',n:1,gold:10},
  {t:'Survive night 1',k:'nights',n:1,gold:10},
  {t:'Unlock a new tower',k:'unlocked',n:1,gold:10},
  {t:'Upgrade a tower',k:'upgraded',n:1,gold:10},
  {t:'Collect 5 ice',k:'ice',n:5,gold:10},
  {t:'Collect 3 lava',k:'lava',n:3,gold:10},
  {t:'Collect 3 poison',k:'poison',n:3,gold:10},
  {t:'Collect 2 crystals',k:'crystal',n:2,gold:15},
  {t:'Defeat 30 enemies',k:'kills',n:30,gold:12},
  {t:'Survive 5 nights',k:'nights',n:5,gold:25},
  {t:'Upgrade the Sunstone',k:'shrineUp',n:1,gold:15},
  {t:'Defeat a Tower Destroyer',k:'breakers',n:1,gold:15},
  {t:'Survive 9 nights',k:'nights',n:9,gold:40},
  {t:'Defeat Aldric',k:'boss',n:1,gold:100},
  {t:'Defeat Sharky',k:'shark',n:1,gold:500}
];
const STORY = {
  intro:["A crystal called the Sunstone once kept the monsters of the deep earth sealed underground. It cracked, and now every night a Gate opens and creatures pour out. By day they sleep.",
    "You are the last Warden. Protect the Sunstone's shrine and push the monsters back."],
  boss:"Night 10: Aldric, the Warden who cracked the Sunstone while trying to harness its power. The deep earth consumed him, and now he leads the monsters.",
  win:"Aldric falls. The Sunstone flares and the Gate shudders shut... but its light reveals the Hollow Gate was only the first of many. Each is a deeper layer of the earth, guarded by a stronger master. The monsters follow the light. The Deeper Gates await.",
  lose:"The Sunstone shatters. The Gate stays open forever."
};
function waveList(w){
  const L=[], add=(t,n)=>{ if(n>0&&t!=='boss'&&t!=='shark'&&t!=='breaker') n=Math.ceil(n*1.3)+Math.floor(w/4); for(let i=0;i<n;i++)L.push(t)};
  const T={
    1:[['normal',3]], 2:[['normal',6]], 3:[['normal',5],['fast',3]], 4:[['normal',5],['tank',2]],
    5:[['brood',3],['fast',3]], 6:[['breaker',1],['fast',6]], 7:[['breaker',1],['normal',7],['tank',1]],
    8:[['breaker',1],['tank',3],['fast',7],['brood',2]], 9:[['breaker',1],['normal',10],['brood',5]],
    10:[['breaker',1],['tank',3],['fast',5],['normal',10],['brood',3],['boss',1]]
  };
  if (T[w]) T[w].forEach(([t,n])=>add(t,n));
  else {
    add('normal',8+w); add('fast',3+Math.floor(w/2)); add('tank',Math.floor(w/4));
    add('brood',Math.floor(w/4)); add('breaker',1+Math.floor((w-6)/8));
    if (w%10===0) add('boss',1);
    if (w===SHARK_WAVE) add('shark',1);
  }
  if (w>=7) { add('fireimp',1+Math.floor((w-7)/3)); add('frost',1+Math.floor((w-7)/3)); }
  return L.sort(()=>Math.random()-0.5);
}
const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
const DIR_NAMES = ['X+ (right)','Y+ (down)','X- (left)','Y- (up)'];
