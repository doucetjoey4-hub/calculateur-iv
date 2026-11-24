export function cents(value) {
  const s=String(value??'').trim().replace(',','.');
  if(!s) return null;
  if(!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return NaN;
  const [a,b='']=s.split('.'); return Number(a)*100+Number(b.padEnd(2,'0'));
}
export const valid=n=>Number.isSafeInteger(n)&&n>=0;
export function divisor(c) {
  if(!valid(c)) return null;
  if(c<=50099) return 65;
  if(c>=50100&&c<=75099) return 70;
  if(c>=75100) return 72;
  return null;
}
export function divideRound(n,d){return Math.floor((n+Math.floor(d/2))/d);}
export const usesRamqProfit=s=>(s.orderType==='iv'||s.orderType==='other')&&s.insurance==='ramq';
export function calculate(s){
  const cost=cents(s.cost), net=cents(s.net), d=s.insurance==='private'?divisor(cost):null;
  const price=d?divideRound(cost*100,d):null;
  const f6=price!==null&&valid(net)?price-net:null;
  const profitBase=usesRamqProfit(s)?cents(s.rxTotal):price;
  const profit=valid(profitBase)&&valid(cost)?profitBase-cost:null;
  return {cost,net,d,price,f6,profit,fees:valid(cents(s.fe))&&valid(cents(s.ft))?cents(s.fe)+cents(s.ft):null};
}
export function blanchette(cost){
  const c=cents(cost),d=divisor(c);
  return {cost:c,d,total:d?divideRound(c*100,d):null};
}
export const money=n=>Number.isFinite(n)?new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(n/100):'—';
