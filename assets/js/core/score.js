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

import { amenityWeight } from '../data/amenities.js';
import { MARKET } from '../data/market.js';
import { clamp, remap } from '../util/stats.js';

const WEIGHTS = { price: 60, amenities: 22, laundry: 10, quality: 8 };
const SPACE_BONUS_MAX = 10;

// Amenity richness that earns full marks. A doorman building with in-unit
// laundry, A/C, gym and outdoor space lands around here.
const AMENITY_FULL_MARKS = 45;

// Typical NYC apartment size by bedroom count, used only for the space bonus.
// NOT StreetEasy data (StreetEasy doesn't publish sizes): rounded from
// RentCafe's NYC listing averages —
// https://www.rentcafe.com/average-rent-market-trends/us/ny/new-york-city/
export const TYPICAL_SQFT = { 0: 480, 1: 700, 2: 960, 3: 1240 };

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

// A median from a handful of listings is noise (StreetEasy's Oct 2026 Nolita
// studio median is one $9,500 listing). Below MIN_LISTINGS, a neighborhood's
// figure is skipped in favor of the wider area; under HIGH_CONFIDENCE_LISTINGS
// it's used but labelled medium confidence. Boroughs and the city always have
// enough listings, so the threshold only applies below borough level.
export const MIN_LISTINGS = 10;
export const HIGH_CONFIDENCE_LISTINGS = 30;

export function bedLabel(n) {
  return n === 0 ? 'studio' : n >= 3 ? '3+ bed' : `${n}-bed`;
}

// StreetEasy groups 3+ bedrooms together.
export function bedClass(beds) {
  return Math.max(0, Math.min(3, Math.round(Number(beds) || 0)));
}

export function slugify(s) {
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
export function areaChain(listing, market = MARKET) {
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
export function benchmarkFor(listing, market = MARKET) {
  const beds = bedClass(listing.beds);
  const { chain, matchedNeighborhood } = areaChain(listing, market);
  let thin = null; // the first more-specific figure skipped for too few listings
  for (const area of chain) {
    const rent = area.rents && area.rents[beds];
    if (!(rent > 0)) continue;
    const listings = area.counts ? area.counts[beds] ?? null : null;
    const local = area.type === 'neighborhood' || area.type === 'submarket';
    if (local && listings != null && listings < MIN_LISTINGS) {
      if (!thin) thin = { name: area.name, rent, listings };
      continue;
    }
    let confidence = CONFIDENCE_BY_LEVEL[area.type] || 'low';
    if (area.type === 'neighborhood' && listings != null && listings < HIGH_CONFIDENCE_LISTINGS) confidence = 'medium';
    return {
      rent,
      beds,
      area: { slug: area.slug, name: area.name, type: area.type },
      level: area.type,
      listings,
      confidence,
      thin,
      matchedNeighborhood: matchedNeighborhood ? matchedNeighborhood.name : null,
      asOf: market.asOf,
    };
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

export function grade(score) {
  if (score >= 80) return { label: 'Great Deal', tone: 'great' };
  if (score >= 65) return { label: 'Good Deal', tone: 'good' };
  if (score >= 50) return { label: 'Fair Price', tone: 'fair' };
  if (score >= 35) return { label: 'Below Average', tone: 'below' };
  return { label: 'Overpriced', tone: 'poor' };
}

// --- public API -------------------------------------------------------------

export function monthLabel(asOf) {
  if (!asOf) return '';
  const [y, m] = asOf.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function scoreListing(listing, market = MARKET) {
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

export function scoreAll(all, market = MARKET) {
  return all.map((l) => scoreListing(l, market));
}
