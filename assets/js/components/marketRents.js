// "NYC rents by neighborhood": StreetEasy's median asking rents, browsable by
// size and borough, searchable and sortable. Figures from fewer than
// MIN_LISTINGS listings are hidden by default — the same rule the Deal Score
// uses — and can be shown, flagged, on request.
//
// Controls are built once and updated in place, so the search box keeps focus
// while you type; only the table re-renders.

import { el, mount } from '../util/dom.js';
import { money, num } from '../util/format.js';
import { MARKET } from '../data/market.js';
import { MIN_LISTINGS, monthLabel } from '../core/score.js';

const MARKET_SIZES = [[0, 'Studio'], [1, '1 bed'], [2, '2 beds'], [3, '3+ beds']];
const MARKET_SIZE_NOUN = { 0: 'studio', 1: '1-bedroom', 2: '2-bedroom', 3: '3+ bedroom' };
const MARKET_SORTS = [['listings', 'Most listings'], ['cheapest', 'Lowest rent'], ['priciest', 'Highest rent'], ['name', 'Name A–Z']];
const MARKET_PAGE = 25;

export function marketStateFromQuery(q) {
  const size = Number(q.rsize);
  return {
    size: [0, 1, 2, 3].includes(size) && q.rsize !== '' && q.rsize != null ? size : 1,
    borough: q.rboro || '',
    q: q.rq || '',
    sort: MARKET_SORTS.some(([v]) => v === q.rsort) ? q.rsort : 'listings',
    thin: q.rthin === '1',
  };
}

export function marketStateToParams(s, params) {
  if (s.size !== 1) params.set('rsize', String(s.size));
  if (s.borough) params.set('rboro', s.borough);
  if (s.q) params.set('rq', s.q);
  if (s.sort !== 'listings') params.set('rsort', s.sort);
  if (s.thin) params.set('rthin', '1');
}

function pct(v) {
  if (v == null) return '—';
  const r = Math.round(v * 100);
  return r === 0 ? '±0%' : `${r > 0 ? '+' : '−'}${Math.abs(r)}%`;
}

export function marketRents(initial, onChange) {
  let state = { ...initial };
  let expanded = false;
  const city = MARKET.areas.find((a) => a.type === 'city');
  const boroughs = MARKET.areas.filter((a) => a.type === 'borough');
  const nbhds = MARKET.areas.filter((a) => a.type === 'neighborhood');
  const boroughByName = new Map(boroughs.map((b) => [b.name, b]));

  function set(patch) {
    state = { ...state, ...patch };
    expanded = false;
    onChange(state);
    sync();
  }

  // --- controls (built once) ---
  const sizeButtons = MARKET_SIZES.map(([value, label]) => el('button', {
    type: 'button',
    class: 'rounded px-3 py-1.5 text-sm font-medium',
    onClick: () => set({ size: value }),
  }, label));

  const boroughButtons = [{ name: '', label: 'All NYC', area: city }, ...boroughs.map((b) => ({ name: b.name, label: b.name, area: b }))]
    .map((b) => {
      const figure = el('span', { class: 'num block text-base font-bold' });
      const button = el('button', {
        type: 'button',
        class: 'min-w-[7.5rem] rounded-xl border px-3 py-2 text-left',
        onClick: () => set({ borough: b.name }),
      }, [el('span', { class: 'block text-xs font-medium' }, b.label), figure]);
      return { ...b, button, figure };
    });

  const search = el('input', {
    type: 'search', class: 'ds-field', placeholder: 'e.g. Astoria', value: state.q, autocomplete: 'off',
    onInput: (e) => set({ q: e.target.value.trim() }),
  });
  const sortSelect = el('select', { class: 'ds-field', onChange: (e) => set({ sort: e.target.value }) },
    MARKET_SORTS.map(([v, label]) => el('option', { value: v, ...(v === state.sort ? { selected: 'selected' } : {}) }, label)));
  const thinBox = el('input', {
    type: 'checkbox', ...(state.thin ? { checked: 'checked' } : {}),
    onChange: (e) => set({ thin: e.target.checked }),
  });

  const status = el('p', { class: 'num text-sm text-slate-600', role: 'status' });
  const tableSlot = el('div');

  function sync() {
    sizeButtons.forEach((btn, i) => {
      const on = MARKET_SIZES[i][0] === state.size;
      btn.setAttribute('aria-pressed', String(on));
      btn.className = `rounded px-3 py-1.5 text-sm font-medium ${on ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;
    });
    for (const b of boroughButtons) {
      const on = b.name === state.borough;
      b.button.setAttribute('aria-pressed', String(on));
      b.button.className = `min-w-[7.5rem] rounded-xl border px-3 py-2 text-left ${on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'}`;
      const rent = b.area && b.area.rents[state.size];
      b.figure.textContent = rent ? money(rent) : '—';
    }
    renderTable();
  }

  function rows() {
    const b = state.size;
    const q = state.q.toLowerCase();
    const all = nbhds
      .filter((a) => (!state.borough || a.borough === state.borough) && (!q || a.name.toLowerCase().includes(q)))
      .map((a) => {
        const rent = a.rents[b] || null;
        const listings = a.counts ? a.counts[b] ?? null : null;
        const boroRent = boroughByName.get(a.borough)?.rents[b] || null;
        return {
          area: a, rent, listings,
          thin: listings != null && listings < MIN_LISTINGS,
          vs: rent && boroRent ? rent / boroRent - 1 : null,
        };
      });
    const withFigure = all.filter((r) => r.rent);
    const shown = withFigure.filter((r) => state.thin || !r.thin);
    const by = {
      listings: (x, y) => (y.listings ?? -1) - (x.listings ?? -1) || x.area.name.localeCompare(y.area.name),
      cheapest: (x, y) => x.rent - y.rent,
      priciest: (x, y) => y.rent - x.rent,
      name: (x, y) => x.area.name.localeCompare(y.area.name),
    };
    shown.sort(by[state.sort] || by.listings);
    return { shown, hiddenThin: withFigure.length - shown.length, noFigure: all.length - withFigure.length, matched: all.length };
  }

  function addHref(r) {
    const p = new URLSearchParams({ neighborhood: r.area.name, borough: r.area.borough, beds: String(state.size) });
    return `#/add?${p.toString()}`;
  }

  function renderTable() {
    const { shown, hiddenThin, noFigure, matched } = rows();
    const visible = expanded ? shown : shown.slice(0, MARKET_PAGE);
    const noun = MARKET_SIZE_NOUN[state.size];

    const notes = [];
    if (noFigure) notes.push(`${noFigure} ${noFigure === 1 ? 'has' : 'have'} no ${noun} figure`);
    if (hiddenThin) notes.push(`${hiddenThin} hidden for having fewer than ${MIN_LISTINGS} listings`);
    status.textContent = matched
      ? `Showing ${visible.length} of ${shown.length} neighborhood${shown.length === 1 ? '' : 's'}${notes.length ? ` · ${notes.join(' · ')}` : ''}`
      : '';

    if (!shown.length) {
      mount(tableSlot, el('p', { class: 'rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600' },
        state.q ? `No neighborhoods match "${state.q}"${state.borough ? ` in ${state.borough}` : ''}.` : `No ${noun} figures to show.`));
      return;
    }

    const th = (text, cls = '') => el('th', { scope: 'col', class: `px-4 py-2 font-semibold text-slate-900 ${cls}` }, text);
    const table = el('div', { class: 'overflow-x-auto rounded-2xl border border-slate-200 bg-white' }, [
      el('table', { class: 'w-full text-sm' }, [
        el('caption', { class: 'sr-only' }, `StreetEasy median asking rent for ${noun} apartments by neighborhood, ${monthLabel(MARKET.asOf)}`),
        el('thead', { class: 'border-b border-slate-200' }, el('tr', {}, [
          th('Neighborhood', 'text-left'),
          th('Median rent', 'text-right'),
          th('vs. borough', 'hidden text-right sm:table-cell'),
          th('Listings', 'hidden text-right sm:table-cell'),
        ])),
        el('tbody', {}, visible.map((r) => el('tr', { class: 'border-t border-slate-100 align-top' }, [
          el('th', { scope: 'row', class: 'px-4 py-3 text-left font-normal' }, [
            el('span', { class: 'block font-semibold text-slate-900' }, r.area.name),
            el('span', { class: 'block text-xs text-slate-600' }, [
              r.area.borough, ' · ',
              el('a', { href: addHref(r), class: 'inline-block py-0.5 text-accent underline hover:text-accent-hover' }, 'Score an apartment here'),
            ]),
          ]),
          el('td', { class: 'num px-4 py-3 text-right' }, [
            el('span', { class: `font-semibold ${r.thin ? 'text-slate-600' : 'text-slate-900'}` }, money(r.rent)),
            r.thin ? el('span', { class: 'block text-xs text-slate-600' }, `only ${r.listings} listing${r.listings === 1 ? '' : 's'}`) : null,
            // Phone layout: the hidden columns' facts, under the rent.
            el('span', { class: 'block text-xs text-slate-600 sm:hidden' }, [
              r.listings != null && !r.thin ? `${num(r.listings)} listings` : '',
              r.vs != null ? `${r.listings != null && !r.thin ? ' · ' : ''}${pct(r.vs)} vs. ${r.area.borough}` : '',
            ].join('')),
          ]),
          el('td', { class: 'num hidden px-4 py-3 text-right text-slate-700 sm:table-cell' }, r.vs != null ? pct(r.vs) : '—'),
          el('td', { class: 'num hidden px-4 py-3 text-right text-slate-700 sm:table-cell' }, r.listings != null ? num(r.listings) : '—'),
        ]))),
      ]),
    ]);

    mount(tableSlot, el('div', {}, [
      table,
      shown.length > visible.length
        ? el('button', {
          type: 'button',
          class: 'mt-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50',
          onClick: () => { expanded = true; renderTable(); },
        }, `Show all ${shown.length} neighborhoods`)
        : null,
    ]));
  }

  const node = el('section', { class: 'mt-10', 'aria-labelledby': 'rents-heading' }, [
    el('h2', { class: 'text-xl font-bold text-slate-900', id: 'rents-heading' }, 'NYC rents by neighborhood'),
    el('p', { class: 'mt-1 max-w-prose text-sm text-slate-700' }, [
      'StreetEasy\'s median asking rent for ', el('a', { href: MARKET.sourceUrl, target: '_blank', rel: 'noopener', class: 'underline hover:text-slate-900' }, MARKET.asOf ? monthLabel(MARKET.asOf) : 'the latest month'),
      `. These are the figures each apartment's price is compared with. Neighborhoods with fewer than ${MIN_LISTINGS} listings at a size use their borough's figure instead.`,
    ]),
    el('div', { class: 'mt-4 flex flex-wrap items-center gap-3' }, [
      el('div', { class: 'inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1', role: 'group', 'aria-label': 'Apartment size' }, sizeButtons),
    ]),
    el('div', { class: 'mt-3 flex gap-2 overflow-x-auto pb-1', role: 'group', 'aria-label': 'Borough' }, boroughButtons.map((b) => b.button)),
    el('div', { class: 'mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3' }, [
      el('label', { class: 'ds-label flex flex-col gap-1' }, ['Search neighborhoods', search]),
      el('label', { class: 'ds-label flex flex-col gap-1' }, ['Sort by', sortSelect]),
      el('label', { class: 'flex min-h-[2.5rem] items-center gap-2 self-end text-sm text-slate-800' }, [
        thinBox, `Include figures from fewer than ${MIN_LISTINGS} listings`,
      ]),
    ]),
    el('div', { class: 'mt-4 mb-2' }, [status]),
    tableSlot,
  ]);

  sync();
  return node;
}
