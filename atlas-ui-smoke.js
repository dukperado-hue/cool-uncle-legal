/* Runtime smoke test for atlas-ui.js using a minimal DOM shim.
   Catches ReferenceErrors / bad property access across every render path. */
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || __dirname;

// ---- minimal DOM shim -------------------------------------------------
class El {
  constructor(tag) { this.tagName = String(tag).toUpperCase(); this.children = [];
    this.className = ''; this.dataset = {}; this.style = {}; this._text = '';
    this.hidden = false; this.attrs = {}; this.href = ''; this.type = ''; }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text || this.children.map(c => c.textContent).join(''); }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  get innerHTML() { return this._html || ''; }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  get firstChild() { return this.children[0] || null; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  addEventListener() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
}
global.document = {
  createElement: (t) => new El(t),
  getElementById: () => new El('div'),
  addEventListener: () => {},
};
global.window = global;
global.location = { hash: '', search: '' };
global.history = { replaceState: () => {} };
global.window.scrollTo = () => {};
global.window.addEventListener = () => {};

require(path.join(ROOT, 'atlas-patches.js'));
require(path.join(ROOT, 'atlas-core.js'));
require(path.join(ROOT, 'atlas-ui.js'));
const AtlasCore = global.AtlasCore, AtlasUI = global.AtlasUI;

AtlasCore.setRegistry(JSON.parse(fs.readFileSync(path.join(ROOT, 'collections-registry.json'), 'utf8')));
AtlasCore.attachCorpus(JSON.parse(fs.readFileSync(path.join(ROOT, 'codex-data.json'), 'utf8')));

let pass = 0, fail = 0;
function run(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '  — ' + e.message + '\n' + (e.stack||'').split('\n')[1]); }
}

const root = new El('div');

run('home view renders (subject areas + collection cards)', () => {
  global.location.hash = '#/';
  AtlasUI.mount(root);
  if (!root.children.length) throw new Error('empty root');
});

run('collection view — civil (4-level tree)', () => {
  global.location.hash = '#/c/civil';
  AtlasUI.mount(root);
});
run('collection view — criminal', () => { global.location.hash = '#/c/criminal'; AtlasUI.mount(root); });
run('collection view — const2560', () => { global.location.hash = '#/c/const2560'; AtlasUI.mount(root); });
run('collection view — tortofficials (flat)', () => { global.location.hash = '#/c/tortofficials'; AtlasUI.mount(root); });

run('every enabled collection renders without throwing', () => {
  for (const c of AtlasCore.listCollections()) {
    global.location.hash = '#/c/' + c.key;
    AtlasUI.mount(root);
  }
});

run('unknown route falls back to home', () => {
  global.location.hash = '#/c/nonexistent';
  AtlasUI.mount(root);
});

run('parseRoute understands #/c/<c>/i/<i>', () => {
  global.location.hash = '#/c/aviation/i/act';
  const r = AtlasUI.parseRoute();
  if (r.view !== 'instrument' || r.collection !== 'aviation' || r.instrument !== 'act')
    throw new Error(JSON.stringify(r));
});

console.log('\n  ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
