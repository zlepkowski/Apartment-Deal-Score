// Top navigation bar, rendered once into #app-header.

import { el } from '../util/dom.js';

function link(href, label) {
  const active = (location.hash || '#/').split('?')[0] === href;
  return el('a', {
    href,
    class: 'px-3 py-2 rounded-lg text-sm font-medium ' +
      (active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'),
  }, label);
}

export function renderHeader(root) {
  const bar = el('header', { class: 'sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur' }, [
    el('div', { class: 'mx-auto flex max-w-6xl items-center justify-between px-4 py-3' }, [
      el('a', { href: '#/', class: 'flex items-center gap-2' }, [
        el('span', { class: 'grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-white font-black' }, 'D'),
        el('span', { class: 'text-lg font-extrabold tracking-tight text-slate-900' }, 'DealScore'),
        el('span', { class: 'hidden sm:inline text-sm text-slate-400' }, 'NYC Apartments'),
      ]),
      el('nav', { class: 'flex items-center gap-1' }, [
        link('#/', 'Browse'),
        link('#/methodology', 'How scoring works'),
        link('#/add', 'Add listing'),
      ]),
    ]),
  ]);
  root.innerHTML = '';
  root.appendChild(bar);
}
