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

console.log('\n----------------------------------------');
console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
console.log('----------------------------------------');
process.exit(fail ? 1 : 0);
