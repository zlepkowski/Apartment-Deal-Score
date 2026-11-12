// Add Listing page — enter an apartment you're considering. Listings are saved
// in this browser only (localStorage) and show up in Browse tagged "Draft".
// "Export JSON" copies them out (into assets/js/data/listings.js or a backend).
//
// Form layout follows docs/DESIGN_GUIDELINES.md: required fields first,
// optional details grouped and labelled, amenities chunked by category, and
// forgiving input ("$3,200/mo" is a rent; "40.76, -73.92" fills both
// coordinates).

import { el, mount } from '../util/dom.js';
import { AMENITIES } from '../data/amenities.js';
import { addUserListing, loadUserListings, removeUserListing, clearUserListings } from '../util/storage.js';
import { invalidate } from '../data/adapter.js';
import { MARKET } from '../data/market.js';
import { money, httpUrl } from '../util/format.js';
import { icon } from '../components/icons.js';

const AMENITY_GROUP_ORDER = ['Laundry', 'Kitchen', 'Comfort', 'Interior', 'Building', 'Policy'];

function addSlug(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// "$3,200/mo" → 3200; "" → NaN.
function parseAmount(v) {
  const digits = String(v || '').replace(/\.\d*$/, '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : NaN;
}

// "40.7679, -73.9205" or "40.7679 -73.9205" → [40.7679, -73.9205].
function parseCoordPair(v) {
  const m = String(v || '').match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function field(labelText, control, { hint, optional } = {}) {
  const hintId = hint ? `hint-${control.name}` : null;
  if (hintId) control.setAttribute('aria-describedby', hintId);
  return el('label', { class: 'flex flex-col gap-1' }, [
    el('span', { class: 'ds-label' }, [labelText, optional ? el('span', { class: 'font-normal text-slate-600' }, ' (optional)') : null]),
    control,
    hint ? el('span', { class: 'ds-hint', id: hintId }, hint) : null,
  ]);
}

function input(name, attrs = {}) {
  return el('input', { name, class: 'ds-field', ...attrs });
}

function fieldset(legend, children, note) {
  return el('fieldset', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2' }, [
    el('legend', { class: 'mb-3 text-base font-bold text-slate-900' }, [legend, note ? el('span', { class: 'ml-2 text-sm font-normal text-slate-600' }, note) : null]),
    ...children,
  ]);
}

// Suggest StreetEasy's own area names so listings match its benchmarks.
function marketDatalists() {
  const nbhds = MARKET.areas.filter((a) => a.type === 'neighborhood')
    .sort((a, b) => a.name.localeCompare(b.name));
  const boroughs = MARKET.areas.filter((a) => a.type === 'borough');
  return el('div', {}, [
    el('datalist', { id: 'se-neighborhoods' }, nbhds.map((a) => el('option', { value: a.name }, a.borough || ''))),
    el('datalist', { id: 'se-boroughs' }, boroughs.map((a) => el('option', { value: a.name }))),
  ]);
}

// Picking a StreetEasy neighborhood fills in its borough if that's still empty.
function fillBorough(nbhdInput) {
  const city = nbhdInput.form && nbhdInput.form.elements.city;
  if (!city || city.value) return;
  const matches = MARKET.areas.filter((a) => a.type === 'neighborhood' && a.name.toLowerCase() === nbhdInput.value.trim().toLowerCase());
  if (matches.length === 1 && matches[0].borough) city.value = matches[0].borough;
}

function amenityGroups() {
  const groups = AMENITY_GROUP_ORDER
    .map((g) => [g, AMENITIES.filter((a) => a.group === g)])
    .filter(([, items]) => items.length);
  return el('fieldset', {}, [
    el('legend', { class: 'mb-3 text-base font-bold text-slate-900' }, ['Amenities', el('span', { class: 'ml-2 text-sm font-normal text-slate-600' }, 'Check all that apply')]),
    el('div', { class: 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3' }, groups.map(([group, items]) =>
      el('div', { role: 'group', 'aria-label': group }, [
        el('p', { class: 'ds-label mb-1' }, group),
        ...items.map((a) => el('label', { class: 'flex min-h-[2rem] items-center gap-2 text-sm text-slate-800' }, [
          el('input', { type: 'checkbox', name: 'amenity', value: a.key }),
          a.label,
        ])),
      ]))),
  ]);
}

export function addPage(root) {
  let lastTrigger = null;

  function render(message) {
    const rentInput = input('rent', { required: 'required', inputmode: 'numeric', autocomplete: 'off', placeholder: '3200' });
    const latInput = input('lat', { inputmode: 'decimal', autocomplete: 'off', placeholder: '40.7679' });
    const lngInput = input('lng', { inputmode: 'decimal', autocomplete: 'off', placeholder: '-73.9205' });
    // Pasting "lat, lng" into either box fills both.
    for (const box of [latInput, lngInput]) {
      box.addEventListener('change', () => {
        const pair = parseCoordPair(box.value);
        if (pair) { latInput.value = String(pair[0]); lngInput.value = String(pair[1]); }
      });
    }
    rentInput.addEventListener('input', () => rentInput.setCustomValidity(''));

    const form = el('form', { class: 'flex flex-col gap-8' }, [
      fieldset('The apartment', [
        field('Title', input('title', { required: 'required', placeholder: 'Sunny Astoria 1BR' })),
        field('Monthly rent', rentInput, { hint: 'Dollars per month, e.g. 3200 or $3,200.' }),
        field('Neighborhood', input('neighborhood', {
          required: 'required', placeholder: 'Astoria', list: 'se-neighborhoods', autocomplete: 'off',
          onChange: (e) => fillBorough(e.target),
        }), { hint: 'Use StreetEasy\'s name; suggestions appear as you type.' }),
        field('Borough', input('city', { required: 'required', placeholder: 'Queens', list: 'se-boroughs', autocomplete: 'off' })),
        field('Bedrooms', el('select', { name: 'beds', class: 'ds-field' }, [
          el('option', { value: '0' }, 'Studio'),
          el('option', { value: '1', selected: 'selected' }, '1 bedroom'),
          el('option', { value: '2' }, '2 bedrooms'),
          el('option', { value: '3' }, '3 bedrooms'),
          el('option', { value: '4' }, '4 bedrooms'),
          el('option', { value: '5' }, '5+ bedrooms'),
        ])),
        field('Bathrooms', input('baths', { type: 'number', required: 'required', min: '1', max: '6', step: '0.5', value: '1', inputmode: 'decimal' })),
      ], 'Required'),

      fieldset('Details', [
        field('Square feet', input('sqft', { inputmode: 'numeric', autocomplete: 'off', placeholder: '700' }), { hint: 'Listed square footage earns a space bonus of up to 10 points.' }),
        field('Street address', input('address', { placeholder: '30-14 31st St', autocomplete: 'off' })),
        field('Year built', input('yearBuilt', { type: 'number', min: '1800', max: '2035', placeholder: '1931', inputmode: 'numeric' })),
        field('Available from', input('available', { type: 'date' })),
        field('Utilities included', input('utilities', { placeholder: 'heat, hot water' }), { hint: 'Separate with commas.' }),
        field('Move-in concession', input('concession', { placeholder: '1 month free' })),
        field('Pets', el('select', { name: 'petPolicy', class: 'ds-field' }, [
          el('option', { value: '' }, 'Not listed'),
          el('option', { value: 'none' }, 'No pets'),
          el('option', { value: 'cats' }, 'Cats only'),
          el('option', { value: 'friendly' }, 'Cats and dogs'),
        ])),
        el('label', { class: 'flex min-h-[2.5rem] items-center gap-2 self-end text-sm text-slate-800' }, [
          el('input', { type: 'checkbox', name: 'renovated' }), 'Recently renovated',
        ]),
      ], 'Optional'),

      amenityGroups(),

      el('details', { class: 'rounded-xl border border-slate-200 p-4' }, [
        el('summary', { class: 'cursor-pointer text-base font-bold text-slate-900' }, ['Photos and map location', el('span', { class: 'ml-2 text-sm font-normal text-slate-600' }, 'Optional')]),
        el('div', { class: 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2' }, [
          el('div', { class: 'sm:col-span-2' }, [
            field('Photo links', el('textarea', {
              name: 'images', rows: '3', placeholder: 'https://example.com/photos/living-room.jpg',
              class: 'ds-field font-mono text-xs',
            }), { hint: 'One https link per line; the first is the cover photo.' }),
          ]),
          field('Latitude', latInput, { hint: 'Paste "40.7679, -73.9205" into either box to fill both.' }),
          field('Longitude', lngInput),
        ]),
      ]),

      el('div', { class: 'flex flex-wrap items-center gap-3' }, [
        el('button', { type: 'submit', class: 'rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover' }, 'Save listing'),
        el('p', { class: 'text-sm text-slate-600' }, 'Saved only in this browser. Nothing is uploaded.'),
      ]),
    ]);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rent = parseAmount(rentInput.value);
      rentInput.setCustomValidity(rent > 0 ? '' : 'Enter the monthly rent, e.g. 3200.');
      if (!form.reportValidity()) return;

      const fd = new FormData(form);
      const city = String(fd.get('city')).trim();
      const nbhd = String(fd.get('neighborhood')).trim();
      const utils = String(fd.get('utilities') || '').split(',').map((s) => s.trim()).filter(Boolean);
      // Photo links: http(s) only, de-duplicated, capped at 12.
      const rawImages = String(fd.get('images') || '').split(/\s+/).filter(Boolean);
      const okImages = rawImages.map(httpUrl).filter(Boolean);
      const images = [...new Set(okImages)].slice(0, 12);
      const skipped = rawImages.length - okImages.length;
      const sqft = parseAmount(fd.get('sqft'));
      const listing = {
        id: `user-${addSlug(city)}-${addSlug(nbhd)}-${Date.now().toString(36)}`,
        title: String(fd.get('title')).trim(), address: String(fd.get('address') || '').trim(),
        city, citySlug: addSlug(city), neighborhood: nbhd, neighborhoodSlug: addSlug(nbhd),
        rent, sqft: sqft > 0 ? sqft : null,
        beds: Number(fd.get('beds')), baths: Number(fd.get('baths')),
        yearBuilt: Number(fd.get('yearBuilt')) || null,
        renovated: fd.get('renovated') === 'on',
        available: fd.get('available') || '',
        petPolicy: fd.get('petPolicy') || '',
        utilitiesIncluded: utils,
        concession: String(fd.get('concession') || '').trim(),
        amenities: fd.getAll('amenity'),
        images,
      };
      // Coordinates are optional; keep them only as a valid pair.
      const pair = parseCoordPair(`${fd.get('lat')}, ${fd.get('lng')}`);
      if (pair && Math.abs(pair[0]) <= 90 && Math.abs(pair[1]) <= 180) {
        listing.lat = pair[0];
        listing.lng = pair[1];
      }
      addUserListing(listing);
      invalidate();
      render(`Saved "${listing.title}" (${money(listing.rent)}/mo).` +
        (skipped ? ` Skipped ${skipped} photo link${skipped === 1 ? '' : 's'} that weren't http(s) links.` : ''));
    });

    const drafts = loadUserListings();
    const draftPanel = el('section', { class: 'rounded-2xl border border-slate-200 bg-white p-5', 'aria-labelledby': 'drafts-heading' }, [
      el('div', { class: 'flex flex-wrap items-center justify-between gap-3' }, [
        el('h2', { class: 'text-lg font-bold text-slate-900', id: 'drafts-heading' }, `Your listings (${drafts.length})`),
        drafts.length ? el('div', { class: 'flex gap-2' }, [
          el('button', {
            type: 'button',
            class: 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50',
            onClick: (e) => exportJson(drafts, e.currentTarget),
          }, 'Export JSON'),
        ]) : null,
      ]),
      drafts.length
        ? el('ul', { class: 'mt-3 divide-y divide-slate-100' }, drafts.map((d) =>
          el('li', { class: 'flex items-center justify-between gap-3 py-2 text-sm' }, [
            el('a', { href: `#/listing/${encodeURIComponent(d.id)}`, class: 'num text-slate-800 underline-offset-2 hover:underline' }, `${d.title} — ${money(d.rent)}/mo · ${d.neighborhood}`),
            el('button', {
              type: 'button',
              class: 'shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50',
              'aria-label': `Remove ${d.title}`,
              onClick: () => { removeUserListing(d.id); invalidate(); render(`Removed "${d.title}".`); },
            }, 'Remove'),
          ])))
        : el('p', { class: 'mt-2 text-sm text-slate-600' }, 'None yet. Saved listings appear here and in Browse.'),
      // Destructive action kept apart from the frequent ones, with a confirmation.
      drafts.length > 1
        ? el('div', { class: 'mt-4 border-t border-slate-100 pt-4' }, [
          el('button', {
            type: 'button',
            class: 'rounded-md px-2 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50',
            onClick: () => {
              if (!window.confirm(`Remove all ${drafts.length} listings from this browser? This can't be undone.`)) return;
              clearUserListings(); invalidate(); render('Removed all listings.');
            },
          }, `Remove all ${drafts.length} listings`),
        ])
        : null,
    ]);

    const status = message
      ? el('div', { class: 'ds-pulse mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800', role: 'status' }, [
        message, ' ', el('a', { href: '#/', class: 'underline' }, 'See it in Browse'),
      ])
      : null;

    const page = el('div', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
      el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, 'Add a listing'),
      el('p', { class: 'mt-2 max-w-prose text-sm text-slate-700' },
        'Enter an apartment you\'re considering. Its rent is compared with StreetEasy\'s median asking rent for the neighborhood and size, and it gets a Deal Score from 0 to 100.'),
      status,
      el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6' }, [form, marketDatalists()]),
      el('div', { class: 'mt-6' }, [draftPanel]),
    ]);
    mount(root, page);
  }

  // Native <dialog>: traps focus, closes with Esc, and focus returns to the
  // button that opened it.
  function exportJson(drafts, trigger) {
    lastTrigger = trigger;
    const json = JSON.stringify(drafts, null, 2);
    const copyStatus = el('p', { class: 'text-sm text-slate-700', role: 'status' });
    const dialog = el('dialog', { class: 'ds-dialog', 'aria-labelledby': 'export-title' }, [
      el('div', { class: 'p-5' }, [
        el('div', { class: 'flex items-center justify-between gap-3' }, [
          el('h2', { class: 'text-lg font-bold text-slate-900', id: 'export-title' }, 'Export listings as JSON'),
          el('button', {
            type: 'button', 'aria-label': 'Close',
            class: 'grid h-10 w-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100',
            onClick: () => dialog.close(),
          }, [icon('x', { size: 20 })]),
        ]),
        el('p', { class: 'mt-1 text-sm text-slate-700' }, 'Paste these objects into the SEED_LISTINGS array in assets/js/data/listings.js, or load them into a backend.'),
        el('textarea', { class: 'ds-field mt-3 h-64 font-mono text-xs', readonly: 'readonly', 'aria-label': 'Listings JSON' }, json),
        el('div', { class: 'mt-3 flex flex-wrap items-center gap-3' }, [
          el('button', {
            type: 'button',
            class: 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover',
            onClick: async () => {
              try {
                await navigator.clipboard.writeText(json);
                copyStatus.textContent = 'Copied to clipboard.';
                copyStatus.classList.remove('ds-pulse');
                void copyStatus.offsetWidth;
                copyStatus.classList.add('ds-pulse');
              } catch {
                copyStatus.textContent = 'Couldn\'t copy automatically. Select the text above and copy it.';
              }
            },
          }, 'Copy to clipboard'),
          copyStatus,
        ]),
      ]),
    ]);
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (lastTrigger && lastTrigger.isConnected) lastTrigger.focus();
    });
    document.body.appendChild(dialog);
    dialog.showModal();
  }

  render(null);
}
