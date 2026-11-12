// Amenity catalog. Each amenity carries a hand-set `weight`: how much it adds
// to the amenity score. In-unit laundry, parking, central A/C, dishwashers and
// outdoor space weigh the most. The weights are a judgment call, not fitted to
// rent data; tune them here.
//
// `key` is what listings store in their `amenities` array; `group` organizes
// the add-listing form.

export const AMENITIES = [
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

export function amenity(key) {
  return BY_KEY[key] || { key, label: key, weight: 1, group: 'Other' };
}

// Total weight of an amenity list — the raw amenity richness of a unit.
export function amenityWeight(keys = []) {
  return keys.reduce((s, k) => s + (BY_KEY[k] ? BY_KEY[k].weight : 0), 0);
}

// Sum of all possible amenity weights — used to normalize.
export const MAX_AMENITY_WEIGHT = AMENITIES.reduce((s, a) => s + a.weight, 0);
