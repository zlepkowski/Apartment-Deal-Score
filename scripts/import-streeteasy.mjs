// Imports StreetEasy Data Dashboard downloads into assets/js/data/market.js.
//
// Usage:
//   node scripts/import-streeteasy.mjs [dir] [--out path]
//
//   dir    folder holding the extracted CSVs (default: data/streeteasy)
//   --out  where to write the module (default: assets/js/data/market.js)
//
// Expects StreetEasy's "Median Asking Rent" CSVs, one per unit size, e.g.
// medianAskingRent_Studio.csv, medianAskingRent_OneBd.csv,
// medianAskingRent_TwoBd.csv, medianAskingRent_ThreePlusBd.csv. Each has the
// columns areaName, Borough, areaType, then one column per month (YYYY-MM).
// medianAskingRent_All.csv (all sizes mixed) is ignored: a mixed-size median
// isn't a fair benchmark for any one size.
//
// Optional: the matching rentalInventory_<size>.csv files (number of listings
// behind each median). When present, each figure carries its listing count, and
// the engine skips neighborhood figures based on too few listings.
//
// Only the latest month is kept. The raw downloads stay out of git (see
// .gitignore); the generated module holds just the figures the site uses.
//
// No dependencies; run `node build.mjs` afterwards to rebuild the bundle.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify } from '../assets/js/core/score.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outPath = resolve(outIdx >= 0 ? args[outIdx + 1] : join(repo, 'assets/js/data/market.js'));
const dir = resolve(args.find((a, i) => !a.startsWith('--') && i !== outIdx + 1) || join(repo, 'data/streeteasy'));

const BED_LABEL = { 0: 'studio', 1: '1-bed', 2: '2-bed', 3: '3+ bed' };
const BOROUGH_ORDER = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

// <metric>_<size>.csv → 0 | 1 | 2 | 3 | 'all' | null
function sizeOf(file, metric = 'medianAskingRent') {
  const m = new RegExp(`^${metric}_(.+)\\.csv$`, 'i').exec(file);
  if (!m) return null;
  const k = m[1].toLowerCase().replace(/[^a-z0-9]/g, '');
  if (k === 'all') return 'all';
  if (k.startsWith('studio')) return 0;
  if (/^(one|1)/.test(k)) return 1;
  if (/^(two|2)/.test(k)) return 2;
  if (/^(three|3)/.test(k)) return 3;
  return null;
}

// StreetEasy's CSVs are simple, but handle quoted fields just in case.
function parseCsv(text) {
  const rows = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') quoted = false;
        else cur += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] || '').trim()])));
}

async function load(file) {
  const rows = parseCsv(await readFile(join(dir, file), 'utf8'));
  for (const col of ['areaName', 'Borough', 'areaType']) {
    if (!(col in (rows[0] || {}))) throw new Error(`${file}: missing column "${col}"`);
  }
  const months = Object.keys(rows[0]).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  return { rows, latest: months[months.length - 1] };
}

const allFiles = await readdir(dir);
const files = allFiles.filter((f) => sizeOf(f) !== null);
const bySize = {};
for (const f of files) bySize[sizeOf(f)] = { file: f, ...(await load(f)) };
const invFiles = allFiles.filter((f) => [0, 1, 2, 3].includes(sizeOf(f, 'rentalInventory')));
const invBySize = {};
for (const f of invFiles) invBySize[sizeOf(f, 'rentalInventory')] = { file: f, ...(await load(f)) };

const sizes = [0, 1, 2, 3].filter((b) => bySize[b]);
if (!sizes.length) {
  console.error(`No per-size Median Asking Rent CSVs in ${dir}.`);
  console.error('Need medianAskingRent_Studio / _OneBd / _TwoBd / _ThreePlusBd (any subset).');
  if (bySize.all) console.error('Found only medianAskingRent_All.csv, which mixes all sizes and is not used as a benchmark.');
  process.exit(1);
}

const asOf = sizes.map((b) => bySize[b].latest).sort().pop();
for (const b of sizes) {
  if (bySize[b].latest !== asOf) console.warn(`warning: ${bySize[b].file} ends at ${bySize[b].latest}, others at ${asOf}; using ${asOf} (missing = no figure).`);
}

// Merge every file's rows into one area list.
const areas = new Map();
function areaFor(row) {
  const type = row.areaType.toLowerCase();
  const slug = type === 'city' ? 'nyc' : slugify(row.areaName);
  const key = `${type}:${slug}`;
  if (!areas.has(key)) {
    areas.set(key, {
      slug,
      name: row.areaName,
      type,
      borough: type === 'city' ? null : row.Borough || null,
      parent: type === 'city' ? null : type === 'borough' ? 'nyc' : slugify(row.Borough) || 'nyc',
      rents: {},
      counts: {},
    });
  }
  return areas.get(key);
}
for (const b of sizes) {
  for (const row of bySize[b].rows) {
    const area = areaFor(row);
    const v = Number(row[asOf]);
    if (row[asOf] !== '' && Number.isFinite(v) && v > 0) area.rents[b] = Math.round(v);
  }
  // Listing counts for the same month, only where there's a median.
  for (const row of invBySize[b]?.rows || []) {
    const area = areaFor(row);
    const n = Number(row[asOf]);
    if (area.rents[b] && row[asOf] !== '' && Number.isFinite(n)) area.counts[b] = Math.round(n);
  }
}
for (const b of sizes) {
  if (!invBySize[b]) console.warn(`warning: no rentalInventory file for ${BED_LABEL[b]}; its figures carry no listing counts.`);
  else if (invBySize[b].latest !== asOf) console.warn(`warning: ${invBySize[b].file} ends at ${invBySize[b].latest}, medians at ${asOf}.`);
}
for (const a of areas.values()) if (!Object.keys(a.counts).length) delete a.counts;

const typeRank = { city: 0, borough: 1, submarket: 2, neighborhood: 3 };
const list = [...areas.values()].sort((a, b) =>
  (typeRank[a.type] ?? 9) - (typeRank[b.type] ?? 9) ||
  BOROUGH_ORDER.indexOf(a.borough) - BOROUGH_ORDER.indexOf(b.borough) ||
  a.name.localeCompare(b.name));

// Slugs must be unique for the parent lookup.
const seen = new Map();
for (const a of list) {
  if (seen.has(a.slug)) throw new Error(`slug collision: "${a.name}" and "${seen.get(a.slug)}" both → ${a.slug}`);
  seen.set(a.slug, a.name);
}

const sources = [...files.filter((f) => sizeOf(f) !== 'all'), ...invFiles].sort().join(', ');
const body = list.map((a) => `    ${JSON.stringify(a)},`).join('\n');
const out = `// StreetEasy market benchmarks.
//
// GENERATED by scripts/import-streeteasy.mjs from: ${sources}
// Don't edit by hand: download fresh CSVs from StreetEasy's Data Dashboard,
// re-run the import, then \`node build.mjs\`.
//
// Shape:
//   asOf     'YYYY-MM' — the month the figures describe (null = nothing imported yet)
//   areas[]  { slug, name, type, borough, parent, rents }
//     type     'neighborhood' | 'submarket' | 'borough' | 'city'
//     borough  borough name for neighborhoods/submarkets/boroughs ('Queens'), null for the city
//     parent   slug of the next-larger area, or null
//     rents    median asking rent by bedroom class — keys 0 (studio), 1, 2, 3 (3+).
//              A key is missing when StreetEasy publishes no figure for it.
//     counts   (optional) number of listings behind each median, same keys.

export const MARKET = {
  source: 'StreetEasy',
  sourceUrl: 'https://streeteasy.com/blog/data-dashboard',
  metric: 'median asking rent',
  asOf: '${asOf}',
  areas: [
${body}
  ],
};
`;
await writeFile(outPath, out);

// Coverage report.
const nbhds = list.filter((a) => a.type === 'neighborhood');
console.log(`wrote ${outPath} — ${list.length} areas, figures for ${asOf}`);
console.log(`sizes imported: ${sizes.map((b) => BED_LABEL[b]).join(', ')}${sizes.length < 4 ? ` (missing: ${[0, 1, 2, 3].filter((b) => !bySize[b]).map((b) => BED_LABEL[b]).join(', ')})` : ''}`);
for (const b of sizes) {
  const n = nbhds.filter((a) => a.rents[b]).length;
  const solid = nbhds.filter((a) => a.rents[b] && (!a.counts || (a.counts[b] ?? Infinity) >= 10)).length;
  console.log(`  ${BED_LABEL[b].padEnd(7)} ${n}/${nbhds.length} neighborhoods have a figure; ${solid} based on 10+ listings`);
}
const none = nbhds.filter((a) => !Object.keys(a.rents).length).map((a) => a.name);
if (none.length) console.log(`  no figure at any size (borough fallback): ${none.join(', ')}`);
