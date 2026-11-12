// ===========================================================================
// DEAL SCORE ENGINE
// ===========================================================================
// A listing's Deal Score (0–100) answers one question: "How much apartment do
// you get for the price, compared to similar units nearby?"
//
// It is COMPARABLE-BASED — the industry-standard approach. Each listing is
// compared with other units in the same city (a borough, for NYC) and, where
// there's enough data, the same neighborhood and bedroom count. It is scored
// on five transparent components:
//
//   Price vs comps ($/sqft) ............ 50 pts   (the big one)
//   Amenity richness ................... 22 pts
//   In-unit laundry .................... 10 pts
//   Space (sqft vs comps) .............. 10 pts
//   Quality & extras (reno/utils/promo)   8 pts
//                                        ------
//                                        100 pts
//
// A listing is never its own comparable: with small comp sets that would pull
// the "typical" price toward the listing's own rent.
//
// The price component compares the listing's $/sqft with a "typical $/sqft"
// anchor (see priceAnchor). The anchor blends the neighborhood's own
// same-size comps with a borough-wide estimate adjusted for the neighborhood,
// so thin markets don't produce wild savings figures.
//
// Every page reads scores through `scoreAll()` / `scoreListing()`, and the
// detail page renders the per-component breakdown so the score is never a
// black box.

import { ppsf } from '../util/format.js';
import { amenityWeight } from '../data/amenities.js';
import { median, clamp, remap, range } from '../util/stats.js';

const WEIGHTS = { price: 50, amenities: 22, laundry: 10, space: 10, quality: 8 };
const MIN_COMPS = 3;

// Sparse-market tuning for the price anchor.
//
// NBHD_PRIOR: how many same-neighborhood, same-size comps it takes before they
//   count as much as the borough-wide estimate. With 2: one comp → 33%
//   neighborhood, two → 50%, six → 75%.
// LOCATION_PRIOR: a pseudo-count that pulls a neighborhood's price level toward
//   the borough average (1.0×) when the neighborhood has only a few listings.
const NBHD_PRIOR = 2;
const LOCATION_PRIOR = 1;

const unitPpsf = (l) => ppsf(l.rent, l.sqft);

export function bedLabel(n) {
  return n === 0 ? 'studio' : `${n}-bed`;
}

// Every scorable listing in the same city/borough, excluding the listing itself.
function peersOf(listing, all) {
  return all.filter((l) =>
    l !== listing && l.id !== listing.id &&
    l.citySlug === listing.citySlug && l.sqft > 0 && l.rent > 0);
}

// Comp set for the amenity and space components: the tightest set with enough
// members — neighborhood+beds → city+beds → city (any beds).
function buildCompSet(listing, peers) {
  const nbhd = peers.filter((l) => l.neighborhoodSlug === listing.neighborhoodSlug && l.beds === listing.beds);
  if (nbhd.length >= MIN_COMPS) {
    return { comps: nbhd, basis: `${listing.neighborhood} ${bedLabel(listing.beds)} units`, tightness: 'neighborhood' };
  }
  const cityBeds = peers.filter((l) => l.beds === listing.beds);
  if (cityBeds.length >= MIN_COMPS) {
    return { comps: cityBeds, basis: `${listing.city} ${bedLabel(listing.beds)} units`, tightness: 'city-beds' };
  }
  if (peers.length >= MIN_COMPS) {
    return { comps: peers, basis: `${listing.city} rentals (mixed sizes)`, tightness: 'city' };
  }
  return { comps: peers, basis: `${listing.city} rentals`, tightness: 'sparse' };
}

// --- price anchor -----------------------------------------------------------

// Typical $/sqft for a bedroom count across the whole city/borough. If that
// size class is thin, widen to neighboring sizes (±1 bedroom), then all sizes.
function marketPpsf(beds, peers, city) {
  const tiers = [
    { tier: 'beds', pick: (p) => p.beds === beds, basis: `${city} ${bedLabel(beds)} units` },
    { tier: 'near-beds', pick: (p) => Math.abs(p.beds - beds) <= 1, basis: `${city} units within one bedroom of this size` },
    { tier: 'all', pick: () => true, basis: `${city} rentals (all sizes)` },
  ];
  for (const t of tiers) {
    const set = peers.filter(t.pick);
    if (set.length >= MIN_COMPS || (t.tier === 'all' && set.length)) {
      return { ppsf: median(set.map(unitPpsf)), count: set.length, basis: t.basis, tier: t.tier };
    }
  }
  return null;
}

// How expensive this neighborhood runs relative to its borough, mix-adjusted:
// each neighborhood unit is compared with the borough market for ITS size, and
// we take the median ratio. Few listings → shrunk toward 1.0 (borough average).
function locationFactor(listing, peers, market) {
  const nbhd = peers.filter((p) => p.neighborhoodSlug === listing.neighborhoodSlug);
  const ratios = nbhd
    .map((p) => {
      const m = market(p.beds);
      return m && m.ppsf ? unitPpsf(p) / m.ppsf : null;
    })
    .filter((r) => r != null && Number.isFinite(r));
  if (!ratios.length) return { factor: 1, raw: null, count: 0 };
  const raw = median(ratios);
  const n = ratios.length;
  return { factor: (n * raw + LOCATION_PRIOR) / (n + LOCATION_PRIOR), raw, count: n };
}

// The "typical $/sqft" a comparable unit would rent for. Blends two estimates:
//   local    median $/sqft of same-size units in the same neighborhood
//   market   borough-wide same-size median × the neighborhood's price level
// weighted by how many local comps exist, so one or two local listings can't
// swing the anchor on their own and an empty neighborhood still gets a sane
// estimate instead of falling back to a mixed luxury/budget citywide median.
export function priceAnchor(listing, all) {
  const peers = peersOf(listing, all);
  const cache = new Map();
  const market = (beds) => {
    if (!cache.has(beds)) cache.set(beds, marketPpsf(beds, peers, listing.city));
    return cache.get(beds);
  };

  const m = market(listing.beds);
  if (!m || !m.ppsf) return null;

  const location = locationFactor(listing, peers, market);
  const adjustedMarket = m.ppsf * location.factor;

  const local = peers.filter((p) => p.neighborhoodSlug === listing.neighborhoodSlug && p.beds === listing.beds);
  const localPpsf = median(local.map(unitPpsf));
  const n = local.length;
  const weight = n ? n / (n + NBHD_PRIOR) : 0;
  const anchorPpsf = n ? weight * localPpsf + (1 - weight) * adjustedMarket : adjustedMarket;

  let confidence = 'low';
  if (n >= MIN_COMPS) confidence = 'high';
  else if (n >= 1 || m.tier === 'beds') confidence = 'medium';

  return {
    ppsf: anchorPpsf,
    confidence,
    local: { ppsf: localPpsf, count: n },
    market: { ppsf: m.ppsf, count: m.count, basis: m.basis, tier: m.tier },
    location,
    adjustedMarketPpsf: adjustedMarket,
    weight,
  };
}

// --- individual component scorers ------------------------------------------

function scorePrice(listing, anchor) {
  const lp = unitPpsf(listing);
  if (!lp || !anchor) return { points: WEIGHTS.price / 2, ratio: 1, anchorPpsf: null, listingPpsf: lp };
  // ratio > 1 means cheaper per sqft than the typical comparable unit.
  const ratio = anchor.ppsf / lp;
  // Centered so "exactly typical" (ratio 1.0) scores half marks; ±25% spans the range.
  const points = remap(ratio, 0.75, 1.25, 0, WEIGHTS.price);
  return { points, ratio, anchorPpsf: anchor.ppsf, listingPpsf: lp };
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

export function grade(score) {
  if (score >= 80) return { label: 'Great Deal', tone: 'great' };
  if (score >= 65) return { label: 'Good Deal', tone: 'good' };
  if (score >= 50) return { label: 'Fair Price', tone: 'fair' };
  if (score >= 35) return { label: 'Below Average', tone: 'below' };
  return { label: 'Overpriced', tone: 'poor' };
}

// --- public API -------------------------------------------------------------

export function scoreListing(listing, all) {
  const peers = peersOf(listing, all);
  const { comps, basis, tightness } = buildCompSet(listing, peers);
  const anchor = priceAnchor(listing, all);

  const price = scorePrice(listing, anchor);
  const amenities = scoreAmenities(listing, comps);
  const laundry = scoreLaundry(listing);
  const space = scoreSpace(listing, comps);
  const quality = scoreQuality(listing);

  const total = clamp(
    price.points + amenities.points + laundry.points + space.points + quality.points,
    0,
    100,
  );

  // "Typical" rent for a comparable unit at this size — the market anchor.
  const fairRent = anchor ? anchor.ppsf * listing.sqft : null;
  const monthlySavings = fairRent != null ? fairRent - listing.rent : null;

  const breakdown = [
    {
      key: 'price', label: 'Price vs. comparable units', points: price.points, max: WEIGHTS.price,
      detail: price.listingPpsf && price.anchorPpsf
        ? `$${price.listingPpsf.toFixed(2)}/sqft vs. $${price.anchorPpsf.toFixed(2)}/sqft typical`
        : 'Not enough data',
    },
    {
      key: 'amenities', label: 'Amenities', points: amenities.points, max: WEIGHTS.amenities,
      detail: `${(listing.amenities || []).length} amenities (richness ${amenities.weight} vs. ${amenities.compMin}–${amenities.compMax} locally)`,
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
    priceAnchor: anchor,
    priceConfidence: anchor ? anchor.confidence : 'low',
    compBasis: basis,
    compCount: comps.length,
    compTightness: tightness,
    breakdown,
  };
}

export function scoreAll(all) {
  return all.map((l) => scoreListing(l, all));
}
