// Photo gallery for the listing page: a CSS scroll-snap carousel, so it swipes
// natively on touch screens, plus prev/next buttons, arrow keys, a counter,
// and dots. A photo that fails to load is replaced by a placeholder so the
// numbering stays stable.

import { el } from '../util/dom.js';
import { photoUrls } from '../util/format.js';
import { icon } from './icons.js';

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

  const counter = el('div', { class: 'num absolute right-3 top-3 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs font-medium text-white', 'aria-hidden': 'true' });
  // Each dot is an 8px mark inside a 24px button, so the hit area meets the
  // minimum target size without changing how it looks.
  const dotMarks = urls.map(() => el('span', { class: 'block h-2 w-2 rounded-full bg-white/60', 'aria-hidden': 'true' }));
  const dots = urls.map((_, i) => el('button', {
    type: 'button',
    'aria-label': `Show photo ${i + 1}`,
    class: 'grid h-6 w-6 place-items-center rounded-full',
    onClick: () => go(i),
  }, [dotMarks[i]]));

  const arrow = (dir, label, iconName) => el('button', {
    type: 'button',
    'aria-label': label,
    class: `absolute top-1/2 ${dir < 0 ? 'left-3' : 'right-3'} grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white disabled:invisible`,
    onClick: () => go(index + dir),
  }, [icon(iconName, { size: 20 })]);
  const prev = arrow(-1, 'Previous photo', 'chevron-left');
  const next = arrow(1, 'Next photo', 'chevron-right');

  function sync() {
    counter.textContent = `${index + 1} / ${n}`;
    dotMarks.forEach((d, i) => { d.className = `block h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/60'}`; });
    dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
    prev.disabled = index === 0;
    next.disabled = index === n - 1;
  }

  function go(i) {
    const target = Math.max(0, Math.min(n - 1, i));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: target * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
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
    n > 1 ? el('div', { class: 'absolute bottom-2 left-1/2 flex -translate-x-1/2 rounded-full bg-slate-900/40 px-1' }, dots) : null,
  ]);
}
