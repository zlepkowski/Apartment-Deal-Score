// App bootstrap: wire the router to pages, keep the header in sync, and handle
// the things every page needs — document title, focus after navigation,
// loading and error states, and a short crossfade between pages.

import { route, startRouter, setNotFound, refresh } from './util/router.js';
import { renderHeader } from './components/header.js';
import { homePage } from './pages/home.js';
import { listingPage } from './pages/listing.js';
import { methodologyPage } from './pages/methodology.js';
import { addPage } from './pages/add.js';
import { privacyPage, termsPage } from './pages/legal.js';
import { el, mount } from './util/dom.js';

const headerRoot = document.getElementById('app-header');
const appRoot = document.getElementById('app');
const DEFAULT_TITLE = 'DealScore — NYC apartments scored by value';
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let firstRender = true;

function loadingView() {
  return el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-600', role: 'status' }, 'Loading…');
}

function errorView() {
  return el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center', role: 'alert' }, [
    el('p', { class: 'font-semibold text-slate-900' }, 'This page didn\'t load.'),
    el('p', { class: 'mt-1 text-sm text-slate-600' }, 'Something went wrong while preparing it. Try again, or go back to Browse.'),
    el('div', { class: 'mt-4 flex justify-center gap-3' }, [
      el('button', { type: 'button', class: 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover', onClick: () => refresh() }, 'Try again'),
      el('a', { href: '#/', class: 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50' }, 'Go to Browse'),
    ]),
  ]);
}

// Render a page with a loading state (only if it takes over 300ms) and an
// error state with a retry.
async function renderWithStates(render) {
  const timer = setTimeout(() => mount(appRoot, loadingView()), 300);
  try {
    await render();
  } catch (err) {
    console.error(err);
    mount(appRoot, errorView());
  } finally {
    clearTimeout(timer);
  }
}

// `title` is the page's default document title; pages can refine it.
function page(title, fn) {
  return (ctx) => {
    const run = () => {
      renderHeader(headerRoot);
      document.title = title ? `${title} — DealScore` : DEFAULT_TITLE;
      return renderWithStates(() => fn(appRoot, ctx));
    };
    const initial = firstRender;
    firstRender = false;
    // Crossfade between pages where supported (View Transitions API).
    const done = !initial && document.startViewTransition && !prefersReducedMotion()
      ? document.startViewTransition(run).updateCallbackDone
      : run();
    // After navigating, move focus to the new content for keyboard and
    // screen-reader users. Not on first load, so the skip link stays first.
    Promise.resolve(done).then(() => { if (!initial) appRoot.focus({ preventScroll: true }); }, () => {});
  };
}

route('#/', page('', homePage));
route('#/listing/:id', page('Listing', listingPage));
route('#/methodology', page('How scoring works', () => methodologyPage(appRoot)));
route('#/add', page('Add a listing', () => addPage(appRoot)));
route('#/privacy', page('Privacy', () => privacyPage(appRoot)));
route('#/terms', page('Terms', () => termsPage(appRoot)));

setNotFound(page('Page not found', () => {
  mount(appRoot, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
    el('h1', { class: 'text-xl font-bold text-slate-900' }, 'Page not found'),
    el('a', { href: '#/', class: 'mt-3 inline-block py-1 text-accent underline' }, 'Go to Browse'),
  ]));
}));

// The app routes on the URL hash, so the skip link moves focus instead of
// navigating to #app (which the router would treat as an unknown page).
document.querySelector('[data-skip-link]')?.addEventListener('click', (e) => {
  e.preventDefault();
  appRoot.focus();
});

startRouter();
