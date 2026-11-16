import {attachCalendars} from './portal-source/calendar.mjs?v=2';


const shell = document.querySelector('#app-shell');
const brand = document.querySelector('#sidebarToggle');
const shade = document.querySelector('#menuScrim');
const nav = shell.querySelector('nav');
const links = Array.from(nav.querySelectorAll('a'));
const mobile = matchMedia('(max-width: 760px)');
const menuKey = 'iv-ui-menu';

function setSidebarCollapsed(collapsed) {
  shell.classList.toggle('sidebar-collapsed', collapsed);
  brand.setAttribute('aria-expanded', String(!collapsed));
  const label = collapsed ? 'Agrandir le menu' : 'Réduire le menu';
  brand.setAttribute('aria-label', label);
  brand.dataset.tooltip = label;
}

function restoreSidebar() {
  let collapsed = true;
  try { collapsed = localStorage.getItem(menuKey) !== 'expanded'; } catch {}
  setSidebarCollapsed(mobile.matches || collapsed);
}

function activate(id) {
  for (const link of links) {
    const selected = link.hash === '#' + id;
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

brand.addEventListener('click', () => {
  const collapsed = !shell.classList.contains('sidebar-collapsed');
  setSidebarCollapsed(collapsed);
  if (!mobile.matches) {
    try { localStorage.setItem(menuKey, collapsed ? 'collapsed' : 'expanded'); } catch {}
  }
});
shade.addEventListener('click', () => setSidebarCollapsed(true));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches) setSidebarCollapsed(true);
});
for (const link of links) {
  link.addEventListener('click', () => {
    activate(link.hash.slice(1));
    if (mobile.matches) setSidebarCollapsed(true);
  });
}
mobile.addEventListener('change', restoreSidebar);
const sections = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) activate(entry.target.id);
}, {rootMargin: '-125px 0px -60% 0px'});
for (const section of document.querySelectorAll('#commande, .sections > section')) sections.observe(section);
restoreSidebar();
activate(location.hash.slice(1) || 'commande');


for (const group of document.querySelectorAll('[data-choice-field]')) {
  const field = group.nextElementSibling;
  const buttons = [...group.querySelectorAll('[data-choice]')];
  function positionSelection() {
    const selected = group.querySelector('.active');
    if (!selected || !group.clientWidth) return;
    const bounds = group.getBoundingClientRect();
    const rect = selected.getBoundingClientRect();
    group.style.setProperty('--selection-x', `${rect.left - bounds.left - group.clientLeft - 2}px`);
    group.style.setProperty('--selection-y', `${rect.top - bounds.top - group.clientTop}px`);
    group.style.setProperty('--selection-width', `${rect.width}px`);
    group.style.setProperty('--selection-height', `${rect.height}px`);
    group.style.setProperty('--selection-scale', String((rect.width + 4) / 100));
  }
  const resize = new ResizeObserver(positionSelection);
  resize.observe(group);
  for (const button of buttons) resize.observe(button);

  function syncSelection() {
    for (const button of buttons) {
      const selected = button.dataset.choice === field.value;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    positionSelection();
  }
  for (const button of buttons) {
    button.addEventListener('click', () => {
      field.value = button.dataset.choice;
      field.dispatchEvent(new Event('change', {bubbles: true}));
    });
  }
  field.addEventListener('change', syncSelection);
  field.form.addEventListener('reset', () => setTimeout(syncSelection, 0));
  syncSelection();
}

attachCalendars(document.querySelector('#form'));

const viewer = document.querySelector('#fieldHelpViewer');
const viewerImage = viewer.querySelector('img');
let restoreHelp;
viewer.querySelector('button').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => {
  restoreHelp?.();
  restoreHelp = undefined;
});

for (const button of document.querySelectorAll('.field-help-button')) {
  const popover = document.getElementById(button.getAttribute('popovertarget'));

  function positionHelp() {
    if (!popover.matches(':popover-open')) return;

    const margin = 16;
    const gap = 6;
    const trigger = button.getBoundingClientRect();
    const { width, height } = popover.getBoundingClientRect();
    const viewport = document.documentElement;
    const below = trigger.bottom + gap;
    const above = trigger.top - gap - height;
    const preferredTop = below + height <= viewport.clientHeight - margin ? below : above;
    const top = Math.max(margin, Math.min(preferredTop, viewport.clientHeight - height - margin));
    const left = Math.max(margin, Math.min(trigger.left, viewport.clientWidth - width - margin));
    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }

  const zoom = popover.querySelector('.field-help-zoom');
  const image = popover.querySelector('img');
  zoom.addEventListener('click', () => {
    viewerImage.alt = image.alt;
    viewerImage.src = image.currentSrc || image.src;
    restoreHelp = () => {
      if (!button.getClientRects().length) return;
      popover.showPopover({ source: button });
      positionHelp();
      zoom.focus({ preventScroll: true });
    };
    popover.hidePopover();
    viewer.showModal();
  });
  popover.addEventListener('toggle', positionHelp);
  window.addEventListener('resize', positionHelp);
  document.addEventListener('scroll', positionHelp, { capture: true, passive: true });
}
