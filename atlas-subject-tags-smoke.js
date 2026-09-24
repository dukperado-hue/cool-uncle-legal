/* Runtime smoke test for atlas-subject-tags.js + atlas-subject-tags.json.

   Verifies the Encyclopedia Subject Tags layer in isolation against a
   minimal DOM shim: registry load (both the real async fetch path and the
   fail-soft path), list/get lookups, pill rendering (known + unknown keys,
   dedupe, registry ordering), and the injected light/dark <style> block.
   Does NOT load atlas-core.js / atlas-concepts.js — this module has no
   dependency on either.
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
    this.attrs = {};
    this._text = '';
    this.parentNode = null;
  }
  set textContent(v) { this._text = String(v); this.childNodes = []; }
  get textContent() {
    if (this.childNodes.length) return this.childNodes.map(c => c.textContent).join('');
    return this._text;
  }
  set innerHTML(v) { throw new Error('innerHTML must not be used for subject-tag text'); }
  appendChild(c) { if (c && c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); if (c) c.parentNode = this; return c; }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); if (c) c.parentNode = null; return c; }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'class') this.className = String(v); }
  getAttribute(k) { if (k === 'class') return this.className || null; return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
  get children() { return this.childNodes.filter(n => n && n.nodeType === 1); }
}

const headEl = new El('head');
const documentObj = {
  head: headEl,
  // real DOM semantics: reflects the live tree, so a removeChild() actually
  // makes the element unfindable again (a flat side-dict would not)
  getElementById: (id) => headEl.children.find(c => c.id === id) || null,
  createElement: (t) => new El(t),
};

global.window = global;
global.document = documentObj;
global.fetch = undefined; // set per-test below

let pass = 0, fail = 0;
async function run(name, fn) {
  try { await fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message); }
}
function ok(c, msg) { if (!c) throw new Error(msg || 'expected truthy'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

require(path.join(ROOT, 'atlas-subject-tags.js'));
const AST = global.AtlasSubjectTags;
const TAGS_JSON = JSON.parse(fs.readFileSync(path.join(ROOT, 'atlas-subject-tags.json'), 'utf8'));

(async () => {

// ================================================================ 1. registry shape
await run('1. atlas-subject-tags.json defines 15 tags, each with key/titleTH/order/hue', () => {
  eq(TAGS_JSON.tags.length, 15, 'fifteen tags');
  TAGS_JSON.tags.forEach(t => {
    ok(typeof t.key === 'string' && t.key.length > 0, 'key present: ' + JSON.stringify(t));
    ok(typeof t.titleTH === 'string' && t.titleTH.length > 0, 'titleTH present for ' + t.key);
    ok(typeof t.order === 'number', 'order present for ' + t.key);
    ok(typeof t.hue === 'number' && t.hue >= 0 && t.hue < 360, 'hue in range for ' + t.key);
  });
  const keys = TAGS_JSON.tags.map(t => t.key);
  eq(new Set(keys).size, keys.length, 'all keys unique');
});

// ================================================================ 2. an unavailable registry fails soft
await run('2. an unavailable/failed registry load fails soft to an empty-but-usable module', async () => {
  AST._internal.reset();
  global.fetch = undefined;
  const doc = await AST.load('atlas-subject-tags.json');
  ok(doc === null, 'doc is null when fetch is unavailable');
  eq(AST.list().length, 0, 'list() empty');
  eq(AST.get('obligations'), null, 'get() returns null');
  const c = new El('div');
  const n = AST.renderInto(c, ['obligations']);
  eq(n, 0, 'renderInto renders nothing without a loaded registry');
  eq(c.children.length, 0, 'container stays empty');
});

// ================================================================ 3. real load via a fake fetch
await run('3. load() populates list()/get() from a real fetch, and is a lazy singleton', async () => {
  AST._internal.reset();
  let fetchCalls = 0;
  global.fetch = (url) => {
    fetchCalls++;
    eq(url, 'atlas-subject-tags.json', 'fetch called with the given URL');
    return Promise.resolve({ ok: true, json: () => Promise.resolve(TAGS_JSON) });
  };
  const p1 = AST.load('atlas-subject-tags.json');
  const p2 = AST.load('atlas-subject-tags.json');
  ok(p1 === p2, 'second load() call returns the SAME promise (lazy singleton, no re-fetch)');
  await p1;
  eq(fetchCalls, 1, 'fetch invoked exactly once');
  eq(AST.list().length, 15, 'list length');
  ok(AST.list().every((t, i, arr) => i === 0 || arr[i - 1].order <= t.order), 'list() is order-sorted');
  const g = AST.get('tort');
  ok(g && g.titleTH === 'ละเมิด', 'get(tort) resolves titleTH');
  eq(AST.get('does-not-exist'), null, 'get() unknown key -> null');
});

// ================================================================ 4. renderInto behaviour (registry still loaded from test 3)
await run('4. renderInto renders known keys as pills, in registry order, deduped, skipping unknown keys', () => {
  const c = new El('div');
  const n = AST.renderInto(c, ['tort', 'obligations', 'tort', 'not-a-real-key', 'administrative']);
  eq(n, 3, 'three known keys rendered (dup + unknown ignored)');
  eq(c.children.length, 3, 'three pill elements appended');
  const order = c.children.map(el => el.getAttribute('data-tag'));
  eq(JSON.stringify(order), JSON.stringify(['obligations', 'administrative', 'tort']), 'registry order, not caller order');
  c.children.forEach(el => {
    eq(el.className, 'atlas-subject-tag', 'pill has the shared class');
    ok(el.getAttribute('data-tag'), 'pill has a data-tag attribute');
  });
  const titles = c.children.map(el => el.textContent);
  ok(titles.indexOf('ละเมิด') !== -1 && titles.indexOf('หนี้') !== -1, 'pill text is the Thai titleTH, not the raw key');
});

await run('4b. renderInto is a no-op for empty/undefined input and never throws', () => {
  const c = new El('div');
  eq(AST.renderInto(c, []), 0, 'empty array -> 0');
  eq(AST.renderInto(c, null), 0, 'null -> 0');
  eq(AST.renderInto(null, ['tort']), 0, 'null container -> 0, no throw');
  eq(c.children.length, 0, 'nothing appended');
});

// ================================================================ 5. injected style (registry still loaded from test 3)
await run('5. ensureStyle injects exactly one <style> covering every key, light + dark', () => {
  const style = documentObj.getElementById('atlas-subject-tags-style');
  ok(style, 'style element present');
  const css = style.textContent;
  ok(/\.atlas-subject-tag\{/.test(css), 'base pill rule present');
  TAGS_JSON.tags.forEach(t => {
    const sel = '.atlas-subject-tag[data-tag="' + t.key + '"]';
    ok(css.indexOf(sel) !== -1, 'light rule for ' + t.key);
  });
  ok(/prefers-color-scheme:dark/.test(css), 'dark media query present');
  ok(/data-theme="dark"/.test(css), 'explicit dark-theme override present');
  ok(!/\.innerHTML\s*=/.test(fs.readFileSync(path.join(ROOT, 'atlas-subject-tags.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')),
     'module source never assigns innerHTML');
});

await run('5b. ensureStyle does not inject a second <style> element on repeated calls', () => {
  const countStyles = () => headEl.children.filter(c => c.id === 'atlas-subject-tags-style').length;
  eq(countStyles(), 1, 'style already present from test 3\'s load()');
  AST._internal.ensureStyle();
  AST._internal.ensureStyle();
  eq(countStyles(), 1, 'still exactly one style element');
});

// ================================================================ 6. reset()
await run('6. _internal.reset() clears state and removes the injected style', () => {
  AST._internal.reset();
  eq(AST.list().length, 0, 'list empty after reset');
  eq(documentObj.getElementById('atlas-subject-tags-style'), null, 'style removed after reset');
});

console.log('\n----------------------------------------');
console.log('  RESULT:  ' + pass + ' passed, ' + fail + ' failed');
console.log('----------------------------------------');
process.exit(fail ? 1 : 0);

})();
