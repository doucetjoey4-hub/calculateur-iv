// Poignées visuelles animées; le contenu conserve son défilement natif.
(() => {
  const fine=matchMedia('(hover:hover) and (pointer:fine)'),contrast=matchMedia('(forced-colors:active)');
  if(!HTMLElement.prototype.showPopover)return;
  const entries=new Map(),watchedAnimations=new WeakSet(),closingDialogs=new Set();let frame;
  const queue=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=null;refresh();});};
  const resize=new ResizeObserver(queue);
  const root=document.documentElement;
  function remove(element,entry,preserveLayout=false){for(const rail of entry.rails){if(rail.matches(':popover-open'))rail.hidePopover();rail.remove();}if(!preserveLayout)element.classList.remove('smooth-scroll-native');resize.unobserve(element);entries.delete(element);}
  function create(element){
    const rails=['y','x'].map(axis=>{
      const rail=document.createElement('div');rail.className='smooth-scroll-rail axis-'+axis;rail.setAttribute('popover','manual');rail.setAttribute('aria-hidden','true');
      const thumb=document.createElement('div');thumb.className='smooth-scroll-thumb';rail.append(thumb);
      (element.closest('dialog')||document.body).append(rail);
      let start,initial;
      rail.onpointerdown=event=>{
        if(event.button!==0)return;event.preventDefault();rail.setPointerCapture(event.pointerId);rail.classList.add('dragging');
        const metrics=rail.getBoundingClientRect(),size=axis==='y'?metrics.height:metrics.width;
        const client=axis==='y'?element.clientHeight:element.clientWidth,total=axis==='y'?element.scrollHeight:element.scrollWidth;
        const thumbSize=parseFloat(axis==='y'?thumb.style.height:thumb.style.width),travel=size-thumbSize;
        start=axis==='y'?event.clientY:event.clientX;initial=axis==='y'?element.scrollTop:element.scrollLeft;
        if(event.target!==thumb){initial=Math.max(0,Math.min(total-client,((start-(axis==='y'?metrics.top:metrics.left)-thumbSize/2)/travel)*(total-client)));if(axis==='y')element.scrollTop=initial;else element.scrollLeft=initial;}
        rail.onpointermove=move=>{if(!rail.hasPointerCapture(move.pointerId))return;const delta=(axis==='y'?move.clientY:move.clientX)-start;if(axis==='y')element.scrollTop=initial+delta*(total-client)/travel;else element.scrollLeft=initial+delta*(total-client)/travel;queue();};
        queue();
      };
      rail.onlostpointercapture=()=>{rail.classList.remove('dragging');rail.onpointermove=null;};
      rail.addEventListener('wheel',event=>{event.preventDefault();element.scrollTop+=event.deltaY;element.scrollLeft+=event.deltaX;queue();},{passive:false});
      return rail;
    });
    const entry={rails};entries.set(element,entry);resize.observe(element);return entry;
  }
  function refresh(){
    root.classList.toggle('smooth-scroll-enabled',fine.matches&&!contrast.matches);
    if(!fine.matches||contrast.matches){for(const [element,entry]of entries)remove(element,entry);return;}
    const modal=[...document.querySelectorAll('dialog:modal')].at(-1);
    const moving=modal?.getAnimations().filter(animation=>animation.playState==='running'&&animation.effect?.target===modal&&animation.effect.getKeyframes().some(key=>key.transform!==undefined||key.opacity!==undefined))||[];
    for(const animation of moving){if(watchedAnimations.has(animation))continue;watchedAnimations.add(animation);animation.finished.then(queue,queue);}
    const candidates=new Set([root,...document.querySelectorAll('dialog,.tracked-editor form,.table-wrap,textarea,#dialog-body,#user-body,#note-content,.ui-select-menu,.sidebar,.check-panel,.history')]);
    for(const [element,entry]of entries)if(!candidates.has(element)||!element.isConnected)remove(element,entry);
    for(const element of candidates){
      const isRoot=element===root,style=getComputedStyle(element);let rect=isRoot?{top:0,left:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight}:element.getBoundingClientRect();
      if(!isRoot){for(let parent=element.parentElement;parent&&parent!==document.body;parent=parent.parentElement){const css=getComputedStyle(parent);if(/auto|scroll|hidden|clip/.test(css.overflowY+' '+css.overflowX)){const bounds=parent.getBoundingClientRect();rect={top:Math.max(rect.top,bounds.top),bottom:Math.min(rect.bottom,bounds.bottom),left:Math.max(rect.left,bounds.left),right:Math.min(rect.right,bounds.right),width:Math.min(rect.right,bounds.right)-Math.max(rect.left,bounds.left),height:Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top)};}}}
      const footer=!isRoot&&element.querySelector('form>.actions,:scope>.actions');
      if(footer&&getComputedStyle(footer).position==='sticky'){const bounds=footer.getBoundingClientRect();if(bounds.top>rect.top&&bounds.top<rect.bottom)rect={...rect,bottom:bounds.top,height:bounds.top-rect.top};}
      const owner=element.closest('dialog');
      const allowed=(!owner||owner.open)&&(!closingDialogs.size||!!modal)&&(!modal||modal===element||modal.contains(element))&&rect.width>0&&rect.height>0;
      const y=allowed&&(isRoot||/auto|scroll/.test(style.overflowY))&&element.scrollHeight>element.clientHeight+2;
      const x=allowed&&(isRoot||/auto|scroll/.test(style.overflowX))&&element.scrollWidth>element.clientWidth+2;
      let entry=entries.get(element);if(!y&&!x){if(entry)remove(element,entry);continue;}
      if(!entry)entry=create(element);element.classList.add('smooth-scroll-native');
      entry.rails.forEach((rail,index)=>{
        for(const name of ["--scroll-thumb","--scroll-thumb-hover","--scroll-thumb-active"])rail.style.setProperty(name,style.getPropertyValue(name));
        const vertical=index===0,visible=(vertical?y:x)&&!(moving.length&&modal?.contains(element));
        if(!visible){if(rail.matches(':popover-open'))rail.hidePopover();return;}
        const inset=14,begin=Math.max(inset,(vertical?rect.top:rect.left)+inset),end=Math.min((vertical?innerHeight:innerWidth)-inset,(vertical?rect.bottom:rect.right)-inset)-(vertical&&x?12:0),length=end-begin;
        if(length<30){if(rail.matches(':popover-open'))rail.hidePopover();return;}
        Object.assign(rail.style,{top:(vertical?begin:Math.min(innerHeight,rect.bottom)-14)+'px',left:(vertical?Math.min(innerWidth,rect.right)-14:begin)+'px',width:(vertical?12:length)+'px',height:(vertical?length:12)+'px'});
        const total=vertical?element.scrollHeight:element.scrollWidth,client=vertical?element.clientHeight:element.clientWidth,position=vertical?element.scrollTop:element.scrollLeft;
        const thumb=rail.firstChild,size=Math.min(length,Math.max(32,length*client/total)),offset=Math.max(0,Math.min(length-size,position/(total-client)*(length-size)));
        Object.assign(thumb.style,vertical?{height:size+'px',top:offset+'px'}:{width:size+'px',left:offset+'px'});
        if(!rail.matches(':popover-open'))rail.showPopover();
      });
    }
  }
  const observer=new MutationObserver(changes=>{if(changes.some(change=>!change.target.closest?.('.smooth-scroll-rail')&&(change.type==='attributes'||[...change.addedNodes,...change.removedNodes].some(node=>node.nodeType===1&&!node.matches('.smooth-scroll-rail')))))queue();});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden']});
  document.addEventListener('transitionrun',event=>{if(event.target.matches?.('dialog'))queue();},true);document.addEventListener('transitionend',event=>{if(event.target.matches?.('dialog'))queue();},true);document.addEventListener('close',event=>{
    const dialog=event.target;if(!dialog.matches?.('dialog'))return;
    const scrollAreas=[];
    for(const [element,entry]of entries)if(dialog.contains(element)){scrollAreas.push(element);remove(element,entry,true);}
    closingDialogs.add(dialog);root.classList.add('scrollbar-modal-closing');
    const animations=dialog.getAnimations().filter(animation=>animation.playState==='running'&&animation.effect?.target===dialog);
    Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{for(const element of scrollAreas)if(!entries.has(element))element.classList.remove('smooth-scroll-native');closingDialogs.delete(dialog);if(!closingDialogs.size)root.classList.remove('scrollbar-modal-closing');queue();});
    queue();
  },true);document.addEventListener('scroll',queue,true);document.addEventListener('input',queue,true);document.addEventListener('toggle',queue,true);window.addEventListener('resize',queue);fine.addEventListener('change',queue);contrast.addEventListener('change',queue);queue();
})();
