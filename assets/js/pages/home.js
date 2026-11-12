// Browse page — filter, sort, and the scored listing grid. This is where the
// Deal Score does its work: by default we sort best-deal-first.

import { el, mount } from '../util/dom.js';
import { money, num } from '../util/format.js';
import { ppsf } from '../util/format.js';
import { median } from '../util/stats.js';
import { getListings } from '../data/adapter.js';
import { scoreAll } from '../core/score.js';
import { filterBar } from '../components/filters.js';
import { listingCard } from '../components/listingCard.js';

function stateFromQuery(q) {
  return {
    city: q.city || '', neighborhood: q.neighborhood || '', beds: q.beds || '',
    maxRent: q.maxRent || '', laundry: q.laundry === '1', sort: q.sort || 'deal',
  };
}

function stateToHash(s) {
  const p = new URLSearchParams();
  if (s.city) p.set('city', s.city);
  if (s.neighborhood) p.set('neighborhood', s.neighborhood);
  if (s.beds !== '') p.set('beds', s.beds);
  if (s.maxRent) p.set('maxRent', s.maxRent);
  if (s.laundry) p.set('laundry', '1');
  if (s.sort && s.sort !== 'deal') p.set('sort', s.sort);
  const qs = p.toString();
  return '#/' + (qs ? '?' + qs : '');
}

function deriveOptions(all, state) {
  const cityMap = new Map();
  for (const l of all) cityMap.set(l.citySlug, l.city);
  const cities = [...cityMap].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));

  const nMap = new Map();
  for (const l of all) {
    if (state.city && l.citySlug !== state.city) continue;
    nMap.set(l.neighborhoodSlug, l.neighborhood);
  }
  const neighborhoods = [...nMap].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  return { cities, neighborhoods };
}

function applyFilters(scored, s) {
  return scored.filter((l) => {
    if (s.city && l.citySlug !== s.city) return false;
    if (s.neighborhood && l.neighborhoodSlug !== s.neighborhood) return false;
    if (s.beds !== '') {
      if (s.beds === '3') { if (l.beds < 3) return false; }
      else if (l.beds !== Number(s.beds)) return false;
    }
    if (s.maxRent && l.rent > Number(s.maxRent)) return false;
    if (s.laundry && !(l.amenities || []).includes('in_unit_laundry')) return false;
    return true;
  });
}

function sortListings(list, sort) {
  const by = {
    deal: (a, b) => b.dealScore - a.dealScore,
    price_asc: (a, b) => a.rent - b.rent,
    price_desc: (a, b) => b.rent - a.rent,
    ppsf_asc: (a, b) => ppsf(a.rent, a.sqft) - ppsf(b.rent, b.sqft),
    savings: (a, b) => (b.monthlySavings ?? -1e9) - (a.monthlySavings ?? -1e9),
  };
  return [...list].sort(by[sort] || by.deal);
}

function marketSummary(list) {
  if (!list.length) return null;
  const med = median(list.map((l) => ppsf(l.rent, l.sqft)));
  const medRent = median(list.map((l) => l.rent));
  const greatDeals = list.filter((l) => l.dealScore >= 80).length;
  const stat = (label, value) => el('div', {}, [
    el('div', { class: 'text-xs uppercase tracking-wide text-slate-400' }, label),
    el('div', { class: 'text-lg font-bold text-slate-900' }, value),
  ]);
  return el('div', { class: 'grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4' }, [
    stat('Listings', num(list.length)),
    stat('Median rent', money(medRent)),
    stat('Median $/sqft', med ? '$' + med.toFixed(2) : '—'),
    stat('Great deals', `${greatDeals}`),
  ]);
}

export async function homePage(root, ctx) {
  const all = scoreAll(await getListings());
  let state = stateFromQuery(ctx.query);

  function render() {
    const derived = deriveOptions(all, state);
    const filtered = sortListings(applyFilters(all, state), state.sort);

    const onChange = (next) => {
      state = next;
      // Push to URL so views are shareable; re-render in place.
      history.replaceState(null, '', stateToHash(state));
      render();
    };

    const grid = filtered.length
      ? el('div', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' }, filtered.map(listingCard))
      : el('div', { class: 'rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500' },
        'No listings match these filters. Try widening your search.');

    const page = el('div', { class: 'mx-auto max-w-6xl px-4 py-6' }, [
      el('div', { class: 'mb-5' }, [
        el('h1', { class: 'text-2xl font-extrabold tracking-tight text-slate-900' }, 'Find the best-value apartments in New York'),
        el('p', { class: 'text-sm text-slate-500' },
          'Every listing is scored against comparable units nearby — sorted best deal first.'),
      ]),
      filterBar(state, derived, onChange),
      el('div', { class: 'my-4' }, [marketSummary(filtered)]),
      el('div', { class: 'mb-2 text-sm text-slate-500' }, `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`),
      grid,
    ]);
    mount(root, page);
  }

  render();
}
