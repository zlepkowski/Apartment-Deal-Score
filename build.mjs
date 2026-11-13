// Concatenates the modular ES sources into a single classic <script> bundle
// so that `index.html` works when opened directly via file:// — browsers
// block `import` from file:// URLs.
//
// Usage:  node build.mjs
// Output: dist/dealscore.js

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Topological order: dependencies before consumers, main.js last.
const order = [
  'assets/js/util/format.js',
  'assets/js/util/stats.js',
  'assets/js/util/dom.js',
  'assets/js/util/router.js',
  'assets/js/util/storage.js',
  'assets/js/data/amenities.js',
  'assets/js/data/listings.js',
  'assets/js/data/market.js',
  'assets/js/data/adapter.js',
  'assets/js/core/score.js',
  'assets/js/components/icons.js',
  'assets/js/components/scoreBadge.js',
  'assets/js/components/map.js',
  'assets/js/components/gallery.js',
  'assets/js/components/header.js',
  'assets/js/components/listingCard.js',
  'assets/js/components/filters.js',
  'assets/js/pages/home.js',
  'assets/js/pages/listing.js',
  'assets/js/pages/methodology.js',
  'assets/js/pages/add.js',
  'assets/js/pages/legal.js',
  'assets/js/main.js',
];

function stripModuleSyntax(src) {
  // Drop every `import { ... } from '...'` (single or multi-line).
  let out = src.replace(/^import\s+\{[\s\S]*?\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
  // Strip `export ` prefix from declarations.  We keep the declared name.
  out = out.replace(/^export\s+(default\s+)?(const|let|var|function|class|async\s+function)\b/gm, '$2');
  // Strip standalone `export { ... };` re-exports — we don't use them but
  // catch any future ones.
  out = out.replace(/^export\s+\{[^}]*\}\s*;?\s*$/gm, '');
  return out;
}

const banner = `/* DealScore — bundled build. Source: ./assets/js/ */\n`;

const chunks = [];
for (const rel of order) {
  const abs = resolve(here, rel);
  const src = await readFile(abs, 'utf8');
  chunks.push(`/* ===== ${rel} ===== */\n${stripModuleSyntax(src).trim()}\n`);
}

const body = chunks.join('\n');
const bundle = `${banner}(function(){\n'use strict';\n${body}\n})();\n`;

await mkdir(resolve(here, 'dist'), { recursive: true });
await writeFile(resolve(here, 'dist/dealscore.js'), bundle);

console.log(`wrote dist/dealscore.js — ${(bundle.length / 1024).toFixed(1)} KB`);

// Cache-busting: GitHub Pages lets browsers cache files for 10 minutes, so
// stamp index.html's script and stylesheet URLs with a content hash. A changed
// file gets a new URL and is fetched fresh as soon as index.html reloads.
const fingerprint = (text) => createHash('sha256').update(text).digest('hex').slice(0, 10);
const css = await readFile(resolve(here, 'assets/css/styles.css'), 'utf8');
const indexPath = resolve(here, 'index.html');
const html = await readFile(indexPath, 'utf8');
const stamped = html
  .replace(/\.\/dist\/dealscore\.js(\?v=[0-9a-f]+)?/, `./dist/dealscore.js?v=${fingerprint(bundle)}`)
  .replace(/\.\/assets\/css\/styles\.css(\?v=[0-9a-f]+)?/, `./assets/css/styles.css?v=${fingerprint(css)}`);
if (stamped !== html) {
  await writeFile(indexPath, stamped);
  console.log('stamped index.html with new asset versions');
}
