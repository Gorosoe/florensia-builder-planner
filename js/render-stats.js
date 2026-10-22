// Header and stats panel rendering, buff list.
function renderHeader(){
  $("classes").innerHTML=Object.entries(CLASSES).map(([k,c])=>`<button type="button" class="cls" data-c="${k}" aria-pressed="${S.cls===k}">${c.name}</button>`).join("");
  const j=$("job");
  j.innerHTML=`<option value="">${S.land<40?tx("available_at_lvl_40"):tx("none")}</option>`+CLASSES[S.cls].jobs.map(n=>`<option ${S.job===n?"selected":""}>${n}</option>`).join("");
  j.disabled=S.land<40; if(S.land<40)j.value="";
  $("lvLand").value=S.land;$("lvSea").value=S.sea;$("gender").value=S.gender;
}

function renderStats(){
  const {t,stb,out,extras,sets,passives}=compute();
  const left=pointsTotal()-pointsUsed();
  const pl=$("ptsLeft");pl.textContent=txn("free_points",left);pl.className="pill"+(left<0?" warn":"");
  $("alloc").innerHTML=STATS.map(([k,ab,full])=>`<div class="arow" title="${full}"><b>${ab}</b><span class="base" title="${tx("class_base_and_manually_allocated_points")}">base ${CLASSES[S.cls].base[k]} · points +${S.pts[k]||0}</span><span class="bonus" title="${tx("equipment_bonus_items_essences_seals_sets")}">${stb[k]?"bonus +"+stb[k]:""}</span><span class="tot">${t[k]}</span>${k==="luc"?"<span class=\"step\"></span>":`<span class="step"><button type="button" data-s="${k}" data-d="-1" aria-label="${tx("remove_from")} ${full}">−</button><button type="button" data-s="${k}" data-d="1" aria-label="${tx("add_to")} ${full}">+</button></span>`}</div>`).join("");
  const row=(l,v)=>`<dt>${l}</dt><dd>${v}</dd>`;
  $("derived").innerHTML=
    `<div class="grp label">${tx("vitality")}</div>`+row("HP",out.hp)+row("MP",out.mp)+
    `<div class="grp label">${tx("melee")}</div>`+row(tx("attack"),`${out.melMin} ~ ${out.melMax}`)+row(tx("accuracy"),out.hm)+row(tx("critical"),out.cm)+
    `<div class="grp label">${tx("ranged")}</div>`+row(tx("attack"),`${out.rngMin} ~ ${out.rngMax}`)+row(tx("accuracy"),out.hr)+row(tx("critical"),out.crg)+
    `<div class="grp label">${tx("magic")}</div>`+row(tx("attack"),`${out.magMin} ~ ${out.magMax}`)+row(tx("accuracy"),out.hg)+row(tx("critical"),out.cg)+
    `<div class="grp label">${tx("defense")}</div>`+row(tx("physical_def"),out.pd)+row(tx("magic_def"),out.md)+row(tx("evasion"),out.av)+
    (out.speed?`<div class="grp label">${tx("weapon")}</div>`+row(tx("attack_speed"),(out.speed/1000).toFixed(2)+" s")+row(tx("range"),((110+out.range)/100).toFixed(1)+" m"):"");
  $("extras").innerHTML=extras.map(e=>`<span>${e}</span>`).join("")+sets.map(({st,n,tr})=>`<span style="${n>=tr[0]?"border-color:var(--ok)":""}">Set ${esc(st.n)} ${Math.min(n,st.c)}/${st.c}${tx("colon")}${st.b.map((b,i)=>`<b style="font-weight:600;color:${n>=tr[i]?"var(--ok)":"var(--muted)"}">[${tr[i]}] ${fmtB(b)}</b>`).join(" ")}</span>`).join("")+(passives.length?`<span>${tx("passives")}${passives.map(esc).join(" · ")}</span>`:"");
  renderBuffs();
}
function renderBuffs(){S.bf=S.bf||{};
  const list=BUFFS.filter(b=>(!b.sk||buffSkill(b))&&buffOk(b));
  $("buffs").innerHTML=list.map(b=>{const lv=S.bf[b.id]||0,max=buffMax(b),on=lv>0;const cur=on?Math.min(lv,max):max;
    const fx=buffFx(b,cur).map(fmtB).join(", ");const who=b.pet?tx("spirit"):b.share?tx("party"):tx("self");
    return `<div class="brow${on?" on":""}"><label><input type="checkbox" data-bf="${b.id}"${on?" checked":""}> ${esc(buffName(b))} <span class="label">${who}${b.cls&&b.share?" · "+CLASSES[b.cls].name:""}</span></label>${max>1?`<select data-bflv="${b.id}" aria-label="${tx("level_of")} ${esc(buffName(b))}">${Array.from({length:max},(_,i)=>`<option value="${i+1}"${i+1===cur?" selected":""}>${b.tiers?["I","II","III","IV","V"][i]:tx("lvl_prefix")+(i+1)}</option>`).join("")}</select>`:""}<span class="bfx">${esc(fx)}</span></div>`}).join("");
}
$("buffs").addEventListener("change",e=>{const t=e.target;S.bf=S.bf||{};
  if(t.dataset.bf){const b=BUFFS.find(x=>x.id===t.dataset.bf);S.bf[b.id]=t.checked?(+(document.querySelector(`[data-bflv="${b.id}"]`)?.value)||buffMax(b)):0}
  else if(t.dataset.bflv){const id=t.dataset.bflv;if(S.bf[id])S.bf[id]=+t.value;else S.bf[id]=+t.value}
  renderAll();store.set("fl-current",encode())});
