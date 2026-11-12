// Listing detail page — the full pitch for one unit, with a transparent
// breakdown of how its Deal Score was computed.

import { el, mount } from '../util/dom.js';
import { money, moneySigned, bedsLong, ppsfText, titleize } from '../util/format.js';
import { getListings } from '../data/adapter.js';
import { scoreListing } from '../core/score.js';
import { scoreBadge, toneOf } from '../components/scoreBadge.js';
import { amenity } from '../data/amenities.js';
import { navigate } from '../util/router.js';

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
  const s = scoreListing(raw, all);
  const t = toneOf(s.grade);
  const accent = HERO_ACCENT[s.accent] || HERO_ACCENT.sky;

  const savingsBanner = s.monthlySavings != null
    ? el('div', {
      class: 'rounded-xl px-4 py-3 text-sm font-medium ' +
        (s.monthlySavings > 30 ? 'bg-emerald-50 text-emerald-700'
          : s.monthlySavings < -30 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'),
    },
    s.monthlySavings > 30
      ? `Priced about ${moneySigned(s.monthlySavings)}/mo below the typical ${bedsLong(s.beds).toLowerCase()} in this area (~${money(s.monthlySavings * 12)}/yr).`
      : s.monthlySavings < -30
        ? `Priced about ${moneySigned(s.monthlySavings)}/mo above the typical comparable unit.`
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
      ]),

      // Score sidebar
      el('div', { class: 'lg:col-span-1' }, [
        el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'flex items-center justify-between' }, [
            el('h2', { class: 'text-sm font-bold uppercase tracking-wide text-slate-500' }, 'Deal Score'),
          ]),
          el('div', { class: 'mt-3' }, [scoreBadge(s, 'lg')]),
          el('p', { class: 'mt-3 text-xs text-slate-500' },
            `Scored against ${s.compCount} comparable listings · ${s.compBasis}.`),
          el('div', { class: 'mt-4 divide-y divide-slate-100' }, s.breakdown.map(breakdownRow)),
          el('a', { href: '#/methodology', class: 'mt-4 inline-block text-xs text-emerald-600 underline' },
            'How is this calculated?'),
        ]),
        el('div', { class: 'mt-4 rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'text-xs text-slate-400' }, 'Typical rent for a comparable unit'),
          el('div', { class: 'text-xl font-bold text-slate-900' }, s.fairRent != null ? `${money(s.fairRent)}/mo` : '—'),
          el('div', { class: 'mt-1 text-xs text-slate-500' }, 'Based on local median $/sqft for this size class.'),
          s.url
            ? el('a', { href: s.url, target: '_blank', rel: 'noopener', class: 'mt-3 block rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white' }, 'View original listing')
            : el('button', {
              class: 'mt-3 block w-full rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white',
              onClick: () => navigate('#/'),
            }, 'See more in this area'),
        ]),
      ]),
    ]),
  ]);
  mount(root, page);
}
