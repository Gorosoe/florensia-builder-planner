// Event handlers for every control on the page.
document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.c){const keep=S.gender;S={...fresh(),cls:t.dataset.c,land:S.land,sea:S.sea,gender:keep};selSkill=null;renderAll();return}
  if(t.dataset.s){const k=t.dataset.s,d=+t.dataset.d*(e.shiftKey?10:1);const left=pointsTotal()-pointsUsed();
    S.pts[k]=Math.max(0,S.pts[k]+(d>0?Math.min(d,Math.max(left,0)):d));renderStats();store.set("fl-current",encode());return}
  if(t.dataset.ws){S.ws=+t.dataset.ws;renderAll();return}
  if(t.dataset.ex){openEx(t.dataset.ex);return}
  if(t.dataset.exdel!=null){S.ex[exKey].splice(+t.dataset.exdel,1);renderEx();renderAll();return}
  if(t.dataset.slot){openPicker(t.dataset.slot);return}
  if(t.dataset.es){const [k,p]=t.dataset.es.split(":");openEss(k,+p);return}
  if(t.dataset.ei!=null&&pkSlot&&pkEs!=null){S.es=S.es||{};const a=esList(pkSlot);a[pkEs]=+t.dataset.ei;S.es[pkSlot]=a;$("picker").close();renderAll();return}
  if(t.dataset.i!=null&&pkSlot){S.eq[pkSlot]=+t.dataset.i;S.up[pkSlot]=S.up[pkSlot]||0;
    if(S.es&&S.es[pkSlot])S.es[pkSlot]=esList(pkSlot).map((ei,pos)=>ei!=null&&esUsable(D.essences[ei],pkSlot,pos)?ei:null);
    for(const [wk,sk] of WSETS){const w=itemFrom("weapon",S.eq[wk]);if(w&&NO_SHIELD.has(w.t))delete S.eq[sk]}
    $("picker").close();renderAll();return}
  if(t.dataset.sk){const code=t.dataset.sk;selSkill=code;if(!skLock(code)&&e.detail<2)skInc(code,false);renderAll();return}
  if(t.dataset.act){const a=t.dataset.act;if(a==="inc")skInc(selSkill,false);if(a==="max")skInc(selSkill,true);if(a==="dec")skDec(selSkill);if(a==="zero")setSk(selSkill,0);renderAll();return}
  if(t.dataset.load){const list=store.get("fl-builds")||{};const n=decodeURIComponent(t.dataset.load);S=decode(list[n]);$("bName").value=n;selSkill=null;pruneSkills();pruneEquip();renderAll();toast(tx("build_loaded",{name:n}));return}
  if(t.dataset.del){const list=store.get("fl-builds")||{};delete list[decodeURIComponent(t.dataset.del)];store.set("fl-builds",list);renderSaved();toast(tx("build_deleted"));return}
});
$("tree").addEventListener("contextmenu",e=>{const t=e.target.closest("[data-sk]");if(!t)return;e.preventDefault();selSkill=t.dataset.sk;skDec(selSkill);renderAll()});
$("tree").addEventListener("dblclick",e=>{const t=e.target.closest("[data-sk]");if(!t)return;skInc(t.dataset.sk,true);renderAll()});
$("slots").addEventListener("change",e=>{if(e.target.dataset.up){S.up[e.target.dataset.up]=+e.target.value;renderStats();renderSlots();store.set("fl-current",encode())}});
$("slots").addEventListener("click",e=>{if(e.target.closest("select"))e.stopPropagation()},true);
$("job").addEventListener("change",e=>{S.job=e.target.value;pruneSkills();pruneEquip();renderAll()});
const clampIn=(el,min,max)=>Math.min(max,Math.max(min,parseInt(el.value,10)||min));
$("lvLand").addEventListener("change",e=>{S.land=clampIn(e.target,1,120);if(S.land<40)S.job="";pruneEquip();
  while(pointsUsed()>pointsTotal()){const k=STATS.map(s=>s[0]).sort((a,b)=>S.pts[b]-S.pts[a])[0];S.pts[k]--}
  pruneSkills();renderAll()});
$("lvSea").addEventListener("change",e=>{S.sea=clampIn(e.target,1,99);while(pointsUsed()>pointsTotal()){const k=STATS.map(s=>s[0]).sort((a,b)=>S.pts[b]-S.pts[a])[0];S.pts[k]--}renderAll()});
$("gender").addEventListener("change",e=>{S.gender=e.target.value;pruneEquip();renderAll()});
$("skReset").addEventListener("click",()=>{S.sk={};renderAll();toast(tx("tree_reset"))});
["pkSearch","pkUsable","pkBonus","pkType","pkSort"].forEach(id=>$(id).addEventListener(id==="pkSearch"?"input":"change",renderPicker));
$("pkClose").addEventListener("click",()=>$("picker").close());
$("exClose").addEventListener("click",()=>$("exDlg").close());
$("exCode").addEventListener("change",exSync);
$("exAdd").addEventListener("click",()=>{const v=parseFloat($("exVal").value);if(!isFinite(v)||!v)return;const raw=$("exCode").value,seal=raw[0]==="s",code=+(seal?raw.slice(1):raw);
  S.ex=S.ex||{};const a=(S.ex[exKey]=S.ex[exKey]||[]);
  if(seal&&a.filter(b=>b[3]==="s").length>=5){toast(tx("max_seals_reached"));return}
  const pct=seal?sealRange(code,exItem())[0]==="*":$("exPct").checked;
  a.push(seal?[code,pct?"*":"+",pct?v/100:v,"s"]:[code,pct?"*":"+",pct?v/100:v]);exSync();renderEx();renderAll()});
$("pkClear").addEventListener("click",()=>{if(pkEs!=null){const a=esList(pkSlot);a[pkEs]=null;S.es[pkSlot]=a}else{delete S.eq[pkSlot];delete S.up[pkSlot];if(S.es)delete S.es[pkSlot]}$("picker").close();renderAll()});
$("picker").addEventListener("click",e=>{if(e.target===$("picker"))$("picker").close()});
$("bSave").addEventListener("click",()=>{const n=$("bName").value.trim()||`${CLASSES[S.cls].name}${job()?" "+job():""} ${tx("lvl")} ${S.land}`;const list=store.get("fl-builds")||{};list[n]=encode();store.set("fl-builds",list);$("bName").value=n;renderSaved();toast(tx("build_saved",{name:n}))});
$("bNew").addEventListener("click",()=>{S={...fresh(),cls:S.cls};$("bName").value="";selSkill=null;renderAll();toast(tx("new_build"))});
$("bExport").addEventListener("click",()=>{const c=encode();$("bCode").value=c;
  navigator.clipboard?.writeText(c).then(()=>toast(tx("code_copied")),()=>{$("bCode").select();toast(tx("code_selected_copy_it"))})??($("bCode").select(),toast(tx("code_selected_copy_it")))});
$("ptsReset").addEventListener("click",()=>{S.pts={...fresh().pts};renderAll();store.set("fl-current",encode());toast(tx("points_reset"))});
$("bImport").addEventListener("click",()=>{try{S=decode($("bCode").value);selSkill=null;pruneSkills();pruneEquip();renderAll();toast(tx("build_imported"))}catch(err){toast(tx("this_is_not_a_valid_build"))}});
$("lang").addEventListener("change",e=>setLang(e.target.value));
translatePage();
