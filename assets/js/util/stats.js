// Tiny statistics helpers used by the scoring engine.

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function mean(arr) {
  const a = arr.filter((x) => x != null && !isNaN(x));
  if (!a.length) return null;
  return a.reduce((s, x) => s + x, 0) / a.length;
}

export function median(arr) {
  const a = arr.filter((x) => x != null && !isNaN(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

// Min/max with a sane fallback when the array is empty or flat.
export function range(arr) {
  const a = arr.filter((x) => x != null && !isNaN(x));
  if (!a.length) return { min: 0, max: 0 };
  return { min: Math.min(...a), max: Math.max(...a) };
}

// Map a value from [inLo, inHi] onto [outLo, outHi], clamped to the output range.
export function remap(v, inLo, inHi, outLo, outHi) {
  if (inHi === inLo) return (outLo + outHi) / 2;
  const t = (v - inLo) / (inHi - inLo);
  return clamp(outLo + t * (outHi - outLo), Math.min(outLo, outHi), Math.max(outLo, outHi));
}
