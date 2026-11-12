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

export const SEED_LISTINGS = [
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
