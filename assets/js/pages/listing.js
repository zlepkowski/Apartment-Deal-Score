// Listing detail page — the full pitch for one unit, with a transparent
// breakdown of how its Deal Score was computed.

import { el, mount } from '../util/dom.js';
import { money, bedsLong, ppsfText, titleize, httpUrl, photoUrls } from '../util/format.js';
import { getListings } from '../data/adapter.js';
import { scoreAll, bedLabel, bedClass } from '../core/score.js';
import { MARKET } from '../data/market.js';
import { scoreBadge } from '../components/scoreBadge.js';
import { icon } from '../components/icons.js';
import { listingsMap, hasLocation } from '../components/map.js';
import { photoGallery } from '../components/gallery.js';
import { amenity } from '../data/amenities.js';

function bar(points, max) {
  const pctW = Math.round((points / max) * 100);
  return el('div', { class: 'h-2 w-full overflow-hidden rounded-full bg-slate-200', 'aria-hidden': 'true' }, [
    el('div', { class: 'h-full rounded-full bg-accent', style: `width:${pctW}%` }),
  ]);
}

function breakdownRow(b) {
  return el('div', { class: 'py-3' }, [
    el('div', { class: 'flex items-baseline justify-between' }, [
      el('div', { class: 'text-sm font-semibold text-slate-800' }, [
        b.label,
        b.bonus ? el('span', { class: 'ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700' }, 'bonus') : null,
      ]),
      el('div', { class: 'num text-sm text-slate-600' }, b.bonus ? `+${b.points.toFixed(1)} / ${b.max}` : `${b.points.toFixed(1)} / ${b.max}`),
    ]),
    el('div', { class: 'mt-1.5' }, [bar(b.points, b.max)]),
    el('div', { class: 'mt-1 text-xs text-slate-600' }, b.detail),
  ]);
}

const CONFIDENCE = {
  high: { label: 'High confidence', cls: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'Medium confidence', cls: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low confidence', cls: 'bg-slate-100 text-slate-600' },
};

const LEVEL_NOUN = { neighborhood: 'neighborhood', submarket: 'area', borough: 'borough', city: 'citywide' };

// Where the "typical rent" figure comes from: StreetEasy's median asking rent,
// and which area it had to fall back to when the neighborhood has no figure.
function benchmarkExplainer(s) {
  const b = s.benchmark;
  const bed = bedLabel(bedClass(s.beds));
  const credit = el('p', { class: 'mt-2 text-xs text-slate-600' }, [
    'Source: ',
    el('a', { href: MARKET.sourceUrl, target: '_blank', rel: 'noopener', class: 'underline hover:text-slate-900' }, 'StreetEasy Data Dashboard'),
    s.benchmarkMonth ? `, ${s.benchmarkMonth}` : '',
    '.',
  ]);
  if (!b) {
    return el('div', {}, [
      el('p', { class: 'mt-2 text-xs text-slate-600' }, MARKET.areas.length
        ? `StreetEasy doesn't publish a ${bed} median for ${s.neighborhood} or ${s.city}, so this listing's price can't be benchmarked yet.`
        : 'StreetEasy market data hasn\'t been imported yet, so prices aren\'t benchmarked.'),
      credit,
    ]);
  }
  const conf = CONFIDENCE[b.confidence];
  const fellBack = b.level !== 'neighborhood';
  return el('div', { class: 'mt-3' }, [
    el('span', { class: `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${conf.cls}` }, conf.label),
    el('ul', { class: 'mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600' }, [
      el('li', {}, `StreetEasy median asking rent for ${bed}s in ${b.area.name}.`),
      b.matchedNeighborhood && b.matchedNeighborhood.toLowerCase() !== String(s.neighborhood).toLowerCase()
        ? el('li', {}, `StreetEasy publishes "${s.neighborhood}" as ${b.matchedNeighborhood}.`)
        : null,
      fellBack
        ? el('li', {}, b.matchedNeighborhood
          ? `StreetEasy doesn't publish a ${bed} figure for ${b.matchedNeighborhood}, so this uses the ${LEVEL_NOUN[b.level]} figure.`
          : `"${s.neighborhood}" isn't a StreetEasy neighborhood name (or has no ${bed} figure), so this uses the ${LEVEL_NOUN[b.level]} figure.`)
        : null,
    ]),
    credit,
  ]);
}

function fact(label, value) {
  return el('div', { class: 'rounded-xl bg-slate-50 px-3 py-2' }, [
    el('div', { class: 'text-xs text-slate-600' }, label),
    el('div', { class: 'text-sm font-semibold text-slate-800' }, value),
  ]);
}

export async function listingPage(root, ctx) {
  const all = await getListings();
  const raw = all.find((l) => l.id === ctx.params.id);
  if (!raw) {
    mount(root, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
      el('h1', { class: 'text-xl font-bold text-slate-900' }, 'Listing not found'),
      el('p', { class: 'mt-1 text-sm text-slate-600' }, 'It may have been removed from this browser.'),
      el('a', { href: '#/', class: 'mt-3 inline-block py-1 text-accent underline' }, 'Go to Browse'),
    ]));
    return;
  }
  // Score everything so the location map can show neighbors' scores too.
  const scored = scoreAll(all);
  const s = scored.find((l) => l.id === raw.id);
  document.title = `${s.title} — DealScore`;
  const externalUrl = s.url ? httpUrl(s.url) : null;
  const areaHash = `#/?city=${encodeURIComponent(s.citySlug)}&neighborhood=${encodeURIComponent(s.neighborhoodSlug)}`;
  const locMap = hasLocation(s) ? listingsMap({ heightClass: 'h-64' }) : null;

  const savingsBanner = s.monthlySavings != null
    ? el('div', {
      class: 'rounded-xl px-4 py-3 text-sm font-medium ' +
        (s.monthlySavings > 30 ? 'bg-emerald-50 text-emerald-800'
          : s.monthlySavings < -30 ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-700'),
    },
    s.monthlySavings > 30
      ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo below StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s (~${money(s.monthlySavings * 12)}/yr).`
      : s.monthlySavings < -30
        ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo above StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s.`
        : `Priced right around StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s.`)
    : null;

  const amenityGrid = (s.amenities || []).length
    ? el('ul', { class: 'grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-800 sm:grid-cols-3' },
      s.amenities.map((k) => el('li', {}, amenity(k).label)))
    : el('p', { class: 'text-sm text-slate-600' }, 'None listed.');

  const page = el('div', { class: 'mx-auto max-w-5xl px-4 py-6' }, [
    el('a', { href: '#/', class: 'mb-4 inline-flex items-center gap-1.5 py-1 text-sm text-slate-700 hover:text-slate-900' }, [icon('arrow-left'), 'Back to results']),
    // Photos when the listing has them; no decorative placeholder otherwise.
    photoUrls(s).length ? el('div', { class: 'mb-5' }, [photoGallery(s)]) : null,

    el('div', { class: 'grid grid-cols-1 gap-6 lg:grid-cols-3' }, [
      // Main column
      el('div', { class: 'lg:col-span-2' }, [
        el('div', { class: 'flex flex-wrap items-start justify-between gap-3' }, [
          el('div', {}, [
            el('h1', { class: 'text-2xl font-extrabold text-slate-900' }, s.title),
            el('p', { class: 'text-sm text-slate-600' }, [s.address, `${s.neighborhood}, ${s.city}`].filter(Boolean).join(' · ')),
          ]),
          el('div', { class: 'text-right' }, [
            el('p', { class: 'num text-2xl font-extrabold text-slate-900' }, `${money(s.rent)}/mo`),
            s.sqft > 0 ? el('p', { class: 'num text-xs text-slate-600' }, ppsfText(s.rent, s.sqft)) : null,
          ]),
        ]),
        el('div', { class: 'mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4' }, [
          fact('Type', bedsLong(s.beds)),
          fact('Bathrooms', String(s.baths)),
          fact('Size', s.sqft > 0 ? `${s.sqft} sqft` : 'Not listed'),
          fact('Available', s.available || 'Not listed'),
        ]),
        savingsBanner ? el('div', { class: 'mt-4' }, [savingsBanner]) : null,
        el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Amenities'),
        el('div', { class: 'mt-2' }, [amenityGrid]),
        s.concession
          ? el('p', { class: 'mt-4 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800' }, `Move-in special: ${s.concession}`)
          : null,
        (s.utilitiesIncluded || []).length
          ? el('p', { class: 'mt-2 text-sm text-slate-700' }, `Utilities included: ${s.utilitiesIncluded.map(titleize).join(', ')}`)
          : null,
        locMap ? el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Location') : null,
        locMap ? el('div', { class: 'mt-2' }, [locMap.node]) : null,
        locMap ? el('p', { class: 'mt-1 text-xs text-slate-600' },
          `Pins show Deal Scores. Other ${s.city} listings are faded; click one to compare.`) : null,
      ]),

      // Score sidebar
      el('div', { class: 'lg:col-span-1' }, [
        el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'flex items-center justify-between' }, [
            el('h2', { class: 'text-sm font-bold text-slate-900' }, 'Deal Score'),
          ]),
          el('div', { class: 'mt-3' }, [scoreBadge(s, 'lg')]),
          el('div', { class: 'mt-4 divide-y divide-slate-100' }, s.breakdown.map(breakdownRow)),
          el('a', { href: '#/methodology', class: 'mt-3 inline-block py-1 text-sm text-accent underline hover:text-accent-hover' },
            'How is this calculated?'),
        ]),
        el('div', { class: 'mt-4 rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('h2', { class: 'text-sm font-bold text-slate-900' }, 'Typical rent (StreetEasy median)'),
          el('p', { class: 'num mt-1 text-xl font-bold text-slate-900' }, s.fairRent != null ? `${money(s.fairRent)}/mo` : '—'),
          benchmarkExplainer(s),
          externalUrl
            ? el('a', { href: externalUrl, target: '_blank', rel: 'noopener', class: 'mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover' }, [
              'View original listing', icon('external-link'), el('span', { class: 'sr-only' }, ' (opens in a new tab)'),
            ])
            : null,
          el('a', {
            href: areaHash,
            class: 'mt-2 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50',
          }, `See more in ${s.neighborhood}`),
        ]),
      ]),
    ]),
  ]);
  mount(root, page);
  if (locMap) locMap.setListings(scored.filter((l) => l.citySlug === s.citySlug), { focusId: s.id });
}
