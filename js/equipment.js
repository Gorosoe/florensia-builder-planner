// Equipment slots, item/essence picker and seals dialog.
function renderSlots(){
  const slotHtml=([key,label,kind,upg])=>{
    const it=itemFrom(kind,S.eq[key]);
    const si=setOf(key),wpn=si>=0?itemFrom("weapon",S.eq[WSETS[si][0]]):null;
    const blocked=kind==="shield"&&wpn&&NO_SHIELD.has(wpn.t);
    const bad=it&&!canUse(it);
    let sub=label;
    if(it){const parts=[];if(it.t)parts.push(WTYPE[it.t]);parts.push(tx("lvl_prefix")+(it.l||0));const lv=S.up[key]||0;const ub=upg&&it.u&&lv>0&&D.upgrades[it.u]?(D.upgrades[it.u][lv]||[]):[];if(ub.length)parts.push("+"+lv+tx("colon")+ub.map(fmtB).join(", "));else if(it.b.length)parts.push(it.b.slice(0,2).map(fmtB).join(", "));sub=parts.join(" · ")}
    const up=upg&&it&&it.u?`<select data-up="${key}" aria-label="${tx("upgrade")} ${label}">${Array.from({length:D.upgrades[it.u]?D.upgrades[it.u].length:16},(_,i)=>`<option value="${i}" ${(S.up[key]||0)===i?"selected":""}>+${i}</option>`).join("")}</select>`:"";
    return `<div class="slot-wrap"><button type="button" class="slot${up?" has-up":""}" data-slot="${key}" ${blocked?`disabled title="${tx("two_handed_weapon_equipped")}"`:""}>
      <span class="ico">${it?`<span class="icon" style="${iconStyle(it.i)}"></span>`:`<span class="label" style="font-size:9px">${label.slice(0,4)}</span>`}</span>
      <span style="min-width:0"><span class="label">${label}${bad?` · <span style="color:var(--warn)">${tx("not_usable")}</span>`:""}</span><div class="nm ${it?"g"+(it.g||0):"empty"}">${it?it.n:(blocked?tx("blocked_by_weapon"):tx("empty"))}</div><div class="sub">${it?sub:"&nbsp;"}</div></span>
      <span></span></button>${up?`<span style="position:absolute;right:8px;top:30px;transform:translateY(-50%)">${up}</span>`:""}${hasEss(kind,upg)&&it?`<div class="ess"><span class="elabel">Essences</span>${esOrder(kind,it).map(pos=>{const ei=esList(key)[pos],core=isCore(kind,it,pos),num=esNum(kind,it,pos);const e=ei!=null?D.essences[ei]:null;const lbl=(core?tx("core_slot"):tx("meta_slot"))+num+(e?tx("colon")+e.n+" ("+e.b.map(fmtB).join(", ")+")":tx("empty_suffix"));return `<button type="button" class="es${core?" core":""}${e?" set":""}" data-es="${key}:${pos}" title="${lbl.replace(/"/g,"&quot;")}" aria-label="${lbl.replace(/"/g,"&quot;")}">${e?`<span class="icon" style="${iconStyle(e.i)}"></span>`:(core?"◆":"+")}</button>`}).join("")}${sealType(kind,it)?`<button type="button" class="es exb${(S.ex&&S.ex[key]&&S.ex[key].length)?" set":""}" data-ex="${key}" title="${tx("seals")}" aria-label="${tx("seals_of")} ${label}">✎${(S.ex&&S.ex[key]&&S.ex[key].length)||""}</button>`:""}</div>`:""}${!upg&&it&&sealType(kind,it)?`<div class="ess"><button type="button" class="es exb${(S.ex&&S.ex[key]&&S.ex[key].length)?" set":""}" data-ex="${key}" title="${tx("seals")}" aria-label="${tx("seals_of")} ${label}">✎${(S.ex&&S.ex[key]&&S.ex[key].length)||""}</button></div>`:""}</div>`;
  };
  const ROM=["I","II","III"];
  $("slots").innerHTML=`<div class="wsets"><div class="wsets-h"><span class="label">${tx("weapon_sets_only_the_active_set")}</span><div class="wtabs" role="group" aria-label="${tx("active_weapon_set")}">${ROM.map((r,i)=>`<button type="button" class="cls" data-ws="${i+1}" aria-pressed="${(S.ws||1)===i+1}">Set ${r}</button>`).join("")}</div></div>`+
    WSETS.map((pair,i)=>`<div class="wrow${(S.ws||1)===i+1?"":" off"}"><span class="wnum">${ROM[i]}</span>${pair.map(k=>slotHtml(SLOTS.find(x=>x[0]===k))).join("")}</div>`).join("")+`</div>`+
    SLOTS.filter(x=>setOf(x[0])<0).map(slotHtml).join("");
}

let pkSlot=null,pkEs=null;
function openPicker(key){
  pkSlot=key;pkEs=null;$("pkClear").textContent=tx("remove_item");$("pkBonus").parentElement.hidden=false;$("pkSort").hidden=false;const [, label, kind]=SLOTS.find(s=>s[0]===key);
  $("pkTitle").textContent=label;$("pkSearch").value="";
  const ty=$("pkType");ty.hidden=kind!=="weapon";
  if(kind==="weapon")ty.innerHTML=`<option value="">${tx("all_weapons")}</option>`+Object.entries(WTYPE).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  renderPicker();$("picker").showModal();$("pkSearch").focus();
}
function openEss(key,pos){
  pkSlot=key;pkEs=pos;const [,label,kind]=SLOTS.find(s=>s[0]===key),it=itemFrom(kind,S.eq[key]);
  $("pkTitle").textContent=`${label} · ${isCore(kind,it,pos)?tx("core_slot_lower")+esNum(kind,it,pos)+tx("core_or_meta"):tx("meta_slot_lower")+esNum(kind,it,pos)}`;$("pkSearch").value="";
  $("pkType").hidden=true;$("pkBonus").parentElement.hidden=true;$("pkSort").hidden=true;
  $("pkClear").textContent=tx("remove_essence");
  renderPicker();$("picker").showModal();$("pkSearch").focus();
}
function renderEssPicker(){
  const q=$("pkSearch").value.trim().toLowerCase(),usable=$("pkUsable").checked,kind=SLOTS.find(s=>s[0]===pkSlot)[2];
  const taken={};esList(pkSlot).forEach((v,i)=>{if(i!==pkEs&&v!=null&&D.essences[v]){const n=D.essences[v].n;taken[n]=(taken[n]||0)+1}});
  const TY={ALL:tx("weapon_or_armor"),WEAPONS:tx("weapon"),ARMOR:tx("armor")};
  let list=D.essences.map((e,i)=>({e,i})).filter(({e,i})=>{
    if(e.k&&!isCore(kind,itemFrom(kind,S.eq[pkSlot]),pkEs))return false;
    if(!esTypeOk(e,kind))return false;
    if((taken[e.n]||0)>=2)return false; // max 2 of the same essence per piece
    if(usable&&!esUsable(e,pkSlot,pkEs))return false;
    if(q){const hay=(e.n+" "+e.b.map(fmtB).join(" ")).toLowerCase();if(!hay.includes(q))return false}
    return true});
  list.sort((a,b)=>b.e.l-a.e.l||a.e.n.localeCompare(b.e.n));
  $("pkList").innerHTML=list.length?list.map(({e,i})=>`<button type="button" class="it" data-ei="${i}"><span class="icon" style="${iconStyle(e.i)}"></span><span style="min-width:0"><div class="nm g${e.g||0}">${e.n}</div><div class="st">${e.b.map(fmtB).join(", ")} · ${TY[e.t]}</div></span><span class="lv">${tx("gear_lvl")} ${e.l}+</span></button>`).join(""):`<p class="hint" style="padding:12px">${tx("no_matching_essence_untick_usable_by")}</p>`;
  $("pkCount").textContent=txn("essences_count",list.length);
}
function renderPicker(){
  if(pkEs!=null)return renderEssPicker();
  const [, , kind]=SLOTS.find(s=>s[0]===pkSlot);
  const q=$("pkSearch").value.trim().toLowerCase(),usable=$("pkUsable").checked,onlyB=$("pkBonus").checked,ty=$("pkType").value,sort=$("pkSort").value;
  let list=D.items[kind].map((it,i)=>({it,i})).filter(({it})=>{
    if(usable&&!canUse(it))return false;
    if(onlyB&&!it.b.length)return false;
    if(kind==="weapon"&&ty&&it.t!==ty)return false;
    if(q){const hay=(it.n+" "+it.b.map(fmtB).join(" ")).toLowerCase();if(!hay.includes(q))return false}
    return true;});
  list.sort(sort==="name"?(a,b)=>a.it.n.localeCompare(b.it.n):sort==="lva"?(a,b)=>(a.it.l||0)-(b.it.l||0):(a,b)=>(b.it.l||0)-(a.it.l||0));
  const total=list.length;list=list.slice(0,300);
  $("pkList").innerHTML=list.length?list.map(({it,i})=>{
    const st=[];
    if(it.pa)st.push(`Phys ${it.pa[0]}~${it.pa[1]} · Mag ${it.ma[0]}~${it.ma[1]} · ${WTYPE[it.t]}`);
    if(it.pd!=null)st.push(`${tx("def")} ${it.pd} / ${it.md}`);
    if(it.b.length)st.push(it.b.map(fmtB).join(", "));
    if(it.c.length){const jobs=Object.values(CLASSES).flatMap(c=>c.jobs);st.push((it.c.every(c=>jobs.includes(c))?tx("required_job"):tx("classes"))+it.c.join(", "))}
    if(it.st!=null&&D.sets[it.st])st.push("Set "+D.sets[it.st].n);
    return `<button type="button" class="it" data-i="${i}"><span class="icon" style="${iconStyle(it.i)}"></span><span style="min-width:0"><div class="nm g${it.g||0}">${it.n}</div><div class="st">${st.join(" · ")||tx("no_bonus")}</div></span><span class="lv">${tx("lvl")} ${it.l||0}${it.g?"<br>"+GRADE[it.g]:""}</span></button>`}).join(""):`<p class="hint" style="padding:12px">${tx("no_matching_item_untick_usable_by")}</p>`;
  $("pkCount").textContent=total>300?tx("picker_too_many",{total}):txn("items_count",total);
}

let exKey=null;
const SEALS={"t":{"coat":[0,1,2,3,6,8,10,12],"pants":[0,1,2,3,6,8,10,13],"gauntlet":[0,1,2,3,12,14,15,16],"shoes":[0,1,2,3,13,14,15,16],"necklace":[2,3,4,12,13,23,24,25],"ring":[2,3,4,12,13,23,24,25],"earring":[2,3,4,12,13,23,24,25],"dagger":[1,3,10,16,25],"one_handed_sword":[0,2,6,12,14],"two_handed_sword":[0,1,6,14,23],"rapier":[0,1,10,16,25],"cariad":[1,3,10,16,25],"duals":[0,1,8,15,24],"rifle":[0,1,8,15,24]},"r":{"0":["+",[[10.0,50.0],[51.0,100.0],[51.0,100.0],[101.0,150.0],[151.0,200.0],[151.0,200.0],[201.0,250.0],[251.0,300.0],[251.0,300.0],[301.0,350.0],[401.0,450.0],[450.0,500.0]]],"1":["+",[[10.0,50.0],[51.0,100.0],[51.0,100.0],[101.0,150.0],[151.0,200.0],[151.0,200.0],[201.0,250.0],[251.0,300.0],[251.0,300.0],[301.0,350.0],[401.0,450.0],[450.0,500.0]]],"2":["+",[[1.0,5.0],[6.0,10.0],[6.0,10.0],[11.0,15.0],[16.0,20.0],[16.0,20.0],[21.0,25.0],[26.0,30.0],[26.0,30.0],[31.0,35.0],[36.0,40.0],[36.0,45.0]]],"3":["+",[[1.0,5.0],[6.0,10.0],[6.0,10.0],[11.0,15.0],[16.0,20.0],[16.0,20.0],[21.0,25.0],[26.0,30.0],[26.0,30.0],[31.0,35.0],[36.0,40.0],[36.0,45.0]]],"6":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"8":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"10":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"12":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"13":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"14":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"15":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"16":["+",[[1.0,10.0],[6.0,15.0],[6.0,15.0],[11.0,20.0],[16.0,25.0],[16.0,25.0],[21.0,30.0],[26.0,35.0],[26.0,35.0],[31.0,40.0],[36.0,45.0],[40.0,50.0]]],"4":["+",[[1.0,5.0],[6.0,10.0],[6.0,10.0],[11.0,15.0],[16.0,20.0],[16.0,20.0],[21.0,25.0],[26.0,30.0],[26.0,30.0],[31.0,35.0],[36.0,40.0],[36.0,45.0]]],"23":["+",[[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[20.0,60.0]]],"24":["+",[[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[20.0,60.0]]],"25":["+",[[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[10.0,50.0],[20.0,60.0]]]}};
const sealType=(kind,it)=>it&&!it.cs&&(!it.cr||(it.l>=101&&it.l<=105))?SEALS.t[kind==="weapon"?it.t:kind]:null; // no seals on cash/event or craftable items, except Realm items lvl 101-105; shields have no seal table
const sealRange=(c,it)=>{const r=SEALS.r[c];if(!r)return null;const row=Math.min(12,Math.max(1,Math.ceil((it.l||1)/10)));return [r[0],r[1][row-1]]};
const EX_CODES=[155,156,157,158,159,160,126,0,1,2,3,6,7,8,9,10,11,129,12,13,130,173,14,15,16,23,24,25,4,17,18,19,131,5];
function openEx(key){exKey=key;if(S.ex&&S.ex[key])S.ex[key]=S.ex[key].filter(b=>b[3]==="s");const [,label,kind]=SLOTS.find(s=>s[0]===key);const it=itemFrom(kind,S.eq[key]);$("exTitle").textContent=tx("seals_2")+label;
  const st=sealType(kind,it)||[];
  const fmtR=(c)=>{const [op,[a,b]]=sealRange(c,it);return op==="*"?`${+(a*100).toFixed(1)}–${+(b*100).toFixed(1)} %`:`${a}–${b}`};
  $("exCode").innerHTML=(st.length?`<optgroup label="${tx("possible_seals_lvl")} ${it.l})">${st.map(c=>`<option value="s${c}">${EFFECT[c]||(tx("effect_prefix")+c)} (${fmtR(c)})</option>`).join("")}</optgroup>`:"");
  $("exVal").value="";$("exPct").checked=false;exSync();renderEx();$("exDlg").showModal()}
function exSync(){const v=$("exCode").value;const it=exItem();if(v[0]==="s"&&it){const [op,[a,b]]=sealRange(+v.slice(1),it);$("exPct").checked=op==="*";$("exPct").disabled=true;$("exVal").value=op==="*"?+(b*100).toFixed(2):b}else $("exPct").disabled=false}
function exItem(){const [,,kind]=SLOTS.find(s=>s[0]===exKey);return itemFrom(kind,S.eq[exKey])}
function renderEx(){const a=((S.ex&&S.ex[exKey])||[]).filter(b=>b[3]==="s");
  $("exList").innerHTML=a.length?a.map((b,i)=>`<div class="exrow"><span>${b[3]==="s"?tx("seal"):""}${fmtB(b)}</span><button type="button" class="btn" data-exdel="${i}" aria-label="${tx("remove")}">✕</button></div>`).join(""):`<p class="hint" style="margin:0">${tx("no_bonus_added")}</p>`}
