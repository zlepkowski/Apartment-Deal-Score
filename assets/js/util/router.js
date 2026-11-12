// A tiny hash router. Routes look like "#/", "#/listing/:id", "#/add".
// Each route is matched in registration order; the first match wins.

const routes = [];
let notFound = null;

export function route(pattern, handler) {
  // Compile "#/listing/:id" into a regex with named groups.
  const parts = pattern.replace(/^#?\/?/, '').split('/').filter(Boolean);
  const keys = [];
  const rx = parts.map((p) => {
    if (p.startsWith(':')) {
      keys.push(p.slice(1));
      return '([^/]+)';
    }
    return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  const regex = new RegExp('^' + (rx.length ? rx.join('/') : '') + '$');
  routes.push({ regex, keys });
  routes[routes.length - 1].handler = handler;
}

export function setNotFound(handler) {
  notFound = handler;
}

function current() {
  return (location.hash || '#/').replace(/^#\/?/, '');
}

function parseQuery() {
  const q = {};
  const i = current().indexOf('?');
  if (i === -1) return q;
  const sp = new URLSearchParams(current().slice(i + 1));
  for (const [k, v] of sp.entries()) q[k] = v;
  return q;
}

function dispatch() {
  const raw = current();
  const path = raw.split('?')[0];
  const query = parseQuery();
  for (const r of routes) {
    const m = path.match(r.regex);
    if (m) {
      const params = {};
      r.keys.forEach((k, idx) => (params[k] = decodeURIComponent(m[idx + 1])));
      window.scrollTo(0, 0);
      return r.handler({ params, query });
    }
  }
  if (notFound) notFound();
}

export function navigate(hash) {
  if (location.hash === hash) dispatch();
  else location.hash = hash;
}

export function startRouter() {
  window.addEventListener('hashchange', dispatch);
  dispatch();
}
