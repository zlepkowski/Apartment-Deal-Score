// A single listing card for the browse grid.

import { el } from '../util/dom.js';
import { money, beds, ppsfText, photoUrls } from '../util/format.js';
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
  const photos = photoUrls(scored);
  const cover = photos[0];

  // Savings measured against a borough- or city-wide median (no neighborhood
  // figure) are shown muted and flagged.
  const savings = scored.monthlySavings;
  const rough = scored.priceConfidence === 'low';
  const note = rough ? ' · rough estimate' : '';
  const savingsLine = savings == null
    ? el('div', { class: 'text-xs text-slate-400' }, 'No StreetEasy benchmark yet')
    : savings > 30
      ? el('div', { class: `text-xs font-semibold ${rough ? 'text-slate-500' : 'text-emerald-600'}` }, `~${money(Math.abs(savings))}/mo below StreetEasy median${note}`)
      : savings < -30
        ? el('div', { class: `text-xs font-semibold ${rough ? 'text-slate-500' : 'text-rose-500'}` }, `~${money(Math.abs(savings))}/mo above StreetEasy median${note}`)
        : el('div', { class: 'text-xs text-slate-400' }, `Around the StreetEasy median${note}`);

  return el('a', {
    href: `#/listing/${scored.id}`,
    class: 'group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg hover:-translate-y-0.5',
  }, [
    el('div', { class: `relative h-36 bg-gradient-to-br ${accent}` }, [
      // Cover photo over the colored placeholder; if it fails to load, the
      // placeholder shows through.
      cover ? el('img', {
        src: cover, alt: '', loading: 'lazy',
        class: 'absolute inset-0 h-full w-full object-cover',
        onError: (e) => e.target.remove(),
      }) : null,
      el('div', { class: 'absolute left-3 top-3' }, [scoreBadge(scored, 'sm')]),
      scored._source === 'user'
        ? el('div', { class: 'absolute right-3 top-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white' }, 'Draft')
        : null,
      cover
        ? el('div', { class: 'absolute bottom-3 left-3 rounded-md bg-white/85 px-2 py-0.5 text-xs font-semibold text-slate-700' }, scored.neighborhood)
        : el('div', { class: 'absolute bottom-3 left-3 text-sm font-semibold text-slate-700/70' }, scored.neighborhood),
      photos.length > 1
        ? el('div', { class: 'absolute bottom-3 right-3 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white' }, `📷 ${photos.length}`)
        : null,
    ]),
    el('div', { class: 'p-4' }, [
      el('div', { class: 'flex items-baseline justify-between gap-2' }, [
        el('div', { class: 'text-lg font-bold text-slate-900' }, money(scored.rent)),
        el('div', { class: 'text-xs text-slate-500' }, `${beds(scored.beds)} · ${scored.baths} ba${scored.sqft > 0 ? ` · ${scored.sqft} sqft` : ''}`),
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
      scored.sqft > 0 ? el('div', { class: 'mt-2 text-xs text-slate-400' }, ppsfText(scored.rent, scored.sqft)) : null,
    ]),
  ]);
}
