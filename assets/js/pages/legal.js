// Privacy and Terms pages. Written from what the code actually does (see the
// inventory in docs/DESIGN_AUDIT.md). DRAFTS: the owner and a qualified lawyer
// must review them, and fill every [[TODO]], before they're relied on.

import { el, mount } from '../util/dom.js';
import { USER_LISTINGS_KEY } from '../util/storage.js';

const POLICY_VERSION = '0.1 (draft)';

// A visible, searchable placeholder for details only the owner can supply.
function legalTodo(text) {
  return el('mark', { class: 'rounded bg-amber-100 px-1 text-amber-900' }, `[[TODO: ${text}]]`);
}

function legalDraftBanner() {
  return el('p', { class: 'mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800', role: 'note' },
    'DRAFT: requires review by a qualified lawyer before publishing.');
}

function legalSection(title, children) {
  return el('section', { class: 'mt-8' }, [
    el('h2', { class: 'text-lg font-bold text-slate-900' }, title),
    ...children,
  ]);
}

const legalP = (children) => el('p', { class: 'mt-2 text-sm leading-6 text-slate-700' }, children);
const legalList = (items) => el('ul', { class: 'mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700' }, items.map((i) => el('li', {}, i)));
const legalExt = (href, text) => el('a', { href, target: '_blank', rel: 'noopener', class: 'text-accent underline' }, text);

function legalHeader(title) {
  return [
    el('h1', { class: 'text-3xl font-extrabold tracking-tight text-slate-900' }, title),
    el('p', { class: 'mt-2 text-sm text-slate-600' }, ['Version ', POLICY_VERSION, ' · Effective ', legalTodo('effective date')]),
    legalDraftBanner(),
  ];
}

function legalStorageTable() {
  const th = (t) => el('th', { scope: 'col', class: 'px-3 py-2 text-left font-semibold text-slate-900' }, t);
  const td = (t) => el('td', { class: 'px-3 py-2 align-top text-slate-700' }, t);
  return el('div', { class: 'mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white' }, [
    el('table', { class: 'w-full text-sm' }, [
      el('caption', { class: 'sr-only' }, 'Browser storage used by DealScore'),
      el('thead', { class: 'border-b border-slate-200' }, el('tr', {}, [th('Name'), th('Type'), th('Set by'), th('Purpose'), th('Category'), th('Duration')])),
      el('tbody', {}, el('tr', {}, [
        td(el('code', { class: 'font-mono text-xs' }, USER_LISTINGS_KEY)),
        td('localStorage'),
        td('DealScore, in your browser'),
        td('Keeps the listings you add on the Add listing page.'),
        td('Necessary for the feature you use'),
        td('Until you remove the listings or clear site data'),
      ])),
    ]),
  ]);
}

export function privacyPage(root) {
  mount(root, el('article', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    ...legalHeader('Privacy policy'),

    legalSection('Who runs DealScore', [
      legalP(['DealScore is run by ', legalTodo('owner or legal entity name'), '. Contact: ', legalTodo('contact email'), '.']),
    ]),

    legalSection('What DealScore collects', [
      legalP('Nothing is sent to us. DealScore has no accounts, no sign-up, no analytics, no advertising, and sets no cookies.'),
      legalP('Listings you add on the Add listing page are saved only in your own browser\'s storage (see the table below). They are not uploaded anywhere. You can remove them one at a time or all at once on the Add listing page, or by clearing this site\'s data in your browser.'),
    ]),

    legalSection('Services your browser contacts', [
      legalP('Like any website, loading DealScore makes your browser contact a few services. Each receives your IP address and standard browser information (such as user agent and the page that made the request) under its own privacy policy:'),
      legalList([
        ['Website hosting: ', legalTodo('confirm host, e.g. GitHub Pages'), '. ', legalExt('https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement', 'GitHub\'s privacy statement'), ' describes what it logs for GitHub Pages sites.'],
        ['Tailwind CSS (cdn.tailwindcss.com), on every page, to style the site.'],
        ['OpenStreetMap tile servers (tile.openstreetmap.org), only when a map is shown. ', legalExt('https://osmfoundation.org/wiki/Privacy_Policy', 'OSMF privacy policy'), '.'],
        ['Photo hosts: if you add photo links to a listing, your browser loads those images from the sites in the links.'],
      ]),
      legalP('The fonts and map library are hosted with DealScore itself, so no font or library CDN is contacted. StreetEasy, RentCafe and other linked sites are contacted only if you click a link to them.'),
    ]),

    legalSection('Cookies and browser storage', [
      legalP('DealScore sets no cookies. It uses one browser-storage entry:'),
      legalStorageTable(),
      legalP('Because nothing optional is loaded, there is no cookie banner. If analytics or similar tools are ever added, they will load only after you agree.'),
    ]),

    legalSection('Your choices and rights', [
      legalP('Since DealScore holds no personal data about you, there is nothing for us to access, correct, export or delete on our side. Your saved listings are under your control in your browser.'),
      legalP(['Depending on where you live (for example under the GDPR or the CCPA), you may have additional rights: ', legalTodo('lawyer to confirm which apply and the legal basis, if any'), '. Questions about this policy: ', legalTodo('contact email'), '.']),
    ]),

    legalSection('Children', [
      legalP(['DealScore is a tool for adults looking for apartments and is not directed at children. ', legalTodo('owner to confirm the site is not aimed at or likely to attract children under 13 / under 16 in the EU'), '.']),
    ]),

    legalSection('Changes to this policy', [
      legalP('If this policy changes, the new version and its effective date will be posted on this page.'),
    ]),
  ]));
}

export function termsPage(root) {
  mount(root, el('article', { class: 'mx-auto max-w-3xl px-4 py-8' }, [
    ...legalHeader('Terms of use'),

    legalSection('What DealScore is', [
      legalP(['DealScore is a free tool, run by ', legalTodo('owner or legal entity name'), ', that gives an apartment a Deal Score from 0 to 100. The score compares the rent you enter with StreetEasy\'s published median asking rent for the neighborhood and bedroom count, and adds points for amenities, laundry, condition and size. See ', el('a', { href: '#/methodology', class: 'text-accent underline' }, 'How scoring works'), '.']),
    ]),

    legalSection('Not advice', [
      legalP('The Deal Score is an automated estimate for comparison only. It is not an appraisal and not financial, legal or real-estate advice. Median asking rents describe what landlords ask, not what tenants sign for, and every apartment differs. Check the details with the landlord or broker before you decide.'),
    ]),

    legalSection('Data sources', [
      legalList([
        ['Market rents: ', legalExt('https://streeteasy.com/blog/data-dashboard', 'StreetEasy Data Dashboard'), '. DealScore is not affiliated with, endorsed by or sponsored by StreetEasy or Zillow Group.'],
        ['Typical apartment sizes (space bonus): rounded from RentCafe\'s published NYC averages.'],
        ['Map data: © OpenStreetMap contributors.'],
      ]),
      legalP('These sources may be incomplete, out of date or wrong, and DealScore does not guarantee the accuracy of any figure or score.'),
    ]),

    legalSection('Listings you add', [
      legalP('Listings you enter are stored only in your browser. You are responsible for what you enter, including having the right to use any photo links you add.'),
    ]),

    legalSection('Acceptable use', [
      legalP('Don\'t use DealScore to break the law, to infringe others\' rights, or to interfere with the site or the services it relies on.'),
    ]),

    legalSection('Disclaimers and liability', [
      legalP(['DealScore is provided "as is", without warranties of any kind. ', legalTodo('lawyer to supply disclaimer and limitation-of-liability wording for the governing jurisdiction'), '.']),
    ]),

    legalSection('Governing law', [
      legalP([legalTodo('governing law and jurisdiction'), '.']),
    ]),

    legalSection('Changes and contact', [
      legalP(['If these terms change, the new version and its effective date will be posted on this page. Questions: ', legalTodo('contact email'), '.']),
    ]),
  ]));
}
