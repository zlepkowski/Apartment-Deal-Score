// Methodology page — explains the Deal Score so renters (and you) trust it.

import { el, mount } from '../util/dom.js';

const COMPONENTS = [
  ['Price vs. comparable units', 50, 'We compute the listing\'s rent per square foot and compare it to the median $/sqft of similar units nearby. Cheaper-per-square-foot than its peers scores higher — this is the single biggest factor, just like in professional rent-comp analysis.'],
  ['Amenity richness', 22, 'Each amenity carries a weight reflecting how much renters typically pay for it (laundry, parking, central A/C and outdoor space move rent the most). A unit\'s total amenity weight is compared to the local range.'],
  ['In-unit laundry', 10, 'Called out on its own because it\'s one of the most-requested features. In-unit washer/dryer earns full marks; shared in-building laundry earns half.'],
  ['Space for the size class', 10, 'Square footage compared to other units of the same bedroom count nearby — more room for the same money scores higher.'],
  ['Condition & extras', 8, 'Recent renovation or newer construction, included utilities, and move-in concessions each add points.'],
];

function row([label, max, desc]) {
  return el('div', { class: 'border-t border-slate-100 py-4' }, [
    el('div', { class: 'flex items-baseline justify-between' }, [
      el('div', { class: 'font-semibold text-slate-800' }, label),
      el('div', { class: 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-bold text-emerald-700' }, `${max} pts`),
    ]),
    el('p', { class: 'mt-1 text-sm text-slate-600' }, desc),
  ]);
}

function gradeChip(label, range, cls) {
  return el('div', { class: `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${cls}` }, [
    el('span', { class: 'font-semibold' }, label), el('span', { class: 'tabular-nums' }, range),
  ]);
}

export function methodologyPage(root) {
  const page = el('div', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, 'How the Deal Score works'),
    el('p', { class: 'mt-2 text-slate-600' },
      'The Deal Score is a 0–100 rating of how much apartment you get for the price, ' +
      'compared to similar units in the same city and neighborhood. It\'s comparable-based — ' +
      'the same approach professional analysts use to price rentals — so it stays meaningful ' +
      'as you add more listings to each market.'),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'The five components (100 points)'),
      ...COMPONENTS.map(row),
    ]),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'mb-3 text-lg font-bold text-slate-900' }, 'How scores map to labels'),
      el('div', { class: 'grid grid-cols-1 gap-2 sm:grid-cols-2' }, [
        gradeChip('Great Deal', '80–100', 'bg-emerald-50 text-emerald-700'),
        gradeChip('Good Deal', '65–79', 'bg-lime-50 text-lime-700'),
        gradeChip('Fair Price', '50–64', 'bg-amber-50 text-amber-700'),
        gradeChip('Below Average', '35–49', 'bg-orange-50 text-orange-700'),
        gradeChip('Overpriced', '0–34', 'bg-rose-50 text-rose-700'),
      ]),
    ]),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'The comp set'),
      el('p', { class: 'mt-1 text-sm text-slate-600' },
        'For each listing we build a comparison set, preferring the tightest match with enough ' +
        'data: same neighborhood + bedroom count, then same city + bedroom count, then the whole ' +
        'city. The detail page always shows which comp set was used and how many listings it ' +
        'contained, so the score is never a black box. The more real listings you add per market, ' +
        'the sharper the scores get.'),
    ]),
    el('p', { class: 'mt-6 text-xs text-slate-400' },
      'Weights are tunable in assets/js/core/score.js and assets/js/data/amenities.js.'),
  ]);
  mount(root, page);
}
