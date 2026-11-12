/* DealScore — bundled build. Source: ./assets/js/ */
(function(){
'use strict';
/* ===== assets/js/util/format.js ===== */
// Formatting helpers — money, numbers, and the small bits of text the UI repeats.

function money(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function moneySigned(n) {
  if (n == null || isNaN(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
}

function ppsf(rent, sqft) {
  if (!rent || !sqft) return null;
  return rent / sqft;
}

function ppsfText(rent, sqft) {
  const v = ppsf(rent, sqft);
  return v == null ? '—' : '$' + v.toFixed(2) + '/sqft';
}

function beds(n) {
  if (n === 0) return 'Studio';
  return n + ' bd';
}

function bedsLong(n) {
  if (n === 0) return 'Studio';
  return n + ' bed' + (n === 1 ? '' : 's');
}

function num(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US');
}

function pct(n) {
  if (n == null || isNaN(n)) return '—';
  return Math.round(n) + '%';
}

// Title-case a slug like "north-loop" -> "North Loop".
function titleize(slug) {
  return String(slug)
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* ===== assets/js/util/stats.js ===== */
// Tiny statistics helpers used by the scoring engine.

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function mean(arr) {
  const a = arr.filter((x) => x != null && !isNaN(x));
  if (!a.length) return null;
  return a.reduce((s, x) => s + x, 0) / a.length;
}

function median(arr) {
  const a = arr.filter((x) => x != null && !isNaN(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

// Min/max with a sane fallback when the array is empty or flat.
function range(arr) {
  const a = arr.filter((x) => x != null && !isNaN(x));
  if (!a.length) return { min: 0, max: 0 };
  return { min: Math.min(...a), max: Math.max(...a) };
}

// Map a value from [inLo, inHi] onto [outLo, outHi], clamped to the output range.
function remap(v, inLo, inHi, outLo, outHi) {
  if (inHi === inLo) return (outLo + outHi) / 2;
  const t = (v - inLo) / (inHi - inLo);
  return clamp(outLo + t * (outHi - outLo), Math.min(outLo, outHi), Math.max(outLo, outHi));
}

/* ===== assets/js/util/dom.js ===== */
// Minimal DOM helpers — a hyperscript-ish `el()` plus a couple of conveniences.
// Keeps the components readable without pulling in a framework.

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'value') node.value = v;
    else node.setAttribute(k, v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return node;
}

function mount(root, node) {
  root.innerHTML = '';
  root.appendChild(node);
}

function frag(children) {
  const f = document.createDocumentFragment();
  for (const c of children) {
    if (c == null || c === false) continue;
    f.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return f;
}

/* ===== assets/js/util/router.js ===== */
// A tiny hash router. Routes look like "#/", "#/listing/:id", "#/add".
// Each route is matched in registration order; the first match wins.

const routes = [];
let notFound = null;

function route(pattern, handler) {
  // Compile "#/listing/:id" into a regex with named groups.
  const parts = pattern.replace(/^#?\/?/, '').split('/').filter(Boolean);
  const keys = [];
  const rx = parts.map((p) => {
    if (p.startsWith(':')) {
      keys.push(p.slice(1));
      return '([^/]+)';
    }
    return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  const regex = new RegExp('^' + (rx.length ? rx.join('/') : '') + '$');
  routes.push({ regex, keys });
  routes[routes.length - 1].handler = handler;
}

function setNotFound(handler) {
  notFound = handler;
}

function current() {
  return (location.hash || '#/').replace(/^#\/?/, '');
}

function parseQuery() {
  const q = {};
  const i = current().indexOf('?');
  if (i === -1) return q;
  const sp = new URLSearchParams(current().slice(i + 1));
  for (const [k, v] of sp.entries()) q[k] = v;
  return q;
}

function dispatch() {
  const raw = current();
  const path = raw.split('?')[0];
  const query = parseQuery();
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.keys.forEach((k, idx) => (params[k] = decodeURIComponent(m[idx + 1])));
      window.scrollTo(0, 0);
      return r.handler({ params, query });
    }
  }
  if (notFound) notFound();
}

function navigate(hash) {
  if (location.hash === hash) dispatch();
  else location.hash = hash;
}

function startRouter() {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}

/* ===== assets/js/util/storage.js ===== */
// LocalStorage-backed store for listings the user adds in the browser before
// they're committed to the seed file or wired to a live backend.

const KEY = 'dealscore.userListings.v1';

function loadUserListings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveUserListings(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function addUserListing(listing) {
  const list = loadUserListings();
  list.push(listing);
  saveUserListings(list);
  return list;
}

function removeUserListing(id) {
  const list = loadUserListings().filter((l) => l.id !== id);
  saveUserListings(list);
  return list;
}

function clearUserListings() {
  localStorage.removeItem(KEY);
}

/* ===== assets/js/data/amenities.js ===== */
// Amenity catalog. Each amenity carries a `weight` reflecting how much renters
// value it (loosely calibrated to rent-premium research — laundry, parking,
// outdoor space, and central air tend to move rent the most). The scoring
// engine sums these weights to produce an amenity richness score.
//
// `key` is what listings store in their `amenities` array.

const AMENITIES = [
  // High-impact (renters pay a real premium)
  { key: 'in_unit_laundry', label: 'In-unit washer/dryer', icon: '🌀', weight: 10, group: 'Laundry' },
  { key: 'parking', label: 'Dedicated parking', icon: '🅿️', weight: 8, group: 'Building' },
  { key: 'central_ac', label: 'Central A/C', icon: '❄️', weight: 7, group: 'Comfort' },
  { key: 'dishwasher', label: 'Dishwasher', icon: '🍽️', weight: 6, group: 'Kitchen' },
  { key: 'outdoor_space', label: 'Balcony / patio', icon: '🌿', weight: 6, group: 'Comfort' },
  { key: 'pet_friendly', label: 'Pet friendly', icon: '🐾', weight: 6, group: 'Policy' },

  // Mid-impact
  { key: 'gym', label: 'Fitness center', icon: '🏋️', weight: 5, group: 'Building' },
  { key: 'stainless_appliances', label: 'Stainless appliances', icon: '✨', weight: 4, group: 'Kitchen' },
  { key: 'hardwood', label: 'Hardwood floors', icon: '🪵', weight: 4, group: 'Interior' },
  { key: 'elevator', label: 'Elevator', icon: '🛗', weight: 4, group: 'Building' },
  { key: 'pool', label: 'Pool', icon: '🏊', weight: 4, group: 'Building' },
  { key: 'in_building_laundry', label: 'In-building laundry', icon: '🧺', weight: 3, group: 'Laundry' },

  // Nice-to-have
  { key: 'doorman', label: 'Doorman / concierge', icon: '🛎️', weight: 3, group: 'Building' },
  { key: 'rooftop', label: 'Rooftop / common deck', icon: '🏙️', weight: 3, group: 'Building' },
  { key: 'walk_in_closet', label: 'Walk-in closet', icon: '🚪', weight: 2, group: 'Interior' },
  { key: 'high_ceilings', label: 'High ceilings', icon: '📐', weight: 2, group: 'Interior' },
  { key: 'storage', label: 'Storage unit', icon: '📦', weight: 2, group: 'Building' },
  { key: 'ev_charging', label: 'EV charging', icon: '🔌', weight: 2, group: 'Building' },
];

const BY_KEY = Object.fromEntries(AMENITIES.map((a) => [a.key, a]));

function amenity(key) {
  return BY_KEY[key] || { key, label: key, icon: '•', weight: 1, group: 'Other' };
}

// Total weight of an amenity list — the raw amenity richness of a unit.
function amenityWeight(keys = []) {
  return keys.reduce((s, k) => s + (BY_KEY[k] ? BY_KEY[k].weight : 0), 0);
}

// Sum of all possible amenity weights — used to normalize.
const MAX_AMENITY_WEIGHT = AMENITIES.reduce((s, a) => s + a.weight, 0);

/* ===== assets/js/data/listings.js ===== */
// Seed listings — realistic example data so the Deal Score engine has enough
// comparable units to score against. Replace/extend these with your real
// listings (edit this file, use the in-app "Add Listing" form to export JSON,
// or wire a live backend via data/adapter.js).
//
// Listing shape:
//   id            unique string
//   title         short headline
//   address       street line (display only)
//   city          display name      citySlug   url-safe key
//   neighborhood  display name      neighborhoodSlug
//   rent          monthly rent, USD
//   sqft          interior square feet
//   beds          0 = studio
//   baths         number (1.5 allowed)
//   yearBuilt     integer
//   renovated     boolean — recent renovation
//   available     ISO date string
//   petPolicy     'friendly' | 'cats' | 'none'
//   utilitiesIncluded  array of strings (e.g. ['heat','water'])
//   concession    free-text incentive (e.g. '1 month free') or ''
//   amenities     array of amenity keys (see data/amenities.js)
//   accent        tailwind-ish hue used for the card placeholder
//   url           optional external listing URL

const SEED_LISTINGS = [
  // ---------------------------- CHICAGO ----------------------------
  {
    id: 'chi-logan-001', title: 'Sunny Logan Square 1BR', address: '2418 N Sawyer Ave',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Logan Square', neighborhoodSlug: 'logan-square',
    rent: 1750, sqft: 720, beds: 1, baths: 1, yearBuilt: 1924, renovated: true,
    available: '2026-07-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'water'], concession: '',
    amenities: ['in_unit_laundry', 'dishwasher', 'hardwood', 'central_ac', 'pet_friendly'], accent: 'rose',
  },
  {
    id: 'chi-logan-002', title: 'Renovated Greystone 1BR', address: '2731 N Kedzie Ave',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Logan Square', neighborhoodSlug: 'logan-square',
    rent: 1995, sqft: 700, beds: 1, baths: 1, yearBuilt: 1915, renovated: true,
    available: '2026-06-15', petPolicy: 'none', utilitiesIncluded: [], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'amber',
  },
  {
    id: 'chi-logan-003', title: 'Cozy Vintage Studio', address: '2200 N California Ave',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Logan Square', neighborhoodSlug: 'logan-square',
    rent: 1295, sqft: 480, beds: 0, baths: 1, yearBuilt: 1928, renovated: false,
    available: '2026-07-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'water', 'gas'], concession: '',
    amenities: ['hardwood', 'in_building_laundry', 'high_ceilings'], accent: 'sky',
  },
  {
    id: 'chi-logan-004', title: 'New-Build 2BR w/ Parking', address: '2900 W Fullerton Ave',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Logan Square', neighborhoodSlug: 'logan-square',
    rent: 2850, sqft: 1050, beds: 2, baths: 2, yearBuilt: 2021, renovated: false,
    available: '2026-08-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['in_unit_laundry', 'parking', 'central_ac', 'dishwasher', 'stainless_appliances', 'elevator', 'gym', 'outdoor_space'], accent: 'emerald',
  },
  {
    id: 'chi-westloop-001', title: 'West Loop High-Rise 1BR', address: '1000 W Washington Blvd',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'West Loop', neighborhoodSlug: 'west-loop',
    rent: 2650, sqft: 760, beds: 1, baths: 1, yearBuilt: 2019, renovated: false,
    available: '2026-06-20', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'gym', 'pool', 'doorman', 'rooftop', 'elevator', 'parking'], accent: 'indigo',
  },
  {
    id: 'chi-westloop-002', title: 'Loft-Style 2BR', address: '900 W Randolph St',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'West Loop', neighborhoodSlug: 'west-loop',
    rent: 3650, sqft: 1180, beds: 2, baths: 2, yearBuilt: 2008, renovated: true,
    available: '2026-07-15', petPolicy: 'cats', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'hardwood', 'high_ceilings', 'gym', 'elevator', 'storage'], accent: 'violet',
  },
  {
    id: 'chi-westloop-003', title: 'Compact Downtown Studio', address: '111 S Peoria St',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'West Loop', neighborhoodSlug: 'west-loop',
    rent: 1875, sqft: 520, beds: 0, baths: 1, yearBuilt: 2017, renovated: false,
    available: '2026-06-10', petPolicy: 'friendly', utilitiesIncluded: ['water'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'gym', 'elevator', 'rooftop'], accent: 'teal',
  },
  {
    id: 'chi-rogers-001', title: 'Lakeside Rogers Park 1BR', address: '1334 W Morse Ave',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Rogers Park', neighborhoodSlug: 'rogers-park',
    rent: 1295, sqft: 750, beds: 1, baths: 1, yearBuilt: 1962, renovated: false,
    available: '2026-07-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'water', 'gas'], concession: '',
    amenities: ['hardwood', 'in_building_laundry', 'storage'], accent: 'cyan',
  },
  {
    id: 'chi-rogers-002', title: 'Spacious 2BR Near Red Line', address: '6900 N Sheridan Rd',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Rogers Park', neighborhoodSlug: 'rogers-park',
    rent: 1850, sqft: 1100, beds: 2, baths: 1, yearBuilt: 1958, renovated: true,
    available: '2026-08-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'in_building_laundry', 'storage', 'pet_friendly'], accent: 'lime',
  },
  {
    id: 'chi-rogers-003', title: 'Budget Studio by the Lake', address: '7400 N Greenview Ave',
    city: 'Chicago', citySlug: 'chicago', neighborhood: 'Rogers Park', neighborhoodSlug: 'rogers-park',
    rent: 995, sqft: 450, beds: 0, baths: 1, yearBuilt: 1955, renovated: false,
    available: '2026-06-15', petPolicy: 'none', utilitiesIncluded: ['heat', 'water', 'gas'], concession: '',
    amenities: ['in_building_laundry'], accent: 'stone',
  },

  // ---------------------------- AUSTIN -----------------------------
  {
    id: 'atx-east-001', title: 'East Austin Modern 1BR', address: '1100 E 6th St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'East Austin', neighborhoodSlug: 'east-austin',
    rent: 1695, sqft: 700, beds: 1, baths: 1, yearBuilt: 2018, renovated: false,
    available: '2026-07-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '6 weeks free',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'gym', 'pool', 'outdoor_space', 'parking'], accent: 'orange',
  },
  {
    id: 'atx-east-002', title: 'Bungalow-Style 1BR', address: '2207 E Cesar Chavez St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'East Austin', neighborhoodSlug: 'east-austin',
    rent: 1850, sqft: 640, beds: 1, baths: 1, yearBuilt: 1995, renovated: true,
    available: '2026-06-20', petPolicy: 'cats', utilitiesIncluded: ['water'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'hardwood', 'outdoor_space'], accent: 'amber',
  },
  {
    id: 'atx-east-003', title: 'Industrial 2BR Loft', address: '1900 E 12th St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'East Austin', neighborhoodSlug: 'east-austin',
    rent: 2750, sqft: 1150, beds: 2, baths: 2, yearBuilt: 2020, renovated: false,
    available: '2026-08-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'high_ceilings', 'gym', 'pool', 'parking', 'ev_charging', 'rooftop'], accent: 'rose',
  },
  {
    id: 'atx-east-004', title: 'Tiny Efficient Studio', address: '2500 E 5th St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'East Austin', neighborhoodSlug: 'east-austin',
    rent: 1295, sqft: 430, beds: 0, baths: 1, yearBuilt: 2016, renovated: false,
    available: '2026-06-15', petPolicy: 'friendly', utilitiesIncluded: ['water', 'trash'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'pool'], accent: 'teal',
  },
  {
    id: 'atx-dt-001', title: 'Downtown Tower 1BR', address: '300 Bowie St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'Downtown', neighborhoodSlug: 'downtown',
    rent: 2450, sqft: 720, beds: 1, baths: 1, yearBuilt: 2015, renovated: false,
    available: '2026-07-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'gym', 'pool', 'doorman', 'rooftop', 'elevator', 'parking', 'ev_charging'], accent: 'indigo',
  },
  {
    id: 'atx-dt-002', title: 'High-Floor Studio w/ Views', address: '360 Nueces St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'Downtown', neighborhoodSlug: 'downtown',
    rent: 1995, sqft: 540, beds: 0, baths: 1, yearBuilt: 2014, renovated: false,
    available: '2026-06-25', petPolicy: 'cats', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'gym', 'pool', 'rooftop', 'elevator', 'doorman'], accent: 'sky',
  },
  {
    id: 'atx-dt-003', title: 'Luxury 2BR Corner Unit', address: '70 Rainey St',
    city: 'Austin', citySlug: 'austin', neighborhood: 'Downtown', neighborhoodSlug: 'downtown',
    rent: 4100, sqft: 1240, beds: 2, baths: 2, yearBuilt: 2019, renovated: false,
    available: '2026-08-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'walk_in_closet', 'gym', 'pool', 'doorman', 'rooftop', 'elevator', 'parking', 'ev_charging', 'storage'], accent: 'violet',
  },
  {
    id: 'atx-mueller-001', title: 'Mueller Family 2BR', address: '4500 Mueller Blvd',
    city: 'Austin', citySlug: 'austin', neighborhood: 'Mueller', neighborhoodSlug: 'mueller',
    rent: 2350, sqft: 1080, beds: 2, baths: 2, yearBuilt: 2017, renovated: false,
    available: '2026-07-10', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'gym', 'pool', 'parking', 'outdoor_space', 'walk_in_closet'], accent: 'emerald',
  },
  {
    id: 'atx-mueller-002', title: 'Garden-Level 1BR', address: '1900 Simond Ave',
    city: 'Austin', citySlug: 'austin', neighborhood: 'Mueller', neighborhoodSlug: 'mueller',
    rent: 1575, sqft: 680, beds: 1, baths: 1, yearBuilt: 2016, renovated: false,
    available: '2026-06-15', petPolicy: 'cats', utilitiesIncluded: ['water', 'trash'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'gym', 'pool', 'parking'], accent: 'lime',
  },

  // ---------------------------- DENVER -----------------------------
  {
    id: 'den-rino-001', title: 'RiNo Artist Loft 1BR', address: '3300 Walnut St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'RiNo', neighborhoodSlug: 'rino',
    rent: 1895, sqft: 760, beds: 1, baths: 1, yearBuilt: 2019, renovated: false,
    available: '2026-07-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'high_ceilings', 'gym', 'rooftop', 'elevator', 'parking', 'ev_charging'], accent: 'orange',
  },
  {
    id: 'den-rino-002', title: 'Warehouse-Conversion 2BR', address: '2800 Larimer St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'RiNo', neighborhoodSlug: 'rino',
    rent: 2950, sqft: 1200, beds: 2, baths: 2, yearBuilt: 2007, renovated: true,
    available: '2026-08-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'hardwood', 'high_ceilings', 'gym', 'rooftop', 'parking', 'storage'], accent: 'rose',
  },
  {
    id: 'den-rino-003', title: 'Micro Studio', address: '3500 Brighton Blvd',
    city: 'Denver', citySlug: 'denver', neighborhood: 'RiNo', neighborhoodSlug: 'rino',
    rent: 1395, sqft: 440, beds: 0, baths: 1, yearBuilt: 2020, renovated: false,
    available: '2026-06-15', petPolicy: 'cats', utilitiesIncluded: ['water', 'trash'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'gym', 'rooftop', 'elevator'], accent: 'teal',
  },
  {
    id: 'den-caphill-001', title: 'Historic Cap Hill 1BR', address: '1200 Pennsylvania St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'Capitol Hill', neighborhoodSlug: 'capitol-hill',
    rent: 1295, sqft: 700, beds: 1, baths: 1, yearBuilt: 1929, renovated: false,
    available: '2026-07-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry', 'high_ceilings', 'storage'], accent: 'amber',
  },
  {
    id: 'den-caphill-002', title: 'Updated 1BR w/ Laundry', address: '900 Logan St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'Capitol Hill', neighborhoodSlug: 'capitol-hill',
    rent: 1595, sqft: 680, beds: 1, baths: 1, yearBuilt: 1965, renovated: true,
    available: '2026-06-20', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'water'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'hardwood', 'pet_friendly'], accent: 'sky',
  },
  {
    id: 'den-caphill-003', title: 'Affordable Vintage Studio', address: '1400 Pearl St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'Capitol Hill', neighborhoodSlug: 'capitol-hill',
    rent: 1050, sqft: 460, beds: 0, baths: 1, yearBuilt: 1948, renovated: false,
    available: '2026-06-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'water', 'gas'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'stone',
  },
  {
    id: 'den-highlands-001', title: 'Highlands 2BR Townhome', address: '3200 Tejon St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'Highlands', neighborhoodSlug: 'highlands',
    rent: 3100, sqft: 1300, beds: 2, baths: 2, yearBuilt: 2018, renovated: false,
    available: '2026-08-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'hardwood', 'walk_in_closet', 'outdoor_space', 'parking', 'storage', 'high_ceilings'], accent: 'emerald',
  },
  {
    id: 'den-highlands-002', title: 'Bright Highlands 1BR', address: '2900 Zuni St',
    city: 'Denver', citySlug: 'denver', neighborhood: 'Highlands', neighborhoodSlug: 'highlands',
    rent: 1750, sqft: 720, beds: 1, baths: 1, yearBuilt: 2015, renovated: false,
    available: '2026-07-05', petPolicy: 'friendly', utilitiesIncluded: ['water'], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'gym', 'parking', 'outdoor_space'], accent: 'lime',
  },
];

/* ===== assets/js/data/adapter.js ===== */
// Data adapter — the ONE place the app reads listings from.
//
// Today it merges the bundled seed file with any listings you've added in the
// browser (stored in localStorage). To go live with a real backend, implement
// `fetchRemoteListings()` below (e.g. Supabase/Airtable/your API) and the rest
// of the app needs no changes — every page reads through `getListings()`.



// ---------------------------------------------------------------------------
// LIVE BACKEND HOOK (stub)
//
// Return a Promise resolving to an array of listings in the same shape as the
// objects in listings.js. Example with Supabase:
//
//   const res = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=*`, {
//     headers: { apikey: SUPABASE_ANON_KEY }
//   });
//   return res.json();
//
// Leave it returning null to stay in static/seed mode.
// ---------------------------------------------------------------------------
async function fetchRemoteListings() {
  return null;
}

let cache = null;

async function getListings({ force = false } = {}) {
  if (cache && !force) return cache;
  const remote = await fetchRemoteListings();
  const base = Array.isArray(remote) ? remote : SEED_LISTINGS;
  // User-added listings are tagged so the UI can show a "draft" badge.
  const user = loadUserListings().map((l) => ({ ...l, _source: 'user' }));
  cache = [...base.map((l) => ({ ...l, _source: l._source || 'seed' })), ...user];
  return cache;
}

function invalidate() {
  cache = null;
}

async function getListing(id) {
  const all = await getListings();
  return all.find((l) => l.id === id) || null;
}

/* ===== assets/js/core/score.js ===== */
// ===========================================================================
// DEAL SCORE ENGINE
// ===========================================================================
// A listing's Deal Score (0–100) answers one question: "How much apartment do
// you get for the price, compared to similar units nearby?"
//
// It is COMPARABLE-BASED — the industry-standard approach. We build a comp set
// of similar units (same city, same bedroom count, ideally same neighborhood)
// and score the listing against that set on five transparent components:
//
//   Price vs comps ($/sqft) ............ 50 pts   (the big one)
//   Amenity richness ................... 22 pts
//   In-unit laundry .................... 10 pts
//   Space (sqft vs comps) .............. 10 pts
//   Quality & extras (reno/utils/promo)   8 pts
//                                        ------
//                                        100 pts
//
// Every page reads scores through `scoreAll()`, and the detail page renders
// the per-component breakdown so the score is never a black box.




const WEIGHTS = { price: 50, amenities: 22, laundry: 10, space: 10, quality: 8 };
const MIN_COMPS = 3;

// Pick the tightest comp set with enough members for a stable comparison:
// neighborhood+beds  ->  city+beds  ->  city (any beds).
function buildCompSet(listing, all) {
  const sameCity = all.filter((l) => l.citySlug === listing.citySlug && l.sqft > 0 && l.rent > 0);

  const nbhd = sameCity.filter((l) => l.neighborhoodSlug === listing.neighborhoodSlug && l.beds === listing.beds);
  if (nbhd.length >= MIN_COMPS) {
    return { comps: nbhd, basis: `${listing.neighborhood} ${bedLabel(listing.beds)} units`, tightness: 'neighborhood' };
  }
  const cityBeds = sameCity.filter((l) => l.beds === listing.beds);
  if (cityBeds.length >= MIN_COMPS) {
    return { comps: cityBeds, basis: `${listing.city} ${bedLabel(listing.beds)} units`, tightness: 'city-beds' };
  }
  if (sameCity.length >= MIN_COMPS) {
    return { comps: sameCity, basis: `${listing.city} rentals (mixed sizes)`, tightness: 'city' };
  }
  return { comps: sameCity, basis: `${listing.city} rentals`, tightness: 'sparse' };
}

function bedLabel(n) {
  return n === 0 ? 'studio' : `${n}-bed`;
}

// --- individual component scorers ------------------------------------------

function scorePrice(listing, comps) {
  const lp = ppsf(listing.rent, listing.sqft);
  const compMedian = median(comps.map((c) => ppsf(c.rent, c.sqft)));
  if (!lp || !compMedian) return { points: WEIGHTS.price / 2, ratio: 1, compMedian, listingPpsf: lp };
  // ratio > 1 means cheaper per sqft than the typical comp.
  const ratio = compMedian / lp;
  // Centered so "exactly typical" (ratio 1.0) scores half marks; ±25% spans the range.
  const points = remap(ratio, 0.75, 1.25, 0, WEIGHTS.price);
  return { points, ratio, compMedian, listingPpsf: lp };
}

function scoreAmenities(listing, comps) {
  const w = amenityWeight(listing.amenities);
  const compWeights = comps.map((c) => amenityWeight(c.amenities));
  const { min, max } = range(compWeights);
  const points = remap(w, min, max, 0, WEIGHTS.amenities);
  return { points, weight: w, compMin: min, compMax: max };
}

function scoreLaundry(listing) {
  const a = listing.amenities || [];
  let points = 0;
  let note = 'No laundry on site';
  if (a.includes('in_unit_laundry')) {
    points = WEIGHTS.laundry;
    note = 'In-unit washer/dryer';
  } else if (a.includes('in_building_laundry')) {
    points = WEIGHTS.laundry * 0.5;
    note = 'Shared in-building laundry';
  }
  return { points, note };
}

function scoreSpace(listing, comps) {
  const { min, max } = range(comps.map((c) => c.sqft));
  const points = remap(listing.sqft, min, max, 0, WEIGHTS.space);
  return { points, sqft: listing.sqft, compMin: min, compMax: max };
}

function scoreQuality(listing) {
  let points = 0;
  const reasons = [];
  const age = new Date().getFullYear() - (listing.yearBuilt || 0);
  if (listing.renovated || age <= 8) {
    points += 3;
    reasons.push(listing.renovated ? 'Recently renovated' : 'Newer construction');
  }
  const utils = listing.utilitiesIncluded || [];
  if (utils.length) {
    points += Math.min(3, utils.length);
    reasons.push(`Includes ${utils.join(', ')}`);
  }
  if (listing.concession) {
    points += 2;
    reasons.push(listing.concession);
  }
  return { points: clamp(points, 0, WEIGHTS.quality), reasons };
}

// --- label / grade ----------------------------------------------------------

function grade(score) {
  if (score >= 80) return { label: 'Great Deal', tone: 'great' };
  if (score >= 65) return { label: 'Good Deal', tone: 'good' };
  if (score >= 50) return { label: 'Fair Price', tone: 'fair' };
  if (score >= 35) return { label: 'Below Average', tone: 'below' };
  return { label: 'Overpriced', tone: 'poor' };
}

// --- public API -------------------------------------------------------------

function scoreListing(listing, all) {
  const { comps, basis, tightness } = buildCompSet(listing, all);

  const price = scorePrice(listing, comps);
  const amenities = scoreAmenities(listing, comps);
  const laundry = scoreLaundry(listing);
  const space = scoreSpace(listing, comps);
  const quality = scoreQuality(listing);

  const total = clamp(
    price.points + amenities.points + laundry.points + space.points + quality.points,
    0,
    100,
  );

  // "Typical" rent for the comp set at this unit's size — the market anchor.
  const fairRent = price.compMedian ? price.compMedian * listing.sqft : null;
  const monthlySavings = fairRent != null ? fairRent - listing.rent : null;

  const breakdown = [
    {
      key: 'price', label: 'Price vs. comparable units', points: price.points, max: WEIGHTS.price,
      detail: price.listingPpsf && price.compMedian
        ? `$${price.listingPpsf.toFixed(2)}/sqft vs. $${price.compMedian.toFixed(2)}/sqft typical`
        : 'Not enough data',
    },
    {
      key: 'amenities', label: 'Amenities', points: amenities.points, max: WEIGHTS.amenities,
      detail: `${listing.amenities.length} amenities (richness ${amenities.weight} vs. ${amenities.compMin}–${amenities.compMax} locally)`,
    },
    { key: 'laundry', label: 'In-unit laundry', points: laundry.points, max: WEIGHTS.laundry, detail: laundry.note },
    {
      key: 'space', label: 'Space for the size class', points: space.points, max: WEIGHTS.space,
      detail: `${listing.sqft} sqft vs. ${space.compMin}–${space.compMax} sqft locally`,
    },
    {
      key: 'quality', label: 'Condition & extras', points: quality.points, max: WEIGHTS.quality,
      detail: quality.reasons.length ? quality.reasons.join(' · ') : 'No notable extras',
    },
  ];

  return {
    ...listing,
    dealScore: Math.round(total),
    grade: grade(total),
    fairRent: fairRent != null ? Math.round(fairRent) : null,
    monthlySavings: monthlySavings != null ? Math.round(monthlySavings) : null,
    compBasis: basis,
    compCount: comps.length,
    compTightness: tightness,
    breakdown,
  };
}

function scoreAll(all) {
  return all.map((l) => scoreListing(l, all));
}

/* ===== assets/js/components/scoreBadge.js ===== */
// The Deal Score badge — a colored chip showing the 0–100 score and its label.
// Tone maps to a Tailwind color scale shared across the app.


const TONE = {
  great: { ring: 'ring-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  good: { ring: 'ring-lime-300', bg: 'bg-lime-50', text: 'text-lime-700', dot: 'bg-lime-500' },
  fair: { ring: 'ring-amber-300', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  below: { ring: 'ring-orange-300', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  poor: { ring: 'ring-rose-300', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

function toneOf(g) {
  return TONE[g.tone] || TONE.fair;
}

// size: 'sm' | 'lg'
function scoreBadge(scored, size = 'sm') {
  const t = toneOf(scored.grade);
  if (size === 'lg') {
    return el('div', { class: `inline-flex items-center gap-3 rounded-2xl ring-1 ${t.ring} ${t.bg} px-4 py-3` }, [
      el('div', { class: `text-3xl font-extrabold ${t.text} tabular-nums` }, String(scored.dealScore)),
      el('div', {}, [
        el('div', { class: `text-sm font-semibold ${t.text}` }, scored.grade.label),
        el('div', { class: 'text-xs text-slate-500' }, 'Deal Score / 100'),
      ]),
    ]);
  }
  return el('div', { class: `inline-flex items-center gap-1.5 rounded-full ring-1 ${t.ring} ${t.bg} ${t.text} px-2.5 py-1 text-xs font-semibold` }, [
    el('span', { class: `inline-block h-1.5 w-1.5 rounded-full ${t.dot}` }),
    el('span', { class: 'tabular-nums' }, String(scored.dealScore)),
    el('span', {}, scored.grade.label),
  ]);
}

/* ===== assets/js/components/header.js ===== */
// Top navigation bar, rendered once into #app-header.


function link(href, label) {
  const active = (location.hash || '#/').split('?')[0] === href;
  return el('a', {
    href,
    class: 'px-3 py-2 rounded-lg text-sm font-medium ' +
      (active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'),
  }, label);
}

function renderHeader(root) {
  const bar = el('header', { class: 'sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur' }, [
    el('div', { class: 'mx-auto flex max-w-6xl items-center justify-between px-4 py-3' }, [
      el('a', { href: '#/', class: 'flex items-center gap-2' }, [
        el('span', { class: 'grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-white font-black' }, 'D'),
        el('span', { class: 'text-lg font-extrabold tracking-tight text-slate-900' }, 'DealScore'),
        el('span', { class: 'hidden sm:inline text-sm text-slate-400' }, 'Apartments'),
      ]),
      el('nav', { class: 'flex items-center gap-1' }, [
        link('#/', 'Browse'),
        link('#/methodology', 'How scoring works'),
        link('#/add', 'Add listing'),
      ]),
    ]),
  ]);
  root.innerHTML = '';
  root.appendChild(bar);
}

/* ===== assets/js/components/listingCard.js ===== */
// A single listing card for the browse grid.





const ACCENT = {
  rose: 'from-rose-200 to-rose-100', amber: 'from-amber-200 to-amber-100',
  sky: 'from-sky-200 to-sky-100', emerald: 'from-emerald-200 to-emerald-100',
  indigo: 'from-indigo-200 to-indigo-100', violet: 'from-violet-200 to-violet-100',
  teal: 'from-teal-200 to-teal-100', cyan: 'from-cyan-200 to-cyan-100',
  lime: 'from-lime-200 to-lime-100', orange: 'from-orange-200 to-orange-100',
  stone: 'from-stone-200 to-stone-100',
};

function listingCard(scored) {
  const accent = ACCENT[scored.accent] || ACCENT.sky;
  const topAmenities = (scored.amenities || []).slice(0, 4).map((k) => amenity(k));

  const savings = scored.monthlySavings;
  const savingsLine = savings != null && savings > 30
    ? el('div', { class: 'text-xs font-semibold text-emerald-600' }, `~${moneySigned(savings)}/mo below typical`)
    : savings != null && savings < -30
      ? el('div', { class: 'text-xs font-semibold text-rose-500' }, `~${moneySigned(savings)}/mo above typical`)
      : el('div', { class: 'text-xs text-slate-400' }, 'Around typical price');

  return el('a', {
    href: `#/listing/${scored.id}`,
    class: 'group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg hover:-translate-y-0.5',
  }, [
    el('div', { class: `relative h-36 bg-gradient-to-br ${accent}` }, [
      el('div', { class: 'absolute left-3 top-3' }, [scoreBadge(scored, 'sm')]),
      scored._source === 'user'
        ? el('div', { class: 'absolute right-3 top-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white' }, 'Draft')
        : null,
      el('div', { class: 'absolute bottom-3 left-3 text-sm font-semibold text-slate-700/70' }, scored.neighborhood),
    ]),
    el('div', { class: 'p-4' }, [
      el('div', { class: 'flex items-baseline justify-between gap-2' }, [
        el('div', { class: 'text-lg font-bold text-slate-900' }, money(scored.rent)),
        el('div', { class: 'text-xs text-slate-500' }, `${beds(scored.beds)} · ${scored.baths} ba · ${scored.sqft} sqft`),
      ]),
      savingsLine,
      el('div', { class: 'mt-1 truncate text-sm font-medium text-slate-700' }, scored.title),
      el('div', { class: 'truncate text-xs text-slate-400' }, `${scored.address} · ${scored.city}`),
      el('div', { class: 'mt-3 flex flex-wrap gap-1' }, [
        ...topAmenities.map((a) =>
          el('span', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600' }, `${a.icon} ${a.label}`)),
        scored.amenities.length > 4
          ? el('span', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500' }, `+${scored.amenities.length - 4}`)
          : null,
      ]),
      el('div', { class: 'mt-2 text-xs text-slate-400' }, ppsfText(scored.rent, scored.sqft)),
    ]),
  ]);
}

/* ===== assets/js/components/filters.js ===== */
// Filter + sort bar for the browse page. Pure UI: it reads the current filter
// state and calls onChange with a new state object. The page owns the state
// and the URL sync.



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

function filterBar(state, derived, onChange) {
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

/* ===== assets/js/pages/home.js ===== */
// Browse page — filter, sort, and the scored listing grid. This is where the
// Deal Score does its work: by default we sort best-deal-first.









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
    savings: (a, b) => (b.monthlySavings || -1e9) - (a.monthlySavings || -1e9),
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

async function homePage(root, ctx) {
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
        el('h1', { class: 'text-2xl font-extrabold tracking-tight text-slate-900' }, 'Find the best-value apartments'),
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

/* ===== assets/js/pages/listing.js ===== */
// Listing detail page — the full pitch for one unit, with a transparent
// breakdown of how its Deal Score was computed.








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

async function listingPage(root, ctx) {
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

/* ===== assets/js/pages/methodology.js ===== */
// Methodology page — explains the Deal Score so renters (and you) trust it.


const COMPONENTS = [
  ['Price vs. comparable units', 50, 'We compute the listing\'s rent per square foot and compare it to the median $/sqft of similar units nearby. Cheaper-per-square-foot than its peers scores higher — this is the single biggest factor, just like in professional rent-comp analysis.'],
  ['Amenity richness', 22, 'Each amenity carries a weight reflecting how much renters typically pay for it (laundry, parking, central A/C and outdoor space move rent the most). A unit\'s total amenity weight is compared to the local range.'],
  ['In-unit laundry', 10, 'Called out on its own because it\'s one of the most-requested features. In-unit washer/dryer earns full marks; shared in-building laundry earns half.'],
  ['Space for the size class', 10, 'Square footage compared to other units of the same bedroom count nearby — more room for the same money scores higher.'],
  ['Condition & extras', 8, 'Recent renovation or newer construction, included utilities, and move-in concessions each add points.'],
];

function row([label, max, desc]) {
  return el('div', { class: 'border-t border-slate-100 py-4' }, [
    el('div', { class: 'flex items-baseline justify-between' }, [
      el('div', { class: 'font-semibold text-slate-800' }, label),
      el('div', { class: 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-bold text-emerald-700' }, `${max} pts`),
    ]),
    el('p', { class: 'mt-1 text-sm text-slate-600' }, desc),
  ]);
}

function gradeChip(label, range, cls) {
  return el('div', { class: `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${cls}` }, [
    el('span', { class: 'font-semibold' }, label), el('span', { class: 'tabular-nums' }, range),
  ]);
}

function methodologyPage(root) {
  const page = el('div', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, 'How the Deal Score works'),
    el('p', { class: 'mt-2 text-slate-600' },
      'The Deal Score is a 0–100 rating of how much apartment you get for the price, ' +
      'compared to similar units in the same city and neighborhood. It\'s comparable-based — ' +
      'the same approach professional analysts use to price rentals — so it stays meaningful ' +
      'as you add more listings to each market.'),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'The five components (100 points)'),
      ...COMPONENTS.map(row),
    ]),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'mb-3 text-lg font-bold text-slate-900' }, 'How scores map to labels'),
      el('div', { class: 'grid grid-cols-1 gap-2 sm:grid-cols-2' }, [
        gradeChip('Great Deal', '80–100', 'bg-emerald-50 text-emerald-700'),
        gradeChip('Good Deal', '65–79', 'bg-lime-50 text-lime-700'),
        gradeChip('Fair Price', '50–64', 'bg-amber-50 text-amber-700'),
        gradeChip('Below Average', '35–49', 'bg-orange-50 text-orange-700'),
        gradeChip('Overpriced', '0–34', 'bg-rose-50 text-rose-700'),
      ]),
    ]),

    el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, [
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'The comp set'),
      el('p', { class: 'mt-1 text-sm text-slate-600' },
        'For each listing we build a comparison set, preferring the tightest match with enough ' +
        'data: same neighborhood + bedroom count, then same city + bedroom count, then the whole ' +
        'city. The detail page always shows which comp set was used and how many listings it ' +
        'contained, so the score is never a black box. The more real listings you add per market, ' +
        'the sharper the scores get.'),
    ]),
    el('p', { class: 'mt-6 text-xs text-slate-400' },
      'Weights are tunable in assets/js/core/score.js and assets/js/data/amenities.js.'),
  ]);
  mount(root, page);
}

/* ===== assets/js/pages/add.js ===== */
// Add Listing page — a no-backend way to start entering real listings. New
// listings are saved in your browser (localStorage) and immediately show up in
// Browse tagged "Draft". Use "Export JSON" to copy them into
// assets/js/data/listings.js (or to seed your live backend later).






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

function addPage(root) {
  function render(message) {
    const form = el('form', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2' }, [
      field('Title', input('title', { required: 'required', placeholder: 'Sunny Logan Square 1BR' })),
      field('Street address', input('address', { placeholder: '2418 N Sawyer Ave' })),
      field('City', input('city', { required: 'required', placeholder: 'Chicago' })),
      field('Neighborhood', input('neighborhood', { required: 'required', placeholder: 'Logan Square' })),
      field('Monthly rent ($)', input('rent', { type: 'number', required: 'required', min: '0', step: '25' })),
      field('Square feet', input('sqft', { type: 'number', required: 'required', min: '0', step: '10' })),
      field('Bedrooms (0 = studio)', input('beds', { type: 'number', required: 'required', min: '0', max: '6', value: '1' })),
      field('Bathrooms', input('baths', { type: 'number', required: 'required', min: '1', max: '6', step: '0.5', value: '1' })),
      field('Year built', input('yearBuilt', { type: 'number', min: '1850', max: '2030', placeholder: '2018' })),
      field('Available date', input('available', { type: 'date' })),
      field('Utilities included (comma-separated)', input('utilities', { placeholder: 'heat, water' })),
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
        accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
      };
      addUserListing(listing);
      invalidate();
      render(`Saved "${listing.title}" (${money(listing.rent)}/mo). It's now live in Browse.`);
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

/* ===== assets/js/main.js ===== */
// App bootstrap: wire the router to pages and keep the header in sync.








const headerRoot = document.getElementById('app-header');
const appRoot = document.getElementById('app');

function withChrome(fn) {
  return (ctx) => {
    renderHeader(headerRoot);
    return fn(appRoot, ctx);
  };
}

route('#/', withChrome(homePage));
route('#/listing/:id', withChrome(listingPage));
route('#/methodology', withChrome(() => methodologyPage(appRoot)));
route('#/add', withChrome(() => addPage(appRoot)));

setNotFound(() => {
  renderHeader(headerRoot);
  mount(appRoot, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
    el('p', { class: 'text-slate-500' }, 'Page not found.'),
    el('a', { href: '#/', class: 'mt-3 inline-block text-emerald-600 underline' }, 'Back to browse'),
  ]));
});

startRouter();

})();
