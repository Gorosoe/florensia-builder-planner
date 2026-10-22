// Evaluates the base stat formulas of js/class-formulas.js for a class, a land level and the character stats.
const P=Math.pow;
const pw=(x,e)=>x>0?P(x,e):-P(-x,e);
const evalFormula=(f,L,t)=>P(L*f.lv[0],f.lv[1])+f.terms.reduce((a,[s,off,m,e])=>a+pw((t[s]-off)*m,e),0)+f.add;
function base(c,L,t){
  const out={};
  for(const [k,f] of Object.entries(CLASS_FORMULAS[c]))out[k]=evalFormula(f,L,t);
  return out;
}
