/* ============================================================================
 * atlas-search.js  —  Thai Legal Atlas · Search / Jump  (F5)
 * ----------------------------------------------------------------------------
 * A small STANDALONE navigation box for atlas.html. It resolves a TYPED
 * INTENT to an EXISTING Atlas destination — it is NOT a full-text search
 * engine and never searches provision body text.
 *
 *   product promise:  "รู้ว่าจะไปไหน → พาไปถึงจุดนั้นใน Atlas"
 *
 * ADDITIVE CONSUMER — same contract as atlas-clusters.js / atlas-provision-
 * concepts.js:
 *   - never mutates AtlasCore / AtlasUI / AtlasConcepts / AtlasProvisionView.
 *     It only CALLS their public entry points and one already-established
 *     internal contract:
 *       AtlasCore.resolveProvision / resolveAtlasId / listCollections /
 *                 getCollection / getStructureTree / getRegistry
 *       AtlasUI.parseRoute
 *       AtlasUI._internal.restoreReturn(root, { hash, instrument, path })   ← Phase 4B
 *       AtlasProvisionView._internal.openProvision(collection, number, opts) ← F1 ?a= path
 *       AtlasConcepts.load / _internal.getConcept
 *   - builds NO new dataset / index file. The only derived structure is an
 *     in-memory { normalizedTerm -> conceptSlug } lookup rebuilt at mount from
 *     the concept document (the same shape F3/F4 derive), holding no concept
 *     content — display data is read live via AtlasConcepts._internal.getConcept.
 *   - never overwrites location.hash EXCEPT when the chosen destination is
 *     legitimately a collection route (#/c/<key>). The active query lives in a
 *     ?q= search-string param written via history.replaceState (fires nothing).
 *   - fails soft: any failure leaves atlas.html fully usable; the box goes
 *     inert, never throws into atlas-ui or F1.
 *
 * Classic script (no ES modules). Exposes window.AtlasSearch.
 * Host: atlas.html — AtlasSearch.mount(document.getElementById('atlas-search'),
 *                     { root: <#atlas-root> })  after AtlasUI.mount.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var STYLE_ID = 'atlas-search-style';
  var CODEX_SEARCH_URL = 'codex-search.html';
  var MAX_SUGGESTIONS = 8;
  var DEBOUNCE_MS = 150;

  var doc = global.document;

  var _root = null;          // the #atlas-root element AtlasUI mounted into
  var _mountEl = null;
  var _inputEl = null;
  var _listEl = null;
  var _statusEl = null;
  var _suggestions = [];
  var _active = -1;
  var _timer = null;
  var _conceptTerms = null;  // { normTerm: { slug, kind } }  (derived, no content)

  var THAI_DIGITS = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };

  // ================================================================
  // helpers
  // ================================================================
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function norm(s) {
    return String(s == null ? '' : s)
      .replace(/[๐-๙]/g, function (d) { return THAI_DIGITS[d] || d; })
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  function AC() { return global.AtlasCore; }
  function ACReady() {
    var c = AC();
    return !!(c && typeof c.resolveProvision === 'function' && (typeof c.isReady !== 'function' || c.isReady()));
  }

  // ================================================================
  // input normalisation  →  { raw, n, collection, number, text }
  // collection/number set only when the input clearly names a provision.
  // ================================================================
  function normalizeInput(raw) {
    var n = norm(raw);
    var out = { raw: String(raw || ''), n: n, collection: null, number: null, text: n };
    if (!n) return out;

    // strip a leading  ม. / ม / มาตรา  (provision marker)
    var m = /^(?:มาตรา|ม\.?)\s*(.+)$/.exec(n);
    var body = m ? m[1].trim() : n;

    // "<collection> <rest>"   (rest is a number or a structural label)
    var sp = body.indexOf(' ');
    if (sp > 0) {
      var head = body.slice(0, sp);
      var tail = body.slice(sp + 1).trim();
      if (isCollectionKey(head)) {
        out.collection = head;
        if (isProvisionNumber(tail)) out.number = tail;
        else out.text = tail;   // "civil ลักษณะ 5"  → structural, scoped to civil
        return out;
      }
    }

    // "<collection>_<number>"
    var us = body.indexOf('_');
    if (us > 0 && isCollectionKey(body.slice(0, us)) && isProvisionNumber(body.slice(us + 1))) {
      out.collection = body.slice(0, us);
      out.number = body.slice(us + 1);
      return out;
    }

    // bare number  →  provision (default collection = civil, per product spec)
    if (isProvisionNumber(body)) {
      out.number = body;
      // collection stays null → resolveProvisionDest tries civil first, then any
      return out;
    }

    // pure marker like "ม.420" already handled above; otherwise it's free text
    if (m && isProvisionNumber(body)) { out.number = body; }
    out.text = body;
    return out;
  }

  function isProvisionNumber(s) {
    return /^\d+(?:\/\d+)?$/.test(String(s || '').trim());
  }
  function isCollectionKey(s) {
    var c = AC();
    if (!c || typeof c.getCollection !== 'function') return false;
    try { return !!c.getCollection(String(s || '').trim()); } catch (e) { return false; }
  }

  // ================================================================
  // resolvers  — each returns 0..n destination objects
  //   { type:'provision'|'collection'|'structural'|'concept', label, sub, ... }
  // ================================================================
  function resolveProvisionDest(info) {
    if (!ACReady() || info.number == null) return [];
    var c = AC();
    function mk(col) {
      var r;
      try { r = c.resolveProvision(col, info.number); } catch (e) { r = null; }
      if (!r || !r.article) return null;
      return {
        type: 'provision',
        collection: col,
        number: r.number,
        ref: r.legacyId || (col + '_' + (r.storageKey != null ? r.storageKey : r.number)),
        label: (r.unit || 'มาตรา') + ' ' + r.number,
        sub: r.collectionShort || r.collectionTitle || col
      };
    }
    if (info.collection) { var d = mk(info.collection); return d ? [d] : []; }

    // F5 context fix: a bare number defaults to the CURRENT PAGE'S collection
    // (route context), not a hard-coded "civil". Global search stays an
    // explicit action (type "civil 420" / "criminal 420" etc.) — we never
    // silently widen the scope when the current collection can resolve.
    var route = routeNow();
    if (route.collection) {
      var ctx = mk(route.collection);
      return ctx ? [ctx] : [];
    }

    // no page context (e.g. the Atlas home view has no collection route):
    // civil first (product decision), then every other collection
    var civ = mk('civil');
    if (civ) return [civ];
    var out = [];
    try {
      c.listCollections().forEach(function (col) {
        var dd = mk(col.key);
        if (dd) out.push(dd);
      });
    } catch (e) { /* ignore */ }
    return out;
  }

  function resolveCollectionDest(info) {
    if (!ACReady()) return [];
    var c = AC();
    var q = info.text;
    var out = [];
    try {
      c.listCollections().forEach(function (col) {
        if (norm(col.key) === q || norm(col.short) === q || norm(col.title) === q) {
          out.push({ type: 'collection', key: col.key, label: col.title, sub: 'ประมวล/พ.ร.บ.' });
        }
      });
    } catch (e) { /* ignore */ }
    return out;
  }

  function walkTree(nodes, fn) {
    (nodes || []).forEach(function (n) {
      fn(n);
      if (n.children) walkTree(n.children, fn);
    });
  }

  // structural nodes match on node.value only ("บรรพ 2", "ลักษณะ 5") — never on
  // the descriptive title, so "ละเมิด" stays a concept, not a หมวด.
  // Scoped to the collection currently in the route; on the home view a bare
  // structural label is too ambiguous to resolve, so it only feeds suggestions.
  function resolveStructuralDest(info, opts) {
    opts = opts || {};
    if (!ACReady()) return [];
    var c = AC();
    var route = routeNow();
    var col = info.collection || route.collection;
    if (!col && !opts.allowAllCollections) return [];
    var q = info.text;
    var out = [];
    var cols = col ? [col] : safeCollectionKeys();
    cols.forEach(function (key) {
      var tree;
      try { tree = c.getStructureTree(key); } catch (e) { tree = null; }
      if (!tree) return;
      var short = collectionShort(key);
      walkTree(tree.nodes, function (node) {
        if (node && node.value != null && norm(node.value) === q) {
          out.push({
            type: 'structural',
            collection: key,
            instrument: (route.collection === key ? route.instrument : null) || null,
            path: (node.path || []).slice(),
            label: node.value + (node.title ? ' — ' + node.title : ''),
            sub: short + ' › ' + (node.path || []).join(' › ')
          });
        }
      });
    });
    return out;
  }

  function resolveConceptDest(info) {
    if (!_conceptTerms) return [];
    var hit = _conceptTerms[info.text];
    if (!hit) return [];
    var titleTH = conceptTitle(hit.slug);
    return [{
      type: 'concept',
      slug: hit.slug,
      label: titleTH,
      sub: hit.kind === 'primary' ? 'แนวคิดทางกฎหมาย' : ('แนวคิด · ' + info.raw)
    }];
  }

  // deterministic resolution precedence (F5 §RESOLUTION CONTRACT):
  //   1 provision · 2 collection · 3 structural · 4 concept · 5 suggestions · 6 no-match
  // If more than one class yields a hit, we DO NOT silently choose — suggestions.
  function resolve(raw) {
    var info = normalizeInput(raw);
    if (!info.n) return { kind: 'empty' };

    var prov = resolveProvisionDest(info);
    var coll = resolveCollectionDest(info);
    var stru = resolveStructuralDest(info);
    var conc = resolveConceptDest(info);

    var all = prov.concat(coll, stru, conc);
    if (all.length === 0) return { kind: 'nomatch', info: info };
    if (all.length === 1) return { kind: 'go', dest: all[0], info: info };
    return { kind: 'ambiguous', dests: all.slice(0, MAX_SUGGESTIONS), info: info };
  }

  // ================================================================
  // live suggestions (as-you-type) — simple, deterministic ranking
  // ================================================================
  function rankSuggestions(raw) {
    var info = normalizeInput(raw);
    if (!info.n) return [];
    var out = [];
    var seen = {};
    function add(d, rank) {
      var key = d.type + '|' + (d.ref || d.key || d.slug || (d.collection + '|' + (d.path || []).join('/')));
      if (seen[key]) return;
      seen[key] = 1;
      d._rank = rank;
      out.push(d);
    }

    // exact resolution first (rank 0)
    resolveProvisionDest(info).forEach(function (d) { add(d, 0); });
    resolveCollectionDest(info).forEach(function (d) { add(d, 1); });
    resolveStructuralDest(info, { allowAllCollections: true }).forEach(function (d) { add(d, 2); });
    resolveConceptDest(info).forEach(function (d) { add(d, 1); });

    var q = info.text;

    // prefix matches (rank 3-5)
    if (ACReady() && q.length >= 1) {
      var c = AC();
      try {
        c.listCollections().forEach(function (col) {
          if (norm(col.title).indexOf(q) === 0 || norm(col.short).indexOf(q) === 0 || norm(col.key).indexOf(q) === 0) {
            add({ type: 'collection', key: col.key, label: col.title, sub: 'ประมวล/พ.ร.บ.' }, 3);
          }
        });
      } catch (e) { /* ignore */ }

      var route = routeNow();
      if (route.collection && q.length >= 2) {
        try {
          var tree = c.getStructureTree(route.collection);
          var short = collectionShort(route.collection);
          walkTree(tree.nodes, function (node) {
            if (node && node.value != null && norm(node.value).indexOf(q) === 0) {
              add({
                type: 'structural', collection: route.collection,
                instrument: route.instrument || null, path: (node.path || []).slice(),
                label: node.value + (node.title ? ' — ' + node.title : ''),
                sub: short + ' › ' + (node.path || []).join(' › ')
              }, 4);
            }
          });
        } catch (e) { /* ignore */ }
      }
    }

    // concept prefix + substring (rank 5-6) — matches F3's substring behaviour
    if (_conceptTerms && q.length >= 2) {
      Object.keys(_conceptTerms).forEach(function (term) {
        var idx = term.indexOf(q);
        if (idx === -1) return;
        var hit = _conceptTerms[term];
        add({
          type: 'concept', slug: hit.slug, label: conceptTitle(hit.slug),
          sub: 'แนวคิด · ' + term
        }, idx === 0 ? 5 : 6);
      });
    }

    out.sort(function (a, b) { return a._rank - b._rank; });
    return out.slice(0, MAX_SUGGESTIONS);
  }

  // ================================================================
  // navigation  — always an EXISTING Atlas destination
  // ================================================================
  function navigate(dest) {
    if (!dest) return false;
    try {
      if (dest.type === 'provision') return goProvision(dest);
      if (dest.type === 'collection') return goCollection(dest);
      if (dest.type === 'structural') return goStructural(dest);
      if (dest.type === 'concept') return goConcept(dest);
    } catch (e) { /* fail soft */ }
    return false;
  }

  function goProvision(dest) {
    var APV = global.AtlasProvisionView;
    // preferred: the established F1 programmatic open (pushes ?a=, keeps ?q=/hash)
    if (APV && APV._internal && typeof APV._internal.openProvision === 'function') {
      var okOpen = APV._internal.openProvision(dest.collection, dest.number, { history: 'push', source: _inputEl });
      if (okOpen) { closeList(); return true; }
    }
    // fallback: write ?a= and let AtlasProvisionView.init pick it up
    if (APV && typeof APV.init === 'function') {
      try {
        var loc = global.location;
        var params = keepParams(['a']);
        params.push('a=' + encodeURIComponent(dest.ref));
        global.history.pushState({}, '', (loc.pathname || '') + '?' + params.join('&') + (loc.hash || ''));
        APV.init({ root: _root });
        closeList();
        return true;
      } catch (e) { /* fall through */ }
    }
    return false;
  }

  function goCollection(dest) {
    // the ONE case where the search box legitimately writes location.hash
    try { global.location.hash = '#/c/' + dest.key; closeList(); return true; }
    catch (e) { return false; }
  }

  function goStructural(dest) {
    var UI = global.AtlasUI;
    if (!UI || !UI._internal || typeof UI._internal.restoreReturn !== 'function' || !_root) return false;
    var wantHash = '#/c/' + dest.collection + (dest.instrument ? '/i/' + dest.instrument : '');
    var payload = { hash: wantHash, instrument: dest.instrument || null, path: dest.path };

    if ((global.location.hash || '#/') === wantHash) {
      UI._internal.restoreReturn(_root, payload);
      closeList();
      return true;
    }
    // switch collection, then reveal after AtlasUI re-renders on hashchange
    var once = function () {
      global.removeEventListener('hashchange', once);
      var raf = global.requestAnimationFrame || function (fn) { return setTimeout(fn, 0); };
      raf(function () {
        try { UI._internal.restoreReturn(_root, payload); } catch (e) { /* ignore */ }
      });
    };
    global.addEventListener('hashchange', once);
    try { global.location.hash = wantHash; } catch (e) { global.removeEventListener('hashchange', once); return false; }
    closeList();
    return true;
  }

  function goConcept(dest) {
    try { global.location.assign('concept.html?k=' + encodeURIComponent(dest.slug)); return true; }
    catch (e) {
      try { global.location.href = 'concept.html?k=' + encodeURIComponent(dest.slug); return true; }
      catch (e2) { return false; }
    }
  }

  // ================================================================
  // small AtlasCore/AtlasConcepts read helpers
  // ================================================================
  function routeNow() {
    var UI = global.AtlasUI;
    try {
      if (UI && typeof UI.parseRoute === 'function') {
        var r = UI.parseRoute();
        return { collection: r.collection || null, instrument: r.instrument || null };
      }
    } catch (e) { /* ignore */ }
    return { collection: null, instrument: null };
  }
  function safeCollectionKeys() {
    try { return AC().listCollections().map(function (c) { return c.key; }); }
    catch (e) { return []; }
  }
  function collectionShort(key) {
    try { var c = AC().getCollection(key); return (c && (c.short || c.title)) || key; }
    catch (e) { return key; }
  }
  function conceptTitle(slug) {
    try {
      var g = global.AtlasConcepts && global.AtlasConcepts._internal && global.AtlasConcepts._internal.getConcept;
      var c = g ? g(slug) : null;
      return (c && c.titleTH) || slug;
    } catch (e) { return slug; }
  }

  // in-memory { normalizedTerm -> { slug, kind } } — derived, holds no content
  function buildConceptTerms(conceptDoc) {
    var terms = {};
    var concepts = (conceptDoc && conceptDoc.concepts) || {};
    Object.keys(concepts).forEach(function (slug) {
      var c = concepts[slug];
      if (!c || c.status !== 'published') return;
      function put(t, kind) { var k = norm(t); if (k && !terms[k]) terms[k] = { slug: slug, kind: kind }; }
      put(c.titleTH, 'primary');
      (c.aliases || []).forEach(function (a) { put(a, 'alias'); });
      // titleEN may bundle several equivalents joined by " · "; for a piece that
      // carries a parenthetical gloss ("Tort (wrongful act)") also index the
      // bare head ("Tort"). String processing of existing data — not new terms.
      String(c.titleEN || '').split('·').forEach(function (t) {
        put(t, 'en');
        var bare = t.replace(/\([^)]*\)/g, '').trim();
        if (bare && bare !== t.trim()) put(bare, 'en');
      });
      (c.latin || []).forEach(function (t) { put(t, 'latin'); });
    });
    _conceptTerms = terms;
    return terms;
  }

  // ================================================================
  // ?q= — shareable / refreshable query (replaceState; never the hash)
  // ================================================================
  function keepParams(drop) {
    drop = drop || [];
    var raw = ((global.location && global.location.search) || '').replace(/^\?/, '');
    var out = [];
    raw.split('&').forEach(function (kv) {
      if (!kv) return;
      var k = kv.split('=')[0];
      if (drop.indexOf(k) === -1) out.push(kv);
    });
    return out;
  }
  function readQ() {
    try {
      var m = /[?&]q=([^&#]*)/.exec((global.location && global.location.search) || '');
      return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    } catch (e) { return ''; }
  }
  function writeQ(q) {
    if (!global.history || typeof global.history.replaceState !== 'function') return;
    try {
      var loc = global.location;
      var params = keepParams(['q']);
      if (q) params.push('q=' + encodeURIComponent(q));
      var search = params.length ? '?' + params.join('&') : '';
      global.history.replaceState(global.history.state, '', (loc.pathname || '') + search + (loc.hash || ''));
    } catch (e) { /* fail soft */ }
  }

  // ================================================================
  // rendering
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var css = [
      '.atlas-search{position:relative;margin:0 0 var(--s5,24px);max-width:520px;}',
      '.atlas-search-form{display:flex;gap:var(--s2,8px);align-items:stretch;}',
      '.atlas-search-input{flex:1;min-width:0;font:inherit;font-size:14px;padding:9px 13px;',
      '  border:1px solid var(--line,#e6e1d6);border-radius:var(--radius,10px);',
      '  background:var(--panel,#fff);color:var(--ink,#1f2430);}',
      '.atlas-search-input:focus{outline:2px solid var(--accent,#2E4A7A);outline-offset:1px;',
      '  border-color:var(--accent,#2E4A7A);}',
      '.atlas-search-input::placeholder{color:var(--muted,#5b6472);}',
      '.atlas-search-list{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;',
      '  margin:0;padding:4px;list-style:none;background:var(--panel,#fff);',
      '  border:1px solid var(--line,#e6e1d6);border-radius:var(--radius,10px);',
      '  box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:340px;overflow-y:auto;}',
      '.atlas-search-list[hidden]{display:none;}',
      '.atlas-search-opt{display:flex;align-items:baseline;gap:8px;padding:7px 9px;',
      '  border-radius:7px;cursor:pointer;font-size:13px;line-height:1.4;color:var(--ink,#1f2430);}',
      '.atlas-search-opt[aria-selected="true"],.atlas-search-opt:hover{background:var(--accent-soft,#eaf0f8);}',
      '.atlas-search-opt-label{flex:1;min-width:0;}',
      '.atlas-search-opt-sub{display:block;font-size:11px;color:var(--muted,#5b6472);margin-top:1px;}',
      '.atlas-search-badge{flex:none;font-size:10px;font-weight:600;padding:1px 7px;border-radius:999px;',
      '  background:var(--chip,#f2ede1);color:var(--muted,#5b6472);}',
      '.atlas-search-status{margin:6px 2px 0;font-size:12px;color:var(--muted,#5b6472);}',
      '.atlas-search-status a{color:var(--accent,#2E4A7A);}',
      '@media (max-width:760px){.atlas-search{max-width:none;}}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  var BADGE = { provision: 'มาตรา', collection: 'ประมวล', structural: 'โครงสร้าง', concept: 'แนวคิด' };

  function renderList() {
    if (!_listEl) return;
    while (_listEl.firstChild) _listEl.removeChild(_listEl.firstChild);
    if (!_suggestions.length) { _listEl.hidden = true; _inputEl.setAttribute('aria-expanded', 'false'); return; }
    _suggestions.forEach(function (d, i) {
      var li = el('li', 'atlas-search-opt');
      li.id = 'atlas-search-opt-' + i;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === _active ? 'true' : 'false');
      li.appendChild(el('span', 'atlas-search-badge', BADGE[d.type] || d.type));
      var lab = el('span', 'atlas-search-opt-label');
      lab.appendChild(doc.createTextNode(d.label || ''));
      if (d.sub) lab.appendChild(el('span', 'atlas-search-opt-sub', d.sub));
      li.appendChild(lab);
      li.addEventListener('mousedown', function (ev) { try { ev.preventDefault(); } catch (e) {} navigate(d); });
      _listEl.appendChild(li);
    });
    _listEl.hidden = false;
    _inputEl.setAttribute('aria-expanded', 'true');
  }

  function setStatus(kind, info) {
    if (!_statusEl) return;
    while (_statusEl.firstChild) _statusEl.removeChild(_statusEl.firstChild);
    if (kind !== 'nomatch') { _statusEl.hidden = true; return; }
    _statusEl.hidden = false;
    _statusEl.appendChild(doc.createTextNode('ไม่พบใน Atlas — ลองค้นข้อความเต็มที่ '));
    var a = el('a', null, 'ค้นประมวลกฎหมาย');
    var q = info && info.raw ? ('?q=' + encodeURIComponent(info.raw)) : '';
    a.setAttribute('href', CODEX_SEARCH_URL + q);
    _statusEl.appendChild(a);
  }

  function closeList() {
    _suggestions = [];
    _active = -1;
    renderList();
  }

  function refresh(rawValue, opts) {
    opts = opts || {};
    var raw = rawValue != null ? rawValue : (_inputEl ? _inputEl.value : '');
    if (opts.writeUrl !== false) writeQ(raw.trim());
    if (_statusEl) { _statusEl.hidden = true; while (_statusEl.firstChild) _statusEl.removeChild(_statusEl.firstChild); }
    _suggestions = raw.trim() ? rankSuggestions(raw) : [];
    _active = -1;
    renderList();
  }

  function submit() {
    if (!_inputEl) return;
    if (_active >= 0 && _suggestions[_active]) { navigate(_suggestions[_active]); return; }
    var res = resolve(_inputEl.value);
    if (res.kind === 'go') { navigate(res.dest); return; }
    if (res.kind === 'ambiguous') { _suggestions = res.dests; _active = -1; renderList(); return; }
    if (res.kind === 'nomatch') { closeList(); setStatus('nomatch', res.info); return; }
    /* empty */ closeList();
  }

  function onKeydown(e) {
    var key = e.key;
    if (key === 'ArrowDown' || key === 'Down') {
      if (!_suggestions.length) { refresh(); }
      if (_suggestions.length) { e.preventDefault(); _active = (_active + 1) % _suggestions.length; renderList(); syncActiveDesc(); }
    } else if (key === 'ArrowUp' || key === 'Up') {
      if (_suggestions.length) { e.preventDefault(); _active = (_active - 1 + _suggestions.length) % _suggestions.length; renderList(); syncActiveDesc(); }
    } else if (key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (key === 'Escape' || key === 'Esc') {
      if (_suggestions.length || (_statusEl && !_statusEl.hidden)) { e.preventDefault(); closeList(); if (_statusEl) _statusEl.hidden = true; }
    }
  }
  function syncActiveDesc() {
    if (!_inputEl) return;
    if (_active >= 0) _inputEl.setAttribute('aria-activedescendant', 'atlas-search-opt-' + _active);
    else _inputEl.removeAttribute('aria-activedescendant');
  }

  // ================================================================
  // mount
  // ================================================================
  function build() {
    injectStyle();
    var wrap = el('div', 'atlas-search');
    var form = el('form', 'atlas-search-form');
    form.setAttribute('role', 'search');
    form.setAttribute('aria-label', 'ค้นหาและกระโดดไปยังจุดใน Atlas');

    _inputEl = el('input', 'atlas-search-input');
    _inputEl.type = 'search';
    _inputEl.setAttribute('placeholder', 'ไปที่… มาตรา / ประมวล / โครงสร้าง / แนวคิด (เช่น ม.420, อาญา, ละเมิด)');
    _inputEl.setAttribute('aria-label', 'ไปที่จุดใน Atlas');
    _inputEl.setAttribute('autocomplete', 'off');
    _inputEl.setAttribute('role', 'combobox');
    _inputEl.setAttribute('aria-expanded', 'false');
    _inputEl.setAttribute('aria-autocomplete', 'list');
    _inputEl.setAttribute('aria-controls', 'atlas-search-list');

    form.appendChild(_inputEl);
    wrap.appendChild(form);

    _listEl = el('ul', 'atlas-search-list');
    _listEl.id = 'atlas-search-list';
    _listEl.setAttribute('role', 'listbox');
    _listEl.hidden = true;
    wrap.appendChild(_listEl);

    _statusEl = el('p', 'atlas-search-status');
    _statusEl.hidden = true;
    wrap.appendChild(_statusEl);

    form.addEventListener('submit', function (e) { try { e.preventDefault(); } catch (x) {} submit(); });
    _inputEl.addEventListener('keydown', onKeydown);
    _inputEl.addEventListener('input', function () {
      var v = _inputEl.value;
      if (_timer) clearTimeout(_timer);
      _timer = setTimeout(function () { refresh(v); }, DEBOUNCE_MS);
    });
    _inputEl.addEventListener('blur', function () {
      // let a mousedown on an option run first
      setTimeout(function () { if (_listEl && !_listEl.hidden) closeList(); }, 120);
    });

    _mountEl.appendChild(wrap);
  }

  function mount(mountEl, opts) {
    opts = opts || {};
    try {
      _mountEl = mountEl || (doc && doc.getElementById('atlas-search'));
      if (!_mountEl || !doc) return;
      _root = opts.root || (doc && doc.getElementById('atlas-root'));
      build();

      // derive the concept-term lookup (best effort; box works without it)
      var ACn = global.AtlasConcepts;
      if (ACn && typeof ACn.load === 'function') {
        ACn.load().then(function (d) { buildConceptTerms(d); })
          .catch(function () { _conceptTerms = _conceptTerms || {}; });
      } else {
        _conceptTerms = {};
      }

      // restore a deep-linked ?q= (visible query only — never auto-navigate)
      var q0 = readQ();
      if (q0 && _inputEl) {
        _inputEl.value = q0;
        refresh(q0, { writeUrl: false });
      }
    } catch (e) {
      if (global.console && console.warn) console.warn('[atlas-search] mount failed — search disabled', e);
    }
  }

  global.AtlasSearch = {
    version: '1.0',
    mount: mount,
    _internal: {
      normalizeInput: normalizeInput,
      isProvisionNumber: isProvisionNumber,
      resolveProvisionDest: resolveProvisionDest,
      resolveCollectionDest: resolveCollectionDest,
      resolveStructuralDest: resolveStructuralDest,
      resolveConceptDest: resolveConceptDest,
      resolve: resolve,
      rankSuggestions: rankSuggestions,
      navigate: navigate,
      buildConceptTerms: buildConceptTerms,
      conceptTerms: function () { return _conceptTerms; },
      readQ: readQ,
      writeQ: writeQ,
      suggestions: function () { return _suggestions; },
      active: function () { return _active; },
      inputEl: function () { return _inputEl; },
      listEl: function () { return _listEl; },
      statusEl: function () { return _statusEl; },
      submit: submit,
      onKeydown: onKeydown,
      setRoot: function (r) { _root = r; },
      reset: function () {
        _root = _mountEl = _inputEl = _listEl = _statusEl = null;
        _suggestions = []; _active = -1; _conceptTerms = null;
        if (_timer) { clearTimeout(_timer); _timer = null; }
      }
    }
  };
})(typeof window !== 'undefined' ? window : this);
