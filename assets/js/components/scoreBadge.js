// The Deal Score badge — a colored chip showing the 0–100 score and its label.
// Tone maps to a Tailwind color scale shared across the app.

import { el } from '../util/dom.js';

const TONE = {
  great: { ring: 'ring-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  good: { ring: 'ring-lime-300', bg: 'bg-lime-50', text: 'text-lime-700', dot: 'bg-lime-500' },
  fair: { ring: 'ring-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  below: { ring: 'ring-orange-300', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  poor: { ring: 'ring-rose-300', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export function toneOf(g) {
  return TONE[g.tone] || TONE.fair;
}

// size: 'sm' | 'lg'
export function scoreBadge(scored, size = 'sm') {
  const t = toneOf(scored.grade);
  if (size === 'lg') {
    return el('div', { class: `inline-flex items-center gap-3 rounded-2xl ring-1 ${t.ring} ${t.bg} px-4 py-3` }, [
      el('div', { class: `text-3xl font-extrabold ${t.text} tabular-nums` }, String(scored.dealScore)),
      el('div', {}, [
        el('div', { class: `text-sm font-semibold ${t.text}` }, scored.grade.label),
        el('div', { class: 'text-xs text-slate-600' }, 'out of 100'),
      ]),
    ]);
  }
  return el('div', { class: `inline-flex items-center gap-1.5 rounded-full ring-1 ${t.ring} ${t.bg} ${t.text} px-2.5 py-1 text-xs font-semibold` }, [
    el('span', { class: `inline-block h-1.5 w-1.5 rounded-full ${t.dot}`, 'aria-hidden': 'true' }),
    el('span', { class: 'sr-only' }, 'Deal Score '),
    el('span', { class: 'tabular-nums' }, String(scored.dealScore)),
    el('span', {}, scored.grade.label),
  ]);
}
