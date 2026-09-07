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
const locationObj = { pathname: '/atlas.html', search: '', hash: '#/c/criminal' };
function applyUrl(u) { const p = parseUrl(u); locationObj.pathname = p.pathname; locationObj.search = p.search; locationObj.hash = p.hash; }

const winListeners = {};
const historyStack = [{ url: '/atlas.html#/c/criminal', state: null }];
const historyObj = {
  get state() { return historyStack[historyStack.length - 1].state; },
  pushState(state, title, url) { historyStack.push({ url, state: state || null }); applyUrl(url); },
  replaceState(state, title, url) { historyStack[historyStack.length - 1] = { url, state: state || null }; applyUrl(url); },
  back() {
    if (historyStack.length > 1) {
      const prevHash = locationObj.hash;
      historyStack.pop();
      const top = historyStack[historyStack.length - 1];
      applyUrl(top.url);
      (winListeners['popstate'] || []).slice().forEach(fn => fn({ type: 'popstate', state: top.state }));
      if (locationObj.hash !== prevHash) {
        (winListeners['hashchange'] || []).slice().forEach(fn => fn({ type: 'hashchange' }));
      }
    }
  },
};

global.window = global;
global.document = documentObj;
global.location = locationObj;
global.history = historyObj;
global.addEventListener = (ev, fn) => { (winListeners[ev] = winListeners[ev] || []).push(fn); };
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
run('16. deep link  ?a=288#/c/criminal  opens มาตรา 288 on init', () => {
  resetAll();
  I.reset();
  applyUrl('/atlas.html?a=288#/c/criminal');
  historyStack[historyStack.length - 1] = { url: '/atlas.html?a=288#/c/criminal', state: null };
  APV.init({ root: atlasRoot });
  ok(APV.isOpen(), 'panel opened from the deep link');
  ok(/มาตรา 288/.test(I.panelEl().textContent), 'shows มาตรา 288');
  eq(I.hasOwnEntry(), false, 'deep-link open does not claim its own history entry');
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
  eq(I.readParam(), '289', 'param reflects the current article');
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

// ---- extra: "เปิดหน้าเต็ม" points at the unchanged legacy viewer + x=atlas ----
run('extra. "เปิดหน้าเต็ม" link = codex-article-viewer.html?id=criminal_288&x=atlas', () => {
  resetAll();
  const a = makePill('criminal_288');
  fireRootClick(a);
  const full = I.panelEl().querySelector('.atlas-provision-view-full');
  eq(full.getAttribute('href'), 'codex-article-viewer.html?id=criminal_288&x=atlas');
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

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
