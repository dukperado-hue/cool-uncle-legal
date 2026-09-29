/* Smoke test for 🤖 AI Highlight in codex-article-viewer.html.
   Colour semantics under test:
     yellow = key phrase, blue = exception/limitation, pink = cross-reference,
     green = legal consequence, orange = defined term / legal role.
   Checks the curated file (codex-ai-highlights.json) against the real
   codex-data.json, and runs the viewer's real render code against a tiny
   DOM stub. Read-only: never writes to any data file.
   Usage: node codex-ai-highlight-smoke.js [root] */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;
const html = fs.readFileSync(path.join(ROOT, 'codex-article-viewer.html'), 'utf8').replace(/\r\n/g, '\n');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8'));
const cur = JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-ai-highlights.json'), 'utf8'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ---- load the viewer's real code -------------------------------------------
const slice = (a, b) => { const i = html.indexOf(a); if (i < 0) throw new Error('marker ' + a); return html.slice(i, html.indexOf(b, i)); };
const code = 'let currentBookType = null;\n' + [
  slice('function escapeHtml', 'function normalizeMatraNumber'),
  slice('function normalizeMatraNumber', 'function renderArticleBody'),
  slice('function renderArticleBody', '/* ===='),
  slice('const HL_MODE_KEY', 'function addHighlight'),
].join('\n');
const els = {};
const stubEl = id => els[id] || (els[id] = { id, innerHTML: '', textContent: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; } });
const V = new Function('document', 'localStorage', 'codexData', 'thaiOrdinalWord', code + `
  return { set aiIdx(v) { aiHighlightIndex = v; },
    set state(o) { currentBookType = o.book; highlightModeOn = o.on; highlightViewMode = o.mode; },
    renderArticleBody, computeAutoHighlightsForChunk, locateCuratedHighlights, isAiHighlightScope, buildChunkHtml, AI_HL_PRIORITY, AI_HL_BOOKS };`)(
  { getElementById: stubEl }, { getItem: () => null, setItem() {} }, data, n => String(n));

const COLORS = ['orange', 'blue', 'pink', 'green', 'yellow'];
const chunksOf = a => { const c = a.text.split('\n').filter(p => p.trim()); return c.length <= 1 ? [a.text] : c; };
const strip = h => h.replace(/<[^>]*>/g, '');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const A = (b, n) => data.books[b].articles[n];

// ---- 1. curated file vs real data ----------------------------------------------
const perBook = {};
V.aiIdx = cur;
Object.entries(cur).forEach(([key, entry]) => {
  const i = key.indexOf(':'), book = key.slice(0, i), num = key.slice(i + 1);
  const a = data.books[book] && data.books[book].articles[num];
  ok(V.AI_HL_BOOKS.includes(book), key + ': book in scope');
  ok(!!a, key + ': article exists');
  if (!a) return;
  perBook[book] = (perBook[book] || 0) + 1;
  ok(!!a.examFreq, key + ': starred (examFreq)');
  ok(!a.cancelled, key + ': not cancelled');
  const chunks = chunksOf(a);
  const seen = new Set();
  Object.keys(entry).forEach(color => {
    ok(COLORS.includes(color), key + ': valid colour ' + color);
    ok(Array.isArray(entry[color]) && entry[color].length > 0, key + ': ' + color + ' non-empty array');
    (entry[color] || []).forEach(p => {
      ok(typeof p === 'string' && p.length > 0 && p === p.trim(), key + ': phrase is a trimmed string');
      ok(chunks.some(c => c.includes(p)), key + ' ' + color + ': phrase found verbatim in one chunk: ' + p);
      ok(!seen.has(p), key + ': no duplicate phrase: ' + p);
      seen.add(p);
    });
  });
  // every curated phrase must be fully covered by the rendered ranges, and keep at
  // least one piece of its OWN colour (it may only lose text to a higher-priority colour)
  const located = V.locateCuratedHighlights(book, a, chunks);
  const legacyN = (a.aiHighlights || []).length; // legacy article.aiHighlights add extra ranges
  ok(located.reduce((n, l) => n + l.length, 0) === seen.size + legacyN, key + ': all phrases located');
  located.forEach((cr, ci) => {
    const out = V.computeAutoHighlightsForChunk(chunks[ci], cr);
    cr.forEach(r => {
      const label = key + ' ' + r.color + ': ' + chunks[ci].slice(r.start, r.end);
      ok(out.some(o => o.color === r.color && o.start >= r.start && o.end <= r.end), label + ' keeps a piece of its own colour');
      for (let k = r.start; k < r.end; k++) {
        if (/\s/.test(chunks[ci][k])) continue;
        if (!out.some(o => k >= o.start && k < o.end)) { ok(false, label + ' char uncovered at ' + k); break; }
      }
    });
    ok(out.every((o, j) => j === 0 || out[j - 1].end <= o.start), key + ': ranges never overlap');
  });
});
console.log('curated per book:', JSON.stringify(perBook), 'total', Object.keys(cur).length);
V.AI_HL_BOOKS.forEach(b => ok(perBook[b] > 0, 'curated coverage for ' + b));

// ---- 2. scope: starred + 4 books only ----------------------------------------------
[['civil', '420'], ['criminal', '326'], ['civpro', '173'], ['crimpro', '158']].forEach(([b, n]) => ok(V.isAiHighlightScope(b, A(b, n)), b + ':' + n + ' in scope'));
[['civil', '149'], ['civil', '193/30'], ['civil', '453'], ['civil', '587'], ['civpro', '2'], ['civpro', '172'], ['crimpro', '157']].forEach(([b, n]) => {
  ok(!A(b, n).examFreq, b + ':' + n + ' really is non-starred');
  ok(!V.isAiHighlightScope(b, A(b, n)), b + ':' + n + ' out of scope');
});
const other = Object.keys(data.books).find(b => !V.AI_HL_BOOKS.includes(b) && Object.values(data.books[b].articles).some(a => a.examFreq));
if (other) ok(!V.isAiHighlightScope(other, Object.values(data.books[other].articles).find(a => a.examFreq)), 'starred article of other book out of scope (' + other + ')');

// ---- 3. render through the real renderArticleBody -----------------------------------
function renderArticle(book, article, mode, on, idx) {
  V.aiIdx = arguments.length > 4 ? idx : cur;
  V.state = { book, on, mode };
  V.renderArticleBody(article);
  return els['article-text'].innerHTML;
}
const R =(b, n, mode = 'auto', on = true, idx) => (idx === undefined ? renderArticle(b, A(b, n), mode, on) : renderArticle(b, A(b, n), mode, on, idx));
const marks = h => (h.match(/<mark /g) || []).length;
const markList = h => [...h.matchAll(/<mark class="[^"]*codex-hl-(orange|blue|pink|green|yellow)"[^>]*>(.*?)<\/mark>/gs)].map(m => [m[1], strip(m[2])]);
const colorsIn = h => new Set(markList(h).map(m => m[0]));
const has = (h, color, text) => markList(h).some(m => m[0] === color && m[1].includes(text));
function checkDom(h, a, label) {
  ok(!/<mark[^>]*>(?:(?!<\/mark>).)*<mark /s.test(h), label + ': no nested <mark>');
  ok(marks(h) === (h.match(/<\/mark>/g) || []).length, label + ': balanced <mark>');
  const joined = strip(h);
  chunksOf(a).forEach(c => ok(joined.includes(esc(c)), label + ': chunk text intact'));
}
[['civil', '420'], ['civil', '456'], ['criminal', '69'], ['criminal', '157'], ['civpro', '4'], ['civpro', '174'], ['crimpro', '28'], ['crimpro', '78'], ['crimpro', '158']].forEach(([b, n]) => {
  const h = R(b, n);
  ok(marks(h) > 0, b + ':' + n + ' auto renders marks');
  ok(/class="codex-hl codex-hl-auto codex-hl-/.test(h) && !/data-hl-id/.test(h), b + ':' + n + ' auto marks are read-only');
  checkDom(h, A(b, n), b + ':' + n);
});

// --- semantic rules on real starred articles (A-H of the spec) ---
let h = R('civil', '420');
ok(has(h, 'green', 'ต้องใช้ค่าสินไหมทดแทน'), 'F civil 420: consequence "ต้องใช้ค่าสินไหมทดแทน" = green');
ok(has(h, 'yellow', 'จงใจหรือประมาทเลินเล่อ') && has(h, 'orange', 'ทำละเมิด'), 'civil 420: key phrase yellow, term orange');
h = R('criminal', '288'); ok(has(h, 'green', 'ต้องระวางโทษประหารชีวิต'), 'F criminal 288: "ต้องระวางโทษ…" = green');
h = R('criminal', '157'); ok(has(h, 'green', 'ต้องระวางโทษจำคุกตั้งแต่หนึ่งปีถึงสิบปี') && has(h, 'orange', 'เจ้าพนักงาน'), 'criminal 157: penalty green, เจ้าพนักงาน orange');
h = R('civpro', '4'); ok(has(h, 'blue', 'เว้นแต่จะมีบทบัญญัติเป็นอย่างอื่น'), 'D civpro 4: "เว้นแต่จะมีบทบัญญัติเป็นอย่างอื่น" = blue');
ok(has(h, 'orange', 'คําฟ้อง') && has(h, 'yellow', 'ให้เสนอต่อศาลที่จําเลยมีภูมิลําเนา'), 'civpro 4: terms orange, rule yellow');
for (const n of ['28', '30', '31']) { h = R('crimpro', n); ok(has(h, 'orange', 'พนักงานอัยการ'), 'C crimpro ' + n + ': พนักงานอัยการ = orange'); checkDom(h, A('crimpro', n), 'crimpro:' + n); }
h = R('crimpro', '78');
ok(has(h, 'pink', 'มาตรา ๘๐') && has(h, 'pink', 'มาตรา ๖๖') && has(h, 'pink', 'มาตรา ๑๑๗'), 'G crimpro 78: มาตรา ๘๐/๖๖/๑๑๗ = pink');
ok((h.match(/<a href="[^"]*" class="matra-ref-link">/g) || []).length === 3 && /<mark[^>]*codex-hl-pink[^>]*><a href="codex-article-viewer\.html\?id=crimpro_80"/.test(h), 'G crimpro 78: pink marks wrap working links');
ok(has(h, 'blue', 'เว้นแต่') && has(h, 'orange', 'พนักงานฝ่ายปกครองหรือตำรวจ'), 'crimpro 78: exception blue, actor orange');
h = R('criminal', '69'); ok(has(h, 'pink', 'มาตรา ๖๗') && has(h, 'blue', 'แต่ถ้าการกระทำนั้นเกิดขึ้นจากความตื่นเต้น') && has(h, 'green', 'ศาลจะไม่ลงโทษ'), 'criminal 69: pink + blue + green');
h = R('civil', '456');
ok(has(h, 'orange', 'ผู้ต้องรับผิด') && has(h, 'yellow', 'มีหลักฐานเป็นหนังสืออย่างหนึ่งอย่างใด') && has(h, 'yellow', 'เป็นสำคัญ'), 'civil 456: orange term SPLITS the yellow phrase into two yellow marks');
checkDom(h, A('civil', '456'), 'civil:456 (split)');

// quotes are no longer highlighted; only curated/pink is ever shown
const y = R('civpro', '1'); ok(marks(y) === 0, 'civpro 1 (quotes everywhere): quoted text is NOT highlighted');
ok(!/“/.test(strip(y)) === false, 'civpro 1 still shows its quotes as plain text');
const y2 = R('crimpro', '2'); ok([...colorsIn(y2)].every(c => c === 'pink'), 'crimpro 2 (starred, no curated entry): only pink refs');
checkDom(y2, A('crimpro', '2'), 'crimpro:2');
// global: starred in-scope article WITHOUT a curated entry / legacy list → only mechanical pink, never blind เว้นแต่
let scanned = 0, bad = 0;
V.AI_HL_BOOKS.forEach(b => Object.values(data.books[b].articles).forEach(a => {
  if (!a.examFreq || cur[b + ':' + a.number] || a.aiHighlights) return;
  const hh = R(b, a.number); scanned++;
  if (![...colorsIn(hh)].every(c => c === 'pink')) bad++;
}));
ok(scanned > 300 && bad === 0, 'no guessed colours on ' + scanned + ' uncurated starred articles (bad=' + bad + ')');
// legacy article.aiHighlights are key phrases -> yellow
const legacyArt = V.AI_HL_BOOKS.map(b => Object.values(data.books[b].articles).find(a => a.examFreq && a.aiHighlights)).find(Boolean);
if (legacyArt) { const bk = legacyArt.id.split('_')[0]; const hl = renderArticle(bk, legacyArt, 'auto', true, {}); ok(colorsIn(hl).has('yellow') && !colorsIn(hl).has('orange'), 'legacy aiHighlights render as yellow key phrases (' + legacyArt.id + ')'); }

// --- proposed entries for NON-starred articles: prove the semantics by injecting a fake star in memory ---
const fake = (b, n) => ({ ...A(b, n), examFreq: { count: 1, stars: 1 } });
const proposed = {
  'civil:453': { yellow: ['อันว่าซื้อขายนั้น คือสัญญาซึ่งบุคคลฝ่ายหนึ่ง เรียกว่าผู้ขาย โอนกรรมสิทธิ์แห่งทรัพย์สินให้แก่บุคคลอีกฝ่ายหนึ่ง'], orange: ['ผู้ขาย', 'ผู้ซื้อ'], green: ['ตกลงว่าจะใช้ราคาทรัพย์สินนั้น'] },
  'civil:587': { orange: ['ผู้รับจ้าง', 'ผู้ว่าจ้าง'], yellow: ['ตกลงจะทำการงานสิ่งใดสิ่งหนึ่งจนสำเร็จ'], green: ['ตกลงจะให้สินจ้างเพื่อผลสำเร็จแห่งการที่ทำนั้น'] },
  'civpro:2': { yellow: ['ห้ามมิให้เสนอคําฟ้องต่อศาลใด'], blue: ['เว้นแต่'] },
};
h = renderArticle('civil', fake('civil', '453'), 'auto', true, proposed);
ok(has(h, 'orange', 'ผู้ขาย') && has(h, 'orange', 'ผู้ซื้อ'), 'A civil 453 (injected star): ผู้ซื้อ / ผู้ขาย = orange');
ok(has(h, 'yellow', 'อันว่าซื้อขายนั้น') && has(h, 'yellow', 'โอนกรรมสิทธิ์'), 'A civil 453: definition phrase = yellow (split around orange ผู้ขาย)');
ok(!/“|"/.test(A('civil', '453').text) && marks(h) > 0, 'A civil 453 has no quotes at all, yet yellow appears (yellow is not quote-based)');
checkDom(h, A('civil', '453'), 'civil:453 (injected)');
h = renderArticle('civil', fake('civil', '587'), 'auto', true, proposed);
ok(has(h, 'orange', 'ผู้ว่าจ้าง') && has(h, 'orange', 'ผู้รับจ้าง'), 'B civil 587 (injected star): ผู้ว่าจ้าง = orange');
checkDom(h, A('civil', '587'), 'civil:587 (injected)');
h = renderArticle('civpro', fake('civpro', '2'), 'auto', true, proposed);
ok(has(h, 'yellow', 'ห้ามมิให้เสนอคําฟ้องต่อศาลใด') && has(h, 'blue', 'เว้นแต่'), 'E civpro 2 (injected star): key phrase yellow, เว้นแต่ blue');
checkDom(h, A('civpro', '2'), 'civpro:2 (injected)');

COLORS.forEach(c => ok(new RegExp('mark\\.codex-hl-' + c + '\\s*\\{[^}]*background').test(html), 'CSS rule for ' + c));

// H. non-starred / toggle off / manual
ok(marks(R('civil', '149')) === 0, 'H non-starred civil 149: no auto highlight');
ok(/ติดดาว/.test(els['hl-auto-status'].textContent), 'out-of-scope status message shown');
ok(marks(R('civil', '453')) === 0 && marks(R('civil', '587')) === 0 && marks(R('civpro', '2')) === 0, 'H real (non-starred) civil 453/587, civpro 2: no auto highlight');
ok(marks(R('civpro', '172')) === 0, 'non-starred civpro 172: no auto highlight');
ok(marks(R('crimpro', '157')) === 0, 'non-starred crimpro 157: no auto highlight');
ok(marks(R('civil', '420', 'auto', false)) === 0, 'highlight toggle OFF: no marks');
ok(marks(R('civil', '420', 'manual', true)) === 0, 'manual mode: no auto marks');
const mh = V.buildChunkHtml('ผู้ใดฆ่าผู้อื่น', [{ start: 0, end: 5, color: 'blue', id: 'hl1' }], 'criminal', '288', false);
ok(/class="codex-hl codex-hl-manual codex-hl-blue" data-hl-id="hl1"/.test(mh) && strip(mh) === 'ผู้ใดฆ่าผู้อื่น', 'manual highlight markup unchanged');

// ---- 4. fail-soft ---------------------------------------------------------------------
[null, undefined, [], 'x', 5, { 'civil:420': null }, { 'civil:420': { orange: 'notarray', bogus: ['x'] } }, { 'civil:420': { orange: [null, 3, '', 'ไม่มีอยู่จริงในมาตรา'] } }].forEach((bad, i) => {
  let hh; try { hh = renderArticle('civil', A('civil', '420'), 'auto', true, bad); } catch (e) { hh = null; }
  ok(hh !== null && strip(hh).length > 0, 'fail-soft bad index #' + i + ' renders');
  ok(hh !== null && marks(hh) === 0, 'bad index #' + i + ' -> no marks, no guessed colours');
});

// ---- 5. priority resolution --------------------------------------------------------------
ok(JSON.stringify(V.AI_HL_PRIORITY) === '["pink","blue","green","orange","yellow"]', 'priority order fixed: pink > blue > green > orange > yellow');
const T = 'ผู้ขายต้องใช้ราคาตามมาตรา ๑๕ เว้นแต่จะตกลงกัน';
const res = V.computeAutoHighlightsForChunk(T, [
  { start: 0, end: T.length, color: 'yellow' },
  { start: T.indexOf('ต้องใช้ราคา'), end: T.indexOf('ต้องใช้ราคา') + 60, color: 'green' },
  { start: 0, end: 6, color: 'orange' },
  { start: T.indexOf('เว้นแต่'), end: T.length, color: 'blue' },
].map(r => ({ ...r, end: Math.min(r.end, T.length) })));
ok(res.every((r, i) => i === 0 || res[i - 1].end <= r.start), 'overlaps: no overlapping ranges');
const at = s => res.find(r => r.start <= T.indexOf(s) && T.indexOf(s) < r.end);
ok(at('มาตรา ๑๕').color === 'pink', 'pink beats green/yellow');
ok(at('เว้นแต่').color === 'blue', 'blue beats yellow');
ok(at('ต้องใช้ราคา').color === 'green', 'green beats yellow');
ok(at('ผู้ขาย').color === 'orange', 'orange beats yellow');
ok(res.filter(r => r.color === 'yellow').length === 0 || res.filter(r => r.color === 'yellow').every(r => !/^\s|\s$/.test(T.slice(r.start, r.end))), 'yellow fragments trimmed');
const cy = V.computeAutoHighlightsForChunk('abc def', [{ start: 0, end: 3, color: 'yellow' }]);
ok(cy.length === 1 && cy[0].color === 'yellow', 'curated yellow supported');
ok(V.computeAutoHighlightsForChunk('“ข้อความ” เว้นแต่ ภายในสามสิบวัน', []).length === 0, 'quotes / เว้นแต่ / time limits are NOT matched mechanically');

// ---- 6. static wiring ---------------------------------------------------------------------
ok(/onclick="setHighlightViewMode\('auto'\)">🤖 AI Highlight</.test(html), 'AI Highlight button wired');
ok(/fetch\('codex-ai-highlights\.json[^']*'\)/.test(html) && /catch \(e\) \{ aiHighlightIndex = \{\}; \}/.test(html), 'curated file loaded with fail-soft catch');
['ส้ม = ศัพท์/บทบาททางกฎหมาย', 'เขียว = ผลทางกฎหมาย', 'เหลือง = คำสำคัญ/วลีสำคัญ'].forEach(t => ok(html.includes(t), 'auto legend: ' + t));
ok(!html.includes('เหลือง = ข้อความในเครื่องหมายคำพูด'), 'old quote legend removed');

console.log(fail ? `\n${fail} FAILED, ${pass} passed` : `\nALL PASSED (${pass})`);
process.exit(fail ? 1 : 0);
