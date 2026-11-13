# DealScore — NYC Apartments

An apartment-hunting site for New York City with one twist: every listing gets a
**Deal Score** (0–100) rating how good a deal it is. Its price is compared with
**StreetEasy's median asking rent** for the same neighborhood and size, and the
rest of the score comes from what the apartment offers. Sort by best deal, see
exactly why each unit scored the way it did, and browse on a list or a map.

Built as a static single-page app: no backend, no `npm install`, no signup, no
tracking. DealScore is not affiliated with StreetEasy.

## The Deal Score

| Component | Points | What it measures |
|---|---|---|
| **Price vs. StreetEasy median** | 60 | Rent vs. StreetEasy's median asking rent for the same neighborhood and bedroom count (studio, 1, 2, 3+). At the median = 30; 25% below = 60; 25% above = 0. |
| **Amenity richness** | 22 | Weighted sum of amenities (laundry, parking, A/C and outdoor space weigh most); 45 earns full marks. |
| **In-unit laundry** | 10 | Full marks for an in-unit washer/dryer, half for in-building laundry. |
| **Condition & extras** | 8 | Recent renovation or newer build, included utilities, move-in concessions. |
| **Space bonus** | up to +10 | Only when square footage is listed: 30%+ bigger than a typical NYC unit of that size earns the full bonus. No square footage, or a smaller unit, means no bonus and no penalty. The total is capped at 100. |

Score labels: **80–100** Great Deal · **65–79** Good Deal · **50–64** Fair ·
**35–49** Below Average · **0–34** Overpriced.

### Where the benchmark comes from

Typical rents are StreetEasy's monthly median asking rents from its
[Data Dashboard](https://streeteasy.com/blog/data-dashboard), stored in
[`assets/js/data/market.js`](assets/js/data/market.js). StreetEasy publishes
figures for ~176 neighborhoods, the five boroughs and NYC, but not every
neighborhood × size, so DealScore uses the most specific figure available:
neighborhood → borough → all of NYC. A neighborhood figure is used only when
it's based on at least 10 listings (StreetEasy's Oct 2026 Nolita studio median,
for example, is a single $9,500 listing). The confidence label reflects this:
high for a neighborhood figure from 30+ listings, medium for 10–29, low for a
borough or citywide figure, and low-confidence savings are flagged as rough
estimates.

Listings match StreetEasy areas by name, so use StreetEasy's neighborhood names
(the add form suggests them). Common alternatives are understood, e.g.
"Bed-Stuy" → Bedford-Stuyvesant, "Hell's Kitchen" → Midtown West, "Harlem" →
Central Harlem.

The space bonus compares against typical NYC sizes rounded from
[RentCafe's listing averages](https://www.rentcafe.com/average-rent-market-trends/us/ny/new-york-city/)
(StreetEasy doesn't publish sizes): studio ~480 sqft, 1-bed ~700, 2-bed ~960,
3+ bed ~1,240.

To tune it:

| What | Where |
|---|---|
| Component weights, bonus size | `WEIGHTS` and `SPACE_BONUS_MAX` in [`assets/js/core/score.js`](assets/js/core/score.js) |
| Price sensitivity | the `0.75 / 1.25` bounds in `scorePrice` |
| Amenity full marks | `AMENITY_FULL_MARKS` in `score.js` |
| Typical sizes | `TYPICAL_SQFT` in `score.js` |
| Neighborhood short forms | `AREA_ALIASES` in `score.js` |
| Amenity values | `weight` fields in [`assets/js/data/amenities.js`](assets/js/data/amenities.js) |

## Pages

- **Browse:** *NYC rents by neighborhood*, StreetEasy's median asking rent for
  all 176 neighborhoods: switch size (studio to 3+ beds) and borough, search,
  sort, see how many listings back each figure and how it compares with the
  borough, and jump to "Score an apartment here" with the form pre-filled.
  Figures from fewer than 10 listings are hidden unless you ask for them.
  Once you add apartments, *Your apartments* appears above it: filter by
  borough, neighborhood, beds, max rent and in-unit laundry, sort by Deal Score
  (default), price, $/sqft or biggest savings, and switch between a grid and a
  map of Deal Score pins. Filters and views are kept in the URL.
- **Listing detail:** a photo gallery (when the listing has photos), unit facts,
  amenities, a location map with nearby listings, the per-component score
  breakdown, and which StreetEasy figure the price was compared with.
- **How scoring works:** the methodology, in plain language.
- **Privacy** and **Terms:** drafts written from what the site actually does,
  with `[[TODO]]` placeholders for owner details. They need review by a lawyer
  before you rely on them.
- **Add listing:** a form to enter real listings, with StreetEasy neighborhood
  suggestions, optional square footage, coordinates and photo URLs. They're saved in your browser and show up in
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

There are no bundled listings: the site starts empty and shows only listings
you add. The shape is documented at the top of
[`assets/js/data/listings.js`](assets/js/data/listings.js):

```js
{
  id: 'user-queens-astoria-1', title: 'Renovated Astoria 1BR', address: '30-14 31st St',
  city: 'Queens', citySlug: 'queens',                 // the borough
  neighborhood: 'Astoria', neighborhoodSlug: 'astoria', // StreetEasy's neighborhood name
  lat: 40.7679, lng: -73.9205,                        // optional; needed for the map
  rent: 2500, sqft: 820, beds: 1, baths: 1,           // sqft optional; beds: 0 = studio
  yearBuilt: 1930, renovated: true, available: '2026-12-01',
  petPolicy: 'cats',                                  // 'friendly' | 'cats' | 'none'
  utilitiesIncluded: ['heat', 'hot water'], concession: '',
  amenities: ['dishwasher', 'in_building_laundry'],   // keys from data/amenities.js
  images: [],                                         // optional photo URLs; first is the cover
  url: '',                                            // optional external listing URL
}
```

Ways to add listings:

1. **In-app form:** open **Add listing** and enter a unit. It's saved in your
   browser; **Export JSON** copies it out.
2. **Edit the data file:** add objects to `SEED_LISTINGS`, then run
   `node build.mjs`.
3. **Live source:** implement `fetchRemoteListings()` in
   [`assets/js/data/adapter.js`](assets/js/data/adapter.js). Every page reads
   through the adapter, so nothing else changes.

## Data sources roadmap

DealScore is meant to run on StreetEasy data only, in three phases:

1. **StreetEasy market benchmarks (live, Oct 2026 data).** Monthly median
   asking rents and listing counts per unit size from the Data Dashboard's CSV
   downloads, converted by `scripts/import-streeteasy.mjs` into
   `assets/js/data/market.js`. Refreshed by hand each month (see
   [`data/streeteasy/README.md`](data/streeteasy/README.md)): StreetEasy's bot
   protection blocks automated downloads and its terms forbid scraping, so
   nothing fetches from StreetEasy automatically. The raw CSVs are git-ignored;
   only the latest month's figures are committed.
2. **Your StreetEasy shortlist (planned).** The add form requires a StreetEasy
   listing link; you type in the facts yourself (the page is never fetched), the
   listing links back with "View on StreetEasy", and photos stay on StreetEasy.
   Listings stay private in your browser, with JSON export/import between
   devices.
3. **Licensed StreetEasy feed (planned).** Needs a data agreement with
   StreetEasy / Zillow Group, whose terms decide what can be shown publicly.
   `fetchRemoteListings()` maps the feed into the listing shape. With real
   listing volume, listing-vs-listing comparisons (price per square foot, space)
   can come back alongside StreetEasy's medians.

## Map

The map uses [Leaflet](https://leafletjs.com/) 1.9.4, self-hosted in
`assets/vendor/leaflet/` (byte-identical to the release), and OpenStreetMap's
standard tiles. No API key is needed.
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
index.html                  shell: Tailwind (CDN) + token config, skip link, dist/dealscore.js
CLAUDE.md                   notes for Claude sessions (points at the design guidelines)
CREDITS.md                  every third-party asset, library and data source, with licenses
docs/DESIGN_GUIDELINES.md   design, UX, motion and compliance rules
docs/DESIGN_AUDIT.md        latest audit against those rules, and what needs owner input
build.mjs                   ~50-line bundler -> dist/dealscore.js
dist/dealscore.js           generated bundle (committed)
tests/score.test.mjs        engine tests (node --test)
scripts/import-streeteasy.mjs  StreetEasy CSVs -> assets/js/data/market.js
data/streeteasy/            drop StreetEasy downloads here (git-ignored)
assets/
  css/styles.css            design tokens (colour, radius, shadow, motion), base and
                            component styles, reduced-motion rules
  fonts/                    Inter, self-hosted (OFL)
  vendor/leaflet/           Leaflet 1.9.4 (BSD-2-Clause)
  js/
    main.js                 router bootstrap
    util/                   format (incl. URL guards), stats, dom, router, storage
    data/                   amenities (catalog + weights), market (StreetEasy medians),
                            listings (bundled, empty), adapter
    core/score.js           the Deal Score engine
    components/             header, icons (Lucide), scoreBadge, listingCard, filters, map, gallery
    pages/                  home, listing, methodology, add, legal (privacy + terms)
```

## Design rules

UI, copy and data-handling changes follow
[`docs/DESIGN_GUIDELINES.md`](docs/DESIGN_GUIDELINES.md); the latest audit is
[`docs/DESIGN_AUDIT.md`](docs/DESIGN_AUDIT.md). In short: WCAG 2.2 AA contrast
and keyboard access, one accent colour (`--accent` in `assets/css/styles.css`,
available to Tailwind as `bg-accent` / `text-accent`), no emoji as icons, no
unsupported claims, and `prefers-reduced-motion` respected.

## Known limitations / next steps

- **The Deal Score is heuristic,** not market-calibrated. With enough real data
  you could fit the weights instead of setting them by hand.
- **Asking rents, not signed leases.** StreetEasy's medians describe what
  landlords ask; actual rents can be lower, especially with concessions.
- **Name matching.** A listing whose neighborhood isn't a StreetEasy name falls
  back to the borough figure (and says so). Add short forms to `AREA_ALIASES`.
- **No rent-stabilization data.** It's a major value factor in NYC and a natural
  next field and score input.
- **Drafts are per-browser.** There's no persistence or auth yet.

## License

MIT.
