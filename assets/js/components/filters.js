// Filter + sort bar for the browse page. Pure UI: it renders from the filter
// state and calls onChange with a PATCH of only the fields that changed. The
// page owns the state (and merges patches into its current copy) plus the URL
// sync — the bar isn't re-rendered on every change, so it must not hold state.

import { el } from '../util/dom.js';
import { titleize } from '../util/format.js';

function select(label, value, options, onChange) {
  return el('label', { class: 'ds-label flex flex-col gap-1' }, [
    label,
    el('select', {
      class: 'ds-field',
      onChange: (e) => onChange(e.target.value),
    }, options.map((o) =>
      el('option', { value: o.value, ...(String(o.value) === String(value) ? { selected: 'selected' } : {}) }, o.label))),
  ]);
}

export function filterBar(state, derived, onChange) {
  const set = (patch) => onChange(patch);

  const cityOpts = [{ value: '', label: 'All boroughs' },
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
      select('Borough', state.city, cityOpts, (v) => set({ city: v, neighborhood: '' })),
      select('Neighborhood', state.neighborhood, nbhdOpts, (v) => set({ neighborhood: v })),
      select('Bedrooms', state.beds, bedOpts, (v) => set({ beds: v })),
      el('label', { class: 'ds-label flex flex-col gap-1' }, [
        'Max rent',
        // Text input so "$3,000" or "3000/mo" works; only the digits are kept.
        el('input', {
          type: 'text', inputmode: 'numeric', autocomplete: 'off', value: state.maxRent || '', placeholder: 'Any',
          class: 'ds-field num',
          onInput: (e) => set({ maxRent: String(e.target.value).replace(/\.\d*$/, '').replace(/\D/g, '') }),
        }),
      ]),
      el('div', { class: 'flex flex-col gap-1' }, [
        el('span', { class: 'ds-label', id: 'filter-must-have' }, 'Must have'),
        el('label', { class: 'flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-[color:var(--border-control)] bg-white px-3 py-2 text-sm text-slate-800' }, [
          el('input', {
            type: 'checkbox', 'aria-describedby': 'filter-must-have', ...(state.laundry ? { checked: 'checked' } : {}),
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
