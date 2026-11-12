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

// Returns the URL if it's an absolute http(s) URL, else null. Use for any
// user- or backend-supplied link/image so `javascript:` and friends never
// reach an href or src.
function httpUrl(u) {
  try {
    const parsed = new URL(String(u));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

// A listing's usable photo URLs (http/https only), in order. The first one is
// the cover.
function photoUrls(listing) {
  return (Array.isArray(listing.images) ? listing.images : []).map(httpUrl).filter(Boolean);
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

// Re-run the current route (e.g. "Try again" after an error).
function refresh() {
  dispatch();
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

const USER_LISTINGS_KEY = 'dealscore.userListings.v1';

function loadUserListings() {
  try {
    const raw = localStorage.getItem(USER_LISTINGS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveUserListings(list) {
  localStorage.setItem(USER_LISTINGS_KEY, JSON.stringify(list));
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
  localStorage.removeItem(USER_LISTINGS_KEY);
}

/* ===== assets/js/data/amenities.js ===== */
// Amenity catalog. Each amenity carries a hand-set `weight`: how much it adds
// to the amenity score. In-unit laundry, parking, central A/C, dishwashers and
// outdoor space weigh the most. The weights are a judgment call, not fitted to
// rent data; tune them here.
//
// `key` is what listings store in their `amenities` array; `group` organizes
// the add-listing form.

const AMENITIES = [
  // High-impact (renters pay a real premium)
  { key: 'in_unit_laundry', label: 'In-unit washer/dryer', weight: 10, group: 'Laundry' },
  { key: 'parking', label: 'Dedicated parking', weight: 8, group: 'Building' },
  { key: 'central_ac', label: 'Central A/C', weight: 7, group: 'Comfort' },
  { key: 'dishwasher', label: 'Dishwasher', weight: 6, group: 'Kitchen' },
  { key: 'outdoor_space', label: 'Balcony / patio', weight: 6, group: 'Comfort' },
  { key: 'pet_friendly', label: 'Pet friendly', weight: 6, group: 'Policy' },

  // Mid-impact
  { key: 'gym', label: 'Fitness center', weight: 5, group: 'Building' },
  { key: 'stainless_appliances', label: 'Stainless appliances', weight: 4, group: 'Kitchen' },
  { key: 'hardwood', label: 'Hardwood floors', weight: 4, group: 'Interior' },
  { key: 'elevator', label: 'Elevator', weight: 4, group: 'Building' },
  { key: 'pool', label: 'Pool', weight: 4, group: 'Building' },
  { key: 'in_building_laundry', label: 'In-building laundry', weight: 3, group: 'Laundry' },

  // Nice-to-have
  { key: 'doorman', label: 'Doorman / concierge', weight: 3, group: 'Building' },
  { key: 'rooftop', label: 'Rooftop / common deck', weight: 3, group: 'Building' },
  { key: 'walk_in_closet', label: 'Walk-in closet', weight: 2, group: 'Interior' },
  { key: 'high_ceilings', label: 'High ceilings', weight: 2, group: 'Interior' },
  { key: 'storage', label: 'Storage unit', weight: 2, group: 'Building' },
  { key: 'ev_charging', label: 'EV charging', weight: 2, group: 'Building' },
];

const BY_KEY = Object.fromEntries(AMENITIES.map((a) => [a.key, a]));

function amenity(key) {
  return BY_KEY[key] || { key, label: key, weight: 1, group: 'Other' };
}

// Total weight of an amenity list — the raw amenity richness of a unit.
function amenityWeight(keys = []) {
  return keys.reduce((s, k) => s + (BY_KEY[k] ? BY_KEY[k].weight : 0), 0);
}

// Sum of all possible amenity weights — used to normalize.
const MAX_AMENITY_WEIGHT = AMENITIES.reduce((s, a) => s + a.weight, 0);

/* ===== assets/js/data/listings.js ===== */
// Bundled listings. Empty on purpose: the illustrative example units were
// removed so the site only shows real listings. Add listings with the in-app
// "Add listing" form (saved in your browser), paste exported JSON objects into
// SEED_LISTINGS below, or wire a live source via data/adapter.js.
//
// Listings are priced against StreetEasy's median asking rents (data/market.js),
// so `neighborhood` should use StreetEasy's neighborhood name where possible
// (the add form suggests them) and `city` the borough.
//
// Listing shape:
//   id            unique string
//   title         short headline
//   address       street line (display only)
//   city          borough display name ('Queens')    citySlug   url-safe key ('queens')
//   neighborhood  display name ('Astoria')            neighborhoodSlug ('astoria')
//   lat, lng      optional coordinates (decimal degrees) — needed for the map
//   rent          monthly rent, USD
//   sqft          optional interior square feet — earns the space bonus when listed
//   beds          0 = studio
//   baths         number (1.5 allowed)
//   yearBuilt     integer
//   renovated     boolean — recent renovation
//   available     ISO date string
//   petPolicy     'friendly' | 'cats' | 'none' | '' (not listed)
//   utilitiesIncluded  array of strings (e.g. ['heat','hot water'])
//   concession    free-text incentive (e.g. '1 month free') or ''
//   amenities     array of amenity keys (see data/amenities.js)
//   images        optional array of photo URLs (first one is the cover)
//   url           optional external listing URL

const SEED_LISTINGS = [];

/* ===== assets/js/data/market.js ===== */
// StreetEasy market benchmarks.
//
// GENERATED by scripts/import-streeteasy.mjs from the CSVs in data/streeteasy/.
// Don't edit by hand: download fresh CSVs from StreetEasy's Data Dashboard,
// re-run the import, then `node build.mjs`.
//
// Shape:
//   asOf     'YYYY-MM' — the month the figures describe (null = nothing imported yet)
//   areas[]  { slug, name, type, borough, parent, rents }
//     type     'neighborhood' | 'submarket' | 'borough' | 'city'
//     borough  borough name for neighborhoods/submarkets/boroughs ('Queens'), null for the city
//     parent   slug of the next-larger area, or null
//     rents    median asking rent by bedroom class — keys 0 (studio), 1, 2, 3 (3+).
//              A key is missing when StreetEasy publishes no figure for it.

const MARKET = {
  source: 'StreetEasy',
  sourceUrl: 'https://streeteasy.com/blog/data-dashboard',
  metric: 'median asking rent',
  asOf: null,
  areas: [],
};

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
// A listing's Deal Score (0–100) answers one question: "How good a deal is this
// apartment compared with what similar NYC apartments are renting for?"
//
// The price benchmark is StreetEasy's published median asking rent for the
// listing's neighborhood and bedroom count (see data/market.js). Everything
// else is scored from the listing itself:
//
//   Price vs. StreetEasy median ........ 60 pts   (the big one)
//   Amenity richness ................... 22 pts
//   In-unit laundry .................... 10 pts
//   Condition & extras ..................  8 pts
//                                        ------
//                                        100 pts
//   Space bonus ........................ +10 pts  (only when square footage is
//                                                  listed; total capped at 100)
//
// Every page reads scores through `scoreAll()` / `scoreListing()`, and the
// detail page renders the per-component breakdown so the score is never a
// black box.




const WEIGHTS = { price: 60, amenities: 22, laundry: 10, quality: 8 };
const SPACE_BONUS_MAX = 10;

// Amenity richness that earns full marks. A doorman building with in-unit
// laundry, A/C, gym and outdoor space lands around here.
const AMENITY_FULL_MARKS = 45;

// Typical NYC apartment size by bedroom count, used only for the space bonus.
// NOT StreetEasy data (StreetEasy doesn't publish sizes): rounded from
// RentCafe's NYC listing averages —
// https://www.rentcafe.com/average-rent-market-trends/us/ny/new-york-city/
const TYPICAL_SQFT = { 0: 480, 1: 700, 2: 960, 3: 1240 };

// Common ways people name a neighborhood → the StreetEasy Data Dashboard area
// it's published under. Only unambiguous mappings: anything else falls back
// to the borough figure, and the listing page says so.
const AREA_ALIASES = {
  'bed-stuy': 'bedford-stuyvesant',
  lic: 'long-island-city',
  fidi: 'financial-district',
  uws: 'upper-west-side',
  ues: 'upper-east-side',
  les: 'lower-east-side',
  plg: 'prospect-lefferts-gardens',
  harlem: 'central-harlem',
  'spanish-harlem': 'east-harlem',
  'el-barrio': 'east-harlem',
  'hells-kitchen': 'midtown-west',
  clinton: 'midtown-west',
  'stuy-town': 'stuyvesant-town-pcv',
  'stuyvesant-town': 'stuyvesant-town-pcv',
  'peter-cooper-village': 'stuyvesant-town-pcv',
  'greenwood-heights': 'greenwood',
  'columbia-street-waterfront-district': 'columbia-st-waterfront-district',
};
const BOROUGH_ALIASES = { 'the-bronx': 'bronx' };

const CONFIDENCE_BY_LEVEL = { neighborhood: 'high', submarket: 'medium', borough: 'low', city: 'low' };

function bedLabel(n) {
  return n === 0 ? 'studio' : n >= 3 ? '3+ bed' : `${n}-bed`;
}

// StreetEasy groups 3+ bedrooms together.
function bedClass(beds) {
  return Math.max(0, Math.min(3, Math.round(Number(beds) || 0)));
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- StreetEasy benchmark lookup ------------------------------------------------

const indexCache = new WeakMap();
function indexOf(market) {
  let idx = indexCache.get(market);
  if (!idx) {
    idx = { bySlug: new Map(), neighborhoods: new Map(), boroughs: new Map(), city: null };
    for (const a of market.areas || []) {
      idx.bySlug.set(a.slug, a);
      if (a.type === 'neighborhood') {
        const list = idx.neighborhoods.get(a.slug) || [];
        list.push(a);
        idx.neighborhoods.set(a.slug, list);
      } else if (a.type === 'borough') idx.boroughs.set(a.slug, a);
      else if (a.type === 'city') idx.city = a;
    }
    indexCache.set(market, idx);
  }
  return idx;
}

// The StreetEasy area a listing sits in, from the most specific level up:
// its neighborhood, the neighborhood's submarket, the borough, then all of NYC.
function areaChain(listing, market = MARKET) {
  const idx = indexOf(market);
  const rawBorough = slugify(listing.citySlug || listing.city);
  const boroughSlug = BOROUGH_ALIASES[rawBorough] || rawBorough;
  const nbhdSlug = slugify(listing.neighborhoodSlug || listing.neighborhood);
  const candidates = idx.neighborhoods.get(AREA_ALIASES[nbhdSlug] || nbhdSlug) || [];
  // Neighborhood names can repeat across boroughs; prefer the listing's borough.
  const nbhd = candidates.find((a) => slugify(a.borough) === boroughSlug) || (candidates.length === 1 ? candidates[0] : null);

  const chain = [];
  const seen = new Set();
  let a = nbhd || idx.boroughs.get(boroughSlug) || null;
  while (a && !seen.has(a.slug)) {
    chain.push(a);
    seen.add(a.slug);
    a = a.parent ? idx.bySlug.get(a.parent) : null;
  }
  if (idx.city && !seen.has(idx.city.slug)) chain.push(idx.city);
  return { chain, matchedNeighborhood: nbhd };
}

// StreetEasy's median asking rent for this listing's bedroom class, from the
// most specific area that has a published figure. Null when there's none.
function benchmarkFor(listing, market = MARKET) {
  const beds = bedClass(listing.beds);
  const { chain, matchedNeighborhood } = areaChain(listing, market);
  for (const area of chain) {
    const rent = area.rents && area.rents[beds];
    if (rent > 0) {
      return {
        rent,
        beds,
        area: { slug: area.slug, name: area.name, type: area.type },
        level: area.type,
        confidence: CONFIDENCE_BY_LEVEL[area.type] || 'low',
        matchedNeighborhood: matchedNeighborhood ? matchedNeighborhood.name : null,
        asOf: market.asOf,
      };
    }
  }
  return null;
}

// --- individual component scorers ------------------------------------------

function scorePrice(listing, bench) {
  if (!bench || !(listing.rent > 0)) return { points: WEIGHTS.price / 2, ratio: null };
  // ratio > 1 means cheaper than the StreetEasy median.
  const ratio = bench.rent / listing.rent;
  // Centered so "exactly the median" scores half marks; ±25% spans the range.
  return { points: remap(ratio, 0.75, 1.25, 0, WEIGHTS.price), ratio };
}

function scoreAmenities(listing) {
  const w = amenityWeight(listing.amenities);
  return { points: remap(w, 0, AMENITY_FULL_MARKS, 0, WEIGHTS.amenities), weight: w };
}

function scoreLaundry(listing) {
  const a = listing.amenities || [];
  if (a.includes('in_unit_laundry')) return { points: WEIGHTS.laundry, note: 'In-unit washer/dryer' };
  if (a.includes('in_building_laundry')) return { points: WEIGHTS.laundry * 0.5, note: 'Shared in-building laundry' };
  return { points: 0, note: 'No laundry on site' };
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

// Bonus only: a bigger-than-typical unit earns up to +10; a listing without
// square footage (or a smaller unit) isn't penalized.
function scoreSpaceBonus(listing) {
  const typical = TYPICAL_SQFT[bedClass(listing.beds)];
  if (!(listing.sqft > 0)) return { points: 0, typical, listed: false };
  const ratio = listing.sqft / typical;
  return { points: remap(ratio, 1.0, 1.3, 0, SPACE_BONUS_MAX), typical, listed: true, ratio };
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

function monthLabel(asOf) {
  if (!asOf) return '';
  const [y, m] = asOf.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function scoreListing(listing, market = MARKET) {
  const bench = benchmarkFor(listing, market);
  const price = scorePrice(listing, bench);
  const amenities = scoreAmenities(listing);
  const laundry = scoreLaundry(listing);
  const quality = scoreQuality(listing);
  const space = scoreSpaceBonus(listing);

  const total = clamp(price.points + amenities.points + laundry.points + quality.points + space.points, 0, 100);

  const bedText = bedLabel(bedClass(listing.beds));
  const breakdown = [
    {
      key: 'price', label: 'Price vs. StreetEasy median', points: price.points, max: WEIGHTS.price,
      detail: bench
        ? `$${Math.round(listing.rent).toLocaleString('en-US')}/mo vs. $${bench.rent.toLocaleString('en-US')} median for ${bench.area.name} ${bedText}s${bench.asOf ? ` (${monthLabel(bench.asOf)})` : ''}`
        : 'No StreetEasy benchmark for this area yet',
    },
    {
      key: 'amenities', label: 'Amenities', points: amenities.points, max: WEIGHTS.amenities,
      detail: `${(listing.amenities || []).length} ${(listing.amenities || []).length === 1 ? 'amenity' : 'amenities'} (richness ${amenities.weight} of ${AMENITY_FULL_MARKS} for full marks)`,
    },
    { key: 'laundry', label: 'In-unit laundry', points: laundry.points, max: WEIGHTS.laundry, detail: laundry.note },
    {
      key: 'quality', label: 'Condition & extras', points: quality.points, max: WEIGHTS.quality,
      detail: quality.reasons.length ? quality.reasons.join(' · ') : 'No notable extras',
    },
    {
      key: 'space', label: 'Space bonus', points: space.points, max: SPACE_BONUS_MAX, bonus: true,
      detail: space.listed
        ? `${listing.sqft} sqft vs. ~${space.typical} sqft for a typical NYC ${bedText}`
        : 'No square footage listed, so no bonus (and no penalty)',
    },
  ];

  return {
    ...listing,
    dealScore: Math.round(total),
    grade: grade(total),
    benchmark: bench,
    benchmarkMonth: bench ? monthLabel(bench.asOf) : '',
    fairRent: bench ? bench.rent : null,
    monthlySavings: bench ? Math.round(bench.rent - listing.rent) : null,
    priceConfidence: bench ? bench.confidence : 'low',
    breakdown,
  };
}

function scoreAll(all, market = MARKET) {
  return all.map((l) => scoreListing(l, market));
}

/* ===== assets/js/components/icons.js ===== */
// Inline icons from Lucide (https://lucide.dev, ISC license — see CREDITS.md).
// One set, one stroke width (2), sizes 16/20/24. Icons are decorative by
// default (aria-hidden); the control around them carries the accessible name.

const SVG_NS = 'http://www.w3.org/2000/svg';

const PATHS = {
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'building-2': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
};

function icon(name, { size = 16, className = '' } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `ds-icon shrink-0 ${className}`.trim());
  svg.innerHTML = PATHS[name] || '';
  return svg;
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
        el('div', { class: 'text-xs text-slate-600' }, 'out of 100'),
      ]),
    ]);
  }
  return el('div', { class: `inline-flex items-center gap-1.5 rounded-full ring-1 ${t.ring} ${t.bg} ${t.text} px-2.5 py-1 text-xs font-semibold` }, [
    el('span', { class: `inline-block h-1.5 w-1.5 rounded-full ${t.dot}`, 'aria-hidden': 'true' }),
    el('span', { class: 'sr-only' }, 'Deal Score '),
    el('span', { class: 'tabular-nums' }, String(scored.dealScore)),
    el('span', {}, scored.grade.label),
  ]);
}

/* ===== assets/js/components/map.js ===== */
// Listings map — Leaflet + OpenStreetMap tiles, no API key.
//
// Leaflet is loaded as a global (`L`) by a CDN <script> in index.html. If it
// can't load (offline, blocked CDN) the map shows a short notice and the rest
// of the page keeps working.
//
// Pins are Deal Score pills colored by grade (styles in assets/css/styles.css).



// Swap the tile source here. OSM's standard tiles are fine for light traffic
// and require the attribution below; for a high-traffic site use a hosted tile
// provider (MapTiler, Stadia, Thunderforest, ...) per OSM's tile usage policy.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_VIEW = { center: [40.73, -73.95], zoom: 11 }; // New York City
const TONES = new Set(['great', 'good', 'fair', 'below', 'poor']);

function hasLocation(l) {
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
function listingsMap({ heightClass = 'h-[28rem]' } = {}) {
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

/* ===== assets/js/components/gallery.js ===== */
// Photo gallery for the listing page: a CSS scroll-snap carousel, so it swipes
// natively on touch screens, plus prev/next buttons, arrow keys, a counter,
// and dots. A photo that fails to load is replaced by a placeholder so the
// numbering stays stable.




function photoGallery(listing, { heightClass = 'h-64 sm:h-96' } = {}) {
  const urls = photoUrls(listing);
  const n = urls.length;
  let index = 0;

  const slides = urls.map((src, i) => el('div', { class: 'relative h-full w-full shrink-0 snap-center bg-slate-200' }, [
    el('img', {
      src,
      alt: `${listing.title} — photo ${i + 1} of ${n}`,
      loading: i === 0 ? 'eager' : 'lazy',
      class: 'h-full w-full object-cover',
      onError: (e) => e.target.replaceWith(
        el('div', { class: 'grid h-full w-full place-items-center text-sm text-slate-500' }, 'Photo unavailable')),
    }),
  ]));

  const track = el('div', {
    class: 'ds-gallery-track flex h-full snap-x snap-mandatory overflow-x-auto',
    tabindex: '0',
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-label': `Photos of ${listing.title}`,
  }, slides);

  const counter = el('div', { class: 'num absolute right-3 top-3 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs font-medium text-white', 'aria-hidden': 'true' });
  // Each dot is an 8px mark inside a 24px button, so the hit area meets the
  // minimum target size without changing how it looks.
  const dotMarks = urls.map(() => el('span', { class: 'block h-2 w-2 rounded-full bg-white/60', 'aria-hidden': 'true' }));
  const dots = urls.map((_, i) => el('button', {
    type: 'button',
    'aria-label': `Show photo ${i + 1}`,
    class: 'grid h-6 w-6 place-items-center rounded-full',
    onClick: () => go(i),
  }, [dotMarks[i]]));

  const arrow = (dir, label, iconName) => el('button', {
    type: 'button',
    'aria-label': label,
    class: `absolute top-1/2 ${dir < 0 ? 'left-3' : 'right-3'} grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white disabled:invisible`,
    onClick: () => go(index + dir),
  }, [icon(iconName, { size: 20 })]);
  const prev = arrow(-1, 'Previous photo', 'chevron-left');
  const next = arrow(1, 'Next photo', 'chevron-right');

  function sync() {
    counter.textContent = `${index + 1} / ${n}`;
    dotMarks.forEach((d, i) => { d.className = `block h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/60'}`; });
    dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
    prev.disabled = index === 0;
    next.disabled = index === n - 1;
  }

  function go(i) {
    const target = Math.max(0, Math.min(n - 1, i));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: target * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }

  // The scroll position is the source of truth (swipes and buttons both land here).
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (i !== index) {
      index = i;
      sync();
    }
  }, { passive: true });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });

  sync();

  return el('div', { class: `relative overflow-hidden rounded-2xl bg-slate-200 ${heightClass}` }, [
    track,
    n > 1 ? prev : null,
    n > 1 ? next : null,
    n > 1 ? counter : null,
    n > 1 ? el('div', { class: 'absolute bottom-2 left-1/2 flex -translate-x-1/2 rounded-full bg-slate-900/40 px-1' }, dots) : null,
  ]);
}

/* ===== assets/js/components/header.js ===== */
// Top navigation bar, rendered once into #app-header.


// `short` is shown on phone-width screens so the nav fits on one line.
function link(href, label, short = label) {
  const active = (location.hash || '#/').split('?')[0] === href;
  return el('a', {
    href,
    'aria-label': label,
    ...(active ? { 'aria-current': 'page' } : {}),
    class: 'whitespace-nowrap px-2.5 py-2 sm:px-3 rounded-lg text-sm font-medium ' +
      (active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'),
  }, [
    el('span', { class: 'sm:hidden' }, short),
    el('span', { class: 'hidden sm:inline' }, label),
  ]);
}

function renderHeader(root) {
  const bar = el('header', { class: 'sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur' }, [
    el('div', { class: 'mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3' }, [
      el('a', { href: '#/', class: 'flex shrink-0 items-center gap-2' }, [
        el('span', { class: 'grid h-8 w-8 place-items-center rounded-lg bg-accent text-white font-black', 'aria-hidden': 'true' }, 'D'),
        el('span', { class: 'text-lg font-extrabold tracking-tight text-slate-900' }, 'DealScore'),
        el('span', { class: 'hidden sm:inline text-sm text-slate-600' }, 'NYC Apartments'),
      ]),
      el('nav', { class: 'flex items-center gap-0.5 sm:gap-1', 'aria-label': 'Main' }, [
        link('#/', 'Browse'),
        link('#/methodology', 'How scoring works', 'Scoring'),
        link('#/add', 'Add listing', 'Add'),
      ]),
    ]),
  ]);
  root.innerHTML = '';
  root.appendChild(bar);
}

/* ===== assets/js/components/listingCard.js ===== */
// A single listing card for the browse grid.






// opts.enter + opts.index: play the staggered entrance (first reveal only).
function listingCard(scored, opts = {}) {
  const topAmenities = (scored.amenities || []).slice(0, 4).map((k) => amenity(k));
  const extraAmenities = (scored.amenities || []).length - topAmenities.length;
  const photos = photoUrls(scored);
  const cover = photos[0];

  // Savings measured against a borough- or city-wide median (no neighborhood
  // figure) are shown muted and flagged.
  const savings = scored.monthlySavings;
  const rough = scored.priceConfidence === 'low';
  const note = rough ? ' · rough estimate' : '';
  const savingsLine = savings == null
    ? el('p', { class: 'text-xs text-slate-600' }, 'No StreetEasy benchmark yet')
    : savings > 30
      ? el('p', { class: `num text-xs font-semibold ${rough ? 'text-slate-600' : 'text-emerald-700'}` }, `~${money(Math.abs(savings))}/mo below StreetEasy median${note}`)
      : savings < -30
        ? el('p', { class: `num text-xs font-semibold ${rough ? 'text-slate-600' : 'text-rose-700'}` }, `~${money(Math.abs(savings))}/mo above StreetEasy median${note}`)
        : el('p', { class: 'text-xs text-slate-600' }, `Around the StreetEasy median${note}`);

  return el('a', {
    href: `#/listing/${encodeURIComponent(scored.id)}`,
    class: `ds-card block rounded-2xl border border-slate-200 bg-white${opts.enter ? ' ds-enter' : ''}`,
    style: opts.enter ? `--i:${opts.index || 0}` : null,
  }, [
    // Cover photo, or a neutral placeholder. Inner radius = 16px card − 1px border.
    el('div', { class: 'relative h-36 overflow-hidden rounded-t-[15px] bg-slate-100' }, [
      cover
        ? el('img', {
          src: cover, alt: '', loading: 'lazy',
          class: 'absolute inset-0 h-full w-full object-cover',
          onError: (e) => e.target.remove(),
        })
        : null,
      el('div', { class: 'absolute inset-0 grid place-items-center text-slate-400' }, cover ? null : icon('building-2', { size: 24 })),
      el('div', { class: 'absolute left-3 top-3' }, [scoreBadge(scored, 'sm')]),
      scored._source === 'user'
        ? el('div', { class: 'absolute right-3 top-3 rounded-full bg-slate-900/85 px-2 py-0.5 text-xs font-medium text-white' }, 'Draft')
        : null,
      el('div', { class: 'absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800' }, scored.neighborhood),
      photos.length > 1
        ? el('div', { class: 'num absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-xs font-medium text-white' }, [
          icon('camera', { size: 12 }),
          `${photos.length}`,
          el('span', { class: 'sr-only' }, ' photos'),
        ])
        : null,
    ]),
    el('div', { class: 'p-4' }, [
      el('div', { class: 'flex items-baseline justify-between gap-2' }, [
        el('p', { class: 'num text-lg font-bold text-slate-900' }, money(scored.rent)),
        el('p', { class: 'num text-xs text-slate-600' }, `${beds(scored.beds)} · ${scored.baths} ba${scored.sqft > 0 ? ` · ${scored.sqft} sqft` : ''}`),
      ]),
      savingsLine,
      el('p', { class: 'mt-1 truncate text-sm font-medium text-slate-900' }, scored.title),
      el('p', { class: 'truncate text-xs text-slate-600' }, [scored.address, scored.address ? ' · ' : '', scored.city].join('')),
      topAmenities.length
        ? el('ul', { class: 'mt-3 flex flex-wrap gap-1', 'aria-label': 'Amenities' }, [
          ...topAmenities.map((a) => el('li', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700' }, a.label)),
          extraAmenities > 0
            ? el('li', { class: 'rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700' }, `+${extraAmenities} more`)
            : null,
        ])
        : null,
      scored.sqft > 0 ? el('p', { class: 'num mt-2 text-xs text-slate-600' }, ppsfText(scored.rent, scored.sqft)) : null,
    ]),
  ]);
}

/* ===== assets/js/components/filters.js ===== */
// Filter + sort bar for the browse page. Pure UI: it renders from the filter
// state and calls onChange with a PATCH of only the fields that changed. The
// page owns the state (and merges patches into its current copy) plus the URL
// sync — the bar isn't re-rendered on every change, so it must not hold state.



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

function filterBar(state, derived, onChange) {
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

/* ===== assets/js/pages/home.js ===== */
// Browse page — filter, sort, and the scored listing grid (or map). This is
// where the Deal Score does its work: by default we sort best-deal-first.
//
// The filter bar and the results are rendered separately: changing a filter
// only re-renders the results, so a text field keeps focus while you type and
// the map keeps its tiles while the pins update.










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
    el('dt', { class: 'text-xs font-medium text-slate-600' }, label),
    el('dd', { class: 'num text-lg font-bold text-slate-900' }, value),
  ]);
  return el('dl', { class: 'flex flex-wrap gap-x-10 gap-y-3' }, [
    stat('Median rent', money(medRent)),
    med ? stat('Median $/sqft', '$' + med.toFixed(2)) : null,
    stat('Great deals (80+)', num(greatDeals)),
  ]);
}

function viewToggle(view, onChange) {
  const btn = (value, label) => el('button', {
    type: 'button',
    'aria-pressed': String(view === value),
    class: 'rounded px-3 py-1.5 text-sm font-medium ' +
      (view === value ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'),
    onClick: () => onChange(value),
  }, label);
  return el('div', { class: 'inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1', role: 'group', 'aria-label': 'View' }, [
    btn('grid', 'Grid'), btn('map', 'Map'),
  ]);
}

async function homePage(root, ctx) {
  const all = scoreAll(await getListings());
  let state = stateFromQuery(ctx.query);
  let map = null; // created when the map view opens, reused while it stays open
  let firstReveal = true; // stagger the cards in once, not on every filter change

  const filtersSlot = el('div');
  const summarySlot = el('div', { class: 'mt-6 mb-4' });
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
      el('p', { class: 'num text-sm text-slate-600', role: 'status' }, [
        `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`,
        state.view === 'map' && unmapped
          ? ` · ${unmapped} without a location not shown on the map`
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

    const enter = firstReveal;
    firstReveal = false;
    mount(gridSlot, filtered.length
      ? el('ul', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', 'aria-label': 'Listings' },
        filtered.map((s, index) => el('li', {}, [listingCard(s, { enter, index })])))
      : all.length
        ? el('div', { class: 'rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-600' },
          'No listings match these filters. Try widening your search.')
        : el('div', { class: 'rounded-2xl border border-dashed border-slate-300 p-10 text-center' }, [
          el('h2', { class: 'font-semibold text-slate-900' }, 'No listings yet'),
          el('p', { class: 'mt-1 text-sm text-slate-600' },
            'Add an apartment you\'re considering to see how its rent compares with StreetEasy\'s median for the neighborhood.'),
          el('a', { href: '#/add', class: 'mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover' }, 'Add a listing'),
        ]));
  }

  mount(root, el('div', { class: 'mx-auto max-w-6xl px-4 py-6' }, [
    el('div', { class: 'mb-5' }, [
      el('h1', { class: 'text-2xl font-extrabold tracking-tight text-slate-900' }, 'How good a deal is that NYC apartment?'),
      el('p', { class: 'mt-1 max-w-prose text-sm text-slate-700' },
        'Each apartment you add gets a Deal Score from 0 to 100, led by how its rent compares with StreetEasy\'s median asking rent for the same neighborhood and size. Best deals first.'),
      el('p', { class: 'mt-1 text-xs text-slate-600' }, MARKET.asOf
        ? [`Market data: `, el('a', { href: MARKET.sourceUrl, target: '_blank', rel: 'noopener', class: 'underline hover:text-slate-900' }, 'StreetEasy'), `, ${monthLabel(MARKET.asOf)}.`]
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

/* ===== assets/js/pages/listing.js ===== */
// Listing detail page — the full pitch for one unit, with a transparent
// breakdown of how its Deal Score was computed.











function bar(points, max) {
  const pctW = Math.round((points / max) * 100);
  return el('div', { class: 'h-2 w-full overflow-hidden rounded-full bg-slate-200', 'aria-hidden': 'true' }, [
    el('div', { class: 'h-full rounded-full bg-accent', style: `width:${pctW}%` }),
  ]);
}

function breakdownRow(b) {
  return el('div', { class: 'py-3' }, [
    el('div', { class: 'flex items-baseline justify-between' }, [
      el('div', { class: 'text-sm font-semibold text-slate-800' }, [
        b.label,
        b.bonus ? el('span', { class: 'ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700' }, 'bonus') : null,
      ]),
      el('div', { class: 'num text-sm text-slate-600' }, b.bonus ? `+${b.points.toFixed(1)} / ${b.max}` : `${b.points.toFixed(1)} / ${b.max}`),
    ]),
    el('div', { class: 'mt-1.5' }, [bar(b.points, b.max)]),
    el('div', { class: 'mt-1 text-xs text-slate-600' }, b.detail),
  ]);
}

const CONFIDENCE = {
  high: { label: 'High confidence', cls: 'bg-emerald-50 text-emerald-700' },
  medium: { label: 'Medium confidence', cls: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low confidence', cls: 'bg-slate-100 text-slate-600' },
};

const LEVEL_NOUN = { neighborhood: 'neighborhood', submarket: 'area', borough: 'borough', city: 'citywide' };

// Where the "typical rent" figure comes from: StreetEasy's median asking rent,
// and which area it had to fall back to when the neighborhood has no figure.
function benchmarkExplainer(s) {
  const b = s.benchmark;
  const bed = bedLabel(bedClass(s.beds));
  const credit = el('p', { class: 'mt-2 text-xs text-slate-600' }, [
    'Source: ',
    el('a', { href: MARKET.sourceUrl, target: '_blank', rel: 'noopener', class: 'underline hover:text-slate-900' }, 'StreetEasy Data Dashboard'),
    s.benchmarkMonth ? `, ${s.benchmarkMonth}` : '',
    '.',
  ]);
  if (!b) {
    return el('div', {}, [
      el('p', { class: 'mt-2 text-xs text-slate-600' }, MARKET.areas.length
        ? `StreetEasy doesn't publish a ${bed} median for ${s.neighborhood} or ${s.city}, so this listing's price can't be benchmarked yet.`
        : 'StreetEasy market data hasn\'t been imported yet, so prices aren\'t benchmarked.'),
      credit,
    ]);
  }
  const conf = CONFIDENCE[b.confidence];
  const fellBack = b.level !== 'neighborhood';
  return el('div', { class: 'mt-3' }, [
    el('span', { class: `inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${conf.cls}` }, conf.label),
    el('ul', { class: 'mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600' }, [
      el('li', {}, `StreetEasy median asking rent for ${bed}s in ${b.area.name}.`),
      b.matchedNeighborhood && b.matchedNeighborhood.toLowerCase() !== String(s.neighborhood).toLowerCase()
        ? el('li', {}, `StreetEasy publishes "${s.neighborhood}" as ${b.matchedNeighborhood}.`)
        : null,
      fellBack
        ? el('li', {}, b.matchedNeighborhood
          ? `StreetEasy doesn't publish a ${bed} figure for ${b.matchedNeighborhood}, so this uses the ${LEVEL_NOUN[b.level]} figure.`
          : `"${s.neighborhood}" isn't a StreetEasy neighborhood name (or has no ${bed} figure), so this uses the ${LEVEL_NOUN[b.level]} figure.`)
        : null,
    ]),
    credit,
  ]);
}

function fact(label, value) {
  return el('div', { class: 'rounded-xl bg-slate-50 px-3 py-2' }, [
    el('div', { class: 'text-xs text-slate-600' }, label),
    el('div', { class: 'text-sm font-semibold text-slate-800' }, value),
  ]);
}

async function listingPage(root, ctx) {
  const all = await getListings();
  const raw = all.find((l) => l.id === ctx.params.id);
  if (!raw) {
    mount(root, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
      el('h1', { class: 'text-xl font-bold text-slate-900' }, 'Listing not found'),
      el('p', { class: 'mt-1 text-sm text-slate-600' }, 'It may have been removed from this browser.'),
      el('a', { href: '#/', class: 'mt-3 inline-block py-1 text-accent underline' }, 'Go to Browse'),
    ]));
    return;
  }
  // Score everything so the location map can show neighbors' scores too.
  const scored = scoreAll(all);
  const s = scored.find((l) => l.id === raw.id);
  document.title = `${s.title} — DealScore`;
  const externalUrl = s.url ? httpUrl(s.url) : null;
  const areaHash = `#/?city=${encodeURIComponent(s.citySlug)}&neighborhood=${encodeURIComponent(s.neighborhoodSlug)}`;
  const locMap = hasLocation(s) ? listingsMap({ heightClass: 'h-64' }) : null;

  const savingsBanner = s.monthlySavings != null
    ? el('div', {
      class: 'rounded-xl px-4 py-3 text-sm font-medium ' +
        (s.monthlySavings > 30 ? 'bg-emerald-50 text-emerald-800'
          : s.monthlySavings < -30 ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-700'),
    },
    s.monthlySavings > 30
      ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo below StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s (~${money(s.monthlySavings * 12)}/yr).`
      : s.monthlySavings < -30
        ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo above StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s.`
        : `Priced right around StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s.`)
    : null;

  const amenityGrid = (s.amenities || []).length
    ? el('ul', { class: 'grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-800 sm:grid-cols-3' },
      s.amenities.map((k) => el('li', {}, amenity(k).label)))
    : el('p', { class: 'text-sm text-slate-600' }, 'None listed.');

  const page = el('div', { class: 'mx-auto max-w-5xl px-4 py-6' }, [
    el('a', { href: '#/', class: 'mb-4 inline-flex items-center gap-1.5 py-1 text-sm text-slate-700 hover:text-slate-900' }, [icon('arrow-left'), 'Back to results']),
    // Photos when the listing has them; no decorative placeholder otherwise.
    photoUrls(s).length ? el('div', { class: 'mb-5' }, [photoGallery(s)]) : null,

    el('div', { class: 'grid grid-cols-1 gap-6 lg:grid-cols-3' }, [
      // Main column
      el('div', { class: 'lg:col-span-2' }, [
        el('div', { class: 'flex flex-wrap items-start justify-between gap-3' }, [
          el('div', {}, [
            el('h1', { class: 'text-2xl font-extrabold text-slate-900' }, s.title),
            el('p', { class: 'text-sm text-slate-600' }, [s.address, `${s.neighborhood}, ${s.city}`].filter(Boolean).join(' · ')),
          ]),
          el('div', { class: 'text-right' }, [
            el('p', { class: 'num text-2xl font-extrabold text-slate-900' }, `${money(s.rent)}/mo`),
            s.sqft > 0 ? el('p', { class: 'num text-xs text-slate-600' }, ppsfText(s.rent, s.sqft)) : null,
          ]),
        ]),
        el('div', { class: 'mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4' }, [
          fact('Type', bedsLong(s.beds)),
          fact('Bathrooms', String(s.baths)),
          fact('Size', s.sqft > 0 ? `${s.sqft} sqft` : 'Not listed'),
          fact('Available', s.available || 'Not listed'),
        ]),
        savingsBanner ? el('div', { class: 'mt-4' }, [savingsBanner]) : null,
        el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Amenities'),
        el('div', { class: 'mt-2' }, [amenityGrid]),
        s.concession
          ? el('p', { class: 'mt-4 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800' }, `Move-in special: ${s.concession}`)
          : null,
        (s.utilitiesIncluded || []).length
          ? el('p', { class: 'mt-2 text-sm text-slate-700' }, `Utilities included: ${s.utilitiesIncluded.map(titleize).join(', ')}`)
          : null,
        locMap ? el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Location') : null,
        locMap ? el('div', { class: 'mt-2' }, [locMap.node]) : null,
        locMap ? el('p', { class: 'mt-1 text-xs text-slate-600' },
          `Pins show Deal Scores. Other ${s.city} listings are faded; click one to compare.`) : null,
      ]),

      // Score sidebar
      el('div', { class: 'lg:col-span-1' }, [
        el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'flex items-center justify-between' }, [
            el('h2', { class: 'text-sm font-bold text-slate-900' }, 'Deal Score'),
          ]),
          el('div', { class: 'mt-3' }, [scoreBadge(s, 'lg')]),
          el('div', { class: 'mt-4 divide-y divide-slate-100' }, s.breakdown.map(breakdownRow)),
          el('a', { href: '#/methodology', class: 'mt-3 inline-block py-1 text-sm text-accent underline hover:text-accent-hover' },
            'How is this calculated?'),
        ]),
        el('div', { class: 'mt-4 rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('h2', { class: 'text-sm font-bold text-slate-900' }, 'Typical rent (StreetEasy median)'),
          el('p', { class: 'num mt-1 text-xl font-bold text-slate-900' }, s.fairRent != null ? `${money(s.fairRent)}/mo` : '—'),
          benchmarkExplainer(s),
          externalUrl
            ? el('a', { href: externalUrl, target: '_blank', rel: 'noopener', class: 'mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover' }, [
              'View original listing', icon('external-link'), el('span', { class: 'sr-only' }, ' (opens in a new tab)'),
            ])
            : null,
          el('a', {
            href: areaHash,
            class: 'mt-2 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50',
          }, `See more in ${s.neighborhood}`),
        ]),
      ]),
    ]),
  ]);
  mount(root, page);
  if (locMap) locMap.setListings(scored.filter((l) => l.citySlug === s.citySlug), { focusId: s.id });
}

/* ===== assets/js/pages/methodology.js ===== */
// Methodology page — explains the Deal Score so renters (and you) trust it.




const COMPONENTS = [
  ['Price vs. StreetEasy median', '60 pts', 'The listing\'s rent compared with StreetEasy\'s median asking rent for the same neighborhood and bedroom count (studio, 1, 2, or 3+ beds). Right at the median earns half marks; 25% below earns full marks; 25% above earns none. This is the single biggest factor.'],
  ['Amenity richness', '22 pts', 'Each amenity has a hand-set weight; in-unit laundry, parking, central A/C, dishwashers and outdoor space weigh the most. The weights are a judgment call, not fitted to rent data. An apartment with most of them, such as a doorman building with in-unit laundry, earns full marks.'],
  ['In-unit laundry', '10 pts', 'Scored on its own, on top of the amenity score, so laundry counts extra. An in-unit washer/dryer earns full marks; shared in-building laundry earns half.'],
  ['Condition & extras', '8 pts', 'Recent renovation or newer construction, included utilities, and move-in concessions each add points.'],
  ['Space bonus', 'up to +10', 'Only when the listing gives its square footage. A unit 30% or more bigger than a typical NYC apartment of its size earns the full bonus. Smaller units, and listings without square footage, simply get no bonus. The total is capped at 100.'],
];

function row([label, pts, desc]) {
  return el('div', { class: 'border-t border-slate-100 py-4' }, [
    el('div', { class: 'flex items-baseline justify-between gap-3' }, [
      el('div', { class: 'font-semibold text-slate-800' }, label),
      el('div', { class: 'num whitespace-nowrap rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-bold text-accent' }, pts),
    ]),
    el('p', { class: 'mt-1 text-sm text-slate-600' }, desc),
  ]);
}

function gradeChip(label, range, cls) {
  return el('div', { class: `flex items-center justify-between rounded-lg px-3 py-2 text-sm ${cls}` }, [
    el('span', { class: 'font-semibold' }, label), el('span', { class: 'tabular-nums' }, range),
  ]);
}

const methodCard = (children) => el('div', { class: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5' }, children);
const methodPara = (text) => el('p', { class: 'mt-1 text-sm text-slate-600' }, text);
const methodLink = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', class: 'text-accent underline' }, text);

function methodologyPage(root) {
  const page = el('div', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, 'How the Deal Score works'),
    el('p', { class: 'mt-2 text-slate-600' },
      'The Deal Score is a 0–100 rating of how good a deal an apartment is. Its price is compared with ' +
      'what similar apartments in the same neighborhood are asking, using StreetEasy\'s published market data, ' +
      'and the rest of the score comes from what the apartment itself offers.'),

    methodCard([
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'The components'),
      ...COMPONENTS.map(row),
    ]),

    methodCard([
      el('h2', { class: 'mb-3 text-lg font-bold text-slate-900' }, 'How scores map to labels'),
      el('div', { class: 'grid grid-cols-1 gap-2 sm:grid-cols-2' }, [
        gradeChip('Great Deal', '80–100', 'bg-emerald-50 text-emerald-700'),
        gradeChip('Good Deal', '65–79', 'bg-lime-50 text-lime-700'),
        gradeChip('Fair Price', '50–64', 'bg-amber-50 text-amber-700'),
        gradeChip('Below Average', '35–49', 'bg-orange-50 text-orange-700'),
        gradeChip('Overpriced', '0–34', 'bg-rose-50 text-rose-700'),
      ]),
    ]),

    methodCard([
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'Where the benchmark comes from'),
      methodPara([
        'Typical rents are StreetEasy\'s median asking rents from its ',
        methodLink(MARKET.sourceUrl, 'Data Dashboard'),
        MARKET.asOf ? ` (currently ${monthLabel(MARKET.asOf)}), refreshed monthly.` : '. They haven\'t been imported yet.',
      ]),
      methodPara('StreetEasy doesn\'t publish a figure for every neighborhood and size, so DealScore uses the most ' +
        'specific one available: the neighborhood first, then the wider area it belongs to, then the borough, ' +
        'then all of NYC. Each listing shows which level it used as a confidence label: high for a ' +
        'neighborhood figure, medium for a wider area, low for a borough or citywide figure. Low-confidence ' +
        'savings are flagged as rough estimates.'),
    ]),

    methodCard([
      el('h2', { class: 'text-lg font-bold text-slate-900' }, 'Typical sizes for the space bonus'),
      methodPara('StreetEasy doesn\'t publish apartment sizes, so the space bonus compares against typical NYC sizes ' +
        `rounded from RentCafe's listing averages: studio ~${TYPICAL_SQFT[0]} sqft, 1-bed ~${TYPICAL_SQFT[1]}, ` +
        `2-bed ~${TYPICAL_SQFT[2]}, 3+ bed ~${TYPICAL_SQFT[3]}.`),
    ]),

    el('p', { class: 'mt-6 text-xs text-slate-600' },
      'Weights are tunable in assets/js/core/score.js and assets/js/data/amenities.js. DealScore is not affiliated with StreetEasy.'),
  ]);
  mount(root, page);
}

/* ===== assets/js/pages/add.js ===== */
// Add Listing page — enter an apartment you're considering. Listings are saved
// in this browser only (localStorage) and show up in Browse tagged "Draft".
// "Export JSON" copies them out (into assets/js/data/listings.js or a backend).
//
// Form layout follows docs/DESIGN_GUIDELINES.md: required fields first,
// optional details grouped and labelled, amenities chunked by category, and
// forgiving input ("$3,200/mo" is a rent; "40.76, -73.92" fills both
// coordinates).








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

function addPage(root) {
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

/* ===== assets/js/pages/legal.js ===== */
// Privacy and Terms pages. Written from what the code actually does (see the
// inventory in docs/DESIGN_AUDIT.md). DRAFTS: the owner and a qualified lawyer
// must review them, and fill every [[TODO]], before they're relied on.



const POLICY_VERSION = '0.1 (draft)';

// A visible, searchable placeholder for details only the owner can supply.
function legalTodo(text) {
  return el('mark', { class: 'rounded bg-amber-100 px-1 text-amber-900' }, `[[TODO: ${text}]]`);
}

function legalDraftBanner() {
  return el('p', { class: 'mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800', role: 'note' },
    'DRAFT: requires review by a qualified lawyer before publishing.');
}

function legalSection(title, children) {
  return el('section', { class: 'mt-8' }, [
    el('h2', { class: 'text-lg font-bold text-slate-900' }, title),
    ...children,
  ]);
}

const legalP = (children) => el('p', { class: 'mt-2 text-sm leading-6 text-slate-700' }, children);
const legalList = (items) => el('ul', { class: 'mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700' }, items.map((i) => el('li', {}, i)));
const legalExt = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', class: 'text-accent underline' }, text);

function legalHeader(title) {
  return [
    el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, title),
    el('p', { class: 'mt-2 text-sm text-slate-600' }, ['Version ', POLICY_VERSION, ' · Effective ', legalTodo('effective date')]),
    legalDraftBanner(),
  ];
}

function legalStorageTable() {
  const th = (t) => el('th', { scope: 'col', class: 'px-3 py-2 text-left font-semibold text-slate-900' }, t);
  const td = (t) => el('td', { class: 'px-3 py-2 align-top text-slate-700' }, t);
  return el('div', { class: 'mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white' }, [
    el('table', { class: 'w-full text-sm' }, [
      el('caption', { class: 'sr-only' }, 'Browser storage used by DealScore'),
      el('thead', { class: 'border-b border-slate-200' }, el('tr', {}, [th('Name'), th('Type'), th('Set by'), th('Purpose'), th('Category'), th('Duration')])),
      el('tbody', {}, el('tr', {}, [
        td(el('code', { class: 'font-mono text-xs' }, USER_LISTINGS_KEY)),
        td('localStorage'),
        td('DealScore, in your browser'),
        td('Keeps the listings you add on the Add listing page.'),
        td('Necessary for the feature you use'),
        td('Until you remove the listings or clear site data'),
      ])),
    ]),
  ]);
}

function privacyPage(root) {
  mount(root, el('article', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    ...legalHeader('Privacy policy'),

    legalSection('Who runs DealScore', [
      legalP(['DealScore is run by ', legalTodo('owner or legal entity name'), '. Contact: ', legalTodo('contact email'), '.']),
    ]),

    legalSection('What DealScore collects', [
      legalP('Nothing is sent to us. DealScore has no accounts, no sign-up, no analytics, no advertising, and sets no cookies.'),
      legalP('Listings you add on the Add listing page are saved only in your own browser\'s storage (see the table below). They are not uploaded anywhere. You can remove them one at a time or all at once on the Add listing page, or by clearing this site\'s data in your browser.'),
    ]),

    legalSection('Services your browser contacts', [
      legalP('Like any website, loading DealScore makes your browser contact a few services. Each receives your IP address and standard browser information (such as user agent and the page that made the request) under its own privacy policy:'),
      legalList([
        ['Website hosting: ', legalTodo('confirm host, e.g. GitHub Pages'), '. ', legalExt('https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement', 'GitHub\'s privacy statement'), ' describes what it logs for GitHub Pages sites.'],
        ['Tailwind CSS (cdn.tailwindcss.com), on every page, to style the site.'],
        ['OpenStreetMap tile servers (tile.openstreetmap.org), only when a map is shown. ', legalExt('https://osmfoundation.org/wiki/Privacy_Policy', 'OSMF privacy policy'), '.'],
        ['Photo hosts: if you add photo links to a listing, your browser loads those images from the sites in the links.'],
      ]),
      legalP('The fonts and map library are hosted with DealScore itself, so no font or library CDN is contacted. StreetEasy, RentCafe and other linked sites are contacted only if you click a link to them.'),
    ]),

    legalSection('Cookies and browser storage', [
      legalP('DealScore sets no cookies. It uses one browser-storage entry:'),
      legalStorageTable(),
      legalP('Because nothing optional is loaded, there is no cookie banner. If analytics or similar tools are ever added, they will load only after you agree.'),
    ]),

    legalSection('Your choices and rights', [
      legalP('Since DealScore holds no personal data about you, there is nothing for us to access, correct, export or delete on our side. Your saved listings are under your control in your browser.'),
      legalP(['Depending on where you live (for example under the GDPR or the CCPA), you may have additional rights: ', legalTodo('lawyer to confirm which apply and the legal basis, if any'), '. Questions about this policy: ', legalTodo('contact email'), '.']),
    ]),

    legalSection('Children', [
      legalP(['DealScore is a tool for adults looking for apartments and is not directed at children. ', legalTodo('owner to confirm the site is not aimed at or likely to attract children under 13 / under 16 in the EU'), '.']),
    ]),

    legalSection('Changes to this policy', [
      legalP('If this policy changes, the new version and its effective date will be posted on this page.'),
    ]),
  ]));
}

function termsPage(root) {
  mount(root, el('article', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    ...legalHeader('Terms of use'),

    legalSection('What DealScore is', [
      legalP(['DealScore is a free tool, run by ', legalTodo('owner or legal entity name'), ', that gives an apartment a Deal Score from 0 to 100. The score compares the rent you enter with StreetEasy\'s published median asking rent for the neighborhood and bedroom count, and adds points for amenities, laundry, condition and size. See ', el('a', { href: '#/methodology', class: 'text-accent underline' }, 'How scoring works'), '.']),
    ]),

    legalSection('Not advice', [
      legalP('The Deal Score is an automated estimate for comparison only. It is not an appraisal and not financial, legal or real-estate advice. Median asking rents describe what landlords ask, not what tenants sign for, and every apartment differs. Check the details with the landlord or broker before you decide.'),
    ]),

    legalSection('Data sources', [
      legalList([
        ['Market rents: ', legalExt('https://streeteasy.com/blog/data-dashboard', 'StreetEasy Data Dashboard'), '. DealScore is not affiliated with, endorsed by or sponsored by StreetEasy or Zillow Group.'],
        ['Typical apartment sizes (space bonus): rounded from RentCafe\'s published NYC averages.'],
        ['Map data: © OpenStreetMap contributors.'],
      ]),
      legalP('These sources may be incomplete, out of date or wrong, and DealScore does not guarantee the accuracy of any figure or score.'),
    ]),

    legalSection('Listings you add', [
      legalP('Listings you enter are stored only in your browser. You are responsible for what you enter, including having the right to use any photo links you add.'),
    ]),

    legalSection('Acceptable use', [
      legalP('Don\'t use DealScore to break the law, to infringe others\' rights, or to interfere with the site or the services it relies on.'),
    ]),

    legalSection('Disclaimers and liability', [
      legalP(['DealScore is provided "as is", without warranties of any kind. ', legalTodo('lawyer to supply disclaimer and limitation-of-liability wording for the governing jurisdiction'), '.']),
    ]),

    legalSection('Governing law', [
      legalP([legalTodo('governing law and jurisdiction'), '.']),
    ]),

    legalSection('Changes and contact', [
      legalP(['If these terms change, the new version and its effective date will be posted on this page. Questions: ', legalTodo('contact email'), '.']),
    ]),
  ]));
}

/* ===== assets/js/main.js ===== */
// App bootstrap: wire the router to pages, keep the header in sync, and handle
// the things every page needs — document title, focus after navigation,
// loading and error states, and a short crossfade between pages.









const headerRoot = document.getElementById('app-header');
const appRoot = document.getElementById('app');
const DEFAULT_TITLE = 'DealScore — NYC apartments scored by value';
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let firstRender = true;

function loadingView() {
  return el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600', role: 'status' }, 'Loading…');
}

function errorView() {
  return el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center', role: 'alert' }, [
    el('p', { class: 'font-semibold text-slate-900' }, 'This page didn\'t load.'),
    el('p', { class: 'mt-1 text-sm text-slate-600' }, 'Something went wrong while preparing it. Try again, or go back to Browse.'),
    el('div', { class: 'mt-4 flex justify-center gap-3' }, [
      el('button', { type: 'button', class: 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover', onClick: () => refresh() }, 'Try again'),
      el('a', { href: '#/', class: 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50' }, 'Go to Browse'),
    ]),
  ]);
}

// Render a page with a loading state (only if it takes over 300ms) and an
// error state with a retry.
async function renderWithStates(render) {
  const timer = setTimeout(() => mount(appRoot, loadingView()), 300);
  try {
    await render();
  } catch (err) {
    console.error(err);
    mount(appRoot, errorView());
  } finally {
    clearTimeout(timer);
  }
}

// `title` is the page's default document title; pages can refine it.
function page(title, fn) {
  return (ctx) => {
    const run = () => {
      renderHeader(headerRoot);
      document.title = title ? `${title} — DealScore` : DEFAULT_TITLE;
      return renderWithStates(() => fn(appRoot, ctx));
    };
    const initial = firstRender;
    firstRender = false;
    // Crossfade between pages where supported (View Transitions API).
    const done = !initial && document.startViewTransition && !prefersReducedMotion()
      ? document.startViewTransition(run).updateCallbackDone
      : run();
    // After navigating, move focus to the new content for keyboard and
    // screen-reader users. Not on first load, so the skip link stays first.
    Promise.resolve(done).then(() => { if (!initial) appRoot.focus({ preventScroll: true }); }, () => {});
  };
}

route('#/', page('', homePage));
route('#/listing/:id', page('Listing', listingPage));
route('#/methodology', page('How scoring works', () => methodologyPage(appRoot)));
route('#/add', page('Add a listing', () => addPage(appRoot)));
route('#/privacy', page('Privacy', () => privacyPage(appRoot)));
route('#/terms', page('Terms', () => termsPage(appRoot)));

setNotFound(page('Page not found', () => {
  mount(appRoot, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
    el('h1', { class: 'text-xl font-bold text-slate-900' }, 'Page not found'),
    el('a', { href: '#/', class: 'mt-3 inline-block py-1 text-accent underline' }, 'Go to Browse'),
  ]));
}));

// The app routes on the URL hash, so the skip link moves focus instead of
// navigating to #app (which the router would treat as an unknown page).
document.querySelector('[data-skip-link]')?.addEventListener('click', (e) => {
  e.preventDefault();
  appRoot.focus();
});

startRouter();

})();
