// Game constants (classes, slots, stats), app state and small helpers.
// pick the interface language now that every lang/*.js file is registered
LANG=detectLang();
const CLASSES={
  explorer:{name:"Explorer",jobs:["Excavator","Sniper"],base:{str:19,dex:18,con:16,int:13,wis:10,vol:17,luc:10}},
  mercenary:{name:"Mercenary",jobs:["Gladiator","Guardian Swordsman"],base:{str:21,dex:15,con:22,int:8,wis:10,vol:17,luc:10}},
  noble:{name:"Noble",jobs:["Court Magician","Magic Knight"],base:{str:11,dex:16,con:12,int:21,wis:19,vol:14,luc:10}},
  saint:{name:"Saint",jobs:["Priest","Shaman"],base:{str:14,dex:14,con:14,int:16,wis:19,vol:16,luc:10}},
};
const STATS=[["str","STR",tx("strength")],["dex","DEX",tx("dexterity")],["con","CON","Constitution"],["int","INT","Intelligence"],["wis","WIS",tx("wisdom")],["vol",tx("will_short"),tx("will")],["luc","LUC",tx("luck")]];
const STAT_CODE={155:"con",156:"str",157:"int",158:"dex",159:"wis",160:"vol",161:"luc"};
// effect names, weapon type names and skill weapon names come from the language file (lang/*.js)
const EFFECT=langTable("effects");
const SLOTS=[
  ["weapon",tx("weapon_i"),"weapon",true],["shield",tx("shield_i"),"shield",false],["weapon2",tx("weapon_ii"),"weapon",true],["shield2",tx("shield_ii"),"shield",false],["weapon3",tx("weapon_iii"),"weapon",true],["shield3",tx("shield_iii"),"shield",false],["coat",tx("chest"),"coat",true],["pants",tx("pants"),"pants",true],
  ["gauntlet",tx("gloves"),"gauntlet",true],["shoes",tx("shoes"),"shoes",true],["hat",tx("hat"),"hat",false],["dress","Dress","dress",false],
  ["necklace",tx("necklace"),"necklace",false],["earring",tx("earrings"),"earring",false],["ring1",tx("ring_1"),"ring",false],["ring2",tx("ring_2"),"ring",false]];
const WTYPE=langTable("weaponTypes");
const WSKILL=langTable("skillWeapons");
const RANGED=new Set(["rifle","duals"]);
const NO_SHIELD=new Set(["two_handed_sword","rifle","duals", "rapier", "cariad"]);
const GRADE=["Normal","Rare","Unique",tx("legendary")];
const WSETS=[["weapon","shield"],["weapon2","shield2"],["weapon3","shield3"]]; // 3 weapon sets, only the active one counts
const setOf=key=>WSETS.findIndex(p=>p.includes(key));
const isActive=key=>{const i=setOf(key);return i<0||i===(S.ws||1)-1};
const ES_SLOTS=4;
// Set bonus tiers are not in the data: first bonus at 2 pieces, last at the full set, the ones between at full-1, full-2…
// (matches the in-game Steam Armor Set: [2] [4] [5]).
function setTiers(st){const k=st.b.length,n=st.c;if(k===1)return [n];return st.b.map((_,i)=>i===0?2:i===k-1?n:Math.max(2,n-(k-1-i)))} // weapon and armor: 2 core slots (take core or meta) + 2 meta-only slots
// weapons and armor take essences; shields too, but only essences marked "ALL"
const hasEss=(kind,upg)=>upg||kind==="shield";
const esTypeOk=(e,kind)=>e.t==="ALL"||(kind==="weapon"?e.t==="WEAPONS":kind==="shield"?false:e.t==="ARMOR");
const esList=key=>{const a=(S.es&&S.es[key])||[];return Array.from({length:ES_SLOTS},(_,i)=>a[i]??null)};
// Every item with essences has 4 slots. A core slot is an upgraded meta slot: it takes core or meta essences.
// Legendary weapons (grade 3) have 2 core + 2 meta slots, every other item 1 core + 3 meta.
// Saved positions: 0 = core, 1 = core on legendary weapons (meta otherwise), 2-3 = meta.
const coreSlots=(kind,it)=>kind==="weapon"&&it&&it.g===3?2:1;
const isCore=(kind,it,pos)=>pos<coreSlots(kind,it);
// display order (meta slots first, then core) and the slot number shown to the user
const esOrder=(kind,it)=>{const all=[0,1,2,3];return [...all.filter(p=>!isCore(kind,it,p)),...all.filter(p=>isCore(kind,it,p))]};
const esNum=(kind,it,pos)=>esOrder(kind,it).filter(p=>isCore(kind,it,p)===isCore(kind,it,pos)).indexOf(pos)+1;
function esUsable(e,key,pos){
  const kind=SLOTS.find(s=>s[0]===key)[2],it=itemFrom(kind,S.eq[key]);
  if(!it||!esTypeOk(e,kind))return false;
  if(e.k&&!isCore(kind,it,pos))return false;
  if(e.l>(it.l||0))return false;
  return true;
}

let D=null;
const fresh=()=>({cls:"explorer",job:"",land:60,sea:40,gender:"Male",pts:{str:0,dex:0,con:0,int:0,wis:0,vol:0,luc:0},eq:{},up:{},es:{},ex:{},sk:{},bf:{},ws:1});
let S=fresh();
let selSkill=null;

const $=id=>document.getElementById(id);
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2200)}
const iconStyle=i=>`background-position:-${(i%48)*32}px -${Math.floor(i/48)*32}px`;
const fmtB=b=>{const n=EFFECT[b[0]]||(tx("effect_prefix")+b[0]);if(b[1]==="*")return `${n} ${b[2]>=0?"+":""}${+(b[2]*100).toFixed(1)}%`;return `${n} ${b[2]>=0?"+":""}${+b[2].toFixed(1)}`};

const esc=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
const fmtDesc=t=>esc(t).replace(/\\n|\n/g,"<br>");
const fmtDur=v=>v>=3600?(v/3600).toFixed(v%3600?1:0)+" h":v>=60?(v/60).toFixed(v%60?1:0)+" min":v+" s";
