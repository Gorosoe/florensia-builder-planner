// Build save/load/import/export (encode/decode).
function encode(){return btoa(unescape(encodeURIComponent(JSON.stringify({v:1,...S,es:Object.fromEntries(Object.entries(S.es||{}).map(([k,a])=>[k,a.map(i=>i==null||!D.essences[i]?null:D.essences[i].n+"|"+i)])),eq:Object.fromEntries(Object.entries(S.eq).map(([k,i])=>{const kind=SLOTS.find(s=>s[0]===k)[2];return [k,D.items[kind][i].n+"|"+(D.items[kind][i].l||0)+"|"+i]}))}))))}
function decode(code){
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
