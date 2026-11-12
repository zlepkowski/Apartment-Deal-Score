// Photo gallery for the listing page: a CSS scroll-snap carousel, so it swipes
// natively on touch screens, plus prev/next buttons, arrow keys, a counter,
// and dots. A photo that fails to load is replaced by a placeholder so the
// numbering stays stable.

import { el } from '../util/dom.js';
import { photoUrls } from '../util/format.js';

export function photoGallery(listing, { heightClass = 'h-64 sm:h-96' } = {}) {
  const urls = photoUrls(listing);
  const n = urls.length;
  let index = 0;

  const slides = urls.map((src, i) => el('div', { class: 'relative h-full w-full shrink-0 snap-center bg-slate-200' }, [
    el('img', {
      src,
      alt: `${listing.title} — photo ${i + 1} of ${n}`,
      loading: i === 0 ? 'eager' : 'lazy',
      class: 'h-full w-full object-cover',
      onError: (e) => e.target.replaceWith(
        el('div', { class: 'grid h-full w-full place-items-center text-sm text-slate-500' }, 'Photo unavailable')),
    }),
  ]));

  const track = el('div', {
    class: 'ds-gallery-track flex h-full snap-x snap-mandatory overflow-x-auto',
    tabindex: '0',
    role: 'region',
    'aria-roledescription': 'carousel',
    'aria-label': `Photos of ${listing.title}`,
  }, slides);

  const counter = el('div', { class: 'absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white tabular-nums' });
  const dots = urls.map((_, i) => el('button', {
    type: 'button',
    'aria-label': `Show photo ${i + 1}`,
    class: 'h-2 w-2 rounded-full bg-white/60 transition',
    onClick: () => go(i),
  }));

  const arrow = (dir, label, glyph) => el('button', {
    type: 'button',
    'aria-label': label,
    class: `absolute top-1/2 ${dir < 0 ? 'left-3' : 'right-3'} grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-lg font-bold text-slate-800 shadow hover:bg-white disabled:opacity-0`,
    onClick: () => go(index + dir),
  }, glyph);
  const prev = arrow(-1, 'Previous photo', '‹');
  const next = arrow(1, 'Next photo', '›');

  function sync() {
    counter.textContent = `${index + 1} / ${n}`;
    dots.forEach((d, i) => { d.className = `h-2 w-2 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/60'}`; });
    prev.disabled = index === 0;
    next.disabled = index === n - 1;
  }

  function go(i) {
    const target = Math.max(0, Math.min(n - 1, i));
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
  }

  // The scroll position is the source of truth (swipes and buttons both land here).
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (i !== index) {
      index = i;
      sync();
    }
  }, { passive: true });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });

  sync();

  return el('div', { class: `relative overflow-hidden rounded-2xl bg-slate-200 ${heightClass}` }, [
    track,
    n > 1 ? prev : null,
    n > 1 ? next : null,
    n > 1 ? counter : null,
    n > 1 ? el('div', { class: 'absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2 py-1.5' }, dots) : null,
  ]);
}
