// Deal Score engine tests. Uses Node's built-in test runner — no npm install:
//
//   node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scoreListing, benchmarkFor, grade, bedClass, TYPICAL_SQFT } from '../assets/js/core/score.js';
import { MARKET } from '../assets/js/data/market.js';

// A small StreetEasy-shaped market: city → borough → submarket → neighborhood.
const market = {
  source: 'StreetEasy', sourceUrl: 'https://streeteasy.com/blog/data-dashboard', asOf: '2026-10',
  areas: [
    { slug: 'nyc', name: 'NYC', type: 'city', borough: null, parent: null, rents: { 0: 3200, 1: 4000, 2: 5000, 3: 6000 } },
    { slug: 'queens', name: 'Queens', type: 'borough', borough: 'Queens', parent: 'nyc', rents: { 0: 2500, 1: 3000, 2: 3600 } },
    { slug: 'northwest-queens', name: 'Northwest Queens', type: 'submarket', borough: 'Queens', parent: 'queens', rents: { 0: 2600, 1: 3100, 2: 3700 } },
    { slug: 'astoria', name: 'Astoria', type: 'neighborhood', borough: 'Queens', parent: 'northwest-queens', rents: { 1: 2800 } },
    { slug: 'bedford-stuyvesant', name: 'Bedford-Stuyvesant', type: 'neighborhood', borough: 'Brooklyn', parent: 'brooklyn', rents: { 1: 3000 } },
    { slug: 'brooklyn', name: 'Brooklyn', type: 'borough', borough: 'Brooklyn', parent: 'nyc', rents: { 1: 3600 } },
  ],
};

let seq = 0;
function unit(overrides) {
  seq += 1;
  return {
    id: `t-${seq}`, title: 'Test unit', address: '',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    rent: 2800, sqft: null, beds: 1, baths: 1, yearBuilt: 1950, renovated: false,
    available: '2027-01-01', petPolicy: 'none', utilitiesIncluded: [], concession: '',
    amenities: [], accent: 'sky',
    ...overrides,
  };
}

test('uses the neighborhood median when StreetEasy publishes one', () => {
  const b = benchmarkFor(unit({}), market);
  assert.equal(b.rent, 2800);
  assert.equal(b.level, 'neighborhood');
  assert.equal(b.confidence, 'high');
  assert.equal(b.asOf, '2026-10');
});

test('falls back to submarket, then borough, then city for a missing size', () => {
  const twoBed = benchmarkFor(unit({ beds: 2 }), market);
  assert.equal(twoBed.area.slug, 'northwest-queens');
  assert.equal(twoBed.confidence, 'medium');

  const unknownNbhd = benchmarkFor(unit({ neighborhood: 'Ridgewood', neighborhoodSlug: 'ridgewood' }), market);
  assert.equal(unknownNbhd.area.slug, 'queens');
  assert.equal(unknownNbhd.confidence, 'low');
  assert.equal(unknownNbhd.matchedNeighborhood, null);

  const threeBed = benchmarkFor(unit({ beds: 4 }), market);
  assert.equal(threeBed.area.slug, 'nyc', '4 beds counts as 3+, which only the city publishes here');
});

test('matches common short names to StreetEasy neighborhood names', () => {
  const b = benchmarkFor(unit({ city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy' }), market);
  assert.equal(b.area.name, 'Bedford-Stuyvesant');
});

test('price: at the median earns half the price points; 25% below earns all', () => {
  const at = scoreListing(unit({ rent: 2800 }), market);
  assert.equal(at.breakdown.find((b) => b.key === 'price').points, 30);
  assert.equal(at.monthlySavings, 0);

  const cheap = scoreListing(unit({ rent: 2240 }), market); // 2800 / 2240 = 1.25
  assert.equal(cheap.breakdown.find((b) => b.key === 'price').points, 60);
  assert.equal(cheap.monthlySavings, 560);
});

test('no benchmark (nothing imported) → neutral price score, no savings', () => {
  const s = scoreListing(unit({}), { ...market, areas: [] });
  assert.equal(s.benchmark, null);
  assert.equal(s.fairRent, null);
  assert.equal(s.monthlySavings, null);
  assert.equal(s.breakdown.find((b) => b.key === 'price').points, 30);
});

test('space bonus is optional: none without sqft, never negative, capped at +10', () => {
  const pts = (sqft) => scoreListing(unit({ sqft }), market).breakdown.find((b) => b.key === 'space').points;
  assert.equal(pts(null), 0);
  assert.equal(pts(300), 0, 'a small unit gets no bonus, not a penalty');
  assert.equal(pts(TYPICAL_SQFT[1]), 0);
  assert.ok(Math.abs(pts(TYPICAL_SQFT[1] * 1.15) - 5) < 1e-9, '15% bigger than typical earns half the bonus');
  assert.equal(pts(TYPICAL_SQFT[1] * 3), 10);

  const without = scoreListing(unit({ sqft: null }), market).dealScore;
  const tiny = scoreListing(unit({ sqft: 300 }), market).dealScore;
  assert.equal(without, tiny, 'listing square footage never hurts the score');
});

test('total is capped at 100 even with the bonus', () => {
  const s = scoreListing(unit({
    rent: 1500, sqft: 2000, renovated: true, utilitiesIncluded: ['heat', 'hot water', 'gas'], concession: '1 month free',
    amenities: ['in_unit_laundry', 'parking', 'central_ac', 'dishwasher', 'outdoor_space', 'pet_friendly', 'gym', 'doorman', 'elevator'],
  }), market);
  assert.equal(s.dealScore, 100);
});

test('breakdown sums to the score', () => {
  const s = scoreListing(unit({ rent: 3100, sqft: 820, amenities: ['dishwasher', 'in_building_laundry'], renovated: true }), market);
  const total = s.breakdown.reduce((t, b) => t + b.points, 0);
  assert.ok(Math.abs(Math.round(total) - s.dealScore) <= 1);
});

test('bed classes follow StreetEasy: studio, 1, 2, 3+', () => {
  assert.deepEqual([0, 1, 2, 3, 5].map(bedClass), [0, 1, 2, 3, 3]);
});

test('bundled market data has the expected shape', () => {
  assert.equal(MARKET.source, 'StreetEasy');
  assert.ok(Array.isArray(MARKET.areas));
  for (const a of MARKET.areas) {
    assert.ok(a.slug && a.name && a.type, `area ${JSON.stringify(a).slice(0, 80)}`);
    assert.ok(['neighborhood', 'submarket', 'borough', 'city'].includes(a.type));
  }
});

test('grade thresholds', () => {
  assert.equal(grade(80).label, 'Great Deal');
  assert.equal(grade(79.4).label, 'Good Deal');
  assert.equal(grade(65).label, 'Good Deal');
  assert.equal(grade(50).label, 'Fair Price');
  assert.equal(grade(35).label, 'Below Average');
  assert.equal(grade(34).label, 'Overpriced');
});
