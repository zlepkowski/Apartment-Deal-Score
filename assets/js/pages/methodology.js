// Methodology page — explains the Deal Score so renters (and you) trust it.

import { el, mount } from '../util/dom.js';
import { MARKET } from '../data/market.js';
import { TYPICAL_SQFT, monthLabel } from '../core/score.js';

const COMPONENTS = [
  ['Price vs. StreetEasy median', '60 pts', 'The listing\'s rent compared with StreetEasy\'s median asking rent for the same neighborhood and bedroom count (studio, 1, 2, or 3+ beds). Right at the median earns half marks; 25% below earns full marks; 25% above earns none. This is the single biggest factor.'],
  ['Amenity richness', '22 pts', 'Each amenity has a hand-set weight; in-unit laundry, parking, central A/C, dishwashers and outdoor space weigh the most. The weights are a judgment call, not fitted to rent data. An apartment with most of them, such as a doorman building with in-unit laundry, earns full marks.'],
  ['In-unit laundry', '10 pts', 'Scored on its own, on top of the amenity score, so laundry counts extra. An in-unit washer/dryer earns full marks; shared in-building laundry earns half.'],
  ['Condition & extras', '8 pts', 'Recent renovation or newer construction, included utilities, and move-in concessions each add points.'],
  ['Space bonus', 'up to +10', 'Only when the listing gives its square footage. A unit 30% or more bigger than a typical NYC apartment of its size earns the full bonus. Smaller units, and listings without square footage, simply get no bonus. The total is capped at 100.'],
];

function row([label, pts, desc]) {
  return el('div', { class: 'border-t border-slate-100 py-4' }, [
    el('div', { class: 'flex items-baseline justify-between gap-3' }, [
      el('div', { class: 'font-semibold text-slate-800' }, label),
      el('div', { class: 'num whitespace-nowrap rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-bold text-accent' }, pts),
    ]),
    el('p', { class: 'mt-1 text-sm text-slate-600' }, desc),
  ]);
}

function gradeChip(label, range, cls) {
  return el('div', { class: `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${cls}` }, [
    el('span', { class: 'font-semibold' }, label), el('span', { class: 'tabular-nums' }, range),
  ]);
}

const methodCard = (children) => el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, children);
const methodPara = (text) => el('p', { class: 'mt-1 text-sm text-slate-600' }, text);
const methodLink = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', class: 'text-accent underline' }, text);

export function methodologyPage(root) {
  const page = el('div', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, 'How the Deal Score works'),
    el('p', { class: 'mt-2 text-slate-600' },
      'The Deal Score is a 0–100 rating of how good a deal an apartment is. Its price is compared with ' +
      'what similar apartments in the same neighborhood are asking, using StreetEasy\'s published market data, ' +
      'and the rest of the score comes from what the apartment itself offers.'),

    methodCard([
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'The components'),
      ...COMPONENTS.map(row),
    ]),

    methodCard([
      el('h2', { class: 'mb-3 text-lg font-bold text-slate-900' }, 'How scores map to labels'),
      el('div', { class: 'grid grid-cols-1 gap-2 sm:grid-cols-2' }, [
        gradeChip('Great Deal', '80–100', 'bg-emerald-50 text-emerald-700'),
        gradeChip('Good Deal', '65–79', 'bg-lime-50 text-lime-700'),
        gradeChip('Fair Price', '50–64', 'bg-amber-50 text-amber-700'),
        gradeChip('Below Average', '35–49', 'bg-orange-50 text-orange-700'),
        gradeChip('Overpriced', '0–34', 'bg-rose-50 text-rose-700'),
      ]),
    ]),

    methodCard([
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'Where the benchmark comes from'),
      methodPara([
        'Typical rents are StreetEasy\'s median asking rents from its ',
        methodLink(MARKET.sourceUrl, 'Data Dashboard'),
        MARKET.asOf ? ` (currently ${monthLabel(MARKET.asOf)}), refreshed monthly.` : '. They haven\'t been imported yet.',
      ]),
      methodPara('StreetEasy doesn\'t publish a figure for every neighborhood and size, so DealScore uses the most ' +
        'specific one available: the neighborhood first, then the wider area it belongs to, then the borough, ' +
        'then all of NYC. Each listing shows which level it used as a confidence label: high for a ' +
        'neighborhood figure, medium for a wider area, low for a borough or citywide figure. Low-confidence ' +
        'savings are flagged as rough estimates.'),
    ]),

    methodCard([
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'Typical sizes for the space bonus'),
      methodPara('StreetEasy doesn\'t publish apartment sizes, so the space bonus compares against typical NYC sizes ' +
        `rounded from RentCafe's listing averages: studio ~${TYPICAL_SQFT[0]} sqft, 1-bed ~${TYPICAL_SQFT[1]}, ` +
        `2-bed ~${TYPICAL_SQFT[2]}, 3+ bed ~${TYPICAL_SQFT[3]}.`),
    ]),

    el('p', { class: 'mt-6 text-xs text-slate-600' },
      'Weights are tunable in assets/js/core/score.js and assets/js/data/amenities.js. DealScore is not affiliated with StreetEasy.'),
  ]);
  mount(root, page);
}
