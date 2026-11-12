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
//   petPolicy     'friendly' | 'cats' | 'none' | '' (not listed)
//   utilitiesIncluded  array of strings (e.g. ['heat','hot water'])
//   concession    free-text incentive (e.g. '1 month free') or ''
//   amenities     array of amenity keys (see data/amenities.js)
//   images        optional array of photo URLs (first one is the cover)
//   url           optional external listing URL

export const SEED_LISTINGS = [];
