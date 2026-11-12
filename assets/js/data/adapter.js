// Data adapter — the ONE place the app reads listings from.
//
// Today it merges the bundled seed file with any listings you've added in the
// browser (stored in localStorage). To go live with a real backend, implement
// `fetchRemoteListings()` below (e.g. Supabase/Airtable/your API) and the rest
// of the app needs no changes — every page reads through `getListings()`.

import { SEED_LISTINGS } from './listings.js';
import { loadUserListings } from '../util/storage.js';

// ---------------------------------------------------------------------------
// LIVE BACKEND HOOK (stub)
//
// Return a Promise resolving to an array of listings in the same shape as the
// objects in listings.js. Example with Supabase:
//
//   const res = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=*`, {
//     headers: { apikey: SUPABASE_ANON_KEY }
//   });
//   return res.json();
//
// Leave it returning null to stay in static/seed mode.
// ---------------------------------------------------------------------------
async function fetchRemoteListings() {
  return null;
}

let cache = null;

export async function getListings({ force = false } = {}) {
  if (cache && !force) return cache;
  const remote = await fetchRemoteListings();
  const base = Array.isArray(remote) ? remote : SEED_LISTINGS;
  // User-added listings are tagged so the UI can show a "draft" badge.
  const user = loadUserListings().map((l) => ({ ...l, _source: 'user' }));
  cache = [...base.map((l) => ({ ...l, _source: l._source || 'seed' })), ...user];
  return cache;
}

export function invalidate() {
  cache = null;
}

export async function getListing(id) {
  const all = await getListings();
  return all.find((l) => l.id === id) || null;
}
