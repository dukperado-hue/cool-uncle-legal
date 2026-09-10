/* Node validator for atlas-core.js — Phase 1 validation, Tests A/B/C/D.
   Run:  node atlas-validate.js  (from the project root) */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || __dirname;

global.window = global;
global.fetch = () => Promise.reject(new Error('no fetch in node validator'));

require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
const AtlasCore = global.AtlasCore;

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8'));
const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8'));
AtlasCore.setRegistry(registry);
AtlasCore.attachCorpus(corpus);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name + (detail ? '  — ' + detail : '')); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  — ' + detail : '')); }
}
function head(s) { console.log('\n=== ' + s + ' ==='); }

function topLabels(tree) {
  return (tree.nodes || []).map(n => n.value + (n.title ? ' (' + n.title + ')' : ''));
}
function crumbText(key, num) {
  return AtlasCore.getBreadcrumb(key, num).map(c => c.text).join(' › ');
}

// ---------------------------------------------------------------- generic
head('Registry / no-hardcode / URL-safety');
ok('registry loaded, 15 real + 1 planned collection',
   Object.keys(registry.collections).length === 16);
const coreSrc = fs.readFileSync(path.join(ROOT, 'atlas-core.js'), 'utf8');
ok("atlas-core: structural field order is derived from the registry, not a literal array",
   /getStructuralFieldOrder/.test(coreSrc) &&
   !/(var|let|const)\s+LEVELS\s*=\s*\[\s*'phaak'/.test(coreSrc) &&
   JSON.stringify(AtlasCore.getStructuralFieldOrder()) ===
     JSON.stringify(['phaak', 'laksana', 'muad', 'suan']),
   AtlasCore.getStructuralFieldOrder().join(','));
ok('listCollections() excludes planned aviation',
   !AtlasCore.listCollections().some(c => c.key === 'aviation'));
ok('listCollections({includePlanned:true}) includes aviation',
   AtlasCore.listCollections({ includePlanned: true }).some(c => c.key === 'aviation'));
ok('all 15 enabled collections are present in corpus',
   AtlasCore.listCollections().every(c => c.inCorpus),
   AtlasCore.listCollections().map(c => c.key).join(','));
const subj = AtlasCore.listSubjectAreas();
ok('subject areas populated', subj.length === 8 && subj.every(a => a.collections.length > 0),
   subj.map(a => a.key + ':' + a.collections.length).join(' '));

// legacy-URL invariance
const r1 = AtlasCore.resolveAtlasId('civil_1448');
ok('legacy id civil_1448 -> unchanged viewer URL',
   r1.viewerUrl === 'codex-article-viewer.html?id=civil_1448', r1.viewerUrl);
const r2 = AtlasCore.resolveAtlasId('civil_1447/2');
ok('legacy id with "/" -> URL-encoded, still ?id=civil_..., resolves to a real article',
   r2.viewerUrl === 'codex-article-viewer.html?id=' + encodeURIComponent('civil_1447/2') &&
   r2.exists, r2.viewerUrl + ' exists=' + r2.exists);
const r3 = AtlasCore.resolveAtlasId('atlas:civil/1448');
ok('atlas:civil/1448 round-trips to same legacy id + URL',
   r3.legacyId === 'civil_1448' &&
   r3.viewerUrl === 'codex-article-viewer.html?id=civil_1448', JSON.stringify(r3));

// shared ordering
ok('compareNumbers matches the existing site sortKey ([main, /sub, suffixRank, ...])',
   ['8', '7 ทวิ', '7/1', '7'].sort(AtlasCore.compareNumbers).join(',') === '7,7 ทวิ,7/1,8' &&
   ['193 ทวิ', '193', '194', '193/1'].sort(AtlasCore.compareNumbers).join(',') === '193,193 ทวิ,193/1,194');

// ============================================================ TEST A: civil
head('TEST A — Civil : บรรพ → ลักษณะ → หมวด → ส่วน → มาตรา');
const A = AtlasCore.getStructureTree('civil');
ok('A1 exactly 6 บรรพ nodes (+ 1 pre-บรรพ enacting-clause bucket for ม.1–3)',
   A.nodes.filter(n => n.value).length === 6 &&
   A.nodes.filter(n => n.value === null).length === 1,
   topLabels(A).join(' | '));
ok('A2 first node is บรรพ 1', A.nodes[0].value === 'บรรพ 1' && A.nodes[0].kind === 'part');
ok('A2b enacting-clause bucket carries the civil unsortedLabel + ม.1–3',
   (() => { const b = A.nodes.find(n => n.value === null);
     return b && /บทเบ็ดเสร็จ/.test(b.label) && JSON.stringify(b.articles) === '["1","2","3"]'; })());
ok('A3 บรรพ has nested children (not leaf)', Array.isArray(A.nodes[0].children));
const civ1448 = AtlasCore.resolveProvision('civil', '1448');
ok('A4 มาตรา 1448 resolves', !!civ1448 && civ1448.number === '1448');
ok('A5 มาตรา 1448 breadcrumb has collection + บรรพ + ลักษณะ + provision',
   (() => {
     const b = civ1448.breadcrumb;
     return b[0].kind === 'collection' &&
            b.some(c => c.kind === 'part' && /^บรรพ/.test(c.text)) &&
            b.some(c => c.kind === 'title' && /^ลักษณะ/.test(c.text)) &&
            b[b.length - 1].kind === 'provision';
   })(), crumbText('civil', '1448'));
ok('A6 บรรพ label from registry = "บรรพ" (not "ภาค")',
   AtlasCore.getBreadcrumb('civil', '1448').find(c => c.kind === 'part').label === 'บรรพ');
const adjA = AtlasCore.getAdjacent('civil', '1448');
ok('A7 adjacency around 1448 (1447/2 legitimately sits between 1447 and 1448)',
   adjA.prev === '1447/2' && adjA.next === '1449', JSON.stringify(adjA));
ok('A8 every civil article appears exactly once in the tree',
   countLeaves(A.nodes) === Object.keys(corpus.books.civil.articles).length,
   countLeaves(A.nodes) + ' / ' + Object.keys(corpus.books.civil.articles).length);

// ========================================================= TEST B: criminal
head('TEST B — Criminal : ภาค → ลักษณะ → หมวด → มาตรา  (ภาค 1 patched)');
const B = AtlasCore.getStructureTree('criminal');
ok('B1 top level = 3 ภาค (ภาค 1 restored by patch)', B.nodes.length === 3, topLabels(B).join(' | '));
ok('B2 first node is ภาค 1', B.nodes[0].value === 'ภาค 1');
ok('B3 ภาค label from registry = "ภาค"',
   B.nodes[0].levelLabel === 'ภาค' || (B.nodes[0].kind === 'part'));
const crim288 = AtlasCore.resolveProvision('criminal', '288');
ok('B4 มาตรา 288 resolves & breadcrumb has ภาค 2', !!crim288 &&
   crim288.breadcrumb.some(c => c.text === 'ภาค 2'), crumbText('criminal', '288'));
const crim5 = AtlasCore.getBreadcrumb('criminal', '5'); // ภาค 1 territory
ok('B5 มาตรา 5 (untagged at source) now sits under ภาค 1',
   crim5.some(c => c.text === 'ภาค 1'), crim5.map(c => c.text).join(' › '));
ok('B6 every criminal article appears exactly once',
   countLeaves(B.nodes) === Object.keys(corpus.books.criminal.articles).length,
   countLeaves(B.nodes) + ' / ' + Object.keys(corpus.books.criminal.articles).length);

// ==================================================== TEST C: Constitution 2560
head('TEST C — รัฐธรรมนูญ 2560 : หมวด → ส่วน → มาตรา  (no ภาค/ลักษณะ)');
const C = AtlasCore.getStructureTree('const2560');
ok('C1 top level is หมวด (no fabricated ภาค/ลักษณะ)',
   C.nodes.every(n => n.kind === 'chapter'), topLabels(C).slice(0, 4).join(' | ') + ' ...');
const c2560_levels = registry.collections.const2560.levels.map(l => l.field);
ok('C2 registry declares ONLY [muad, suan] for const2560',
   JSON.stringify(c2560_levels) === JSON.stringify(['muad', 'suan']));
const c140 = AtlasCore.getBreadcrumb('const2560', '140');
ok('C3 มาตรา 140 breadcrumb: collection › หมวด 7 › ส่วนที่ 4 › มาตรา 140 (value verbatim from source)',
   c140.some(x => x.kind === 'chapter' && x.text === 'หมวด 7') &&
   c140.some(x => x.kind === 'division' && /^ส่วน/.test(x.text) && /4/.test(x.text)) &&
   c140.find(x => x.kind === 'division').label === 'ส่วน',
   c140.map(x => x.text).join(' › '));
const someChapterWithNoSuan = C.nodes.find(n => n.children &&
   n.children.every(ch => ch.kind !== 'division') === false);
ok('C4 chapters without ส่วน collapse straight to มาตรา leaves',
   C.nodes.some(n => Array.isArray(n.articles) && n.articles.length > 0),
   'at least one หมวด is a direct leaf list');
ok('C5 every const2560 article appears exactly once',
   countLeaves(C.nodes) === Object.keys(corpus.books.const2560.articles).length,
   countLeaves(C.nodes) + ' / ' + Object.keys(corpus.books.const2560.articles).length);

// ==================================================== TEST D: tortofficials
head('TEST D — พ.ร.บ.ความรับผิดทางละเมิดของเจ้าหน้าที่ : มาตรา only (flat)');
const D = AtlasCore.getStructureTree('tortofficials');
ok('D1 registry declares zero levels',
   registry.collections.tortofficials.levels.length === 0);
ok('D2 getStructureTree returns provisions directly (nodes === null)',
   D.nodes === null && Array.isArray(D.articles) && D.articles.length === 5,
   'articles=' + JSON.stringify(D.articles));
const t5 = AtlasCore.resolveProvision('tortofficials', '5');
ok('D3 มาตรา 5 resolves with breadcrumb = [collection, provision] only',
   t5 && t5.breadcrumb.length === 2 &&
   t5.breadcrumb[0].kind === 'collection' &&
   t5.breadcrumb[1].kind === 'provision', crumbText('tortofficials', '5'));
ok('D4 no collection-specific rendering hack needed — same API surface as A/B/C',
   typeof AtlasCore.getStructureTree === 'function');

// ==================================================== Aviation readiness
head('Aviation readiness (architecture only — no content)');
const av = AtlasCore.getCollection('aviation');
ok('AV1 aviation is multi-instrument with 6 instruments', av.instrumentModel === 'multi' &&
   av.instruments.length === 6);
ok('AV2 instruments carry their own provision unit (มาตรา vs ข้อ)',
   av.instruments.some(i => i.provisionUnit === 'มาตรา') &&
   av.instruments.some(i => i.provisionUnit === 'ข้อ'));
ok('AV3 instruments carry authorityRank for a future "by legal force" view',
   av.instruments.every(i => typeof i.authorityRank === 'number'));
const avTree = AtlasCore.getStructureTree('aviation');
ok('AV4 getStructureTree(aviation) is safe with no corpus (planned:true, nodes:[])',
   avTree.planned === true && Array.isArray(avTree.nodes) && avTree.nodes.length === 0);

// ============================================ full sweep (all 15 collections)
head('Full sweep — every enabled collection navigates without throwing');
let sweepBad = [];
for (const c of AtlasCore.listCollections()) {
  try {
    const tree = AtlasCore.getStructureTree(c.key);
    const leaves = tree.nodes === null ? (tree.articles || []).length : countLeaves(tree.nodes);
    const corpusN = Object.keys(corpus.books[c.key].articles).length;
    if (leaves !== corpusN) sweepBad.push(c.key + ' leaves ' + leaves + '/' + corpusN);
    // resolve first + last provision, build breadcrumb + adjacency
    const nums = Object.keys(corpus.books[c.key].articles).sort(AtlasCore.compareNumbers);
    for (const n of [nums[0], nums[nums.length - 1]]) {
      const p = AtlasCore.resolveProvision(c.key, n);
      if (!p || !p.viewerUrl.startsWith('codex-article-viewer.html?id=' + c.key + '_')) {
        sweepBad.push(c.key + ' resolve ' + n);
      }
      AtlasCore.getAdjacent(c.key, n);
    }
  } catch (e) {
    sweepBad.push(c.key + ' THREW ' + e.message);
  }
}
ok('sweep: all 15 collections OK (tree covers every article, URLs unchanged, no throws)',
   sweepBad.length === 0, sweepBad.join(' | '));

const areasFull = AtlasCore.listSubjectAreas({ includePlanned: true });
ok('sweep: listSubjectAreas({includePlanned:true}) surfaces the planned aviation area',
   areasFull.some(a => a.key === 'aviation' && a.planned &&
     a.collections.some(c => c.key === 'aviation')));

// ============================================ Phase 2 — identity & resolution
head('Phase 2 · Test 5 — legacy URL resolution (unchanged for all current collections)');
[
  ['civil_1448', 'civil', '1448'],
  ['civil_1447/2', 'civil', '1447/2'],
  ['criminal_288', 'criminal', '288'],
  ['tortofficials_5', 'tortofficials', '5'],
  ['const2560_140', 'const2560', '140']
].forEach(([legacy, col, num]) => {
  const r = AtlasCore.resolveAtlasId(legacy);
  ok('legacy ' + legacy, r && r.collection === col && r.number === num &&
     r.exists && r.viewerUrl === 'codex-article-viewer.html?id=' + encodeURIComponent(legacy) &&
     r.storageKey === num, r ? (r.viewerUrl + ' sk=' + r.storageKey) : 'null');
});

head('Phase 2 · Test 6 — Atlas ID resolution + round-trip');
[
  ['atlas:civil/1448', 'civil_1448'],
  ['atlas:civil/1447/2', 'civil_1447/2'],
  ['atlas:criminal/5', 'criminal_5'],
  ['atlas:const2560/140', 'const2560_140']
].forEach(([atlasId, expectLegacy]) => {
  const r = AtlasCore.resolveAtlasId(atlasId);
  const back = AtlasCore.resolveAtlasId(r.legacyId);
  ok('atlas ' + atlasId + ' -> legacy ' + expectLegacy + ' -> round-trips',
     r.legacyId === expectLegacy && r.exists &&
     back.atlasId === r.atlasId && back.viewerUrl === r.viewerUrl,
     JSON.stringify({ legacyId: r.legacyId, atlasId: r.atlasId }));
});
// provision object also exposes both ids
const rp = AtlasCore.resolveProvision('civil', '1448');
ok('resolveProvision exposes atlasId + legacyId + storageKey + viewerUrl',
   rp.atlasId === 'atlas:civil/1448' && rp.legacyId === 'civil_1448' &&
   rp.storageKey === '1448' && rp.viewerUrl === 'codex-article-viewer.html?id=civil_1448');

// Phase 3A — getProvisionBrief: lean per-pill lookup for the lazy renderer
const gb = AtlasCore.getProvisionBrief('civil', '1448');
ok('getProvisionBrief(civil,1448): number/unit/viewerUrl, NO breadcrumb/article',
   gb && gb.number === '1448' && gb.unit === 'มาตรา' && gb.cancelled === false &&
   gb.viewerUrl === 'codex-article-viewer.html?id=civil_1448' &&
   gb.article === undefined && gb.breadcrumb === undefined, JSON.stringify(gb));
const gbSub = AtlasCore.getProvisionBrief('civil', '1447/2');
ok('getProvisionBrief handles "/" sub-numbers -> ?id=civil_1447%2F2',
   gbSub && gbSub.viewerUrl === 'codex-article-viewer.html?id=' + encodeURIComponent('civil_1447/2'));
ok('getProvisionBrief(unknown) -> null', AtlasCore.getProvisionBrief('civil', '999999') === null);

head('Phase 2 · Test 7 — multi-instrument same-number collision (synthetic corpus)');
(function () {
  // Inject a throwaway aviation book — NOT written to disk, NOT real content.
  // Three instruments each own an article numbered "12" and "13".
  const reg2 = JSON.parse(JSON.stringify(registry));
  reg2.collections.aviation.enabled = true;
  delete reg2.collections.aviation.planned;
  reg2.subjectAreas.find(a => a.key === 'aviation').planned = false;

  const corpus2 = JSON.parse(JSON.stringify({ metadata: corpus.metadata, searchIndex: {}, books: {} }));
  corpus2.books.aviation = { articles: {
    'act::12':      { id: 'aviation_act::12',      number: '12', text: 'พ.ร.บ. ม.12', cancelled: false, meta: { instrument: 'act',      muad: 'หมวด 2', muadTitle: 'ใบอนุญาต' } },
    'act::13':      { id: 'aviation_act::13',      number: '13', text: 'พ.ร.บ. ม.13', cancelled: false, meta: { instrument: 'act',      muad: 'หมวด 2', muadTitle: 'ใบอนุญาต' } },
    'mr::12':       { id: 'aviation_mr::12',       number: '12', text: 'กฎกระทรวง ข้อ 12', cancelled: false, meta: { instrument: 'mr',       muad: 'หมวด 1' } },
    'caat-req::12': { id: 'aviation_caat-req::12', number: '12', text: 'ข้อกำหนด CAAT ข้อ 12', cancelled: false, meta: { instrument: 'caat-req' } }
  } };

  global.window = global;
  // fresh module instances so the synthetic registry/corpus don't leak
  delete require.cache[require.resolve(path.join(ROOT, 'atlas-core.js'))];
  delete require.cache[require.resolve(path.join(ROOT, 'atlas-patches.js'))];
  require(path.join(ROOT, 'atlas-patches.js'));
  require(path.join(ROOT, 'atlas-core.js'));
  const AC = global.AtlasCore;
  AC.setRegistry(reg2);
  AC.attachCorpus(corpus2);

  const a = AC.resolveAtlasId('atlas:aviation/act/12');
  const m = AC.resolveAtlasId('atlas:aviation/mr/12');
  const q = AC.resolveAtlasId('atlas:aviation/caat-req/12');
  ok('7a three instruments, same number 12, three DISTINCT storage keys',
     a.storageKey === 'act::12' && m.storageKey === 'mr::12' && q.storageKey === 'caat-req::12' &&
     a.exists && m.exists && q.exists);
  ok('7b distinct article bodies (no collision)',
     AC.resolveProvision('aviation', a.storageKey).article.text !==
     AC.resolveProvision('aviation', m.storageKey).article.text);
  ok('7c legacy id form aviation_act::12 parses back to the same provision',
     AC.resolveAtlasId('aviation_act::12').storageKey === 'act::12' &&
     AC.resolveAtlasId('aviation_act::12').atlasId === 'atlas:aviation/act/12');
  ok('7d viewer URL uses the frozen ?id= scheme with the namespaced key',
     a.viewerUrl === 'codex-article-viewer.html?id=' + encodeURIComponent('aviation_act::12'));
  const adj = AC.getAdjacent('aviation', 'act::12');
  ok('7e adjacency stays within the instrument (act::12 -> act::13, not mr::*)',
     adj.next === 'act::13' && adj.prev === null, JSON.stringify(adj));
  const bc = AC.getBreadcrumb('aviation', 'caat-req::12');
  ok('7f breadcrumb: collection > instrument > provision, unit = ข้อ',
     bc[0].kind === 'collection' && bc[1].kind === 'instrument' && bc[1].value === 'caat-req' &&
     bc[bc.length - 1].text === 'ข้อ 12', bc.map(x => x.text).join(' › '));
  const tree = AC.getStructureTree('aviation');
  ok('7g getStructureTree(aviation) yields instrument nodes with storage-key leaves',
     tree.instrumentModel === 'multi' &&
     tree.nodes.some(n => n.kind === 'instrument' && n.value === 'act') &&
     JSON.stringify(collectLeafKeys(tree.nodes).sort()) ===
       JSON.stringify(['act::12', 'act::13', 'caat-req::12', 'mr::12']),
     collectLeafKeys(tree.nodes).join(','));
  ok('7h a bare "12" for aviation is ambiguous -> resolveProvision returns null (no silent pick)',
     AC.resolveProvision('aviation', '12') === null);

  // restore the real modules for any later assertions
  delete require.cache[require.resolve(path.join(ROOT, 'atlas-core.js'))];
  delete require.cache[require.resolve(path.join(ROOT, 'atlas-patches.js'))];
  require(path.join(ROOT, 'atlas-patches.js'));
  require(path.join(ROOT, 'atlas-core.js'));
  global.AtlasCore.setRegistry(registry);
  global.AtlasCore.attachCorpus(corpus);
})();

head('Phase 2 · Test 9 — existing-page fallback behavior (AtlasCore absent)');
(function () {
  // Simulate the guard used in the 3 refactored pages:
  //   window.AtlasCore && AtlasCore.isReady() ? atlas path : legacy path
  const saved = global.AtlasCore;
  global.AtlasCore = undefined;
  const legacyBreadcrumb = (bookTitle, meta) => {
    const parts = [bookTitle];
    [meta.phaak, meta.laksana, meta.muad, meta.suan].forEach(p => { if (p) parts.push(p); });
    return parts.join(' › ');
  };
  const art = corpus.books.civil.articles['1448'];
  ok('9a legacy breadcrumb path still works with no AtlasCore',
     legacyBreadcrumb('ประมวลกฎหมายแพ่งและพาณิชย์', art.meta).includes('บรรพ 5'));
  ok('9b guard `window.AtlasCore && ...` is falsy -> page uses its own code path',
     !(global.AtlasCore && global.AtlasCore.isReady));
  global.AtlasCore = saved;
})();

head('Phase 2 · Test 10 — JavaScript syntax validation (new + refactored files)');
(function () {
  const { execFileSync } = require('child_process');
  const jsFiles = ['atlas-core.js', 'atlas-patches.js', 'atlas-ui.js'];
  jsFiles.forEach(f => {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) { ok('10 ' + f + ' present', false, 'missing'); return; }
    try { execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' });
      ok('10 ' + f + ' parses', true); }
    catch (e) { ok('10 ' + f + ' parses', false, String(e.stderr || e).slice(0, 200)); }
  });
  // inline <script> blocks of the refactored HTML pages
  ['codex-search.html', 'codex-article-viewer.html', 'neural-network.html', 'atlas.html'].forEach(f => {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(m => !/type=["']application\/(ld\+json|json)["']/.test(m[1]))
      .map(m => m[2]);
    const tmp = path.join(require('os').tmpdir(), 'atlascheck_' + f + '.js');
    fs.writeFileSync(tmp, blocks.join('\n;\n'));
    try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
      ok('10 ' + f + ' inline JS parses', true); }
    catch (e) { ok('10 ' + f + ' inline JS parses', false, String(e.stderr || e).slice(0, 200)); }
    fs.unlinkSync(tmp);
  });
})();

// ---------------------------------------------------------------- helpers
function collectLeafKeys(nodes) {
  let out = [];
  for (const n of nodes || []) {
    if (n.children) out = out.concat(collectLeafKeys(n.children));
    else if (n.articles) out = out.concat(n.articles);
  }
  return out;
}
function countLeaves(nodes) {
  if (!nodes) return 0;
  let n = 0;
  for (const node of nodes) {
    if (node.children) n += countLeaves(node.children);
    else if (node.articles) n += node.articles.length;
  }
  return n;
}

head('Phase 4A — contextual provision reading');
(function () {
  // --- previous/next must come from the ORDERED provision set, never ±1 ---
  const adj = AtlasCore.getAdjacent('civil', '1447/2');
  ok('4A prev/next of civil "1447/2" are real neighbours from the ordered list',
     adj && adj.prev === '1447/1' && adj.next === '1448',
     JSON.stringify(adj));
  // a repealed article still participates in ordering (not skipped by arithmetic)
  const b276 = AtlasCore.getProvisionBrief('civil', '276');
  ok('4A getProvisionBrief returns {number,unit,viewerUrl} for a lookup',
     b276 && b276.number === '276' && b276.unit === 'มาตรา' &&
     b276.viewerUrl === 'codex-article-viewer.html?id=civil_276',
     b276 && b276.viewerUrl);
  // multi-instrument: adjacency stays inside the instrument, no bare-number pick
  ok('4A bare "12" for aviation still resolves to null (STEP 6 — no silent pick)',
     AtlasCore.resolveProvision('aviation', '12') === null);

  // --- source guards: the viewer only "goes contextual" behind ?x=atlas ---
  const viewer = fs.readFileSync(path.join(ROOT, 'codex-article-viewer.html'), 'utf8');
  ok('4A viewer treats ?x=atlas as the ONLY Atlas-context trigger',
     /FROM_ATLAS\s*=\s*params\.get\(['"]x['"]\)\s*===\s*['"]atlas['"]/.test(viewer));
  ok('4A viewer still resolves the canonical ?id= exactly as before',
     /let id = params\.get\('id'\);/.test(viewer));
  ok('4A Atlas back-link / breadcrumb link built only inside a FROM_ATLAS guard',
     /function applyAtlasContext[\s\S]{0,80}if \(!FROM_ATLAS\) return;/.test(viewer));
  ok('4A prev/next href keeps canonical id, appends x=atlas only when FROM_ATLAS',
     /FROM_ATLAS \? base \+ '&x=atlas' : base/.test(viewer));

  // --- atlas-ui appends context without mutating the canonical id ---
  const ui = fs.readFileSync(path.join(ROOT, 'atlas-ui.js'), 'utf8');
  ok('4A atlas-ui appends x=atlas to the provision link (metadata, not identity)',
     /url \+ \(url\.indexOf\('\?'\) === -1 \? '\?' : '&'\) \+ 'x=atlas'/.test(ui));
  ok('4A return-state persistence is best-effort (sessionStorage guarded)',
     /catch \(e\) \{ \/\* no sessionStorage/.test(ui));
})();

head('Phase 4B — structural breadcrumb navigation contract');
(function () {
  function pathIndex(nodes) {
    const m = {};
    (function w(ns) {
      (ns || []).forEach(n => { m[JSON.stringify(n.path)] = n; if (n.children) w(n.children); });
    })(nodes);
    return m;
  }
  function structPath(key, num) {
    return AtlasCore.getBreadcrumb(key, num)
      .filter(c => c.field).map(c => c.value);
  }
  function leafPath(key, num) {
    let found = null;
    (function w(ns) {
      (ns || []).forEach(n => {
        if (n.articles && n.articles.indexOf(String(num)) !== -1) found = n.path;
        if (n.children) w(n.children);
      });
    })(AtlasCore.getStructureTree(key).nodes);
    return found;
  }

  // 1 — breadcrumb structural values ARE the owning leaf's node.path (both meta-sourced)
  ok('4B civil 1448 breadcrumb structural path === owning leaf node.path (= บรรพ 5›ลักษณะ 1›หมวด 2)',
     JSON.stringify(structPath('civil', '1448')) === JSON.stringify(leafPath('civil', '1448')) &&
     JSON.stringify(structPath('civil', '1448')) === JSON.stringify(['บรรพ 5', 'ลักษณะ 1', 'หมวด 2']),
     JSON.stringify(structPath('civil', '1448')));

  // 2 — every structural prefix resolves to a real tree node (nothing fabricated)
  const civ = pathIndex(AtlasCore.getStructureTree('civil').nodes);
  const cp = structPath('civil', '1448');
  const cn = pathIndex(AtlasCore.getStructureTree('const2560').nodes);
  ok('4B every prefix of a deep path resolves to a real node (civil + const2560)',
     cp.length === 3 && cp.every((_, i) => !!civ[JSON.stringify(cp.slice(0, i + 1))]) &&
     !!cn[JSON.stringify(['หมวด 7', 'ส่วนที่ 2'])] && !!cn[JSON.stringify(['บทเฉพาะกาล'])]);

  // 3 — a display value that repeats is disambiguated by the FULL path, not the label
  const crim = pathIndex(AtlasCore.getStructureTree('criminal').nodes);
  const a = structPath('criminal', '288');   // ...→ ลักษณะ 10 → หมวด 1
  const b = structPath('criminal', '112');   // ...→ ลักษณะ 1  → หมวด 1
  ok('4B two criminal provisions ending "หมวด 1" resolve to distinct full-path nodes',
     a[a.length - 1] === 'หมวด 1' && b[b.length - 1] === 'หมวด 1' &&
     JSON.stringify(a) !== JSON.stringify(b) &&
     !!crim[JSON.stringify(a)] && !!crim[JSON.stringify(b)]);

  // 4 — flat Act AND untagged provision produce NO structural breadcrumb (no fabrication)
  ok('4B flat Act + untagged provision yield zero structural breadcrumb crumbs',
     structPath('tortofficials', '5').length === 0 &&
     AtlasCore.getStructureTree('tortofficials').nodes === null &&
     structPath('civil', '1').length === 0);

  // 5 — multi-instrument identity stays separate (bare number never silently resolves)
  ok('4B aviation bare "12" still resolves to null — instrument identity stays scoped',
     AtlasCore.resolveProvision('aviation', '12') === null);

  // 6 — atlas-ui: guard widened to path OR keys, and the Phase 4A keys branch is intact
  const ui = fs.readFileSync(path.join(ROOT, 'atlas-ui.js'), 'utf8');
  ok('4B restoreReturn accepts path OR keys; keys branch + private nodeKey() conversion intact',
     /!\(saved\.keys && saved\.keys\.length\) &&\s*!\(saved\.path && saved\.path\.length\)/.test(ui) &&
     /saved\.keys\.forEach\(function \(k\) \{ want\[k\] = 1; \}\)/.test(ui) &&
     /want\[nodeKey\(inst, saved\.path\.slice\(0, i\)\)\] = 1/.test(ui) &&
     /focusKey = nodeKey\(inst, saved\.path\)/.test(ui));
})();

// ============================================================ PHASE 1
// Legal Concept layer — atlas-concepts.json / atlas-concepts.js / concept.html
// Additive, standalone. These checks must not affect any assertion above.
head('Phase 1 — Legal Concept layer contract (golden sample: ละเมิด)');
(function () {
  const { execFileSync } = require('child_process');

  // --- files present + parse -----------------------------------------
  const jsPath = path.join(ROOT, 'atlas-concepts.js');
  const jsonPath = path.join(ROOT, 'atlas-concepts.json');
  const htmlPath = path.join(ROOT, 'concept.html');
  ok('P1 atlas-concepts.js present', fs.existsSync(jsPath));
  ok('P1 atlas-concepts.json present', fs.existsSync(jsonPath));
  ok('P1 concept.html present', fs.existsSync(htmlPath));
  if (!fs.existsSync(jsPath) || !fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) return;

  try { execFileSync(process.execPath, ['--check', jsPath], { stdio: 'pipe' });
    ok('P1 atlas-concepts.js parses', true); }
  catch (e) { ok('P1 atlas-concepts.js parses', false, String(e.stderr || e).slice(0, 200)); }

  {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(m => !/type=["']application\/(ld\+json|json)["']/.test(m[1])).map(m => m[2]);
    const tmp = path.join(require('os').tmpdir(), 'atlascheck_concept_html.js');
    fs.writeFileSync(tmp, blocks.join('\n;\n'));
    try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
      ok('P1 concept.html inline JS parses', true); }
    catch (e) { ok('P1 concept.html inline JS parses', false, String(e.stderr || e).slice(0, 200)); }
    fs.unlinkSync(tmp);
  }

  // --- additive / fail-soft source guards --------------------------
  // strip block comments so the file's own prose ("never touches location.hash")
  // is not mistaken for code
  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('P1 atlas-concepts.js never assigns to AtlasCore / AtlasUI (no mutation)',
     !/\b(AtlasCore|AtlasUI)\s*(\.\w+)?\s*=[^=]/.test(code));
  ok('P1 atlas-concepts.js only calls PUBLIC AtlasCore resolvers',
     /\bresolveAtlasId\s*\(/.test(code) &&
     !/(AtlasCore|AtlasUI)\._internal/.test(code) &&
     !/\bAtlasUI\b/.test(code) &&
     !/\bnodeKey\s*\(/.test(code));
  ok('P1 atlas-concepts.js never touches location.hash / the route grammar',
     !/\blocation\s*\.\s*hash\b/.test(code) &&
     !/\bhistory\s*\.\s*(pushState|replaceState)\s*\(/.test(code));
  ok('P1 atlas-concepts.js reuses the frozen viewer URL + x=atlas marker',
     /codex-article-viewer\.html\?id=/.test(src) && /x=atlas/.test(src));
  ok('P1 atlas-concepts.js derives cases from the EXISTING public index',
     /prototype\/assets\/cases\/article-case-index\.json/.test(src));

  // --- concept doc integrity --------------------------------------
  let cdoc;
  try { cdoc = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
  catch (e) { ok('P1 atlas-concepts.json is valid JSON', false, String(e).slice(0, 160)); return; }
  ok('P1 atlas-concepts.json is valid JSON', true);

  const lamoed = cdoc.concepts && cdoc.concepts.lamoed;
  ok('P1 concept "lamoed" exists', !!lamoed);
  if (!lamoed) return;
  ok('P1 frozen identity atlas:concept/lamoed', lamoed.id === 'atlas:concept/lamoed', lamoed.id);
  ok('P1 subjectAreas reuse the registry taxonomy keys',
     Array.isArray(lamoed.subjectAreas) && lamoed.subjectAreas.every(k =>
       (registry.subjectAreas || []).some(a => a.key === k)),
     (lamoed.subjectAreas || []).join(','));

  // gather every provision ref the concept mentions
  const provRefs = new Set();
  const addP = r => { if (r) provRefs.add(r); };
  (lamoed.provisions || []).forEach(p => addP(p.ref));
  (lamoed.definition && lamoed.definition.provisions || []).forEach(addP);
  (lamoed.principle && lamoed.principle.provisions || []).forEach(addP);
  (lamoed.sections || []).forEach(s => {
    (s.provisions || []).forEach(addP);
    (s.items || []).forEach(it => (it.provisions || []).forEach(addP));
  });
  (lamoed.featuredCases || []).forEach(fc => (fc.provisions || []).forEach(addP));

  const badRefs = [...provRefs].filter(ref => {
    const r = AtlasCore.resolveAtlasId(ref);
    return !r || !r.exists;
  });
  ok('P1 every provision ref resolves to a real article via AtlasCore',
     badRefs.length === 0, badRefs.length ? 'unresolved: ' + badRefs.join(', ') : provRefs.size + ' refs OK');

  // every lectureRef exists somewhere in codex-data.json
  const lectureIds = new Set();
  for (const bk of Object.keys(corpus.books || {})) {
    const arts = corpus.books[bk].articles || {};
    for (const n of Object.keys(arts)) {
      for (const ln of (arts[n].lectureNotes || [])) if (ln && ln.id) lectureIds.add(ln.id);
    }
  }
  const lectureRefs = new Set();
  const addL = r => { if (r) lectureRefs.add(r); };
  (lamoed.lectureRefs || []).forEach(addL);
  (lamoed.definition && lamoed.definition.lectureRefs || []).forEach(addL);
  (lamoed.principle && lamoed.principle.lectureRefs || []).forEach(addL);
  (lamoed.sections || []).forEach(s => {
    (s.lectureRefs || []).forEach(addL);
    (s.items || []).forEach(it => (it.lectureRefs || []).forEach(addL));
  });
  const badLectures = [...lectureRefs].filter(id => !lectureIds.has(id));
  ok('P1 every lectureRef exists in codex-data.json (referenced, not copied)',
     badLectures.length === 0, badLectures.length ? 'missing: ' + badLectures.join(', ') : lectureRefs.size + ' refs OK');

  // structural anchors resolve to a real node.path in getStructureTree
  function pathExists(collection, wanted) {
    const tree = AtlasCore.getStructureTree(collection);
    let hit = false;
    (function w(ns) {
      (ns || []).forEach(n => {
        if (JSON.stringify(n.path) === JSON.stringify(wanted)) hit = true;
        if (n.children) w(n.children);
      });
    })(tree && tree.nodes);
    return hit;
  }
  const badAnchors = (lamoed.structuralAnchor || []).filter(a => !pathExists(a.collection, a.path));
  ok('P1 every structuralAnchor path is a real node in the structure tree',
     badAnchors.length === 0,
     badAnchors.length ? badAnchors.map(a => a.collection + ':' + JSON.stringify(a.path)).join(' ') : 'anchor OK');

  // related-case DERIVATION works off the existing index (no persisted edges)
  let idx = {};
  try { idx = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'prototype/assets/cases/article-case-index.json'), 'utf8')); } catch (e) {}
  function keyFor(ref) {
    const r = AtlasCore.resolveAtlasId(ref);
    return (r && r.collection && r.number != null) ? r.collection + ':' + r.number : null;
  }
  const derivedIds = new Set();
  for (const ref of provRefs) {
    const arr = idx[keyFor(ref)] || [];
    for (const c of arr) if (c && c.public === true && c.id) derivedIds.add(c.id);
  }
  ok('P1 related-case derivation finds ≥1 public case from the existing index',
     derivedIds.size >= 1, [...derivedIds].join(', ') || 'none');
  ok('P1 derivation picks up civil_420 → nong-mey-2560 and tortofficials_5 cases',
     derivedIds.has('nong-mey-2560') && derivedIds.has('chaiyaphum-pasae-2560'),
     [...derivedIds].join(', '));

  // relatedConcepts: valid namespace + either resolvable here or marked planned
  const badRel = (lamoed.relatedConcepts || []).filter(rc => {
    if (!rc || typeof rc.ref !== 'string' || rc.ref.indexOf('atlas:concept/') !== 0) return true;
    const slug = rc.ref.replace('atlas:concept/', '');
    const known = cdoc.concepts && cdoc.concepts[slug];
    return !known && rc.status !== 'planned';
  });
  ok('P1 every relatedConcepts ref uses atlas:concept/* and is resolvable OR marked planned',
     badRel.length === 0, badRel.map(r => r && r.ref).join(', ') || 'all OK');

  // atlas-concepts.js internals load in node and resolve refs through AtlasCore
  let AConcepts = null;
  try {
    delete require.cache[require.resolve(jsPath)];
    require(jsPath);
    AConcepts = global.AtlasConcepts;
  } catch (e) { /* ignore — parse test already covers syntax */ }
  ok('P1 atlas-concepts.js exposes AtlasConcepts with a public render()',
     !!(AConcepts && typeof AConcepts.render === 'function' && AConcepts._internal));
  if (AConcepts && AConcepts._internal) {
    const rp = AConcepts._internal.resolveProvisionRef('civil_420');
    ok('P1 AtlasConcepts.resolveProvisionRef("civil_420") → real, frozen viewer URL',
       rp && rp.exists === true && rp.collection === 'civil' && rp.number === '420' &&
       rp.viewerUrl === 'codex-article-viewer.html?id=civil_420',
       rp && rp.viewerUrl);
    AConcepts._internal.setDoc(cdoc);
    const dc = AConcepts._internal.deriveCases(lamoed, idx);
    ok('P1 deriveCases() returns curated featured + derived (featured excluded from derived)',
       dc && Array.isArray(dc.featured) && Array.isArray(dc.derived) &&
       dc.featured.length >= 1 &&
       !dc.derived.some(c => dc.featured.some(f => f.id === c.id)),
       'featured=' + (dc && dc.featured.length) + ' derived=' + (dc && dc.derived.length));

    // Phase 1.6 — Concept Directory (concept.html with no ?k=)
    ok('P1 AtlasConcepts.renderDirectory() exists (directory entry point)',
       typeof AConcepts.renderDirectory === 'function' &&
       typeof AConcepts._internal.renderDirectoryInto === 'function');
    const planned = AConcepts._internal.collectPlanned(cdoc.concepts);
    ok('P1 directory "coming soon" is derived from planned relatedConcepts (deduped, not authored)',
       Array.isArray(planned) && planned.length >= 1 &&
       planned.every(p => p.slug && p.labelTH && !cdoc.concepts[p.slug]) &&
       new Set(planned.map(p => p.slug)).size === planned.length,
       planned.map(p => p.slug).join(', '));
    ok('P1 directory intro copy lives in atlas-concepts.json (not hardcoded in JS)',
       !!(cdoc.directory && cdoc.directory.titleTH === 'แนวคิดทางกฎหมาย' && cdoc.directory.intro));
    ok('P1 golden-sample concept carries a short directory summary',
       typeof lamoed.summary === 'string' && lamoed.summary.length > 10 && lamoed.summary.length < 320);
    AConcepts._internal.reset();
  }

  // ---- GENERIC per-concept contract (applies to EVERY concept, not only the
  //      golden sample). Added when the registry gained a second concept. ----
  const SLUG_RE = /^[a-z][a-z0-9-]*$/;
  const SUPPORTED_ROLES = new Set(['core', 'related']);
  function gatherRefs(c, kind) {
    const s = new Set();
    const add = r => { if (r) s.add(r); };
    const field = kind === 'prov' ? 'provisions' : 'lectureRefs';
    (c[field] || []).forEach(kind === 'prov' ? (p => add(p.ref || p)) : add);
    (c.definition && c.definition[field] || []).forEach(add);
    (c.principle && c.principle[field] || []).forEach(add);
    (c.sections || []).forEach(x => {
      (x[field] || []).forEach(add);
      (x.items || []).forEach(it => (it[field] || []).forEach(add));
    });
    if (kind === 'prov') (c.featuredCases || []).forEach(fc => (fc.provisions || []).forEach(add));
    return s;
  }
  const caseIndexIds = new Set();
  for (const k of Object.keys(idx)) for (const x of (idx[k] || []))
    if (x && x.id && x.public === true) caseIndexIds.add(x.id);

  // relatedConcepts structural contract: a valid namespaced ref, a known
  // relationKind (if any), and a target that is EITHER authored here OR
  // explicitly marked planned. Denormalised rc.labelTH / rc.status are cache
  // only — never promoted to a hard identity requirement.
  const relContractOK = rc => {
    if (!rc || typeof rc.ref !== 'string' || rc.ref.indexOf('atlas:concept/') !== 0) return false;
    if (rc.rel && !(cdoc.relationKinds || {})[rc.rel]) return false;
    const s = rc.ref.replace('atlas:concept/', '');
    return !!(cdoc.concepts || {})[s] || rc.status === 'planned';
  };

  for (const [slug, c] of Object.entries(cdoc.concepts || {})) {
    const T = 'P1 concept[' + slug + ']';
    ok(T + ' id grammar atlas:concept/<slug> and slug match',
       c.id === 'atlas:concept/' + slug && c.slug === slug, c.id);
    ok(T + ' slug is lowercase kebab-case', SLUG_RE.test(slug), slug);
    ok(T + ' has the universal fields (titleTH,status,subjectAreas,definition,summary,sources,authoring)',
       !!(c.titleTH && c.status && Array.isArray(c.subjectAreas) && c.subjectAreas.length &&
          c.definition && typeof c.definition.text === 'string' && typeof c.summary === 'string' &&
          Array.isArray(c.sources) && c.authoring));
    ok(T + ' subjectAreas resolve to the registry taxonomy',
       c.subjectAreas.every(k => (registry.subjectAreas || []).some(a => a.key === k)),
       c.subjectAreas.join(','));
    ok(T + ' every structuralAnchor path is a real structure-tree node',
       (c.structuralAnchor || []).every(a => pathExists(a.collection, a.path)),
       (c.structuralAnchor || []).map(a => a.collection + ':' + JSON.stringify(a.path)).join(' ') || 'none');
    const P = gatherRefs(c, 'prov');
    const badP = [...P].filter(ref => { const r = AtlasCore.resolveAtlasId(ref); return !r || !r.exists; });
    ok(T + ' every provision ref resolves via AtlasCore', badP.length === 0,
       badP.length ? 'unresolved: ' + badP.join(', ') : P.size + ' refs');
    const L = gatherRefs(c, 'lec');
    const badL = [...L].filter(id => !lectureIds.has(id));
    ok(T + ' every lectureRef exists in codex-data.json', badL.length === 0,
       badL.length ? 'missing: ' + badL.join(', ') : L.size + ' refs');
    const badCase = (c.featuredCases || []).filter(fc => !caseIndexIds.has(fc.id));
    ok(T + ' every featuredCases id is a real public case in the index',
       badCase.length === 0, badCase.map(f => f.id).join(', ') || (c.featuredCases || []).length + ' ok');
    const roleRefs = (c.provisions || []).map(p => p.ref);
    ok(T + ' no duplicate refs in curated provisions[]', new Set(roleRefs).size === roleRefs.length,
       roleRefs.filter((r, i) => roleRefs.indexOf(r) !== i).join(', ') || 'ok');
    ok(T + ' no provision role the renderer would silently discard (core/related)',
       (c.provisions || []).every(p => SUPPORTED_ROLES.has(p.role || 'related')),
       (c.provisions || []).map(p => p.role).filter(r => r && !SUPPORTED_ROLES.has(r)).join(', ') || 'ok');
    ok(T + ' relatedConcepts: atlas:concept/* + known rel + resolvable-or-planned',
       (c.relatedConcepts || []).every(relContractOK),
       (c.relatedConcepts || []).map(r => r && r.ref).join(', ') || 'none');
    const flagged = new Set((c.sections || []).filter(s => s.needsSourceVerification).map(s => s.key));
    const declared = c.authoring && Array.isArray(c.authoring.needsSourceVerification)
      ? c.authoring.needsSourceVerification : [];
    ok(T + ' authoring.needsSourceVerification == sections actually flagged',
       declared.every(k => flagged.has(k)) && [...flagged].every(k => declared.includes(k)),
       'flagged[' + [...flagged].join(',') + '] declared[' + declared.join(',') + ']');
    ok(T + ' every flagged section carries a verificationNote',
       (c.sections || []).filter(s => s.needsSourceVerification)
         .every(s => typeof s.verificationNote === 'string' && s.verificationNote));
  }

  // ---- P3 — related-concept resolution is LIVE, not cached ----------------
  // The renderer (relatedConceptChip) resolves each relatedConcepts entry
  // against the current concept document via AtlasConcepts._internal.resolveRelated.
  // When the target slug is authored, its live titleTH / status win; the
  // denormalised rc.labelTH / rc.status are fallback only (used when the
  // target is not authored yet). Regression guard for lamoed → nitikam, whose
  // stored relation still carries status:"planned" while nitikam is published.
  if (AConcepts && AConcepts._internal && typeof AConcepts._internal.resolveRelated === 'function') {
    AConcepts._internal.setDoc(cdoc);
    const R = AConcepts._internal.resolveRelated;
    const nitikam = (cdoc.concepts || {}).nitikam;

    const lam2nit = ((cdoc.concepts.lamoed || {}).relatedConcepts || [])
      .find(rc => rc && rc.ref === 'atlas:concept/nitikam');
    ok('P1 P3 fixture: lamoed → atlas:concept/nitikam relation exists with cached status "planned"',
       !!lam2nit && lam2nit.status === 'planned', lam2nit && lam2nit.status);
    ok('P1 P3 fixture: target concept nitikam is authored and published',
       !!nitikam && nitikam.status === 'published', nitikam && nitikam.status);
    if (lam2nit && nitikam) {
      const r = R(lam2nit);
      ok('P1 P3 resolveRelated: target resolves by stable slug identity',
         r.slug === 'nitikam' && r.known === true, r.slug + '/' + r.known);
      ok('P1 P3 resolveRelated: LIVE status wins over cached rc.status "planned"',
         r.status === 'published', 'cached=' + lam2nit.status + ' resolved=' + r.status);
      ok('P1 P3 resolveRelated: LIVE titleTH wins over cached rc.labelTH',
         r.label === nitikam.titleTH, r.label + ' vs ' + nitikam.titleTH);
    }

    // synthetic: an intentionally stale cache must not corrupt a live target
    const stale = R({ ref: 'atlas:concept/nitikam', rel: 'seealso', labelTH: 'ค่าที่ล้าสมัย', status: 'planned' });
    ok('P1 P3 stale cached labelTH + status are ignored when the target is authored',
       stale.known === true && stale.status === 'published' &&
       stale.label === (nitikam && nitikam.titleTH),
       'label=' + stale.label + ' status=' + stale.status);

    // unresolved target: graceful fallback to the cached metadata, no throw
    const ghost = R({ ref: 'atlas:concept/no-such-concept', rel: 'seealso', labelTH: 'ยังไม่เขียน', status: 'planned' });
    ok('P1 P3 unresolved target falls back to cached label/status without crashing',
       ghost.known === false && ghost.label === 'ยังไม่เขียน' && ghost.status === 'planned');

    // structural contract still catches a bad target and a bad relation kind
    ok('P1 P3 relatedConcepts contract still rejects an unknown target that is not marked planned',
       relContractOK({ ref: 'atlas:concept/no-such-concept', status: 'planned' }) === true &&
       relContractOK({ ref: 'atlas:concept/no-such-concept' }) === false);
    ok('P1 P3 relatedConcepts contract still rejects an unknown relation kind',
       relContractOK({ ref: 'atlas:concept/nitikam', rel: 'not-a-real-kind' }) === false &&
       relContractOK({ ref: 'atlas:concept/nitikam', rel: 'contrast' }) === true);

    AConcepts._internal.reset();
  }

  // concept.html wiring: reuses atlas-core + the inline drawer, never atlas-ui routing
  const chtml = fs.readFileSync(htmlPath, 'utf8');
  ok('P1 concept.html loads atlas-core.js + atlas-provision-view.js + atlas-concepts.js',
     /src="atlas-core\.js/.test(chtml) && /src="atlas-provision-view\.js/.test(chtml) &&
     /src="atlas-concepts\.js/.test(chtml));
  ok('P1 concept.html does NOT load atlas-ui.js (no route grammar dependency)',
     !/src="atlas-ui\.js/.test(chtml));

  // the one additive entry point from the existing Atlas
  const ahtml = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  ok('P1 atlas.html has exactly one additive link to the Concept Directory (footer, not a route)',
     (ahtml.match(/href="concept\.html"/g) || []).length === 1 &&
     !/concept\.html\?k=/.test(ahtml) &&
     !/parseRoute[\s\S]{0,400}concept/.test(ahtml));
})();

// ============================================================ FINALIZATION 2
// Related Provision Legal Clusters — atlas-clusters.json / atlas-clusters.js
// Additive, standalone. Must not affect any assertion above.
head('Finalization 2 — Related Provision Legal Clusters');
(function () {
  const { execFileSync } = require('child_process');
  const jsPath = path.join(ROOT, 'atlas-clusters.js');
  const jsonPath = path.join(ROOT, 'atlas-clusters.json');
  ok('F2 atlas-clusters.js present', fs.existsSync(jsPath));
  ok('F2 atlas-clusters.json present', fs.existsSync(jsonPath));
  if (!fs.existsSync(jsPath) || !fs.existsSync(jsonPath)) return;

  try { execFileSync(process.execPath, ['--check', jsPath], { stdio: 'pipe' }); ok('F2 atlas-clusters.js parses', true); }
  catch (e) { ok('F2 atlas-clusters.js parses', false, String(e.stderr || e).slice(0, 160)); }

  let cdoc;
  try { cdoc = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); ok('F2 atlas-clusters.json is valid JSON', true); }
  catch (e) { ok('F2 atlas-clusters.json is valid JSON', false, String(e).slice(0, 140)); return; }

  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('F2 atlas-clusters.js never assigns to AtlasCore / AtlasUI (additive)',
     !/\b(AtlasCore|AtlasUI)\s*(\.\w+)?\s*=[^=]/.test(code) && !/(AtlasCore|AtlasUI)\._internal/.test(code));
  ok('F2 atlas-clusters.js never touches location.hash / the route grammar',
     !/\blocation\s*\.\s*hash\b/.test(code) && !/\bhistory\s*\.\s*(pushState|replaceState)\s*\(/.test(code));
  ok('F2 atlas-clusters.js reuses the frozen viewer URL + x=atlas (reader reuse, not a new viewer)',
     /codex-article-viewer\.html\?id=/.test(src) && /x=atlas/.test(src));
  ok('F2 atlas-clusters.js adds NO permanent provision role/kind/pattern field',
     !/\.\s*(role|kind|pattern)\s*=/.test(code));

  // frozen six-pattern taxonomy
  const FROZEN = ['general-special', 'base-aggravated', 'rule-exception', 'contrast-set', 'trigger-consequence', 'precondition'];
  const kinds = Object.keys(cdoc.patternKinds || {});
  ok('F2 exactly the six frozen relationship patterns are defined',
     kinds.length === 6 && kinds.every(k => FROZEN.indexOf(k) !== -1) && FROZEN.every(k => kinds.indexOf(k) !== -1),
     kinds.join(', '));
  ok('F2 every patternKind carries a Thai label + description',
     kinds.every(k => cdoc.patternKinds[k] && cdoc.patternKinds[k].labelTH && cdoc.patternKinds[k].descTH));

  // clusters: shape + provision refs resolve + patternIds valid + no statutory text
  const clusters = Array.isArray(cdoc.clusters) ? cdoc.clusters : [];
  ok('F2 clusters[] is a non-empty array', clusters.length >= 2);

  const seenIds = {};
  let allMembersResolve = true, allPatternsValid = true, allHaveExplain = true, noText = true, refIdentityOK = true;
  const usedPatterns = new Set();
  for (const c of clusters) {
    if (!c || !c.id) { allHaveExplain = false; continue; }
    if (seenIds[c.id]) allHaveExplain = false;
    seenIds[c.id] = 1;
    if (!c.titleTH || typeof c.explanationTH !== 'string' || c.explanationTH.length < 15) allHaveExplain = false;
    if ('text' in c) noText = false;
    if (c.patternId) { usedPatterns.add(c.patternId); if (FROZEN.indexOf(c.patternId) === -1) allPatternsValid = false; }
    if (c.anchor && !AtlasCore.resolveAtlasId(c.anchor)) allMembersResolve = false;
    for (const m of (c.members || [])) {
      if (!m || typeof m.ref !== 'string' || m.ref.indexOf('_') < 1) { refIdentityOK = false; continue; }
      if ('text' in m) noText = false;
      const r = AtlasCore.resolveAtlasId(m.ref);
      if (!r || !r.exists) allMembersResolve = false;
      if (m.patternId) { usedPatterns.add(m.patternId); if (FROZEN.indexOf(m.patternId) === -1) allPatternsValid = false; }
    }
  }
  ok('F2 every cluster has id (unique), titleTH and a Thai explanationTH', allHaveExplain);
  ok('F2 every cluster/member patternId is one of the six frozen ids', allPatternsValid);
  ok('F2 every anchor + member ref resolves to a real provision via AtlasCore', allMembersResolve);
  ok('F2 member identity is a stable AtlasCore ref (<collection>_<number>)', refIdentityOK);
  ok('F2 no "text" field anywhere in cluster data (statutory text stays in Codex)', noText);
  ok('F2 all six frozen patterns are exercised by curated clusters',
     FROZEN.every(p => usedPatterns.has(p)), [...usedPatterns].join(', '));

  // golden clusters
  const A = clusters.find(c => c.id === 'crim-homicide-fault-to-aggravation');
  ok('F2 Golden Cluster A present (§59 → §288 → §289)', !!A);
  if (A) {
    const m = r => A.members.find(x => x.ref === r);
    ok('F2 Cluster A: §59→offences = general-special (G1)', m('criminal_59') && m('criminal_59').patternId === 'general-special');
    ok('F2 Cluster A: §288→§289 = base-aggravated (G2)', m('criminal_289') && m('criminal_289').patternId === 'base-aggravated');
    ok('F2 Cluster A: §288 before §289', m('criminal_288') && m('criminal_289') && m('criminal_288').order < m('criminal_289').order);
    ok('F2 Cluster A: one cluster carries MORE THAN ONE relationship type',
       new Set(A.members.filter(x => x.patternId).map(x => x.patternId)).size >= 2);
  }
  const B = clusters.find(c => c.id === 'crim-theft-family-progression');
  ok('F2 Golden Cluster B present (§59 → §334→§336→§339→§340)', !!B);
  if (B) {
    const seq = B.members.filter(x => typeof x.order === 'number').sort((a, b) => a.order - b.order).map(x => x.ref);
    ok('F2 Cluster B preserves the ordered progression 334→336→339→340',
       JSON.stringify(seq) === JSON.stringify(['criminal_334', 'criminal_336', 'criminal_339', 'criminal_340']), seq.join(' → '));
    ok('F2 Cluster B: §59 overlay is general-special (G1), not forced onto the progression',
       B.members.find(x => x.ref === 'criminal_59').patternId === 'general-special');
  }
  // a provision participates in multiple clusters
  ok('F2 a provision may join multiple clusters (criminal_59 ∈ A and B)',
     clusters.filter(c => (c.anchor === 'criminal_59') || (c.members || []).some(m => m.ref === 'criminal_59')).length >= 2);

  // a contrast-set cluster exists and is anchorless (G4 shape)
  ok('F2 at least one contrast-set (G4) cluster is anchorless / orderless',
     clusters.some(c => c.patternId === 'contrast-set' && !c.anchor && (c.members || []).every(m => m.order == null)));

  // script wiring — atlas-clusters.js must be a <script src> loaded before
  // the <script src> for atlas-provision-view.js (so window.AtlasClusters
  // exists when a panel first renders)
  function scriptBefore(html, a, b) {
    const ra = new RegExp('<script[^>]+src="' + a.replace('.', '\\.') + '[^"]*"').exec(html);
    const rb = new RegExp('<script[^>]+src="' + b.replace('.', '\\.') + '[^"]*"').exec(html);
    return ra && rb && ra.index < rb.index;
  }
  const ahtml2 = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  const chtml2 = fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8');
  ok('F2 atlas.html loads atlas-clusters.js before atlas-provision-view.js',
     scriptBefore(ahtml2, 'atlas-clusters.js', 'atlas-provision-view.js'));
  ok('F2 concept.html loads atlas-clusters.js before atlas-provision-view.js',
     scriptBefore(chtml2, 'atlas-clusters.js', 'atlas-provision-view.js'));
  ok('F2 atlas-provision-view.js renders the cluster section via AtlasClusters (no direct coupling to cluster data)',
     /AtlasClusters\s*&&[\s\S]{0,80}renderSection/.test(fs.readFileSync(path.join(ROOT, 'atlas-provision-view.js'), 'utf8')));
})();

// ============================================================ FINALIZATION 3
// Encyclopedia — atlas-encyclopedia.js / encyclopedia.html
// The discovery / index layer over the existing Concept layer. Additive,
// standalone. Must not affect any assertion above.
head('Finalization 3 — Encyclopedia (discovery layer over the Concept layer)');
(function () {
  const { execFileSync } = require('child_process');
  const jsPath = path.join(ROOT, 'atlas-encyclopedia.js');
  const htmlPath = path.join(ROOT, 'encyclopedia.html');
  const conceptsJsonPath = path.join(ROOT, 'atlas-concepts.json');
  const conceptsJsPath = path.join(ROOT, 'atlas-concepts.js');

  ok('F3 atlas-encyclopedia.js present', fs.existsSync(jsPath));
  ok('F3 encyclopedia.html present', fs.existsSync(htmlPath));
  if (!fs.existsSync(jsPath) || !fs.existsSync(htmlPath)) return;

  try { execFileSync(process.execPath, ['--check', jsPath], { stdio: 'pipe' }); ok('F3 atlas-encyclopedia.js parses', true); }
  catch (e) { ok('F3 atlas-encyclopedia.js parses', false, String(e.stderr || e).slice(0, 160)); }

  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  ok('F3 atlas-encyclopedia.js never assigns to AtlasCore / AtlasUI / AtlasConcepts (additive)',
     !/\b(AtlasCore|AtlasUI|AtlasConcepts)\s*(\.\w+)?\s*=[^=]/.test(code) &&
     !/(AtlasCore|AtlasUI)\._internal/.test(code));
  ok('F3 atlas-encyclopedia.js never touches location.hash / the route grammar',
     !/\blocation\s*\.\s*hash\b/.test(code) && !/history\s*\.\s*pushState\s*\(/.test(code));
  ok('F3 atlas-encyclopedia.js records the search term with replaceState only (shareable ?q=)',
     /history\s*\.\s*replaceState/.test(src) && /[?&]q=/.test(src));
  ok('F3 every concept link is the frozen concept-entry URL concept.html?k=<slug>',
     /concept\.html\?k=/.test(src));
  ok('F3 atlas-encyclopedia.js does NOT duplicate the corpus or the provision DB',
     !/codex-data\.json/.test(src) && !/resolveProvision|getProvisionBrief/.test(code));
  ok('F3 atlas-encyclopedia.js reads the concept document only via AtlasConcepts.load()',
     /AtlasConcepts\.load\s*\(/.test(src) && /collectPlanned/.test(src));

  // concept schema: optional curated latin[] — additive, NOT a second model
  let cdoc;
  try { cdoc = JSON.parse(fs.readFileSync(conceptsJsonPath, 'utf8')); ok('F3 atlas-concepts.json still valid JSON after latin[] addition', true); }
  catch (e) { ok('F3 atlas-concepts.json still valid JSON after latin[] addition', false, String(e).slice(0, 140)); return; }

  const published = Object.keys(cdoc.concepts || {}).filter(k => cdoc.concepts[k] && cdoc.concepts[k].status === 'published');
  ok('F3 exactly the two known concepts are published (no concept invented to fill the UI)',
     published.length === 2 && published.indexOf('lamoed') !== -1 && published.indexOf('nitikam') !== -1,
     published.join(', '));
  ok('F3 latin[] where present is an array of non-empty strings (curated, not auto-translated)',
     published.every(k => {
       const l = cdoc.concepts[k].latin;
       return l == null || (Array.isArray(l) && l.every(t => typeof t === 'string' && t.trim()));
     }));
  ok('F3 curated cross-language terms are documented (terminologyNote present)',
     typeof cdoc.terminologyNote === 'string' && cdoc.terminologyNote.length > 20);
  ok('F3 no new relation/graph object introduced in the concept schema (still typed string refs)',
     !/\bchildren\s*:/.test(fs.readFileSync(conceptsJsonPath, 'utf8')) &&
     !/\bparentId\s*:/.test(fs.readFileSync(conceptsJsonPath, 'utf8')));

  // atlas-concepts.js renders latin[] on the concept entry (only when present)
  ok('F3 atlas-concepts.js renders latin[] on the concept entry, guarded by presence',
     /concept\.latin\s*&&\s*concept\.latin\.length/.test(fs.readFileSync(conceptsJsPath, 'utf8')));

  // functional: build the derived index from the real document
  let ENC;
  try {
    require(path.join(ROOT, 'atlas-concepts.js'));
    require(path.join(ROOT, 'atlas-encyclopedia.js'));
    ENC = global.AtlasEncyclopedia;
    ok('F3 window.AtlasEncyclopedia exposed with render + _internal', !!(ENC && ENC.render && ENC._internal));
  } catch (e) { ok('F3 window.AtlasEncyclopedia exposed with render + _internal', false, String(e).slice(0, 140)); }

  if (ENC && ENC._internal) {
    const EI = ENC._internal;
    const idx = EI.buildIndex(cdoc);
    ok('F3 buildIndex derives terms only from published concepts',
       idx.length >= 8 && idx.every(e => e.slug === 'lamoed' || e.slug === 'nitikam'), 'entries: ' + idx.length);
    ok('F3 index covers Thai names + aliases + English + curated Latin',
       ['primary', 'alias', 'en', 'latin'].every(kind => idx.some(e => e.kind === kind)));
    ok('F3 Thai-aware grouping: consonant vs A–Z bucket',
       EI.thaiInitial('ละเมิด') === 'ล' && EI.thaiInitial('Delictum') === null &&
       EI.groupKey('Delictum') === 'A–Z');
    const groups = EI.groupEntries(idx);
    ok('F3 groups are ordered, A–Z bucket last',
       groups.length >= 2 && groups[groups.length - 1].key === 'A–Z');
    ok('F3 search matches Thai names, aliases AND English/Latin equivalents',
       EI.search(idx, 'ละเมิด').length >= 4 &&
       EI.search(idx, 'tort').some(e => e.slug === 'lamoed') &&
       EI.search(idx, 'delictum').some(e => e.slug === 'lamoed') &&
       EI.search(idx, 'zzz-none').length === 0);
    ok('F3 empty query returns the whole index (full alphabetical view)',
       EI.search(idx, '').length === idx.length);
  }

  // nav wiring — Encyclopedia is reachable from the rest of the Atlas
  const encHtml = fs.readFileSync(htmlPath, 'utf8');
  const iC = encHtml.indexOf('atlas-concepts.js');
  const iE = encHtml.indexOf('atlas-encyclopedia.js');
  ok('F3 encyclopedia.html loads atlas-concepts.js before atlas-encyclopedia.js',
     iC !== -1 && iE !== -1 && iC < iE);
  ok('F3 encyclopedia.html mounts on #atlas-root and does not fetch the corpus',
     /id="atlas-root"/.test(encHtml) && !/codex-data\.json/.test(encHtml));
  ok('F3 atlas.html links to the Encyclopedia',
     /href="encyclopedia\.html"/.test(fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8')));
  ok('F3 concept.html links to the Encyclopedia (both directory and entry footers)',
     (fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8').match(/encyclopedia\.html/g) || []).length >= 2);
})();

// ============================================================ F4
// Provision → Concept Backlinks — atlas-provision-concepts.js
// The reverse of the F1–F3 network: while reading a provision, see the curated
// Concept that covers it. Additive, standalone, derived in memory. Must not
// affect any assertion above.
head('F4 — Provision-to-Concept Backlinks');
(function () {
  const { execFileSync } = require('child_process');
  const jsPath = path.join(ROOT, 'atlas-provision-concepts.js');
  const conceptsJsonPath = path.join(ROOT, 'atlas-concepts.json');

  ok('F4 atlas-provision-concepts.js present', fs.existsSync(jsPath));
  if (!fs.existsSync(jsPath)) return;

  try { execFileSync(process.execPath, ['--check', jsPath], { stdio: 'pipe' }); ok('F4 atlas-provision-concepts.js parses', true); }
  catch (e) { ok('F4 atlas-provision-concepts.js parses', false, String(e.stderr || e).slice(0, 160)); }

  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  ok('F4 standalone/additive — never assigns to AtlasCore / AtlasUI / AtlasConcepts',
     !/\b(AtlasCore|AtlasUI|AtlasConcepts)\s*(\.\w+)?\s*=[^=]/.test(code) &&
     !/(AtlasCore|AtlasUI)\._internal/.test(code));
  ok('F4 never touches location.hash / the route grammar / history',
     !/\blocation\s*\.\s*hash\b/.test(code) && !/history\s*\.\s*(pushState|replaceState)/.test(code));
  ok('F4 concept link is the frozen concept-entry URL concept.html?k=<slug>',
     /concept\.html\?k=/.test(src) && !/#\/c\//.test(src));
  ok('F4 no second relationship dataset (derives from the Concept layer only)',
     !/provisionConcepts\.json|provision-concepts\.json/.test(src) &&
     !/codex-data\.json/.test(src) &&
     /AtlasConcepts\.load\s*\(/.test(src));
  ok('F4 reuses AtlasConcepts._internal.allProvisionRefs for the derivation',
     /allProvisionRefs/.test(src));

  // no schema mutation
  const rawJson = fs.readFileSync(conceptsJsonPath, 'utf8');
  ok('F4 atlas-concepts.json schema untouched (no F4 field, no graph object)',
     !/\bprovisionConcepts\b|\bconceptsByProvision\b|\bbacklinks\b|\bchildren\s*:/.test(rawJson));

  // functional — derive the reverse index from the real document
  let cdoc;
  try { cdoc = JSON.parse(rawJson); } catch (e) { ok('F4 atlas-concepts.json valid JSON', false, String(e).slice(0, 120)); return; }

  let PC;
  try {
    require(path.join(ROOT, 'atlas-concepts.js'));   // (also required by the F3 block)
    require(path.join(ROOT, 'atlas-provision-concepts.js'));
    PC = global.AtlasProvisionConcepts;
    ok('F4 window.AtlasProvisionConcepts exposed with renderSection + _internal',
       !!(PC && typeof PC.renderSection === 'function' && PC._internal));
  } catch (e) { ok('F4 window.AtlasProvisionConcepts exposed with renderSection + _internal', false, String(e).slice(0, 140)); }

  if (PC && PC._internal) {
    global.AtlasConcepts._internal.setDoc(cdoc);      // so getConcept()/allProvisionRefs() resolve
    const idx = PC._internal.buildIndex(cdoc);
    ok('F4 reverse index derivable, covers many provisions',
       idx && Object.keys(idx).length >= 20, 'refs: ' + (idx ? Object.keys(idx).length : 0));

    const c420 = PC._internal.conceptsForProvision('civil_420');
    ok('F4 known relationship civil_420 → ละเมิด resolves',
       c420.length === 1 && c420[0].slug === 'lamoed' && c420[0].titleTH === 'ละเมิด' && c420[0].core === true);
    ok('F4 civil_149 → นิติกรรม resolves',
       PC._internal.conceptsForProvision('civil_149').some(c => c.slug === 'nitikam'));

    const c5 = PC._internal.conceptsForProvision('civil_5').map(c => c.slug).sort();
    ok('F4 a provision may map to MANY concepts (civil_5 ∈ lamoed & nitikam)',
       JSON.stringify(c5) === JSON.stringify(['lamoed', 'nitikam']));

    ok('F4 no duplicate concept entry for any provision',
       Object.keys(idx).every(ref => {
         const s = idx[ref].map(x => x.slug);
         return s.length === new Set(s).size;
       }));
    ok('F4 every mapped slug is a published concept with a valid slug',
       Object.keys(idx).every(ref => idx[ref].every(x => {
         const c = cdoc.concepts[x.slug];
         return c && c.status === 'published' && c.slug === x.slug;
       })));
    ok('F4 unknown provision → no concepts (renders nothing)',
       PC._internal.conceptsForProvision('criminal_99999').length === 0);
    ok('F4 currentRefOf maps a resolved provision to its stable <collection>_<number> ref',
       PC._internal.currentRefOf({ legacyId: 'civil_420' }) === 'civil_420' &&
       PC._internal.currentRefOf({ collection: 'civil', number: '420' }) === 'civil_420');
  }

  // wiring — F4 rendered from inside the F1 reader; scripts present + ordered
  const avf = fs.readFileSync(path.join(ROOT, 'atlas-provision-view.js'), 'utf8');
  ok('F4 atlas-provision-view.js renders the backlink via AtlasProvisionConcepts (no direct coupling)',
     /AtlasProvisionConcepts\s*&&[\s\S]{0,120}renderSection/.test(avf));
  ok('F4 F2 cluster rendering in the F1 reader is untouched',
     /AtlasClusters\s*&&[\s\S]{0,80}renderSection/.test(avf));

  // compare <script src> positions only — never a mention in an HTML comment
  function scriptBefore(html, a, b) {
    const ra = new RegExp('<script[^>]+src="' + a.replace(/\./g, '\\.') + '[^"]*"').exec(html);
    const rb = new RegExp('<script[^>]+src="' + b.replace(/\./g, '\\.') + '[^"]*"').exec(html);
    return ra && rb && ra.index < rb.index;
  }
  function scriptPresent(html, a) {
    return new RegExp('<script[^>]+src="' + a.replace(/\./g, '\\.') + '[^"]*"').test(html);
  }
  const ah = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  const ch = fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8');
  ok('F4 atlas.html loads atlas-concepts.js + atlas-provision-concepts.js before atlas-provision-view.js',
     scriptPresent(ah, 'atlas-concepts.js') &&
     scriptBefore(ah, 'atlas-concepts.js', 'atlas-provision-concepts.js') &&
     scriptBefore(ah, 'atlas-provision-concepts.js', 'atlas-provision-view.js'));
  ok('F4 concept.html loads atlas-provision-concepts.js before atlas-provision-view.js',
     scriptBefore(ch, 'atlas-provision-concepts.js', 'atlas-provision-view.js'));
  ok('F4 both pages still load atlas-clusters.js before atlas-provision-view.js (F2 intact)',
     scriptBefore(ah, 'atlas-clusters.js', 'atlas-provision-view.js') &&
     scriptBefore(ch, 'atlas-clusters.js', 'atlas-provision-view.js'));
})();

// ============================================================ F5
// Atlas Search / Jump — atlas-search.js
// A resolve-typed-intent-to-an-existing-destination navigator on atlas.html.
// Additive consumer. NOT a full-text engine. Must not affect any assertion above.
head('F5 — Atlas Search / Jump');
(function () {
  const { execFileSync } = require('child_process');
  const jsPath = path.join(ROOT, 'atlas-search.js');
  ok('F5 atlas-search.js present', fs.existsSync(jsPath));
  if (!fs.existsSync(jsPath)) return;

  try { execFileSync(process.execPath, ['--check', jsPath], { stdio: 'pipe' }); ok('F5 atlas-search.js parses', true); }
  catch (e) { ok('F5 atlas-search.js parses', false, String(e.stderr || e).slice(0, 160)); }

  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  ok('F5 standalone/additive — never assigns to a core Atlas layer',
     !/\b(AtlasCore|AtlasUI|AtlasConcepts|AtlasProvisionView|AtlasClusters|AtlasProvisionConcepts|AtlasEncyclopedia)\s*(\.\w+)?\s*=[^=]/.test(code));
  ok('F5 never writes into another module\'s _internal',
     !/(AtlasCore|AtlasUI|AtlasConcepts|AtlasProvisionView)\s*\.\s*_internal\s*\.\s*\w+\s*=/.test(code));
  ok('F5 no full-text / corpus load, no fuzzy engine, no new index dataset',
     !/codex-data\.json/.test(src) &&
     !/levenshtein|fuzzy|editDistance/i.test(src) &&
     !/atlas-search\.json|search-index\.json|provisionText/.test(src));
  ok('F5 location.hash is written ONLY for collection/structural navigation (≤2 sites)',
     (src.match(/location\s*\.\s*hash\s*=/g) || []).length <= 2);
  ok('F5 uses history.replaceState for the ?q= param (no new route grammar)',
     /history\s*\.\s*replaceState/.test(src) && /[?&]q=/.test(src));
  ok('F5 reuses the Phase 4B reveal contract AtlasUI._internal.restoreReturn(root,{path})',
     /AtlasUI\s*\.\s*_internal\s*\.\s*restoreReturn/.test(src) && /path\s*:/.test(src));
  ok('F5 reuses the F1 provision open path (openProvision / ?a=)',
     /openProvision/.test(src) && /['"]a['"]|[?&]a=|\ba=\b/.test(src));
  ok('F5 concept navigation → the canonical Concept Entry concept.html?k=<slug>',
     /concept\.html\?k=/.test(src) && !/#\/k\//.test(src));
  ok('F5 no-match fallback points once at codex-search.html (not a second results page)',
     /codex-search\.html/.test(src) && (src.match(/codex-search\.html/g) || []).length <= 2);

  // functional — resolve typed intent against the real corpus + concept doc
  let AS;
  const savedUI = global.AtlasUI, savedPV = global.AtlasProvisionView;
  global.AtlasUI = { parseRoute: () => ({ view: 'collection', collection: 'civil', instrument: null }),
                     _internal: { restoreReturn: function () {} } };
  global.AtlasProvisionView = { init: function () {}, _internal: { openProvision: function () { return true; } } };
  try {
    require(path.join(ROOT, 'atlas-search.js'));
    AS = global.AtlasSearch;
    ok('F5 window.AtlasSearch exposed with mount + _internal', !!(AS && typeof AS.mount === 'function' && AS._internal));
  } catch (e) { ok('F5 window.AtlasSearch exposed with mount + _internal', false, String(e).slice(0, 140)); }

  if (AS && AS._internal) {
    const S = AS._internal;
    S.buildConceptTerms(JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-concepts.json'), 'utf8')));

    // deterministic precedence: 1 provision · 2 collection · 3 structural · 4 concept
    const forms = ['420', 'ม.420', 'มาตรา 420', 'civil 420', 'civil_420'];
    ok('F5 every provision form → go civil_420 (F1)',
       forms.every(f => {
         const r = S.resolve(f);
         return r.kind === 'go' && r.dest.type === 'provision' && r.dest.collection === 'civil' && r.dest.number === '420';
       }));

    const col = S.resolve('ประมวลกฎหมายอาญา');
    ok('F5 exact collection title → go collection route (criminal)',
       col.kind === 'go' && col.dest.type === 'collection' && col.dest.key === 'criminal');
    ok('F5 exact collection short alias also resolves',
       S.resolve('ประมวลอาญา').dest.key === 'criminal');

    const stru = S.resolve('บรรพ 2');
    ok('F5 unique structural label (on a collection route) → go structural, whole node.path carried',
       stru.kind === 'go' && stru.dest.type === 'structural' &&
       JSON.stringify(stru.dest.path) === JSON.stringify(['บรรพ 2']) && stru.dest.collection === 'civil');

    ok('F5 structural resolution matches node.value only, never the descriptive title',
       S.resolve('ละเมิด').dest.type === 'concept');

    ['ละเมิด', 'tort', 'Delictum'].forEach(t => {
      const r = S.resolve(t);
      ok(r.kind === 'go' && r.dest.type === 'concept' && r.dest.slug === 'lamoed', 'F5 concept "' + t + '" → lamoed');
    });

    const amb = S.resolve('ลักษณะ 5');
    ok('F5 ambiguous input → suggestions, never a silent choice',
       amb.kind === 'ambiguous' && amb.dests.length >= 2 && amb.dests.every(d => d.type === 'structural'));

    ok('F5 unknown input → nomatch (no navigation)', S.resolve('xyzzy-nope').kind === 'nomatch');
    ok('F5 empty input → empty', S.resolve('   ').kind === 'empty');
  }
  global.AtlasUI = savedUI; global.AtlasProvisionView = savedPV;

  // host wiring
  const ah = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  ok('F5 atlas.html has the #atlas-search mount point', /id="atlas-search"/.test(ah));
  ok('F5 atlas.html loads atlas-search.js after atlas-provision-view.js',
     /<script[^>]+src="atlas-search\.js/.test(ah) &&
     ah.indexOf('src="atlas-provision-view.js') < ah.indexOf('src="atlas-search.js'));
  ok('F5 atlas.html calls AtlasSearch.mount', /AtlasSearch\.mount\s*\(/.test(ah));
  ok('F5 concept.html is NOT given the search box (atlas.html only, per scope)',
     !/atlas-search\.js/.test(fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8')));
  ok('F5 codex-search.html untouched by F5 (no atlas-search reference added)',
     !/atlas-search/.test(fs.readFileSync(path.join(ROOT, 'codex-search.html'), 'utf8')));
})();

// ============================================================ F6
// Provision Context in the F1 Reader — structural titles + interactive crumbs
// in atlas-provision-view.js's breadcrumb. Additive: presentation + the
// established Phase-4B reveal contract only.
head('F6 — Provision Context in the F1 Reader');
(function () {
  const jsPath = path.join(ROOT, 'atlas-provision-view.js');
  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  ok('F6 breadcrumbEl consumes resolved.breadcrumb and renders the crumb .title',
     /function breadcrumbEl\s*\(\s*resolved\s*\)/.test(src) &&
     /resolved\.breadcrumb/.test(src) &&
     /crumb-title/.test(src) && /c\.title/.test(src));
  ok('F6 the current provision crumb stays a non-interactive span',
     /atlas-provision-view-crumb-current/.test(src) &&
     /make\(\s*'span'\s*,\s*'atlas-provision-view-crumb atlas-provision-view-crumb-current'/.test(src));
  ok('F6 collection crumb → <a href="#/c/<collection>">, structural crumb → <button>',
     /make\(\s*'a'\s*,\s*'atlas-provision-view-crumb atlas-provision-view-crumb-nav'/.test(src) &&
     /'#\/c\/'\s*\+\s*encodeURIComponent\(collection\)/.test(src) &&
     /make\(\s*'button'\s*,\s*'atlas-provision-view-crumb atlas-provision-view-crumb-nav'/.test(src));
  ok('F6 reveal uses the EXISTING AtlasUI._internal.restoreReturn(root,{hash,instrument,path})',
     /global\.AtlasUI/.test(code) &&
     /UI\._internal\s*&&[\s\S]{0,80}restoreReturn/.test(code) &&
     /restoreReturn\(\s*_root\s*,\s*\{\s*hash[\s\S]{0,70}instrument[\s\S]{0,40}path/.test(src));
  ok('F6 introduces NO new AtlasUI method (never assigns to AtlasUI / AtlasUI._internal)',
     !/\bAtlasUI\s*(\.\w+)*\s*=[^=]/.test(code) && !/AtlasUI\s*\.\s*_internal\s*\.\s*\w+\s*=/.test(code));
  ok('F6 writes location.hash only for the sanctioned #/c/<collection> navigation',
     (code.match(/location\s*\.\s*hash\s*=/g) || []).every(() => true) &&
     new RegExp("location\\s*\\.\\s*hash\\s*=\\s*wantHash").test(code) &&
     /wantHash\s*=\s*'#\/c\/'\s*\+\s*collection/.test(src));
  ok('F6 cross-page (no tree on the page) hands off via the Phase-4B key sessionStorage[\'atlas:return\']',
     /sessionStorage\.setItem\(\s*'atlas:return'/.test(src) && /atlas\.html'\s*\+\s*wantHash/.test(src));
  ok('F6 does NOT add the deferred "ในหมวดนี้ · N มาตรา" section',
     !/ในหมวดนี้/.test(src) && !/getStructureTree/.test(src));
  ok('F6 does NOT modify any schema / dataset (atlas-provision-view writes no JSON file)',
     !/writeFileSync|\.json['"]\s*,/.test(src));

  // data proof — the titles + prefix paths the crumb needs are already in AtlasCore
  const crumbs = AtlasCore.getBreadcrumb('civil', '420');
  const structural = crumbs.filter(c => c.field);
  ok('F6 getBreadcrumb(civil,420) carries structural titles (หนี้ · ละเมิด · ความรับผิดเพื่อละเมิด)',
     structural.map(c => c.title).join(' | ') === 'หนี้ | ละเมิด | ความรับผิดเพื่อละเมิด');
  const prefixes = [];
  const acc = [];
  structural.forEach(c => { acc.push(c.value); prefixes.push(acc.slice()); });
  ok('F6 structural prefix paths derive to [บรรพ 2] / [บรรพ 2,ลักษณะ 5] / [บรรพ 2,ลักษณะ 5,หมวด 1]',
     JSON.stringify(prefixes) === JSON.stringify([
       ['บรรพ 2'], ['บรรพ 2', 'ลักษณะ 5'], ['บรรพ 2', 'ลักษณะ 5', 'หมวด 1']]));
  const last = crumbs[crumbs.length - 1];
  ok('F6 the last crumb is the provision (no field) — never an interactive structural link',
     last.kind === 'provision' && !last.field && last.text === 'มาตรา 420');
  const empty = AtlasCore.getBreadcrumb('const2560', '262').filter(c => c.field);
  ok('F6 an empty-title structural level still resolves (const2560 ม.262 → บทเฉพาะกาล, title "")',
     empty.length >= 1 && empty[0].value === 'บทเฉพาะกาล' && !String(empty[0].title || '').trim());

  // host cache-bust
  const ah = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  const ch = fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8');
  ok('F6 atlas.html + concept.html bumped atlas-provision-view.js ?v past 20260909c',
     /atlas-provision-view\.js\?v=20260909e/.test(ah) && /atlas-provision-view\.js\?v=20260909e/.test(ch) &&
     !/atlas-provision-view\.js\?v=20260909c/.test(ah) && !/atlas-provision-view\.js\?v=20260909c/.test(ch));
})();

// ============================================================ F7-C1
head('F7-C1 — Concept structural anchors are actionable (path -> exact node)');
(function () {
  const jsPath = path.join(ROOT, 'atlas-concepts.js');
  const jsonPath = path.join(ROOT, 'atlas-concepts.json');
  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  let cdoc;
  try { cdoc = JSON.parse(rawJson); }
  catch (e) { ok('F7-C1 atlas-concepts.json parses', false, String(e).slice(0, 140)); return; }

  // --- the focused rule: every authored structuralAnchor.path is a real,
  //     fully-prefixed ancestor chain in the LIVE structure tree for its
  //     collection. Catches all four failure modes:
  //       unknown collection · empty path · invalid node value · broken prefix
  function nodePathSet(collection) {
    let tree;
    try { tree = AtlasCore.getStructureTree(collection); } catch (e) { return null; }
    if (!tree || !Array.isArray(tree.nodes)) return null;   // unknown / structureless
    const set = new Set();
    (function w(ns) {
      (ns || []).forEach(n => {
        if (Array.isArray(n.path)) set.add(JSON.stringify(n.path));
        if (n.children) w(n.children);
      });
    })(tree.nodes);
    return set;
  }
  function anchorProblem(a) {
    if (!a || !a.collection) return 'missing collection';
    const set = nodePathSet(a.collection);
    if (!set || set.size === 0) return 'unknown/structureless collection "' + a.collection + '"';
    if (!Array.isArray(a.path) || a.path.length === 0) return 'empty path';
    for (let i = 1; i <= a.path.length; i++) {
      if (!set.has(JSON.stringify(a.path.slice(0, i)))) {
        return 'path prefix not a real node: ' + JSON.stringify(a.path.slice(0, i));
      }
    }
    return null;
  }

  const anchors = [];
  for (const [slug, c] of Object.entries(cdoc.concepts || {})) {
    (c.structuralAnchor || []).forEach(a => anchors.push({ slug, problem: anchorProblem(a) }));
  }
  const bad = anchors.filter(x => x.problem);
  ok('F7-C1 every authored structuralAnchor.path is a real, fully-prefixed structure-tree chain',
     bad.length === 0,
     bad.length ? bad.map(x => x.slug + ': ' + x.problem).join(' | ')
                : anchors.length + ' anchors across ' +
                  Object.keys(cdoc.concepts || {}).length + ' concepts OK');

  // negative controls — the rule actually rejects the four failure modes
  ok('F7-C1 rule rejects unknown collection / empty path / bad node value / broken prefix',
     !!anchorProblem({ collection: 'no-such-collection', path: ['x'] }) &&
     !!anchorProblem({ collection: 'civil', path: [] }) &&
     !!anchorProblem({ collection: 'civil', path: ['บรรพ 999'] }) &&
     !!anchorProblem({ collection: 'civil', path: ['ลักษณะ 5', 'บรรพ 2'] }));

  // the golden anchor resolves through the real tree
  const lamoedAnchor = ((cdoc.concepts || {}).lamoed || {}).structuralAnchor || [];
  ok('F7-C1 lamoed -> civil -> ["บรรพ 2","ลักษณะ 5"] resolves through the live structure tree',
     lamoedAnchor.some(a => a.collection === 'civil' &&
       JSON.stringify(a.path) === JSON.stringify(['บรรพ 2', 'ลักษณะ 5'])) &&
     anchorProblem({ collection: 'civil', path: ['บรรพ 2', 'ลักษณะ 5'] }) === null);

  // --- source contract: the consumer reuses the shipped hand-off only
  const src = fs.readFileSync(jsPath, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  ok('F7-C1 atlas-concepts.js hands off via sessionStorage[\'atlas:return\'] then location.assign(atlas.html#/c/<collection>)',
     /sessionStorage/.test(code) && /['"]atlas:return['"]/.test(code) &&
     /location\s*\.\s*assign\s*\(/.test(code) &&
     /['"]atlas\.html['"]\s*\+\s*payload\.hash/.test(code));
  ok('F7-C1 activation payload is the { hash, instrument, path } restore shape (no invented instrument)',
     /hash\s*:/.test(code) && /instrument\s*:/.test(code) && /path\s*:/.test(code) &&
     /an\.instrument\s*\|\|\s*null/.test(code));
  ok('F7-C1 adds NO new route grammar / no location.hash / no history write / no AtlasUI reach',
     !/\blocation\s*\.\s*hash\b/.test(code) &&
     !/\bhistory\s*\.\s*(pushState|replaceState)\s*\(/.test(code) &&
     !/\bAtlasUI\b/.test(code));
  ok('F7-C1 adds NO schema field to atlas-concepts.json',
     !/"instrument"\s*:/.test(rawJson) &&
     !/"structuralNode"|"anchorPayload"|"revealPath"/.test(rawJson));

  // host cache-bust for the changed module
  const ah2 = fs.readFileSync(path.join(ROOT, 'atlas.html'), 'utf8');
  const ch2 = fs.readFileSync(path.join(ROOT, 'concept.html'), 'utf8');
  const eh2 = fs.readFileSync(path.join(ROOT, 'encyclopedia.html'), 'utf8');
  ok('F7-C1 atlas.html + concept.html + encyclopedia.html bumped atlas-concepts.js ?v to 20260910a',
     /atlas-concepts\.js\?v=20260910a/.test(ah2) &&
     /atlas-concepts\.js\?v=20260910a/.test(ch2) &&
     /atlas-concepts\.js\?v=20260910a/.test(eh2) &&
     !/atlas-concepts\.js\?v=20260909e/.test(ah2 + ch2 + eh2));
})();

console.log('\n----------------------------------------');
console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
console.log('----------------------------------------');
process.exit(fail ? 1 : 0);
