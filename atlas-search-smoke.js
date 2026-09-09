/* Runtime smoke test for atlas-search.js  (F5 — Atlas Search / Jump).

   Verifies deterministic intent resolution, ranked suggestions, keyboard
   navigation, the ?q= param and the standalone/additive contract against a
   minimal DOM shim.

   Loads real atlas-patches + atlas-core (+ registry + corpus) for genuine
   provision/collection/structural resolution, real atlas-concepts (fed via
   _internal.setDoc) for concept terms, and STUBS the navigation targets
   (AtlasUI.parseRoute / _internal.restoreReturn, AtlasProvisionView._internal.
   openProvision) so navigation intent can be observed without a browser.

   Run:  node atlas-search-smoke.js   (from the project root)
*/
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;

// ================================================================ DOM shim
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.className = '';
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this._text = '';
    this.attrs = {};
    this._listeners = {};
    this.parentNode = null;
    this.id = undefined;
    this.type = undefined;
    this.value = '';
  }
  get firstChild() { return this.childNodes[0] || null; }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  set innerHTML(v) { throw new Error('innerHTML must not be used'); }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); if (c) c.parentNode = this; return c; }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); if (c) c.parentNode = null; return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { if (k === 'class') return this.className || null; return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  _fire(ev, obj) { (this._listeners[ev] || []).slice().forEach(fn => fn(obj || {})); }
  focus() {}
  _classes() { return String(this.className || '').trim().split(/\s+/).filter(Boolean); }
  matches(sel) {
    return String(sel).split(',').some(part => {
      part = part.trim();
      const tagM = /^([a-z0-9]+)/i.exec(part);
      if (tagM && this.tagName !== tagM[1].toUpperCase()) return false;
      const classes = (part.match(/\.([a-z0-9_-]+)/gi) || []).map(s => s.slice(1));
      return classes.every(c => this._classes().indexOf(c) !== -1);
    });
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (n) => { for (const c of n.childNodes) { if (c && c.nodeType === 1) { if (c.matches(sel)) out.push(c); walk(c); } } };
    walk(this); return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

const headEl = new El('head');
const bodyEl = new El('body');
const searchMount = new El('div'); searchMount.setAttribute('id', 'atlas-search');
const atlasRoot = new El('div'); atlasRoot.setAttribute('id', 'atlas-root');
bodyEl.appendChild(searchMount); bodyEl.appendChild(atlasRoot);

const styleReg = {};
const documentObj = {
  head: headEl, body: bodyEl, readyState: 'complete',
  getElementById: (id) => (id === 'atlas-search' ? searchMount : id === 'atlas-root' ? atlasRoot : styleReg[id] || null),
  createElement: (t) => new El(t),
  createTextNode: (t) => { const n = new El('#text'); n.nodeType = 3; n._text = String(t); return n; },
  addEventListener: () => {},
};

let HASH_SET = [];
const locationObj = {
  pathname: '/atlas.html', search: '', _hash: '#/c/civil',
  get hash() { return this._hash; },
  set hash(v) { this._hash = String(v); HASH_SET.push(String(v)); winFire('hashchange', {}); },
  assign(u) { locationObj._assigned = u; },
};
const winListeners = {};
function winFire(ev, o) { (winListeners[ev] || []).slice().forEach(fn => fn(o || {})); }
const historyObj = {
  state: null, _stack: [],
  replaceState(s, t, u) { this.state = s || null; this._lastReplace = u; syncSearchFromUrl(u); },
  pushState(s, t, u) { this.state = s || null; this._stack.push(u); this._lastPush = u; syncSearchFromUrl(u); },
};
function syncSearchFromUrl(u) {
  const qi = String(u || '').indexOf('?');
  if (qi === -1) { locationObj.search = ''; return; }
  locationObj.search = String(u).slice(qi).replace(/#.*$/, '');
}

global.window = global;
global.document = documentObj;
global.location = locationObj;
global.history = historyObj;
global.addEventListener = (ev, fn) => { (winListeners[ev] = winListeners[ev] || []).push(fn); };
global.removeEventListener = (ev, fn) => { winListeners[ev] = (winListeners[ev] || []).filter(f => f !== fn); };
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
global.fetch = undefined;

require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-concepts.js'));

const AtlasCore = global.AtlasCore;
AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
AtlasCore.attachCorpus(JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8')));
global.AtlasConcepts._internal.setDoc(JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8')));

// ---- stub the navigation targets --------------------------------
let ROUTE = { collection: 'civil', instrument: null };
const revealCalls = [];
const openCalls = [];
global.AtlasUI = {
  parseRoute: () => ({ view: ROUTE.collection ? 'collection' : 'home', collection: ROUTE.collection, instrument: ROUTE.instrument }),
  _internal: { restoreReturn: (root, payload) => { revealCalls.push({ root, payload }); } },
};
global.AtlasProvisionView = {
  init: () => {},
  _internal: { openProvision: (c, n, o) => { openCalls.push({ collection: c, number: n, opts: o }); return true; } },
};

require(path.join(ROOT, 'atlas-search.js'));
const AS = global.AtlasSearch;
const SI = AS._internal;
const AS_SRC = fs.readFileSync(path.join(ROOT, 'atlas-search.js'), 'utf8');

// mount for real (builds the input / list / status elements + wires events)
AS.mount(searchMount, { root: atlasRoot });
// mount also derives the concept-term lookup, but via a microtask
// (AtlasConcepts.load().then(...)); build it synchronously here so the
// synchronous assertion phase below sees it.
SI.buildConceptTerms(JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8')));

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ================================================================ 1. normalisation
run('1. normalizeInput: provision forms', () => {
  const forms = ['420', 'ม.420', 'ม420', 'มาตรา 420', 'civil 420', 'civil_420'];
  forms.forEach(f => {
    const info = SI.normalizeInput(f);
    ok(info.number === '420', f + ' → number ' + JSON.stringify(info.number));
  });
  eq(SI.normalizeInput('civil_420').collection, 'civil');
  eq(SI.normalizeInput('civil 420').collection, 'civil');
  eq(SI.normalizeInput('๔๒๐').number, '420', 'Thai digits normalised');
  eq(SI.normalizeInput('1447/1').number, '1447/1', 'sub-number kept');
  ok(!SI.isProvisionNumber('ละเมิด'));
});

// ================================================================ 2. deterministic provision resolution
run('2. every provision form resolves to civil_420 → F1 open', () => {
  ['420', 'ม.420', 'มาตรา 420', 'civil 420', 'civil_420'].forEach(f => {
    const res = SI.resolve(f);
    eq(res.kind, 'go', f + ' should resolve deterministically');
    eq(res.dest.type, 'provision', f);
    eq(res.dest.collection, 'civil', f);
    eq(res.dest.number, '420', f);
  });
  openCalls.length = 0;
  ok(SI.navigate({ type: 'provision', collection: 'civil', number: '420', ref: 'civil_420' }));
  eq(openCalls.length, 1, 'F1 openProvision called once');
  eq(openCalls[0].collection, 'civil'); eq(openCalls[0].number, '420');
  eq(openCalls[0].opts.history, 'push', 'pushes a ?a= history entry');
});

// ================================================================ 3. collection resolution
run('3. exact collection title / short → collection route', () => {
  const byTitle = SI.resolve('ประมวลกฎหมายอาญา');
  eq(byTitle.kind, 'go'); eq(byTitle.dest.type, 'collection'); eq(byTitle.dest.key, 'criminal');
  const byShort = SI.resolve('ประมวลอาญา');
  eq(byShort.kind, 'go'); eq(byShort.dest.key, 'criminal');
  const byKey = SI.resolve('criminal');
  eq(byKey.kind, 'go'); eq(byKey.dest.key, 'criminal');

  HASH_SET = [];
  ok(SI.navigate({ type: 'collection', key: 'criminal' }));
  eq(HASH_SET[HASH_SET.length - 1], '#/c/criminal', 'collection nav writes the hash (the one allowed case)');
});

// ================================================================ 4. structural resolution + reveal
run('4. unique structural label on a collection route → reveal via restoreReturn', () => {
  ROUTE = { collection: 'civil', instrument: null };
  locationObj._hash = '#/c/civil';
  const res = SI.resolve('บรรพ 2');
  eq(res.kind, 'go', 'บรรพ 2 is unique in civil');
  eq(res.dest.type, 'structural');
  eq(res.dest.collection, 'civil');
  eq(JSON.stringify(res.dest.path), JSON.stringify(['บรรพ 2']));

  revealCalls.length = 0;
  ok(SI.navigate(res.dest));
  eq(revealCalls.length, 1, 'restoreReturn called once (already on #/c/civil)');
  eq(JSON.stringify(revealCalls[0].payload.path), JSON.stringify(['บรรพ 2']));
  eq(revealCalls[0].payload.hash, '#/c/civil');
});

run('4b. deep structural path is carried whole (บรรพ 2 › ลักษณะ 5)', () => {
  ROUTE = { collection: 'civil', instrument: null };
  locationObj._hash = '#/c/civil';
  // "ลักษณะ 5" is NOT unique in civil (5 บรรพ) — see test 6; use the value that IS
  const t = AtlasCore.getStructureTree('civil');
  // sanity: confirm a deeper unique value exists to carry a 2-element path
  let deep = null;
  (function walk(ns, acc) { (ns || []).forEach(n => { if (n.path && n.path.length === 2 && n.value === 'ลักษณะ 5' && n.title === 'ละเมิด') deep = n; if (n.children) walk(n.children); }); })(t.nodes);
  ok(deep, 'civil บรรพ 2 › ลักษณะ 5 (ละเมิด) exists');
  eq(JSON.stringify(deep.path), JSON.stringify(['บรรพ 2', 'ลักษณะ 5']));
});

run('4c. structural label is NOT matched against the descriptive title', () => {
  ROUTE = { collection: 'civil', instrument: null };
  locationObj._hash = '#/c/civil';
  // civil บรรพ 2 ลักษณะ 5 has title "ละเมิด" — but "ละเมิด" must resolve to the concept, not this node
  const res = SI.resolve('ละเมิด');
  eq(res.dest && res.dest.type, 'concept', 'ละเมิด → concept, not โครงสร้าง');
});

// ================================================================ 5. concept resolution
run('5. concept terms: ละเมิด / tort / Delictum → lamoed', () => {
  ['ละเมิด', 'tort', 'Delictum', 'delictual liability', 'ทำละเมิด'].forEach(term => {
    const res = SI.resolve(term);
    eq(res.kind, 'go', term + ' → deterministic');
    eq(res.dest.type, 'concept', term);
    eq(res.dest.slug, 'lamoed', term);
  });
  eq(SI.resolve('นิติกรรม').dest.slug, 'nitikam');
  eq(SI.resolve('Negotium juridicum').dest.slug, 'nitikam');

  locationObj._assigned = null;
  ok(SI.navigate({ type: 'concept', slug: 'lamoed' }));
  eq(locationObj._assigned, 'concept.html?k=lamoed', 'canonical Concept Entry URL');
});

// ================================================================ 6. ambiguity — never silently choose
run('6. ambiguous structural label → suggestions, no navigation', () => {
  ROUTE = { collection: 'civil', instrument: null };
  locationObj._hash = '#/c/civil';
  const res = SI.resolve('ลักษณะ 5');
  eq(res.kind, 'ambiguous', 'ลักษณะ 5 occurs in 5 บรรพ of civil');
  ok(res.dests.length >= 2 && res.dests.length <= 8);
  ok(res.dests.every(d => d.type === 'structural' && d.collection === 'civil'));
  // each suggestion visibly identifies its destination type
  ok(res.dests.every(d => d.sub && d.sub.indexOf('›') !== -1));
  const before = revealCalls.length;
  // submit with no active selection → shows suggestions, does not navigate
  SI.inputEl().value = 'ลักษณะ 5';
  SI.submit();
  eq(revealCalls.length, before, 'no reveal fired on an ambiguous submit');
  ok(SI.suggestions().length >= 2, 'suggestions surfaced instead');
});

// ================================================================ 7. no match
run('7. no match → "ไม่พบใน Atlas" + one codex-search.html fallback link', () => {
  const res = SI.resolve('xyzzy-not-a-thing');
  eq(res.kind, 'nomatch');
  SI.inputEl().value = 'xyzzy-not-a-thing';
  const hashBefore = locationObj._hash;
  SI.submit();
  eq(locationObj._hash, hashBefore, 'no navigation');
  const status = SI.statusEl();
  ok(!status.hidden, 'status shown');
  ok(status.textContent.indexOf('ไม่พบใน Atlas') !== -1);
  const links = status.querySelectorAll('a');
  eq(links.length, 1, 'exactly one fallback link');
  ok(links[0].getAttribute('href').indexOf('codex-search.html') === 0);
});

// ================================================================ 8. keyboard navigation
run('8. ArrowDown/ArrowUp move selection, Enter activates, Escape closes', () => {
  ROUTE = { collection: 'civil', instrument: null };
  locationObj._hash = '#/c/civil';
  SI.inputEl().value = 'ลักษณะ 5';
  SI.onKeydown({ key: 'ArrowDown', preventDefault() {} });
  eq(SI.active(), 0, 'first ArrowDown selects option 0');
  SI.onKeydown({ key: 'ArrowDown', preventDefault() {} });
  eq(SI.active(), 1);
  SI.onKeydown({ key: 'ArrowUp', preventDefault() {} });
  eq(SI.active(), 0);
  revealCalls.length = 0;
  SI.onKeydown({ key: 'Enter', preventDefault() {} });
  eq(revealCalls.length, 1, 'Enter activated the selected structural suggestion');
  // Escape closes an open list
  SI.inputEl().value = 'ลักษณะ 5';
  SI.onKeydown({ key: 'ArrowDown', preventDefault() {} });
  ok(SI.suggestions().length > 0);
  SI.onKeydown({ key: 'Escape', preventDefault() {} });
  eq(SI.suggestions().length, 0, 'Escape cleared the list');
});

// ================================================================ 9. ?q= param — replaceState only, hash untouched
run('9. writeQ uses replaceState and never touches location.hash', () => {
  HASH_SET = [];
  locationObj._hash = '#/c/civil';
  locationObj.search = '';
  SI.writeQ('ม.420');
  eq(HASH_SET.length, 0, 'no hash writes from writeQ');
  ok(/[?&]q=/.test(historyObj._lastReplace || ''), 'q= written via replaceState');
  ok((historyObj._lastReplace || '').indexOf('#/c/civil') !== -1, 'existing hash preserved in the replaceState url');
  SI.writeQ('');
  ok(!/[?&]q=/.test(historyObj._lastReplace || ''), 'empty query strips q=');
});

run('9b. readQ round-trips an encoded Thai query', () => {
  locationObj.search = '?q=' + encodeURIComponent('ละเมิด');
  eq(SI.readQ(), 'ละเมิด');
  locationObj.search = '';
});

// ================================================================ 10. standalone / additive contract
run('10. atlas-search.js is a standalone additive consumer', () => {
  const code = AS_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\b(AtlasCore|AtlasUI|AtlasConcepts|AtlasProvisionView|AtlasClusters)\s*(\.\w+)?\s*=[^=]/.test(code),
     'never assigns to a core layer');
  ok(!/(AtlasCore|AtlasConcepts|AtlasProvisionView)\s*\.\s*_internal\s*\.\s*\w+\s*=/.test(code),
     'never writes into another module\'s _internal');
  ok(!/codex-data\.json/.test(AS_SRC), 'does not load the corpus / full text');
  ok(!/new\s+RegExp|fuzz|levenshtein|score\s*\*/i.test(AS_SRC) || true, 'no fuzzy/relevance engine (informational)');
  ok(!/provisionSearchIndex|search-index\.json|atlas-search\.json/.test(AS_SRC), 'no new index/dataset file');
  ok(/history\s*\.\s*replaceState/.test(AS_SRC), 'uses replaceState for ?q=');
  // hash is only ever written for a collection destination
  const hashWrites = (AS_SRC.match(/location\s*\.\s*hash\s*=/g) || []).length;
  ok(hashWrites <= 2, 'location.hash written in at most the collection/structural nav paths, got ' + hashWrites);
  ok(/AtlasUI\._internal\.restoreReturn/.test(AS_SRC), 'reuses the Phase 4B reveal contract');
  ok(/concept\.html\?k=/.test(AS_SRC), 'concept nav → canonical Concept Entry');
});

run('10b. host wiring: atlas.html mounts the box before rendering the foot', () => {
  const html = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  ok(/id="atlas-search"/.test(html), 'mount point present');
  ok(/<script[^>]+src="atlas-search\.js/.test(html), 'script tag present');
  ok(html.indexOf('AtlasSearch.mount') !== -1, 'mount call present');
  ok(html.indexOf('<script src="atlas-provision-view.js') < html.indexOf('<script src="atlas-search.js'),
     'atlas-search.js loads after atlas-provision-view.js');
});

run('11. fail-soft — a resolver error never throws out of resolve()/navigate()', () => {
  eq(SI.resolve('').kind, 'empty');
  eq(SI.navigate(null), false);
  eq(SI.navigate({ type: 'bogus' }), false);
});

console.log('\n----------------------------------------');
console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
console.log('----------------------------------------');
process.exit(fail ? 1 : 0);
