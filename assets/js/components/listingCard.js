// A single listing card for the browse grid.

import { el } from '../util/dom.js';
import { money, moneySigned, beds, ppsfText } from '../util/format.js';
import { scoreBadge } from './scoreBadge.js';
import { amenity } from '../data/amenities.js';

const ACCENT = {
  rose: 'from-rose-200 to-rose-100', amber: 'from-amber-200 to-amber-100',
  sky: 'from-sky-200 to-sky-100', emerald: 'from-emerald-200 to-emerald-100',
  indigo: 'from-indigo-200 to-indigo-100', violet: 'from-violet-200 to-violet-100',
  teal: 'from-teal-200 to-teal-100', cyan: 'from-cyan-200 to-cyan-100',
  lime: 'from-lime-200 to-lime-100', orange: 'from-orange-200 to-orange-100',
  stone: 'from-stone-200 to-stone-100',
};

export function listingCard(scored) {
  const accent = ACCENT[scored.accent] || ACCENT.sky;
  const topAmenities = (scored.amenities || []).slice(0, 4).map((k) => amenity(k));

  const savings = scored.monthlySavings;
  const savingsLine = savings != null && savings > 30
    ? el('div', { class: 'text-xs font-semibold text-emerald-600' }, `~${moneySigned(savings)}/mo below typical`)
    : savings != null && savings < -30
      ? el('div', { class: 'text-xs font-semibold text-rose-500' }, `~${moneySigned(savings)}/mo above typical`)
      : el('div', { class: 'text-xs text-slate-400' }, 'Around typical price');

  return el('a', {
    href: `#/listing/${scored.id}`,
    class: 'group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg hover:-translate-y-0.5',
  }, [
    el('div', { class: `relative h-36 bg-gradient-to-br ${accent}` }, [
      el('div', { class: 'absolute left-3 top-3' }, [scoreBadge(scored, 'sm')]),
      scored._source === 'user'
        ? el('div', { class: 'absolute right-3 top-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white' }, 'Draft')
        : null,
      el('div', { class: 'absolute bottom-3 left-3 text-sm font-semibold text-slate-700/70' }, scored.neighborhood),
    ]),
    el('div', { class: 'p-4' }, [
      el('div', { class: 'flex items-baseline justify-between gap-2' }, [
        el('div', { class: 'text-lg font-bold text-slate-900' }, money(scored.rent)),
        el('div', { class: 'text-xs text-slate-500' }, `${beds(scored.beds)} · ${scored.baths} ba · ${scored.sqft} sqft`),
      ]),
      savingsLine,
      el('div', { class: 'mt-1 truncate text-sm font-medium text-slate-700' }, scored.title),
      el('div', { class: 'truncate text-xs text-slate-400' }, `${scored.address} · ${scored.city}`),
      el('div', { class: 'mt-3 flex flex-wrap gap-1' }, [
        ...topAmenities.map((a) =>
          el('span', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600' }, `${a.icon} ${a.label}`)),
        scored.amenities.length > 4
          ? el('span', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500' }, `+${scored.amenities.length - 4}`)
          : null,
      ]),
      el('div', { class: 'mt-2 text-xs text-slate-400' }, ppsfText(scored.rent, scored.sqft)),
    ]),
  ]);
}
