// Formatting helpers — money, numbers, and the small bits of text the UI repeats.

export function money(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function moneySigned(n) {
  if (n == null || isNaN(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
}

export function ppsf(rent, sqft) {
  if (!rent || !sqft) return null;
  return rent / sqft;
}

export function ppsfText(rent, sqft) {
  const v = ppsf(rent, sqft);
  return v == null ? '—' : '$' + v.toFixed(2) + '/sqft';
}

export function beds(n) {
  if (n === 0) return 'Studio';
  return n + ' bd';
}

export function bedsLong(n) {
  if (n === 0) return 'Studio';
  return n + ' bed' + (n === 1 ? '' : 's');
}

export function num(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US');
}

export function pct(n) {
  if (n == null || isNaN(n)) return '—';
  return Math.round(n) + '%';
}

// Title-case a slug like "north-loop" -> "North Loop".
export function titleize(slug) {
  return String(slug)
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Returns the URL if it's an absolute http(s) URL, else null. Use for any
// user- or backend-supplied link/image so `javascript:` and friends never
// reach an href or src.
export function httpUrl(u) {
  try {
    const parsed = new URL(String(u));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}
