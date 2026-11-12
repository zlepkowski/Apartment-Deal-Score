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

import { ppsf } from '../util/format.js';
import { amenityWeight } from '../data/amenities.js';
import { median, clamp, remap, range } from '../util/stats.js';

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

export function grade(score) {
  if (score >= 80) return { label: 'Great Deal', tone: 'great' };
  if (score >= 65) return { label: 'Good Deal', tone: 'good' };
  if (score >= 50) return { label: 'Fair Price', tone: 'fair' };
  if (score >= 35) return { label: 'Below Average', tone: 'below' };
  return { label: 'Overpriced', tone: 'poor' };
}

// --- public API -------------------------------------------------------------

export function scoreListing(listing, all) {
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

export function scoreAll(all) {
  return all.map((l) => scoreListing(l, all));
}
