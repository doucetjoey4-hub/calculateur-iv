import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {makePdf} from './dist/pdf.mjs';import {blanchette} from './dist/calculs.mjs';
globalThis.self=globalThis;await import('./dist/vendor/pdf-lib.min.js');
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>fs.readFile(new URL('./dist/formulaire-officiel.pdf',import.meta.url))});
const originalDraw=PDFLib.PDFPage.prototype.drawText;let drawn=[];
PDFLib.PDFPage.prototype.drawText=function(text,options){drawn.push({text,...options});return originalDraw.call(this,text,options);};
const r={magistral:12345,cost:40000,d:65,price:61538,net:50000,f6:11538,fe:1250,ft:525,rxTotal:63313,profit:21538};
test('PDF reporte les résultats sur deux exemplaires sans mention provisoire',async()=>{
 drawn=[];const bytes=await makePdf({insurance:'private',naclEnabled:true,heparinEnabled:true,roundingConfirmed:false},r,{nacl:blanchette('600'),heparin:blanchette('900')});
 assert.equal(drawn.filter(x=>x.text==='615,38').length,4);assert.equal(drawn.filter(x=>x.text==='115,38').length,2);assert.equal(drawn.filter(x=>x.text==='857,14').length,2);assert.equal(drawn.filter(x=>x.text==='1250,00').length,2);assert.equal(drawn.filter(x=>x.text.includes('CALCUL PROVISOIRE')).length,0);
 assert.equal((await PDFLib.PDFDocument.load(bytes)).getPageCount(),1);
 assert.equal(drawn.filter(x=>x.text==='215,38').length,2);
 if(process.env.PDF_QA_OUTPUT)await fs.writeFile(process.env.PDF_QA_OUTPUT,bytes);
});
test('PDF validé sans mention provisoire, RAMQ sans résultats privés',async()=>{
 drawn=[];await makePdf({insurance:'ramq',roundingConfirmed:true},r,{});assert.equal(drawn.filter(x=>x.text.includes('CALCUL PROVISOIRE')).length,0);assert.equal(drawn.filter(x=>x.text==='615,38'||x.text==='115,38'||x.text==='215,38').length,0);assert.equal(drawn.filter(x=>x.text==='633,13').length,2);
});

test('PDF reporte le profit Uniprix RAMQ sur les deux exemplaires, avec procédures au verso sur demande', async () => {
  const state={insurance:'ramq',orderType:'iv',includeProcedure:true};
  for (const profit of [15000,-15000]) {
    drawn=[];
    const output=await makePdf(state,{...r,profit},{});
    assert.equal((await PDFLib.PDFDocument.load(output)).getPageCount(),2);
    assert.deepEqual(drawn.filter(x=>x.x===60).map(x=>x.text),Array(2).fill(profit>0?'150,00':'-150,00'));
    assert.equal(drawn.some(x=>x.text==='615,38'||x.text==='115,38'),false);
  }
});
