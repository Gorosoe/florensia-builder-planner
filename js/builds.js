// Build save/load/import/export (encode/decode).
// Short build code (v2), e.g. "F2_0211_3c.1x_0.0.bw_6...": sections separated by "_":
//   header: class index, job (0 none, 1/2 = first/second job), gender (0 male, 1 female), active weapon set
//   levels: land.sea · points: the 7 stat points · equipment · skill levels · buff levels
// Numbers are base 36. Each equipment piece is "slot upgrade nameHash(3) itemIndex" then 4 essence fields
// (nameHash(2) + index, empty when the slot is empty) then the seals ("code op value" joined by ":", "." written "d").
// The name hashes let decode() find an item or essence again if a data update moved it.
// Older codes (base64 JSON, "v":1) are still read by decode().
const b36=n=>Math.max(0,Math.round(n)||0).toString(36),u36=s=>parseInt(s||"0",36)||0;
const nameHash=(s,len)=>{let h=5381;for(const ch of s)h=(h*33+ch.charCodeAt(0))>>>0;return (h%(36**len)).toString(36).padStart(len,"0")};
const trimZeros=s=>s.replace(/0+$/,"");
function encode(){
  const ck=Object.keys(CLASSES),cls=CLASSES[S.cls],ji=cls.jobs.indexOf(S.job)+1;
  const head=b36(ck.indexOf(S.cls))+b36(ji)+(S.gender==="Female"?"1":"0")+b36(S.ws||1);
  const pts=STATS.map(([k])=>b36(S.pts[k]||0)).join(".").replace(/(\.0)+$/,"");
  const eq=SLOTS.map(([key,,kind],si)=>{
    const idx=S.eq[key],it=itemFrom(kind,idx);if(!it)return null;
    let s=b36(si)+b36(S.up[key]||0)+nameHash(it.n,3)+b36(idx);
    const es=esList(key).map(ei=>ei!=null&&D.essences[ei]?nameHash(D.essences[ei].n,2)+b36(ei):"");
    const ex=((S.ex&&S.ex[key])||[]).filter(b=>b[3]==="s").map(b=>b36(b[0])+b[1]+String(+b[2].toFixed(6)).replace(".","d")).join(":");
    if(ex)s+="."+es.join(".")+"."+ex;else if(es.some(x=>x))s+="."+es.join(".");
    return s}).filter(Boolean).join(",");
  const sk=trimZeros(Object.keys(skills()).map(k=>b36(S.sk[k]||0)).join(""));
  const bf=trimZeros(BUFFS.map(b=>b36((S.bf||{})[b.id]||0)).join(""));
  return ["F2",head,b36(S.land)+"."+b36(S.sea),pts,eq,sk,bf].join("_");
}
// index in list whose name matches the hash: the saved index first, else the item with that hash closest to it
const findByHash=(list,idx,h,len)=>{if(list[idx]&&nameHash(list[idx].n,len)===h)return idx;let best=-1;list.forEach((x,i)=>{if(nameHash(x.n,len)===h&&(best<0||Math.abs(i-idx)<Math.abs(best-idx)))best=i});return best};
function decodeV2(code){
  const parts=code.split("_");if(parts.length!==7||parts[1].length!==4)throw new Error("bad build code"); // a cut code is refused
  const [,head,lv,pts,eq,sk,bf]=parts;
  const n=fresh(),ck=Object.keys(CLASSES);
  n.cls=ck[u36(head[0])]||ck[0];const cls=CLASSES[n.cls];
  n.job=cls.jobs[u36(head[1])-1]||"";n.gender=head[2]==="1"?"Female":"Male";n.ws=Math.min(3,Math.max(1,u36(head[3])||1));
  const [land,sea]=lv.split(".");n.land=Math.min(120,Math.max(1,u36(land)||1));n.sea=Math.min(99,Math.max(1,u36(sea)||1));
  pts.split(".").forEach((v,i)=>{if(STATS[i])n.pts[STATS[i][0]]=u36(v)});
  for(const part of eq?eq.split(","):[]){
    const [p0,...f]=part.split("."),slot=SLOTS[u36(p0[0])];if(!slot||p0.length<6)continue;
    const [key,,kind]=slot,list=D.items[kind];
    const idx=findByHash(list,u36(p0.slice(5)),p0.slice(2,5),3);if(idx<0)continue;
    n.eq[key]=idx;n.up[key]=u36(p0[1]);
    const es=f.slice(0,ES_SLOTS).map(v=>{if(!v)return null;const i=findByHash(D.essences,u36(v.slice(2)),v.slice(0,2),2);return i>=0?i:null});
    if(es.some(x=>x!=null))n.es[key]=es;
    if(f[ES_SLOTS])n.ex[key]=f[ES_SLOTS].split(":").map(x=>{const m=x.match(/^([0-9a-z]+)([+*])(-?[0-9d]+)$/);return m?[u36(m[1]),m[2],parseFloat(m[3].replace("d",".")),"s"]:null}).filter(Boolean);
  }
  const keys=Object.keys(D.skills[n.cls]);[...sk].forEach((c,i)=>{if(keys[i]&&u36(c))n.sk[keys[i]]=u36(c)});
  [...bf].forEach((c,i)=>{if(BUFFS[i]&&u36(c))n.bf[BUFFS[i].id]=u36(c)});
  return n;
}
function decode(code){
  code=code.trim();if(code.startsWith("F2_"))return decodeV2(code);
  const o=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  const n=fresh();Object.assign(n,o);n.pts={...fresh().pts,...o.pts};n.eq={};
  for(const [k,v] of Object.entries(o.eq||{})){const slot=SLOTS.find(s=>s[0]===k);if(!slot)continue;const kind=slot[2];const [nm,l,i]=String(v).split("|");
    let idx=+i;if(!(D.items[kind][idx]&&D.items[kind][idx].n===nm))idx=D.items[kind].findIndex(it=>it.n===nm&&String(it.l||0)===l);if(idx>=0)n.eq[k]=idx}
  n.es={};
  for(const [k,a] of Object.entries(o.es||{})){if(!n.eq.hasOwnProperty(k)||!Array.isArray(a))continue;
    n.es[k]=a.slice(0,ES_SLOTS).map(v=>{if(v==null)return null;const [nm,i]=String(v).split("|");let idx=+i;if(!(D.essences[idx]&&D.essences[idx].n===nm))idx=D.essences.findIndex(e=>e.n===nm);return idx>=0?idx:null})}
  return n;
}
function renderSaved(){
  const list=store.get("fl-builds")||{};
  $("saved").innerHTML=Object.keys(list).length?Object.entries(list).map(([n,b])=>`<span>${n.replace(/</g,"&lt;")}<button type="button" data-load="${encodeURIComponent(n)}">${tx("open")}</button><button type="button" data-del="${encodeURIComponent(n)}" aria-label="${tx("delete")} ${n.replace(/"/g,"")}">✕</button></span>`).join(""):`<span class="hint" style="border:0;padding:0">${tx("no_saved_build_yet")}</span>`;
}

function renderAll(){renderHeader();renderStats();renderSlots();renderTree();store.set("fl-current",encode())}
