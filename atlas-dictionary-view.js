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
 * Public API:  AtlasDictionaryView.mount(el, { url })            — one collapsed legal panel
 *              AtlasDictionaryView.mountPage(el, { volumes })  — dictionary.html: tabbed volumes
 * ========================================================================== */
(function (global) {
  'use strict';

  var KIND_LABEL = {
    term: 'ศัพท์', collocation: 'วลี', usage: 'คำที่ใช้ในบริบท',
    latin: 'ละติน', structure: 'โครงสร้างตัวบท', profession: 'อาชีพ/ตำแหน่ง'
  };
  var SRC_LABEL = {
    handout: 'เอกสารประกอบ', slides: 'สไลด์', oldexam: 'ข้อสอบเก่า',
    textbook: 'ตำรา', 'lecture-audio': 'เสียงบรรยาย', 'course-spec': 'แผนรายวิชา',
    'lecture-page': 'หน้าบรรยายวิชา'
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

  // ------------------------------------------------------------------
  // dictionary.html — tabbed volumes (กฎหมาย · คำย่อ aviation · aviation)
  // ------------------------------------------------------------------
  var PAGE_CSS =
    '.atlas-dv-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}' +
    '.atlas-dv-tab{font:inherit;font-size:14px;font-weight:600;padding:8px 14px;border:1px solid var(--line,#e6e1d6);border-radius:999px;background:var(--panel,#fff);color:var(--ink,#1f2430);cursor:pointer}' +
    '.atlas-dv-tab[aria-selected="true"]{background:var(--accent,#2E4A7A);color:#fff;border-color:var(--accent,#2E4A7A)}' +
    '.atlas-dv-note{margin:0 0 12px;padding:8px 12px;border-left:3px solid var(--muted,#5b6472);background:var(--chip,#f2ede1);border-radius:6px;font-size:12.5px;color:var(--muted,#5b6472)}' +
    '.atlas-dv-panel .atlas-dict-body{padding:0}' +
    '.atlas-dv-more{display:block;margin:12px auto 0;font:inherit;font-size:13px;padding:7px 16px;border:1px solid var(--line,#e6e1d6);border-radius:8px;background:var(--panel,#fff);color:var(--ink,#1f2430);cursor:pointer}' +
    '.atlas-dv-ctx{grid-column:1 / -1;font-size:12.5px;color:var(--muted,#5b6472)}' +
    '.atlas-dv-mean{margin:0 0 4px}.atlas-dv-mean-th{color:var(--ink,#1f2430)}' +
    '.atlas-dv-abbr{font-weight:700;font-variant-numeric:tabular-nums}' +
    '.atlas-dict-chip a{color:inherit}';
  var PAGE = 150;

  function srcChips(meta, ids, into) {
    (ids || []).slice(0, 4).forEach(function (id) {
      var url = meta && meta.sources && meta.sources[id];
      var c = el('span', 'atlas-dict-chip');
      if (url) {
        var a = el('a', null, 'ทอ. #' + id);
        a.href = url; a.target = '_blank'; a.rel = 'noopener';
        c.appendChild(a);
      } else c.textContent = 'ทอ. #' + id;
      into.appendChild(c);
    });
    if (ids && ids.length > 4) into.appendChild(el('span', 'atlas-dict-chip', '+' + (ids.length - 4)));
  }

  // generic searchable, paged list for the two aviation volumes
  function renderFlat(body, doc, spec) {
    var entries = doc.entries || [];
    body.textContent = '';
    if (doc.note) body.appendChild(el('div', 'atlas-dv-note', '⚠️ ' + doc.note));
    var bar = el('div', 'atlas-dict-bar');
    var q = el('input'); q.type = 'search'; q.placeholder = spec.placeholder;
    q.setAttribute('aria-label', 'ค้นพจนานุกรม');
    bar.appendChild(q);
    var onlyTh = null;
    if (spec.thFilter) {
      onlyTh = el('select'); onlyTh.setAttribute('aria-label', 'กรองตามคำแปลไทย');
      [['', 'ทั้งหมด'], ['th', 'มีคำแปลไทย']].forEach(function (o) {
        var op = el('option', null, o[1]); op.value = o[0]; onlyTh.appendChild(op);
      });
      bar.appendChild(onlyTh);
    }
    var count = el('div', 'atlas-dict-count');
    var list = el('ul', 'atlas-dict-list');
    var more = el('button', 'atlas-dv-more', 'แสดงเพิ่ม'); more.type = 'button';
    body.appendChild(bar); body.appendChild(count); body.appendChild(list); body.appendChild(more);
    var index = entries.map(function (e) { return { e: e, hay: fold(spec.hay(e)), th: spec.hasTh(e) }; });
    var hits = [], shown = 0;
    function drawMore() {
      hits.slice(shown, shown + PAGE).forEach(function (x) { list.appendChild(spec.row(x.e, doc)); });
      shown = Math.min(hits.length, shown + PAGE);
      more.hidden = shown >= hits.length;
      count.textContent = hits.length.toLocaleString('th-TH') + ' / ' + entries.length.toLocaleString('th-TH') + ' รายการ' +
        (hits.length > shown ? ' · แสดง ' + shown : '');
    }
    function draw() {
      var needle = fold(q.value).trim();
      var th = onlyTh && onlyTh.value === 'th';
      hits = index.filter(function (x) { return (!th || x.th) && (!needle || x.hay.indexOf(needle) !== -1); });
      list.textContent = ''; shown = 0;
      if (!hits.length) {
        list.appendChild(el('li', 'atlas-dict-empty', 'ไม่พบรายการที่ตรงกับคำค้น'));
        more.hidden = true; count.textContent = '0 / ' + entries.length; return;
      }
      drawMore();
    }
    more.addEventListener('click', drawMore);
    q.addEventListener('input', draw);
    if (onlyTh) onlyTh.addEventListener('change', draw);
    draw();
  }

  var SPEC = {
    abbr: {
      placeholder: 'ค้นคำย่อหรือคำเต็ม — เช่น NDI, hydraulic',
      hay: function (e) { return e.abbr + ' ' + e.meanings.map(function (m) { return m.en + ' ' + (m.th || []).join(' '); }).join(' '); },
      hasTh: function (e) { return e.meanings.some(function (m) { return m.th && m.th.length; }); },
      row: function (e, doc) {
        var li = el('li', 'atlas-dict-row');
        li.appendChild(el('div', 'atlas-dv-abbr', e.abbr));
        var right = el('div', 'atlas-dict-th');
        e.meanings.forEach(function (m) {
          var d = el('div', 'atlas-dv-mean');
          d.appendChild(el('span', null, m.en));
          if (m.th && m.th.length) d.appendChild(el('span', 'atlas-dv-mean-th', ' — ' + m.th.join(' · ')));
          right.appendChild(d);
        });
        li.appendChild(right);
        var meta = el('div', 'atlas-dict-meta');
        if (e.meanings.length > 1) meta.appendChild(el('span', 'atlas-dict-chip', e.meanings.length + ' ความหมาย'));
        var ids = [];
        e.meanings.forEach(function (m) { (m.src || []).forEach(function (s) { if (ids.indexOf(s) === -1) ids.push(s); }); });
        srcChips(doc, ids, meta);
        li.appendChild(meta);
        return li;
      }
    },
    terms: {
      placeholder: 'ค้นศัพท์ — พิมพ์ภาษาอังกฤษหรือไทย',
      thFilter: true,
      hay: function (e) { return e.en + ' ' + (e.th || []).join(' ') + ' ' + (e.ctx || ''); },
      hasTh: function (e) { return !!(e.th && e.th.length); },
      row: function (e, doc) {
        var li = el('li', 'atlas-dict-row');
        li.appendChild(el('div', 'atlas-dict-en', e.en));
        li.appendChild(el('div', 'atlas-dict-th', (e.th || []).join(' · ')));
        if (e.ctx) li.appendChild(el('div', 'atlas-dv-ctx', e.ctx));
        var meta = el('div', 'atlas-dict-meta');
        srcChips(doc, e.src, meta);
        li.appendChild(meta);
        return li;
      }
    }
  };

  function mountPage(host, opts) {
    if (!host) return;
    opts = opts || {};
    var vols = opts.volumes || [];
    injectCss();
    if (!document.getElementById('atlas-dv-css')) {
      var st = document.createElement('style'); st.id = 'atlas-dv-css'; st.textContent = PAGE_CSS;
      document.head.appendChild(st);
    }
    var tabs = el('div', 'atlas-dv-tabs'); tabs.setAttribute('role', 'tablist');
    var panel = el('div', 'atlas-dv-panel'); panel.setAttribute('role', 'tabpanel');
    host.appendChild(tabs); host.appendChild(panel);
    var cache = {}, btns = {};

    function load(v) {
      if (cache[v.id]) return cache[v.id];
      cache[v.id] = fetch(v.url).then(function (r) {
        if (!r.ok) throw new Error(v.url + ' ' + r.status);
        return r.json();
      });
      cache[v.id].catch(function () { delete cache[v.id]; });
      return cache[v.id];
    }
    function select(v) {
      vols.forEach(function (x) { btns[x.id].setAttribute('aria-selected', String(x === v)); });
      try { history.replaceState(null, '', '#' + v.id); } catch (e) { /* ignore */ }
      panel.textContent = '';
      var body = el('div', 'atlas-dict-body');
      body.appendChild(el('div', 'atlas-dict-empty', 'กำลังโหลด…'));
      panel.appendChild(body);
      load(v).then(function (doc) {
        if (btns[v.id].getAttribute('aria-selected') !== 'true') return;
        if (v.type === 'law') render(body, doc.entries || []);
        else renderFlat(body, doc, SPEC[v.type]);
        btns[v.id].textContent = v.title + ' (' + (doc.entries || []).length.toLocaleString('th-TH') + ')';
      }).catch(function (err) {
        body.textContent = '';
        body.appendChild(el('div', 'atlas-dict-err', 'โหลดพจนานุกรมไม่สำเร็จ: ' + String(err && err.message || err)));
      });
    }
    vols.forEach(function (v) {
      var b = el('button', 'atlas-dv-tab', v.title); b.type = 'button'; b.setAttribute('role', 'tab');
      b.title = v.sub || '';
      b.addEventListener('click', function () { select(v); });
      tabs.appendChild(b); btns[v.id] = b;
    });
    var want = (location.hash || '').replace('#', '');
    select(vols.filter(function (v) { return v.id === want; })[0] || vols[0]);
  }

  global.AtlasDictionaryView = { mount: mount, mountPage: mountPage };
})(window);
