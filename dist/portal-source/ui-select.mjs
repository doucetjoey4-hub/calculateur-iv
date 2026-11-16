// Présentation personnalisée ; le select natif conserve sa valeur et son rôle dans FormData.
export function enhanceSelects(scope){
  const enhanced=new WeakMap(),menu=document.createElement('div');menu.className='ui-select-menu';menu.id='ui-select-'+crypto.randomUUID();menu.setAttribute('popover','auto');menu.setAttribute('role','listbox');
  let active=null,disposed=false;
  const close=()=>{if(menu.matches(':popover-open'))menu.hidePopover();if(active)enhanced.get(active)?.button.setAttribute('aria-expanded','false');};
  function sync(){
    if(disposed)return;
    if(active&&!scope.contains(active))close();
    scope.querySelectorAll('select').forEach(select=>{
      let entry=enhanced.get(select);
      if(!entry&&select.hidden)return;
      if(!entry){
        const name=select.getAttribute('aria-label')||select.closest('label')?.firstChild.textContent.trim()||'Choisir une option';
        const wrap=document.createElement('span');wrap.className='ui-select-wrap';const button=document.createElement('button');button.type='button';button.className='ui-select-button';button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',menu.id);
        const text=document.createElement('span');text.className='ui-select-text';const arrow=document.createElement('span');arrow.className='ui-select-arrow';arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';button.append(text,arrow);
        select.before(wrap);wrap.append(button,select);select.classList.add('ui-select-native');select.tabIndex=-1;select.setAttribute('aria-hidden','true');entry={button,text,name,wrap};enhanced.set(select,entry);
        let wasOpen=false;button.onpointerdown=()=>{wasOpen=active===select&&menu.matches(':popover-open');};
        button.onclick=()=>{const toggle=wasOpen;wasOpen=false;if(toggle||(active===select&&menu.matches(':popover-open')))close();else open(select);};
        button.onkeydown=event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();open(select,event.key);}};
        select.addEventListener('change',sync);select.addEventListener('invalid',event=>{event.preventDefault();button.focus();open(select);});
      }
      const label=select.selectedOptions[0]?.textContent||'Choisir';if(entry.text.textContent!==label)entry.text.textContent=label;
      const accessible=entry.name+' : '+label;if(entry.button.getAttribute('aria-label')!==accessible)entry.button.setAttribute('aria-label',accessible);
      if(entry.button.disabled!==select.disabled)entry.button.disabled=select.disabled;
      if(entry.wrap.hidden!==select.hidden)entry.wrap.hidden=select.hidden;
      if(active===select&&(select.disabled||select.hidden))close();
    });
  }
  function open(select,key){
    if(select.disabled||select.hidden)return;close();active=select;menu.replaceChildren();const entry=enhanced.get(select);menu.setAttribute('aria-label',entry.name);
    // Le menu d’un champ modal reste dans cette fenêtre pour conserver l’accès et le focus.
    const host=select.closest('dialog')||document.body;if(menu.parentElement!==host)host.append(menu);
    for(const option of select.options){
      const button=document.createElement('button');button.type='button';button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.disabled=option.disabled;
      const text=document.createElement('span');text.textContent=option.textContent;const mark=document.createElement('span');mark.textContent=option.selected?'✓':'';mark.setAttribute('aria-hidden','true');button.append(text,mark);
      button.onclick=()=>{select.value=option.value;close();entry.button.focus({preventScroll:true});select.dispatchEvent(new Event('change',{bubbles:true}));sync();};menu.append(button);
    }
    menu.showPopover();const rect=entry.button.getBoundingClientRect(),width=Math.min(Math.max(rect.width,180),innerWidth-24);menu.style.width=width+'px';menu.style.maxHeight=Math.min(280,innerHeight-24)+'px';menu.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';menu.style.top=Math.max(12,Math.min(rect.bottom+6,innerHeight-menu.offsetHeight-12))+'px';entry.button.setAttribute('aria-expanded','true');
    const choices=[...menu.querySelectorAll('button:not(:disabled)')],selected=menu.querySelector('[aria-selected=true]:not(:disabled)');
    (key==='End'?choices.at(-1):key==='Home'?choices[0]:selected||choices[0])?.focus({preventScroll:true});
  }
  menu.addEventListener('keydown',event=>{
    const choices=[...menu.querySelectorAll('button:not(:disabled)')],index=choices.indexOf(document.activeElement);let next;
    if(event.key==='ArrowDown')next=(index+1)%choices.length;if(event.key==='ArrowUp')next=(index+choices.length-1)%choices.length;if(event.key==='Home')next=0;if(event.key==='End')next=choices.length-1;
    if(next!==undefined){event.preventDefault();choices[next]?.focus();}
    if(event.key==='Escape'||event.key==='Tab'){if(event.key==='Escape')event.preventDefault();event.stopPropagation();close();enhanced.get(active)?.button.focus({preventScroll:true});}
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey){const found=choices.find(button=>button.textContent.toLocaleLowerCase('fr').startsWith(event.key.toLocaleLowerCase('fr')));if(found){event.preventDefault();found.focus();}}
  });
  menu.addEventListener('toggle',()=>{if(!menu.matches(':popover-open')&&active)enhanced.get(active)?.button.setAttribute('aria-expanded','false');});
  document.body.append(menu);const observer=new MutationObserver(sync);observer.observe(scope,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','hidden']});sync();
  const resize=()=>close();window.addEventListener('resize',resize);
  const dialogClosed=event=>{if(active&&event.target.contains?.(active))close();};
  const reset=()=>setTimeout(sync,0);
  document.addEventListener('close',dialogClosed,true);document.addEventListener('reset',reset,true);window.addEventListener('labo-profile-changed',resize);
  return ()=>{disposed=true;observer.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('labo-profile-changed',resize);document.removeEventListener('close',dialogClosed,true);document.removeEventListener('reset',reset,true);close();menu.remove();};
}
