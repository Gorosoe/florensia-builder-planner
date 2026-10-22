// Startup: loads the data, restores the last build or an example one.
(window.FLO_DATA?Promise.resolve(window.FLO_DATA):fetch("data.json").then(r=>r.json())).then(d=>{
  D=d;
  const cur=store.get("fl-current");
  if(cur){try{S=decode(cur)}catch(e){S=fresh()}}
  else{ // example build so the page opens in a working state
    S={...fresh(),cls:"explorer",job:"Sniper",land:60,sea:40,pts:{...fresh().pts}};
    const pick=(kind,pred)=>{let best=-1;D.items[kind].forEach((it,i)=>{if(pred(it)&&canUse(it)&&(best<0||(it.l||0)>(D.items[kind][best].l||0)))best=i});return best<0?undefined:best};
    S.eq.weapon=pick("weapon",it=>it.t==="rifle");for(const k of ["coat","pants","gauntlet","shoes"])S.eq[k]=pick(k,()=>true);
    for(const k in S.eq)if(S.eq[k]===undefined)delete S.eq[k];
    for(const c of ["ck000800","ck009000","ck005800","ck001000","ck009100","ck001500"])skInc(c,true);
    selSkill="ck005800";
  }
  pruneSkills();pruneEquip();renderAll();renderSaved();
}).catch(()=>{$("detail").innerHTML=tx("data_unavailable_the_data_file_could")});
