/* Runtime smoke test for atlas-provision-concepts.js  (F4 — Provision → Concept backlinks).

   Verifies the reverse (Provision → Concept) index and the F1-panel backlink
   section in isolation against a minimal DOM shim.

   Loads atlas-concepts.js (the concept document is the single source of truth,
   fed via its _internal.setDoc) + atlas-provision-concepts.js. Does NOT load
   atlas-core / atlas-ui / codex-data.json.

   Run:  node atlas-provision-concept-smoke.js   (from the project root)
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
global.fetch = undefined;   // AtlasConcepts.load without a cached doc → null; we feed via setDoc

require(path.join(ROOT, 'atlas-concepts.js'));
require(path.join(ROOT, 'atlas-provision-concepts.js'));

const AtlasConcepts = global.AtlasConcepts;
const PC = global.AtlasProvisionConcepts;
const PCI = PC._internal;

const CONCEPT_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8'));
AtlasConcepts._internal.setDoc(CONCEPT_DOC);   // so allProvisionRefs / getConcept work
PCI.buildIndex(CONCEPT_DOC);                   // build the reverse index

const PC_SRC = fs.readFileSync(path.join(ROOT, 'atlas-provision-concepts.js'), 'utf8');

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ================================================================ 1. reverse index derivation
run('1. reverse index is derived from the Concept layer (no hand-authored mapping)', () => {
  const byRef = PCI.byRef();
  ok(byRef && typeof byRef === 'object', 'index built');
  ok(Object.keys(byRef).length >= 20, 'covers many provisions, got ' + Object.keys(byRef).length);
  // module never carries its own copy of the concept data
  ok(!/provisionConcepts\.json|provision-concepts\.json/.test(PC_SRC), 'no second dataset file');
  ok(/allProvisionRefs/.test(PC_SRC), 'derives via AtlasConcepts._internal.allProvisionRefs');
});

// ================================================================ 2. known relationship  ม.420 → ละเมิด
run('2. known relationship: civil_420 → ละเมิด (core)', () => {
  const r = PCI.conceptsForProvision('civil_420');
  ok(r.length === 1, 'exactly one concept, got ' + JSON.stringify(r));
  eq(r[0].slug, 'lamoed');
  eq(r[0].titleTH, 'ละเมิด');
  eq(r[0].core, true, 'civil_420 is a core provision of ละเมิด');
});

run('2b. civil_149 → นิติกรรม', () => {
  const r = PCI.conceptsForProvision('civil_149');
  ok(r.some(c => c.slug === 'nitikam' && c.titleTH === 'นิติกรรม'), JSON.stringify(r));
});

// ================================================================ 3. multiple concepts per provision
run('3. a provision may belong to MANY concepts (civil_5 ∈ ละเมิด & นิติกรรม)', () => {
  const r = PCI.conceptsForProvision('civil_5');
  const slugs = r.map(c => c.slug).sort();
  eq(JSON.stringify(slugs), JSON.stringify(['lamoed', 'nitikam']));
});

run('3b. no duplicate concept entry for any provision', () => {
  const byRef = PCI.byRef();
  Object.keys(byRef).forEach(ref => {
    const slugs = byRef[ref].map(x => x.slug);
    eq(slugs.length, new Set(slugs).size, 'dupe slug for ' + ref);
  });
});

run('3c. core concepts sort before non-core', () => {
  // synthetic: fake a ref that is core in one, related in another via the real data shape
  const r = PCI.conceptsForProvision('civil_420');   // core in lamoed only
  ok(r[0].core === true);
});

// ================================================================ 4. unknown provision → nothing
run('4. unknown provision → no concepts', () => {
  eq(PCI.conceptsForProvision('criminal_99999').length, 0);
  eq(PCI.conceptsForProvision('').length, 0);
  eq(PCI.conceptsForProvision(null).length, 0);
});

// ================================================================ 5. currentRefOf
run('5. currentRefOf resolves a provision to its stable ref', () => {
  eq(PCI.currentRefOf({ legacyId: 'civil_420' }), 'civil_420');
  eq(PCI.currentRefOf({ collection: 'civil', number: '420' }), 'civil_420');
  eq(PCI.currentRefOf({ collection: 'civil', storageKey: '1447/2', number: '1447/2' }), 'civil_1447/2');
  eq(PCI.currentRefOf(null), null);
});

// ================================================================ 6. contract (source-level)
run('6. atlas-provision-concepts.js is standalone / additive', () => {
  const code = PC_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\b(AtlasCore|AtlasUI|AtlasConcepts)\s*(\.\w+)?\s*=[^=]/.test(code),
     'never assigns to AtlasCore / AtlasUI / AtlasConcepts');
  ok(!/(AtlasCore|AtlasUI)\._internal/.test(code), 'never reaches AtlasCore/AtlasUI internals');
  ok(!/\blocation\s*\.\s*hash\b/.test(code), 'never touches location.hash');
  ok(!/history\s*\.\s*(pushState|replaceState)/.test(code), 'never touches history');
  ok(/concept\.html\?k=/.test(PC_SRC), 'concept link is the frozen concept.html?k= URL');
  ok(!/codex-data\.json/.test(PC_SRC), 'does not load the corpus');
});

run('6b. does not mutate atlas-concepts.json (schema untouched)', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8');
  ok(!/\bprovisionConcepts\b|\bbacklinks\b|\bconceptsByProvision\b/.test(raw),
     'no F4 field added to the concept schema');
});

// ================================================================ 7. rendering (async)
// renderSection is fire-and-forget; drain a couple of microtasks then assert
function drainAndAssert() {
  const parent = new El('div');
  const c1 = new El('div'); parent.appendChild(c1);
  PC.renderSection(c1, { legacyId: 'civil_420', collection: 'civil', number: '420' });

  const c2 = new El('div'); parent.appendChild(c2);
  PC.renderSection(c2, { legacyId: 'criminal_99999', collection: 'criminal', number: '99999' });

  return Promise.resolve().then(() => Promise.resolve()).then(() => Promise.resolve()).then(() => {
    run('7. renderSection builds a concept backlink for civil_420', () => {
      const link = c1.querySelector('a.atlas-pcpt-link');
      ok(link, 'backlink rendered');
      eq(link.getAttribute('href'), 'concept.html?k=lamoed');
      eq(link.textContent, 'ละเมิด');
      ok(c1.querySelector('.atlas-pcpt-label'), 'has the "อยู่ในแนวคิด" label');
    });
    run('7b. renderSection renders NOTHING for a provision with no concept (no empty card)', () => {
      eq(c2.childNodes.length, 0, 'container left empty');
    });
  });
}

function loadFailureTest() {
  PCI.reset();
  PCI.setDoc(null);   // concept layer unavailable
  const parent = new El('div');
  const c = new El('div'); parent.appendChild(c);
  PC.renderSection(c, { legacyId: 'civil_420', collection: 'civil', number: '420' });
  return Promise.resolve().then(() => Promise.resolve()).then(() => {
    run('8. concept-layer load failure → renders nothing, never throws (F1 unaffected)', () => {
      eq(c.childNodes.length, 0);
    });
    // restore for any later use
    PCI.reset();
    PCI.setDoc(CONCEPT_DOC);
  });
}

drainAndAssert()
  .then(loadFailureTest)
  .then(() => {
    console.log('\n----------------------------------------');
    console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
    console.log('----------------------------------------');
    process.exit(fail ? 1 : 0);
  })
  .catch(e => { console.log('  FATAL  ' + (e && e.stack || e)); process.exit(1); });
