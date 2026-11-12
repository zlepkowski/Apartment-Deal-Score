// Deal Score engine tests. Uses Node's built-in test runner — no npm install:
//
//   node --test tests/

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scoreAll, scoreListing, priceAnchor, grade } from '../assets/js/core/score.js';
import { SEED_LISTINGS } from '../assets/js/data/listings.js';
import { AMENITIES } from '../assets/js/data/amenities.js';

let seq = 0;
function unit(overrides) {
  seq += 1;
  return {
    id: `t-${seq}`, title: 'Test unit', address: '',
    city: 'Testville', citySlug: 'testville',
    neighborhood: 'Center', neighborhoodSlug: 'center',
    rent: 2000, sqft: 600, beds: 1, baths: 1, yearBuilt: 1950, renovated: false,
    available: '2027-01-01', petPolicy: 'none', utilitiesIncluded: [], concession: '',
    amenities: [], accent: 'sky',
    ...overrides,
  };
}

// n units at a given $/sqft in one neighborhood/size class.
function block(n, ppsf, overrides = {}) {
  const sqft = overrides.sqft || 600;
  return Array.from({ length: n }, () => unit({ ...overrides, sqft, rent: Math.round(ppsf * sqft) }));
}

test('every seed listing gets a bounded score, grade, and anchor', () => {
  const scored = scoreAll(SEED_LISTINGS);
  assert.equal(scored.length, SEED_LISTINGS.length);
  for (const s of scored) {
    assert.ok(Number.isInteger(s.dealScore) && s.dealScore >= 0 && s.dealScore <= 100, `${s.id} score ${s.dealScore}`);
    assert.ok(s.grade && s.grade.label, `${s.id} grade`);
    assert.ok(s.fairRent > 0, `${s.id} fairRent`);
    assert.ok(['high', 'medium', 'low'].includes(s.priceConfidence), `${s.id} confidence`);
    const total = s.breakdown.reduce((t, b) => t + b.points, 0);
    assert.ok(Math.abs(Math.round(total) - s.dealScore) <= 1, `${s.id} breakdown sums to score`);
  }
});

test('seed data is well-formed', () => {
  const keys = new Set(AMENITIES.map((a) => a.key));
  const ids = new Set();
  for (const l of SEED_LISTINGS) {
    assert.ok(!ids.has(l.id), `duplicate id ${l.id}`);
    ids.add(l.id);
    for (const a of l.amenities) assert.ok(keys.has(a), `${l.id}: unknown amenity ${a}`);
    assert.ok(Number.isFinite(l.lat) && Number.isFinite(l.lng), `${l.id}: missing coordinates`);
  }
});

test('a listing is never its own comparable', () => {
  const a = unit({ rent: 1000 });
  const b = unit({ rent: 2000 });
  const c = unit({ rent: 3000 });
  const s = scoreListing(a, [a, b, c]);
  // Two other units at $3.33 and $5.00/sqft, both local: the anchor must not
  // include a's own $1.67/sqft.
  assert.equal(s.priceAnchor.local.count, 2);
  assert.ok(s.priceAnchor.local.ppsf > 4, `local median ${s.priceAnchor.local.ppsf}`);
});

test('a lone listing in a new city has no anchor and a neutral price score', () => {
  const solo = unit({ citySlug: 'nowhere', city: 'Nowhere' });
  const s = scoreListing(solo, [solo, ...block(5, 5)]);
  assert.equal(s.priceAnchor, null);
  assert.equal(s.fairRent, null);
  assert.equal(s.breakdown[0].points, 25);
});

test('a well-covered neighborhood is anchored on its own comps', () => {
  const nbhd = block(8, 5, { neighborhoodSlug: 'center' });
  const rest = block(8, 3, { neighborhoodSlug: 'outskirts', neighborhood: 'Outskirts' });
  const subject = unit({ rent: 3000 }); // $5.00/sqft
  const a = priceAnchor(subject, [subject, ...nbhd, ...rest]);
  assert.equal(a.confidence, 'high');
  assert.ok(Math.abs(a.ppsf - 5) < 0.25, `anchor ${a.ppsf} should be ≈ $5.00`);
});

test('thin neighborhood: savings are not inflated by a pricier borough', () => {
  // Luxury-heavy borough at $6/sqft; the subject's budget neighborhood has
  // only one other same-size unit, plus some 2BRs, all around $3/sqft.
  const lux = block(10, 6, { neighborhoodSlug: 'lux', neighborhood: 'Lux' });
  const lux2 = block(6, 5.5, { neighborhoodSlug: 'lux', neighborhood: 'Lux', beds: 2, sqft: 900 });
  const budget1 = block(1, 3.1, { neighborhoodSlug: 'budget', neighborhood: 'Budget' });
  const budget2 = block(3, 2.8, { neighborhoodSlug: 'budget', neighborhood: 'Budget', beds: 2, sqft: 900 });
  const subject = unit({ neighborhoodSlug: 'budget', neighborhood: 'Budget', rent: 1800 }); // $3.00/sqft
  const all = [subject, ...lux, ...lux2, ...budget1, ...budget2];

  const s = scoreListing(subject, all);
  // A naive borough-wide 1BR median ($6/sqft) would claim ~$1,800/mo savings.
  assert.ok(s.monthlySavings < 600, `savings ${s.monthlySavings} should be modest`);
  assert.ok(s.priceAnchor.location.factor < 0.8, `budget neighborhood should price below the borough (${s.priceAnchor.location.factor})`);
  assert.equal(s.priceConfidence, 'medium');
});

test('an empty size class widens to neighboring sizes, not all sizes', () => {
  // Plenty of studios at $8/sqft, 2BRs at $4/sqft, one 3BR.
  const studios = block(6, 8, { beds: 0, sqft: 400 });
  const twos = block(6, 4, { beds: 2, sqft: 900 });
  const subject = unit({ beds: 3, sqft: 1200, rent: 4800 }); // $4.00/sqft
  const a = priceAnchor(subject, [subject, ...studios, ...twos]);
  assert.equal(a.market.tier, 'near-beds');
  assert.ok(Math.abs(a.ppsf - 4) < 0.3, `anchor ${a.ppsf} should track 2BRs, not studios`);
  assert.equal(a.confidence, 'low');
});

test('grade thresholds', () => {
  assert.equal(grade(80).label, 'Great Deal');
  assert.equal(grade(79.4).label, 'Good Deal');
  assert.equal(grade(65).label, 'Good Deal');
  assert.equal(grade(50).label, 'Fair Price');
  assert.equal(grade(35).label, 'Below Average');
  assert.equal(grade(34).label, 'Overpriced');
});
