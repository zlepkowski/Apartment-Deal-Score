// Amenity catalog. Each amenity carries a `weight` reflecting how much renters
// value it (loosely calibrated to rent-premium research — laundry, parking,
// outdoor space, and central air tend to move rent the most). The scoring
// engine sums these weights to produce an amenity richness score.
//
// `key` is what listings store in their `amenities` array.

export const AMENITIES = [
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

export function amenity(key) {
  return BY_KEY[key] || { key, label: key, icon: '•', weight: 1, group: 'Other' };
}

// Total weight of an amenity list — the raw amenity richness of a unit.
export function amenityWeight(keys = []) {
  return keys.reduce((s, k) => s + (BY_KEY[k] ? BY_KEY[k].weight : 0), 0);
}

// Sum of all possible amenity weights — used to normalize.
export const MAX_AMENITY_WEIGHT = AMENITIES.reduce((s, a) => s + a.weight, 0);
