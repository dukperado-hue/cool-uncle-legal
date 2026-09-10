/* Runtime smoke test for atlas-concepts.js  (F7-C1 — Concept structural anchors
   are actionable: a concept's "ตำแหน่งในสารบบกฎหมาย" hands the exact structural
   node to atlas.html through the shipped Phase-4B / F6 reveal contract).

   Loads atlas-core.js + registry + codex-data.json (so structure trees resolve)
   and atlas-concepts.js against a minimal DOM shim. Does NOT load atlas-ui /
   atlas-provision-view — concept.html is a cross-page context by design.

   Run:  node atlas-concept-anchor-smoke.js   (from the project root)
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
    this.parentNode = null;
    this.id = undefined;
    this.href = undefined;
    this._listeners = {};
  }
  get firstChild() { return this.childNodes[0] || null; }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  set innerHTML(v) { throw new Error('innerHTML must not be used for data text'); }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); if (c) c.parentNode = this; return c; }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); if (c) c.parentNode = null; return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { if (k === 'class') return this.className || null; return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  dispatch(type, evt) { (this._listeners[type] || []).forEach(fn => fn.call(this, evt)); }
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
const styleReg = {};
const documentObj = {
  head: headEl,
  getElementById: (id) => styleReg[id] || null,
  createElement: (t) => new El(t),
  createTextNode: (t) => { const n = new El('#text'); n.nodeType = 3; n._text = String(t); return n; },
};

global.window = global;
global.document = documentObj;
global.fetch = () => Promise.reject(new Error('no fetch in node smoke'));

require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
const AtlasCore = global.AtlasCore;
AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
AtlasCore.attachCorpus(JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8')));

require(path.join(ROOT, 'atlas-concepts.js'));
const AtlasConcepts = global.AtlasConcepts;
const AI = AtlasConcepts._internal;

const CONCEPT_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8'));
AI.setDoc(CONCEPT_DOC);

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// real prefix-chain resolution against the live structure tree
function pathChainExists(collection, wanted) {
  let tree;
  try { tree = AtlasCore.getStructureTree(collection); } catch (e) { return false; }
  if (!tree || !Array.isArray(tree.nodes)) return false;
  const set = new Set();
  (function w(ns) { (ns || []).forEach(n => { if (Array.isArray(n.path)) set.add(JSON.stringify(n.path)); if (n.children) w(n.children); }); })(tree.nodes);
  if (!Array.isArray(wanted) || !wanted.length) return false;
  for (let i = 1; i <= wanted.length; i++) if (!set.has(JSON.stringify(wanted.slice(0, i)))) return false;
  return true;
}

function renderConcept(slug) {
  const root = new El('div');
  const okR = AI.renderInto(root, slug);
  return { root, okR };
}
function anchorLinks(root) { return root.querySelectorAll('a.atlas-concept-anchor-link'); }

// ================================================================ A. existing anchors
run('A. published concepts (lamoed, nitikam) carry a structuralAnchor with a non-empty path', () => {
  ['lamoed', 'nitikam'].forEach(slug => {
    const c = CONCEPT_DOC.concepts[slug];
    ok(c, slug + ' present');
    ok(Array.isArray(c.structuralAnchor) && c.structuralAnchor.length, slug + ' has structuralAnchor');
    c.structuralAnchor.forEach(a => {
      ok(a.collection, slug + ' anchor has a collection');
      ok(Array.isArray(a.path) && a.path.length, slug + ' anchor path non-empty');
      ok(pathChainExists(a.collection, a.path),
         slug + ' anchor ' + a.collection + ':' + JSON.stringify(a.path) + ' resolves through the real tree');
    });
  });
});

// ================================================================ B. path correctness
run('B. lamoed -> civil -> ["บรรพ 2","ลักษณะ 5"] and it resolves through the real Atlas structure', () => {
  const anch = CONCEPT_DOC.concepts.lamoed.structuralAnchor;
  const hit = anch.find(a => a.collection === 'civil' &&
    JSON.stringify(a.path) === JSON.stringify(['บรรพ 2', 'ลักษณะ 5']));
  ok(hit, 'authored anchor is civil / [บรรพ 2, ลักษณะ 5]');
  ok(pathChainExists('civil', ['บรรพ 2', 'ลักษณะ 5']), 'prefix chain [บรรพ 2] then [บรรพ 2, ลักษณะ 5] both real');
  ok(!pathChainExists('civil', ['ลักษณะ 5', 'บรรพ 2']), 'wrong order is rejected (broken prefix)');
});

// ================================================================ C. navigation payload
run('C. activation payload is the { hash, instrument, path } restore shape (no invented instrument)', () => {
  const an = { collection: 'civil', path: ['บรรพ 2', 'ลักษณะ 5'], note: 'x' };
  eq(AI.anchorReturnPayload(an), { hash: '#/c/civil', instrument: null, path: ['บรรพ 2', 'ลักษณะ 5'] });
  eq(AI.anchorHash(an), '#/c/civil');
  // an authored anchor with an explicit instrument would carry it through untouched
  eq(AI.anchorReturnPayload({ collection: 'x', instrument: 'i1', path: ['p'] }),
     { hash: '#/c/x/i/i1', instrument: 'i1', path: ['p'] });
});

// ================================================================ D. cross-page hand-off
run('D. activation writes sessionStorage["atlas:return"] BEFORE navigating to atlas.html#/c/civil', () => {
  const store = {};
  const calls = [];
  global.sessionStorage = {
    setItem: (k, v) => { store[k] = String(v); },
    getItem: (k) => Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null,
  };
  global.location = {
    assign: (u) => calls.push({ fn: 'assign', url: u, returnAtCall: store['atlas:return'] }),
    href: '',
  };

  const okNav = AI.activateAnchor({ collection: 'civil', path: ['บรรพ 2', 'ลักษณะ 5'] });
  ok(okNav === true, 'activateAnchor returns true');
  eq(JSON.parse(store['atlas:return']),
     { hash: '#/c/civil', instrument: null, path: ['บรรพ 2', 'ลักษณะ 5'] },
     'atlas:return payload');
  eq(calls.length, 1, 'navigated exactly once');
  eq(calls[0].url, 'atlas.html#/c/civil', 'navigation target');
  ok(calls[0].returnAtCall && JSON.parse(calls[0].returnAtCall).path.length === 2,
     'atlas:return was already written when navigation fired');

  delete global.sessionStorage; delete global.location;
});

// ================================================================ E. fail-soft
run('E. no sessionStorage / throwing location.assign -> no crash, falls back to location.href', () => {
  delete global.sessionStorage;               // storage entirely absent
  let hrefSet = '';
  global.location = {
    assign: () => { throw new Error('assign blocked'); },
    set href(v) { hrefSet = v; }, get href() { return hrefSet; },
  };
  const okNav = AI.activateAnchor({ collection: 'civil', path: ['บรรพ 2', 'ลักษณะ 5'] });
  ok(okNav === true, 'still reports navigation via fallback');
  eq(hrefSet, 'atlas.html#/c/civil', 'fell back to location.href');
  delete global.location;
});

run('E2. rendering a concept with no sessionStorage/location present does not throw', () => {
  delete global.sessionStorage; delete global.location;
  const { root, okR } = renderConcept('lamoed');
  ok(okR === true, 'renderInto succeeded');
  ok(anchorLinks(root).length >= 1, 'anchor link rendered');
});

run('E3. a malformed anchor (no collection) is inert, never throws', () => {
  ok(AI.anchorReturnPayload({ path: ['x'] }) === null, 'no payload');
  ok(AI.activateAnchor({ path: ['x'] }) === false, 'no navigation');
  ok(AI.activateAnchor(null) === false, 'null-safe');
});

// ================================================================ F. keyboard / anchor semantics
run('F. structural anchor is a real, keyboard-reachable <a> that activates on an unmodified click', () => {
  delete global.sessionStorage; delete global.location;
  const store = {}; const calls = [];
  global.sessionStorage = { setItem: (k, v) => { store[k] = String(v); }, getItem: (k) => store[k] || null };
  global.location = { assign: (u) => calls.push(u), href: '' };

  const { root } = renderConcept('lamoed');
  const a = anchorLinks(root)[0];
  ok(a && a.tagName === 'A', 'is an <a> element');
  ok(String(a.href || '').indexOf('atlas.html#/c/civil') === 0, 'href is the collection route (fallback target): ' + a.href);
  ok(a.getAttribute('tabindex') !== '-1', 'not removed from the tab order');
  ok((a._listeners.click || []).length === 1, 'has exactly one click handler');
  ok(a.getAttribute('title') && a.getAttribute('title').indexOf('ลักษณะ 5') !== -1, 'has a descriptive title');

  // Enter on a focused link fires a click with button 0 / no modifiers
  let prevented = false;
  a.dispatch('click', { button: 0, preventDefault: () => { prevented = true; } });
  ok(prevented === true, 'default navigation prevented in favour of the reveal hand-off');
  eq(calls, ['atlas.html#/c/civil'], 'navigated to the collection route');
  eq(JSON.parse(store['atlas:return']).path, ['บรรพ 2', 'ลักษณะ 5'], 'reveal path handed off');

  // a modified click (open in new tab) is left to the browser: no preventDefault, no hand-off
  calls.length = 0; delete store['atlas:return'];
  let prevented2 = false;
  a.dispatch('click', { button: 0, metaKey: true, preventDefault: () => { prevented2 = true; } });
  ok(prevented2 === false, 'modified click not intercepted');
  eq(calls, [], 'modified click did not trigger the hand-off navigation');

  delete global.sessionStorage; delete global.location;
});

// ================================================================ contract (source-level)
run('G. atlas-concepts.js adds no new mechanism (no AtlasUI, no location.hash, no history)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'atlas-concepts.js'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\bAtlasUI\b/.test(code), 'never references AtlasUI');
  ok(!/\blocation\s*\.\s*hash\b/.test(code), 'never touches location.hash');
  ok(!/\bhistory\s*\.\s*(pushState|replaceState)\s*\(/.test(code), 'never touches history');
  ok(/['"]atlas:return['"]/.test(code) && /sessionStorage/.test(code), 'reuses the atlas:return hand-off key');
  ok(/location\s*\.\s*assign\s*\(/.test(code), 'navigates via location.assign');
  const raw = fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8');
  ok(!/"instrument"\s*:/.test(raw), 'no instrument field added to the schema');
});

console.log('\n----------------------------------------');
console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
console.log('----------------------------------------');
process.exit(fail ? 1 : 0);
