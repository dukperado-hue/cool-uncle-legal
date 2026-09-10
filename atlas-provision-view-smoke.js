/* Runtime smoke test for atlas-provision-view.js (Phase 4E-1).

   Verifies the inline provision viewer in isolation against a minimal DOM +
   history + location shim (no jsdom in this repo):

     - provision href parsing  (single + multi-instrument + junk)
     - AtlasCore.resolveProvision integration: text, cancelled, breadcrumb, adjacent
     - plain-click interception vs. modifier / middle-click passthrough
     - case-link / node-case-link clicks are NOT intercepted
     - malformed / unknown provision → fail soft (href left to run)
     - no nested <a> inside a provision pill
     - panel open / close, Escape, focus restoration
     - deep-link (?a=<n>#/c/<col>) opens the panel
     - Back closes the panel and NEVER changes location.hash (so AtlasUI is
       never told to re-render the tree)

   Loads atlas-patches + atlas-core for real resolution; does NOT load
   atlas-ui.js — Phase 4B stays frozen and its own suites are unchanged.
*/
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;

// ================================================================
// minimal DOM shim
// ================================================================
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
  set innerHTML(v) { throw new Error('innerHTML must not be used for legal text'); }
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
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); }
  getAttribute(k) {
    if (k === 'class') return this.className || null;
    return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null;
  }
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
      const m = /^([a-z0-9]+)?(?:\[([a-z-]+)\])?(?:\.([a-z0-9_-]+))?(?::[a-z-]+(?:\([^)]*\))?)?$/i.exec(part);
      if (!m) return false;
      if (m[1] && this.tagName !== m[1].toUpperCase()) return false;
      if (m[2] && !Object.prototype.hasOwnProperty.call(this.attrs, m[2])) return false;
      if (m[3] && this._classes().indexOf(m[3]) === -1) return false;
      return true;
    });
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c && c.nodeType === 1) { if (c.matches(sel)) out.push(c); walk(c); }
      }
    };
    walk(this);
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  contains(n) {
    let cur = n;
    while (cur) { if (cur === this) return true; cur = cur.parentNode; }
    return false;
  }
}
class TextNode { constructor(t) { this.nodeType = 3; this._text = String(t); this.parentNode = null; this.childNodes = []; }
  get textContent() { return this._text; } }

const headEl = new El('head');
const bodyEl = new El('body');
const atlasRoot = new El('div');
atlasRoot.setAttribute('id', 'atlas-root');
bodyEl.appendChild(atlasRoot);

const documentObj = {
  head: headEl,
  body: bodyEl,
  activeElement: bodyEl,
  readyState: 'complete',
  getElementById: (id) => (id === 'atlas-root' ? atlasRoot : null),
  createElement: (t) => new El(t),
  createTextNode: (t) => new TextNode(t),
  addEventListener: (ev, fn) => documentObj._fire ? (documentObj._l[ev] = documentObj._l[ev] || []).push(fn) : null,
  _l: {},
  _fire: (ev, obj) => (documentObj._l[ev] || []).slice().forEach(fn => fn(obj)),
  contains: (n) => bodyEl.contains(n),
};

// ---- location + history shim ----
function parseUrl(url) {
  let hash = '', search = '', pathname = url;
  const hi = url.indexOf('#');
  if (hi !== -1) { hash = url.slice(hi); pathname = url.slice(0, hi); }
  const qi = pathname.indexOf('?');
  if (qi !== -1) { search = pathname.slice(qi); pathname = pathname.slice(0, qi); }
  return { pathname: pathname || '/atlas.html', search, hash };
}
const winListeners = {};
// location shim — `hash` is a real accessor so `location.hash = x` fires a
// `hashchange` on an actual change (matching the browser and F5's shim); a
// no-op assignment (pushState/replaceState only touch the search) fires nothing.
const locationObj = { pathname: '/atlas.html', search: '' };
let _locHash = '#/c/criminal';
Object.defineProperty(locationObj, 'hash', {
  get() { return _locHash; },
  set(v) {
    v = String(v);
    if (v === _locHash) return;
    _locHash = v;
    (winListeners['hashchange'] || []).slice().forEach(fn => fn({ type: 'hashchange' }));
  },
});
function applyUrl(u) { const p = parseUrl(u); locationObj.pathname = p.pathname; locationObj.search = p.search; locationObj.hash = p.hash; }

const historyStack = [{ url: '/atlas.html#/c/criminal', state: null }];
const historyObj = {
  get state() { return historyStack[historyStack.length - 1].state; },
  pushState(state, title, url) { historyStack.push({ url, state: state || null }); applyUrl(url); },
  replaceState(state, title, url) { historyStack[historyStack.length - 1] = { url, state: state || null }; applyUrl(url); },
  back() {
    if (historyStack.length > 1) {
      historyStack.pop();
      const top = historyStack[historyStack.length - 1];
      applyUrl(top.url);   // fires hashchange itself iff the hash actually changed
      (winListeners['popstate'] || []).slice().forEach(fn => fn({ type: 'popstate', state: top.state }));
    }
  },
};
global.window = global;
global.document = documentObj;
global.location = locationObj;
global.history = historyObj;
global.addEventListener = (ev, fn) => { (winListeners[ev] = winListeners[ev] || []).push(fn); };
global.removeEventListener = (ev, fn) => { winListeners[ev] = (winListeners[ev] || []).filter(f => f !== fn); };
global.requestAnimationFrame = undefined;   // module falls back to sync-ish teardown
global.fetch = undefined;                   // case index → memoised {} ; casesEl fails soft

// ================================================================
// load real AtlasCore + patches, plus the module under test
// ================================================================
require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-provision-view.js'));

const AtlasCore = global.AtlasCore;
const APV = global.AtlasProvisionView;
const I = APV._internal;

AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
AtlasCore.attachCorpus(JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8')));

const CASE_INDEX = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'prototype/assets/cases/article-case-index.json'), 'utf8'));

let pass = 0, fail = 0;
function run(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message); }
}
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }

function resetAll() {
  I.reset();
  historyStack.length = 0;
  historyStack.push({ url: '/atlas.html#/c/criminal', state: null });
  applyUrl('/atlas.html#/c/criminal');
  documentObj.activeElement = bodyEl;
  atlasRoot.childNodes = [];
  I.setCaseIndex(CASE_INDEX);
}
// synthetic rendered provision pill inside an .atlas-provision-list
function makePill(id, cls) {
  const list = new El('div'); list.setAttribute('class', 'atlas-provision-list');
  const a = new El('a'); a.setAttribute('class', cls || 'atlas-provision');
  a.setAttribute('href', 'codex-article-viewer.html?id=' + encodeURIComponent(id) + '&x=atlas');
  a.textContent = 'มาตรา ' + String(id).split('_').slice(1).join('_');
  list.appendChild(a);
  atlasRoot.appendChild(list);
  return a;
}
function clickEvent(target, extra) {
  return Object.assign({ type: 'click', target, button: 0, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; } }, extra || {});
}
function fireRootClick(target, extra) {
  const e = clickEvent(target, extra);
  I.onRootClick(e);
  return e;
}

APV.init({ root: atlasRoot });

// ================================================================
// 1. provision href parsing
// ================================================================
run('1. parseProvisionHref: canonical single-instrument id', () => {
  eq(JSON.stringify(I.parseProvisionHref('codex-article-viewer.html?id=criminal_288&x=atlas')),
     JSON.stringify({ collection: 'criminal', instrument: null, number: '288' }));
});
run('1. parseProvisionHref: url-encoded sub-number survives', () => {
  eq(I.parseProvisionHref('codex-article-viewer.html?id=civil_1447%2F2&x=atlas').number, '1447/2');
});
run('1. parseProvisionHref: multi-instrument id splits instrument::number', () => {
  const r = I.parseProvisionHref('codex-article-viewer.html?id=' + encodeURIComponent('aviation_act::12'));
  eq(r.collection, 'aviation'); eq(r.instrument, 'act'); eq(r.number, '12');
});
run('1. parseProvisionHref: junk / missing id → null, no throw', () => {
  eq(I.parseProvisionHref(''), null);
  eq(I.parseProvisionHref(null), null);
  eq(I.parseProvisionHref('codex-article-viewer.html'), null);
  eq(I.parseProvisionHref('codex-article-viewer.html?id=nounderscore'), null);
});

// ================================================================
// 2. criminal:288 resolve   3. article text   4. cancelled   5. breadcrumb   6. adjacent
// ================================================================
run('2. resolve criminal 288 returns a full provision object', () => {
  const r = I.resolve('criminal', '288');
  ok(r, 'resolved'); eq(r.number, '288'); eq(r.unit, 'มาตรา'); eq(r.collection, 'criminal');
});
run('3. article text exists and is non-empty', () => {
  const r = I.resolve('criminal', '288');
  ok(r.article && typeof r.article.text === 'string' && r.article.text.length > 10, 'text present');
});
run('4. cancelled handling: civil 1103 is flagged cancelled', () => {
  const r = I.resolve('civil', '1103');
  ok(r, 'civil 1103 resolved'); eq(r.cancelled, true);
  const r2 = I.resolve('criminal', '288');
  eq(r2.cancelled, false);
});
run('5. breadcrumb from resolveProvision().breadcrumb (not fabricated)', () => {
  const r = I.resolve('criminal', '288');
  ok(Array.isArray(r.breadcrumb) && r.breadcrumb.length >= 3, 'breadcrumb array');
  eq(r.breadcrumb[0].text, 'ประมวลกฎหมายอาญา');
  eq(r.breadcrumb[r.breadcrumb.length - 1].text, 'มาตรา 288');
});
run('6. adjacent prev/next for criminal 288 → 287/2 and 289', () => {
  const a = AtlasCore.getAdjacent('criminal', '288');
  eq(a.prev, '287/2'); eq(a.next, '289');
});

// ================================================================
// 7. plain click interception    8. modifier passthrough
// ================================================================
run('7. plain left click on a provision pill opens the panel (preventDefault)', () => {
  resetAll();
  const a = makePill('criminal_288');
  const e = fireRootClick(a);
  ok(e.defaultPrevented, 'default prevented');
  ok(APV.isOpen(), 'panel open');
  const panel = I.panelEl();
  ok(/มาตรา 288/.test(panel.textContent), 'panel shows มาตรา 288');
  ok(/ผู้ใดฆ่าผู้อื่น/.test(panel.textContent), 'panel shows the ตัวบท');
});
run('8. Ctrl / Cmd / Shift / Alt / middle click → NOT intercepted', () => {
  resetAll();
  const a = makePill('criminal_288');
  [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }].forEach(mod => {
    const e = fireRootClick(a, mod);
    ok(!e.defaultPrevented, 'passthrough for ' + JSON.stringify(mod));
    ok(!APV.isOpen(), 'panel stays closed for ' + JSON.stringify(mod));
  });
});

// ================================================================
// 9. case-link click not intercepted   10. node-case link not intercepted
// ================================================================
run('9. a click on .atlas-pcases-link (case link) is not intercepted', () => {
  resetAll();
  const wrap = new El('span'); wrap.setAttribute('class', 'atlas-pcases');
  const pill = new El('a'); pill.setAttribute('class', 'atlas-provision');
  pill.setAttribute('href', 'codex-article-viewer.html?id=criminal_288&x=atlas');
  const caseLink = new El('a'); caseLink.setAttribute('class', 'atlas-pcases-link');
  caseLink.setAttribute('href', 'prototype/read-case.html?id=some-case');
  wrap.appendChild(pill); wrap.appendChild(caseLink); atlasRoot.appendChild(wrap);
  const e = fireRootClick(caseLink);
  ok(!e.defaultPrevented, 'case link passthrough');
  ok(!APV.isOpen(), 'panel not opened by a case link');
});
run('10. a click on .atlas-node-case-link is not intercepted', () => {
  resetAll();
  const body = new El('div'); body.setAttribute('class', 'atlas-node-body');
  const link = new El('a'); link.setAttribute('class', 'atlas-node-case-link');
  link.setAttribute('href', 'prototype/read-case.html?id=agg-case');
  body.appendChild(link); atlasRoot.appendChild(body);
  const e = fireRootClick(link);
  ok(!e.defaultPrevented, 'node-case link passthrough');
  ok(!APV.isOpen(), 'panel not opened');
});

// ================================================================
// 11. malformed provision href fails soft   12. unknown article fails soft
// ================================================================
run('11. malformed provision href → not intercepted, panel stays closed', () => {
  resetAll();
  const a = makePill('nounderscore-here');
  a.setAttribute('href', 'codex-article-viewer.html?id=nounderscore');
  const e = fireRootClick(a);
  ok(!e.defaultPrevented, 'malformed href left for the browser');
  ok(!APV.isOpen(), 'panel closed');
});
run('12. unknown article (real collection, no such มาตรา) → fail soft', () => {
  resetAll();
  const a = makePill('criminal_999999');
  const e = fireRootClick(a);
  ok(!e.defaultPrevented, 'unknown article → legacy link runs');
  ok(!APV.isOpen(), 'panel closed');
});

// ================================================================
// 13. no nested anchor inside the provision pill
// ================================================================
run('13. opening the panel never injects an <a> inside the provision pill', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  eq(a.querySelectorAll('a').length, 0, 'provision pill has no descendant <a>');
});

// ================================================================
// 14. panel open / close    15. Escape closes
// ================================================================
run('14. close button tears the panel down and restores focus to the pill', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  ok(APV.isOpen(), 'open');
  const closeBtn = I.panelEl().querySelector('.atlas-provision-view-close');
  ok(closeBtn, 'has a close button');
  closeBtn._fire('click', { type: 'click' });
  ok(!APV.isOpen(), 'closed');
  eq(documentObj.activeElement, a, 'focus restored to the provision pill');
});
run('15. Escape key closes the panel', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  ok(APV.isOpen(), 'open');
  I.onKeydown({ key: 'Escape', preventDefault() {} });
  ok(!APV.isOpen(), 'closed by Escape');
});

// ================================================================
// 16. deep-link state
// ================================================================
run('16. deep link  ?a=criminal_288#/c/criminal  opens มาตรา 288 on init', () => {
  resetAll();
  I.reset();
  applyUrl('/atlas.html?a=criminal_288#/c/criminal');
  historyStack[historyStack.length - 1] = { url: '/atlas.html?a=criminal_288#/c/criminal', state: null };
  APV.init({ root: atlasRoot });
  ok(APV.isOpen(), 'panel opened from the deep link');
  ok(/มาตรา 288/.test(I.panelEl().textContent), 'shows มาตรา 288');
  eq(I.hasOwnEntry(), false, 'deep-link open does not claim its own history entry');
});
run('16b. legacy bare deep link  ?a=288#/c/criminal  still opens (collection from hash)', () => {
  resetAll();
  I.reset();
  applyUrl('/atlas.html?a=288#/c/criminal');
  historyStack[historyStack.length - 1] = { url: '/atlas.html?a=288#/c/criminal', state: null };
  APV.init({ root: atlasRoot });
  ok(APV.isOpen(), 'panel opened from the legacy bare deep link');
  ok(/มาตรา 288/.test(I.panelEl().textContent), 'shows มาตรา 288');
});

// ================================================================
// 17. Back closes the panel   +   18/19. hash NEVER changes (tree stays mounted)
// ================================================================
run('17. Back after opening a pill closes the panel', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  ok(APV.isOpen(), 'open');
  eq(I.hasOwnEntry(), true, 'a real open pushed one history entry');
  history.back();
  ok(!APV.isOpen(), 'Back closed the panel');
});
run('18/19. opening + closing NEVER mutates location.hash (AtlasUI never re-renders)', () => {
  resetAll();
  const hashBefore = location.hash;
  const a = makePill('criminal_288');
  fireRootClick(a);
  eq(location.hash, hashBefore, 'hash unchanged while panel open');
  // navigate prev/next inside the viewer
  const next = I.panelEl().querySelector('.atlas-provision-view-adj-next');
  ok(next, 'has a next button');
  next._fire('click', { type: 'click' });
  ok(/มาตรา 289/.test(I.panelEl().textContent), 'panel advanced to มาตรา 289');
  eq(location.hash, hashBefore, 'hash still unchanged after in-panel nav');
  history.back();
  ok(!APV.isOpen(), 'Back closed');
  eq(location.hash, hashBefore, 'hash unchanged after Back');
});
run('19. in-panel prev/next replaces state (Back closes, does not step through articles)', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  const depthAfterOpen = historyStack.length;
  const next = I.panelEl().querySelector('.atlas-provision-view-adj-next');
  next._fire('click', { type: 'click' });
  eq(historyStack.length, depthAfterOpen, 'prev/next did not push a new history entry');
  eq(I.readParam(), 'criminal_289', 'param reflects the current article, qualified');
});

// ================================================================
// 21. concept.html model: no route hash, sibling ?k=<slug> preserved
// ================================================================
run('21. concept.html: opening a provision keeps ?k=<slug> and qualifies ?a=', () => {
  resetAll();
  I.reset();
  applyUrl('/concept.html?k=lamoed');
  historyStack[historyStack.length - 1] = { url: '/concept.html?k=lamoed', state: null };
  APV.init({ root: atlasRoot });
  const a = makePill('civil_420');
  fireRootClick(a);
  ok(APV.isOpen(), 'panel open on concept.html');
  ok(/\?k=lamoed(&|$)/.test(location.search), 'sibling ?k=lamoed preserved — got ' + location.search);
  ok(/(\?|&)a=civil_420(&|$)/.test(location.search), 'a= is qualified — got ' + location.search);
});
run('21b. concept.html: closing strips only a=, keeps ?k=<slug>', () => {
  resetAll();
  I.reset();
  applyUrl('/concept.html?k=lamoed');
  historyStack[historyStack.length - 1] = { url: '/concept.html?k=lamoed', state: null };
  APV.init({ root: atlasRoot });
  fireRootClick(makePill('civil_420'));
  I.panelEl().querySelector('.atlas-provision-view-close')._fire('click', { type: 'click' });
  ok(!APV.isOpen(), 'closed');
  eq(location.search, '?k=lamoed', 'only a= removed, ?k= intact');
});
run('21c. concept.html refresh/deep-link: ?k=lamoed&a=civil_420 reopens on init (no hash)', () => {
  resetAll();
  I.reset();
  applyUrl('/concept.html?k=lamoed&a=civil_420');
  historyStack[historyStack.length - 1] = { url: '/concept.html?k=lamoed&a=civil_420', state: null };
  APV.init({ root: atlasRoot });
  ok(APV.isOpen(), 'panel reopened from a hash-less qualified deep link');
  ok(/มาตรา 420/.test(I.panelEl().textContent), 'shows มาตรา 420');
});
run('21d. concept.html unknown deep-link article fails soft, keeps ?k=', () => {
  resetAll();
  I.reset();
  applyUrl('/concept.html?k=lamoed&a=civil_999999');
  historyStack[historyStack.length - 1] = { url: '/concept.html?k=lamoed&a=civil_999999', state: null };
  APV.init({ root: atlasRoot });
  ok(!APV.isOpen(), 'panel not opened for an unknown article');
  eq(location.search, '?k=lamoed', 'param stripped, ?k= preserved');
});

// ================================================================
// 20. focus restoration + misc a11y attributes
// ================================================================
run('20. panel carries role=dialog / aria-modal / aria-label', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  const wrap = I.wrapEl();
  eq(wrap.getAttribute('role'), 'dialog');
  eq(wrap.getAttribute('aria-modal'), 'true');
  ok((wrap.getAttribute('aria-label') || '').indexOf('มาตรา 288') !== -1, 'aria-label names the provision');
});
run('20. focus moves into the panel on open', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  const panel = I.panelEl();
  ok(panel.contains(documentObj.activeElement) || documentObj.activeElement === panel,
     'active element is inside the panel');
});

// ---- extra: cancelled badge renders ----
run('extra. cancelled provision shows the "ยกเลิกแล้ว" badge', () => {
  resetAll();
  location.hash = '#/c/civil';
  const a = makePill('civil_1103');
  fireRootClick(a);
  ok(/ยกเลิกแล้ว/.test(I.panelEl().textContent), 'badge shown');
});

// ---- extra: the legacy reading-tools fallback link (F11.2 relabel) ----
// href + x=atlas marker are the unchanged compatibility URL; only the visible
// label changed, to read as an explicit legacy fallback rather than the
// primary provision action.
run('extra. legacy fallback link = codex-article-viewer.html?id=criminal_288&x=atlas + honest label', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  const full = I.panelEl().querySelector('.atlas-provision-view-full');
  eq(full.getAttribute('href'), 'codex-article-viewer.html?id=criminal_288&x=atlas');
  eq(full.textContent, 'อ่านแบบเต็ม (เสียง · พิมพ์ · ไฮไลต์) →');
});

// ---- extra: hashchange while open closes the panel (route changed underneath) ----
run('extra. a real hashchange (Atlas route change) closes the panel', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  location.hash = '#/';
  I.onHashChange();
  ok(!APV.isOpen(), 'panel dropped when the underlying route changed');
});

// ================================================================
// F6 — provision context in the breadcrumb (titles + interactive crumbs)
// ================================================================
// AtlasUI stub so activateCrumb's in-page reveal path is exercised; the
// real contract is AtlasUI._internal.restoreReturn(root, {hash,instrument,path}).
const revealPayloads = [];
global.AtlasUI = {
  parseRoute: () => ({ collection: (String(location.hash).match(/^#\/c\/([^/?&]+)/) || [])[1] || null, instrument: null }),
  _internal: { restoreReturn: (root, payload) => { revealPayloads.push(payload); } },
};
const _ss = {};
global.sessionStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(_ss, k) ? _ss[k] : null),
  setItem: (k, v) => { _ss[k] = String(v); },
  removeItem: (k) => { delete _ss[k]; },
};
locationObj.assign = (u) => applyUrl(u);

// ================================================================
// F11.2 / F11.2-FIX — lossless Atlas → legacy → Atlas provision round-trip.
// The recovery ref lives under its OWN sessionStorage key `atlas:return:a`
// (NOT a field inside `atlas:return`, which atlas-ui.js owns and fully
// replaces on every render). These tests exercise that isolated contract.
// ================================================================
const RPKEY = 'atlas:return:a';
function ssClear() {
  try { global.sessionStorage.removeItem('atlas:return'); } catch (e) {}
  try { global.sessionStorage.removeItem(RPKEY); } catch (e) {}
}

// Test 1 — the legacy fallback click writes the isolated key, not atlas:return
run('F11.2-1. fallback click writes atlas:return:a and does NOT touch atlas:return', () => {
  resetAll(); I.reset(); ssClear();
  const preObj = { hash: '#/c/civil', keys: ['บรรพ 2¦ลักษณะ 5'], instrument: null };
  global.sessionStorage.setItem('atlas:return', JSON.stringify(preObj));
  applyUrl('/atlas.html#/c/civil');
  const a = makePill('civil_420');
  fireRootClick(a);
  I.panelEl().querySelector('.atlas-provision-view-full')._fire('click', { type: 'click' });
  eq(global.sessionStorage.getItem(RPKEY), 'civil_420', 'ref written to the isolated key');
  eq(global.sessionStorage.getItem('atlas:return'), JSON.stringify(preObj),
     'atlas:return object is byte-for-byte untouched (AtlasUI still owns it)');
});

// Test 2 — Atlas init() recovers from atlas:return:a when the URL has no ?a=
run('F11.2-2. init() recovers civil_420 on #/c/civil from atlas:return:a', () => {
  resetAll(); I.reset(); ssClear();
  global.sessionStorage.setItem(RPKEY, 'civil_420');
  global.sessionStorage.setItem('atlas:return',
    JSON.stringify({ hash: '#/c/civil', keys: ['บรรพ 2¦ลักษณะ 5'] }));
  applyUrl('/atlas.html#/c/civil');
  historyStack[historyStack.length - 1] = { url: '/atlas.html#/c/civil', state: null };
  APV.init({ root: atlasRoot });
  ok(APV.isOpen(), 'drawer opened by recovery');
  eq(I.current().number, '420', 'recovered the right provision');
  eq(location.search, '?a=civil_420', 'URL now carries ?a=<ref>');
  eq(location.hash, '#/c/civil', 'structural hash unchanged');
  eq(global.sessionStorage.getItem(RPKEY), null, 'recovery key consumed one-shot');
  eq(global.sessionStorage.getItem('atlas:return'),
     JSON.stringify({ hash: '#/c/civil', keys: ['บรรพ 2¦ลักษณะ 5'] }),
     'atlas:return object not rewritten or deleted by recovery');
});

// Test 3 — one-shot: after recovery, re-init with no ?a= does not reopen
run('F11.2-3. recovery is one-shot — a second init with no ?a= does not reopen', () => {
  resetAll(); I.reset(); ssClear();
  global.sessionStorage.setItem(RPKEY, 'civil_420');
  applyUrl('/atlas.html#/c/civil');
  historyStack[historyStack.length - 1] = { url: '/atlas.html#/c/civil', state: null };
  APV.init({ root: atlasRoot });
  ok(APV.isOpen() && I.current().number === '420', 'first init recovered civil_420');
  eq(global.sessionStorage.getItem(RPKEY), null, 'key consumed');
  // simulate a plain reload of the bare collection route
  I.reset();
  applyUrl('/atlas.html#/c/civil');
  historyStack[historyStack.length - 1] = { url: '/atlas.html#/c/civil', state: null };
  APV.init({ root: atlasRoot });
  ok(!APV.isOpen(), 'second init does NOT reopen — nothing left to recover');
});

// Test 4 — collection guard: a saved civil ref must NOT open on a criminal route
run('F11.2-4. collection guard — atlas:return:a for another collection neither opens nor is consumed', () => {
  resetAll(); I.reset(); ssClear();
  global.sessionStorage.setItem(RPKEY, 'civil_420');
  applyUrl('/atlas.html#/c/criminal');
  historyStack[historyStack.length - 1] = { url: '/atlas.html#/c/criminal', state: null };
  APV.init({ root: atlasRoot });
  ok(!APV.isOpen(), 'drawer did NOT open on the mismatched collection');
  ok(location.search.indexOf('a=civil_420') === -1, 'URL did not gain ?a=civil_420');
  eq(global.sessionStorage.getItem(RPKEY), 'civil_420', 'ref left intact for a later matching visit');
});

// Test 5 — regression: an unrelated atlas:return write (as atlas-ui.js does on
// every render / persistReturn) must NOT destroy atlas:return:a
run('F11.2-5. AtlasUI-style {hash,keys} write to atlas:return does not touch atlas:return:a', () => {
  resetAll(); I.reset(); ssClear();
  global.sessionStorage.setItem(RPKEY, 'civil_420');
  // exactly what atlas-ui.js persistReturn() does:
  global.sessionStorage.setItem('atlas:return',
    JSON.stringify({ hash: '#/c/civil', keys: ['¦บรรพ 1', '¦บรรพ 2'] }));
  eq(global.sessionStorage.getItem(RPKEY), 'civil_420', 'isolated recovery ref survives');
});

// ================================================================
// F11.3.1A — formatted provision body + in-drawer มาตรา cross-references
// ================================================================
function openProv(hash, id) {
  resetAll(); I.reset();
  try { global.sessionStorage.removeItem('atlas:return:a'); } catch (e) {}
  try { global.sessionStorage.removeItem('atlas:return'); } catch (e) {}
  applyUrl('/atlas.html' + hash);
  historyStack[historyStack.length - 1] = { url: '/atlas.html' + hash, state: null };
  APV.init({ root: atlasRoot });
  fireRootClick(makePill(id));
  return I.panelEl();
}
function provText(panel) { return panel.querySelector('.atlas-provision-view-text'); }

// ---- direct-unit: appendLinkedText ----
run('F11.3.1A-u1. appendLinkedText: self-ref plain, sibling-ref linked, unknown plain, text verbatim', () => {
  const host = document.createElement('div');
  const src = 'ดู มาตรา 420 กับ มาตรา 421 และ มาตรา 999999 ประกอบ';
  I.appendLinkedText(host, src, { collection: 'civil', number: '420', instrument: null });
  const links = host.querySelectorAll('a');
  eq(links.length, 1, 'exactly one link (มาตรา 421 only)');
  eq(links[0].textContent, 'มาตรา 421');
  ok(links[0].getAttribute('href').indexOf('id=civil_421') !== -1, 'targets civil_421 — got ' + links[0].getAttribute('href'));
  ok((links[0].getAttribute('class') || '').indexOf('atlas-provision-view-xref') !== -1, 'carries the xref class');
  ok((links[0].getAttribute('class') || '').split(/\s+/).indexOf('atlas-provision') === -1, 'NOT the block-pill class');
  eq(host.textContent, src, 'full text preserved byte-for-byte (marker + refs unchanged)');
});
run('F11.3.1A-u2. appendLinkedText normalises Thai digits (มาตรา ๓๕ → civil_35)', () => {
  const host = document.createElement('div');
  I.appendLinkedText(host, 'การร้องขอตามมาตรา ๓๕ หรือการร้องขอถอนผู้พิทักษ์',
    { collection: 'civil', number: '34', instrument: null });
  const links = host.querySelectorAll('a');
  eq(links.length, 1, 'one link');
  ok(links[0].getAttribute('href').indexOf('id=civil_35') !== -1, 'Thai digits → civil_35');
});
run('F11.3.1A-u3. appendLinkedText never resolves across collections', () => {
  const host = document.createElement('div');
  // "มาตรา 288" resolves in criminal but the context here is civil — must
  // only ever produce a civil target (civil_288 exists) or none, never criminal.
  I.appendLinkedText(host, 'เทียบ มาตรา 288', { collection: 'civil', number: '420', instrument: null });
  host.querySelectorAll('a').forEach(l =>
    ok(l.getAttribute('href').indexOf('id=civil_') !== -1, 'only civil targets — got ' + l.getAttribute('href')));
});
run('F11.3.1A-u4. appendLinkedText fail-soft when getProvisionBrief throws', () => {
  const host = document.createElement('div');
  const saved = AtlasCore.getProvisionBrief;
  try {
    AtlasCore.getProvisionBrief = () => { throw new Error('boom'); };
    I.appendLinkedText(host, 'ดู มาตรา 421 ประกอบ', { collection: 'civil', number: '420' });
  } finally { AtlasCore.getProvisionBrief = saved; }
  eq(host.querySelectorAll('a').length, 0, 'no links when resolution throws');
  eq(host.textContent, 'ดู มาตรา 421 ประกอบ', 'text verbatim, no throw');
});
run('F11.3.1A-u5. appendLinkedText fail-soft when AtlasCore is absent', () => {
  const host = document.createElement('div');
  const saved = global.AtlasCore;
  try {
    global.AtlasCore = undefined;
    I.appendLinkedText(host, 'ดู มาตรา 421', { collection: 'civil', number: '420' });
  } finally { global.AtlasCore = saved; }
  eq(host.querySelectorAll('a').length, 0, 'no links, no throw');
  eq(host.textContent, 'ดู มาตรา 421', 'plain text');
});

// ---- direct-unit: formattedTextEl ----
run('F11.3.1A-u6. formattedTextEl: single line → one para, no วรรค/อนุ label', () => {
  const box = I.formattedTextEl({ collection: 'civil', number: '420',
    article: { text: 'อ้าง มาตรา 421 ในบรรทัดเดียว' } });
  eq(box.querySelectorAll('.atlas-provision-view-para-label').length, 0, 'no label for a single chunk');
  eq(box.querySelectorAll('a.atlas-provision-view-xref').length, 1, 'still linkified');
});
run('F11.3.1A-u7. formattedTextEl: empty / missing text → placeholder para, no throw', () => {
  ok(/ไม่มีตัวบท/.test(I.formattedTextEl({ collection: 'civil', number: '420', article: { text: '' } }).textContent));
  ok(/ไม่มีตัวบท/.test(I.formattedTextEl({ collection: 'civil', number: '420', article: null }).textContent));
  ok(/ไม่มีตัวบท/.test(I.formattedTextEl(null).textContent));
});
run('F11.3.1A-u8. formattedTextEl: multi-line labels วรรค/อนุ, substantive text untouched', () => {
  const box = I.formattedTextEl({ collection: 'civil', number: '9', instrument: null, article: {
    text: 'ข้อความวรรคแรก\n(1) รายการที่หนึ่ง\n(2) รายการที่สอง\nข้อความวรรคสุดท้าย' } });
  const labels = box.querySelectorAll('.atlas-provision-view-para-label').map(n => n.textContent);
  eq(JSON.stringify(labels), JSON.stringify(['วรรคหนึ่ง', 'อนุ (1)', 'อนุ (2)', 'วรรคสอง']),
     'วรรค counts only non-อนุ chunks; อนุ keeps its number — got ' + JSON.stringify(labels));
  ok(box.textContent.indexOf('(1) รายการที่หนึ่ง') !== -1, 'original (1) marker + text preserved');
  ok(box.textContent.indexOf('(2) รายการที่สอง') !== -1, 'original (2) marker + text preserved');
});

// ---- integration: rendered drawer ----
run('F11.3.1A-1. single-chunk provision renders one para, no label (criminal 288)', () => {
  const box = provText(openProv('#/c/criminal', 'criminal_288'));
  ok(box, 'text container present');
  ok(/ผู้ใดฆ่าผู้อื่น/.test(box.textContent), 'ตัวบท intact');
  eq(box.querySelectorAll('.atlas-provision-view-para-label').length, 0, 'no วรรค/อนุ label');
});
run('F11.3.1A-2. multi-chunk provision (civil 34): วรรค + อนุ labels, substantive text preserved', () => {
  const box = provText(openProv('#/c/civil', 'civil_34'));
  const labels = box.querySelectorAll('.atlas-provision-view-para-label').map(n => n.textContent);
  ok(labels.indexOf('วรรคหนึ่ง') !== -1, 'has วรรคหนึ่ง — got ' + JSON.stringify(labels));
  ok(labels.some(l => /^อนุ \(\d+\)$/.test(l)), 'has อนุ (n) — got ' + JSON.stringify(labels));
  ok(/คนเสมือนไร้ความสามารถ/.test(box.textContent), 'lead text preserved');
  ['(๒)', '(๓)', '(๑๐)', '(๑๑)'].forEach(mk =>
    ok(box.textContent.indexOf(mk) !== -1, 'original อนุ marker kept verbatim: ' + mk));
});
run('F11.3.1A-3. genuine body มาตรา ref → xref link to same collection (civil 34 → ม.๓๕)', () => {
  const box = provText(openProv('#/c/civil', 'civil_34'));
  const xrefs = box.querySelectorAll('a.atlas-provision-view-xref');
  ok(xrefs.length >= 1, 'at least one xref link');
  const m35 = xrefs.filter(a => /๓๕/.test(a.textContent))[0];
  ok(m35, 'มาตรา ๓๕ is linked');
  ok(m35.getAttribute('href').indexOf('id=civil_35') !== -1, 'targets civil_35');
  ok(m35.getAttribute('href').indexOf('x=atlas') !== -1, 'keeps the x=atlas marker');
});
run('F11.3.1A-4. self-reference stays plain text (no xref points back to civil_34)', () => {
  const box = provText(openProv('#/c/civil', 'civil_34'));
  box.querySelectorAll('a.atlas-provision-view-xref').forEach(a =>
    ok(!/id=civil_34&/.test(a.getAttribute('href')), 'no self link — got ' + a.getAttribute('href')));
});
run('F11.3.1A-5. no nested <a>: xref link is never inside another anchor', () => {
  const box = provText(openProv('#/c/civil', 'civil_34'));
  box.querySelectorAll('a.atlas-provision-view-xref').forEach(a => {
    let p = a.parentNode, depth = 0;
    while (p && depth < 20) { ok(String(p.tagName).toUpperCase() !== 'A', 'no ancestor <a>'); p = p.parentNode; depth++; }
  });
});
run('F11.3.1A-6. clicking an xref swaps the SAME drawer: hash unchanged, ?a= updated, replaceState', () => {
  const panel = openProv('#/c/civil', 'civil_34');
  ok(APV.isOpen(), 'drawer open on civil 34');
  const hashBefore = location.hash;
  const depthBefore = historyStack.length;
  const xref = panel.querySelector('a.atlas-provision-view-xref');
  ok(xref, 'has an xref to click');
  const e = fireRootClick(xref);
  ok(e.defaultPrevented, 'plain click intercepted');
  ok(APV.isOpen(), 'still exactly one drawer, still open');
  ok(/มาตรา 35/.test(I.panelEl().textContent), 'drawer now shows มาตรา 35');
  eq(location.hash, hashBefore, 'location.hash NOT mutated (AtlasUI never re-renders)');
  eq(historyStack.length, depthBefore, 'xref used replaceState — no new history entry');
  eq(I.readParam(), 'civil_35', '?a= now qualifies the target provision');
});
run('F11.3.1A-7. Back after an xref click closes the drawer (established in-drawer semantics)', () => {
  const panel = openProv('#/c/civil', 'civil_34');
  fireRootClick(panel.querySelector('a.atlas-provision-view-xref'));
  ok(APV.isOpen() && /มาตรา 35/.test(I.panelEl().textContent), 'advanced to มาตรา 35');
  history.back();
  ok(!APV.isOpen(), 'Back closed the drawer');
});
run('F11.3.1A-8. modified click on an xref is NOT intercepted (native href → legacy viewer)', () => {
  const panel = openProv('#/c/civil', 'civil_34');
  const xref = panel.querySelector('a.atlas-provision-view-xref');
  [{ metaKey: true }, { ctrlKey: true }, { button: 1 }].forEach(mod => {
    const e = fireRootClick(xref, mod);
    ok(!e.defaultPrevented, 'passthrough for ' + JSON.stringify(mod));
  });
});
run('F11.3.1A-9. xref href is the unchanged canonical viewer id', () => {
  const box = provText(openProv('#/c/civil', 'civil_34'));
  const m35 = box.querySelectorAll('a.atlas-provision-view-xref').filter(a => /๓๕/.test(a.textContent))[0];
  eq(m35.getAttribute('href'), 'codex-article-viewer.html?id=civil_35&x=atlas');
});

function openOn(hash, id) {
  resetAll(); I.reset();
  applyUrl('/atlas.html' + hash);
  historyStack[historyStack.length - 1] = { url: '/atlas.html' + hash, state: null };
  APV.init({ root: atlasRoot });
  fireRootClick(makePill(id));
  return I.panelEl().querySelector('.atlas-provision-view-breadcrumb');
}

run('F6-A. breadcrumb shows the structural titles AtlasCore already provides', () => {
  const txt = openOn('#/c/civil', 'civil_420').textContent;
  ok(/บรรพ 2/.test(txt) && /หนี้/.test(txt), 'บรรพ 2 · หนี้');
  ok(/ลักษณะ 5/.test(txt) && /ละเมิด/.test(txt), 'ลักษณะ 5 · ละเมิด');
  ok(/หมวด 1/.test(txt) && /ความรับผิดเพื่อละเมิด/.test(txt), 'หมวด 1 · ความรับผิดเพื่อละเมิด');
  ok(/มาตรา 420/.test(txt), 'provision token present');
  ok(!/undefined/.test(txt), 'no literal "undefined" anywhere');
});

run('F6-B. the current provision crumb is a plain <span>, not interactive', () => {
  const bc = openOn('#/c/civil', 'civil_420');
  const current = bc.querySelector('.atlas-provision-view-crumb-current');
  ok(current && current.tagName === 'SPAN', 'current crumb is a span');
  eq(current.textContent, 'มาตรา 420');
  const navs = bc.querySelectorAll('.atlas-provision-view-crumb-nav');
  ok(navs.every(n => n.textContent.indexOf('มาตรา 420') === -1), 'no interactive crumb for the provision');
});

run('F6-B2. empty-title level (const2560 ม.262 "บทเฉพาะกาล") falls back to the bare token', () => {
  const bc = openOn('#/c/const2560', 'const2560_262');
  const nav = bc.querySelectorAll('.atlas-provision-view-crumb-nav')
    .filter(n => n.tagName === 'BUTTON' && n.textContent.indexOf('บทเฉพาะกาล') !== -1)[0];
  ok(nav, 'the บทเฉพาะกาล crumb is present and interactive');
  ok(!nav.querySelector('.atlas-provision-view-crumb-title'), 'no title span when the title is empty');
  ok(nav.textContent.indexOf('undefined') === -1, 'no literal "undefined"');
});

run('F6-C. structural crumbs carry the correct prefix path (data-atlas-path)', () => {
  const bc = openOn('#/c/civil', 'civil_420');
  const btns = bc.querySelectorAll('button.atlas-provision-view-crumb-nav');
  const byToken = (t) => btns.filter(b => b.textContent.indexOf(t) === 0)[0];
  eq(byToken('บรรพ 2').getAttribute('data-atlas-path'), JSON.stringify(['บรรพ 2']));
  eq(byToken('ลักษณะ 5').getAttribute('data-atlas-path'), JSON.stringify(['บรรพ 2', 'ลักษณะ 5']));
  eq(byToken('หมวด 1').getAttribute('data-atlas-path'), JSON.stringify(['บรรพ 2', 'ลักษณะ 5', 'หมวด 1']));
  btns.forEach(b => eq(b.getAttribute('data-atlas-collection'), 'civil'));
});

run('F6-D. collection crumb is a real <a href="#/c/civil"> and keyboard-reachable', () => {
  const bc = openOn('#/c/civil', 'civil_420');
  const a = bc.querySelector('a.atlas-provision-view-crumb-nav');
  ok(a, 'collection crumb is an anchor');
  eq(a.getAttribute('href'), '#/c/civil');
});

run('F6-F. structural crumbs are <button type=button> with an aria-label', () => {
  const bc = openOn('#/c/civil', 'civil_420');
  const btns = bc.querySelectorAll('button.atlas-provision-view-crumb-nav');
  ok(btns.length >= 3);
  btns.forEach(b => {
    eq(b.getAttribute('type'), 'button');
    ok((b.getAttribute('aria-label') || '').indexOf('สารบบ') !== -1, 'aria-label mentions the tree');
  });
});

// async: activating a crumb closes the drawer, then reveals via restoreReturn
async function f6Async() {
  const drain = () => new Promise(r => setTimeout(r, 8));

  // same-collection reveal (already on #/c/civil)
  revealPayloads.length = 0;
  let bc = openOn('#/c/civil', 'civil_420');
  ok(APV.isOpen(), 'panel open before crumb click');
  bc.querySelectorAll('button.atlas-provision-view-crumb-nav')
    .filter(b => b.textContent.indexOf('ลักษณะ 5') === 0)[0]._fire('click', { type: 'click' });
  ok(!APV.isOpen(), 'crumb click closed the drawer');
  await drain();
  run('F6-C2. clicking ลักษณะ 5 reveals ["บรรพ 2","ลักษณะ 5"] via restoreReturn', () => {
    eq(revealPayloads.length, 1);
    eq(revealPayloads[0].hash, '#/c/civil');
    eq(JSON.stringify(revealPayloads[0].path), JSON.stringify(['บรรพ 2', 'ลักษณะ 5']));
  });

  // หมวด 1 → deepest path
  revealPayloads.length = 0;
  bc = openOn('#/c/civil', 'civil_420');
  bc.querySelectorAll('button.atlas-provision-view-crumb-nav')
    .filter(b => b.textContent.indexOf('หมวด 1') === 0)[0]._fire('click', { type: 'click' });
  await drain();
  run('F6-C3. clicking หมวด 1 reveals the full 3-level path', () => {
    eq(JSON.stringify(revealPayloads[0].path), JSON.stringify(['บรรพ 2', 'ลักษณะ 5', 'หมวด 1']));
  });

  // collection crumb → only the sanctioned #/c/<collection> hash write
  bc = openOn('#/c/civil', 'civil_420');
  const hashBefore = location.hash;
  bc.querySelector('a.atlas-provision-view-crumb-nav')._fire('click', { type: 'click', preventDefault() {} });
  await drain();
  run('F6-D2. collection crumb writes only #/c/civil (already there → no change)', () => {
    eq(location.hash, hashBefore);
    eq(location.hash, '#/c/civil');
  });

  // cross-collection: on #/c/criminal, open civil_420, click a structural crumb
  revealPayloads.length = 0;
  bc = openOn('#/c/criminal', 'civil_420');
  bc.querySelectorAll('button.atlas-provision-view-crumb-nav')
    .filter(b => b.textContent.indexOf('ลักษณะ 5') === 0)[0]._fire('click', { type: 'click' });
  await drain(); await drain();
  run('F6-E. cross-collection: switches to #/c/civil then reveals the path', () => {
    eq(location.hash, '#/c/civil', 'hash switched to the crumb\'s collection');
    ok(revealPayloads.length >= 1, 'restoreReturn fired after the switch');
    eq(JSON.stringify(revealPayloads[revealPayloads.length - 1].path), JSON.stringify(['บรรพ 2', 'ลักษณะ 5']));
  });

  // concept.html model: no AtlasUI → cross-page handoff via sessionStorage
  const savedUI = global.AtlasUI;
  delete global.AtlasUI;
  resetAll(); I.reset();
  applyUrl('/concept.html?k=lamoed');
  historyStack[historyStack.length - 1] = { url: '/concept.html?k=lamoed', state: null };
  APV.init({ root: atlasRoot });
  fireRootClick(makePill('civil_420'));
  const cbc = I.panelEl().querySelector('.atlas-provision-view-breadcrumb');
  cbc.querySelectorAll('button.atlas-provision-view-crumb-nav')
    .filter(b => b.textContent.indexOf('ลักษณะ 5') === 0)[0]._fire('click', { type: 'click' });
  await drain();
  run('F6-cross-page. no tree on the page → writes atlas:return + loads atlas.html#/c/civil', () => {
    const ret = JSON.parse(sessionStorage.getItem('atlas:return') || 'null');
    ok(ret && ret.hash === '#/c/civil', 'atlas:return hash');
    eq(JSON.stringify(ret.path), JSON.stringify(['บรรพ 2', 'ลักษณะ 5']));
    ok(String(location.pathname).indexOf('atlas.html') !== -1 && location.hash === '#/c/civil', 'navigated to atlas.html#/c/civil');
  });
  global.AtlasUI = savedUI;

  // regression: F1 text / cases / F2 cluster hook / F4 hook still fire on open
  run('F6-regression. opening a provision still renders text + case + cluster + concept containers', () => {
    resetAll(); I.reset();
    applyUrl('/atlas.html#/c/criminal');
    historyStack[historyStack.length - 1] = { url: '/atlas.html#/c/criminal', state: null };
    APV.init({ root: atlasRoot });
    fireRootClick(makePill('criminal_288'));
    const p = I.panelEl();
    ok(/ผู้ใดฆ่าผู้อื่น/.test(p.textContent), 'ตัวบท still rendered');
    ok(p.querySelector('.atlas-provision-view-text'), 'text container');
    ok(p.querySelector('.atlas-provision-view-cases'), 'cases container');
    ok(p.querySelector('.atlas-provision-view-clusters'), 'F2 cluster container');
    ok(p.querySelector('.atlas-provision-view-concepts'), 'F4 concept container');
  });
}

f6Async().then(() => {
  console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}).catch((e) => {
  console.log('  FATAL  ' + (e && e.stack || e));
  process.exit(1);
});
