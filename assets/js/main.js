// App bootstrap: wire the router to pages and keep the header in sync.

import { route, startRouter, setNotFound } from './util/router.js';
import { renderHeader } from './components/header.js';
import { homePage } from './pages/home.js';
import { listingPage } from './pages/listing.js';
import { methodologyPage } from './pages/methodology.js';
import { addPage } from './pages/add.js';
import { el, mount } from './util/dom.js';

const headerRoot = document.getElementById('app-header');
const appRoot = document.getElementById('app');

function withChrome(fn) {
  return (ctx) => {
    renderHeader(headerRoot);
    return fn(appRoot, ctx);
  };
}

route('#/', withChrome(homePage));
route('#/listing/:id', withChrome(listingPage));
route('#/methodology', withChrome(() => methodologyPage(appRoot)));
route('#/add', withChrome(() => addPage(appRoot)));

setNotFound(() => {
  renderHeader(headerRoot);
  mount(appRoot, el('div', { class: 'mx-auto max-w-3xl px-4 py-16 text-center' }, [
    el('p', { class: 'text-slate-500' }, 'Page not found.'),
    el('a', { href: '#/', class: 'mt-3 inline-block text-emerald-600 underline' }, 'Back to browse'),
  ]));
});

startRouter();
