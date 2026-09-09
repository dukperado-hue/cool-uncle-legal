/* ============================================================================
 * atlas-encyclopedia.js  —  Thai Legal Atlas · Encyclopedia (FINALIZATION 3)
 * ----------------------------------------------------------------------------
 * The human-friendly DISCOVERY layer over the existing Legal Concept layer.
 *
 *   Atlas answers   "กฎหมายนี้อยู่ตรงไหน?"      (structural tree)
 *   Encyclopedia answers  "คำนี้คืออะไร และเชื่อมกับอะไรบ้าง?"
 *
 * STANDALONE / ADDITIVE — same contract as atlas-cases.js / atlas-clusters.js /
 * atlas-provision-view.js / atlas-concepts.js:
 *
 *   - single source of truth = atlas-concepts.json, read through
 *     AtlasConcepts.load() (the SAME cached fetch the concept pages use).
 *     Nothing here is a second concept dataset. This module only builds
 *     DERIVED presentation structures: a term list, an alphabetical index,
 *     and a search filter over them.
 *   - never mutates AtlasCore / AtlasConcepts / AtlasUI, never calls their
 *     internals except the documented public surface
 *     (AtlasConcepts.load, AtlasConcepts._internal.collectPlanned,
 *      AtlasCore.getRegistry for subject-area labels).
 *   - never touches location.hash or the Atlas route grammar. It records the
 *     active search term in a ?q= SEARCH-STRING param via history.replaceState
 *     (no events, hash untouched) so a search is a shareable / refreshable URL.
 *   - every concept link is the FROZEN concept-entry URL
 *     concept.html?k=<slug>  — the Encyclopedia is the front door, the
 *     existing concept page is the entry.
 *   - textContent only, never innerHTML with data. Fails soft.
 *
 * Classic script (no ES modules). Exposes window.AtlasEncyclopedia.
 * Host page: encyclopedia.html
 * ==========================================================================*/
(function (global) {
  'use strict';

  var STYLE_ID = 'atlas-encyclopedia-style';
  var CONCEPT_URL = 'concept.html?k=';
  var DEFAULT_DATA = 'atlas-concepts.json';

  var doc = global.document;

  // Thai consonant dictionary order (ฤ/ฦ folded next to ร/ล for sorting only).
  var THAI_ORDER = 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮ';
  var PREPOSED_VOWELS = 'เแโใไ';
  var AZ_BUCKET = 'A–Z';

  // ================================================================
  // tiny DOM helpers
  // ================================================================
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function append(p, c) { if (p && c) p.appendChild(c); return p; }

  // ================================================================
  // Thai-aware alphabetical grouping (deliberately lightweight)
  // ================================================================
  // First "sortable" character of a term:
  //   - a leading preposed vowel (เ แ โ ใ ไ) is skipped to the consonant after
  //     it, matching Thai dictionary order
  //   - a Thai consonant → that consonant
  //   - a Latin letter → null  (goes to the A–Z bucket)
  function thaiInitial(s) {
    s = String(s == null ? '' : s).trim();
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (PREPOSED_VOWELS.indexOf(ch) !== -1) continue;
      if (ch >= 'ก' && ch <= 'ฮ') return ch;
      if (/[A-Za-z]/.test(ch)) return null;
      // punctuation / quotes / spaces / digits → keep scanning
    }
    return null;
  }

  function groupKey(term) {
    var init = thaiInitial(term);
    return init == null ? AZ_BUCKET : init;
  }

  function groupRank(key) {
    if (key === AZ_BUCKET) return 9999;
    var idx = THAI_ORDER.indexOf(key);
    return idx === -1 ? 9998 : idx;
  }

  function termCompare(a, b) {
    var x = String(a || ''), y = String(b || '');
    try {
      var c = x.localeCompare(y, 'th');
      if (c) return c;
    } catch (e) { /* no Intl 'th' — fall through */ }
    return x < y ? -1 : (x > y ? 1 : 0);
  }

  function norm(s) { return String(s == null ? '' : s).toLowerCase().trim(); }

  // ================================================================
  // build the derived term index from the concept document
  // ================================================================
  // One entry per searchable term. kind:
  //   'primary'  the concept's Thai name        (canonical, bold)
  //   'alias'    an alternate Thai name         (→ points at the primary)
  //   'en'       an English legal equivalent    (→ points at the primary)
  //   'latin'    a curated Latin legal term     (→ points at the primary)
  function buildIndex(conceptDoc) {
    var concepts = (conceptDoc && conceptDoc.concepts) || {};
    var entries = [];
    var seen = {}; // dedupe identical (kind|term|slug)

    function push(term, kind, c, slug) {
      term = String(term == null ? '' : term).trim();
      if (!term) return;
      var key = kind + '|' + norm(term) + '|' + slug;
      if (seen[key]) return;
      seen[key] = 1;
      entries.push({
        term: term,
        kind: kind,
        slug: slug,
        titleTH: c.titleTH || slug,
        summary: c.summary || (c.definition && c.definition.text) || '',
        subjectAreas: c.subjectAreas || []
      });
    }

    Object.keys(concepts).forEach(function (slug) {
      var c = concepts[slug];
      if (!c || c.status !== 'published') return;
      push(c.titleTH, 'primary', c, slug);
      (c.aliases || []).forEach(function (a) { push(a, 'alias', c, slug); });
      // titleEN may bundle several equivalents joined by " · "
      String(c.titleEN || '').split('·').forEach(function (t) { push(t, 'en', c, slug); });
      (c.latin || []).forEach(function (t) { push(t, 'latin', c, slug); });
    });

    entries.sort(function (a, b) {
      var g = groupRank(groupKey(a.term)) - groupRank(groupKey(b.term));
      if (g) return g;
      var t = termCompare(a.term, b.term);
      if (t) return t;
      // stable-ish: primary before its aliases
      var order = { primary: 0, alias: 1, en: 2, latin: 3 };
      return (order[a.kind] || 9) - (order[b.kind] || 9);
    });
    return entries;
  }

  // entries -> [{ key, rank, entries[] }]  (alphabetical groups, in order)
  function groupEntries(entries) {
    var buckets = {};
    entries.forEach(function (e) {
      var k = groupKey(e.term);
      (buckets[k] = buckets[k] || []).push(e);
    });
    return Object.keys(buckets)
      .map(function (k) { return { key: k, rank: groupRank(k), entries: buckets[k] }; })
      .sort(function (a, b) { return a.rank - b.rank; });
  }

  // substring match on the term itself or the concept it points to
  function search(entries, q) {
    var n = norm(q);
    if (!n) return entries.slice();
    return entries.filter(function (e) {
      return norm(e.term).indexOf(n) !== -1 || norm(e.titleTH).indexOf(n) !== -1;
    }).sort(function (a, b) {
      // prefix hits first, then alphabetical
      var ap = norm(a.term).indexOf(n) === 0 ? 0 : 1;
      var bp = norm(b.term).indexOf(n) === 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return termCompare(a.term, b.term);
    });
  }

  // ================================================================
  // rendering
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var css =
      '.atlas-enc{max-width:680px;margin:0 auto}' +
      '.atlas-enc-crumbs{font-size:12.5px;color:var(--muted);display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 16px}' +
      '.atlas-enc-crumb-sep{opacity:.45}' +
      '.atlas-enc-head{margin:0 0 20px}' +
      '.atlas-enc-title{margin:0 0 6px;font-size:24px;font-weight:700;letter-spacing:-.01em}' +
      '.atlas-enc-intro{margin:0;font-size:14px;line-height:1.8;color:var(--muted)}' +
      '.atlas-enc-search{position:sticky;top:0;background:var(--bg);padding:12px 0 10px;margin:0 0 8px;z-index:2;' +
        'border-bottom:1px solid var(--line)}' +
      '.atlas-enc-input{width:100%;font:inherit;font-size:15px;padding:10px 14px;border:1px solid var(--line);' +
        'border-radius:10px;background:var(--panel);color:var(--ink)}' +
      '.atlas-enc-input:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:var(--accent)}' +
      '.atlas-enc-count{font-size:12px;color:var(--muted);margin:2px 2px 12px}' +
      '.atlas-enc-jump{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 16px}' +
      '.atlas-enc-jump a{font-size:12px;padding:2px 8px;border:1px solid var(--line);border-radius:6px;color:var(--accent);' +
        'font-variant-numeric:tabular-nums}' +
      '.atlas-enc-jump a:hover{background:var(--accent-soft);text-decoration:none}' +
      '.atlas-enc-group{margin:0 0 20px}' +
      '.atlas-enc-letter{margin:0 0 6px;font-size:15px;font-weight:700;color:var(--accent);' +
        'border-bottom:1px solid var(--line);padding-bottom:3px}' +
      '.atlas-enc-list{list-style:none;margin:0;padding:0}' +
      '.atlas-enc-entry{padding:6px 0;border-bottom:1px solid var(--line);line-height:1.55;overflow-wrap:break-word}' +
      '.atlas-enc-entry:last-child{border-bottom:0}' +
      '.atlas-enc-term{font-size:15px;font-weight:700}' +
      '.atlas-enc-entry.is-secondary .atlas-enc-term{font-weight:400}' +
      '.atlas-enc-kind{font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-left:8px}' +
      '.atlas-enc-see{font-size:12.5px;color:var(--muted);margin-left:8px}' +
      '.atlas-enc-see a{color:var(--muted)}' +
      '.atlas-enc-desc{margin:2px 0 0;font-size:12.5px;color:var(--muted);line-height:1.6}' +
      '.atlas-enc-areas{margin:2px 0 0;font-size:11px;color:var(--muted)}' +
      '.atlas-enc-empty{padding:32px 6px;text-align:center;color:var(--muted)}' +
      '.atlas-enc-planned{margin:28px 0 0;padding:16px 0 0;border-top:1px solid var(--line)}' +
      '.atlas-enc-planned h2{margin:0 0 6px;font-size:14px;font-weight:700}' +
      '.atlas-enc-planned ul{list-style:none;margin:0;padding:0}' +
      '.atlas-enc-planned li{padding:3px 0;font-size:13px;color:var(--muted);overflow-wrap:break-word}' +
      '.atlas-enc-planned .atlas-enc-note{margin:8px 0 0;font-size:11.5px;color:var(--muted)}' +
      '.atlas-enc-foot{margin-top:32px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);line-height:1.7}' +
      '@media (max-width:760px){.atlas-enc-title{font-size:21px}}';
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  function crumbs() {
    var nav = el('nav', 'atlas-enc-crumbs');
    var a1 = el('a', 'atlas-enc-crumb', 'Atlas'); a1.href = 'atlas.html';
    append(nav, a1);
    append(nav, el('span', 'atlas-enc-crumb-sep', '›'));
    append(nav, el('span', 'atlas-enc-crumb', 'สารานุกรมคำกฎหมาย'));
    return nav;
  }

  var KIND_LABEL = { alias: 'ชื่อเรียกอื่น', en: 'อังกฤษ', latin: 'ละติน' };

  function entryNode(e, opts) {
    var li = el('li', 'atlas-enc-entry' + (e.kind === 'primary' ? '' : ' is-secondary'));
    try { li.dataset.kind = e.kind; li.dataset.slug = e.slug; } catch (x) { /* shim */ }

    var a = el('a', 'atlas-enc-term', e.term);
    a.href = CONCEPT_URL + encodeURIComponent(e.slug);
    append(li, a);

    if (e.kind !== 'primary') {
      append(li, el('span', 'atlas-enc-kind', KIND_LABEL[e.kind] || e.kind));
      var see = el('span', 'atlas-enc-see');
      see.appendChild(doc.createTextNode('→ '));
      var sa = el('a', null, e.titleTH);
      sa.href = CONCEPT_URL + encodeURIComponent(e.slug);
      see.appendChild(sa);
      append(li, see);
    } else if (opts && opts.showDesc && e.summary) {
      var d = e.summary;
      if (d.length > 150) d = d.slice(0, 148).replace(/\s+\S*$/, '') + '…';
      append(li, el('p', 'atlas-enc-desc', d));
      var labels = areaLabels(e.subjectAreas);
      if (labels.length) append(li, el('p', 'atlas-enc-areas', labels.join(' · ')));
    }
    return li;
  }

  function areaLabels(keys) {
    var map = {};
    try {
      var reg = global.AtlasCore && global.AtlasCore.getRegistry && global.AtlasCore.getRegistry();
      ((reg && reg.subjectAreas) || []).forEach(function (x) { map[x.key] = x.title; });
    } catch (e) { /* ignore */ }
    return (keys || []).map(function (k) { return map[k] || k; });
  }

  function renderFullIndex(mount, entries) {
    var groups = groupEntries(entries);

    if (groups.length > 1) {
      var jump = el('nav', 'atlas-enc-jump');
      try { jump.setAttribute('aria-label', 'ข้ามไปยังอักษร'); } catch (e) {}
      groups.forEach(function (g) {
        var j = el('a', null, g.key);
        j.href = '#enc-' + g.key;
        append(jump, j);
      });
      append(mount, jump);
    }

    groups.forEach(function (g) {
      var sec = el('section', 'atlas-enc-group');
      try { sec.id = 'enc-' + g.key; sec.dataset.letter = g.key; } catch (e) { /* shim */ }
      append(sec, el('h2', 'atlas-enc-letter', g.key));
      var ul = el('ul', 'atlas-enc-list');
      g.entries.forEach(function (e) { append(ul, entryNode(e, { showDesc: e.kind === 'primary' })); });
      append(sec, ul);
      append(mount, sec);
    });
  }

  function renderSearchResults(mount, results, q) {
    if (!results.length) {
      append(mount, el('p', 'atlas-enc-empty', 'ไม่พบคำที่ตรงกับ “' + q + '”'));
      return;
    }
    var ul = el('ul', 'atlas-enc-list');
    results.forEach(function (e) { append(ul, entryNode(e, { showDesc: e.kind === 'primary' })); });
    append(mount, ul);
  }

  function renderPlanned(mount, conceptDoc) {
    var planned = [];
    try {
      var AC = global.AtlasConcepts;
      if (AC && AC._internal && typeof AC._internal.collectPlanned === 'function') {
        planned = AC._internal.collectPlanned((conceptDoc && conceptDoc.concepts) || {});
      }
    } catch (e) { /* ignore */ }
    if (!planned.length) return;

    var sec = el('section', 'atlas-enc-planned');
    try { sec.dataset.view = 'planned'; } catch (e) { /* shim */ }
    append(sec, el('h2', null, 'กำลังจัดทำ'));
    var ul = el('ul');
    planned
      .slice()
      .sort(function (a, b) { return termCompare(a.labelTH, b.labelTH); })
      .forEach(function (p) { append(ul, el('li', null, p.labelTH)); });
    append(sec, ul);
    append(sec, el('p', 'atlas-enc-note',
      'คำเหล่านี้ถูกอ้างถึงจากแนวคิดที่เผยแพร่แล้ว แต่ยังไม่มีหน้าอธิบายของตัวเอง'));
    append(mount, sec);
  }

  // ================================================================
  // ?q= search-string param  (never touches location.hash)
  // ================================================================
  function readQ() {
    try {
      var m = /[?&]q=([^&#]*)/.exec(global.location && global.location.search || '');
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    } catch (e) { return ''; }
  }

  function writeQ(q) {
    if (!global.history || typeof global.history.replaceState !== 'function') return;
    try {
      var loc = global.location;
      var base = (loc.pathname || '') ;
      var params = [];
      (loc.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
        if (kv && kv.slice(0, 2) !== 'q=') params.push(kv);
      });
      if (q) params.push('q=' + encodeURIComponent(q));
      var search = params.length ? '?' + params.join('&') : '';
      global.history.replaceState(global.history.state, '', base + search + (loc.hash || ''));
    } catch (e) { /* fail soft */ }
  }

  // ================================================================
  // public entry
  // ================================================================
  function render(rootEl, opts) {
    opts = opts || {};
    if (!rootEl) return Promise.resolve(false);
    var AC = global.AtlasConcepts;
    if (!AC || typeof AC.load !== 'function') {
      clear(rootEl);
      append(rootEl, el('p', 'atlas-enc-empty', 'ไม่พบชั้นแนวคิด (atlas-concepts.js)'));
      return Promise.resolve(false);
    }

    return AC.load(opts.url || DEFAULT_DATA).then(function (conceptDoc) {
      injectStyle();
      clear(rootEl);

      if (!conceptDoc || !conceptDoc.concepts) {
        append(rootEl, el('p', 'atlas-enc-empty', 'โหลดข้อมูลแนวคิดไม่สำเร็จ'));
        return false;
      }

      var entries = buildIndex(conceptDoc);
      var art = el('article', 'atlas-enc');
      try { art.dataset.view = 'encyclopedia'; } catch (e) { /* shim */ }

      append(art, crumbs());

      var head = el('header', 'atlas-enc-head');
      append(head, el('h1', 'atlas-enc-title', 'สารานุกรมคำกฎหมาย'));
      append(head, el('p', 'atlas-enc-intro',
        'ค้นคำกฎหมาย → เข้าใจแนวคิด → เห็นมาตราและความสัมพันธ์ → กระโดดเข้าสารบบ Atlas. ' +
        'สารานุกรมนี้เป็นประตูทางเข้าของชั้นแนวคิดทางกฎหมาย ทุกคำลิงก์ไปยังหน้าแนวคิดเดิม'));
      append(art, head);

      // --- search box ---
      var form = el('form', 'atlas-enc-search');
      try { form.setAttribute('role', 'search'); } catch (e) {}
      var input = el('input', 'atlas-enc-input');
      input.type = 'search';
      input.setAttribute('placeholder', 'ค้นหาคำ… (ไทย · อังกฤษ · ละติน)');
      input.setAttribute('aria-label', 'ค้นหาคำกฎหมาย');
      input.setAttribute('autocomplete', 'off');
      append(form, input);
      append(art, form);

      var count = el('p', 'atlas-enc-count');
      append(art, count);

      var results = el('div', 'atlas-enc-results');
      append(art, results);

      var plannedHost = el('div');
      append(art, plannedHost);
      renderPlanned(plannedHost, conceptDoc);

      var foot = el('footer', 'atlas-enc-foot');
      append(foot, (function () {
        var f = el('div');
        var a1 = el('a', null, 'กลับสารบบโครงสร้าง (Atlas)'); a1.href = 'atlas.html';
        var a2 = el('a', null, 'ค้นมาตรา'); a2.href = 'codex-search.html';
        f.appendChild(a1); f.appendChild(doc.createTextNode(' · ')); f.appendChild(a2);
        return f;
      })());
      append(foot, el('p', null,
        'สารานุกรมเป็นชั้นดัชนี/การค้นหาเหนือชั้นแนวคิดเดิม ไม่ใช่ฐานข้อมูลกฎหมายชุดใหม่ ' +
        'ทุกมาตรา คดี และแนวคิดที่เกี่ยวข้อง เปิดผ่านหน้าเดิมของ Atlas'));
      append(art, foot);

      append(rootEl, art);

      function update(q, opts2) {
        clear(results);
        clear(count);
        if (q) {
          var r = search(entries, q);
          renderSearchResults(results, r, q);
          count.textContent = r.length
            ? (r.length.toLocaleString('th-TH') + ' ผลลัพธ์สำหรับ “' + q + '”')
            : '';
        } else {
          renderFullIndex(results, entries);
          var primaries = entries.filter(function (e) { return e.kind === 'primary'; }).length;
          count.textContent = primaries.toLocaleString('th-TH') + ' แนวคิด · ' +
            entries.length.toLocaleString('th-TH') + ' คำค้น';
        }
        if (!opts2 || opts2.pushUrl !== false) writeQ(q);
      }

      var initial = readQ();
      if (initial) input.value = initial;
      update(initial, { pushUrl: false });

      var timer = null;
      input.addEventListener('input', function () {
        if (timer) { clearTimeout(timer); }
        var v = input.value;
        timer = setTimeout(function () { update(v.trim()); }, 180);
      });
      form.addEventListener('submit', function (ev) {
        try { ev.preventDefault(); } catch (e) {}
        if (timer) { clearTimeout(timer); timer = null; }
        update(input.value.trim());
      });

      return true;
    }).catch(function (e) {
      if (global.console && console.warn) console.warn('[atlas-encyclopedia] render failed', e);
      clear(rootEl);
      append(rootEl, el('p', 'atlas-enc-empty', 'โหลดสารานุกรมไม่สำเร็จ'));
      return false;
    });
  }

  global.AtlasEncyclopedia = {
    version: '1.0',
    render: render,
    _internal: {
      thaiInitial: thaiInitial,
      groupKey: groupKey,
      groupRank: groupRank,
      termCompare: termCompare,
      buildIndex: buildIndex,
      groupEntries: groupEntries,
      search: search,
      readQ: readQ,
      writeQ: writeQ
    }
  };
})(typeof window !== 'undefined' ? window : this);
