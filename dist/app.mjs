import {cents,valid,calculate,blanchette,money} from './calculs.mjs?v=1.7';
import {makePdf} from './pdf.mjs?v=1.7';
const $=s=>document.querySelector(s),form=$('#form');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const checklist=['Consentement du patient documenté dans RxPro.','Assurance vérifiée.','Couverture confirmée avant la commande.','Validation clinique effectuée par le pharmacien.','Coûtants corrigés dans RxPro si nécessaire.','Date de péremption vérifiée.','Emballage et étiquetage vérifiés.','Tampons alcoolisés ajoutés selon la quantité de produits servis à l’interne.','Autorisation de l’assurance privée documentée lorsque nécessaire.'];
$('#checks').innerHTML=checklist.map((s,i)=>`<label class="check ordered-check"><input type="checkbox" name="check${i}">${s}</label>`).join('');
$('#blanchetteProducts').innerHTML=['nacl','heparin'].map((k,i)=>`<div class="product"><label class="check ordered-check"><input type="checkbox" name="${k}Enabled">${i?'Héparine':'NaCl'} · produit commandé</label><fieldset id="${k}Fields" disabled><div class="fields form-grid"><label>Prix coûtant<div class="amount"><input name="${k}Cost" inputmode="decimal" placeholder="0,00"><span>$</span></div></label><div class="computed"><span>Diviseur automatique</span><strong id="${k}Divisor">—</strong><small>Selon la charte de l’antibiotique</small></div></div><div class="calculation soft"><span>Prix total<small id="${k}Formula">Saisissez un prix coûtant</small></span><strong id="${k}Total">—</strong></div><p id="${k}Warning" class="warning" hidden>Coûtant invalide : vérifiez le montant saisi.</p></fieldset></div>`).join('');
let state,result,products,summaryText='',dirty=false,blobUrl=null,busy=false;
function values(){
 const s=Object.fromEntries(new FormData(form));
 for(const el of form.querySelectorAll('[type=checkbox]:not([data-product-choice])'))s[el.name]=el.checked;
 if(s.orderType!=='iv'){
  delete s.rinse;
  delete s.anticoag;
  s.naclEnabled=false;
  s.heparinEnabled=false;
 }
 return s;
}
const amountNames=['magistral','cost','net','fe','ft','rxTotal','naclCost','heparinCost'];
function dateToday(){const now=new Date();const date=form.elements.date;date.value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');date.dispatchEvent(new Event('change'));}
function read(){
 const s=values();
 $('#orderDetails').hidden=!s.orderType;
 const isGentes=s.orderType==='magistrale';
 for(const [id,visible] of [['gentesCostHelp',isGentes&&s.insurance!=='ramq'],['uniprixCostHelp',s.orderType==='iv'&&s.insurance!=='ramq'],['gentesPackingHelp',isGentes],['gentesTransportHelp',isGentes],['uniprixPackingHelp',s.orderType==='iv'],['uniprixTransportHelp',s.orderType==='iv']]){
  $('#'+id+'Button').hidden=!visible;
  if(!visible)$('#'+id).hidePopover();
 }
 $('#orderSelection').textContent=s.orderType?form.elements.orderType.selectedOptions[0].textContent:'';
 for(const link of document.querySelectorAll('nav a:not([href="#commande"])'))link.hidden=!s.orderType;
 for(const id of ['produits','blanchette']){
  $('#'+id).hidden=s.orderType!=='iv';
  $(`nav a[href="#${id}"]`).hidden=s.orderType!=='iv';
 }
$('#privateFields').disabled=s.insurance==='ramq';$('#ramqNote').hidden=s.insurance!=='ramq';$('#privateTag').textContent=s.insurance==='ramq'?'N/A RAMQ':'ASSURANCE PRIVÉE';
 for(const k of ['nacl','heparin'])$('#'+k+'Fields').disabled=!s[k+'Enabled'];
 // Read again after disabling fields, so hidden/inapplicable values never enter calculations.
 state=values();result={...calculate(state),magistral:cents(state.magistral),fe:cents(state.fe),ft:cents(state.ft),rxTotal:cents(state.rxTotal)};
 products=Object.fromEntries(['nacl','heparin'].map(k=>[k,blanchette(state[k+'Enabled']?state[k+'Cost']:'')]));
 for(const name of amountNames){const el=form.elements[name];let err=el.parentElement.parentElement.querySelector('.field-error');if(err)err.remove();const invalid=!el.disabled&&el.closest('fieldset')?.disabled!==true&&Number.isNaN(cents(el.value));el.setAttribute('aria-invalid',String(invalid));if(invalid){err=document.createElement('span');err.className='field-error';err.textContent='Montant positif, 2 décimales maximum (jusqu’à 9 999 999,99).';el.parentElement.after(err);}}
 const r=result;
 $('#divisor').textContent=r.d?(r.d/100).toFixed(2).replace('.',','):'—';
 $('#price').textContent=money(r.price);$('#formula').textContent=r.d?`${money(r.cost)} ÷ ${(r.d/100).toFixed(2).replace('.',',')} `:'Saisissez un prix coûtant valide';
 $('#f6').textContent=money(r.f6);$('#negative').hidden=!(r.f6!==null&&r.f6<0);
 $('#tierWarning').hidden=!(state.insurance==='private'&&valid(r.cost)&&!r.d);$('#tierWarning').textContent='Coûtant invalide : vérifiez le montant saisi.';
 $('#feeTotal').textContent=money(r.fees);
 $('#profit').textContent=state.insurance==='ramq'?'N/A RAMQ':money(r.profit);
 $('#profitFormula').textContent=state.insurance==='ramq'?'Prix à facturer non calculé pour RAMQ':r.profit!==null?`${money(r.price)} − ${money(r.cost)}`:'Prix à facturer − coûtant de la prescription';
 for(const k of ['nacl','heparin']){const p=products[k];$('#'+k+'Total').textContent=money(p.total);$('#'+k+'Divisor').textContent=p.d?(p.d/100).toFixed(2).replace('.',','):'—';$('#'+k+'Formula').textContent=p.d?`${money(p.cost)} ÷ ${(p.d/100).toFixed(2).replace('.',',')}`:'Saisissez un prix coûtant valide';$('#'+k+'Warning').hidden=!(state[k+'Enabled']&&valid(p.cost)&&!p.d);}
 $('#checkProgress').textContent=`${checklist.filter((_,i)=>state['check'+i]).length} / 9 vérifications effectuées`;
 renderSummary();
}
function renderSummary(){
 const s=state,r=result,pending='Calculé';let rows=[];
 const row=(a,b)=>{rows.push([a,b]);return `<div class="summary-row"><span>${escape(a)}</span><strong>${escape(b)}</strong></div>`;};
 const orderLabel=form.elements.orderType.selectedOptions[0]?.textContent;
 let h=(s.orderType?row('Type de commande',orderLabel):'')+row('Assurance',s.insurance==='ramq'?'RAMQ':'Assurance privée')+row('Traité par',s.employee||'À préciser')+row('Date',s.date||'À préciser')+(s.rx?row('Prescription',s.rx):'');
 h+='<div class="summary-group"><small>MONTANTS SAISIS · RXPRO</small>'+row('Total magistrale',money(r.magistral));
 if(s.insurance==='private')h+=row('Prix coûtant',money(r.cost))+row('NET PATIENT',money(r.net));h+=row('FE · Emballage',money(r.fe))+row('FT · Transport',money(r.ft))+row('Total Rx · papier bleu',money(r.rxTotal))+'</div>';
 h+='<div class="summary-group"><small>'+escape(pending.toUpperCase())+'</small>';
 if(s.insurance==='private')h+=row('Diviseur',r.d?(r.d/100).toFixed(2).replace('.',','):'Non déterminé')+row('Prix à facturer',money(r.price))+`<div class="summary-result">${row('Frais additionnels F6',money(r.f6))}</div>`;
 else h+=row('Prix privé / F6','N/A RAMQ');h+=row('Sous-total FE + FT',money(r.fees))+row('Profit',s.insurance==='ramq'?'N/A RAMQ':money(r.profit))+'</div>';
 if(s.orderType==='iv')h+='<div class="summary-group"><small>PRODUITS ASSOCIÉS</small>'+row('Rinçage',s.rinse||'À préciser')+row('Anticoagulant',s.anticoag||'À préciser')+'</div>';
 for(const k of ['nacl','heparin'])if(s[k+'Enabled'])h+='<div class="summary-group">'+row('Blanchette · '+(k==='nacl'?'NaCl':'Héparine'),money(products[k].total))+row('Coût saisi',money(products[k].cost))+row('Diviseur automatique',products[k].d?(products[k].d/100).toFixed(2).replace('.',','):'Non déterminé')+row('Statut',!products[k].d?'Coûtant absent ou invalide':pending)+'</div>';
 $('#summary').innerHTML=h;summaryText='FACTURATION IV\n'+rows.map(([a,b])=>`${a} : ${b}`).join('\n')+'\nArrondi : '+'au cent le plus proche · règle confirmée'+'\nVérifications : '+checklist.map((v,i)=>`\n[${s['check'+i]?'x':' '}] ${v}`).join('');
}
let toastTimer;function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),6000);}
form.addEventListener('input',e=>{
 if(e.target.matches('[data-product-choice]')){
  if(e.target.checked)for(const choice of form.querySelectorAll('[data-product-choice]'))if(choice.name===e.target.name&&choice!==e.target)choice.checked=false;
  const key=e.target.name==='rinse'?'nacl':'heparin';
  const linkedValue=key==='nacl'?'NaCl pharmacie préparatrice':'Héparine pharmacie préparatrice';
  form.elements[key+'Enabled'].checked=Array.from(form.querySelectorAll('[data-product-choice]')).some(choice=>choice.name===e.target.name&&choice.value===linkedValue&&choice.checked);
 }
 dirty=true;read();
});form.addEventListener('change',()=>{dirty=true;read();});form.addEventListener('submit',e=>e.preventDefault());
const resetConfirm = $('#resetConfirm');
function resetCalculation() {
  form.reset();
  dateToday();
  dirty = false;
  read();
  toast('Nouveau calcul prêt.');
}
$('#reset').onclick = () => {
  if (!dirty) {
    resetCalculation();
    return;
  }
  resetConfirm.returnValue = '';
  resetConfirm.showModal();
};
resetConfirm.addEventListener('close', () => {
  if (resetConfirm.returnValue === 'reset') resetCalculation();
});
resetConfirm.addEventListener('keydown', event => {
  if (event.key !== 'F9' || event.defaultPrevented || event.ctrlKey || event.altKey ||
      event.metaKey || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  if (!event.repeat) $('#resetAccept').click();
});
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(summaryText);toast('Résumé copié.');}catch{const t=document.createElement('textarea');t.value=summaryText;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'Résumé copié.':'Copie indisponible dans ce navigateur.');}};
async function generate(action){
 if(busy)return;read();const invalid=form.querySelector('[aria-invalid=true]');if(invalid){invalid.focus();toast('Corrigez les montants invalides avant de générer le PDF.');return;}
 if(result.f6!==null&&result.f6<0){toast('Corrigez le résultat F6 négatif avant de générer le formulaire.');return;}
 if(state.insurance==='private'&&valid(result.cost)&&!result.d){toast('Vérifiez le prix coûtant avant de générer le PDF.');return;}
 for(const k of ['nacl','heparin'])if(state[k+'Enabled']&&valid(products[k].cost)&&!products[k].d){toast('Blanchette : vérifiez le prix coûtant avant de générer le PDF.');return;}
 busy=true;for(const id of ['preview','download','print'])$('#'+id).disabled=true;
 try{
 const bytes=await makePdf(state,result,products);if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
 if(action==='download'){const a=document.createElement('a');a.href=blobUrl;a.download=`reclamation-IV-${state.date||'calcul'}.pdf`;a.click();toast('PDF téléchargé.');}
 else if(action==='print'){
  // Render the actual filled PDF at 300 dpi. This avoids depending on a browser PDF plug-in.
  const pdfjs=await import('./vendor/pdfjs.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
  const pdf=await pdfjs.getDocument({data:bytes}).promise,images=[];
  for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),viewport=page.getViewport({scale:300/72}),canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;images.push(canvas.toDataURL('image/png'));}
  let frame=$('#printFrame');if(frame)frame.remove();frame=document.createElement('iframe');frame.id='printFrame';frame.title='Document officiel à imprimer';frame.style.cssText='position:fixed;width:1px;height:1px;bottom:0;right:0;opacity:.01';
  frame.srcdoc='<!doctype html><html lang="fr"><head><title>Réclamation IV</title><style>@page{size:letter;margin:0}html,body{margin:0;padding:0}img{display:block;width:8.5in;height:11in;break-after:page}img:last-child{break-after:auto}</style></head><body>'+images.map(src=>`<img src="${src}" alt="Page du PDF officiel rempli">`).join('')+'</body></html>';
  const ready=new Promise(resolve=>{frame.onload=resolve;});document.body.append(frame);await ready;
  await Promise.all(Array.from(frame.contentDocument.images).map(img=>img.decode()));
  try{frame.contentWindow.focus();frame.contentWindow.print();toast('Impression demandée. Si le navigateur la bloque, téléchargez le PDF et imprimez-le à 100 % sur papier Lettre.');}catch{toast('Impression indisponible dans ce navigateur. Téléchargez le PDF pour imprimer.');}
 }else{
  $('#pdfDialog').showModal();$('#pdfStatus').textContent=`${state.includeProcedure?'2 pages':'1 page · procédure exclue'} · résultats reportés automatiquement`;
  $('#pdfPages').textContent='Chargement de l’aperçu…';const pdfjs=await import('./vendor/pdfjs.mjs');pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
  const pdf=await pdfjs.getDocument({data:bytes}).promise;$('#pdfPages').replaceChildren();for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),viewport=page.getViewport({scale:1.5}),canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;canvas.setAttribute('aria-label',`Page ${n} du formulaire rempli`);$('#pdfPages').append(canvas);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;}
 }
 }catch(e){toast('Impossible de générer le PDF : '+e.message);if($('#pdfDialog').open)$('#pdfPages').textContent='Aperçu indisponible. Fermez et réessayez.';}
 finally{busy=false;for(const id of ['preview','download','print'])$('#'+id).disabled=false;}
}
$('#preview').onclick=()=>generate('preview');$('#download').onclick=()=>generate('download');$('#print').onclick=()=>generate('print');$('#closeDialog').onclick=()=>$('#pdfDialog').close();
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});dateToday();read();
