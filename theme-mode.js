// Seule la préférence visuelle est conservée ; aucune donnée de fiche.
(() => {
  const key='pjc019-theme',system=matchMedia('(prefers-color-scheme:dark)');
  let mode='auto';try{const stored=localStorage.getItem(key);if(['auto','light','dark'].includes(stored))mode=stored;}catch{}
  let profileMode=null;
  const currentMode=()=>profileMode||mode;
  const resolvedTheme=()=>currentMode()==='auto'?(system.matches?'dark':'light'):currentMode();
  const icons={light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',dark:'<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>'};
  function apply(){
    const selectedMode=currentMode(),theme=resolvedTheme();document.documentElement.dataset.theme=theme;document.documentElement.dataset.themeMode=selectedMode;
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const labels={auto:'automatique',light:'clair',dark:'sombre'};
      button.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[theme]}</svg>${selectedMode==='auto'?'<span class="theme-auto" aria-hidden="true">A</span>':''}`;
      const label=`Choisir le thème · ${labels[selectedMode]}`;button.dataset.tooltip=label;button.setAttribute('aria-label',label);
    });
  }
  // La palette personnelle suit le profil de la session en cours.
  const profilePalettes=new Map([['elodie','neon-pink']]);
  const palettesByInitials=new Map([['ED','neon-pink'],['JDG','charcoal-red'],['SMP','sky-blue'],['LS','lilac'],['CS','forest-black'],['CH','banana-yellow'],['AG','lime-green'],['SSP','cool-violet'],['VD','velvet-red'],['JB','charcoal-pink'],['SA','sky-lilac']]);
  const defaultProfileModes=new Map([['charcoal-red','dark'],['forest-black','dark'],['charcoal-pink','dark'],['neon-pink','light'],['banana-yellow','light'],['lime-green','light']]);
  function applyProfilePalette(){
    const session=window.LaboSession;
    const firstName=session?.displayName?.trim().normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('fr-CA').split(/\s+/)[0];
    const initials=session?.initials?.trim().toUpperCase();
    const palette=palettesByInitials.get(initials)||(initials?profilePalettes.get(firstName):undefined);
    if(document.documentElement.dataset.profilePalette!==palette)profileMode=defaultProfileModes.get(palette)??null;
    if(palette)document.documentElement.dataset.profilePalette=palette;
    else delete document.documentElement.dataset.profilePalette;
    apply();
  }
  window.addEventListener('labo-profile-changed',applyProfilePalette);
  applyProfilePalette();
  let transition,themeTimer;
  function changeTheme(){
    const next=resolvedTheme();
    if(matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.dataset.theme===next){apply();return;}
    if(document.startViewTransition){
      transition?.skipTransition();transition=document.startViewTransition(apply);transition.finished.catch(()=>{});return;
    }
    // Repli pour les navigateurs sans transition de vue native.
    clearTimeout(themeTimer);document.documentElement.classList.add('theme-changing');
    void document.documentElement.offsetWidth;apply();
    themeTimer=setTimeout(()=>document.documentElement.classList.remove('theme-changing'),340);
  }
  function bind(){
    const menu=document.createElement('div');menu.className='theme-menu';menu.id='theme-menu';menu.setAttribute('popover','auto');menu.setAttribute('role','menu');menu.setAttribute('aria-label','Choisir le thème');
    let trigger;
    const close=()=>{if(menu.matches(':popover-open'))menu.hidePopover();};
    for(const [value,label]of [['light','Clair'],['dark','Sombre'],['auto','Automatique']]){
      const option=document.createElement('button');option.type='button';option.dataset.mode=value;option.setAttribute('role','menuitemradio');
      const text=document.createElement('span'),mark=document.createElement('span');text.textContent=label;mark.className='theme-menu-check';mark.textContent='✓';mark.setAttribute('aria-hidden','true');option.append(text,mark);
      option.onclick=()=>{if(defaultProfileModes.has(document.documentElement.dataset.profilePalette))profileMode=value;else{mode=value;try{localStorage.setItem(key,mode);}catch{}}close();trigger?.focus({preventScroll:true});changeTheme();};menu.append(option);
    }
    const options=[...menu.querySelectorAll('button')];
    menu.addEventListener('keydown',event=>{
      const index=options.indexOf(document.activeElement);let next;
      if(event.key==='ArrowDown')next=(index+1)%options.length;
      if(event.key==='ArrowUp')next=(index+options.length-1)%options.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=options.length-1;
      if(next!==undefined){event.preventDefault();options[next].focus();}
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();trigger?.focus({preventScroll:true});}
      if(event.key==='Tab')close();
    });
    menu.addEventListener('toggle',()=>{if(trigger)trigger.setAttribute('aria-expanded',String(menu.matches(':popover-open')));});
    document.body.append(menu);
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      let pressedOpen=false;
      button.addEventListener('pointerdown',()=>{pressedOpen=menu.matches(':popover-open')&&trigger===button;});
      button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-controls','theme-menu');button.setAttribute('aria-expanded','false');
      button.onclick=()=>{
        const wasOpen=pressedOpen;pressedOpen=false;
        if(wasOpen||(menu.matches(':popover-open')&&trigger===button)){close();return;}
        close();trigger=button;options.forEach(option=>option.setAttribute('aria-checked',String(option.dataset.mode===currentMode())));menu.showPopover();
        const rect=button.getBoundingClientRect();menu.style.left=Math.max(10,Math.min(rect.right-menu.offsetWidth,innerWidth-menu.offsetWidth-10))+'px';menu.style.top=Math.min(rect.bottom+8,innerHeight-menu.offsetHeight-10)+'px';
        button.setAttribute('aria-expanded','true');(options.find(option=>option.dataset.mode===mode)||options[0]).focus({preventScroll:true});
      };
    });
    window.addEventListener('resize',close);window.addEventListener('labo-profile-changed',close);apply();
  }
  apply();document.addEventListener('DOMContentLoaded',bind,{once:true});system.addEventListener('change',()=>{if(currentMode()==='auto')changeTheme();});
  window.addEventListener('storage',event=>{if(event.key===key){mode=['light','dark'].includes(event.newValue)?event.newValue:'auto';changeTheme();}});
})();
