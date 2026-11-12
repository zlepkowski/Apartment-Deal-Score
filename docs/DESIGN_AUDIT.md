## Design & Compliance Audit — DealScore — 2026-11-12

Audited against [DESIGN_GUIDELINES.md](DESIGN_GUIDELINES.md). **Status is the state
before this pass**; evidence (`file:line`) refers to commit `fc7ed1a`. The Fix column
says what changed. Items still open after the fixes are listed under "Still open".

### Summary (before → after)
- ❌ Blockers / fails: 20 → 0 (owner input still needed, below)
- ⚠️ Partial: 22 → 3 (1.8 Tailwind CDN, 3.14 overlapping map pins, legal drafts awaiting review)
- ✅ Pass: 26
- N/A: 33
- axe-core (WCAG 2.0/2.1/2.2 A+AA, 9 pages): **21 violations → 1** (overlapping map pins, see 3.14)
- Third-party hosts on first load: **4 → 1** (Google Fonts and unpkg removed; Tailwind CDN remains; OSM tiles only when a map is shown)

### Inventory
- **Routes:** `#/` Browse (grid/map), `#/listing/:id`, `#/methodology`, `#/add`, and new `#/privacy`, `#/terms`.
- **Forms:** add listing (`assets/js/pages/add.js`), Browse filters (`assets/js/components/filters.js`). No accounts, no sign-up, no marketing opt-ins, no emails.
- **Network:** no `fetch`/XHR. Static assets from the site's host; before this pass also fonts.googleapis.com (`index.html:10`), unpkg.com (`index.html:12,24`) and cdn.tailwindcss.com (`index.html:9`); map tiles from tile.openstreetmap.org when a map is shown; photo URLs the user enters.
- **Cookies/storage:** no cookies. One localStorage key, `dealscore.userListings.v1` (`assets/js/util/storage.js`).
- **SDKs/trackers:** none (no analytics, ads, session replay).
- **Assets:** Inter (Google Fonts → now self-hosted), Leaflet 1.9.4, emoji used as icons (→ Lucide), no photos or illustrations.

### Results

#### §1 Legal & compliance
| § | Item | Status | Evidence (file:line) | Fix |
|---|------|--------|----------------------|-----|
| 1.1 | Privacy policy | ❌ | no route or page | `#/privacy` draft (`assets/js/pages/legal.js`) written from the inventory; DRAFT banner; `[[TODO]]` placeholders; linked from footer |
| 1.2 | Terms of service | ❌ | none | `#/terms` draft: what the score is, not advice, data sources, not affiliated with StreetEasy, `[[TODO]]` for liability and governing law. No accounts, so no acceptance step |
| 1.3 | Refund policy | N/A | no payments | — |
| 1.4 | Cookie policy | ❌ | storage undisclosed | Storage table in the privacy page: one localStorage key, no cookies |
| 1.5 | Consent banner | N/A | no non-essential scripts; verified 0 cookies, no analytics requests | Policy states anything optional added later loads only after consent |
| 1.6 | Form consents | ⚠️ | required vs optional fields not marked (`add.js:54-71`) | Required group first; "Optional" legends; no marketing opt-ins exist |
| 1.7 | No unnecessary data | ✅ | every field feeds the score or display; nothing is sent to a server | — |
| 1.8 | Third-party SDK audit | ⚠️ | Google Fonts `index.html:10` and unpkg `index.html:12,24` get every visitor's IP | Inter and Leaflet self-hosted (`assets/fonts/`, `assets/vendor/leaflet/`, Leaflet byte-identical to the release). Tailwind CDN and OSM tiles remain and are disclosed |
| 1.9 | Dark patterns | ✅ | none found | — |
| 1.10 | Hidden fees | N/A | nothing sold | — |
| 1.11 | Fake reviews | ✅ | none; illustrative listings were removed in `61049db` | — |
| 1.12 | Unsupported claims | ⚠️ | `amenities.js:1-2`, `methodology.js:9`, `methodology.js:10` | Rewritten; see "Claims removed or rewritten" |
| 1.13 | Alt text / icon labels | ⚠️ | emoji read aloud (`amenities.js:10ff`, `listingCard.js:56`, `listing.js:169`); `✕` button has no name (`add.js:191`) | Emoji removed; SVG icons `aria-hidden`; icon buttons labelled; badge dot hidden; "Deal Score" prefix for screen readers |
| 1.14 | Colour contrast | ❌ | `text-slate-400` 2.56:1 (`header.js:25`, `listingCard.js:29,34,66`, `index.html:18`); savings text 3.77/3.67:1 (`listingCard.js:31,33`); white on emerald-600 buttons 3.77:1 (`add.js:99`, `home.js:170`); pins 3.1–3.8:1 (`styles.css:68`); input borders 1.48:1 (`filters.js:13`); placeholders 2.54:1 | Secondary text slate-600 (7.6:1); savings emerald/rose-700; accent buttons 6.7:1; pins 700 shades (≥5:1); control borders 3.3:1; placeholders 4.8:1. axe colour-contrast: 19 → 0 |
| 1.15 | Keyboard navigation | ❌ | no skip link (`index.html:17`); `focus:outline-none` with only a 1px colour change (`filters.js:13,51`); export overlay has no focus trap, Esc or focus return (`add.js:187`); nested `<label>` (`filters.js:56`) | Skip link (hash-router safe); global `:focus-visible` ring; native `<dialog>` with Esc and focus return; focus moves to content after navigation; `aria-current` in nav; fixed nesting |
| 1.16 | Business details | ❌ | none | `[[TODO]]` owner name and contact on Privacy and Terms (owner input) |
| 1.17 | Children's data | ⚠️ | not addressed | Policy and terms say not directed at children, with `[[TODO]]` for owner confirmation. No accounts or data collection, so no age gate |
| 1.18 | Unsubscribe links | N/A | no email | — |
| 1.19 | Licensed fonts/images | ⚠️ | no credits file | `CREDITS.md` (Inter OFL, Leaflet BSD-2, Lucide ISC, Tailwind MIT, OSM ODbL, StreetEasy, RentCafe); license files shipped beside vendored assets |
| 1.20 | Data deletion | ✅ | per-listing Remove and Clear all in-app; nothing server-side | "Remove all" now asks for confirmation |

#### §2 Unslop
| § | Item | Status | Evidence (file:line) | Fix |
|---|------|--------|----------------------|-----|
| 2.1 | Filler badges | ✅ | "Draft" and "bonus" carry information | — |
| 2.2 | Redundant labels | ⚠️ | listing count twice (`home.js:89` + toolbar); "Deal Score" heading + "Deal Score / 100" (`scoreBadge.js:26`) | Count shown once; badge reads "out of 100" |
| 2.3 | Italicised words | ✅ | none | — |
| 2.4 | Mono only where needed | ✅ | JSON, URLs, storage key only | — |
| 2.5 | Design system | ⚠️ | hard-coded hex in `styles.css`; no colour/motion/focus tokens | Tokens in `assets/css/styles.css :root`, exposed to Tailwind as `accent` (`index.html`) |
| 2.6 | Show the actual product | N/A | no marketing hero; the app is the product | — |
| 2.7 | Enlarge the main feature | ✅ | price and score are the largest elements | — |
| 2.8 | Group with spacing | ⚠️ | boxed stats strip; one bordered box per amenity (`listing.js:132`, `add.js:93`) | Boxes removed; spacing and headings group content |
| 2.9 | Specific headlines | ⚠️ | "Find the best-value apartments in New York" (`home.js:176`) no longer describes the product | "How good a deal is that NYC apartment?" + concrete subline |
| 2.10 | One primary CTA | ⚠️ | primary fills alternate emerald and slate-900 (`add.js:99`, `listing.js:196`) | Accent fill for the one primary action per view; outline/text for secondary; verb-first labels |
| 2.11 | One accent colour | ❌ | emerald is both the action colour and "good deal" | Accent is blue-700; green/red reserved for good/bad price signals |
| 2.12 | Consistent icons | ❌ | emoji as icons; `‹ ›`, `✕`, `←` glyphs | Lucide SVGs, stroke 2, sizes 16/20/24 (`components/icons.js`) |
| 2.13 | Remove embellishments | ❌ | ambient radial gradients (`styles.css:16-17`); random-hue gradient placeholders (`listingCard.js:40`, `listing.js:141`) | Flat background; neutral placeholder with a building icon; no banner when there are no photos |
| 2.14 | Concentric radii | ⚠️ | 6px buttons in an 8px toggle with 4px padding; cover clipped by the card | Toggle buttons 4px; cover radius 15px inside the 16px card's 1px border |
| 2.15 | Text contrast | ⚠️ | see 1.14 | Body slate-700/900, secondary slate-600 |
| 2.16 | Headline wrapping | ❌ | none set | `text-wrap: balance` on h1–h3, `pretty` on p/li; `max-w-prose` intros |
| 2.17 | Optical alignment | ✅ | spot-checked in screenshots | — |
| 2.18 | Tabular numbers | ⚠️ | prices and stats proportional | `.num` on prices, stats, counts, points |
| 2.19 | Loading/empty/error/success | ⚠️ | no loading or error state for pages; clipboard failure unhandled (`add.js:197`) | Loading after 300ms, error with "Try again"; copy failure message; success `role=status` |
| 2.20 | Useful feedback motion | ⚠️ | static success text | One pulse on save and copy |

#### §3 UX laws & animation principles
| § | Item | Status | Evidence | Fix |
|---|------|--------|----------|-----|
| 3.1 | Squash & stretch | N/A | no knobs; press scale covers buttons | — |
| 3.2 | Anticipation | N/A | — | — |
| 3.3 | Staging | ✅ | dialog dims the page | — |
| 3.4 | Pose to pose | ✅ | CSS state transitions | — |
| 3.5 | Follow-through | N/A | — | — |
| 3.6 | Slow in / slow out | ✅ | eased transitions | Ease tokens |
| 3.7 | Arcs | N/A | — | — |
| 3.8 | Secondary action | N/A | — | — |
| 3.9 | Snappy timing | ✅ | 120–200ms | Tokens 150/200/300ms |
| 3.10 | Exaggerated feedback | ⚠️ | invalid rent silently became NaN | Clear validation message; success pulse |
| 3.11 | Consistent depth | ⚠️ | ad-hoc shadows | `--shadow-1..3`, one light source |
| 3.12 | Appeal | ✅ | — | — |
| 3.13 | Fitts's law | ⚠️ | destructive "Clear all" beside "Export JSON" (`add.js:153-156`) | Moved to the end of the list with confirmation |
| 3.14 | Hit areas ≥ 24px | ❌ | gallery dots 8px (`gallery.js:37`); Remove `text-xs` (`add.js:164`); pins 34×22 (`styles.css:49-50`); small text links | Dots 24px, Remove 32px, pins 36×24, arrows 44px, padded links. **Partial:** pins that overlap (listings metres apart) still flag; the same listings are linked from cards below the map (WCAG 2.5.8 equivalent-control exception) |
| 3.15 | Hick's law | ❌ | 17 fields, required and optional interleaved (`add.js:54-102`) | Required first; optional grouped; photos/location collapsed |
| 3.16 | Miller's law | ❌ | 18 ungrouped amenity checkboxes (`add.js:92`) | 6 labelled groups |
| 3.17 | Doherty threshold | ✅ | local data, instant | Loading state if it's ever slower |
| 3.18 | Postel's law | ❌ | number inputs reject "$3,200" (`add.js:64`, `filters.js:50`) | Rent, max rent and sqft accept "$3,200/mo", "820 sq ft"; pasting "lat, lng" fills both |
| 3.19 | Jakob's law | ✅ | logo top-left home, standard nav | — |
| 3.20 | Frequency of use | ✅ | filters instant | Kept instant; entrance stagger only on first reveal |

#### §4 Motion
| § | Item | Status | Evidence | Fix |
|---|------|--------|----------|-----|
| 4.0 | Global rules / reduced motion | ❌ | card animates `box-shadow` (`listingCard.js:38`); smooth scroll ignores reduced motion (`styles.css:6,97`, `gallery.js:59`); no `prefers-reduced-motion` handling | Transform/opacity only (shadow via pseudo-element opacity); global reduced-motion block; JS scroll checks the preference. Verified with reduced-motion emulation |
| 4.1 | Ease-out entrances | ⚠️ | overlay appeared without transition | `--ease-out` on dialog and cards |
| 4.2 | Dropdowns 150–250ms | N/A | native selects; Leaflet popups fade 200ms | — |
| 4.3 | 30ms list stagger | ❌ | none | Cards, first reveal only, capped at 10 |
| 4.4 | Press scale 0.97 | ❌ | none | Buttons and cards (`scale`, composes with translate) |
| 4.5 | Knob stretch | N/A | — | — |
| 4.6 | Settle stagger | N/A | — | — |
| 4.7 | Arcs | N/A | — | — |
| 4.8 | Success pulse | ❌ | none | Save and copy, once |
| 4.9 | Ease-in-out for moves | N/A | — | — |
| 4.10 | Popovers from 0.95 | ❌ | instant overlay | Dialog 0.95 → 1, 200ms |
| 4.11 | Enter from trigger | N/A | centred modal | — |
| 4.12 | Exit to trigger | N/A | centred modal | — |
| 4.13 | No bounce | ✅ | — | — |
| 4.14 | Follow input 1:1 | ✅ | gallery swipe is native scroll | — |
| 4.15 | Shorter exits | ✅ | dialog closes instantly | — |
| 4.16 | Overlap states | ❌ | route changes blank and replace | View Transitions crossfade on navigation (progressive; off with reduced motion) |
| 4.17–4.20 | Masks, icon crossfade, rubber band, layoutId | N/A | — | — |

#### §6 Trend watch
| § | Item | Status | Evidence | Fix |
|---|------|--------|----------|-----|
| 6.1–6.8 | Dithering, ASCII, canvases, disco logos, renaissance, Monet, dark gradient heroes, pixel loaders | N/A | not used | — |
| 6.9–6.11 | Instrument Serif, one italic word, cream background | ✅ | not used | — |
| 6.12 | All-caps eyebrows | ⚠️ | uppercase "DEAL SCORE" label and stat labels | Plain headings and labels |
| 6.13 | Pulsing live dots | ✅ | badge dot is static | Hidden from screen readers |
| 6.14 | Sparkle icons | ⚠️ | ✨ for "Stainless appliances" | Removed with the other emoji |
| 6.15 | Glass | ✅ | light header blur only; text stays legible | — |
| 6.16–6.20 | Icon cards, flowcharts, marquees, squircles, Pretext | N/A | not used | — |

### Non-negotiables (§0.5) after this pass
1. No fake content or unsupported claims ✅
2. No trackers; nothing loads pre-consent ✅
3. Total price upfront / easy cancel — N/A (nothing sold)
4. In-app data deletion ✅
5. WCAG AA contrast ✅ (axe: 0 contrast violations)
6. Keyboard + visible focus ✅
7. Targets ≥ 24px ✅, except overlapping map pins (equivalent links exist)
8. One primary CTA, one accent ✅
9. Loading / empty / error / success states ✅
10. `prefers-reduced-motion` respected ✅

### Needs owner input
- [ ] Owner or legal entity name, and a contact email (Privacy, Terms) (§1.16)
- [ ] Effective date for both policies
- [ ] Confirm hosting is GitHub Pages (Privacy, "Services your browser contacts")
- [ ] Governing law and jurisdiction; disclaimer and liability wording — needs a lawyer (§1.2)
- [ ] Which privacy laws apply and any legal basis — needs a lawyer (§1.1)
- [ ] Confirm DealScore isn't aimed at or likely to attract children (§1.17)
- [ ] Keep the Tailwind Play CDN (third party; Tailwind recommends it for development only) or add a CSS build step, which would remove the last third-party request but break the "no npm" setup (§1.8)
- [ ] Accent colour: now blue-700 so green can mean "good deal". Change `--accent` in `assets/css/styles.css` to pick another (§2.11)

### Claims removed or rewritten (§1.12)
- `amenities.js`: "weight reflecting how much renters value it (loosely calibrated to rent-premium research)" → hand-set weights, "a judgment call, not fitted to rent data".
- Methodology: "a weight reflecting how much renters typically pay for it (… move rent the most)" → hand-set weights, and which weigh most.
- Methodology: "one of the most-requested features" → "Scored on its own, on top of the amenity score, so laundry counts extra."
- Browse: "Find the best-value apartments in New York" → "How good a deal is that NYC apartment?"
- Add listing: "nothing leaves this device" → "Saved only in this browser. Nothing is uploaded." (photo links are still loaded from their hosts, which the privacy page discloses).

### Other bugs found during the audit
- A blank "Year built" was saved as the current year, awarding "newer construction" points. It's now stored as unknown.
- The pet policy defaulted to "Pet friendly"; it now defaults to "Not listed".

### Verification
- `node build.mjs` (no duplicate top-level names across modules) and `node --test` (11 passing).
- axe-core 4.10 on 9 pages before and after, with Tailwind compiled locally (the CDNs are unreachable from the audit sandbox): 21 → 1 violation nodes.
- Keyboard walk: Skip link → logo → nav → filters → view toggle, all with a visible focus ring. Export dialog: focus moves inside, Esc closes, focus returns to "Export JSON".
- Reduced-motion emulation: animations and transitions drop to ~0ms; smooth scrolling off.
- First-load network: only cdn.tailwindcss.com (plus tile.openstreetmap.org on map views); 0 cookies.
- Lenient input: "$3,200/mo" → 3200, "820 sq ft" → 820, pasted "40.7679, -73.9205" fills both coordinates; "call for price" is rejected with a message.
- Before/after screenshots compared at desktop and phone width.
- **Not verified:** rendering with the real Tailwind CDN, real map tiles, Safari and Firefox, screen-reader walkthroughs (axe only), and the page crossfade visually.
