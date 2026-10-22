// Game rules: what a character can use, and the full stat computation (compute()).
const job=()=>S.land>=40?S.job:"";
// since the October 2026 update, sea levels above 69 no longer give stat points
const SEA_PTS_CAP=69;
const pointsTotal=()=>S.land*3+(Math.min(S.sea,SEA_PTS_CAP)-1);
const pointsUsed=()=>Object.values(S.pts).reduce((a,b)=>a+b,0);
function canUse(it){
  const cn=CLASSES[S.cls].name;
  if(it.c.length&&!it.c.includes(cn)&&!(job()&&it.c.includes(job())))return false;
  if((it.l||0)>S.land)return false;
  if(it.s&&!it.s.includes(S.gender))return false;
  return true;
}
// unequip items the current class / job / level / gender can no longer use
function pruneEquip(){
  // also trims stat points from builds saved before the sea level 69 cap
  while(pointsUsed()>pointsTotal()){const k=STATS.map(s=>s[0]).sort((a,b)=>S.pts[b]-S.pts[a])[0];if(!S.pts[k])break;S.pts[k]--}
  const gone=[];
  for(const [key,,kind] of SLOTS){const it=itemFrom(kind,S.eq[key]);if(it&&!canUse(it)){gone.push(it.n);delete S.eq[key];delete S.up[key];if(S.es)delete S.es[key]}}
  if(gone.length)toast(tx("removed_not_usable")+gone.join(", "));
}
function equipped(){const o={};for(const [k] of SLOTS){const it=S.eq[k];if(it)o[k]=it;}return o;}
function itemFrom(slotKind,idx){return idx==null?null:D.items[slotKind][idx]}

const MASTERY={"one-handed sword":"one_handed_sword","two-handed sword":"two_handed_sword","rifle":"rifle","dual guns":"duals"};
const PASSIVES=[[/max\. HP by (\d+)/,[0]],[/own MP by (\d+)/,[1]],[/melee accuracy by (\d+)/,[14]],[/magic accuracy by (\d+)/,[16]],[/accuracy by (\d+) and the max range/,[15]],
  [/chances of a critical hit by (\d+)/,[23]],[/magic critical chance by (\d+)/,[25]],[/avoidance rate by (\d+)/,[4]],[/Increases your physical defence by (\d+)/,[12]],
  [/wearing a shield, physical defence is increased by (\d+)/,[12],sh=>sh],[/maximum magic damage by (\d+)/,[10]]];
function compute(){
  const c=CLASSES[S.cls],L=S.land;
  const add={},mul={},stb={str:0,dex:0,con:0,int:0,wis:0,vol:0,luc:0};
  let wpn=null,pd=0,md=0;const setCount={};
  const push=b=>{const [code,op,v]=b;
    if(STAT_CODE[code]){stb[STAT_CODE[code]]+=v;return}
    if(code===126){for(const k in stb)stb[k]+=v;return}
    if(code===173){for(const k of [14,15,16])push([k,op,v]);return} // "Hit": all accuracies
    if(op==="*")mul[code]=(mul[code]||0)+v;else add[code]=(add[code]||0)+v;};
  for(const [key,,kind,upg] of SLOTS){
    if(!isActive(key))continue;
    const it=itemFrom(kind,S.eq[key]);if(!it)continue;
    it.b.forEach(push);
    if(kind==="weapon")wpn=it;
    if(it.pd!=null){pd+=it.pd;md+=it.md}
    const lv=S.up[key]||0;
    if(upg&&it.u&&D.upgrades[it.u]&&lv>0){(D.upgrades[it.u][lv]||[]).forEach(push)}
    if(hasEss(kind,upg))esList(key).forEach((ei,pos)=>{if(ei!=null&&D.essences[ei]&&!(D.essences[ei].k&&!isCore(kind,it,pos)))D.essences[ei].b.forEach(push)});
    if(S.ex&&S.ex[key]&&sealType(kind,it))S.ex[key].filter(b=>b[3]==="s").forEach(b=>push(b.slice(0,3)));
    if(it.st!=null)setCount[it.st]=(setCount[it.st]||0)+1;
  }
  const sets=[];
  for(const [si,n] of Object.entries(setCount)){const st=D.sets[si];if(!st)continue;const tr=setTiers(st);st.b.forEach((b,i)=>{if(n>=tr[i])push(b)});sets.push({st,n,tr})}
  // passive skills: flat bonuses read from the description of the learned level
  const buffs=[];for(const b of BUFFS){const lv=(S.bf||{})[b.id];if(!lv||!buffOk(b))continue;const fx=buffFx(b,Math.min(lv,buffMax(b)));fx.forEach(push);buffs.push({b,fx})}
  const passives=[];
  let mast=0,rangeUp=0;
  const shieldOn=SLOTS.some(([k,,kind])=>kind==="shield"&&isActive(k)&&itemFrom(kind,S.eq[k]));
  for(const [k,lv] of Object.entries(S.sk||{})){const sk=skills()[k];if(!sk||!lv||!sk.lv[lv-1])continue;
    const d=sk.lv[lv-1][7]||"";if(/Toggle|for \d+ (minutes|seconds)/.test(d))continue;
    {const m=d.match(/wearing (?:a )?(one-handed sword|two-handed sword|rifle|Dual Guns)[^\d]*by (\d+)/i);if(m&&wpn&&(MASTERY[m[1].toLowerCase()]===wpn.t||/dual guns/i.test(m[1]))){/* in-game bug: Dual Gun Mastery applies with any weapon */mast+=+m[2];passives.push(sk.n+" "+lv+tx("passive_attack_bonus")+m[2])}}
    {const m=d.match(/max range at which you can fire by (\d+)\s*M/i);if(m)rangeUp+=+m[1]*100}
    for(const [re,codes,cond] of PASSIVES){const m=d.match(re);if(m&&(!cond||cond(shieldOn))){codes.forEach(c=>push([c,"+",+m[1]]));passives.push(sk.n+" "+lv+tx("colon")+fmtB([codes[0],"+",+m[1]]))}}}
  const t={};for(const [k] of STATS)t[k]=c.base[k]+(S.pts[k]||0)+stb[k];
  const b=base(S.cls,L,t);
  // % bonuses apply to the unmodified value: class base + stat points only (no item/essence/set stat bonuses),
  // plus the weapon's own base damage (no upgrade); flat bonuses are added on top. Checked against an in-game
  // Gladiator 112 with Brave Cheongsam [Red]. Defense is the exception, see pd/md.
  const tr={};for(const [k] of STATS)tr[k]=c.base[k]+(S.pts[k]||0);
  const br=base(S.cls,L,tr);
  const A=code=>add[code]||0;
  const P=(...codes)=>codes.reduce((a,k)=>a+(mul[k]||0),0);
  const ATK=[6,7,8,9,10,11];
  const V=(full,raw,flat,...pc)=>full+flat+raw*P(...pc,...(pc.some(k=>ATK.includes(k))?[129]:[]));
  const wp=wpn?wpn.pa:[0,0],wm=wpn?wpn.ma:[0,0];
  const melee=!wpn||!RANGED.has(wpn.t);
  const r=v=>Math.floor(v);
  const mw=i=>melee?wp[i]:0,rw=i=>!melee?wp[i]:0;
  // in-game melee corrections per class, see CLASS_CALIBRATION in js/class-formulas.js
  const cm=CLASS_CALIBRATION[S.cls]?.melee;
  const cal=cm&&melee?(wpn?cm.weapon:cm.bare).map(x=>x+cm.perStr*(t.str-cm.strFrom)):[0,0];
  // weapon mastery passives (sword, two-handed sword, rifle, dual guns): flat bonus on the attack type the weapon uses, for every class
  const mMel=melee?mast:0,mRng=melee?0:mast;
  const out={
    hp:r(V(b.hp,b.hp,A(0),0)),mp:r(V(b.mp,b.mp,A(1),1)),
    melMin:r(V(b.mel+mw(0),b.mel+mw(0),A(7)+A(129)+cal[0]+mMel,7)),melMax:r(V(b.mel+mw(1),b.mel+mw(1),A(6)+A(129)+cal[1]+mMel,6)),
    rngMin:r(V(b.rng+rw(0),b.rng+rw(0),A(9)+A(129)+mRng,9)),rngMax:r(V(b.rng+rw(1),b.rng+rw(1),A(8)+A(129)+mRng,8)),
    magMin:r(V(b.mag+wm[0],b.mag+wm[0],A(11)+A(129),11)),magMax:r(V(b.mag+wm[1],b.mag+wm[1],A(10)+A(129),10)),
    hm:r(V(b.hm,b.hm,A(14),14)),hr:r(V(b.hr,b.hr,A(15),15)),hg:r(V(b.hg,b.hg,A(16),16)),
    cm:r(V(b.cr,b.cr,A(23),23)),crg:r(V(b.cr,b.cr,A(24),24)),cg:r(V(b.cr,b.cr,A(25),25)),
    av:r(V(b.av,b.av,A(4),4)),pd:r((pd+A(12)+A(130))*(1+P(12,130))),md:r((md+A(13)+A(130))*(1+P(13,130))), // defense: % after all bonuses
    // Cariad in-game bug: uses the default ranged speed (1.50 s) and ranged speed bonuses instead of the weapon's own
    speed:wpn?(wpn.t==="cariad"?1500/(1+(mul[131]||0)+(mul[18]||0)):wpn.sp/(1+(mul[131]||0)+(mul[wpn.t==="rifle"?18:17]||0))):null,range:wpn?wpn.rg+(melee?0:rangeUp):null,
  };
  const extras=[];
  for(const code of [2,3,5,17,18,19,20,21,22,69,113,114,131,43]){
    if(add[code])extras.push(fmtB([code,"+",add[code]]));
    if(mul[code])extras.push(fmtB([code,"*",mul[code]]));
  }
  return {t,stb,out,extras,sets,passives,buffs};
}
