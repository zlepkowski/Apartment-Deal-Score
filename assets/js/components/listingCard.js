// A single listing card for the browse grid.

import { el } from '../util/dom.js';
import { money, beds, ppsfText, photoUrls } from '../util/format.js';
import { scoreBadge } from './scoreBadge.js';
import { icon } from './icons.js';
import { amenity } from '../data/amenities.js';

// opts.enter + opts.index: play the staggered entrance (first reveal only).
export function listingCard(scored, opts = {}) {
  const topAmenities = (scored.amenities || []).slice(0, 4).map((k) => amenity(k));
  const extraAmenities = (scored.amenities || []).length - topAmenities.length;
  const photos = photoUrls(scored);
  const cover = photos[0];

  // Savings measured against a borough- or city-wide median (no neighborhood
  // figure) are shown muted and flagged.
  const savings = scored.monthlySavings;
  const rough = scored.priceConfidence === 'low';
  const note = rough ? ' · rough estimate' : '';
  const savingsLine = savings == null
    ? el('p', { class: 'text-xs text-slate-600' }, 'No StreetEasy benchmark yet')
    : savings > 30
      ? el('p', { class: `num text-xs font-semibold ${rough ? 'text-slate-600' : 'text-emerald-700'}` }, `~${money(Math.abs(savings))}/mo below StreetEasy median${note}`)
      : savings < -30
        ? el('p', { class: `num text-xs font-semibold ${rough ? 'text-slate-600' : 'text-rose-700'}` }, `~${money(Math.abs(savings))}/mo above StreetEasy median${note}`)
        : el('p', { class: 'text-xs text-slate-600' }, `Around the StreetEasy median${note}`);

  return el('a', {
    href: `#/listing/${encodeURIComponent(scored.id)}`,
    class: `ds-card block rounded-2xl border border-slate-200 bg-white${opts.enter ? ' ds-enter' : ''}`,
    style: opts.enter ? `--i:${opts.index || 0}` : null,
  }, [
    // Cover photo, or a neutral placeholder. Inner radius = 16px card − 1px border.
    el('div', { class: 'relative h-36 overflow-hidden rounded-t-[15px] bg-slate-100' }, [
      cover
        ? el('img', {
          src: cover, alt: '', loading: 'lazy',
          class: 'absolute inset-0 h-full w-full object-cover',
          onError: (e) => e.target.remove(),
        })
        : null,
      el('div', { class: 'absolute inset-0 grid place-items-center text-slate-400' }, cover ? null : icon('building-2', { size: 24 })),
      el('div', { class: 'absolute left-3 top-3' }, [scoreBadge(scored, 'sm')]),
      scored._source === 'user'
        ? el('div', { class: 'absolute right-3 top-3 rounded-full bg-slate-900/85 px-2 py-0.5 text-xs font-medium text-white' }, 'Draft')
        : null,
      el('div', { class: 'absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800' }, scored.neighborhood),
      photos.length > 1
        ? el('div', { class: 'num absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-xs font-medium text-white' }, [
          icon('camera', { size: 12 }),
          `${photos.length}`,
          el('span', { class: 'sr-only' }, ' photos'),
        ])
        : null,
    ]),
    el('div', { class: 'p-4' }, [
      el('div', { class: 'flex items-baseline justify-between gap-2' }, [
        el('p', { class: 'num text-lg font-bold text-slate-900' }, money(scored.rent)),
        el('p', { class: 'num text-xs text-slate-600' }, `${beds(scored.beds)} · ${scored.baths} ba${scored.sqft > 0 ? ` · ${scored.sqft} sqft` : ''}`),
      ]),
      savingsLine,
      el('p', { class: 'mt-1 truncate text-sm font-medium text-slate-900' }, scored.title),
      el('p', { class: 'truncate text-xs text-slate-600' }, [scored.address, scored.address ? ' · ' : '', scored.city].join('')),
      topAmenities.length
        ? el('ul', { class: 'mt-3 flex flex-wrap gap-1', 'aria-label': 'Amenities' }, [
          ...topAmenities.map((a) => el('li', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700' }, a.label)),
          extraAmenities > 0
            ? el('li', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700' }, `+${extraAmenities} more`)
            : null,
        ])
        : null,
      scored.sqft > 0 ? el('p', { class: 'num mt-2 text-xs text-slate-600' }, ppsfText(scored.rent, scored.sqft)) : null,
    ]),
  ]);
}
