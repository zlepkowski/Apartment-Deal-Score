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
//   petPolicy     'friendly' | 'cats' | 'none'
//   utilitiesIncluded  array of strings (e.g. ['heat','hot water'])
//   concession    free-text incentive (e.g. '1 month free') or ''
//   amenities     array of amenity keys (see data/amenities.js)
//   images        optional array of photo URLs (first one is the cover)
//   accent        tailwind-ish hue used for the placeholder when there's no photo
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
    iconSize: [34, 22],
    iconAnchor: [17, 11],
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
    el('div', { class: 'truncate text-xs text-slate-700' }, s.title),
    el('div', { class: 'text-xs text-slate-500' }, `${s.neighborhood} · Deal Score ${s.dealScore} · ${s.grade.label}`),
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

  const counter = el('div', { class: 'absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white tabular-nums' });
  const dots = urls.map((_, i) => el('button', {
    type: 'button',
    'aria-label': `Show photo ${i + 1}`,
    class: 'h-2 w-2 rounded-full bg-white/60 transition',
    onClick: () => go(i),
  }));

  const arrow = (dir, label, glyph) => el('button', {
    type: 'button',
    'aria-label': label,
    class: `absolute top-1/2 ${dir < 0 ? 'left-3' : 'right-3'} grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-lg font-bold text-slate-800 shadow hover:bg-white disabled:opacity-0`,
    onClick: () => go(index + dir),
  }, glyph);
  const prev = arrow(-1, 'Previous photo', '‹');
  const next = arrow(1, 'Next photo', '›');

  function sync() {
    counter.textContent = `${index + 1} / ${n}`;
    dots.forEach((d, i) => { d.className = `h-2 w-2 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/60'}`; });
    prev.disabled = index === 0;
    next.disabled = index === n - 1;
  }

  function go(i) {
    const target = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
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
    n > 1 ? el('div', { class: 'absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2 py-1.5' }, dots) : null,
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
    class: 'whitespace-nowrap px-2.5 py-2 sm:px-3 rounded-lg text-sm font-medium ' +
      (active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'),
  }, [
    el('span', { class: 'sm:hidden' }, short),
    el('span', { class: 'hidden sm:inline' }, label),
  ]);
}

function renderHeader(root) {
  const bar = el('header', { class: 'sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur' }, [
    el('div', { class: 'mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3' }, [
      el('a', { href: '#/', class: 'flex shrink-0 items-center gap-2' }, [
        el('span', { class: 'grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-white font-black' }, 'D'),
        el('span', { class: 'text-lg font-extrabold tracking-tight text-slate-900' }, 'DealScore'),
        el('span', { class: 'hidden sm:inline text-sm text-slate-400' }, 'NYC Apartments'),
      ]),
      el('nav', { class: 'flex items-center gap-0.5 sm:gap-1' }, [
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
  const photos = photoUrls(scored);
  const cover = photos[0];

  // Savings measured against a borough- or city-wide median (no neighborhood
  // figure) are shown muted and flagged.
  const savings = scored.monthlySavings;
  const rough = scored.priceConfidence === 'low';
  const note = rough ? ' · rough estimate' : '';
  const savingsLine = savings == null
    ? el('div', { class: 'text-xs text-slate-400' }, 'No StreetEasy benchmark yet')
    : savings > 30
      ? el('div', { class: `text-xs font-semibold ${rough ? 'text-slate-500' : 'text-emerald-600'}` }, `~${money(Math.abs(savings))}/mo below StreetEasy median${note}`)
      : savings < -30
        ? el('div', { class: `text-xs font-semibold ${rough ? 'text-slate-500' : 'text-rose-500'}` }, `~${money(Math.abs(savings))}/mo above StreetEasy median${note}`)
        : el('div', { class: 'text-xs text-slate-400' }, `Around the StreetEasy median${note}`);

  return el('a', {
    href: `#/listing/${scored.id}`,
    class: 'group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg hover:-translate-y-0.5',
  }, [
    el('div', { class: `relative h-36 bg-gradient-to-br ${accent}` }, [
      // Cover photo over the colored placeholder; if it fails to load, the
      // placeholder shows through.
      cover ? el('img', {
        src: cover, alt: '', loading: 'lazy',
        class: 'absolute inset-0 h-full w-full object-cover',
        onError: (e) => e.target.remove(),
      }) : null,
      el('div', { class: 'absolute left-3 top-3' }, [scoreBadge(scored, 'sm')]),
      scored._source === 'user'
        ? el('div', { class: 'absolute right-3 top-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-white' }, 'Draft')
        : null,
      cover
        ? el('div', { class: 'absolute bottom-3 left-3 rounded-md bg-white/85 px-2 py-0.5 text-xs font-semibold text-slate-700' }, scored.neighborhood)
        : el('div', { class: 'absolute bottom-3 left-3 text-sm font-semibold text-slate-700/70' }, scored.neighborhood),
      photos.length > 1
        ? el('div', { class: 'absolute bottom-3 right-3 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white' }, `📷 ${photos.length}`)
        : null,
    ]),
    el('div', { class: 'p-4' }, [
      el('div', { class: 'flex items-baseline justify-between gap-2' }, [
        el('div', { class: 'text-lg font-bold text-slate-900' }, money(scored.rent)),
        el('div', { class: 'text-xs text-slate-500' }, `${beds(scored.beds)} · ${scored.baths} ba${scored.sqft > 0 ? ` · ${scored.sqft} sqft` : ''}`),
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
      scored.sqft > 0 ? el('div', { class: 'mt-2 text-xs text-slate-400' }, ppsfText(scored.rent, scored.sqft)) : null,
    ]),
  ]);
}

/* ===== assets/js/components/filters.js ===== */
// Filter + sort bar for the browse page. Pure UI: it renders from the filter
// state and calls onChange with a PATCH of only the fields that changed. The
// page owns the state (and merges patches into its current copy) plus the URL
// sync — the bar isn't re-rendered on every change, so it must not hold state.



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

async function homePage(root, ctx) {
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
      el('div', { class: 'text-sm font-semibold text-slate-800' }, [
        b.label,
        b.bonus ? el('span', { class: 'ml-1.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700' }, 'Bonus') : null,
      ]),
      el('div', { class: 'text-sm tabular-nums text-slate-500' }, b.bonus ? `+${b.points.toFixed(1)} / ${b.max}` : `${b.points.toFixed(1)} / ${b.max}`),
    ]),
    el('div', { class: 'mt-1.5' }, [bar(b.points, b.max)]),
    el('div', { class: 'mt-1 text-xs text-slate-500' }, b.detail),
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
  const credit = el('p', { class: 'mt-2 text-xs text-slate-400' }, [
    'Source: ',
    el('a', { href: MARKET.sourceUrl, target: '_blank', rel: 'noopener', class: 'underline hover:text-slate-600' }, 'StreetEasy Data Dashboard'),
    s.benchmarkMonth ? `, ${s.benchmarkMonth}` : '',
    '.',
  ]);
  if (!b) {
    return el('div', {}, [
      el('p', { class: 'mt-2 text-xs text-slate-500' }, MARKET.areas.length
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
  // Score everything so the location map can show neighbors' scores too.
  const scored = scoreAll(all);
  const s = scored.find((l) => l.id === raw.id);
  const t = toneOf(s.grade);
  const accent = HERO_ACCENT[s.accent] || HERO_ACCENT.sky;
  const externalUrl = s.url ? httpUrl(s.url) : null;
  const areaHash = `#/?city=${encodeURIComponent(s.citySlug)}&neighborhood=${encodeURIComponent(s.neighborhoodSlug)}`;
  const locMap = hasLocation(s) ? listingsMap({ heightClass: 'h-64' }) : null;

  const savingsBanner = s.monthlySavings != null
    ? el('div', {
      class: 'rounded-xl px-4 py-3 text-sm font-medium ' +
        (s.monthlySavings > 30 ? 'bg-emerald-50 text-emerald-700'
          : s.monthlySavings < -30 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'),
    },
    s.monthlySavings > 30
      ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo below StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s (~${money(s.monthlySavings * 12)}/yr).`
      : s.monthlySavings < -30
        ? `Priced about ${money(Math.abs(s.monthlySavings))}/mo above StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s.`
        : `Priced right around StreetEasy's median for ${s.benchmark.area.name} ${bedLabel(bedClass(s.beds))}s.`)
    : null;

  const amenityGrid = el('div', { class: 'grid grid-cols-2 gap-2 sm:grid-cols-3' },
    (s.amenities || []).map((k) => {
      const a = amenity(k);
      return el('div', { class: 'flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700' },
        [el('span', {}, a.icon), el('span', {}, a.label)]);
    }));

  const page = el('div', { class: 'mx-auto max-w-5xl px-4 py-6' }, [
    el('a', { href: '#/', class: 'mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800' }, '← Back to results'),
    // Photos when the listing has them; otherwise the colored placeholder.
    photoUrls(s).length
      ? el('div', { class: 'mb-5' }, [photoGallery(s)])
      : el('div', { class: `relative mb-5 h-56 overflow-hidden rounded-2xl bg-gradient-to-br ${accent}` }, [
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
            s.sqft > 0 ? el('div', { class: 'text-xs text-slate-400' }, ppsfText(s.rent, s.sqft)) : null,
          ]),
        ]),
        el('div', { class: 'mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4' }, [
          fact('Type', bedsLong(s.beds)),
          fact('Bathrooms', String(s.baths)),
          fact('Size', s.sqft > 0 ? `${s.sqft} sqft` : 'Not listed'),
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
        locMap ? el('h2', { class: 'mt-6 text-lg font-bold text-slate-900' }, 'Location') : null,
        locMap ? el('div', { class: 'mt-2' }, [locMap.node]) : null,
        locMap ? el('p', { class: 'mt-1 text-xs text-slate-400' },
          `Pins show Deal Scores. Other ${s.city} listings are faded; click one to compare.`) : null,
      ]),

      // Score sidebar
      el('div', { class: 'lg:col-span-1' }, [
        el('div', { class: 'rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'flex items-center justify-between' }, [
            el('h2', { class: 'text-sm font-bold uppercase tracking-wide text-slate-500' }, 'Deal Score'),
          ]),
          el('div', { class: 'mt-3' }, [scoreBadge(s, 'lg')]),
          el('div', { class: 'mt-4 divide-y divide-slate-100' }, s.breakdown.map(breakdownRow)),
          el('a', { href: '#/methodology', class: 'mt-4 inline-block text-xs text-emerald-600 underline' },
            'How is this calculated?'),
        ]),
        el('div', { class: 'mt-4 rounded-2xl border border-slate-200 bg-white p-5' }, [
          el('div', { class: 'text-xs text-slate-400' }, 'Typical rent (StreetEasy median)'),
          el('div', { class: 'text-xl font-bold text-slate-900' }, s.fairRent != null ? `${money(s.fairRent)}/mo` : '—'),
          benchmarkExplainer(s),
          externalUrl
            ? el('a', { href: externalUrl, target: '_blank', rel: 'noopener', class: 'mt-3 block rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white' }, 'View original listing')
            : null,
          el('a', {
            href: areaHash,
            class: 'mt-2 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50',
          }, `More in ${s.neighborhood}`),
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
  ['Amenity richness', '22 pts', 'Each amenity carries a weight reflecting how much renters typically pay for it (laundry, parking, central A/C and outdoor space move rent the most). A well-equipped doorman building earns full marks.'],
  ['In-unit laundry', '10 pts', 'Called out on its own because it\'s one of the most-requested features. In-unit washer/dryer earns full marks; shared in-building laundry earns half.'],
  ['Condition & extras', '8 pts', 'Recent renovation or newer construction, included utilities, and move-in concessions each add points.'],
  ['Space bonus', 'up to +10', 'Only when the listing gives its square footage. A unit 30% or more bigger than a typical NYC apartment of its size earns the full bonus. Smaller units, and listings without square footage, simply get no bonus. The total is capped at 100.'],
];

function row([label, pts, desc]) {
  return el('div', { class: 'border-t border-slate-100 py-4' }, [
    el('div', { class: 'flex items-baseline justify-between gap-3' }, [
      el('div', { class: 'font-semibold text-slate-800' }, label),
      el('div', { class: 'whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-bold text-emerald-700' }, pts),
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
const methodLink = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', class: 'text-emerald-700 underline' }, text);

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

    el('p', { class: 'mt-6 text-xs text-slate-400' },
      'Weights are tunable in assets/js/core/score.js and assets/js/data/amenities.js. DealScore is not affiliated with StreetEasy.'),
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

function addPage(root) {
  function render(message) {
    const form = el('form', { class: 'grid grid-cols-1 gap-4 sm:grid-cols-2' }, [
      field('Title', input('title', { required: 'required', placeholder: 'Sunny Astoria 1BR' })),
      field('Street address', input('address', { placeholder: '30-14 31st St' })),
      field('Latitude (optional, for the map)', input('lat', { type: 'number', step: 'any', min: '-90', max: '90', placeholder: '40.7679' })),
      field('Longitude (optional, for the map)', input('lng', { type: 'number', step: 'any', min: '-180', max: '180', placeholder: '-73.9205' })),
      field('Borough', input('city', { required: 'required', placeholder: 'Queens', list: 'se-boroughs', autocomplete: 'off' })),
      field('Neighborhood (StreetEasy name)', input('neighborhood', {
        required: 'required', placeholder: 'Astoria', list: 'se-neighborhoods', autocomplete: 'off',
        onChange: (e) => fillBorough(e.target),
      })),
      field('Monthly rent ($)', input('rent', { type: 'number', required: 'required', min: '0', step: '25' })),
      field('Square feet (optional, earns the space bonus)', input('sqft', { type: 'number', min: '0', step: '10' })),
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
        rent: Number(fd.get('rent')), sqft: Number(fd.get('sqft')) || null,
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
        'Enter an apartment you\'re considering to see its Deal Score against StreetEasy\'s median asking rent for its neighborhood and size. ' +
        'Listings are stored locally; export them as JSON to commit into the data file or load into a live backend.'),
      message ? el('div', { class: 'mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700' }, [
        message, ' ', el('a', { href: '#/', class: 'underline' }, 'Go to Browse →'),
      ]) : null,
      el('div', { class: 'mt-5 rounded-2xl border border-slate-200 bg-white p-5' }, [form, marketDatalists()]),
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
