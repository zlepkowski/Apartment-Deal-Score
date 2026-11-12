// Add Listing page — a no-backend way to start entering real listings. New
// listings are saved in your browser (localStorage) and immediately show up in
// Browse tagged "Draft". Use "Export JSON" to copy them into
// assets/js/data/listings.js (or to seed your live backend later).

import { el, mount } from '../util/dom.js';
import { AMENITIES } from '../data/amenities.js';
import { addUserListing, loadUserListings, removeUserListing, clearUserListings } from '../util/storage.js';
import { invalidate } from '../data/adapter.js';
import { money, httpUrl } from '../util/format.js';

function slug(s) {
  return String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const ACCENTS = ['rose', 'amber', 'sky', 'emerald', 'indigo', 'violet', 'teal', 'cyan', 'lime', 'orange', 'stone'];

function field(label, input) {
  return el('label', { class: 'flex flex-col gap-1' }, [
    el('span', { class: 'text-xs font-medium text-slate-500' }, label), input,
  ]);
}

function input(name, attrs = {}) {
  return el('input', {
    name,
    class: 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none',
    ...attrs,
  });
}

export function addPage(root) {
  function render(message) {
    const form = el('form', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2' }, [
      field('Title', input('title', { required: 'required', placeholder: 'Sunny Astoria 1BR' })),
      field('Street address', input('address', { placeholder: '30-14 31st St' })),
      field('Latitude (optional, for the map)', input('lat', { type: 'number', step: 'any', min: '-90', max: '90', placeholder: '40.7679' })),
      field('Longitude (optional, for the map)', input('lng', { type: 'number', step: 'any', min: '-180', max: '180', placeholder: '-73.9205' })),
      field('Borough / city', input('city', { required: 'required', placeholder: 'Queens' })),
      field('Neighborhood', input('neighborhood', { required: 'required', placeholder: 'Astoria' })),
      field('Monthly rent ($)', input('rent', { type: 'number', required: 'required', min: '0', step: '25' })),
      field('Square feet', input('sqft', { type: 'number', required: 'required', min: '0', step: '10' })),
      field('Bedrooms (0 = studio)', input('beds', { type: 'number', required: 'required', min: '0', max: '6', value: '1' })),
      field('Bathrooms', input('baths', { type: 'number', required: 'required', min: '1', max: '6', step: '0.5', value: '1' })),
      field('Year built', input('yearBuilt', { type: 'number', min: '1850', max: '2030', placeholder: '2018' })),
      field('Available date', input('available', { type: 'date' })),
      field('Utilities included (comma-separated)', input('utilities', { placeholder: 'heat, hot water' })),
      field('Move-in concession', input('concession', { placeholder: '1 month free' })),
      el('label', { class: 'flex items-center gap-2 text-sm text-slate-700' }, [
        el('input', { type: 'checkbox', name: 'renovated' }), 'Recently renovated',
      ]),
      field('Pet policy', el('select', {
        name: 'petPolicy',
        class: 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none',
      }, [
        el('option', { value: 'friendly' }, 'Pet friendly'),
        el('option', { value: 'cats' }, 'Cats only'),
        el('option', { value: 'none' }, 'No pets'),
      ])),
      el('label', { class: 'flex flex-col gap-1 sm:col-span-2' }, [
        el('span', { class: 'text-xs font-medium text-slate-500' }, 'Photo URLs (optional, one per line; the first is the cover)'),
        el('textarea', {
          name: 'images', rows: '3', placeholder: 'https://example.com/photos/living-room.jpg',
          class: 'rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 focus:border-emerald-500 focus:outline-none',
        }),
      ]),
      el('div', { class: 'sm:col-span-2' }, [
        el('span', { class: 'text-xs font-medium text-slate-500' }, 'Amenities'),
        el('div', { class: 'mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3' }, AMENITIES.map((a) =>
          el('label', { class: 'flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700' }, [
            el('input', { type: 'checkbox', name: 'amenity', value: a.key }),
            el('span', {}, `${a.icon} ${a.label}`),
          ]))),
      ]),
      el('div', { class: 'sm:col-span-2 flex items-center gap-3' }, [
        el('button', { type: 'submit', class: 'rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700' }, 'Save listing'),
        el('span', { class: 'text-xs text-slate-400' }, 'Saved in your browser — nothing leaves this device.'),
      ]),
    ]);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const city = fd.get('city');
      const nbhd = fd.get('neighborhood');
      const amenities = fd.getAll('amenity');
      const utils = String(fd.get('utilities') || '').split(',').map((s) => s.trim()).filter(Boolean);
      // Photo URLs: http(s) only, de-duplicated, capped at 12.
      const rawImages = String(fd.get('images') || '').split(/\s+/).filter(Boolean);
      const images = [...new Set(rawImages.map(httpUrl).filter(Boolean))].slice(0, 12);
      const skipped = rawImages.length - rawImages.map(httpUrl).filter(Boolean).length;
      const listing = {
        id: `user-${slug(city)}-${slug(nbhd)}-${Date.now().toString(36)}`,
        title: fd.get('title'), address: fd.get('address') || '',
        city, citySlug: slug(city), neighborhood: nbhd, neighborhoodSlug: slug(nbhd),
        rent: Number(fd.get('rent')), sqft: Number(fd.get('sqft')),
        beds: Number(fd.get('beds')), baths: Number(fd.get('baths')),
        yearBuilt: Number(fd.get('yearBuilt')) || new Date().getFullYear(),
        renovated: fd.get('renovated') === 'on',
        available: fd.get('available') || '',
        petPolicy: fd.get('petPolicy') || 'none',
        utilitiesIncluded: utils,
        concession: fd.get('concession') || '',
        amenities,
        images,
        accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
      };
      // Coordinates are optional; keep them only as a valid pair.
      const lat = parseFloat(fd.get('lat'));
      const lng = parseFloat(fd.get('lng'));
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        listing.lat = lat;
        listing.lng = lng;
      }
      addUserListing(listing);
      invalidate();
      render(`Saved "${listing.title}" (${money(listing.rent)}/mo). It's now live in Browse.` +
        (skipped ? ` Skipped ${skipped} photo link${skipped === 1 ? '' : 's'} that weren't http(s) URLs.` : ''));
    });

    const drafts = loadUserListings();
    const draftPanel = el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('div', { class: 'flex items-center justify-between' }, [
        el('h2', { class: 'text-lg font-bold text-slate-900' }, `Your draft listings (${drafts.length})`),
        drafts.length ? el('div', { class: 'flex gap-2' }, [
          el('button', {
            class: 'rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50',
            onClick: () => exportJson(drafts),
          }, 'Export JSON'),
          el('button', {
            class: 'rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50',
            onClick: () => { clearUserListings(); invalidate(); render('Cleared all drafts.'); },
          }, 'Clear all'),
        ]) : null,
      ]),
      drafts.length
        ? el('ul', { class: 'mt-3 divide-y divide-slate-100' }, drafts.map((d) =>
          el('li', { class: 'flex items-center justify-between py-2 text-sm' }, [
            el('span', { class: 'text-slate-700' }, `${d.title} — ${money(d.rent)}/mo · ${d.neighborhood}`),
            el('button', {
              class: 'text-xs text-rose-500 hover:underline',
              onClick: () => { removeUserListing(d.id); invalidate(); render('Removed.'); },
            }, 'Remove'),
          ])))
        : el('p', { class: 'mt-2 text-sm text-slate-500' }, 'No drafts yet. Add one above and it shows up in Browse instantly.'),
    ]);

    const page = el('div', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
      el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, 'Add a listing'),
      el('p', { class: 'mt-2 text-sm text-slate-600' },
        'Enter a real listing to see its Deal Score against everything else in its market. ' +
        'Listings are stored locally; export them as JSON to commit into the data file or load into a live backend.'),
      message ? el('div', { class: 'mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700' }, [
        message, ' ', el('a', { href: '#/', class: 'underline' }, 'Go to Browse →'),
      ]) : null,
      el('div', { class: 'mt-5 rounded-2xl border border-slate-200 bg-white p-5' }, [form]),
      el('div', { class: 'mt-6' }, [draftPanel]),
    ]);
    mount(root, page);
  }

  function exportJson(drafts) {
    const json = JSON.stringify(drafts, null, 2);
    const overlay = el('div', { class: 'fixed inset-0 z-50 grid place-items-center bg-black/40 p-4' }, [
      el('div', { class: 'w-full max-w-2xl rounded-2xl bg-white p-5' }, [
        el('div', { class: 'flex items-center justify-between' }, [
          el('h3', { class: 'text-lg font-bold text-slate-900' }, 'Export listings JSON'),
          el('button', { class: 'text-slate-400 hover:text-slate-700', onClick: () => overlay.remove() }, '✕'),
        ]),
        el('p', { class: 'mt-1 text-sm text-slate-600' }, 'Paste these objects into the SEED_LISTINGS array in assets/js/data/listings.js, or load them into your backend.'),
        el('textarea', { class: 'mt-3 h-64 w-full rounded-lg border border-slate-300 p-3 font-mono text-xs', readonly: 'readonly' }, json),
        el('button', {
          class: 'mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white',
          onClick: (e) => { navigator.clipboard?.writeText(json); e.target.textContent = 'Copied!'; },
        }, 'Copy to clipboard'),
      ]),
    ]);
    document.body.appendChild(overlay);
  }

  render(null);
}
