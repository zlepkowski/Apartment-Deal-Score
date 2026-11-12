// Listing detail page — the full pitch for one unit, with a transparent
// breakdown of how its Deal Score was computed.

import { el, mount } from '../util/dom.js';
import { money, bedsLong, ppsfText, titleize, httpUrl } from '../util/format.js';
import { getListings } from '../data/adapter.js';
import { scoreAll, bedLabel } from '../core/score.js';
import { scoreBadge, toneOf } from '../components/scoreBadge.js';
import { listingsMap, hasLocation } from '../components/map.js';
import { amenity } from '../data/amenities.js';

const HERO_ACCENT = {
  rose: 'from-rose-300 to-rose-100', amber: 'from-amber-300 to-amber-100',
  sky: 'from-sky-300 to-sky-100', emerald: 'from-emerald-300 to-emerald-100',
  indigo: 'from-indigo-300 to-indigo-100', violet: 'from-violet-300 to-violet-100',
  teal: 'from-teal-300 to-teal-100', cyan: 'from-cyan-300 to-cyan-100',
  lime: 'from-lime-300 to-lime-100', orange: 'from-orange-300 to-orange-100',
  stone: 'from-stone-300 to-stone-100',
};

function bar(points, max) {
  const pctW = Math.round((points / max) * 100);
  return el('div', { class: 'h-2 w-full overflow-hidden rounded-full bg-slate-100' }, [
    el('div', { class: 'h-full rounded-full bg-emerald-500', style: `width:${pctW}%` }),
  ]);
}

function breakdownRow(b) {
  return el('div', { class: 'py-3' }, [
    el('div', { class: 'flex items-baseline justify-between' }, [
      el('div', { class: 'text-sm font-semibold text-slate-800' }, b.label),
      el('div', { class: 'text-sm tabular-nums text-slate-500' }, `${b.points.toFixed(1)} / ${b.max}`),
    ]),
    el('div', { class: 'mt-1.5' }, [bar(b.points, b.max)]),
    el('div', { class: 'mt-1 text-xs text-slate-500' }, b.detail),
  ]);
}

const CONFIDENCE = {
  high: { label: 'High confidence', cls: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'Medium confidence', cls: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low confidence', cls: 'bg-slate-100 text-slate-600' },
};

const perSqft = (v) => `$${v.toFixed(2)}/sqft`;

// Plain-language walk-through of how the "typical rent" anchor was built, so a
// thin-market estimate is visibly an estimate.
function anchorExplainer(s) {
  const a = s.priceAnchor;
  if (!a) {
    return el('p', { class: 'mt-2 text-xs text-slate-500' },
      `No other ${s.city} listings to compare against yet. Add more listings in this area to price it.`);
  }
  const bed = bedLabel(s.beds);
  const levelPct = Math.round((a.location.factor - 1) * 100);
  const level = Math.abs(levelPct) < 3
    ? `about at the ${s.city} average`
    : `${Math.abs(levelPct)}% ${levelPct > 0 ? 'above' : 'below'} the ${s.city} average`;
  const step = (text) => el('li', { class: 'text-xs text-slate-600' }, text);
  const conf = CONFIDENCE[a.confidence];

  return el('div', { class: 'mt-3' }, [
    el('span', { class: `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${conf.cls}` }, conf.label),
    el('ul', { class: 'mt-2 list-disc space-y-1 pl-4' }, [
      a.local.count
        ? step(`${a.local.count} other ${s.neighborhood} ${bed} listing${a.local.count === 1 ? '' : 's'}: median ${perSqft(a.local.ppsf)}.`)
        : step(`No other ${s.neighborhood} ${bed} listings yet.`),
      step(`${a.market.basis}: median ${perSqft(a.market.ppsf)} across ${a.market.count} listings.`),
      a.location.count
        ? step(`${s.neighborhood} runs ${level}, so the ${s.city}-wide figure adjusts to ${perSqft(a.adjustedMarketPpsf)}.`)
        : null,
      step(a.local.count
        ? `Weighted ${Math.round(a.weight * 100)}% neighborhood / ${Math.round((1 - a.weight) * 100)}% adjusted ${s.city} → ${perSqft(a.ppsf)} × ${s.sqft} sqft.`
        : `Typical: ${perSqft(a.ppsf)} × ${s.sqft} sqft.`),
    ]),
  ]);
}

function fact(label, value) {
  return el('div', { class: 'rounded-xl bg-slate-50 px-3 py-2' }, [
    el('div', { class: 'text-xs text-slate-400' }, label),
    el('div', { class: 'text-sm font-semibold text-slate-800' }, value),
  ]);
}

export async function listingPage(root, ctx) {
  const all = await getListings();
  const raw = all.find((l) => l.id === ctx.params.id);
  if (!raw) {
    mount(root, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
      el('p', { class: 'text-slate-500' }, 'Listing not found.'),
      el('a', { href: '#/', class: 'mt-3 inline-block text-emerald-600 underline' }, 'Back to browse'),
    ]));
    return;
  }
  // Score everything so the location map can show neighbors' scores too.
  const scored = scoreAll(all);
  const s = scored.find((l) => l.id === raw.id);
  const t = toneOf(s.grade);
  const accent = HERO_ACCENT[s.accent] || HERO_ACCENT.sky;
  const externalUrl = s.url ? httpUrl(s.url) : null;
  const areaHash = `#/?city=${encodeURIComponent(s.citySlug)}&neighborhood=${encodeURIComponent(s.neighborhoodSlug)}`;
  const locMap = hasLocation(s) ? listingsMap({ heightClass: 'h-64' }) : null;

  const savingsBanner = s.monthlySavings != null
    ? el('div', {
      class: 'rounded-xl px-4 py-3 text-sm font-medium ' +
        (s.monthlySavings > 30 ? 'bg-emerald-50 text-emerald-700'
          : s.monthlySavings < -30 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'),
    },
    s.monthlySavings > 30
      ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo below the typical ${bedLabel(s.beds)} in this area (~${money(s.monthlySavings * 12)}/yr).`
      : s.monthlySavings < -30
        ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo above the typical comparable unit.`
        : 'Priced right around the typical comparable unit.')
    : null;

  const amenityGrid = el('div', { class: 'grid grid-cols-2 gap-2 sm:grid-cols-3' },
    (s.amenities || []).map((k) => {
      const a = amenity(k);
      return el('div', { class: 'flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700' },
        [el('span', {}, a.icon), el('span', {}, a.label)]);
    }));

  const page = el('div', { class: 'mx-auto max-w-5xl px-4 py-6' }, [
    el('a', { href: '#/', class: 'mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800' }, '← Back to results'),
    el('div', { class: `relative mb-5 h-56 overflow-hidden rounded-2xl bg-gradient-to-br ${accent}` }, [
      el('div', { class: 'absolute bottom-4 left-4 rounded-lg bg-white/70 px-3 py-1 text-sm font-semibold text-slate-700 backdrop-blur' },
        `${s.neighborhood}, ${s.city}`),
    ]),

    el('div', { class: 'grid grid-cols-1 gap-6 lg:grid-cols-3' }, [
      // Main column
      el('div', { class: 'lg:col-span-2' }, [
        el('div', { class: 'flex flex-wrap items-start justify-between gap-3' }, [
          el('div', {}, [
            el('h1', { class: 'text-2xl font-extrabold text-slate-900' }, s.title),
            el('div', { class: 'text-sm text-slate-500' }, `${s.address} · ${s.neighborhood}, ${s.city}`),
          ]),
          el('div', { class: 'text-right' }, [
            el('div', { class: 'text-2xl font-extrabold text-slate-900' }, `${money(s.rent)}/mo`),
            el('div', { class: 'text-xs text-slate-400' }, ppsfText(s.rent, s.sqft)),
          ]),
        ]),
        el('div', { class: 'mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4' }, [
          fact('Type', bedsLong(s.beds)),
          fact('Bathrooms', String(s.baths)),
          fact('Size', `${s.sqft} sqft`),
          fact('Available', s.available),
        ]),
        savingsBanner ? el('div', { class: 'mt-4' }, [savingsBanner]) : null,
        el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Amenities'),
        el('div', { class: 'mt-2' }, [amenityGrid]),
        s.concession
          ? el('div', { class: 'mt-4 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800' }, `🎁 Move-in special: ${s.concession}`)
          : null,
        (s.utilitiesIncluded || []).length
          ? el('div', { class: 'mt-2 text-sm text-slate-600' }, `Utilities included: ${s.utilitiesIncluded.map(titleize).join(', ')}`)
          : null,
        locMap ? el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Location') : null,
        locMap ? el('div', { class: 'mt-2' }, [locMap.node]) : null,
        locMap ? el('p', { class: 'mt-1 text-xs text-slate-400' },
          `Pins show Deal Scores. Other ${s.city} listings are faded; click one to compare.`) : null,
      ]),

      // Score sidebar
      el('div', { class: 'lg:col-span-1' }, [
        el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'flex items-center justify-between' }, [
            el('h2', { class: 'text-sm font-bold uppercase tracking-wide text-slate-500' }, 'Deal Score'),
          ]),
          el('div', { class: 'mt-3' }, [scoreBadge(s, 'lg')]),
          el('p', { class: 'mt-3 text-xs text-slate-500' },
            `Amenities and space compared with ${s.compCount} other listings · ${s.compBasis}.`),
          el('div', { class: 'mt-4 divide-y divide-slate-100' }, s.breakdown.map(breakdownRow)),
          el('a', { href: '#/methodology', class: 'mt-4 inline-block text-xs text-emerald-600 underline' },
            'How is this calculated?'),
        ]),
        el('div', { class: 'mt-4 rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'text-xs text-slate-400' }, 'Typical rent for a comparable unit'),
          el('div', { class: 'text-xl font-bold text-slate-900' }, s.fairRent != null ? `${money(s.fairRent)}/mo` : '—'),
          anchorExplainer(s),
          externalUrl
            ? el('a', { href: externalUrl, target: '_blank', rel: 'noopener', class: 'mt-3 block rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white' }, 'View original listing')
            : null,
          el('a', {
            href: areaHash,
            class: 'mt-2 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50',
          }, `More in ${s.neighborhood}`),
        ]),
      ]),
    ]),
  ]);
  mount(root, page);
  if (locMap) locMap.setListings(scored.filter((l) => l.citySlug === s.citySlug), { focusId: s.id });
}
