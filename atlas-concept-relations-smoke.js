/* Runtime smoke test for atlas-concept-relations.js  (F8 — Concept ↔ Concept
   relationship integrity + inbound surfacing).

   Loads atlas-core.js + registry + codex-data.json + atlas-concepts.js +
   atlas-concept-relations.js against a minimal DOM shim, then drives the real
   Concept Entry render (atlas-concepts.js) followed by the F8 enhance() pass.
   Uses the ACTUAL atlas-concepts.json — no fabricated corpus; only tiny
   synthetic docs for the negative integrity controls.

   Run:  node atlas-concept-relations-smoke.js   (from the project root)
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
  }
  get firstChild() { return this.childNodes[0] || null; }
  get nextSibling() {
    if (!this.parentNode) return null;
    const s = this.parentNode.childNodes, i = s.indexOf(this);
    return (i >= 0 && i + 1 < s.length) ? s[i + 1] : null;
  }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  set innerHTML(v) { throw new Error('innerHTML must not be used for data text'); }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); if (c) c.parentNode = this; return c; }
  insertBefore(c, ref) {
    if (c && c.parentNode) c.parentNode.removeChild(c);
    if (ref == null) { this.childNodes.push(c); }
    else {
      const i = this.childNodes.indexOf(ref);
      if (i === -1) this.childNodes.push(c); else this.childNodes.splice(i, 0, c);
    }
    if (c) c.parentNode = this;
    return c;
  }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); if (c) c.parentNode = null; return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); if (k === 'id') this.id = String(v); }
  getAttribute(k) { if (k === 'class') return this.className || null; return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  addEventListener() {}
  _classes() { return String(this.className || '').trim().split(/\s+/).filter(Boolean); }
  matches(sel) {
    return String(sel).split(',').some(part => {
      part = part.trim();
      let neg = null;
      part = part.replace(/:not\(([^)]*)\)/g, (_, inner) => { neg = inner.trim(); return ''; });
      const tagM = /^([a-z0-9]+)/i.exec(part);
      if (tagM && this.tagName !== tagM[1].toUpperCase()) return false;
      const classes = (part.match(/\.([a-z0-9_-]+)/gi) || []).map(s => s.slice(1));
      if (!classes.every(c => this._classes().indexOf(c) !== -1)) return false;
      if (neg) {
        const nc = (neg.match(/\.([a-z0-9_-]+)/gi) || []).map(s => s.slice(1));
        if (nc.every(c => this._classes().indexOf(c) !== -1)) return false;
      }
      return true;
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
const _origAppend = headEl.appendChild.bind(headEl);
headEl.appendChild = (c) => { if (c && c.id) styleReg[c.id] = c; return _origAppend(c); };
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
require(path.join(ROOT, 'atlas-concept-relations.js'));
const AtlasConcepts = global.AtlasConcepts;
const AR = global.AtlasConceptRelations;
const RI = AR._internal;

const DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8'));
const KINDS = DOC.relationKinds;

let pass = 0, fail = 0;
const TESTS = [];
function test(name, fn) { TESTS.push({ name, fn }); }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// render a real Concept Entry then apply the F8 enhance() pass.
// AtlasConcepts.load() resolves from the in-memory doc — no fetch involved.
function renderEnhanced(slug, doc) {
  AtlasConcepts._internal.setDoc(doc || DOC);
  const root = new El('div');
  const okR = AtlasConcepts._internal.renderInto(root, slug);
  return AR.enhance(root, slug).then(enhanced => ({ root, okR, enhanced }));
}
const D = (concepts) => ({ relationKinds: KINDS, concepts });

// ================================================================ 1
test('1. published concept lookup — the real doc has exactly lamoed + nitikam published', () => {
  const pub = Object.keys(DOC.concepts).filter(k => DOC.concepts[k].status === 'published').sort();
  eq(pub, ['lamoed', 'nitikam'], 'published set');
});

// ================================================================ 2
test('2. outbound relationship lookup — authored relatedConcepts read directly off the concept', () => {
  const out = (DOC.concepts.nitikam.relatedConcepts || []).map(rc => RI.slugOf(rc.ref) + ':' + rc.rel);
  ok(out.indexOf('lamoed:contrast') !== -1, 'nitikam --contrast--> lamoed is authored');
  ok(out.indexOf('sanya:specializes') !== -1, 'nitikam --specializes--> sanya is authored');
});

// ================================================================ 3
test('3. inbound reverse-index construction — derived from the SAME relatedConcepts[]', () => {
  const idx = RI.buildInboundIndex(DOC);
  ok(idx && typeof idx === 'object', 'index built');
  ok(Array.isArray(idx.lamoed) && idx.lamoed.length >= 1, 'lamoed has inbound edges');
  ok(Array.isArray(idx.nitikam) && idx.nitikam.length >= 1, 'nitikam has inbound edges');
  ok(Array.isArray(idx.nee) && idx.nee.length >= 1, 'planned target nee still indexed');
  Object.keys(idx).forEach(target => idx[target].forEach(e => {
    ok(DOC.concepts[e.slug], 'inbound source ' + e.slug + ' is an authored concept');
    ok(e.slug !== target, 'no self-edge in the index (' + target + ')');
  }));
});

// ================================================================ 4
test('4. valid target resolution — inboundFor resolves live title/status of the source', async () => {
  await renderEnhanced('lamoed');
  const inb = RI.inboundFor(DOC, 'lamoed');
  const fromNitikam = inb.find(e => e.slug === 'nitikam');
  ok(fromNitikam, 'lamoed has an inbound edge from nitikam');
  eq(fromNitikam.rel, 'contrast', 'rel preserved from nitikam\'s authored edge');
  eq(fromNitikam.title, DOC.concepts.nitikam.titleTH, 'live titleTH wins');
  eq(fromNitikam.status, 'published', 'live status wins');
  ok(fromNitikam.known === true, 'source resolved');
});

// ================================================================ 5
test('5. invalid target detection — dangling / bad-namespace / empty ref', () => {
  const bad = D({
    x: { slug: 'x', status: 'published', relatedConcepts: [
      { ref: 'atlas:concept/ghost-concept', rel: 'seealso' },
      { ref: 'civil_420', rel: 'seealso' },
      { ref: '   ', rel: 'seealso' }
    ] }
  });
  const kinds = RI.auditRelations(bad).problems.map(p => p.problem).sort();
  eq(kinds, ['bad-namespace', 'dangling-target', 'empty-or-malformed-ref'], 'each caught once');
  const okPlanned = RI.auditRelations(D({
    x: { slug: 'x', status: 'published', relatedConcepts: [
      { ref: 'atlas:concept/not-written-yet', rel: 'seealso', status: 'planned' }
    ] }
  })).problems;
  eq(okPlanned, [], 'explicitly-planned target passes');
});

// ================================================================ 6
test('6. invalid relation-kind detection — unknown + missing', () => {
  const p = RI.auditRelations(D({
    x: { slug: 'x', status: 'published', relatedConcepts: [
      { ref: 'atlas:concept/y', rel: 'not-a-kind', status: 'planned' },
      { ref: 'atlas:concept/z', status: 'planned' }
    ] }
  })).problems.map(p => p.problem).sort();
  eq(p, ['missing-rel', 'unknown-rel'], 'unknown + missing both caught');
  const kinds = ['parent', 'specializes', 'contrast', 'prerequisite', 'seealso'];
  const good = RI.auditRelations(D({
    x: { slug: 'x', status: 'published', relatedConcepts:
      kinds.map((k, i) => ({ ref: 'atlas:concept/t' + i, rel: k, status: 'planned' })) }
  })).problems;
  eq(good, [], 'every authored relation kind passes');
});

// ================================================================ 7
test('7. duplicate detection — same target + same rel; different rel is allowed', () => {
  const dup = RI.auditRelations(D({
    x: { slug: 'x', status: 'published', relatedConcepts: [
      { ref: 'atlas:concept/y', rel: 'seealso', status: 'planned' },
      { ref: 'atlas:concept/y', rel: 'seealso', status: 'planned' }
    ] }
  })).problems.filter(p => p.problem === 'duplicate');
  eq(dup.length, 1, 'exactly one duplicate flagged');
  const twoKinds = RI.auditRelations(D({
    x: { slug: 'x', status: 'published', relatedConcepts: [
      { ref: 'atlas:concept/y', rel: 'contrast', status: 'planned' },
      { ref: 'atlas:concept/y', rel: 'seealso', status: 'planned' }
    ] }
  })).problems.filter(p => p.problem === 'duplicate');
  eq(twoKinds.length, 0, 'two genuinely different relations to the same target are legitimate');
});

// ================================================================ 8
test('8. self-reference detection', () => {
  const p = RI.auditRelations(D({
    lamoed: { slug: 'lamoed', status: 'published', relatedConcepts: [
      { ref: 'atlas:concept/lamoed', rel: 'seealso' }
    ] }
  })).problems.map(p => p.problem);
  ok(p.indexOf('self-reference') !== -1, 'self-reference flagged');
  const idx = RI.buildInboundIndex({
    concepts: { lamoed: { relatedConcepts: [{ ref: 'atlas:concept/lamoed', rel: 'seealso' }] } }
  });
  ok(!idx.lamoed, 'self-edge excluded from the inbound index');
});

// ================================================================ 9
test('9. directional semantics preserved — A--rel-->B does not create B--rel-->A', () => {
  const d = D({
    a: { slug: 'a', titleTH: 'A', status: 'published', relatedConcepts: [{ ref: 'atlas:concept/b', rel: 'parent' }] },
    b: { slug: 'b', titleTH: 'B', status: 'published', relatedConcepts: [] }
  });
  const idx = RI.buildInboundIndex(d);
  eq((idx.b || []).map(e => e.slug + ':' + e.rel), ['a:parent'], 'b receives the inbound edge from a');
  ok(!idx.a, 'a gets NO reciprocal inbound edge');
  const real = RI.buildInboundIndex(DOC);
  ok(real.lamoed.some(e => e.slug === 'nitikam' && e.rel === 'contrast'), 'lamoed <- nitikam');
  ok(real.nitikam.some(e => e.slug === 'lamoed' && e.rel === 'contrast'), 'nitikam <- lamoed (independently authored)');
});

// ================================================================ 10
test('10. inbound Concept Entry navigation URL — concept.html?k=<slug>, no new route', async () => {
  const { root, enhanced } = await renderEnhanced('lamoed');
  ok(enhanced === true, 'enhance produced an inbound section');
  const sec = root.querySelector('.atlas-concept-inbound');
  ok(sec, 'inbound section present');
  const links = sec.querySelectorAll('a.atlas-concept-related-chip');
  ok(links.length >= 1, 'at least one inbound link');
  links.forEach(a => {
    ok(/^concept\.html\?k=/.test(a.href), 'frozen concept-entry URL: ' + a.href);
    ok(a.href.indexOf('#/c/') === -1 && a.href.indexOf('atlas.html') === -1, 'no Atlas route');
  });
  const nitikamLink = links.find(a => a.href === 'concept.html?k=nitikam');
  ok(nitikamLink && nitikamLink.textContent === DOC.concepts.nitikam.titleTH, 'links to นิติกรรม by title');
});

// ================================================================ 11
test('11. multiple inbound relationships render as distinct rows', () => {
  const d = D({
    hub: { slug: 'hub', titleTH: 'HUB', status: 'published', relatedConcepts: [] },
    p:   { slug: 'p', titleTH: 'P', status: 'published', relatedConcepts: [{ ref: 'atlas:concept/hub', rel: 'seealso', note: 'n1' }] },
    q:   { slug: 'q', titleTH: 'Q', status: 'published', relatedConcepts: [{ ref: 'atlas:concept/hub', rel: 'contrast' }] },
    r:   { slug: 'r', titleTH: 'R', status: 'planned',  relatedConcepts: [{ ref: 'atlas:concept/hub', rel: 'prerequisite' }] }
  });
  const inb = RI.inboundFor(d, 'hub');
  eq(inb.length, 3, 'three inbound sources');
  eq(inb.map(e => e.slug).sort(), ['p', 'q', 'r']);
  const sec = RI.buildInboundSection(inb);
  eq(sec.querySelectorAll('.atlas-concept-inbound-row').length, 3, 'three rows');
  eq(sec.querySelectorAll('a.atlas-concept-related-chip').length, 2, 'two links (p, q)');
  eq(sec.querySelectorAll('span.is-planned').length, 1, 'one quiet span (r, planned)');
  ok(sec.textContent.indexOf('n1') !== -1, 'relationship note surfaced');
  ok(sec.textContent.indexOf('เทียบเคียง') !== -1, 'contrast phrased for the inbound direction');
});

// ================================================================ 12
test('12. empty inbound + missing dataset fail soft', async () => {
  const d = D({
    solo: { slug: 'solo', titleTH: 'SOLO', status: 'published', subjectAreas: ['private-law'],
      summary: 'x', definition: { text: 'x' }, sources: [], authoring: { provenance: 'x' },
      relatedConcepts: [] }
  });
  const { root } = await renderEnhanced('solo', d);
  ok(!root.querySelector('.atlas-concept-inbound'), 'no inbound section rendered (hidden empty state)');
  eq(RI.buildInboundIndex(null), {}, 'null doc -> empty index');
  eq(RI.inboundFor(null, 'lamoed'), [], 'null doc -> empty inbound list');
  eq(RI.auditRelations(null).problems, [], 'null doc -> no audit crash');
  eq(RI.auditRelations(undefined).problems, [], 'undefined doc -> no audit crash');
});

// ================================================================ real-data integrity gate
test('R. the SHIPPED atlas-concepts.json passes every integrity rule', () => {
  const res = RI.auditRelations(DOC);
  ok(res.problems.length === 0,
     'problems: ' + res.problems.map(p => p.concept + '/' + p.ref + ' ' + p.problem).join(' | '));
  ok(res.checked >= 6, 'audited ' + res.checked + ' authored edges across ' + res.concepts + ' concepts');
});

// ================================================================ outbound direction caption
test('S. the outbound section gains an explicit direction caption (lists never merged)', async () => {
  const { root } = await renderEnhanced('nitikam');
  const outbound = root.querySelector('.atlas-concept-related:not(.atlas-concept-inbound)');
  ok(outbound, 'outbound section still present');
  const cap = outbound.querySelector('.atlas-concept-direction');
  ok(cap && cap.textContent.indexOf('→') !== -1, 'outbound caption points outward');
  const inbound = root.querySelector('.atlas-concept-inbound');
  ok(inbound, 'inbound section present and separate');
  ok(inbound.querySelector('.atlas-concept-direction').textContent.indexOf('←') !== -1, 'inbound caption points inward');
  ok(outbound !== inbound, 'two distinct sections');
});

// ---------------------------------------------------------------- run
(async () => {
  for (const { name, fn } of TESTS) {
    try { await fn(); pass++; console.log('  PASS  ' + name); }
    catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); }
  }
  console.log('\n----------------------------------------');
  console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
  console.log('----------------------------------------');
  process.exit(fail ? 1 : 0);
})();
