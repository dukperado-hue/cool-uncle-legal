/* Runtime smoke test for atlas-ui.js using a minimal DOM shim.
   Catches ReferenceErrors / bad property access across every render path,
   and verifies the Phase 3A lazy renderer (initial DOM stays small; child
   rows + provision pills are built only on expand). */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;

// ---- minimal DOM shim -------------------------------------------------
class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = [];
    this.className = ''; this.dataset = {}; this.style = {}; this._text = '';
    this.hidden = false; this.attrs = {}; this.href = ''; this.type = '';
    this._listeners = {}; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text || this.children.map(c => c.textContent).join(''); }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  get innerHTML() { return this._html || ''; }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  get firstChild() { return this.children[0] || null; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  dispatch(ev) { (this._listeners[ev] || []).forEach(fn => fn({ type: ev })); }
  querySelectorAll() { return []; }
  querySelector() { return null; }
}
global.document = {
  createElement: (t) => new El(t),
  getElementById: () => new El('div'),
  addEventListener: () => {},
};
global.window = global;
global.location = { hash: '', search: '' };
global.history = { replaceState: () => {} };
global.window.scrollTo = () => {};
global.window.addEventListener = () => {};

require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-ui.js'));
const AtlasCore = global.AtlasCore, AtlasUI = global.AtlasUI;

AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
AtlasCore.attachCorpus(JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8')));

let pass = 0, fail = 0;
function run(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message + '\n' + (e.stack || '').split('\n')[1]); }
}

// ---- DOM introspection helpers -------------------------------------
function countEl(node) {
  let n = 1;
  for (const c of node.children || []) n += countEl(c);
  return n;
}
function collect(node, pred, out) {
  out = out || [];
  if (pred(node)) out.push(node);
  for (const c of node.children || []) collect(c, pred, out);
  return out;
}
const hasClass = (n, c) => typeof n.className === 'string' &&
  (' ' + n.className + ' ').indexOf(' ' + c + ' ') !== -1;
const isProvision = (n) => hasClass(n, 'atlas-provision') || hasClass(n, 'atlas-provision-cancelled');
const isNode = (n) => hasClass(n, 'atlas-node');

const root = new El('div');
function mount(hash) { global.location.hash = hash; AtlasUI.mount(root); }

// ---- basic render coverage ---------------------------------------
run('home view renders (subject areas + collection cards)', () => {
  mount('#/');
  if (!root.children.length) throw new Error('empty root');
});
run('collection — criminal', () => mount('#/c/criminal'));
run('collection — const2560', () => mount('#/c/const2560'));
run('collection — tortofficials (flat)', () => mount('#/c/tortofficials'));
run('every enabled collection renders without throwing', () => {
  for (const c of AtlasCore.listCollections()) mount('#/c/' + c.key);
});
run('unknown route falls back to home', () => mount('#/c/nonexistent'));
run('parseRoute understands #/c/<c>/i/<i>', () => {
  global.location.hash = '#/c/aviation/i/act';
  const r = AtlasUI.parseRoute();
  if (r.view !== 'instrument' || r.collection !== 'aviation' || r.instrument !== 'act')
    throw new Error(JSON.stringify(r));
});
run('instrument route renders (aviation/act, no corpus)', () => mount('#/c/aviation/i/act'));

// ---- Phase 3A lazy renderer -------------------------------------
run('LAZY: initial civil render is small (no full 1843-provision tree)', () => {
  mount('#/c/civil');
  const total = countEl(root);
  const provisions = collect(root, isProvision).length;
  const nodes = collect(root, isNode).length;
  if (provisions !== 0) throw new Error('expected 0 provision pills on load, got ' + provisions);
  if (total > 2000) throw new Error('initial DOM too big: ' + total + ' elements');
  if (nodes < 6 || nodes > 120) throw new Error('unexpected node-row count: ' + nodes);
  console.log('        (civil initial: ' + total + ' els, ' + nodes + ' node-rows, ' + provisions + ' pills)');
});

run('LAZY: expanding a civil branch builds child rows on demand', () => {
  mount('#/c/civil');
  const before = countEl(root);
  // find the first collapsed expandable node (a ลักษณะ under an open บรรพ)
  const nodes = collect(root, (n) => typeof n._atlasSetOpen === 'function');
  const target = nodes.find(n => {
    const body = n.children.find(c => /atlas-node-body/.test(c.className || ''));
    return body && body.hidden;
  });
  if (!target) throw new Error('no collapsed node found');
  target._atlasSetOpen(true);
  const after = countEl(root);
  if (after <= before) throw new Error('expand added no DOM (' + before + ' -> ' + after + ')');
  console.log('        (expand one ลักษณะ: ' + before + ' -> ' + after + ' els)');
});

run('LAZY: expandAll on const2560 materialises provision pills', () => {
  mount('#/c/const2560');
  const before = collect(root, isProvision).length;
  const opened = AtlasUI._internal.expandAll(root);
  const after = collect(root, isProvision).length;
  if (before !== 0) throw new Error('expected 0 pills before expandAll, got ' + before);
  if (after !== 279) throw new Error('expected 279 pills after expandAll, got ' + after + ' (opened ' + opened + ')');
  // every pill points at the unchanged viewer URL
  const bad = collect(root, isProvision).filter(a => !/^codex-article-viewer\.html\?id=const2560_/.test(a.href));
  if (bad.length) throw new Error(bad.length + ' pills have unexpected href, e.g. ' + bad[0].href);
  console.log('        (const2560 expandAll: ' + opened + ' nodes opened, ' + after + ' pills, all ?id=const2560_*)');
});

run('LAZY: full civil expandAll stays feasible (data + DOM under budget)', () => {
  mount('#/c/civil');
  const t0 = Date.now();
  AtlasUI._internal.expandAll(root, 100000);
  const dt = Date.now() - t0;
  const pills = collect(root, isProvision).length;
  if (pills !== 1843) throw new Error('expected 1843 pills, got ' + pills);
  console.log('        (civil expandAll: ' + dt + 'ms, ' + pills + ' pills, ' + countEl(root) + ' els — this is the worst case, only if user opens everything)');
});

run('flat Act (tortofficials) shows provisions directly, unchanged URLs', () => {
  mount('#/c/tortofficials');
  const pills = collect(root, isProvision);
  if (pills.length !== 5) throw new Error('expected 5 pills, got ' + pills.length);
  if (!pills.every(a => /^codex-article-viewer\.html\?id=tortofficials_/.test(a.href)))
    throw new Error('bad href: ' + pills.map(a => a.href).join(', '));
});

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
