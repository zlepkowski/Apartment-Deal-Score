// Browse page — filter, sort, and the scored listing grid (or map). This is
// where the Deal Score does its work: by default we sort best-deal-first.
//
// The filter bar and the results are rendered separately: changing a filter
// only re-renders the results, so a text field keeps focus while you type and
// the map keeps its tiles while the pins update.

import { el, mount } from '../util/dom.js';
import { money, num, ppsf } from '../util/format.js';
import { median } from '../util/stats.js';
import { getListings } from '../data/adapter.js';
import { scoreAll, monthLabel } from '../core/score.js';
import { MARKET } from '../data/market.js';
import { filterBar } from '../components/filters.js';
import { listingCard } from '../components/listingCard.js';
import { listingsMap, hasLocation } from '../components/map.js';

function stateFromQuery(q) {
  return {
    city: q.city || '', neighborhood: q.neighborhood || '', beds: q.beds || '',
    maxRent: q.maxRent || '', laundry: q.laundry === '1', sort: q.sort || 'deal',
    view: q.view === 'map' ? 'map' : 'grid',
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
  if (s.view === 'map') p.set('view', 'map');
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
    // Listings without square footage sort last.
    ppsf_asc: (a, b) => (ppsf(a.rent, a.sqft) ?? Infinity) - (ppsf(b.rent, b.sqft) ?? Infinity),
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

function viewToggle(view, onChange) {
  const btn = (value, label) => el('button', {
    type: 'button',
    'aria-pressed': String(view === value),
    class: 'rounded-md px-3 py-1.5 text-sm font-medium ' +
      (view === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'),
    onClick: () => onChange(value),
  }, label);
  return el('div', { class: 'inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1', role: 'group', 'aria-label': 'View' }, [
    btn('grid', 'Grid'), btn('map', 'Map'),
  ]);
}

export async function homePage(root, ctx) {
  const all = scoreAll(await getListings());
  let state = stateFromQuery(ctx.query);
  let map = null; // created when the map view opens, reused while it stays open

  const filtersSlot = el('div');
  const summarySlot = el('div', { class: 'my-4' });
  const toolbarSlot = el('div', { class: 'mb-3 flex items-center justify-between gap-3' });
  const mapSlot = el('div');
  const gridSlot = el('div');

  function update(next) {
    const cityChanged = next.city !== state.city;
    state = next;
    // Keep the URL shareable without triggering a route change.
    history.replaceState(null, '', stateToHash(state));
    if (cityChanged) renderFilters(); // neighborhood options depend on the borough
    renderResults();
  }

  function renderFilters() {
    mount(filtersSlot, filterBar(state, deriveOptions(all, state), (patch) => update({ ...state, ...patch })));
  }

  function renderResults() {
    const filtered = sortListings(applyFilters(all, state), state.sort);

    const summary = marketSummary(filtered);
    if (summary) mount(summarySlot, summary);
    else summarySlot.innerHTML = '';

    const unmapped = filtered.filter((l) => !hasLocation(l)).length;
    mount(toolbarSlot, el('div', { class: 'flex w-full items-center justify-between gap-3' }, [
      el('div', { class: 'text-sm text-slate-500' }, [
        `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`,
        state.view === 'map' && unmapped
          ? el('span', { class: 'text-slate-400' }, ` · ${unmapped} without a location not shown on the map`)
          : null,
      ]),
      viewToggle(state.view, (view) => update({ ...state, view })),
    ]));

    if (state.view === 'map') {
      if (!map) map = listingsMap({ heightClass: 'h-[26rem] sm:h-[32rem]' });
      if (!mapSlot.firstChild) mount(mapSlot, el('div', { class: 'mb-4' }, [map.node]));
      map.setListings(filtered);
    } else {
      // Drop the map; a fresh one is built if the user switches back.
      mapSlot.innerHTML = '';
      map = null;
    }

    mount(gridSlot, filtered.length
      ? el('div', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' }, filtered.map(listingCard))
      : all.length
        ? el('div', { class: 'rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500' },
          'No listings match these filters. Try widening your search.')
        : el('div', { class: 'rounded-2xl border border-dashed border-slate-300 p-10 text-center' }, [
          el('p', { class: 'font-semibold text-slate-700' }, 'No listings yet'),
          el('p', { class: 'mt-1 text-sm text-slate-500' },
            'Add an apartment you\'re considering to see its Deal Score against StreetEasy\'s market data.'),
          el('a', { href: '#/add', class: 'mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700' }, 'Add a listing'),
        ]));
  }

  mount(root, el('div', { class: 'mx-auto max-w-6xl px-4 py-6' }, [
    el('div', { class: 'mb-5' }, [
      el('h1', { class: 'text-2xl font-extrabold tracking-tight text-slate-900' }, 'Find the best-value apartments in New York'),
      el('p', { class: 'text-sm text-slate-500' },
        'Every listing is scored against StreetEasy\'s median asking rent for its neighborhood and size — sorted best deal first.'),
      el('p', { class: 'mt-1 text-xs text-slate-400' }, MARKET.asOf
        ? [`Market data: `, el('a', { href: MARKET.sourceUrl, target: '_blank', rel: 'noopener', class: 'underline hover:text-slate-600' }, 'StreetEasy'), `, ${monthLabel(MARKET.asOf)}.`]
        : 'StreetEasy market data hasn\'t been imported yet, so prices aren\'t benchmarked.'),
    ]),
    filtersSlot,
    summarySlot,
    toolbarSlot,
    mapSlot,
    gridSlot,
  ]));
  renderFilters();
  renderResults();
}
