# StreetEasy downloads

Put the extracted CSVs from StreetEasy's
[Data Dashboard downloads](https://streeteasy.com/blog/download-data/) here, then
run the importer. The CSVs themselves are git-ignored: this repo is public, so
only the generated `assets/js/data/market.js` (the latest month's figures) is
committed.

## Monthly refresh

1. In a browser, at https://streeteasy.com/blog/download-data/, download two
   rental metrics for each unit size (Studio, One Bedroom, Two Bedroom, Three+
   Bedroom), eight files in all:
   - **Median Asking Rent**: the benchmark.
   - **Rental Inventory**: how many listings each median is based on. The site
     ignores neighborhood medians from fewer than 10 listings.

   StreetEasy blocks automated downloads, so this step is manual.
2. Unzip them into this folder. Expected names look like
   `medianAskingRent_Studio.csv`, `rentalInventory_OneBd.csv`, … (the importer
   matches the metric and size from the name). The `_All` files mix all sizes
   and aren't used.
3. From the repo root, import, rebuild, and test:

   ```bash
   node scripts/import-streeteasy.mjs
   ```

   ```bash
   node build.mjs
   ```

   ```bash
   node --test
   ```

4. Commit `assets/js/data/market.js` and `dist/dealscore.js`.

The importer prints how many neighborhoods have a figure at each size; areas
without one fall back to the borough figure on the site.
