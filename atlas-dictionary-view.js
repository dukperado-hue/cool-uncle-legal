/* ============================================================================
 * atlas-dictionary-view.js  —  Thai Legal Atlas · Dictionary panel (D1)
 * ----------------------------------------------------------------------------
 * A small STANDALONE, read-only panel for atlas.html that lists the D1
 * Dictionary (atlas-dictionary.json): English ↔ Thai legal terminology.
 *
 * It is a terminology OVERLAY only. It never owns provisions, subject tags or
 * concept metadata: the only link it draws is the optional conceptRef, which
 * points at an EXISTING Atlas concept page (concept.html?k=<slug>).
 *
 * Progressive enhancement: collapsed by default, the JSON is fetched only the
 * first time the panel is opened, and any failure renders a soft message —
 * the rest of the Atlas page is never affected.
 *
 * Public API:  AtlasDictionaryView.mount(el, { url })
 * ========================================================================== */
(function (global) {
  'use strict';

  var KIND_LABEL = {
    term: 'ศัพท์', collocation: 'วลี', usage: 'คำที่ใช้ในบริบท',
    latin: 'ละติน', structure: 'โครงสร้างตัวบท', profession: 'อาชีพ/ตำแหน่ง'
  };
  var SRC_LABEL = {
    handout: 'เอกสารประกอบ', slides: 'สไลด์', oldexam: 'ข้อสอบเก่า',
    textbook: 'ตำรา', 'lecture-audio': 'เสียงบรรยาย', 'course-spec': 'แผนรายวิชา'
  };
  var CONCEPT_PREFIX = 'atlas:concept/';

  var CSS =
    '.atlas-dict{margin:var(--s4,16px) 0;border:1px solid var(--line,#e6e1d6);border-radius:var(--radius,10px);background:var(--panel,#fff)}' +
    '.atlas-dict>summary{cursor:pointer;padding:var(--s3,12px) var(--s4,16px);font-weight:600;list-style:none}' +
    '.atlas-dict>summary::-webkit-details-marker{display:none}' +
    '.atlas-dict-sub{font-weight:400;font-size:12.5px;color:var(--muted,#5b6472);margin-left:8px}' +
    '.atlas-dict-body{padding:0 var(--s4,16px) var(--s4,16px)}' +
    '.atlas-dict-bar{display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 12px}' +
    '.atlas-dict-bar input,.atlas-dict-bar select{font:inherit;font-size:14px;padding:7px 10px;border:1px solid var(--line,#e6e1d6);border-radius:8px;background:var(--bg,#FBF9F4);color:var(--ink,#1f2430)}' +
    '.atlas-dict-bar input{flex:1 1 220px;min-width:0}' +
    '.atlas-dict-count{font-size:12px;color:var(--muted,#5b6472);margin-bottom:6px}' +
    '.atlas-dict-list{list-style:none;margin:0;padding:0}' +
    '.atlas-dict-row{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:4px 16px;padding:9px 0;border-top:1px solid var(--line,#e6e1d6)}' +
    '.atlas-dict-en{font-weight:600}' +
    '.atlas-dict-th{color:var(--ink,#1f2430)}' +
    '.atlas-dict-meta{grid-column:1 / -1;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:11.5px;color:var(--muted,#5b6472)}' +
    '.atlas-dict-chip{background:var(--chip,#f2ede1);border-radius:999px;padding:1px 8px}' +
    '.atlas-dict-empty,.atlas-dict-err{padding:12px 0;color:var(--muted,#5b6472);font-size:13px}' +
    '@media (max-width:760px){.atlas-dict-row{grid-template-columns:1fr}}';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fold(s) {
    return String(s || '').toLowerCase().replace(/[่-์]/g, '').replace(/\s+/g, ' ');
  }

  function injectCss() {
    if (document.getElementById('atlas-dict-css')) return;
    var st = document.createElement('style');
    st.id = 'atlas-dict-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function mount(host, opts) {
    if (!host) return;
    opts = opts || {};
    var url = opts.url || 'atlas-dictionary.json';
    injectCss();

    var box = el('details', 'atlas-dict');
    var sum = el('summary', null, '📖 พจนานุกรมศัพท์กฎหมาย · Dictionary');
    var sub = el('span', 'atlas-dict-sub', 'ศัพท์อังกฤษ ↔ ไทย พร้อมแหล่งที่มา');
    sum.appendChild(sub);
    var body = el('div', 'atlas-dict-body');
    box.appendChild(sum);
    box.appendChild(body);
    host.appendChild(box);

    var loaded = false;
    box.addEventListener('toggle', function () {
      if (!box.open || loaded) return;
      loaded = true;
      body.appendChild(el('div', 'atlas-dict-empty', 'กำลังโหลด…'));
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error(url + ' ' + r.status);
        return r.json();
      }).then(function (doc) {
        render(body, doc && doc.entries || []);
        sub.textContent = (doc.entries || []).length + ' คำ · ศัพท์อังกฤษ ↔ ไทย พร้อมแหล่งที่มา';
      }).catch(function (err) {
        body.textContent = '';
        body.appendChild(el('div', 'atlas-dict-err', 'โหลดพจนานุกรมไม่สำเร็จ: ' + String(err && err.message || err)));
        loaded = false;
      });
    });
  }

  function render(body, entries) {
    body.textContent = '';
    var bar = el('div', 'atlas-dict-bar');
    var q = el('input');
    q.type = 'search';
    q.placeholder = 'ค้นศัพท์ — พิมพ์ภาษาอังกฤษหรือไทย';
    q.setAttribute('aria-label', 'ค้นพจนานุกรม');
    var kindSel = el('select');
    kindSel.setAttribute('aria-label', 'กรองตามประเภท');
    var all = el('option', null, 'ทุกประเภท');
    all.value = '';
    kindSel.appendChild(all);
    Object.keys(KIND_LABEL).forEach(function (k) {
      if (!entries.some(function (e) { return e.kind === k; })) return;
      var o = el('option', null, KIND_LABEL[k]);
      o.value = k;
      kindSel.appendChild(o);
    });
    bar.appendChild(q);
    bar.appendChild(kindSel);
    var count = el('div', 'atlas-dict-count');
    var list = el('ul', 'atlas-dict-list');
    body.appendChild(bar);
    body.appendChild(count);
    body.appendChild(list);

    var index = entries.map(function (e) {
      return { e: e, hay: fold(e.en + ' ' + (e.th || []).join(' ')) };
    });

    function row(e) {
      var li = el('li', 'atlas-dict-row');
      li.appendChild(el('div', 'atlas-dict-en', e.en));
      li.appendChild(el('div', 'atlas-dict-th', (e.th || []).join(' · ')));
      var meta = el('div', 'atlas-dict-meta');
      meta.appendChild(el('span', 'atlas-dict-chip', KIND_LABEL[e.kind] || e.kind));
      var seen = {};
      (e.sources || []).forEach(function (s) {
        if (seen[s.kind]) return;
        seen[s.kind] = 1;
        var c = el('span', 'atlas-dict-chip', SRC_LABEL[s.kind] || s.kind);
        c.title = s.file;
        meta.appendChild(c);
      });
      if (e.conceptRef && String(e.conceptRef).indexOf(CONCEPT_PREFIX) === 0) {
        var a = el('a', null, 'ดูแนวคิดที่เกี่ยวข้อง →');
        a.href = 'concept.html?k=' + encodeURIComponent(e.conceptRef.slice(CONCEPT_PREFIX.length));
        meta.appendChild(a);
      }
      li.appendChild(meta);
      return li;
    }

    function draw() {
      var needle = fold(q.value).trim();
      var kind = kindSel.value;
      var hits = index.filter(function (x) {
        return (!kind || x.e.kind === kind) && (!needle || x.hay.indexOf(needle) !== -1);
      });
      list.textContent = '';
      hits.forEach(function (x) { list.appendChild(row(x.e)); });
      if (!hits.length) list.appendChild(el('li', 'atlas-dict-empty', 'ไม่พบศัพท์ที่ตรงกับคำค้น'));
      count.textContent = hits.length + ' / ' + entries.length + ' คำ';
    }
    q.addEventListener('input', draw);
    kindSel.addEventListener('change', draw);
    draw();
  }

  global.AtlasDictionaryView = { mount: mount };
})(window);
