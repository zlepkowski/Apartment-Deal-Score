// Filter + sort bar for the browse page. Pure UI: it reads the current filter
// state and calls onChange with a new state object. The page owns the state
// and the URL sync.

import { el } from '../util/dom.js';
import { titleize } from '../util/format.js';

function select(label, value, options, onChange) {
  return el('label', { class: 'flex flex-col gap-1 text-xs font-medium text-slate-500' }, [
    label,
    el('select', {
      class: 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none',
      onChange: (e) => onChange(e.target.value),
    }, options.map((o) =>
      el('option', { value: o.value, ...(String(o.value) === String(value) ? { selected: 'selected' } : {}) }, o.label))),
  ]);
}

export function filterBar(state, derived, onChange) {
  const set = (patch) => onChange({ ...state, ...patch });

  const cityOpts = [{ value: '', label: 'All cities' },
    ...derived.cities.map((c) => ({ value: c.slug, label: c.name }))];

  const nbhdOpts = [{ value: '', label: 'All neighborhoods' },
    ...derived.neighborhoods.map((n) => ({ value: n.slug, label: n.name }))];

  const bedOpts = [
    { value: '', label: 'Any beds' }, { value: '0', label: 'Studio' },
    { value: '1', label: '1 bed' }, { value: '2', label: '2 beds' }, { value: '3', label: '3+ beds' },
  ];

  const sortOpts = [
    { value: 'deal', label: 'Best Deal Score' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'ppsf_asc', label: '$/sqft: low to high' },
    { value: 'savings', label: 'Biggest savings vs. typical' },
  ];

  return el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-4' }, [
    el('div', { class: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6' }, [
      select('City', state.city, cityOpts, (v) => set({ city: v, neighborhood: '' })),
      select('Neighborhood', state.neighborhood, nbhdOpts, (v) => set({ neighborhood: v })),
      select('Bedrooms', state.beds, bedOpts, (v) => set({ beds: v })),
      el('label', { class: 'flex flex-col gap-1 text-xs font-medium text-slate-500' }, [
        'Max rent',
        el('input', {
          type: 'number', value: state.maxRent || '', placeholder: 'Any', min: '0', step: '50',
          class: 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none',
          onInput: (e) => set({ maxRent: e.target.value }),
        }),
      ]),
      el('label', { class: 'flex flex-col gap-1 text-xs font-medium text-slate-500' }, [
        'Must have',
        el('label', { class: 'flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700' }, [
          el('input', {
            type: 'checkbox', ...(state.laundry ? { checked: 'checked' } : {}),
            onChange: (e) => set({ laundry: e.target.checked }),
          }),
          'In-unit laundry',
        ]),
      ]),
      select('Sort by', state.sort, sortOpts, (v) => set({ sort: v })),
    ]),
  ]);
}

export { titleize };
