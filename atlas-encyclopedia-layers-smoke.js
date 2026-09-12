/* Runtime smoke test for the Encyclopedia 3-LAYER architecture:
     Concept (atlas-concepts.js)
       -> Concept Cluster (atlas-concept-clusters.js / atlas-concept-clusters.json)
       -> Collection/Topic (atlas-topics.js / atlas-topics.json, code name "Topic"
          to avoid colliding with the pre-existing codex `collection` meaning)

   Also guards the two naming collisions identified in the architecture audit:
     - atlas-concept-clusters.json (concept groups) must never reuse an id from
       the PRE-EXISTING atlas-clusters.json (provision-relationship groups) —
       same English word, two unrelated features.
     - atlas-topics.json topic slugs must never collide with a real codex
       collection key (civil/criminal/...) from collections-registry.json.

   Run:  node atlas-encyclopedia-layers-smoke.js   (from the project root)
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
  insertBefore(n, ref) {
    if (n && n.parentNode) n.parentNode.removeChild(n);
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    if (i === -1) this.childNodes.push(n); else this.childNodes.splice(i, 0, n);
    if (n) n.parentNode = this;
    return n;
  }
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
const CONCEPT_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8'));
AtlasConcepts._internal.setDoc(CONCEPT_DOC);

require(path.join(ROOT, 'atlas-concept-clusters.js'));
const AtlasConceptClusters = global.AtlasConceptClusters;
const CLUSTER_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concept-clusters.json'), 'utf8'));
AtlasConceptClusters._internal.setDoc(CLUSTER_DOC);

require(path.join(ROOT, 'atlas-topics.js'));
const AtlasTopics = global.AtlasTopics;
const TOPIC_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-topics.json'), 'utf8'));
AtlasTopics._internal.setDoc(TOPIC_DOC);

require(path.join(ROOT, 'atlas-encyclopedia.js'));
const AtlasEncyclopedia = global.AtlasEncyclopedia;

const PROVISION_CLUSTER_DOC = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-clusters.json'), 'utf8'));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8'));

let pass = 0, fail = 0;
function run(name, fn) { try { fn(); pass++; console.log('  PASS  ' + name); } catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + (e && e.message || e)); } }
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

function renderCluster(slug) { const root = new El('div'); const okR = AtlasConceptClusters._internal.renderInto(root, slug); return { root, okR }; }
function renderTopic(slug) { const root = new El('div'); const okR = AtlasTopics._internal.renderInto(root, slug); return { root, okR }; }
function renderConcept(slug) { const root = new El('div'); const okR = AtlasConcepts._internal.renderInto(root, slug); return { root, okR }; }

// ================================================================ A. naming-collision guards
run('A1. no atlas-concept-clusters.json cluster slug collides with a PRE-EXISTING atlas-clusters.json (provision cluster) id', () => {
  const conceptClusterSlugs = new Set(Object.keys(CLUSTER_DOC.clusters));
  const provisionClusterIds = new Set((PROVISION_CLUSTER_DOC.clusters || []).map(c => c.id));
  conceptClusterSlugs.forEach(s => ok(!provisionClusterIds.has(s), s + ' collides with a provision-cluster id'));
});
run('A2. no atlas-topics.json topic slug collides with a real codex collection key', () => {
  const topicSlugs = Object.keys(TOPIC_DOC.topics);
  const collectionKeys = new Set(Object.keys(REGISTRY.collections || {}));
  topicSlugs.forEach(s => ok(!collectionKeys.has(s), s + ' collides with collections-registry.json collection key'));
});

// ================================================================ B. schema integrity
run('B1. every cluster.concepts[].ref resolves to a PUBLISHED concept in atlas-concepts.json', () => {
  Object.keys(CLUSTER_DOC.clusters).forEach(slug => {
    const cl = CLUSTER_DOC.clusters[slug];
    ok(Array.isArray(cl.concepts) && cl.concepts.length >= 2, slug + ' has at least 2 ordered concepts');
    cl.concepts.forEach(m => {
      const cslug = m.ref.replace('atlas:concept/', '');
      const c = CONCEPT_DOC.concepts[cslug];
      ok(c, slug + ' member ' + cslug + ' exists in atlas-concepts.json');
      ok(c.status === 'published', slug + ' member ' + cslug + ' is published (no fabricated content)');
    });
  });
});
run('B2. every topic.path[] entry resolves to a real, published concept or cluster', () => {
  Object.keys(TOPIC_DOC.topics).forEach(tslug => {
    const t = TOPIC_DOC.topics[tslug];
    ok(Array.isArray(t.path) && t.path.length >= 1, tslug + ' has a non-empty path');
    t.path.forEach(p => {
      if (p.kind === 'cluster') {
        const cslug = p.ref.replace('atlas:cluster/', '');
        ok(CLUSTER_DOC.clusters[cslug] && CLUSTER_DOC.clusters[cslug].status === 'published',
           tslug + ' cluster step ' + cslug + ' exists and published');
      } else if (p.kind === 'concept') {
        const cslug = p.ref.replace('atlas:concept/', '');
        ok(CONCEPT_DOC.concepts[cslug] && CONCEPT_DOC.concepts[cslug].status === 'published',
           tslug + ' concept step ' + cslug + ' exists and published');
      } else {
        throw new Error(tslug + ' path entry has unknown kind ' + p.kind);
      }
    });
  });
});
run('B3. cluster→topic backlink is consistent: every cluster.topics[] entry is a real topic that actually lists that cluster', () => {
  Object.keys(CLUSTER_DOC.clusters).forEach(cslug => {
    (CLUSTER_DOC.clusters[cslug].topics || []).forEach(tref => {
      const tslug = tref.replace('atlas:topic/', '');
      const t = TOPIC_DOC.topics[tslug];
      ok(t, cslug + ' -> declared topic ' + tslug + ' exists');
      const back = (t.path || []).some(p => p.kind === 'cluster' && p.ref === 'atlas:cluster/' + cslug);
      ok(back, tslug + '.path[] actually includes cluster ' + cslug);
    });
  });
});

// ================================================================ C. Cluster rendering (LEVEL 2)
run('C1. rendering cluster "sap-sitthi" lists its 4 concepts in authored order, each linking to concept.html?k=<slug>', () => {
  const { root, okR } = renderCluster('sap-sitthi');
  ok(okR === true, 'renderInto succeeded');
  const items = root.querySelectorAll('.atlas-cluster-item');
  eq(items.length, 4, '4 ordered items');
  const wantOrder = ['sap', 'kammasit', 'krobkrong', 'sitthi-thang-sap-uen'];
  items.forEach((li, i) => {
    const a = li.querySelector('a.atlas-cluster-item-title');
    ok(a, 'item ' + i + ' is a link (all 4 are published concepts)');
    eq(a.href, 'concept.html?k=' + wantOrder[i], 'item ' + i + ' points at the right concept');
  });
});
run('C2. the featured member (kammasit) carries the featured badge; others do not', () => {
  const { root } = renderCluster('sap-sitthi');
  const featured = root.querySelectorAll('.atlas-cluster-item.is-featured');
  eq(featured.length, 1, 'exactly one featured item');
  ok(featured[0].querySelector('a').href.indexOf('kammasit') !== -1, 'featured item is kammasit');
});
run('C3. cluster page renders an upward-nav link to its parent Topic (concept.html?t=sap)', () => {
  const { root } = renderCluster('sap-sitthi');
  const link = root.querySelectorAll('a').find(a => a.href === 'concept.html?t=sap');
  ok(link, 'upward link to concept.html?t=sap present');
});
run('C4. unknown cluster slug fails soft (no throw, error text, ok=false)', () => {
  const { root, okR } = renderCluster('does-not-exist');
  ok(okR === false, 'reports failure');
  ok(root.textContent.indexOf('ไม่พบกลุ่มแนวคิด') !== -1, 'shows a not-found message');
});

// ================================================================ D. Topic rendering (LEVEL 3)
run('D1. rendering topic "sap" shows one cluster step sized "4 แนวคิด"', () => {
  const { root, okR } = renderTopic('sap');
  ok(okR === true, 'renderInto succeeded');
  const steps = root.querySelectorAll('.atlas-topic-step');
  eq(steps.length, 1, 'one path step (the sap-sitthi cluster)');
  ok(steps[0].className.indexOf('atlas-topic-step-cluster') !== -1, 'step is tagged as a cluster kind');
  const meta = steps[0].querySelector('.atlas-topic-step-meta');
  ok(meta && meta.textContent === '4 แนวคิด', 'cluster size hint reads "4 แนวคิด", got: ' + (meta && meta.textContent));
});
run('D2. rendering topic "nee" lists 7 ordered concept steps, each a direct concept link', () => {
  const { root, okR } = renderTopic('nee');
  ok(okR === true, 'renderInto succeeded');
  const steps = root.querySelectorAll('.atlas-topic-step');
  eq(steps.length, 7, 'seven path steps');
  const wantOrder = ['nee', 'sitthi-yeud-nuang-burimsit', 'bo-koet-haeng-nee', 'nitikam', 'sanya', 'lamoed', 'laap-mikhuan-dai'];
  steps.forEach((li, i) => {
    const a = li.querySelector('a.atlas-topic-step-title');
    ok(a, 'step ' + i + ' is a link');
    eq(a.href, 'concept.html?k=' + wantOrder[i], 'step ' + i + ' order/target');
  });
});
run('D3. unknown topic slug fails soft', () => {
  const { root, okR } = renderTopic('nope');
  ok(okR === false, 'reports failure');
  ok(root.textContent.indexOf('ไม่พบหัวข้อวิชา') !== -1, 'shows a not-found message');
});

// ================================================================ E. reverse lookups
run('E1. clustersForConcept("kammasit") -> ["sap-sitthi"]; a concept with no cluster -> []', () => {
  const hits = AtlasConceptClusters._internal.clustersForConcept('kammasit');
  eq(hits.map(h => h.slug), ['sap-sitthi']);
  eq(AtlasConceptClusters._internal.clustersForConcept('lamoed'), [], 'lamoed belongs to no cluster today');
});
run('E2. topicsForConcept("nee") -> ["nee"]; topicsForCluster("sap-sitthi") -> ["sap"]', () => {
  eq(AtlasTopics._internal.topicsForConcept('nee').map(h => h.slug), ['nee']);
  eq(AtlasTopics._internal.topicsForCluster('sap-sitthi').map(h => h.slug), ['sap']);
  eq(AtlasTopics._internal.topicsForConcept('kammasit'), [], 'kammasit is only reachable via its cluster, not directly listed in a topic path');
});

// ================================================================ F. upward nav on the Concept Entry (enhanceConceptPage)
run('F1. AtlasConceptClusters.enhanceConceptPage adds "อยู่ในกลุ่มแนวคิด" with a link to concept.html?g=sap-sitthi on kammasit', () => {
  const { root } = renderConcept('kammasit');
  const added = AtlasConceptClusters.enhanceConceptPage(root, 'kammasit');
  ok(added === true, 'enhancement applied');
  const heading = root.querySelectorAll('h2').find(h => h.textContent === 'อยู่ในกลุ่มแนวคิด');
  ok(heading, 'section heading present');
  const link = root.querySelectorAll('a').find(a => a.href === 'concept.html?g=sap-sitthi');
  ok(link, 'link to the cluster present');
});
run('F2. AtlasConceptClusters.enhanceConceptPage is a no-op (returns false) for a concept in no cluster', () => {
  const { root } = renderConcept('lamoed');
  const added = AtlasConceptClusters.enhanceConceptPage(root, 'lamoed');
  ok(added === false, 'no section added when nothing points here');
});
run('F3. AtlasTopics.enhanceConceptPage adds "อยู่ในหัวข้อวิชา" with a link to concept.html?t=nee on the nee concept', () => {
  const { root } = renderConcept('nee');
  const added = AtlasTopics.enhanceConceptPage(root, 'nee');
  ok(added === true, 'enhancement applied');
  const link = root.querySelectorAll('a').find(a => a.href === 'concept.html?t=nee');
  ok(link, 'link to the topic present');
});
run('F4. AtlasTopics.enhanceConceptPage is a no-op for a concept reachable only via a cluster (kammasit), never a fabricated indirect link', () => {
  const { root } = renderConcept('kammasit');
  const added = AtlasTopics.enhanceConceptPage(root, 'kammasit');
  ok(added === false, 'topic membership is NOT inferred through a cluster — direct membership only, no duplication with the cluster page\'s own topic link');
});

// ================================================================ G. Encyclopedia index (search / browse) distinguishes the 3 levels
run('G1. buildIndex tags each entry with the right entityKind (concept | cluster | topic), never collapsing the distinction', () => {
  const entries = AtlasEncyclopedia._internal.buildIndex(CONCEPT_DOC, CLUSTER_DOC, TOPIC_DOC);
  const byTerm = Object.create(null);
  entries.forEach(e => { (byTerm[e.term] = byTerm[e.term] || []).push(e); });
  ok((byTerm['กรรมสิทธิ์'] || []).some(e => e.entityKind === 'concept'), 'กรรมสิทธิ์ indexed as a concept term');
  ok((byTerm['ทรัพย์และทรัพยสิทธิ'] || []).some(e => e.entityKind === 'cluster'), 'ทรัพย์และทรัพยสิทธิ indexed as a cluster term');
  ok((byTerm['ทรัพย์'] || []).some(e => e.entityKind === 'topic'), 'ทรัพย์ indexed as (also) a topic term');
  ok((byTerm['ทรัพย์'] || []).some(e => e.entityKind === 'concept'), 'ทรัพย์ is ALSO still indexed as its own concept — the two coexist, distinguishable by entityKind, never merged into one row');
});
run('G2. entryUrl() routes each entityKind to its disjoint query param — never sends a cluster/topic hit to a bare ?k= concept URL', () => {
  const entries = AtlasEncyclopedia._internal.buildIndex(CONCEPT_DOC, CLUSTER_DOC, TOPIC_DOC);
  const cluster = entries.find(e => e.entityKind === 'cluster');
  const topic = entries.find(e => e.entityKind === 'topic');
  const concept = entries.find(e => e.entityKind === 'concept' && e.kind === 'primary');
  eq(AtlasEncyclopedia._internal.entryUrl(cluster), 'concept.html?g=' + cluster.slug);
  eq(AtlasEncyclopedia._internal.entryUrl(topic), 'concept.html?t=' + topic.slug);
  eq(AtlasEncyclopedia._internal.entryUrl(concept), 'concept.html?k=' + concept.slug);
});
run('G3. Encyclopedia degrades gracefully with no cluster/topic doc supplied (pre-existing concept-only behaviour is untouched)', () => {
  const entries = AtlasEncyclopedia._internal.buildIndex(CONCEPT_DOC, null, null);
  ok(entries.every(e => e.entityKind === 'concept'), 'every entry is a concept when no cluster/topic doc is passed');
  ok(entries.length > 0, 'concept entries still present');
});

// ================================================================ H. host-page routing contract (source-level, concept.html)
run('H. concept.html routes ?k= / ?g= / ?t= to three disjoint, mutually-exclusive views', () => {
  const src = fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8');
  ok(/var\s+slug\s*=\s*param\('k'\)/.test(src), "reads ?k=");
  ok(/var\s+clusterSlug\s*=\s*param\('g'\)/.test(src), "reads ?g=");
  ok(/var\s+topicSlug\s*=\s*param\('t'\)/.test(src), "reads ?t=");
  ok(/AtlasConceptClusters\.render\(root,\s*clusterSlug\)/.test(src), 'cluster view calls AtlasConceptClusters.render');
  ok(/AtlasTopics\.render\(root,\s*topicSlug\)/.test(src), 'topic view calls AtlasTopics.render');
  ok(/AtlasConcepts\.render\(root,\s*slug/.test(src), 'concept view still calls AtlasConcepts.render (unchanged)');
  const scriptOrder = ['atlas-concepts.js', 'atlas-concept-relations.js', 'atlas-concept-clusters.js', 'atlas-topics.js'];
  const idx = scriptOrder.map(s => src.indexOf(s));
  idx.forEach((v, i) => ok(v !== -1, s => s)); // presence
  for (let i = 1; i < idx.length; i++) ok(idx[i] > idx[i - 1], scriptOrder[i] + ' loads after ' + scriptOrder[i - 1]);
});

console.log('\n----------------------------------------');
console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
console.log('----------------------------------------');
process.exit(fail ? 1 : 0);
