// Seed listings — illustrative New York City data so the Deal Score engine has
// enough comparable units to score against. Rents are realistic for late 2026
// but these are NOT real listings. Replace/extend them with your own (edit
// this file, use the in-app "Add Listing" form to export JSON, or wire a live
// backend via data/adapter.js).
//
// In NYC the borough is the "city" level of the comp hierarchy: a unit is
// compared with its neighborhood first, then with its borough — never with
// the whole city, which would mix Manhattan and Bronx pricing.
//
// Listing shape:
//   id            unique string
//   title         short headline
//   address       street line (display only)
//   city          display name (a borough for NYC)   citySlug   url-safe key
//   neighborhood  display name      neighborhoodSlug
//   lat, lng      optional coordinates (decimal degrees) — needed for the map
//   rent          monthly rent, USD
//   sqft          interior square feet
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

export const SEED_LISTINGS = [
  // =============================== MANHATTAN ===============================
  // ---------------------------- East Village ----------------------------
  {
    id: 'mn-ev-001', title: 'Renovated East Village 1BR', address: '312 E 6th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7268, lng: -73.9868,
    rent: 3850, sqft: 520, beds: 1, baths: 1, yearBuilt: 1910, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'rose',
  },
  {
    id: 'mn-ev-002', title: 'Sunny 1BR off Tompkins Square', address: '171 Avenue A',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7289, lng: -73.9817,
    rent: 3600, sqft: 560, beds: 1, baths: 1, yearBuilt: 1925, renovated: false,
    available: '2027-01-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'high_ceilings', 'in_building_laundry'], accent: 'amber',
  },
  {
    id: 'mn-ev-003', title: 'East Village 1BR w/ Washer/Dryer', address: '437 E 12th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7297, lng: -73.9822,
    rent: 4450, sqft: 600, beds: 1, baths: 1, yearBuilt: 2019, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'dishwasher', 'central_ac', 'elevator', 'stainless_appliances', 'rooftop', 'pet_friendly'], accent: 'sky',
  },
  {
    id: 'mn-ev-004', title: 'Compact 1BR on E 4th', address: '89 E 4th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7259, lng: -73.9893,
    rent: 3500, sqft: 450, beds: 1, baths: 1, yearBuilt: 1900, renovated: false,
    available: '2026-12-01', petPolicy: 'none', utilitiesIncluded: ['heat'], concession: '',
    amenities: ['hardwood'], accent: 'stone',
  },
  {
    id: 'mn-ev-005', title: 'Alphabet City Studio', address: '281 E 7th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7238, lng: -73.9785,
    rent: 2850, sqft: 380, beds: 0, baths: 1, yearBuilt: 1920, renovated: true,
    available: '2027-01-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'dishwasher', 'in_building_laundry'], accent: 'violet',
  },
  {
    id: 'mn-ev-006', title: 'Studio with Private Terrace', address: '520 E 5th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7237, lng: -73.9829,
    rent: 3300, sqft: 420, beds: 0, baths: 1, yearBuilt: 1915, renovated: true,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['outdoor_space', 'dishwasher', 'hardwood', 'in_building_laundry', 'pet_friendly'], accent: 'emerald',
  },
  {
    id: 'mn-ev-007', title: 'East Village 2BR Walk-up', address: '330 E 9th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'East Village', neighborhoodSlug: 'east-village',
    lat: 40.7286, lng: -73.9862,
    rent: 5300, sqft: 750, beds: 2, baths: 1, yearBuilt: 1915, renovated: true,
    available: '2027-02-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'indigo',
  },

  // ---------------------------- Upper West Side ----------------------------
  {
    id: 'mn-uws-001', title: 'Prewar 1BR near Riverside Park', address: '316 W 102nd St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Upper West Side', neighborhoodSlug: 'upper-west-side',
    lat: 40.7993, lng: -73.9703,
    rent: 3700, sqft: 640, beds: 1, baths: 1, yearBuilt: 1925, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'hardwood', 'pet_friendly'], accent: 'teal',
  },
  {
    id: 'mn-uws-002', title: 'Doorman 1BR on W 86th', address: '120 W 86th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Upper West Side', neighborhoodSlug: 'upper-west-side',
    lat: 40.7869, lng: -73.9737,
    rent: 4600, sqft: 680, beds: 1, baths: 1, yearBuilt: 1962, renovated: true,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['doorman', 'elevator', 'in_building_laundry', 'dishwasher', 'gym', 'pet_friendly'], accent: 'cyan',
  },
  {
    id: 'mn-uws-003', title: 'Brownstone 1BR on W 75th', address: '245 W 75th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Upper West Side', neighborhoodSlug: 'upper-west-side',
    lat: 40.7817, lng: -73.9832,
    rent: 3900, sqft: 560, beds: 1, baths: 1, yearBuilt: 1899, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat'], concession: '',
    amenities: ['hardwood', 'high_ceilings', 'dishwasher'], accent: 'lime',
  },
  {
    id: 'mn-uws-004', title: 'New-Build 1BR w/ In-Unit W/D', address: '155 W 92nd St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Upper West Side', neighborhoodSlug: 'upper-west-side',
    lat: 40.7905, lng: -73.9711,
    rent: 4950, sqft: 700, beds: 1, baths: 1, yearBuilt: 2019, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'elevator', 'doorman', 'gym', 'rooftop', 'stainless_appliances', 'pet_friendly'], accent: 'orange',
  },
  {
    id: 'mn-uws-005', title: 'Classic Prewar 2BR', address: '41 W 96th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Upper West Side', neighborhoodSlug: 'upper-west-side',
    lat: 40.7924, lng: -73.9660,
    rent: 6400, sqft: 1000, beds: 2, baths: 1.5, yearBuilt: 1928, renovated: true,
    available: '2027-01-15', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['doorman', 'elevator', 'in_building_laundry', 'dishwasher', 'hardwood', 'storage', 'pet_friendly'], accent: 'rose',
  },
  {
    id: 'mn-uws-006', title: 'Cozy UWS Studio', address: '44 W 69th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Upper West Side', neighborhoodSlug: 'upper-west-side',
    lat: 40.7750, lng: -73.9800,
    rent: 2750, sqft: 400, beds: 0, baths: 1, yearBuilt: 1910, renovated: false,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['in_building_laundry', 'hardwood'], accent: 'amber',
  },

  // ---------------------------- Harlem ----------------------------
  {
    id: 'mn-har-001', title: 'Renovated Harlem 1BR', address: '245 W 135th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Harlem', neighborhoodSlug: 'harlem',
    lat: 40.8159, lng: -73.9450,
    rent: 2950, sqft: 650, beds: 1, baths: 1, yearBuilt: 1910, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'sky',
  },
  {
    id: 'mn-har-002', title: 'Harlem New-Dev 1BR', address: '2280 Frederick Douglass Blvd',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Harlem', neighborhoodSlug: 'harlem',
    lat: 40.8090, lng: -73.9512,
    rent: 3450, sqft: 620, beds: 1, baths: 1, yearBuilt: 2021, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'elevator', 'gym', 'rooftop', 'stainless_appliances', 'pet_friendly'], accent: 'emerald',
  },
  {
    id: 'mn-har-003', title: 'Mount Morris Park 2BR', address: '112 W 120th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Harlem', neighborhoodSlug: 'harlem',
    lat: 40.8046, lng: -73.9475,
    rent: 3700, sqft: 900, beds: 2, baths: 1, yearBuilt: 1900, renovated: true,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'high_ceilings', 'dishwasher', 'in_unit_laundry', 'pet_friendly'], accent: 'violet',
  },
  {
    id: 'mn-har-004', title: 'Harlem 1BR Walk-up', address: '55 W 127th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: 'Harlem', neighborhoodSlug: 'harlem',
    lat: 40.8078, lng: -73.9432,
    rent: 2650, sqft: 600, beds: 1, baths: 1, yearBuilt: 1920, renovated: false,
    available: '2026-12-01', petPolicy: 'none', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'stone',
  },

  // ---------------------------- Hell's Kitchen ----------------------------
  {
    id: 'mn-hk-001', title: "Hell's Kitchen Doorman Studio", address: '520 W 43rd St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: "Hell's Kitchen", neighborhoodSlug: 'hells-kitchen',
    lat: 40.7608, lng: -73.9967,
    rent: 3750, sqft: 480, beds: 0, baths: 1, yearBuilt: 2017, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '2 months free on a 14-month lease',
    amenities: ['doorman', 'elevator', 'gym', 'pool', 'rooftop', 'in_building_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'pet_friendly'], accent: 'indigo',
  },
  {
    id: 'mn-hk-002', title: 'Walk-up 1BR on W 48th', address: '455 W 48th St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: "Hell's Kitchen", neighborhoodSlug: 'hells-kitchen',
    lat: 40.7633, lng: -73.9910,
    rent: 3300, sqft: 500, beds: 1, baths: 1, yearBuilt: 1920, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood'], accent: 'teal',
  },
  {
    id: 'mn-hk-003', title: "Hell's Kitchen 1BR w/ Balcony", address: '350 W 51st St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: "Hell's Kitchen", neighborhoodSlug: 'hells-kitchen',
    lat: 40.7638, lng: -73.9873,
    rent: 4700, sqft: 650, beds: 1, baths: 1, yearBuilt: 2015, renovated: false,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['elevator', 'doorman', 'in_building_laundry', 'dishwasher', 'central_ac', 'outdoor_space', 'gym', 'pet_friendly'], accent: 'cyan',
  },
  {
    id: 'mn-hk-004', title: '2BR above 9th Ave', address: '640 9th Ave',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: "Hell's Kitchen", neighborhoodSlug: 'hells-kitchen',
    lat: 40.7608, lng: -73.9915,
    rent: 4800, sqft: 780, beds: 2, baths: 1, yearBuilt: 1910, renovated: false,
    available: '2026-12-01', petPolicy: 'none', utilitiesIncluded: ['heat'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'lime',
  },
  {
    id: 'mn-hk-005', title: "Hell's Kitchen 1BR, Elevator Building", address: '410 W 53rd St',
    city: 'Manhattan', citySlug: 'manhattan', neighborhood: "Hell's Kitchen", neighborhoodSlug: 'hells-kitchen',
    lat: 40.7655, lng: -73.9885,
    rent: 3950, sqft: 580, beds: 1, baths: 1, yearBuilt: 1965, renovated: true,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'dishwasher', 'pet_friendly'], accent: 'orange',
  },

  // =============================== BROOKLYN ===============================
  // ---------------------------- Williamsburg ----------------------------
  {
    id: 'bk-wb-001', title: 'Williamsburg 1BR w/ Washer/Dryer', address: '180 N 7th St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7186, lng: -73.9575,
    rent: 4300, sqft: 650, beds: 1, baths: 1, yearBuilt: 2016, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'dishwasher', 'central_ac', 'stainless_appliances', 'elevator', 'rooftop', 'pet_friendly'], accent: 'rose',
  },
  {
    id: 'bk-wb-002', title: 'South Williamsburg Railroad 1BR', address: '160 Havemeyer St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7119, lng: -73.9577,
    rent: 3100, sqft: 600, beds: 1, baths: 1, yearBuilt: 1910, renovated: false,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood'], accent: 'amber',
  },
  {
    id: 'bk-wb-003', title: 'Waterfront Tower 1BR', address: '85 Kent Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7222, lng: -73.9583,
    rent: 5100, sqft: 700, beds: 1, baths: 1, yearBuilt: 2020, renovated: false,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['doorman', 'elevator', 'gym', 'pool', 'rooftop', 'in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'outdoor_space', 'pet_friendly'], accent: 'sky',
  },
  {
    id: 'bk-wb-004', title: 'Bedford Ave 1BR', address: '312 Bedford Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7130, lng: -73.9619,
    rent: 3650, sqft: 580, beds: 1, baths: 1, yearBuilt: 1931, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'in_building_laundry'], accent: 'emerald',
  },
  {
    id: 'bk-wb-005', title: 'Williamsburg Loft Studio', address: '75 N 11th St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7220, lng: -73.9566,
    rent: 3250, sqft: 520, beds: 0, baths: 1, yearBuilt: 2008, renovated: false,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'high_ceilings', 'dishwasher', 'central_ac', 'pet_friendly'], accent: 'violet',
  },
  {
    id: 'bk-wb-006', title: 'Williamsburg 2BR w/ Balcony', address: '286 Union Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7095, lng: -73.9510,
    rent: 5200, sqft: 850, beds: 2, baths: 1, yearBuilt: 2014, renovated: false,
    available: '2027-01-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'dishwasher', 'central_ac', 'outdoor_space', 'stainless_appliances', 'elevator', 'pet_friendly'], accent: 'indigo',
  },
  {
    id: 'bk-wb-007', title: 'Grand St 2BR', address: '395 Grand St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Williamsburg', neighborhoodSlug: 'williamsburg',
    lat: 40.7120, lng: -73.9540,
    rent: 4400, sqft: 820, beds: 2, baths: 1, yearBuilt: 1920, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'stone',
  },

  // ---------------------------- Bushwick ----------------------------
  {
    id: 'bk-bw-001', title: 'Bushwick 1BR near the L', address: '245 Starr St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bushwick', neighborhoodSlug: 'bushwick',
    lat: 40.7052, lng: -73.9225,
    rent: 2850, sqft: 620, beds: 1, baths: 1, yearBuilt: 1931, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'teal',
  },
  {
    id: 'bk-bw-002', title: 'New-Build 1BR w/ Washer/Dryer', address: '87 Wilson Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bushwick', neighborhoodSlug: 'bushwick',
    lat: 40.7012, lng: -73.9230,
    rent: 3250, sqft: 600, beds: 1, baths: 1, yearBuilt: 2022, renovated: false,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'elevator', 'rooftop', 'stainless_appliances', 'pet_friendly'], accent: 'cyan',
  },
  {
    id: 'bk-bw-003', title: 'Bushwick 2BR Railroad', address: '1335 DeKalb Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bushwick', neighborhoodSlug: 'bushwick',
    lat: 40.6990, lng: -73.9214,
    rent: 3300, sqft: 800, beds: 2, baths: 1, yearBuilt: 1910, renovated: false,
    available: '2027-01-01', petPolicy: 'none', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood'], accent: 'lime',
  },
  {
    id: 'bk-bw-004', title: 'Sunny 2BR with Backyard', address: '210 Troutman St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bushwick', neighborhoodSlug: 'bushwick',
    lat: 40.7038, lng: -73.9255,
    rent: 3900, sqft: 850, beds: 2, baths: 1, yearBuilt: 1920, renovated: true,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'outdoor_space', 'in_building_laundry', 'pet_friendly'], accent: 'orange',
  },
  {
    id: 'bk-bw-005', title: 'Bushwick 3BR, Roommate-Friendly', address: '1060 Halsey St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bushwick', neighborhoodSlug: 'bushwick',
    lat: 40.6895, lng: -73.9135,
    rent: 4350, sqft: 1050, beds: 3, baths: 1.5, yearBuilt: 1905, renovated: true,
    available: '2027-01-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'in_building_laundry'], accent: 'rose',
  },
  {
    id: 'bk-bw-006', title: 'Bushwick 1BR Walk-up', address: '1158 Willoughby Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bushwick', neighborhoodSlug: 'bushwick',
    lat: 40.7010, lng: -73.9265,
    rent: 2700, sqft: 550, beds: 1, baths: 1, yearBuilt: 1925, renovated: false,
    available: '2026-12-15', petPolicy: 'none', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood'], accent: 'amber',
  },

  // ---------------------------- Park Slope ----------------------------
  {
    id: 'bk-ps-001', title: 'Park Slope Brownstone 1BR', address: '52 Garfield Pl',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Park Slope', neighborhoodSlug: 'park-slope',
    lat: 40.6745, lng: -73.9773,
    rent: 3500, sqft: 650, beds: 1, baths: 1, yearBuilt: 1899, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'high_ceilings', 'dishwasher'], accent: 'sky',
  },
  {
    id: 'bk-ps-002', title: 'Garden 2BR near Prospect Park', address: '85 Berkeley Pl',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Park Slope', neighborhoodSlug: 'park-slope',
    lat: 40.6779, lng: -73.9760,
    rent: 4900, sqft: 950, beds: 2, baths: 1, yearBuilt: 1905, renovated: true,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['outdoor_space', 'dishwasher', 'hardwood', 'in_unit_laundry', 'pet_friendly'], accent: 'emerald',
  },
  {
    id: 'bk-ps-003', title: 'Park Slope 2BR on 6th Ave', address: '470 6th Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Park Slope', neighborhoodSlug: 'park-slope',
    lat: 40.6683, lng: -73.9838,
    rent: 4600, sqft: 850, beds: 2, baths: 1, yearBuilt: 1920, renovated: false,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'violet',
  },
  {
    id: 'bk-ps-004', title: 'Park Slope 1BR, Elevator Building', address: '348 5th St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Park Slope', neighborhoodSlug: 'park-slope',
    lat: 40.6713, lng: -73.9845,
    rent: 3650, sqft: 600, beds: 1, baths: 1, yearBuilt: 1960, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'dishwasher', 'pet_friendly'], accent: 'indigo',
  },

  // ---------------------------- Bed-Stuy ----------------------------
  {
    id: 'bk-bs-001', title: 'Brownstone 2BR with Garden', address: '312 Macon St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy',
    lat: 40.6823, lng: -73.9302,
    rent: 3300, sqft: 900, beds: 2, baths: 1, yearBuilt: 1899, renovated: true,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: ['heat'], concession: '',
    amenities: ['hardwood', 'high_ceilings', 'dishwasher', 'in_unit_laundry', 'outdoor_space', 'pet_friendly'], accent: 'stone',
  },
  {
    id: 'bk-bs-002', title: 'Renovated 1BR on Halsey', address: '180 Halsey St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy',
    lat: 40.6837, lng: -73.9455,
    rent: 2650, sqft: 650, beds: 1, baths: 1, yearBuilt: 1901, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances'], accent: 'teal',
  },
  {
    id: 'bk-bs-003', title: 'Bed-Stuy 3BR Duplex', address: '95 Hancock St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy',
    lat: 40.6824, lng: -73.9478,
    rent: 4200, sqft: 1200, beds: 3, baths: 2, yearBuilt: 1899, renovated: true,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'dishwasher', 'hardwood', 'outdoor_space', 'storage', 'pet_friendly'], accent: 'cyan',
  },
  {
    id: 'bk-bs-004', title: 'New-Build 2BR w/ Washer/Dryer', address: '791 Lafayette Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy',
    lat: 40.6905, lng: -73.9425,
    rent: 3400, sqft: 820, beds: 2, baths: 1, yearBuilt: 2019, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'elevator', 'stainless_appliances', 'pet_friendly'], accent: 'lime',
  },
  {
    id: 'bk-bs-005', title: 'Bed-Stuy 2BR Walk-up', address: '418 Jefferson Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy',
    lat: 40.6833, lng: -73.9390,
    rent: 3050, sqft: 850, beds: 2, baths: 1, yearBuilt: 1910, renovated: false,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'orange',
  },
  {
    id: 'bk-bs-006', title: 'Bed-Stuy 1BR near the A/C', address: '222 Madison St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Bed-Stuy', neighborhoodSlug: 'bed-stuy',
    lat: 40.6855, lng: -73.9490,
    rent: 2600, sqft: 600, beds: 1, baths: 1, yearBuilt: 1920, renovated: false,
    available: '2027-01-15', petPolicy: 'none', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'rose',
  },

  // ---------------------------- Crown Heights ----------------------------
  {
    id: 'bk-ch-001', title: '1BR off Eastern Parkway', address: '1180 Eastern Pkwy',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Crown Heights', neighborhoodSlug: 'crown-heights',
    lat: 40.6688, lng: -73.9373,
    rent: 2750, sqft: 700, beds: 1, baths: 1, yearBuilt: 1925, renovated: false,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'hardwood'], accent: 'amber',
  },
  {
    id: 'bk-ch-002', title: 'New-Build 1BR near Franklin Ave', address: '850 Bergen St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Crown Heights', neighborhoodSlug: 'crown-heights',
    lat: 40.6772, lng: -73.9555,
    rent: 3200, sqft: 600, beds: 1, baths: 1, yearBuilt: 2021, renovated: false,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'gym', 'rooftop', 'elevator', 'stainless_appliances', 'pet_friendly'], accent: 'sky',
  },
  {
    id: 'bk-ch-003', title: 'Crown Heights 2BR w/ W/D + Yard', address: '690 St Marks Ave',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Crown Heights', neighborhoodSlug: 'crown-heights',
    lat: 40.6748, lng: -73.9488,
    rent: 3350, sqft: 900, beds: 2, baths: 1, yearBuilt: 1915, renovated: true,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'in_unit_laundry', 'outdoor_space', 'pet_friendly'], accent: 'emerald',
  },
  {
    id: 'bk-ch-004', title: 'Crown Heights Studio', address: '1310 Pacific St',
    city: 'Brooklyn', citySlug: 'brooklyn', neighborhood: 'Crown Heights', neighborhoodSlug: 'crown-heights',
    lat: 40.6790, lng: -73.9475,
    rent: 2200, sqft: 420, beds: 0, baths: 1, yearBuilt: 1930, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry', 'dishwasher'], accent: 'violet',
  },

  // ================================ QUEENS ================================
  // ---------------------------- Astoria ----------------------------
  {
    id: 'qn-as-001', title: 'Renovated 1BR near Ditmars', address: '23-24 31st St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7738, lng: -73.9128,
    rent: 2450, sqft: 700, beds: 1, baths: 1, yearBuilt: 1930, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'in_building_laundry'], accent: 'indigo',
  },
  {
    id: 'qn-as-002', title: 'Renovated Astoria 1BR', address: '34-10 30th Ave',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7646, lng: -73.9162,
    rent: 2750, sqft: 650, beds: 1, baths: 1, yearBuilt: 1928, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'stone',
  },
  {
    id: 'qn-as-003', title: 'Astoria 1BR w/ W/D + Balcony', address: '28-14 Crescent St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7688, lng: -73.9262,
    rent: 3250, sqft: 680, beds: 1, baths: 1, yearBuilt: 2019, renovated: false,
    available: '2027-01-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['in_unit_laundry', 'outdoor_space', 'central_ac', 'dishwasher', 'elevator', 'stainless_appliances', 'pet_friendly'], accent: 'teal',
  },
  {
    id: 'qn-as-004', title: 'Astoria 2BR by the N/W', address: '30-14 31st St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7679, lng: -73.9205,
    rent: 3200, sqft: 900, beds: 2, baths: 1, yearBuilt: 1935, renovated: false,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'cyan',
  },
  {
    id: 'qn-as-005', title: 'Astoria Studio', address: '25-36 33rd St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7716, lng: -73.9151,
    rent: 2100, sqft: 450, beds: 0, baths: 1, yearBuilt: 1940, renovated: true,
    available: '2026-12-15', petPolicy: 'none', utilitiesIncluded: ['heat'], concession: '',
    amenities: ['hardwood', 'in_building_laundry', 'elevator'], accent: 'lime',
  },
  {
    id: 'qn-as-006', title: 'Astoria 1BR with Parking', address: '21-10 33rd Rd',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7633, lng: -73.9330,
    rent: 2850, sqft: 600, beds: 1, baths: 1, yearBuilt: 1962, renovated: false,
    available: '2027-01-15', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['parking', 'elevator', 'in_building_laundry', 'pet_friendly'], accent: 'orange',
  },
  {
    id: 'qn-as-007', title: 'Renovated Astoria 2BR', address: '31-45 33rd St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
    lat: 40.7615, lng: -73.9214,
    rent: 3550, sqft: 880, beds: 2, baths: 1, yearBuilt: 1930, renovated: true,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'stainless_appliances', 'in_building_laundry'], accent: 'rose',
  },

  // ---------------------------- Long Island City ----------------------------
  {
    id: 'qn-lic-001', title: 'Waterfront Doorman Studio', address: '46-15 Center Blvd',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Long Island City', neighborhoodSlug: 'long-island-city',
    lat: 40.7458, lng: -73.9580,
    rent: 3400, sqft: 470, beds: 0, baths: 1, yearBuilt: 2018, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['doorman', 'elevator', 'gym', 'pool', 'rooftop', 'in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'pet_friendly'], accent: 'amber',
  },
  {
    id: 'qn-lic-002', title: 'Court Square 1BR', address: '27-21 44th Dr',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Long Island City', neighborhoodSlug: 'long-island-city',
    lat: 40.7475, lng: -73.9433,
    rent: 4100, sqft: 650, beds: 1, baths: 1, yearBuilt: 2016, renovated: false,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['doorman', 'elevator', 'gym', 'rooftop', 'in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'pet_friendly'], accent: 'sky',
  },
  {
    id: 'qn-lic-003', title: 'Hunters Point Prewar 1BR', address: '11-02 49th Ave',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Long Island City', neighborhoodSlug: 'long-island-city',
    lat: 40.7428, lng: -73.9530,
    rent: 3000, sqft: 600, beds: 1, baths: 1, yearBuilt: 1925, renovated: true,
    available: '2027-01-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood'], accent: 'emerald',
  },
  {
    id: 'qn-lic-004', title: 'LIC 2BR w/ Skyline Views', address: '5-49 Borden Ave',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Long Island City', neighborhoodSlug: 'long-island-city',
    lat: 40.7420, lng: -73.9565,
    rent: 5800, sqft: 950, beds: 2, baths: 2, yearBuilt: 2020, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['doorman', 'elevator', 'gym', 'pool', 'rooftop', 'in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'outdoor_space', 'ev_charging', 'pet_friendly'], accent: 'violet',
  },
  {
    id: 'qn-lic-005', title: 'LIC 1BR, Doorman Building', address: '41-42 24th St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Long Island City', neighborhoodSlug: 'long-island-city',
    lat: 40.7520, lng: -73.9400,
    rent: 3700, sqft: 620, beds: 1, baths: 1, yearBuilt: 2017, renovated: false,
    available: '2026-12-15', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['doorman', 'elevator', 'gym', 'in_building_laundry', 'central_ac', 'dishwasher', 'pet_friendly'], accent: 'indigo',
  },

  // ---------------------------- Jackson Heights ----------------------------
  {
    id: 'qn-jh-001', title: 'Garden Co-op 1BR', address: '35-20 79th St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Jackson Heights', neighborhoodSlug: 'jackson-heights',
    lat: 40.7517, lng: -73.8869,
    rent: 2300, sqft: 750, beds: 1, baths: 1, yearBuilt: 1925, renovated: false,
    available: '2026-12-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water', 'gas'], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'hardwood'], accent: 'stone',
  },
  {
    id: 'qn-jh-002', title: 'Jackson Heights 2BR', address: '34-25 82nd St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Jackson Heights', neighborhoodSlug: 'jackson-heights',
    lat: 40.7537, lng: -73.8838,
    rent: 2900, sqft: 950, beds: 2, baths: 1, yearBuilt: 1930, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['elevator', 'in_building_laundry', 'hardwood', 'dishwasher'], accent: 'teal',
  },
  {
    id: 'qn-jh-003', title: 'Prewar 1BR off 37th Ave', address: '37-05 85th St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Jackson Heights', neighborhoodSlug: 'jackson-heights',
    lat: 40.7490, lng: -73.8810,
    rent: 2250, sqft: 700, beds: 1, baths: 1, yearBuilt: 1928, renovated: false,
    available: '2027-01-01', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'cyan',
  },
  {
    id: 'qn-jh-004', title: 'Renovated Jackson Heights 1BR', address: '33-50 80th St',
    city: 'Queens', citySlug: 'queens', neighborhood: 'Jackson Heights', neighborhoodSlug: 'jackson-heights',
    lat: 40.7555, lng: -73.8860,
    rent: 2550, sqft: 680, beds: 1, baths: 1, yearBuilt: 1929, renovated: true,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['dishwasher', 'hardwood', 'elevator', 'in_building_laundry', 'pet_friendly'], accent: 'lime',
  },

  // ================================ BRONX ================================
  // ---------------------------- Mott Haven ----------------------------
  {
    id: 'bx-mh-001', title: 'Mott Haven New-Dev 1BR', address: '101 Lincoln Ave',
    city: 'Bronx', citySlug: 'bronx', neighborhood: 'Mott Haven', neighborhoodSlug: 'mott-haven',
    lat: 40.8064, lng: -73.9292,
    rent: 2900, sqft: 600, beds: 1, baths: 1, yearBuilt: 2023, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '1 month free',
    amenities: ['in_unit_laundry', 'central_ac', 'dishwasher', 'elevator', 'gym', 'rooftop', 'stainless_appliances', 'pet_friendly'], accent: 'orange',
  },
  {
    id: 'bx-mh-002', title: 'Mott Haven 1BR Walk-up', address: '288 E 138th St',
    city: 'Bronx', citySlug: 'bronx', neighborhood: 'Mott Haven', neighborhoodSlug: 'mott-haven',
    lat: 40.8085, lng: -73.9255,
    rent: 2100, sqft: 650, beds: 1, baths: 1, yearBuilt: 1915, renovated: true,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'dishwasher'], accent: 'rose',
  },
  {
    id: 'bx-mh-003', title: 'Mott Haven 2BR', address: '412 E 140th St',
    city: 'Bronx', citySlug: 'bronx', neighborhood: 'Mott Haven', neighborhoodSlug: 'mott-haven',
    lat: 40.8105, lng: -73.9230,
    rent: 2700, sqft: 850, beds: 2, baths: 1, yearBuilt: 1920, renovated: false,
    available: '2027-01-01', petPolicy: 'none', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['hardwood', 'in_building_laundry'], accent: 'amber',
  },
  {
    id: 'bx-mh-004', title: 'Harlem River Studio', address: '2401 3rd Ave',
    city: 'Bronx', citySlug: 'bronx', neighborhood: 'Mott Haven', neighborhoodSlug: 'mott-haven',
    lat: 40.8075, lng: -73.9300,
    rent: 2500, sqft: 450, beds: 0, baths: 1, yearBuilt: 2022, renovated: false,
    available: '2026-12-01', petPolicy: 'friendly', utilitiesIncluded: [], concession: '',
    amenities: ['doorman', 'elevator', 'gym', 'rooftop', 'in_unit_laundry', 'central_ac', 'dishwasher', 'stainless_appliances', 'pet_friendly'], accent: 'sky',
  },
  {
    id: 'bx-mh-005', title: 'Mott Haven 1BR, Elevator Building', address: '515 E 139th St',
    city: 'Bronx', citySlug: 'bronx', neighborhood: 'Mott Haven', neighborhoodSlug: 'mott-haven',
    lat: 40.8070, lng: -73.9195,
    rent: 2350, sqft: 680, beds: 1, baths: 1, yearBuilt: 1965, renovated: false,
    available: '2026-12-15', petPolicy: 'cats', utilitiesIncluded: ['heat', 'hot water'], concession: '',
    amenities: ['elevator', 'in_building_laundry'], accent: 'emerald',
  },
];
