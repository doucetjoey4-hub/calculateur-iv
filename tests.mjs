import {test} from 'node:test';import assert from 'node:assert/strict';import {cents,divisor,calculate,blanchette,divideRound,money} from './dist/calculs.mjs';
test('arrondi confirmé au cent, y compris 4,546 vers 4,55',()=>{assert.equal(divideRound(4546,10),455);assert.equal(divideRound(4544,10),454);assert.equal(divideRound(4545,10),455);assert.match(money(divideRound(4546,10)),/4,55/);});
test('lecture monétaire stricte et valeurs absentes',()=>{assert.equal(cents(''),null);assert.equal(cents('400,05'),40005);for(const v of ['-1','abc','1.234','Infinity','1e3'])assert.ok(Number.isNaN(cents(v)));});
test('paliers confirmés incluant tous les cents aux limites',()=>{for(const [v,d]of [[0,65],[50000,65],[50001,65],[50099,65],[50100,70],[75000,70],[75001,70],[75099,70],[75100,72],[999999,72]]){assert.equal(divisor(v),d);const cost=(v/100).toFixed(2),a=calculate({insurance:'private',cost});assert.equal(a.d,d);assert.equal(blanchette(cost).d,d);assert.equal(blanchette(cost).total,a.price);}});
test('prix et F6, y compris négatif',()=>{assert.equal(calculate({insurance:'private',cost:'400',net:'500'}).price,61538);assert.equal(calculate({insurance:'private',cost:'400',net:'500'}).f6,11538);assert.equal(calculate({insurance:'private',cost:'400',net:'700'}).f6,-8462);assert.equal(calculate({insurance:'private',cost:'400',net:''}).f6,null);});
test('RAMQ exclut la charte privée',()=>{assert.equal(calculate({insurance:'ramq',cost:'400',net:'500'}).price,null);assert.equal(calculate({insurance:'ramq',cost:'400',net:'500'}).f6,null);});
test('FE et FT sans estimation du total Rx',()=>{assert.equal(calculate({fe:'12,50',ft:'5,25'}).fees,1775);assert.equal(calculate({fe:'',ft:'5'}).fees,null);});
test('profit = prix à facturer arrondi moins coûtant, indépendant des frais et du NET PATIENT',()=>{assert.equal(calculate({insurance:'private',cost:'400',net:'500',fe:'12',ft:'5'}).profit,21538);assert.equal(calculate({insurance:'private',cost:'400',net:'0',fe:'100',ft:'80'}).profit,21538);assert.equal(calculate({insurance:'private',cost:'0'}).profit,0);assert.equal(calculate({insurance:'private',cost:''}).profit,null);assert.equal(calculate({insurance:'private',cost:'abc'}).profit,null);assert.equal(calculate({insurance:'ramq',cost:'400'}).profit,null);});
test('Blanchette applique exactement les paliers de la charte antibiotique',()=>{for(const cost of ['0','100','400','500','501','600','750','751','900','9999999.99']){const p=blanchette(cost),a=calculate({insurance:'private',cost});assert.equal(p.d,a.d);assert.equal(p.total,a.price);}assert.equal(blanchette('400').total,61538);assert.equal(blanchette('600').total,85714);assert.equal(blanchette('900').total,125000);});
test('Blanchette suspend les coûtants absents ou invalides',()=>{for(const cost of ['','-1','abc','1.234']){assert.equal(blanchette(cost).d,null);assert.equal(blanchette(cost).total,null);}});

test('Profit Uniprix RAMQ : total Rx réel moins coûtant, frais déjà inclus', () => {
  const s = {orderType:'iv', insurance:'ramq', cost:'400', rxTotal:'550', fe:'12', ft:'9'};
  assert.equal(calculate(s).profit, 15000);
  assert.equal(calculate(s).price, null);
  assert.equal(calculate(s).f6, null);
  assert.equal(calculate({...s, rxTotal:'399,99'}).profit, -1);
  assert.equal(calculate({...s, rxTotal:'0', cost:'0'}).profit, 0);
  for (const missing of ['', 'abc']) {
    assert.equal(calculate({...s, rxTotal:missing}).profit, null);
    assert.equal(calculate({...s, cost:missing}).profit, null);
  }
  for (const orderType of ['', 'magistrale', 'other']) assert.equal(calculate({...s, orderType}).profit, null);
  assert.equal(calculate({...s, insurance:'private'}).profit, 21538);
});
