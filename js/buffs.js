// Buff definitions (party, personal, spirit) and their effects.
// share: can be received from any class; otherwise only the caster's own class/job. fx: [regex, codes per capture group, op]
const BUFFS=[
  // spirit (pet) skills: tiers I..V, values from the pet_skill table
  {id:"spirit",n:tx("spirit_2")+"Spirit's Blessing",share:1,pet:1,tiers:[[[0,"+",200],[1,"+",100]],[[0,"+",555],[1,"+",225]],[[0,"+",1125],[1,"+",575]],[[0,"+",1910],[1,"+",1150]]]},
  {id:"pshield",n:tx("spirit_2")+"Shield",share:1,pet:1,tiers:[[[12,"+",20],[13,"+",20]],[[12,"+",40],[13,"+",40]],[[12,"+",60],[13,"+",60]],[[12,"+",80],[13,"+",80]],[[12,"+",100],[13,"+",100]]]},
  {id:"pstrike",n:tx("spirit_2")+"Increase Striking Power",share:1,pet:1,tiers:[[[129,"+",20]],[[129,"+",40]],[[129,"+",60]],[[129,"+",80]],[[129,"+",100]]]},
  {id:"pspeed",n:tx("spirit_2")+"Increase Moving Speed",share:1,pet:1,tiers:[[[5,"*",0.2]],[[5,"*",0.2]]]},
  {id:"nature",cls:"saint",sk:"cp003600",share:1,fx:[[/defense by (\d+) and (\d+)/,[[12],[13]],"+"]]},
  {id:"life",cls:"saint",sk:"cp009300",share:1,fx:[[/HP by (\d+)/,[[0]],"+"]]},
  {id:"earth",cls:"saint",sk:"cp007800",share:1,fx:[[/defense by (\d+) as well as their attack power and maximum HP by (\d+) and (\d+)/,[[12],[129],[0]],"+"]]},
  {id:"spiritual",cls:"saint",sk:"cp003800",share:1,fx:[[/accuracy by (\d+)/,[[16]],"+"]]},
  {id:"windwalk",cls:"explorer",sk:"ck008100",share:1,fx:[[/by (\d+)%/,[[5]],"*"]]},
  {id:"aerial",cls:"explorer",sk:"ck008600",share:1,fx:[[/avoidance rate[^\d]*by (\d+)/,[[4]],"+"]]},
  {id:"hitchain",cls:"explorer",sk:"ck001300",share:1,fx:[[/by (\d+)/,[[14,15]],"+"]]},
  {id:"wings",cls:"explorer",sk:"ck005600",fx:[[/by (\d+)%/,[[5]],"*"]]},
  {id:"berserker",cls:"mercenary",sk:"ck004500",fx:[[/movement speed by (\d+)% and attack power by (\d+)/,[[5],null],"*"],[/attack power by (\d+)/,[[129]],"+"]]},
  {id:"berserk",cls:"mercenary",sk:"ck000200",fx:[[/attack power by (\d+)/,[[6,7]],"+"],[/defense by (\d+)%/,[[-130]],"*"]]},
  {id:"bloodfury",cls:"mercenary",sk:"ck007100",fx:[[/speed (\d+)%/,[[131,5]],"*"],[/attacking power by (\d+)/,[[129]],"+"]]},
  {id:"absdef",cls:"mercenary",sk:"ck008900",fx:[[/defense by (\d+)/,[[12,13]],"+"],[/movement speed is decreased by (\d+)%/,[[-5]],"*"]]},
  {id:"sword",cls:"noble",sk:"cp008700",fx:[[/magic damage by (\d+)/,[[10,11]],"+"]]},
  {id:"mboost",cls:"noble",sk:"cp002700",share:1,fx:[[/MP by (\d+)/,[[1]],"+"]]},
];
const buffSkill=b=>b.sk?D.skills[b.cls][b.sk]:null;
const buffName=b=>b.n||buffSkill(b).n;
const buffMax=b=>b.tiers?b.tiers.length:buffSkill(b).lv.length;
function buffOk(b){if(b.share)return true;const s=buffSkill(b);return b.cls===S.cls&&s&&(s.c.includes(CLASSES[S.cls].name)||s.c.includes(S.job))}
function buffFx(b,lv){if(b.tiers)return b.tiers[lv-1]||[];const d=(buffSkill(b).lv[lv-1]||[])[7]||"";const out=[];
  for(const [re,groups,op] of b.fx){const m=d.match(re);if(!m)continue;groups.forEach((codes,i)=>{if(!codes)return;const v=+m[i+1];codes.forEach(c=>out.push([Math.abs(c),op,(c<0?-1:1)*(op==="*"?v/100:v)]))})}
  return out}
