/* Runtime smoke test for atlas-clusters.js + atlas-clusters.json (FINALIZATION 2).

   Verifies the Related Provision Legal Clusters layer in isolation against a
   minimal DOM shim, plus one integration check that a cluster member pill
   opens through the existing Finalization-1 in-context reader.

   Loads atlas-patches + atlas-core for real provision resolution, and
   atlas-provision-view.js for the reader-integration check. Does NOT load
   atlas-ui.js.
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
  }
  get children() { return this.childNodes.filter(n => n && n.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const i = this.parentNode.childNodes.indexOf(this);
    return i === -1 ? null : (this.parentNode.childNodes[i + 1] || null);
  }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  set innerHTML(v) { throw new Error('innerHTML must not be used for legal/relationship text'); }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); if (c) c.parentNode = this; return c; }
  insertBefore(c, ref) {
    if (c && c.parentNode) c.parentNode.removeChild(c);
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i === -1) this.childNodes.push(c); else this.childNodes.splice(i, 0, c);
    if (c) c.parentNode = this; return c;
  }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); if (c) c.parentNode = null; return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); }
  getAttribute(k) { if (k === 'class') return this.className || null; return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  _fire(ev, obj) { (this._listeners[ev] || []).slice().forEach(fn => fn(obj)); }
  focus() { documentObj.activeElement = this; }
  _classes() { return String(this.className || '').trim().split(/\s+/).filter(Boolean); }
  get classList() {
    const self = this;
    return {
      contains: (c) => self._classes().indexOf(c) !== -1,
      add: (c) => { if (self._classes().indexOf(c) === -1) self.className = (self.className + ' ' + c).trim(); },
      remove: (c) => { self.className = self._classes().filter(x => x !== c).join(' '); },
    };
  }
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
  contains(n) { let cur = n; while (cur) { if (cur === this) return true; cur = cur.parentNode; } return false; }
}
class TextNode { constructor(t) { this.nodeType = 3; this._text = String(t); this.parentNode = null; this.childNodes = []; } get textContent() { return this._text; } }

const headEl = new El('head');
const bodyEl = new El('body');
const atlasRoot = new El('div');
atlasRoot.setAttribute('id', 'atlas-root');
bodyEl.appendChild(atlasRoot);

const documentObj = {
  head: headEl, body: bodyEl, activeElement: bodyEl, readyState: 'complete',
  getElementById: (id) => (id === 'atlas-root' ? atlasRoot : null),
  createElement: (t) => new El(t),
  createTextNode: (t) => new TextNode(t),
  addEventListener: () => {}, _l: {},
  contains: (n) => bodyEl.contains(n),
};

const locationObj = { pathname: '/atlas.html', search: '', hash: '#/c/criminal' };
const winListeners = {};
const historyStack = [{ url: '/atlas.html#/c/criminal', state: null }];
function applyUrl(u) {
  let hash = '', search = '', pathname = u;
  const hi = u.indexOf('#'); if (hi !== -1) { hash = u.slice(hi); pathname = u.slice(0, hi); }
  const qi = pathname.indexOf('?'); if (qi !== -1) { search = pathname.slice(qi); pathname = pathname.slice(0, qi); }
  locationObj.pathname = pathname || '/atlas.html'; locationObj.search = search; locationObj.hash = hash;
}
const historyObj = {
  get state() { return historyStack[historyStack.length - 1].state; },
  pushState(s, t, u) { historyStack.push({ url: u, state: s || null }); applyUrl(u); },
  replaceState(s, t, u) { historyStack[historyStack.length - 1] = { url: u, state: s || null }; applyUrl(u); },
  back() { if (historyStack.length > 1) { historyStack.pop(); const top = historyStack[historyStack.length - 1]; applyUrl(top.url); (winListeners['popstate'] || []).slice().forEach(fn => fn({ type: 'popstate', state: top.state })); } },
};

global.window = global;
global.document = documentObj;
global.location = locationObj;
global.history = historyObj;
global.addEventListener = (ev, fn) => { (winListeners[ev] = winListeners[ev] || []).push(fn); };
global.requestAnimationFrame = undefined;
global.fetch = undefined;   // clusters + cases load → null / {} ; fail soft

// ================================================================ load modules
require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-clusters.js'));
require(path.join(ROOT, 'atlas-provision-view.js'));

const AtlasCore = global.AtlasCore;
const AC = global.AtlasClusters;
const CI = AC._internal;
const APV = global.AtlasProvisionView;
const PVI = APV._internal;

AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
AtlasCore.attachCorpus(JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8')));

const CLUSTERS_RAW = fs.readFileSync(path.join(ROOT, 'atlas-clusters.json'), 'utf8');
const CLUSTERS = JSON.parse(CLUSTERS_RAW);
CI.setDoc(CLUSTERS);   // stand in for the async fetch

const CLUSTERS_JS_SRC = fs.readFileSync(path.join(ROOT, 'atlas-clusters.js'), 'utf8');

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

const FROZEN = ['general-special', 'base-aggravated', 'rule-exception', 'contrast-set', 'trigger-consequence', 'precondition'];

// ================================================================ 1. golden provisions resolve
run('1. all 7 golden provisions resolve through AtlasCore', () => {
  ['59', '288', '289', '334', '336', '339', '340'].forEach(n => {
    const r = AtlasCore.resolveProvision('criminal', n);
    ok(r && r.article && typeof r.article.text === 'string' && r.article.text.length > 5, 'criminal_' + n + ' resolves with text');
  });
});

// ================================================================ 2. every patternId is one of the six
run('2. every patternId (patternKinds + cluster + member) is one of the six frozen ids', () => {
  const kinds = Object.keys(CLUSTERS.patternKinds || {});
  eq(kinds.length, 6, 'six patternKinds defined');
  kinds.forEach(k => ok(FROZEN.indexOf(k) !== -1, 'patternKind ' + k + ' is frozen'));
  (CLUSTERS.clusters || []).forEach(c => {
    if (c.patternId) ok(FROZEN.indexOf(c.patternId) !== -1, 'cluster ' + c.id + ' patternId ' + c.patternId);
    (c.members || []).forEach(m => {
      if (m.patternId) ok(FROZEN.indexOf(m.patternId) !== -1, 'member ' + m.ref + ' patternId ' + m.patternId);
    });
  });
});

run('2b. all six frozen patterns are actually used by curated clusters', () => {
  const used = new Set();
  (CLUSTERS.clusters || []).forEach(c => {
    if (c.patternId) used.add(c.patternId);
    (c.members || []).forEach(m => { if (m.patternId) used.add(m.patternId); });
  });
  FROZEN.forEach(p => ok(used.has(p), 'pattern ' + p + ' is used in at least one cluster'));
});

// ================================================================ 3. no permanent provision role field
run('3. no provision gets a permanent role/kind/pattern field (data + code)', () => {
  // codex-data.json articles carry no such field
  const codex = JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8'));
  const a = codex.books.criminal.articles['288'];
  ok(!('role' in a) && !('kind' in a) && !('pattern' in a) && !('patternId' in a), 'criminal_288 has no role/kind/pattern field');
  // atlas-clusters.js never assigns .role / .kind / .pattern on anything
  const codeNoComments = CLUSTERS_JS_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\.\s*(role|kind|pattern)\s*=/.test(codeNoComments), 'atlas-clusters.js assigns no .role/.kind/.pattern');
  // relationships live on members, not provisions — a member is { ref, ... }, keyed by ref
  (CLUSTERS.clusters || []).forEach(c => (c.members || []).forEach(m => {
    ok(typeof m.ref === 'string' && m.ref.indexOf('_') > 0, 'member identity is a stable ref, not a mutated provision');
  }));
});

// ================================================================ 4. Golden Cluster A
run('4. Cluster A (crim-homicide-fault-to-aggravation): 59→G1, 289→G2, anchor 288', () => {
  const c = (CLUSTERS.clusters || []).find(x => x.id === 'crim-homicide-fault-to-aggravation');
  ok(c, 'cluster A present');
  eq(c.anchor, 'criminal_288', 'anchor is 288');
  const m59 = c.members.find(m => m.ref === 'criminal_59');
  const m288 = c.members.find(m => m.ref === 'criminal_288');
  const m289 = c.members.find(m => m.ref === 'criminal_289');
  ok(m59 && m288 && m289, 'all three members present');
  eq(m59.patternId, 'general-special', '59 → 288/289 is general-special (G1)');
  eq(m289.patternId, 'base-aggravated', '288 → 289 is base-aggravated (G2)');
  ok(typeof m288.order === 'number' && typeof m289.order === 'number' && m288.order < m289.order, '288 then 289');
  ok(m59.order == null, '59 is the overlay member (no order)');
  ok(typeof c.explanationTH === 'string' && c.explanationTH.length > 20, 'cluster A has a Thai explanation');
});

// ================================================================ 5. Golden Cluster B ordered progression
run('5. Cluster B (crim-theft-family-progression) preserves 334→336→339→340', () => {
  const c = (CLUSTERS.clusters || []).find(x => x.id === 'crim-theft-family-progression');
  ok(c, 'cluster B present');
  const seq = c.members.filter(m => typeof m.order === 'number').sort((a, b) => a.order - b.order).map(m => m.ref);
  eq(JSON.stringify(seq), JSON.stringify(['criminal_334', 'criminal_336', 'criminal_339', 'criminal_340']), 'ordered progression');
  eq(c.members.find(m => m.ref === 'criminal_59').patternId, 'general-special', '59 overlay is G1');
  seq.forEach(ref => ok(AtlasCore.resolveProvision('criminal', ref.split('_')[1]).article, ref + ' resolves'));
});

// ================================================================ 6. member pill shape → in-context reader
run('6. cluster member pills carry class atlas-provision + &x=atlas href (reader reuse)', () => {
  const c = (CLUSTERS.clusters || []).find(x => x.id === 'crim-homicide-fault-to-aggravation');
  const block = CI.clusterBlock(c, 'criminal_288');
  const pills = block.querySelectorAll('a');
  ok(pills.length >= 3, 'block has >=3 provision links');
  pills.forEach(a => {
    ok(a.classList.contains('atlas-provision'), 'pill has class atlas-provision');
    const href = a.getAttribute('href') || '';
    ok(/^codex-article-viewer\.html\?id=/.test(href) && /[?&]x=atlas(&|$)/.test(href), 'pill href is the frozen viewer + x=atlas — got ' + href);
  });
  // the current provision is marked
  ok(block.querySelector('span.atlas-cluster-cell.is-current'), 'the open provision (288) is marked is-current');
});

run('6b. clicking a cluster member pill drives the existing in-context reader', () => {
  PVI.reset();
  applyUrl('/atlas.html#/c/criminal');
  historyStack.length = 0; historyStack.push({ url: '/atlas.html#/c/criminal', state: null });
  // open the reader on criminal_288
  ok(PVI.openProvision('criminal', '288', { history: 'push' }), 'reader opened on 288');
  ok(APV.isOpen(), 'panel open');
  const panel = PVI.panelEl();
  // render cluster A into the panel and click the "289" pill
  const block = CI.clusterBlock((CLUSTERS.clusters).find(x => x.id === 'crim-homicide-fault-to-aggravation'), 'criminal_288');
  panel.appendChild(block);
  const pill289 = block.querySelectorAll('a').find(a => /id=criminal_289/.test(a.getAttribute('href')));
  ok(pill289, 'found the 289 pill');
  const e = { type: 'click', target: pill289, button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  panel._fire('click', e);
  ok(e.defaultPrevented, 'the panel click handler intercepted the pill (no navigation away)');
  ok(/มาตรา 289/.test(PVI.panelEl().textContent), 'reader advanced to มาตรา 289');
  eq(PVI.readParam(), 'criminal_289', '?a= now points at criminal_289');
});

// ================================================================ 7. unknown ref fails safe
run('7. an unknown provision ref renders a marked-missing pill, never throws', () => {
  CI.setDoc({
    patternKinds: CLUSTERS.patternKinds,
    clusters: [{ id: 'x', titleTH: 't', explanationTH: 'e', members: [{ ref: 'criminal_9999999', noteTH: 'n' }] }]
  });
  const block = CI.clusterBlock(CI.doc().clusters[0], null);
  const a = block.querySelector('a');
  ok(a, 'a pill was still rendered');
  ok(a.classList.contains('atlas-cluster-ref-missing'), 'pill is marked missing');
  eq(CI.clustersFor('criminal', '9999999').length, 1, 'index still works for the unknown ref');
  CI.setDoc(CLUSTERS);   // restore
});

run('7b. malformed cluster data does not break rendering', () => {
  CI.setDoc({ clusters: [null, { id: 'a' }, { id: 'b', members: 'nope' }, { members: [] }] });
  ok(Array.isArray(CI.doc().clusters), 'still parsed');
  eq(CI.clustersFor('criminal', '288').length, 0, 'no bad cluster indexed');
  CI.setDoc(CLUSTERS);
});

// ================================================================ 8. no statutory text duplicated
run('8. atlas-clusters.json contains NO statutory text (no ตัวบท copied from Codex)', () => {
  const openings = [
    'ผู้ใดฆ่าผู้อื่น ต้องระวางโทษ',                 // criminal_288
    'ผู้ใดจงใจหรือประมาทเลินเล่อ ทำต่อบุคคลอื่น',   // civil_420
    'ผู้ใดเอาทรัพย์ของผู้อื่น'                        // criminal_334
  ];
  openings.forEach(s => ok(CLUSTERS_RAW.indexOf(s) === -1, 'json does not contain the ตัวบท snippet: ' + s.slice(0, 18) + '…'));
  // no field named "text" anywhere in the cluster tree
  const scan = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(scan);
    ok(!('text' in o), 'no "text" field in cluster data');
    Object.values(o).forEach(scan);
  };
  scan(CLUSTERS.clusters);
});

// ================================================================ extra: one provision → many clusters
run('extra. criminal_59 belongs to BOTH golden clusters (a provision joins many clusters)', () => {
  const list = CI.clustersFor('criminal', '59');
  const ids = list.map(c => c.id);
  ok(ids.indexOf('crim-homicide-fault-to-aggravation') !== -1 && ids.indexOf('crim-theft-family-progression') !== -1,
     'criminal_59 → [homicide, theft] — got ' + ids.join(', '));
});

// ================================================================ extra: G4 anchorless contrast set
run('extra. contrast-set cluster is anchorless / directionless (G4 shape)', () => {
  const c = (CLUSTERS.clusters).find(x => x.id === 'crim-mistake-in-person-vs-aberratio');
  ok(c, 'contrast cluster present');
  ok(!c.anchor, 'no anchor');
  eq(c.patternId, 'contrast-set', 'patternId contrast-set');
  ok(c.members.every(m => m.order == null), 'no member has an order');
  const block = CI.clusterBlock(c, null);
  ok(block.querySelector('div.atlas-cluster-members.is-set'), 'rendered as a set row');
  ok(!block.querySelector('div.atlas-cluster-members.is-seq'), 'no ordered-sequence row');
});

// ================================================================ extra: additive / no mutation
run('extra. atlas-clusters.js never mutates AtlasCore / AtlasUI, never touches the hash', () => {
  const code = CLUSTERS_JS_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\b(AtlasCore|AtlasUI)\s*(\.\w+)?\s*=[^=]/.test(code), 'no assignment to AtlasCore/AtlasUI');
  ok(!/(AtlasCore|AtlasUI)\._internal/.test(code), 'no AtlasCore/AtlasUI internals');
  ok(!/\blocation\s*\.\s*hash\b/.test(code) && !/\bhistory\s*\.\s*(pushState|replaceState)\s*\(/.test(code), 'never touches hash / history');
  ok(/codex-article-viewer\.html\?id=/.test(CLUSTERS_JS_SRC) && /x=atlas/.test(CLUSTERS_JS_SRC), 'reuses the frozen viewer URL + x=atlas');
});

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
