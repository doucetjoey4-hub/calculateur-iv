import fs from 'node:fs/promises';import {makePdf} from './dist/pdf.mjs';import {blanchette} from './dist/calculs.mjs';
globalThis.self=globalThis;await import('./dist/vendor/pdf-lib.min.js');
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>fs.readFile(new URL('./dist/formulaire-officiel.pdf',import.meta.url))});
const s={insurance:'private',rinse:'BD Posiflush NaCl',anticoag:'Héparine pharmacie préparatrice',employee:'ATP TEST - VERIFICATION',roundingConfirmed:true,naclEnabled:true,heparinEnabled:true};
const r={magistral:12345,cost:40000,d:65,price:61538,net:50000,f6:11538,fe:1250,ft:525,rxTotal:63313};
await fs.writeFile(new URL('../formulaire-test.pdf',import.meta.url),await makePdf(s,r,{nacl:blanchette('400'),heparin:blanchette('600')}));
console.log('PDF de contrôle généré.');
