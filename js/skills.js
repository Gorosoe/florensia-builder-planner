// Skill tree: points, locks, rendering and skill details.
const skills=()=>D.skills[S.cls];
const NO_SKP=tx("no_skill_points_left");
const skPointsTotal=()=>S.land;
const skPointsUsed=()=>Object.values(S.sk).reduce((a,b)=>a+b,0);
function skLock(code){
  const s=skills()[code],lv=S.sk[code]||0,cn=CLASSES[S.cls].name;
  if(s.c.length&&!s.c.includes(cn)&&!(job()&&s.c.includes(job())))return tx("job_only")+s.c.join(" / ");
  const miss=s.r.filter(r=>!(S.sk[r]>0)&&skills()[r]);
  if(miss.length)return tx("requires")+miss.map(r=>skills()[r].n).join(", ");
  if(lv>=s.lv.length)return tx("max_level_reached");
  if(s.lv[lv][0]>S.land)return tx("skill_level_requires",{lv:lv+1,req:s.lv[lv][0]});
  if(skPointsUsed()>=skPointsTotal())return NO_SKP;
  return "";
}
function children(code){const out=[];for(const [k,s] of Object.entries(skills()))if(s.r.includes(code)){out.push(k,...children(k))}return out}
function setSk(code,lv){
  if(lv<=0){for(const k of [code,...children(code)])delete S.sk[k]}else S.sk[code]=lv;
}
function skInc(code,max){let n=0;while(!skLock(code)){S.sk[code]=(S.sk[code]||0)+1;n++;if(!max)break}return n}
function skDec(code){const lv=S.sk[code]||0;if(lv>0)setSk(code,lv-1)}
function pruneSkills(){
  // drop levels that the current level / job no longer allows
  let changed=true;
  while(changed){changed=false;
    for(const [k,s] of Object.entries(skills())){
      let lv=S.sk[k]||0;if(!lv)continue;
      const cn=CLASSES[S.cls].name;
      const classOk=!s.c.length||s.c.includes(cn)||(job()&&s.c.includes(job()));
      const reqOk=s.r.every(r=>!skills()[r]||S.sk[r]>0);
      if(!classOk||!reqOk){setSk(k,0);changed=true;continue}
      lv=Math.min(lv,s.lv.length);
      while(lv>0&&s.lv[lv-1][0]>S.land)lv--;
      if(lv!==S.sk[k]){setSk(k,lv);changed=true}
    }}
  while(skPointsUsed()>skPointsTotal()){const ks=Object.keys(S.sk);const k=ks[ks.length-1];setSk(k,S.sk[k]-1)}
}
function renderTree(){
  const left=skPointsTotal()-skPointsUsed();
  $("skLeft").textContent=txn("free_skill_points",left)+` · ${skPointsUsed()}/${skPointsTotal()}`;
  const tr=$("tree");tr.style.backgroundImage=`url(tree-${S.cls}.png)`;
  tr.innerHTML=Object.entries(skills()).map(([code,s])=>{
    const lv=S.sk[code]||0,lock=skLock(code);
    const cls=["sk",lv?"lvl":"",(!lv&&lock&&lock!==NO_SKP)?"off":"",selSkill===code?"sel":""].join(" ");
    return `<button type="button" class="${cls}" data-sk="${code}" style="left:${(s.x-2)/448*100}%;top:${(s.y-2)/503*100}%" aria-label="${s.n} ${tx("skill_level_of",{lv})} ${s.lv.length}" title="${s.n}"><span class="b">${lv}/${s.lv.length}</span></button>`}).join("");
  renderDetail();
}
function renderDetail(){
  const el=$("detail");
  if(!selSkill||!skills()[selSkill]){el.innerHTML=tx("pick_a_skill_tap_a_tree");return}
  const s=skills()[selSkill],lv=S.sk[selSkill]||0,lock=skLock(selSkill);
  const cols=[[tx("cast"),3,v=>v.toFixed(1)+" s"],[tx("range"),4,v=>(v/100).toFixed(1)+" m"],[tx("area"),5,v=>(v/100).toFixed(1)+" m"],[tx("duration"),6,fmtDur]].filter(c=>s.lv.some(l=>l[c[1]]));
  el.innerHTML=`<h3>${s.n}</h3>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="pill">${tx("level")} ${lv}/${s.lv.length}</span><span class="pill">${s.c.length?s.c.join(" / "):tx("all_classes")}</span><span class="pill">${tx("weapon_2")}${s.w.split(", ").map(w=>WSKILL[w]||w).join(", ")}</span></div>
   <p>${fmtDesc(lv?s.lv[lv-1][7]:s.d)}</p>
   ${lv<s.lv.length?`<p class="hint"><b>${tx("next_level",{lv:lv+1})}</b> ${fmtDesc(s.lv[lv][7])}</p>`:""}
   ${s.r.length?`<p class="hint">${tx("requires")}${s.r.map(r=>skills()[r]?skills()[r].n:r).join(", ")} ${tx("level_1_minimum")}</p>`:""}
   <div class="btns"><button type="button" class="btn" data-act="dec" ${lv?"":"disabled"}>−1</button><button type="button" class="btn primary" data-act="inc" ${lock?"disabled":""}>+1</button><button type="button" class="btn" data-act="max" ${lock?"disabled":""}>Max possible</button><button type="button" class="btn" data-act="zero" ${lv?"":"disabled"}>${tx("reset")}</button></div>
   ${lock?`<div class="why">${lock}</div>`:""}
   <div class="tblwrap"><table class="lvtable"><thead><tr><th style="text-align:left">${tx("lvl_2")}</th><th>${tx("req_lvl")}</th><th>MP</th><th>${tx("cooldown")}</th>${cols.map(c=>`<th>${c[0]}</th>`).join("")}</tr></thead><tbody>
   ${s.lv.map((l,i)=>`<tr class="${i+1===lv?"cur":""} ${l[0]>S.land?"locked":""}"><td style="text-align:left">${i+1}</td><td>${l[0]}</td><td>${l[1]}</td><td>${l[2]?(l[2]/1000).toFixed(1)+" s":"–"}</td>${cols.map(c=>`<td>${l[c[1]]?c[2](l[c[1]]):"–"}</td>`).join("")}</tr>`).join("")}
   </tbody></table></div>`;
}
