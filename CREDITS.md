# Credits and licenses

Every third-party asset, library and data source DealScore uses, with its
license. Keep this list current when adding anything (docs/DESIGN_GUIDELINES.md §1.19).

## Code and assets shipped with the site

| What | Where | Source | License |
|---|---|---|---|
| Inter typeface (variable, Latin subset) | `assets/fonts/inter-latin-wght-normal.woff2` | [rsms/inter](https://github.com/rsms/inter) via [@fontsource-variable/inter](https://fontsource.org/fonts/inter) 5.1.0 | SIL Open Font License 1.1 — `assets/fonts/LICENSE-Inter.txt` |
| Leaflet 1.9.4 (map library) | `assets/vendor/leaflet/` | [leafletjs.com](https://leafletjs.com/) (npm `leaflet@1.9.4`, byte-identical to the published release) | BSD 2-Clause — `assets/vendor/leaflet/LICENSE` |
| Lucide icons (chevron-left, chevron-right, x, camera, arrow-left, building-2, external-link) | inlined in `assets/js/components/icons.js` | [lucide.dev](https://lucide.dev/) (npm `lucide-static@0.460.0`) | ISC |

## Loaded from third parties at runtime

| What | Host | Notes |
|---|---|---|
| Tailwind CSS Play CDN | cdn.tailwindcss.com | MIT. Styles the site on every page load. |
| OpenStreetMap map tiles | tile.openstreetmap.org | Map data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright). Use is subject to the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/); attribution is shown on every map. |

## Data

| What | Source | Notes |
|---|---|---|
| Median asking rents by neighborhood and size | [StreetEasy Data Dashboard](https://streeteasy.com/blog/data-dashboard) | Credited on the site. DealScore is not affiliated with StreetEasy or Zillow Group. Only the latest month's figures are committed; raw downloads stay out of the repo. |
| Typical NYC apartment sizes (space bonus) | [RentCafe NYC averages](https://www.rentcafe.com/average-rent-market-trends/us/ny/new-york-city/) | Rounded figures, cited in `assets/js/core/score.js` and on the methodology page. |

## Not used

No stock photos, illustrations, logos or sound. The favicon is a system emoji
rendered by the visitor's browser.
