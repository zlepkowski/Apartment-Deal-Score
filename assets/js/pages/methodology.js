// Methodology page — explains the Deal Score so renters (and you) trust it.

import { el, mount } from '../util/dom.js';

const COMPONENTS = [
  ['Price vs. comparable units', 50, 'We compute the listing\'s rent per square foot and compare it to the typical $/sqft of similar units nearby (see "Thin markets" below for how "typical" is worked out). Being right at typical earns half marks; 25% cheaper earns full marks. This is the single biggest factor, just like in professional rent-comp analysis.'],
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
      'compared to similar units in the same neighborhood and borough. It\'s comparable-based — ' +
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
        'For amenities and space, each listing is compared with the tightest set of other ' +
        'listings that has enough data: same neighborhood + bedroom count, then same borough + ' +
        'bedroom count, then the whole borough. A listing is never counted as its own comparable. ' +
        'The detail page shows which set was used and how many listings it contained.'),
    ]),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'Thin markets: how "typical rent" is estimated'),
      el('p', { class: 'mt-1 text-sm text-slate-600' },
        'A neighborhood with only one or two listings of a given size can\'t say much on its own, ' +
        'and the borough as a whole mixes luxury towers with walk-ups. So the typical $/sqft blends two estimates:'),
      el('ul', { class: 'mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600' }, [
        el('li', {}, 'Local: the median $/sqft of same-size units in the same neighborhood.'),
        el('li', {}, 'Adjusted borough: the borough-wide median for that size, scaled by how pricey the ' +
          'neighborhood runs compared with its borough across all its listings.'),
      ]),
      el('p', { class: 'mt-2 text-sm text-slate-600' },
        'The more local comps there are, the more the local figure counts: one comp is weighted ' +
        'one-third, two are half, six are three-quarters. Each listing shows a confidence level: high ' +
        'with 3+ local comps, medium with at least one local comp or a full size class in the borough, ' +
        'low otherwise. Low-confidence savings are flagged as rough estimates. Adding real listings ' +
        'per neighborhood is what sharpens every score.'),
    ]),
    el('p', { class: 'mt-6 text-xs text-slate-400' },
      'Weights are tunable in assets/js/core/score.js and assets/js/data/amenities.js.'),
  ]);
  mount(root, page);
}
