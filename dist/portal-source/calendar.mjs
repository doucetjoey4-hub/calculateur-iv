// Les valeurs restent au format ISO attendu par les fiches et Firestore.
export function formatPortalDate(iso){
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||'');
  return match?`${match[3]}/${match[2]}/${match[1]}`:'';
}
function parsePortalDate(text){
  const value=text.trim();
  const match=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)||/^(\d{2})(\d{2})(\d{4})$/.exec(value);
  if(!match||match[3]==='0000')return '';
  const iso=`${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
  const date=new Date(iso+'T12:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===iso?iso:'';
}
export function attachCalendars(form){
  let closeActive;
  form.querySelectorAll('input[type="date"]').forEach(input=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='date-field-button';
    const field=input.closest('label');
    const title=field.firstChild.textContent.trim();
    const manual=document.createElement('input');
    manual.type='text';
    manual.inputMode='numeric';
    manual.autocomplete='off';
    manual.placeholder='JJ/MM/AAAA';
    manual.maxLength=10;
    manual.className='date-manual-input';
    manual.setAttribute('aria-label',title+' (jour, mois, année)');
    let selectOnClick=false;
    manual.addEventListener('focus',()=>{
      if(manual.value)manual.select();
    });
    manual.addEventListener('pointerdown',event=>{
      selectOnClick=event.isPrimary&&event.button===0&&document.activeElement!==manual;
    });
    manual.addEventListener('click',()=>{
      if(selectOnClick&&manual.value)manual.select();
      selectOnClick=false;
    });

    const wrapper=document.createElement('div');
    wrapper.className='date-field-control';
    const icon=document.createElement('span');
    icon.className='date-field-icon';
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m6 0h2M7 17h2"/></svg>';
    button.append(icon);
    button.setAttribute('aria-label','Ouvrir le calendrier : '+title);
    button.dataset.tooltip='Ouvrir le calendrier';
    button.setAttribute('aria-expanded','false');
    const syncState=()=>{
      manual.disabled=input.disabled;
      manual.required=input.required;
      button.disabled=input.disabled;
    };
    const refresh=()=>{
      manual.value=formatPortalDate(input.value);
      manual.setCustomValidity('');
      syncState();
    };
    input.type='hidden';
    input.after(wrapper);
    wrapper.append(manual,button);
    refresh();
    new MutationObserver(syncState).observe(input,{attributes:true,attributeFilter:['disabled','required']});
    input.addEventListener('change',refresh);
    const validate=()=>{
      const iso=parsePortalDate(manual.value);
      manual.setCustomValidity(manual.value.trim()&&!iso?'Saisissez une date valide au format JJ/MM/AAAA.':'');
      input.value=iso;
      return iso;
    };
    manual.addEventListener('input',event=>{
      if(event.isComposing)return;
      const value=manual.value;
      if(/^[\d/]*$/.test(value)){
        const cursor=manual.selectionStart??value.length;
        const digitsBefore=value.slice(0,cursor).replace(/\D/g,'').length;
        const pasted=event.inputType==='insertFromPaste'?parsePortalDate(value):'';
        const digits=value.replace(/\D/g,'').slice(0,8);
        const formatted=pasted?formatPortalDate(pasted):[digits.slice(0,2),digits.slice(2,4),digits.slice(4)].filter(Boolean).join('/');
        if(formatted!==value){
          manual.value=formatted;
          const position=pasted?formatted.length:Math.min(formatted.length,digitsBefore+(digitsBefore>2?1:0)+(digitsBefore>4?1:0));
          manual.setSelectionRange(position,position);
        }
      }
      const previous=input.value;
      const iso=validate();
      if(iso&&iso!==previous)input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    manual.addEventListener('change',()=>{
      const iso=validate();
      if(iso||!manual.value.trim())input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    const open=()=>{
      if(input.disabled)return;
      closeActive?.(false);
      const today=new Date(),localToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
      const initial=input.value||localToday;let month=new Date(initial+'T12:00:00Z');month.setUTCDate(1);
      let focused=initial,picker='days',yearStart=month.getUTCFullYear()-5;
      const dialog=document.createElement('div');dialog.className='portal-calendar';dialog.setAttribute('role','group');dialog.setAttribute('aria-label',title);
      dialog.setAttribute('popover','manual');
      dialog.id='calendar-'+input.name;button.setAttribute('aria-controls',dialog.id);button.setAttribute('aria-expanded','true');
      dialog.innerHTML='<div class="calendar-heading"><strong></strong><button type="button" class="icon-button calendar-close" aria-label="Fermer le calendrier">×</button></div><div class="calendar-navigation"><button type="button" class="secondary calendar-prev" aria-label="Mois précédent"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><span aria-live="polite"></span><button type="button" class="secondary calendar-next" aria-label="Mois suivant"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div><div class="calendar-week" aria-hidden="true"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="calendar-days" role="group" aria-label="Choisir un jour"></div><div class="calendar-actions"><button type="button" class="secondary calendar-today">Aujourd’hui</button><button type="button" class="text-button calendar-clear">Effacer</button></div>';
      const todayButton=dialog.querySelector('.calendar-today'),clearButton=dialog.querySelector('.calendar-clear');
      todayButton.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 6 3 3 5-6"/></svg><span>Aujourd’hui</span>';
      clearButton.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg><span>Effacer</span>';
      dialog.querySelector('strong').textContent=title;
      const heading=dialog.querySelector('.calendar-navigation span');
      const monthTitle=document.createElement('button');monthTitle.type='button';monthTitle.className='calendar-period';monthTitle.setAttribute('aria-label','Choisir le mois et l’année');heading.replaceWith(monthTitle);
      const controller=new AbortController(),editor=form.closest('dialog');
      const reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      let animation,monthAnimation,resizeObserver,closing=false;
      const close=(restoreFocus=true)=>{
        if(closing)return;closing=true;controller.abort();resizeObserver?.disconnect();button.setAttribute('aria-expanded','false');if(closeActive===close)closeActive=null;
        const opacity=getComputedStyle(dialog).opacity;animation?.cancel();monthAnimation?.cancel();dialog.style.pointerEvents='none';dialog.inert=true;
        if(restoreFocus&&button.isConnected&&!input.disabled)button.focus({preventScroll:true});
        const remove=()=>{if(dialog.matches(':popover-open'))dialog.hidePopover();dialog.remove();};
        if(reduced||!dialog.isConnected){remove();return;}
        animation=dialog.animate([{opacity,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(-6px) scale(.98)'}],{duration:150,easing:'ease-in',fill:'forwards'});
        animation.finished.then(remove,remove);
      };
      closeActive=close;
      const choose=value=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close();};
      const iso=date=>date.toISOString().slice(0,10);
      function render(focus=false){
        monthTitle.textContent=picker==='years'?`${yearStart} – ${yearStart+11}`:picker==='months'?String(month.getUTCFullYear()):new Intl.DateTimeFormat('fr-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(month);
        monthTitle.setAttribute('aria-label',picker==='days'?'Choisir le mois et l’année':picker==='months'?'Choisir l’année':'Revenir au choix du mois');
        dialog.querySelector('.calendar-prev').setAttribute('aria-label',picker==='days'?'Mois précédent':picker==='months'?'Année précédente':'Années précédentes');
        dialog.querySelector('.calendar-next').setAttribute('aria-label',picker==='days'?'Mois suivant':picker==='months'?'Année suivante':'Années suivantes');
        dialog.querySelector('.calendar-week').style.visibility=picker==='days'?'visible':'hidden';
        const days=dialog.querySelector('.calendar-days');days.replaceChildren();
        days.classList.toggle('calendar-choices',picker!=='days');days.setAttribute('aria-label',picker==='years'?'Choisir une année':picker==='months'?'Choisir un mois':'Choisir un jour');
        if(picker!=='days'){
          for(let index=0;index<12;index++){
            const node=document.createElement('button');node.type='button';node.className='calendar-day';
            const value=picker==='years'?yearStart+index:index;
            node.textContent=picker==='years'?String(value):new Intl.DateTimeFormat('fr-CA',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2024,index,1)));
            const selected=picker==='years'?value===month.getUTCFullYear():value===month.getUTCMonth();node.classList.toggle('selected',selected);node.setAttribute('aria-pressed',String(selected));
            node.onclick=()=>{if(picker==='years'){month.setUTCFullYear(value);picker='months';}else{month.setUTCMonth(value);focused=iso(month);picker='days';}render(true);animateMonth(1);};days.append(node);
          }
          if(focus)(days.querySelector('.selected')||days.querySelector('button')).focus({preventScroll:true});
          return;
        }
        const offset=(month.getUTCDay()+6)%7,count=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0)).getUTCDate();
        for(let n=0;n<offset;n++){const space=document.createElement('span');space.setAttribute('aria-hidden','true');days.append(space);}
        for(let day=1;day<=count;day++){
          const date=new Date(month);date.setUTCDate(day);const value=iso(date),node=document.createElement('button');node.type='button';node.textContent=day;node.dataset.date=value;
          node.className='calendar-day';node.classList.toggle('selected',value===input.value);node.classList.toggle('today',value===localToday);
          node.setAttribute('aria-label',new Intl.DateTimeFormat('fr-CA',{dateStyle:'full',timeZone:'UTC'}).format(date));node.setAttribute('aria-pressed',String(value===input.value));if(value===localToday)node.setAttribute('aria-current','date');
          node.tabIndex=value===focused?0:-1;node.onclick=()=>choose(value);days.append(node);
        }
        // Six semaines réservées : la taille reste stable pour tous les mois.
        while(days.children.length<42){const space=document.createElement('span');space.setAttribute('aria-hidden','true');days.append(space);}
        const target=days.querySelector('[tabindex="0"]')||days.querySelector('button');target.tabIndex=0;if(focus)target.focus({preventScroll:true});
      }
      function animateMonth(delta){
        monthAnimation?.cancel();
        if(!reduced)monthAnimation=dialog.querySelector('.calendar-days').animate(
          [{opacity:0,transform:`translateX(${delta>0?10:-10}px)`},{opacity:1,transform:'translateX(0)'}],
          {duration:190,easing:'cubic-bezier(.22,.8,.25,1)'});
      }
      function changeMonth(delta){
        if(picker==='years')yearStart+=delta*12;
        else if(picker==='months')month.setUTCFullYear(month.getUTCFullYear()+delta);
        else month.setUTCMonth(month.getUTCMonth()+delta);
        focused=iso(month);render(false);animateMonth(delta);
      }
      monthTitle.onclick=()=>{picker=picker==='days'?'months':picker==='months'?'years':'months';if(picker==='years')yearStart=month.getUTCFullYear()-5;render(true);animateMonth(1);};
      dialog.querySelector('.calendar-prev').onclick=()=>changeMonth(-1);dialog.querySelector('.calendar-next').onclick=()=>changeMonth(1);
      dialog.querySelector('.calendar-close').onclick=close;dialog.querySelector('.calendar-today').onclick=()=>choose(localToday);dialog.querySelector('.calendar-clear').onclick=()=>choose('');
      dialog.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();return;}
        const current=event.target.dataset.date;if(!current)return;
        const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
        if(delta!==undefined){event.preventDefault();const date=new Date(current+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+delta);focused=iso(date);month=new Date(date);month.setUTCDate(1);render(true);}
        if(event.key==='PageUp'||event.key==='PageDown'){event.preventDefault();changeMonth(event.key==='PageUp'?-1:1);}
      });
      // Couche flottante ancrée au champ : aucun espace ajouté dans la fiche.
      const position=()=>{
        const rect=button.getBoundingClientRect(),width=Math.min(340,window.innerWidth-24);
        dialog.style.width=width+'px';dialog.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';
        const below=window.innerHeight-rect.bottom-16,height=dialog.offsetHeight;
        const above=below<height&&rect.top>below;
        dialog.classList.toggle('calendar-above',above);
        // Garder le calendrier entier dans la fenêtre, même entre deux zones étroites.
        const preferred=above?rect.top-height-8:rect.bottom+8;
        dialog.style.top=Math.max(12,Math.min(preferred,window.innerHeight-height-12))+'px';
      };
      dialog.addEventListener('click',event=>event.preventDefault());
      document.addEventListener('pointerdown',event=>{if(!dialog.contains(event.target)&&!button.contains(event.target))close(false);},{signal:controller.signal});
      form.addEventListener('change',()=>{if(input.disabled)close(false);},{signal:controller.signal});
      editor?.addEventListener('close',()=>close(false),{signal:controller.signal});
      window.addEventListener('resize',position,{signal:controller.signal});
      document.addEventListener('scroll',event=>{if(!dialog.contains(event.target))position();},{capture:true,signal:controller.signal});
      button.after(dialog);render();dialog.showPopover();position();
      resizeObserver=new ResizeObserver(()=>{if(!closing&&dialog.isConnected)position();});resizeObserver.observe(dialog);
      if(!reduced)animation=dialog.animate([{opacity:0,transform:'translateY(-6px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:200,easing:'cubic-bezier(.22,.8,.25,1)'});
      dialog.querySelector('.calendar-days [tabindex="0"]').focus({preventScroll:true});
    };
    button.onclick=event=>{event.preventDefault();if(button.getAttribute('aria-expanded')==='true')closeActive?.();else open();};
  });
}
