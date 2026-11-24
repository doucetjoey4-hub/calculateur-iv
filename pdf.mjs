import {usesRamqProfit} from './calculs.mjs?v=1.9';

// Coordinates in PDF points measured on the unchanged 612 x 792 source.
export async function makePdf(s,r,products){
 const {PDFDocument,StandardFonts,rgb}=globalThis.PDFLib;
 const original=await fetch('formulaire-officiel.pdf'); if(!original.ok)throw Error('Gabarit PDF indisponible');
 const src=await PDFDocument.load(await original.arrayBuffer());const doc=await PDFDocument.create();
 const pages=await doc.copyPages(src,[0,1]); pages.forEach(p=>doc.addPage(p));
 const p=pages[0],font=await doc.embedFont(StandardFonts.Helvetica);
 // Profit visible pour l'assurance privée, Uniprix RAMQ et Autre RAMQ.
 const printProfit=s.insurance==='private'||usesRamqProfit(s);
 const text=(v,x,top,max=53,size=8)=>{if(v===null||v===undefined||v==='')return;v=String(v).normalize('NFC').replace(/[^\u0020-\u00ff]/g,' ');while(font.widthOfTextAtSize(v,size)>max&&size>5)size-=.2;if(font.widthOfTextAtSize(v,size)>max)throw Error('Texte trop long pour le formulaire');p.drawText(v,{x,y:792-top-font.heightAtSize(size,{descender:false}),font,size,color:rgb(0,.1,.2)});};
 const num=n=>Number.isFinite(n)?(n/100).toFixed(2).replace('.',','):'';
 const mark=(x,t)=>{p.drawLine({start:{x:x-2.2,y:792-t-2.2},end:{x:x+2.2,y:792-t+2.2},thickness:1});p.drawLine({start:{x:x-2.2,y:792-t+2.2},end:{x:x+2.2,y:792-t-2.2},thickness:1});};
 const rinse=['Praxiject','BD Posiflush NaCl','NaCl pharmacie préparatrice','N/A avec cette préparation'].indexOf(s.rinse);
 const anticoag=['BD Posiflush','Héparine pharmacie préparatrice','N/A avec cette préparation'].indexOf(s.anticoag);
 for(let i=0;i<2;i++){
  const o=i?400.3:0;
  if(rinse>=0){const c=i?[[58,445.8],[181.5,445.8],[58,457],[181.5,457]]:[[62,45.7],[190.7,45.7],[62,55.8],[190.7,55.8]];mark(...c[rinse]);}
  if(anticoag>=0){const c=i?[[58,490.3],[58,501.3],[181.5,501.3]]:[[62,86.5],[62,96.8],[190.7,96.8]];mark(...c[anticoag]);}
  const n=(v,t)=>text(num(v),237,t+o,49);
  n(r.magistral,142);n(s.insurance==='private'?r.cost:null,175.5);
  text(s.insurance==='private'&&r.d?(r.d/100).toFixed(2).replace('.',','):'',237,186.5+o,49);
  n(s.insurance==='private'?r.price:null,198);n(s.insurance==='private'?r.price:null,231.4);
  n(s.insurance==='private'?r.net:null,242.6);n(s.insurance==='private'&&r.f6>=0?r.f6:null,253.8);
  n(r.fe,287.3);n(r.ft,298.4);n(r.rxTotal,320);
  text(printProfit?num(r.profit):'',60,344+o,52,8);
  for(const [j,key]of ['nacl','heparin'].entries())if(s[key+'Enabled']){
    text(num(products[key].cost),j?508:378,287.8+o,60,7);
    // Original "Marge %" row: divisor expressed as a percentage, as in the printed chart.
    text(products[key].d??'',j?520:390,298.9+o,45,7);
    text(num(products[key].total),j?508:378,309.9+o,60,7);
  }
  text(s.employee,355,332.3+o,220,8);
 }
 doc.setTitle('Feuille de réclamation IV remplie');doc.setProducer('Calculateur IV - superposition sur gabarit original');return await doc.save();
}
