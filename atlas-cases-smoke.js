/* Runtime smoke test for atlas-cases.js (Phase 4C-1).

   Verifies the provision → public-case decoration in isolation:
     - the <collection>:<number> join key derivation
     - PUBLIC-only counting (private cases never counted or exposed)
     - missing key => no badge
     - DOM decoration: no nested <a>, provision href + text unchanged,
       native <details> disclosure, case links use the existing route
     - fail-soft behaviour

   Uses a tiny purpose-built DOM shim (no jsdom in this repo). Does NOT
   load or touch atlas-ui.js / atlas-core.js — Phase 4B stays frozen and
   its own suites (atlas-validate.js, atlas-ui-smoke.js) are unchanged.
*/
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;

// ---- minimal DOM shim ------------------------------------------------
class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.nodeType = 1;
    this.childNodes = [];
    this.className = '';
    this.dataset = {};
    this._text = '';
    this.attrs = {};
    this._listeners = {};
  }
  get children() { return this.childNodes.filter(n => n && n.nodeType === 1); }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  appendChild(c) {
    if (c && c.parentNode) c.parentNode.removeChild(c);
    this.childNodes.push(c);
    if (c) c.parentNode = this;
    return c;
  }
  insertBefore(c, ref) {
    if (c && c.parentNode) c.parentNode.removeChild(c);
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i === -1) this.childNodes.push(c); else this.childNodes.splice(i, 0, c);
    if (c) c.parentNode = this;
    return c;
  }
  removeChild(c) {
    this.childNodes = this.childNodes.filter(x => x !== c);
    if (c) c.parentNode = null;
    return c;
  }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k === 'class') this.className = String(v);
  }
  getAttribute(k) {
    if (k === 'class') return this.className || null;
    return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null;
  }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  _classes() { return String(this.className || '').trim().split(/\s+/).filter(Boolean); }
  matches(sel) {
    return sel.split(',').some(part => {
      part = part.trim();
      const m = /^([a-z0-9]+)?(?:\.([a-z0-9_-]+))?$/i.exec(part);
      if (!m) return false;
      if (m[1] && this.tagName !== m[1].toUpperCase()) return false;
      if (m[2] && this._classes().indexOf(m[2]) === -1) return false;
      return true;
    });
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c && c.nodeType === 1) {
          if (c.matches(sel)) out.push(c);
          walk(c);
        }
      }
    };
    walk(this);
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

const documentRoot = new El('div');
const atlasRoot = new El('div');
atlasRoot.setAttribute('id', 'atlas-root');
documentRoot.appendChild(atlasRoot);

global.window = global;
global.document = {
  readyState: 'complete',
  getElementById: (id) => (id === 'atlas-root' ? atlasRoot : null),
  createElement: (t) => new El(t),
  addEventListener: () => {},
};
// no global.fetch, no global.MutationObserver — atlas-cases.js must cope.

require(path.join(ROOT, 'atlas-cases.js'));
const AtlasCases = global.AtlasCases;
const I = AtlasCases._internal;

const INDEX = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'prototype/assets/cases/article-case-index.json'), 'utf8'));

let pass = 0, fail = 0;
function run(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message); }
}
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}

// helper: a fake rendered provision pill inside an .atlas-provision-list
function makePill(id) {
  const listWrap = new El('div');
  listWrap.setAttribute('class', 'atlas-provision-list');
  const a = new El('a');
  a.setAttribute('class', 'atlas-provision');
  a.setAttribute('href', 'codex-article-viewer.html?id=' + encodeURIComponent(id) + '&x=atlas');
  a.textContent = 'มาตรา ' + String(id).split('_').slice(1).join('_');
  listWrap.appendChild(a);
  return { listWrap, a };
}
function anchorsUnder(node) {
  return node.querySelectorAll('a');
}

// ================================================================
// DATA — join key
// ================================================================
run('keyFromHref: canonical single-instrument id', () => {
  eq(I.keyFromHref('codex-article-viewer.html?id=civil_1523&x=atlas'), 'civil:1523');
});
run('keyFromHref: x=atlas ordering / no x= both work', () => {
  eq(I.keyFromHref('codex-article-viewer.html?id=criminal_289'), 'criminal:289');
  eq(I.keyFromHref('codex-article-viewer.html?x=atlas&id=criminal_289'), 'criminal:289');
});
run('keyFromHref: url-encoded sub-number survives', () => {
  eq(I.keyFromHref('codex-article-viewer.html?id=civil_1447%2F2&x=atlas'), 'civil:1447/2');
});
run('keyFromHref: multi-instrument id is skipped (MVP scope)', () => {
  eq(I.keyFromHref('codex-article-viewer.html?id=' + encodeURIComponent('aviation_act::12')), null);
});
run('keyFromHref: junk / missing id → null, no throw', () => {
  eq(I.keyFromHref(''), null);
  eq(I.keyFromHref(null), null);
  eq(I.keyFromHref('codex-article-viewer.html'), null);
  eq(I.keyFromHref('codex-article-viewer.html?id=nounderscore'), null);
});

// ================================================================
// DATA — public-only counting
// ================================================================
run('publicCasesFor: counts PUBLIC cases only (criminal:289 = 14, not 17)', () => {
  I.setIndex(INDEX);
  const raw = INDEX['criminal:289'];
  const rawPub = raw.filter(c => c.public === true).length;
  const rawPriv = raw.length - rawPub;
  if (rawPriv < 1) throw new Error('fixture drift: criminal:289 has no private case to exclude');
  eq(I.publicCasesFor('criminal:289').length, rawPub, 'public count');
  eq(rawPub, 14, 'expected 14 public (fixture)');
});
run('publicCasesFor: all-private key → 0 (criminal:335)', () => {
  I.setIndex(INDEX);
  if (!INDEX['criminal:335']) throw new Error('fixture drift: criminal:335 missing');
  eq(I.publicCasesFor('criminal:335').length, 0);
});
run('publicCasesFor: missing key → 0, no throw', () => {
  I.setIndex(INDEX);
  eq(I.publicCasesFor('civil:9999').length, 0);
  eq(I.publicCasesFor('nonsense').length, 0);
  eq(I.publicCasesFor(null).length, 0);
});
run('publicCasesFor: malformed entries are dropped', () => {
  I.setIndex({ 'x:1': [null, {}, { public: true }, { public: true, id: 'ok-slug' }, { public: 'yes', id: 'q' }] });
  const r = I.publicCasesFor('x:1');
  eq(r.length, 1, 'only the well-formed public entry survives');
  eq(r[0].id, 'ok-slug');
});

// ================================================================
// DOM — decoration
// ================================================================
run('decoratePill: provision with 1 public case gets a wrapper + details', () => {
  I.setIndex(INDEX);
  const { listWrap, a } = makePill('civil_1523');
  I.decoratePill(a);
  const wrap = listWrap.children[0];
  eq(wrap.tagName, 'SPAN');
  eq(wrap.matches('.atlas-pcases'), true, 'wrapper class');
  eq(wrap.children[0], a, 'pill moved into wrapper');
  const d = wrap.querySelector('details');
  if (!d) throw new Error('no <details>');
  const sum = d.querySelector('summary');
  eq(sum.textContent, '· 1 คดี');
  const links = d.querySelectorAll('a');
  eq(links.length, 1);
  eq(links[0].getAttribute('href'), 'prototype/read-case.html?id=adultery-damages-landmark-2565');
  eq(links[0].getAttribute('target'), '_blank');
  eq(links[0].getAttribute('rel'), 'noopener');
});
run('decoratePill: NO nested <a> is created', () => {
  I.setIndex(INDEX);
  const { a } = makePill('civil_1523');
  I.decoratePill(a);
  eq(anchorsUnder(a).length, 0, 'provision <a> must have no descendant <a>');
});
run('decoratePill: provision href is UNCHANGED', () => {
  I.setIndex(INDEX);
  const { a } = makePill('civil_1523');
  const before = a.getAttribute('href');
  I.decoratePill(a);
  eq(a.getAttribute('href'), before);
});
run('decoratePill: badge does NOT replace the provision text', () => {
  I.setIndex(INDEX);
  const { a } = makePill('civil_1523');
  I.decoratePill(a);
  eq(a.textContent, 'มาตรา 1523');
});
run('decoratePill: count reflects PUBLIC cases only (criminal:289 → "14 คดี")', () => {
  I.setIndex(INDEX);
  const { listWrap, a } = makePill('criminal_289');
  I.decoratePill(a);
  const sum = listWrap.querySelector('summary');
  eq(sum.textContent, '· 14 คดี');
  eq(listWrap.querySelectorAll('.atlas-pcases-link').length, 14, 'only 14 links, no private');
});
run('decoratePill: no public cases → no wrapper, no badge, no broken DOM', () => {
  I.setIndex(INDEX);
  const { listWrap, a } = makePill('criminal_335');   // all-private
  I.decoratePill(a);
  eq(listWrap.children.length, 1, 'still just the pill');
  eq(listWrap.children[0], a);
  eq(listWrap.querySelector('details'), null);
  eq(a.dataset.casesDecorated, '1', 'still marked so it is not rescanned');
});
run('decoratePill: missing index key → no badge', () => {
  I.setIndex(INDEX);
  const { listWrap, a } = makePill('civil_999999');
  I.decoratePill(a);
  eq(listWrap.querySelector('details'), null);
});
run('decoratePill: idempotent — second call does not double-wrap', () => {
  I.setIndex(INDEX);
  const { listWrap, a } = makePill('civil_1523');
  I.decoratePill(a);
  I.decoratePill(a);
  eq(listWrap.querySelectorAll('details').length, 1);
});
run('decoratePill: fail-soft when not ready (no index loaded yet)', () => {
  I.reset();
  const { listWrap, a } = makePill('civil_1523');
  I.decoratePill(a);                         // must not throw, must not mark
  eq(listWrap.querySelector('details'), null);
  if (a.dataset.casesDecorated) throw new Error('marked before ready — decorateAll would skip it later');
});
run('eachPill + decorateAll: sweeps a subtree of rendered pills', () => {
  I.setIndex(INDEX);
  atlasRoot.childNodes = [];
  const { listWrap: w1 } = makePill('civil_1523');
  const { listWrap: w2 } = makePill('criminal_289');
  const { listWrap: w3 } = makePill('criminal_335');   // all-private → no badge
  atlasRoot.appendChild(w1); atlasRoot.appendChild(w2); atlasRoot.appendChild(w3);
  I.decorateAll();
  eq(atlasRoot.querySelectorAll('.atlas-pcases-d').length, 2, 'two provisions decorated, one skipped');
});

// ================================================================
console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
