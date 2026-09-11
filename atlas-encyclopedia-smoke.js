/* Runtime smoke test for atlas-encyclopedia.js  (FINALIZATION 3 — Encyclopedia).

   Verifies the Encyclopedia discovery layer in isolation against a minimal DOM
   shim: the derived term index, Thai-aware alphabetical grouping, search, the
   rendered index/search UI, and the standalone/additive contract.

   Loads atlas-core (registry only, for subject-area labels) + atlas-concepts
   (the concept document is the single source of truth) + atlas-encyclopedia.
   Does NOT load atlas-ui.js / codex-data.json.

   Run:  node atlas-encyclopedia-smoke.js   (from the project root)
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

const ENC_SRC = fs.readFileSync(path.join(ROOT, 'atlas-encyclopedia.js'), 'utf8');

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ================================================================ 1. Thai-aware initial letter
run('1. thaiInitial: consonant / preposed-vowel / latin / punctuation', () => {
  eq(EI.thaiInitial('ละเมิด'), 'ล');
  eq(EI.thaiInitial('นิติกรรม'), 'น');
  eq(EI.thaiInitial('เจตนา'), 'จ', 'preposed vowel เ is skipped to the consonant');
  eq(EI.thaiInitial('  “ความรับผิด'), 'ค', 'leading spaces/quotes are skipped');
  eq(EI.thaiInitial('Tort'), null, 'latin-first → null (A–Z bucket)');
  eq(EI.thaiInitial('Delictum'), null);
});

run('1b. groupKey / groupRank ordering', () => {
  eq(EI.groupKey('Delictum'), 'A–Z');
  eq(EI.groupKey('ละเมิด'), 'ล');
  ok(EI.groupRank('ก') < EI.groupRank('ล'), 'ก sorts before ล');
  ok(EI.groupRank('ล') < EI.groupRank('A–Z'), 'Thai groups sort before the A–Z bucket');
});

// ================================================================ 2. derived term index
const INDEX = EI.buildIndex(CONCEPT_DOC);

run('2. buildIndex derives entries only from PUBLISHED concepts', () => {
  const published = Object.keys(CONCEPT_DOC.concepts).filter(k => CONCEPT_DOC.concepts[k].status === 'published');
  ok(INDEX.length >= 8, 'expected a handful of terms, got ' + INDEX.length);
  ok(INDEX.every(e => published.indexOf(e.slug) !== -1),
     'only published concepts contribute terms');
  const primaries = INDEX.filter(e => e.kind === 'primary').map(e => e.term).sort();
  eq(JSON.stringify(primaries),
     JSON.stringify(published.map(k => CONCEPT_DOC.concepts[k].titleTH).sort()),
     'one primary term per published concept');
});

run('2b. Thai names, aliases, English and Latin are all indexed', () => {
  const byTerm = t => INDEX.find(e => e.term === t);
  ok(byTerm('ละเมิด') && byTerm('ละเมิด').kind === 'primary');
  ok(byTerm('ทำละเมิด') && byTerm('ทำละเมิด').kind === 'alias', 'alias ทำละเมิด indexed');
  ok(byTerm('ทำละเมิด').slug === 'lamoed', 'alias points back to its concept');
  ok(INDEX.some(e => e.kind === 'en' && /tort/i.test(e.term)), 'English equivalent from titleEN indexed');
  ok(INDEX.some(e => e.kind === 'latin' && e.term === 'Delictum' && e.slug === 'lamoed'),
     'curated Latin term "Delictum" indexed');
  ok(INDEX.some(e => e.kind === 'latin' && e.term === 'Negotium juridicum' && e.slug === 'nitikam'),
     'curated Latin term for นิติกรรม indexed');
});

run('2c. groupEntries produces alphabetical groups incl. an A–Z bucket for Latin/English', () => {
  const groups = EI.groupEntries(INDEX);
  ok(groups.length >= 2);
  for (let i = 1; i < groups.length; i++) ok(groups[i].rank >= groups[i - 1].rank, 'groups sorted by rank');
  eq(groups[groups.length - 1].key, 'A–Z', 'A–Z bucket is last');
  const az = groups.find(g => g.key === 'A–Z');
  ok(az.entries.every(e => e.kind === 'en' || e.kind === 'latin'),
     'A–Z bucket holds only English/Latin-first terms');
});

// ================================================================ 3. search
run('3. Thai search finds the concept and its aliases', () => {
  const r = EI.search(INDEX, 'ละเมิด');
  ok(r.length >= 4, 'ละเมิด + 3 aliases, got ' + r.length);
  eq(r[0].term, 'ละเมิด', 'exact prefix match ranked first');
  ok(r.every(e => e.slug === 'lamoed'));
});

run('3b. English / Latin search works (no auto-translation, data-driven only)', () => {
  ok(EI.search(INDEX, 'tort').some(e => e.slug === 'lamoed'), 'search "tort" → ละเมิด');
  ok(EI.search(INDEX, 'delictum').some(e => e.slug === 'lamoed'), 'search "delictum" → ละเมิด');
  ok(EI.search(INDEX, 'juristic').some(e => e.slug === 'nitikam'), 'search "juristic" → นิติกรรม');
  eq(EI.search(INDEX, 'zzz-not-a-term').length, 0, 'unknown term → no results');
});

run('3c. empty query returns the full index', () => {
  eq(EI.search(INDEX, '').length, INDEX.length);
  eq(EI.search(INDEX, '   ').length, INDEX.length);
});

// ================================================================ 5. contract (source-level, sync)
run('5. atlas-encyclopedia.js is standalone/additive (no mutation of core layers)', () => {
  const code = ENC_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok(!/\b(AtlasCore|AtlasUI|AtlasConcepts)\s*(\.\w+)?\s*=[^=]/.test(code),
     'never assigns to AtlasCore / AtlasUI / AtlasConcepts');
  ok(!/(AtlasCore|AtlasUI)\._internal/.test(code), 'never reaches into AtlasCore/AtlasUI internals');
  ok(!/\blocation\s*\.\s*hash\b/.test(code), 'never touches location.hash');
  ok(!/history\s*\.\s*pushState/.test(code), 'never pushState (route grammar untouched)');
  ok(/history\s*\.\s*replaceState/.test(ENC_SRC), 'uses replaceState for the ?q= param only');
});

run('5b. concept links are the frozen URL; no statutory text / provision DB here', () => {
  ok(/concept\.html\?k=/.test(ENC_SRC), 'concept-entry URL is concept.html?k=');
  ok(!/codex-data\.json/.test(ENC_SRC), 'does not load the corpus');
  ok(!/resolveProvision|getProvisionBrief/.test(ENC_SRC), 'does not resolve provisions (that stays on the concept page)');
});

run('5c. reads the concept document only through AtlasConcepts.load()', () => {
  ok(/AtlasConcepts\.load\s*\(/.test(ENC_SRC));
  ok(/collectPlanned/.test(ENC_SRC), 'reuses AtlasConcepts._internal.collectPlanned for the planned list');
});

run('5d. host page encyclopedia.html wires the scripts in order', () => {
  const html = fs.readFileSync(path.join(ROOT, 'encyclopedia.html'), 'utf8');
  const iC = html.indexOf('atlas-concepts.js');
  const iE = html.indexOf('atlas-encyclopedia.js');
  ok(iC !== -1 && iE !== -1 && iC < iE, 'atlas-concepts.js loads before atlas-encyclopedia.js');
  ok(/id="atlas-root"/.test(html), 'mount point present');
  ok(!/codex-data\.json/.test(html), 'host does not fetch the corpus');
});

// ================================================================ 4. rendered UI (async, one chain)
function asyncTests() {
  return ENC.render(atlasRoot, {}).then(res => {
    run('4. render() builds the Encyclopedia into #atlas-root', () => {
      ok(res === true, 'render resolved true');
      ok(atlasRoot.querySelector('.atlas-enc'), 'root article present');
      ok(atlasRoot.querySelector('.atlas-enc-input'), 'search box present');
      ok(atlasRoot.querySelectorAll('.atlas-enc-group').length >= 2, 'alphabetical groups rendered');
    });

    run('4b. every term links to the FROZEN concept-entry URL concept.html?k=<slug>', () => {
      const published = Object.keys(CONCEPT_DOC.concepts).filter(k => CONCEPT_DOC.concepts[k].status === 'published');
      const links = atlasRoot.querySelectorAll('a.atlas-enc-term');
      ok(links.length >= 8, 'term links rendered, got ' + links.length);
      ok(links.every(a => {
        const m = /^concept\.html\?k=([a-z][a-z0-9-]*)$/.exec(a.href);
        return m && published.indexOf(m[1]) !== -1;
      }), 'links: ' + links.map(a => a.href).join(', '));
    });

    run('4c. secondary entries (alias/en/latin) show a "→ canonical" pointer', () => {
      const sec = atlasRoot.querySelectorAll('.atlas-enc-entry.is-secondary');
      ok(sec.length >= 4);
      ok(sec.every(li => li.querySelector('.atlas-enc-see')), 'each carries a see-reference');
    });

    run('4d. a Latin entry is rendered and points to its concept', () => {
      const latin = atlasRoot.querySelectorAll('.atlas-enc-entry').filter(li => li.dataset.kind === 'latin');
      ok(latin.length >= 1);
      ok(latin.some(li => li.textContent.indexOf('Delictum') !== -1));
    });

    run('4e. planned concepts appear in a restrained, UNLINKED "กำลังจัดทำ" section', () => {
      const planned = atlasRoot.querySelector('.atlas-enc-planned');
      ok(planned, 'planned section present');
      ok(planned.querySelectorAll('a').length === 0, 'planned entries are not links (no entry exists yet)');
      ok(planned.querySelectorAll('li').length >= 3, 'planned list populated');
    });
  }).then(() => {
    locationObj.search = '?q=' + encodeURIComponent('ละเมิด');
    const fresh = new El('div');
    return ENC.render(fresh, {}).then(() => {
      run('4f. ?q= deep link pre-filters the index; search view is a flat list', () => {
        const input = fresh.querySelector('.atlas-enc-input');
        eq(input.value, 'ละเมิด', 'search box pre-filled from ?q=');
        const results = fresh.querySelectorAll('.atlas-enc-entry');
        ok(results.length >= 4 && results.length < INDEX.length,
           'index pre-filtered to the query, got ' + results.length);
        ok(fresh.querySelectorAll('.atlas-enc-group').length === 0, 'search view is a flat list, not grouped');
      });
      locationObj.search = '';
    });
  });
}

asyncTests().then(() => {
  console.log('\n----------------------------------------');
  console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
  console.log('----------------------------------------');
  process.exit(fail ? 1 : 0);
}).catch(e => {
  console.log('  FATAL  ' + (e && e.stack || e));
  process.exit(1);
});
