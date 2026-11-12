// Listings map — Leaflet + OpenStreetMap tiles, no API key.
//
// Leaflet is loaded as a global (`L`) by a CDN <script> in index.html. If it
// can't load (offline, blocked CDN) the map shows a short notice and the rest
// of the page keeps working.
//
// Pins are Deal Score pills colored by grade (styles in assets/css/styles.css).

import { el } from '../util/dom.js';
import { money, beds, photoUrls } from '../util/format.js';

// Swap the tile source here. OSM's standard tiles are fine for light traffic
// and require the attribution below; for a high-traffic site use a hosted tile
// provider (MapTiler, Stadia, Thunderforest, ...) per OSM's tile usage policy.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_VIEW = { center: [40.73, -73.95], zoom: 11 }; // New York City
const TONES = new Set(['great', 'good', 'fair', 'below', 'poor']);

export function hasLocation(l) {
  return Number.isFinite(l.lat) && Number.isFinite(l.lng);
}

// Maps whose container has left the page (route change) are torn down the
// next time a map is created, so Leaflet's window listeners don't pile up.
const live = new Set();
function reapDetached() {
  for (const m of live) {
    if (!m.getContainer().isConnected) {
      m.remove();
      live.delete(m);
    }
  }
}

function pinIcon(s, { active, muted }) {
  const tone = TONES.has(s.grade && s.grade.tone) ? s.grade.tone : 'fair';
  const cls = ['ds-pin', `ds-pin--${tone}`, active ? 'ds-pin--active' : '', muted ? 'ds-pin--muted' : ''].join(' ');
  return window.L.divIcon({
    className: 'ds-pin-wrap',
    html: `<span class="${cls}">${Math.round(Number(s.dealScore) || 0)}</span>`,
    iconSize: [36, 24],
    iconAnchor: [18, 12],
    popupAnchor: [0, -12],
  });
}

function popup(s) {
  const cover = photoUrls(s)[0];
  return el('a', { href: `#/listing/${encodeURIComponent(s.id)}`, class: 'ds-popup block w-52' }, [
    cover ? el('img', {
      src: cover, alt: '', loading: 'lazy', class: 'mb-2 h-24 w-full rounded-md object-cover',
      onError: (e) => e.target.remove(),
    }) : null,
    el('div', { class: 'text-sm font-bold text-slate-900' }, `${money(s.rent)}/mo · ${beds(s.beds)}`),
    el('div', { class: 'truncate text-xs text-slate-800' }, s.title),
    el('div', { class: 'text-xs text-slate-600' }, `${s.neighborhood} · Deal Score ${s.dealScore} · ${s.grade.label}`),
  ]);
}

// Returns { node, setListings(listings, { focusId }) }. Put `node` in the page,
// then call setListings whenever the visible listings change; the map keeps its
// tiles and only swaps pins. With focusId, that listing is centered and
// highlighted and the rest are muted.
export function listingsMap({ heightClass = 'h-[28rem]' } = {}) {
  const node = el('div', {
    class: `ds-map relative z-0 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${heightClass}`,
    role: 'region',
    'aria-label': 'Map of listings',
  });
  let map = null;
  let pins = null;
  let latest = null;
  let scheduled = false;

  function unavailable() {
    node.innerHTML = '';
    node.appendChild(el('div', { class: 'grid h-full place-items-center p-6 text-center text-sm text-slate-500' },
      'Map unavailable: the map library could not be loaded.'));
  }

  function draw() {
    scheduled = false;
    if (!node.isConnected) return; // page changed before we got here
    if (!map) {
      reapDetached();
      map = window.L.map(node, { scrollWheelZoom: false });
      window.L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
      pins = window.L.layerGroup().addTo(map);
      live.add(map);
    }
    const { listings, focusId } = latest;
    pins.clearLayers();
    const located = listings.filter(hasLocation);
    for (const s of located) {
      const active = s.id === focusId;
      const muted = !!focusId && !active;
      window.L.marker([s.lat, s.lng], {
        icon: pinIcon(s, { active, muted }),
        title: `${s.title} — Deal Score ${s.dealScore}`,
        // Higher scores draw on top, so the best deals stay visible where pins overlap.
        zIndexOffset: active ? 5000 : Math.round(s.dealScore || 0) * 10 - (muted ? 2000 : 0),
        riseOnHover: true,
      }).bindPopup(() => popup(s)).addTo(pins);
    }

    const focus = focusId && located.find((s) => s.id === focusId);
    if (focus) map.setView([focus.lat, focus.lng], 15);
    else if (located.length) {
      map.fitBounds(window.L.latLngBounds(located.map((s) => [s.lat, s.lng])), { padding: [32, 32], maxZoom: 15 });
    } else map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
  }

  function setListings(listings, { focusId = null } = {}) {
    latest = { listings, focusId };
    if (!window.L) return unavailable();
    // Leaflet measures its container, so wait until the node is in the page.
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(draw);
    }
  }

  return { node, setListings };
}
