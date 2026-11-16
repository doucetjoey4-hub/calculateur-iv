(() => {
 const nav=document.querySelector('#sidebar nav');if(!nav)return;
 const indicator=document.createElement('span');indicator.className='nav-sliding-outline';indicator.setAttribute('aria-hidden','true');nav.append(indicator);nav.classList.add('has-sliding-outline');let frame,placed=false;
 const update=()=>{frame=null;const active=nav.querySelector('a.active'),box=nav.getBoundingClientRect();if(!active||!box.width||!box.height){indicator.hidden=true;placed=false;indicator.classList.remove('is-ready');return;}const rect=active.getBoundingClientRect();indicator.hidden=false;indicator.style.width='calc(100% - '+Math.max(0,box.width-rect.width)+'px)';indicator.style.height=rect.height+'px';indicator.style.borderRadius=getComputedStyle(active).borderRadius;indicator.style.transform=`translate3d(${rect.left-box.left}px,${rect.top-box.top}px,0)`;if(!placed){placed=true;requestAnimationFrame(()=>indicator.classList.add('is-ready'));}};
 const queue=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const resize=new ResizeObserver(queue);resize.observe(nav);nav.querySelectorAll('a').forEach(link=>resize.observe(link));
 new MutationObserver(changes=>{if(changes.some(change=>change.target!==indicator))queue();}).observe(nav,{subtree:true,attributes:true,attributeFilter:['class','hidden']});
 new MutationObserver(queue).observe(document.querySelector('#app-shell'),{attributes:true,attributeFilter:['hidden','class']});
 window.addEventListener('resize',queue);window.addEventListener('labo-profile-changed',queue);queue();
})();
