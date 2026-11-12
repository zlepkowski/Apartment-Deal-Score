// Top navigation bar, rendered once into #app-header.

import { el } from '../util/dom.js';

// `short` is shown on phone-width screens so the nav fits on one line.
function link(href, label, short = label) {
  const active = (location.hash || '#/').split('?')[0] === href;
  return el('a', {
    href,
    'aria-label': label,
    ...(active ? { 'aria-current': 'page' } : {}),
    class: 'whitespace-nowrap px-2.5 py-2 sm:px-3 rounded-lg text-sm font-medium ' +
      (active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'),
  }, [
    el('span', { class: 'sm:hidden' }, short),
    el('span', { class: 'hidden sm:inline' }, label),
  ]);
}

export function renderHeader(root) {
  const bar = el('header', { class: 'sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur' }, [
    el('div', { class: 'mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3' }, [
      el('a', { href: '#/', class: 'flex shrink-0 items-center gap-2' }, [
        el('span', { class: 'grid h-8 w-8 place-items-center rounded-lg bg-accent text-white font-black', 'aria-hidden': 'true' }, 'D'),
        el('span', { class: 'text-lg font-extrabold tracking-tight text-slate-900' }, 'DealScore'),
        el('span', { class: 'hidden sm:inline text-sm text-slate-600' }, 'NYC Apartments'),
      ]),
      el('nav', { class: 'flex items-center gap-0.5 sm:gap-1', 'aria-label': 'Main' }, [
        link('#/', 'Browse'),
        link('#/methodology', 'How scoring works', 'Scoring'),
        link('#/add', 'Add listing', 'Add'),
      ]),
    ]),
  ]);
  root.innerHTML = '';
  root.appendChild(bar);
}
