/* Runtime smoke test for atlas-provision-lectures.js (F11.3.4).

   Verifies the Provision Lecture Notes layer in isolation against a minimal
   DOM shim, plus the F1-reader integration point (insertion order + fail-soft
   guard) in atlas-provision-view.js.

   Loads atlas-patches + atlas-core for real provision resolution, real
   codex-data.json for real lectureNotes fixtures, atlas-provision-view.js
   for the shared linkifier + the reader-integration checks, and
   atlas-provision-lectures.js itself. Does NOT load atlas-ui.js.
*/
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;

// ================================================================ DOM shim
// (same minimal shim used by atlas-clusters-smoke.js / atlas-provision-
// concepts smoke tests — kept identical so behaviour is comparable)
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
  set innerHTML(v) { throw new Error('innerHTML must not be used for lecture-note text'); }
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

const locationObj = { pathname: '/atlas.html', search: '', hash: '#/c/civil' };
const winListeners = {};
const historyStack = [{ url: '/atlas.html#/c/civil', state: null }];
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
global.fetch = undefined;   // case index / cluster / concept loads → null / {} ; fail soft

// ================================================================ load modules
require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-provision-view.js'));
require(path.join(ROOT, 'atlas-provision-lectures.js'));

const AtlasCore = global.AtlasCore;
const APV = global.AtlasProvisionView;
const PVI = APV._internal;
const PL = global.AtlasProvisionLectures;
const PLI = PL._internal;

AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
const CODEX = JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8'));
AtlasCore.attachCorpus(CODEX);

const PL_SRC = fs.readFileSync(path.join(ROOT, 'atlas-provision-lectures.js'), 'utf8');
const PV_SRC = fs.readFileSync(path.join(ROOT, 'atlas-provision-view.js'), 'utf8');

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// Real fixtures out of codex-data.json — chosen for shape, not curated:
//   civil_10  — exactly ONE lectureNote, whose text cross-references มาตรา 171
//   civil_171 — exactly TWO lectureNotes (ordering check)
//   civil_1   — NO lectureNotes at all
//   civil_11  — a lectureNote whose text contains a real newline (paragraph check)
const civilArts = CODEX.books.civil.articles;
ok(civilArts['10'].lectureNotes.length === 1, 'fixture civil_10 has exactly one lectureNote');
ok(civilArts['171'].lectureNotes.length === 2, 'fixture civil_171 has exactly two lectureNotes');
ok(!civilArts['1'].lectureNotes, 'fixture civil_1 has no lectureNotes field');
ok(civilArts['11'].lectureNotes[0].text.indexOf('\n') !== -1, 'fixture civil_11 note contains a real newline');

// ================================================================ A. one lectureNote
run('A. civil_10 (one lectureNote) resolves and renders exactly one note', () => {
  const resolved = PVI.resolve('civil', '10');
  ok(resolved && resolved.article, 'civil_10 resolves through AtlasCore');
  const container = documentObj.createElement('div');
  bodyEl.appendChild(container);
  PL.renderSection(container, resolved);
  const notes = container.querySelectorAll('details.atlas-plec-note');
  eq(notes.length, 1, 'renders exactly one <details> note');
  eq(notes[0].querySelector('summary').textContent, resolved.article.lectureNotes[0].topic, 'summary shows the note topic');
});

// ================================================================ B. multiple lectureNotes
run('B. civil_171 (two lectureNotes) renders one <details> per note, in source order', () => {
  const resolved = PVI.resolve('civil', '171');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const notes = container.querySelectorAll('details.atlas-plec-note');
  eq(notes.length, 2, 'renders two <details> notes');
  eq(notes[0].querySelector('summary').textContent, resolved.article.lectureNotes[0].topic, 'first note in order');
  eq(notes[1].querySelector('summary').textContent, resolved.article.lectureNotes[1].topic, 'second note in order');
});

// ================================================================ C. no lectureNotes
run('C. civil_1 (no lectureNotes) renders nothing — no empty card', () => {
  const resolved = PVI.resolve('civil', '1');
  ok(resolved && resolved.article, 'civil_1 resolves through AtlasCore');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  eq(container.childNodes.length, 0, 'container stays empty when there is nothing to show');
});

// ================================================================ D. malformed / missing
run('D1. resolved.article missing lectureNotes field never throws', () => {
  const container = documentObj.createElement('div');
  PL.renderSection(container, { collection: 'x', number: '1', article: {} });
  eq(container.childNodes.length, 0, 'no crash, nothing rendered');
});

run('D2. lectureNotes not an array is ignored, never throws', () => {
  const container = documentObj.createElement('div');
  PL.renderSection(container, { collection: 'x', number: '1', article: { lectureNotes: 'not-an-array' } });
  eq(container.childNodes.length, 0, 'malformed shape ignored safely');
});

run('D3. null / non-object entries inside lectureNotes[] are skipped, not thrown', () => {
  const resolved = { collection: 'x', number: '1', article: { lectureNotes: [
    null, 'oops', 42, { id: 'ok', topic: 'T', text: 'X', source: 'S' }
  ] } };
  const notes = PLI.notesFrom(resolved);
  eq(notes.length, 1, 'only the one well-formed note survives');
  eq(notes[0].topic, 'T', 'the surviving note is the well-formed one');
});

run('D4. resolved / resolved.article / container absent never throws', () => {
  const container = documentObj.createElement('div');
  PL.renderSection(container, null);
  PL.renderSection(null, { article: {} });
  PL.renderSection(container, {});
  PL.renderSection(null, null);
  ok(true, 'no exception across every absent-input combination');
});

run('D5. a note missing topic or text individually is tolerated (irregular article shapes)', () => {
  const resolved = { collection: 'x', number: '1', article: { lectureNotes: [
    { id: 'a', text: 'มีแต่ text ไม่มี topic' },     // no topic, no source
    { id: 'b', topic: 'มีแต่ topic ไม่มี text' }      // no text, no source
  ] } };
  const notes = PLI.notesFrom(resolved);
  eq(notes.length, 2, 'both partial notes are kept — there is still something to show');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const rendered = container.querySelectorAll('details.atlas-plec-note');
  eq(rendered.length, 2, 'both render without throwing');
});

// ================================================================ E. multiline text
run('E. civil_11 lecture text preserves paragraph structure (one <p> per non-blank line)', () => {
  const resolved = PVI.resolve('civil', '11');
  const raw = resolved.article.lectureNotes[0];
  const expectedParas = raw.text.split('\n').map(s => s.trim()).filter(Boolean).length;
  ok(expectedParas > 1, 'fixture genuinely has more than one paragraph');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const paras = container.querySelectorAll('p.atlas-plec-para');
  eq(paras.length, expectedParas, 'one <p> per non-blank source line, none merged or dropped');
});

// ================================================================ F. source rendering
run('F. the existing source value renders visibly under the note text', () => {
  const resolved = PVI.resolve('civil', '10');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const src = container.querySelector('p.atlas-plec-source');
  ok(src, 'a source line is rendered');
  ok(src.textContent.indexOf(resolved.article.lectureNotes[0].source) !== -1,
     'source line contains the exact source string from codex-data.json — got ' + src.textContent);
});

run('F2. a note with no source renders no source line (nothing invented)', () => {
  const resolved = { collection: 'x', number: '1', article: { lectureNotes: [
    { id: 'a', topic: 'T', text: 'X' }
  ] } };
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  ok(!container.querySelector('p.atlas-plec-source'), 'no fabricated source line');
});

// ================================================================ G. authority label
run('G1. the mandated persistent authority label is present verbatim', () => {
  const resolved = PVI.resolve('civil', '10');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const label = container.querySelector('p.atlas-plec-label');
  ok(label, 'label element present');
  eq(label.textContent, 'คำอธิบายประกอบ — ไม่ใช่ตัวบทหรือคำพิพากษา', 'exact mandated Thai label text');
  eq(label.textContent, PLI.LABEL, 'rendered label matches the module constant (single source of truth)');
});

run('G2. the label sits OUTSIDE any collapsed <details> — always visible, never collapsible', () => {
  const resolved = PVI.resolve('civil', '10');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const label = container.querySelector('p.atlas-plec-label');
  ok(label.parentNode.tagName !== 'DETAILS', 'label is a direct child of the section, not inside a collapsible note');
});

run('G3. lecture notes never reuse the statutory-text class namespace (cannot be mistaken for ตัวบท)', () => {
  ok(!/atlas-provision-view-text\b/.test(PL_SRC) && !/atlas-provision-view-para\b/.test(PL_SRC),
     'atlas-provision-lectures.js never emits the statutory-text classes');
  ok(/atlas-plec-/.test(PL_SRC), 'uses its own atlas-plec-* namespace throughout');
});

// ================================================================ H. fail-soft / no exception
run('H1. never mutates AtlasCore / AtlasUI, never touches the hash or history', () => {
  const code = PL_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\b(AtlasCore|AtlasUI)\s*(\.\w+)?\s*=[^=]/.test(code), 'no assignment to AtlasCore/AtlasUI');
  ok(!/(AtlasCore|AtlasUI)\._internal/.test(code), 'no AtlasCore/AtlasUI internals used');
  ok(!/\blocation\s*\.\s*hash\b/.test(code) && !/\bhistory\s*\.\s*(pushState|replaceState)\s*\(/.test(code),
     'never touches location.hash / history');
});

run('H2. innerHTML is never assigned for lecture content (textContent only)', () => {
  ok(!/\.innerHTML\s*=/.test(PL_SRC), 'innerHTML is never assigned in atlas-provision-lectures.js');
});

run('H3. reuses the EXISTING appendLinkedText — no second มาตรา linkifier is defined here', () => {
  ok(/AtlasProvisionView[\s\S]{0,60}_internal[\s\S]{0,60}appendLinkedText/.test(PL_SRC),
     'calls the existing linkifier via AtlasProvisionView._internal.appendLinkedText');
  ok(!/มาตรา\\\\s\*/.test(PL_SRC) && !/new RegExp\(/.test(PL_SRC),
     'no re-implemented มาตรา cross-reference regex');
});

run('H4. a มาตรา reference inside lecture text becomes a real in-drawer xref link (shared linkifier proven live)', () => {
  const resolved = PVI.resolve('civil', '10');   // its note text says "...ตามมาตรา 171 ได้..."
  ok(/มาตรา\s*171/.test(resolved.article.lectureNotes[0].text), 'fixture note really references มาตรา 171');
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  const xref = container.querySelector('a.atlas-provision-view-xref');
  ok(xref, 'the shared xref link class from atlas-provision-view.js is present');
  ok(/id=civil_171/.test(xref.getAttribute('href') || ''), 'it links to civil_171 — got ' + xref.getAttribute('href'));
});

run('H5. ฎีกา numbers inside lecture text are never linkified (no valid target)', () => {
  const resolved = { collection: 'x', number: '1', article: { lectureNotes: [
    { id: 'a', topic: 'T', text: 'ศาลฎีกาวินิจฉัยไว้ในฎีกาที่ 1234/2560 ว่า...' }
  ] } };
  const container = documentObj.createElement('div');
  PL.renderSection(container, resolved);
  eq(container.querySelectorAll('a').length, 0, 'no anchor is created for a ฎีกา citation');
});

run('H6. renderSection never throws when called before the container is attached to the panel', () => {
  const orphan = documentObj.createElement('div');   // never appended anywhere
  const resolved = PVI.resolve('civil', '10');
  PL.renderSection(orphan, resolved);
  ok(orphan.childNodes.length > 0, 'renders correctly even though it was not yet attached (synchronous, no race)');
});

// ================================================================ integration: F1 reader insertion point + order
run('I1. atlas-provision-view.js inserts the lecture container between statutory text and the Concept backlink', () => {
  ok(/atlas-provision-view-lectures/.test(PV_SRC), 'a dedicated container class exists');
  const textIdx = PV_SRC.indexOf('body.appendChild(textEl(resolved));');
  const lecIdx = PV_SRC.indexOf("make('div', 'atlas-provision-view-lectures')");
  const conceptIdx = PV_SRC.indexOf("make('div', 'atlas-provision-view-concepts')");
  ok(textIdx !== -1 && lecIdx !== -1 && conceptIdx !== -1, 'all three anchors present in source');
  ok(textIdx < lecIdx && lecIdx < conceptIdx, 'source order is: statutory text → lecture container → concept backlink');
});

run('I2. atlas-provision-view.js renders lecture notes via AtlasProvisionLectures (no direct coupling to lecture data)',
  () => {
    ok(/AtlasProvisionLectures\s*&&[\s\S]{0,80}renderSection/.test(PV_SRC),
       'calls through the AtlasProvisionLectures.renderSection contract, same shape as AtlasClusters/AtlasProvisionConcepts');
  });

run('I3. end-to-end: opening the F1 reader on civil_10 renders heading → text → LECTURE NOTES → (concept/cases/clusters) → prev/next, in that order', () => {
  PVI.reset();
  applyUrl('/atlas.html#/c/civil');
  historyStack.length = 0; historyStack.push({ url: '/atlas.html#/c/civil', state: null });
  ok(PVI.openProvision('civil', '10', { history: 'push' }), 'reader opened on civil_10');
  ok(APV.isOpen(), 'panel open');
  const panel = PVI.panelEl();

  const heading = panel.querySelector('h2.atlas-provision-view-heading');
  const text = panel.querySelector('div.atlas-provision-view-text');
  const lectures = panel.querySelector('div.atlas-provision-view-lectures');
  const concepts = panel.querySelector('div.atlas-provision-view-concepts');
  ok(heading && text && lectures && concepts, 'all four anchor containers are present in the live panel');

  function domIndex(container, el) { return container.childNodes.indexOf(el); }
  const body = panel.querySelector('div.atlas-provision-view-body');
  const order = [heading, text, lectures, concepts].map(el => domIndex(body, el));
  ok(order[0] < order[1] && order[1] < order[2] && order[2] < order[3],
     'DOM order is heading < statutory text < lecture notes < concept backlink — got ' + JSON.stringify(order));

  ok(lectures.querySelector('p.atlas-plec-label'), 'the authority label actually rendered inside the live reader');
  ok(lectures.querySelector('details.atlas-plec-note'), 'the lecture note actually rendered inside the live reader');
});

run('I4. opening the F1 reader on a provision with no lectureNotes leaves the lecture container empty (compat: existing provisions unaffected)', () => {
  PVI.reset();
  applyUrl('/atlas.html#/c/civil');
  historyStack.length = 0; historyStack.push({ url: '/atlas.html#/c/civil', state: null });
  ok(PVI.openProvision('civil', '1', { history: 'push' }), 'reader opened on civil_1');
  const panel = PVI.panelEl();
  const lectures = panel.querySelector('div.atlas-provision-view-lectures');
  ok(lectures, 'the container still exists (structure unchanged)');
  eq(lectures.childNodes.length, 0, 'but nothing renders inside it — civil_1 has no lectureNotes');
  // everything else the reader already showed keeps working
  ok(panel.querySelector('div.atlas-provision-view-text').textContent.length > 0, 'statutory text still renders');
});

run('I5. AtlasProvisionLectures absent (module not loaded on a page) never breaks the reader — pure progressive enhancement', () => {
  const saved = global.AtlasProvisionLectures;
  try {
    delete global.AtlasProvisionLectures;
    PVI.reset();
    applyUrl('/atlas.html#/c/civil');
    historyStack.length = 0; historyStack.push({ url: '/atlas.html#/c/civil', state: null });
    ok(PVI.openProvision('civil', '10', { history: 'push' }), 'reader still opens with the module absent');
    const panel = PVI.panelEl();
    ok(panel.querySelector('div.atlas-provision-view-text').textContent.length > 0, 'statutory text still renders');
    const lectures = panel.querySelector('div.atlas-provision-view-lectures');
    ok(lectures && lectures.childNodes.length === 0, 'lecture container exists but stays empty — no throw, no crash');
  } finally {
    global.AtlasProvisionLectures = saved;
  }
});

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
