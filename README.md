# DealScore — NYC Apartments

An apartment-hunting site for New York City with one twist: every listing gets a
**Deal Score** (0–100) rating how good a value it is versus *comparable* units in
the same neighborhood and borough. Sort by best deal, see exactly why each unit
scored the way it did, and browse on a list or a map.

Built as a static single-page app: no backend, no `npm install`, no signup, no
tracking. Host it free on GitHub Pages today and wire it to a real database when
you're ready.

## What makes it different

Most listing sites just let you sort by price. DealScore answers *"how much
apartment am I getting for the money, relative to what else is out there?"*
It uses the comparable-based ("rent comp") analysis professionals use, made
automatic and renter-facing.

## The Deal Score (100 points)

| Component | Max | What it measures |
|---|---|---|
| **Price vs. comparable units** | 50 | Rent per square foot vs. the *typical* $/sqft for a comparable unit (see below). At typical = 25; 25% cheaper = 50. The single biggest factor. |
| **Amenity richness** | 22 | Weighted sum of amenities (laundry, parking, A/C and outdoor space weigh most), normalized to the local range. |
| **In-unit laundry** | 10 | Called out on its own: full marks for an in-unit washer/dryer, half for in-building laundry. |
| **Space for the size class** | 10 | Square footage vs. other units of the same bedroom count nearby. |
| **Condition & extras** | 8 | Recent renovation or newer build, included utilities, move-in concessions. |

Score labels: **80–100** Great Deal · **65–79** Good Deal · **50–64** Fair ·
**35–49** Below Average · **0–34** Overpriced.

### How "typical rent" is estimated

In NYC the borough fills the "city" slot of the comp hierarchy. A unit is
compared with its neighborhood, then its borough, never with the whole city.
A listing is never its own comparable.

The typical $/sqft blends two estimates:

- **Local:** the median $/sqft of same-size units in the same neighborhood.
- **Adjusted borough:** the borough median for that size (widening to ±1
  bedroom, then all sizes, when a size class is thin), scaled by how pricey the
  neighborhood runs vs. its borough across all of its listings.

The local figure's weight grows with the number of local comps: one counts 1/3,
two count 1/2, six count 3/4. A thin neighborhood therefore can't produce wild
"savings" figures from mixing luxury towers with walk-ups. Each listing shows a
**high / medium / low** confidence level, and low-confidence savings are flagged
as rough estimates. The listing page walks through every step of the estimate.

The in-app **How scoring works** page explains all of this in plain language.
To tune it:

| What | Where |
|---|---|
| Component weights, comp-set size | `WEIGHTS` and `MIN_COMPS` in [`assets/js/core/score.js`](assets/js/core/score.js) |
| Price sensitivity | the `0.75 / 1.25` bounds in `scorePrice` |
| How fast local comps take over | `NBHD_PRIOR` and `LOCATION_PRIOR` in `score.js` |
| Amenity values | `weight` fields in [`assets/js/data/amenities.js`](assets/js/data/amenities.js) |

## Pages

- **Browse:** filter by borough, neighborhood, beds, max rent and in-unit
  laundry, and sort by Deal Score (default), price, $/sqft or biggest savings.
  The **Grid / Map** toggle shows listings as Deal Score pins colored by grade.
  Filters and view are kept in the URL, so any view is shareable.
- **Listing detail:** a photo gallery (when the listing has photos), unit facts,
  amenities, a location map with nearby listings, the per-component score
  breakdown, and how the "typical rent" anchor was built.
- **How scoring works:** the methodology, in plain language.
- **Add listing:** a form to enter real listings, including optional
  coordinates and photo URLs. They're saved in your browser and show up in
  Browse right away, tagged "Draft". **Export JSON** copies them out.

## Run locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

You can also double-click `index.html`: the app runs from `file://` because the
production script is bundled at `dist/dealscore.js`. Map tiles may not load from
`file://`, because OpenStreetMap's tile servers expect a referring website, so
use a local server when you work on the map.

After editing anything under `assets/js/`, rebuild the bundle and run the tests:

```bash
node build.mjs
```

```bash
node --test
```

`build.mjs` is ~50 lines of Node. It concatenates the ES modules in the
dependency order listed in its `order[]` array and strips `import`/`export`.
**Add new modules to `order[]`** or they won't be bundled. The tests in `tests/`
use Node's built-in runner. Neither step needs `npm install`.

## Listing data

Listings live in [`assets/js/data/listings.js`](assets/js/data/listings.js). The
shape is documented at the top of that file:

```js
{
  id: 'qn-as-004', title: 'Astoria 2BR by the N/W', address: '30-14 31st St',
  city: 'Queens', citySlug: 'queens',                 // the borough, for NYC
  neighborhood: 'Astoria', neighborhoodSlug: 'astoria',
  lat: 40.7679, lng: -73.9205,                        // optional; needed for the map
  rent: 3200, sqft: 900, beds: 2, baths: 1,           // beds: 0 = studio
  yearBuilt: 1935, renovated: false, available: '2026-12-01',
  petPolicy: 'cats',                                  // 'friendly' | 'cats' | 'none'
  utilitiesIncluded: ['heat', 'hot water'], concession: '',
  amenities: ['hardwood', 'in_building_laundry'],     // keys from data/amenities.js
  images: [],                                         // optional photo URLs; first is the cover
  accent: 'cyan',                                     // placeholder color when there's no photo
  url: '',                                            // optional external listing URL
}
```

The 70 seed listings cover 13 neighborhoods across Manhattan, Brooklyn, Queens
and the Bronx at late-2026 rent levels. **They are illustrative, not real units,
and have no photos.** Replace them before going live.

### Adding listings (smallest to largest)

1. **In-app form:** open **Add listing**, enter a unit, then use
   **Export JSON** to copy it into the seed file.
2. **Edit the data file:** add objects to `SEED_LISTINGS`, then run
   `node build.mjs`.
3. **Live backend:** implement `fetchRemoteListings()` in
   [`assets/js/data/adapter.js`](assets/js/data/adapter.js) to pull from
   Supabase / Airtable / Firebase / your own API. Every page reads through the
   adapter, so nothing else changes. A Supabase example is in the file.

## Map

The map uses [Leaflet](https://leafletjs.com/) 1.9.4, loaded from unpkg with a
pinned integrity hash, and OpenStreetMap's standard tiles. No API key is needed.
OSM's tiles are fine for light traffic. For a busy site, switch `TILE_URL` in
[`assets/js/components/map.js`](assets/js/components/map.js) to a hosted tile
provider, per the
[OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

## Deploy

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) deploys the repo to
GitHub Pages on every push to `main`. One-time setup: **Settings → Pages →
Build and deployment → Source: GitHub Actions**.

## Project layout

```
index.html                  shell: Tailwind (CDN), Leaflet (CDN), dist/dealscore.js
build.mjs                   ~50-line bundler -> dist/dealscore.js
dist/dealscore.js           generated bundle (committed)
tests/score.test.mjs        engine tests (node --test)
assets/
  css/styles.css            fonts, background, map pins, gallery
  js/
    main.js                 router bootstrap
    util/                   format (incl. URL guards), stats, dom, router, storage
    data/                   amenities (catalog + weights), listings (seed), adapter
    core/score.js           the Deal Score engine
    components/             header, scoreBadge, listingCard, filters, map, gallery
    pages/                  home, listing, methodology, add
```

## Known limitations / next steps

- **The Deal Score is heuristic,** not market-calibrated. With enough real data
  you could fit the weights (e.g. regress rent on features) instead of setting
  them by hand.
- **No rent-stabilization data.** It's a major value factor in NYC and a natural
  next field and score input.
- **Drafts are per-browser.** There's no persistence or auth; the backend
  adapter is the path to shared, real data.
- **Size mixing in thin size classes:** when a borough has few units of a size,
  the estimate widens to neighboring sizes. Studios run pricier per square foot
  than 1BRs, so expect low-confidence studio scores to skew slightly harsh.

## License

MIT.
