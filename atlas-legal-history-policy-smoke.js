/* Runtime smoke test for the legal-history evidence policy's RENDER + SEARCH path.
   The policy rules themselves (what qualifies) are asserted in atlas-validate.js (PART 4).
   This proves a legal-history concept WITHOUT any มาตรา/structuralAnchor renders and
   is searchable, and that a normal concept is completely unaffected.
   Uses an in-memory FIXTURE concept only — never real data.
   Run:  node atlas-legal-history-policy-smoke.js   (from the project root) */
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
    this.href = undefined;
    this.id = undefined;
    this.type = undefined;
    this.value = '';
  }
  get children() { return this.childNodes.filter(n => n && n.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  set innerHTML(v) { throw new Error('innerHTML must not be used for data text'); }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); if (c) c.parentNode = this; return c; }
  insertBefore(c, ref) {
    if (c && c.parentNode) c.parentNode.removeChild(c);
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i === -1) this.childNodes.push(c); else this.childNodes.splice(i, 0, c);
    if (c) c.parentNode = this; return c;
  }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); if (c) c.parentNode = null; return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { if (k === 'class') return this.className || null; return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  _fire(ev, obj) { (this._listeners[ev] || []).slice().forEach(fn => fn(obj || {})); }
  focus() {}
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

const styleReg = {};
const documentObj = {
  head: headEl, body: bodyEl, readyState: 'complete',
  getElementById: (id) => (id === 'atlas-root' ? atlasRoot : (styleReg[id] || null)),
  createElement: (t) => new El(t),
  createTextNode: (t) => new TextNode(t),
  addEventListener: () => {},
  contains: (n) => bodyEl.contains(n),
};

const locationObj = { pathname: '/encyclopedia.html', search: '', hash: '' };
const historyObj = {
  state: null,
  replaceState(s, t, u) {
    this.state = s || null;
    const qi = String(u || '').indexOf('?');
    locationObj.search = qi === -1 ? '' : String(u).slice(qi).replace(/#.*$/, '');
  },
};

global.window = global;
global.document = documentObj;
global.location = locationObj;
global.history = historyObj;
global.addEventListener = () => {};
global.fetch = undefined;

require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-concepts.js'));
require(path.join(ROOT, 'atlas-encyclopedia.js'));

const AtlasCore = global.AtlasCore;
const AtlasConcepts = global.AtlasConcepts;
const ENC = global.AtlasEncyclopedia;
const EI = ENC._internal;

AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));

const CONCEPT_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8'));
AtlasConcepts._internal.setDoc(CONCEPT_DOC);   // stand in for the async fetch

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }

const HIST_REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-historical-sources.json'), 'utf8'));
const audio = Object.keys(HIST_REG.sources).find(k => HIST_REG.sources[k].kind === 'audio');
const FIX = {
  id: 'atlas:concept/fixture-lh', slug: 'fixture-lh', status: 'published',
  titleTH: 'แนวคิดทดสอบประวัติศาสตร์กฎหมาย', titleEN: 'Legal history fixture', aliases: ['ฟิกซ์เจอร์ประวัติศาสตร์'], latin: [],
  subjectAreas: [], subjectTags: ['legal-history'],
  summary: 'fixture เพื่อทดสอบการเรนเดอร์', definition: { text: 'นี่คือ fixture สำหรับทดสอบว่าแนวคิดประวัติศาสตร์กฎหมายที่ไม่มีมาตราเรนเดอร์ได้', needsSourceVerification: false },
  structuralAnchor: [], sections: [{ key: 's1', kind: 'generic', label: 'ส่วนทดสอบ', items: [{ label: 'ข้อ', text: 'เนื้อหา' }] }],
  provisions: [], sources: [{ kind: 'historical', text: 'fixture' }], relatedConcepts: [], featuredCases: [],
  authoring: { provenance: 'fixture', verifiedSections: [], needsSourceVerification: [], policy: 'x' },
  lectureRefs: [], evidencePolicy: 'legal-history',
  historicalEvidence: { type: 'doctrine',
    basis: [{ source: 'legalhist-page', locator: 'study:roman', label: 'หน้าสรุปวิชา › กฎหมายโรมัน' }, { source: audio, locator: 'fixture', label: 'เสียงบรรยาย fixture' }],
    verification: { method: 'notebooklm-audio', notebook: HIST_REG.notebook.id, date: '2026-09-20', query: 'fixture verification query' } },
};
const DOC = JSON.parse(JSON.stringify(CONCEPT_DOC));
DOC.concepts['fixture-lh'] = FIX;
AtlasConcepts._internal.setDoc(DOC);

const flat = (n) => JSON.stringify(n, (k, v) => (k === 'parentNode' || k === '_listeners') ? undefined : v);

run('1. legal-history fixture (no provisions, no anchor, no subjectAreas) renders', () => {
  const root = document.createElement('div');
  ok(AtlasConcepts._internal.renderInto(root, 'fixture-lh') === true, 'renderInto returned false');
  const t = flat(root);
  ok(t.includes('แนวคิดทดสอบประวัติศาสตร์กฎหมาย'), 'title missing');
  ok(t.includes('หลักฐานทางประวัติศาสตร์กฎหมาย'), 'historical evidence block missing');
  ok(t.includes('หน้าสรุปวิชา › กฎหมายโรมัน') && t.includes('เสียงบรรยาย fixture'), 'basis labels missing');
  ok(t.includes('หลักกฎหมาย / doctrine'), 'evidence type label missing');
  ok(t.includes('notebooklm-audio'), 'verification line missing');
});
run('2. legal-history concept shows no statute-only blocks', () => {
  const root = document.createElement('div');
  AtlasConcepts._internal.renderInto(root, 'fixture-lh');
  const t = flat(root);
  ok(!t.includes('ยังไม่มีคดีสาธารณะ') && !t.includes('คดีที่เกี่ยวข้อง'), 'cases block should be skipped');
  ok(!t.includes('ตำแหน่งในสารบบกฎหมาย') && !t.includes('มาตราที่เกี่ยวข้อง'), 'anchor/provision blocks should be absent');
});
run('3. a normal concept is unaffected (cases block still rendered, no evidence block)', () => {
  const root = document.createElement('div');
  AtlasConcepts._internal.renderInto(root, 'lamoed');
  const t = flat(root);
  ok(t.includes('คดีที่เกี่ยวข้อง'), 'cases block should still render for lamoed');
  ok(!t.includes('หลักฐานทางประวัติศาสตร์กฎหมาย'), 'normal concept must not get the evidence block');
});
run('4. a concept that merely carries historicalEvidence without the marker gets no evidence block', () => {
  const d2 = JSON.parse(JSON.stringify(DOC));
  d2.concepts['fixture-lh'].evidencePolicy = undefined;
  AtlasConcepts._internal.setDoc(d2);
  const root = document.createElement('div');
  AtlasConcepts._internal.renderInto(root, 'fixture-lh');
  ok(!flat(root).includes('หลักฐานทางประวัติศาสตร์กฎหมาย'), 'unmarked concept must not render the evidence block');
  AtlasConcepts._internal.setDoc(DOC);
});
run('5. Encyclopedia index/search finds the legal-history fixture by Thai title and alias', () => {
  const idx = EI.buildIndex(DOC);
  ok(EI.search(idx, 'แนวคิดทดสอบประวัติศาสตร์กฎหมาย').some(e => e.slug === 'fixture-lh'), 'title search');
  ok(EI.search(idx, 'ฟิกซ์เจอร์ประวัติศาสตร์').some(e => e.slug === 'fixture-lh'), 'alias search');
});

console.log('\n  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
