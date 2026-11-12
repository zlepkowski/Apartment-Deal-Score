# DealScore — Apartments

An apartment-hunting site with a twist: every listing gets a **Deal Score**
(0–100) rating how good a value it is versus *comparable* units in the same
city and neighborhood. Sort by best deal, see exactly why each unit scored the
way it did, and start plugging in your own live listings.

Built as a static single-page app — no backend, no `npm install`, no signup,
no tracking. Host it free on GitHub Pages today; wire it to a real database
when you're ready.

## What makes it different

Most listing sites just let you sort by price. DealScore answers *"how much
apartment am I getting for the money, relative to what else is out there?"* —
the same comparable-based ("rent comp") analysis professionals use, made
automatic and renter-facing.

## The Deal Score (100 points)

| Component | Max | What it measures |
|---|---|---|
| **Price vs. comparable units** | 50 | Rent per square foot vs. the local median $/sqft for similar units. The single biggest factor. |
| **Amenity richness** | 22 | Weighted sum of amenities (laundry, parking, A/C, outdoor space weigh most), normalized to the local range. |
| **In-unit laundry** | 10 | Called out on its own — full marks for in-unit washer/dryer, half for in-building. |
| **Space for the size class** | 10 | Square footage vs. other units of the same bedroom count nearby. |
| **Condition & extras** | 8 | Recent renovation / newer build, included utilities, move-in concessions. |

Each listing is scored against a **comp set** chosen as the tightest match with
enough data: *neighborhood + bedrooms → city + bedrooms → whole city*. The
listing detail page shows the comp set used and a full per-component breakdown,
so the score is never a black box. See the in-app **How scoring works** page,
or tune the weights in [`assets/js/core/score.js`](assets/js/core/score.js) and
amenity weights in [`assets/js/data/amenities.js`](assets/js/data/amenities.js).

Score labels: **80–100** Great Deal · **65–79** Good Deal · **50–64** Fair ·
**35–49** Below Average · **0–34** Overpriced.

## Pages

- **Browse** — filter by city/neighborhood/beds/max rent/in-unit laundry, sort
  by Deal Score (default), price, $/sqft, or biggest savings. Includes a market
  summary (median rent, median $/sqft, count of great deals).
- **Listing detail** — full unit info, amenities, the score breakdown, and the
  "typical rent for a comparable unit" anchor.
- **How scoring works** — the methodology, in plain language.
- **Add listing** — a form to enter real listings (saved in your browser),
  with JSON export to commit into the data file or seed a backend.

## Run locally

Just **double-click `index.html`** — no server, no build step. It runs from
`file://` because the production script is bundled at `dist/dealscore.js`.

Prefer a server? Any static one works:

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

## Adding your listings

Three ways, smallest to largest:

1. **In-app form** — open **Add listing**, enter a unit. It's saved in your
   browser and appears in Browse instantly (tagged "Draft"). Use **Export JSON**
   to copy the objects into the seed file.
2. **Edit the data file** — add objects to `SEED_LISTINGS` in
   [`assets/js/data/listings.js`](assets/js/data/listings.js). The shape is
   documented at the top of that file.
3. **Live backend** — implement `fetchRemoteListings()` in
   [`assets/js/data/adapter.js`](assets/js/data/adapter.js) to pull from
   Supabase / Airtable / Firebase / your own API. Every page reads through the
   adapter, so nothing else changes. A Supabase example is in the file.

After editing source under `assets/js/`, rebuild the bundle:

```bash
node build.mjs    # regenerates dist/dealscore.js
```

The bundler (`build.mjs`) is ~50 lines of Node — it concatenates the ES modules
in dependency order and strips `import`/`export`. No npm install needed.

## Deploy

`.github/workflows/pages.yml` deploys the repo to GitHub Pages on every push to
the default branch. Enable Pages in repo settings (source: **GitHub Actions**).

## Going truly "live"

Real listing sites read from a database that property managers update through an
admin portal or that ingests bulk feeds. The recommended path here:

1. **Now:** front-end + Deal Score reading from `listings.js`. Free, instant.
2. **Live:** point the adapter at a hosted DB (Supabase/Airtable/Firebase free
   tiers, each with an admin UI). Because the data layer is isolated, this is a
   small change, not a rewrite.

## Project layout

```
index.html
build.mjs                    ~50-line bundler -> dist/dealscore.js
assets/
  css/styles.css
  js/
    main.js                  router bootstrap
    util/                    format, stats, dom, router, storage
    data/                    amenities (catalog+weights), listings (seed), adapter
    core/                    score.js  <- the Deal Score engine
    components/              header, scoreBadge, listingCard, filters
    pages/                   home, listing, methodology, add
```

## License

MIT.

## Disclaimer

The listings shipped here are **illustrative example data**. Replace them with
real listings before going live.
