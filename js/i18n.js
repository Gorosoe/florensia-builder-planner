// Translation system. All interface texts live in lang/<code>.js; see CONTRIBUTING.md.
// Each language file calls registerLang(code, pack). tx(key) returns the text for the current language,
// falling back to English, then French, then the key itself.
const LANGS={};
let LANG="fr";
function registerLang(code,pack){LANGS[code]=pack}
// saved choice (URL #lang=xx or localStorage), else the browser's language, else English
function detectLang(){
  const h=(location.hash.match(/lang=([\w-]+)/)||[])[1];if(h&&LANGS[h])return h;
  try{const l=localStorage.getItem("fl-lang");if(l&&LANGS[l])return l}catch(e){}
  const nav=(navigator.language||"").slice(0,2).toLowerCase();if(LANGS[nav])return nav;
  return LANGS.en?"en":Object.keys(LANGS)[0];
}
function setLang(code){try{localStorage.setItem("fl-lang",code)}catch(err){}location.hash="lang="+code;location.reload()}
// tx("key") or tx("key",{name:"x"}) to fill {name} placeholders
function tx(key,vars){
  const s=LANGS[LANG]?.strings?.[key]??LANGS.en?.strings?.[key]??LANGS.fr?.strings?.[key]??key;
  return vars?s.replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m):s;
}
// txn("key",n): picks key_one or key_other with the language's plural rule, {n} is the number
function txn(key,n,vars){const rule=LANGS[LANG]?.plural||(x=>x===1?"one":"other");return tx(key+"_"+rule(n),{n,...vars})}
// per-language lookup tables (effects, weaponTypes, skillWeapons), English as fallback
function langTable(name){return {...(LANGS.en?.[name]||{}),...(LANGS[LANG]?.[name]||{})}}
// applies data-i18n attributes in index.html and fills the language menu
function translatePage(){
  document.documentElement.lang=LANG;
  const sel=document.getElementById("lang");
  sel.innerHTML=Object.entries(LANGS).map(([c,p])=>`<option value="${c}">${p.name}</option>`).join("");sel.value=LANG;
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=tx(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-html]").forEach(el=>el.innerHTML=tx(el.dataset.i18nHtml));
  for(const a of ["placeholder","title","aria-label"])document.querySelectorAll(`[data-i18n-${a}]`).forEach(el=>el.setAttribute(a,tx(el.getAttribute(`data-i18n-${a}`))));
}
