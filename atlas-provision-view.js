/* ============================================================================
 * atlas-provision-view.js  —  Thai Legal Atlas · inline provision viewer
 * ----------------------------------------------------------------------------
 * Phase 4E-1. A STANDALONE presentation layer — same shape as atlas-cases.js.
 * It never lives inside atlas-ui.js and never mutates AtlasCore / AtlasUI.
 *
 * What it does
 *   A plain left-click on an Atlas provision pill
 *     <a class="atlas-provision" href="codex-article-viewer.html?id=..&x=atlas">
 *   opens an in-page reading panel (role="dialog") with the full ตัวบท,
 *   the structural breadcrumb, previous/next navigation and the associated
 *   PUBLIC cases — WITHOUT tearing down or re-rendering the structure tree
 *   behind it.
 *
 * Progressive enhancement — the pill's href is untouched, so:
 *   - if this script fails to load            → click follows the legacy viewer
 *   - Ctrl / Cmd / Shift / Alt / middle click → legacy viewer, new tab, etc.
 *   - AtlasCore not ready / unknown article   → click follows the legacy viewer
 *
 * History model (see Phase 4E-1 §5)
 *   The Atlas route grammar is hash-based and AtlasUI.parseRoute() only
 *   accepts an EXACT `#/c/<collection>` — appending `?a=` to the hash makes
 *   AtlasUI fall through to the home view, and Back across a hash change
 *   fires `hashchange`, which rebuilds the tree and drops every open branch.
 *   So this module NEVER touches location.hash. It records the open provision
 *   in an `?a=<collection>_<number>` search-string param via history.pushState /
 *   replaceState (which fire no events at all), keeping the hash — and
 *   therefore AtlasUI — completely untouched. Back simply pops that entry;
 *   the popstate handler closes the panel and the tree is exactly as it was.
 *
 *   The `?a=` value is written fully-qualified so a refresh / deep link works
 *   even where there is no `#/c/<collection>` route hash (concept.html), and
 *   every OTHER query param is preserved — concept.html keeps its own
 *   `?k=<slug>` when a provision is opened or closed. A bare legacy value
 *   (`?a=420`) is still read, with the collection taken from the route hash.
 *
 * Classic script (no ES modules). Exposes window.AtlasProvisionView.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var ROOT_ID = 'atlas-root';
  var PARAM = 'a';                 // ?a=<collection>_<number>  (self-sufficient; bare number also read)
  var RETURN_PROVISION_KEY = 'atlas:return:a'; // F11.2 — ISOLATED recovery ref; NOT inside atlas:return (AtlasUI owns that)
  var CASE_INDEX_URL = 'prototype/assets/cases/article-case-index.json';
  var STYLE_ID = 'atlas-provision-view-style';
  var PILL_SELECTOR = 'a.atlas-provision';

  var doc = global.document;

  // ---- module state -------------------------------------------------
  var _root = null;
  var _wrapEl = null;             // .atlas-provision-view (dialog container)
  var _panelEl = null;            // .atlas-provision-view-panel
  var _lastFocused = null;        // element to restore focus to on close
  var _current = null;            // { collection, instrument, number }
  var _hasOwnEntry = false;       // did WE pushState an entry for this open?
  var _bound = false;
  var _prevBodyOverflow = null;
  var _caseIndexPromise = null;

  // ================================================================
  // utilities
  // ================================================================
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function hasClass(n, c) {
    return !!n && typeof n.className === 'string' &&
      (' ' + n.className + ' ').indexOf(' ' + c + ' ') !== -1;
  }
  function make(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  // closest('a.atlas-provision') without relying on Element.closest (test shim).
  // Also matches in-drawer มาตรา cross-reference links (F11.3.1A) so a plain
  // click on one is handled by onRootClick exactly like a tree / cluster pill:
  // same href shape (codex-article-viewer.html?id=<collection>_<number>), same
  // resolve → updateOpen path, same history 'replace'. The link carries ONLY
  // .atlas-provision-view-xref (never .atlas-provision) so it does not inherit
  // the block-pill styling from atlas.html.
  function closestProvisionAnchor(node) {
    var cur = node;
    while (cur && cur.nodeType === 1) {
      if (String(cur.tagName).toUpperCase() === 'A' &&
          (hasClass(cur, 'atlas-provision') || hasClass(cur, 'atlas-provision-view-xref'))) return cur;
      cur = cur.parentNode;
    }
    return null;
  }

  // ---- legacy id → { collection, instrument, number } ------------
  // id is  <collection>_<number>  or  <collection>_<instrument>::<number>
  // Collection keys never contain "_" and มาตรา numbers never contain "_"
  // (sub-numbers use "/"), so the FIRST "_" is the split point.
  function splitId(id) {
    var s = String(id == null ? '' : id);
    var us = s.indexOf('_');
    if (us < 1 || us === s.length - 1) return null;
    var collection = s.slice(0, us);
    var rest = s.slice(us + 1);
    var sep = rest.indexOf('::');
    if (sep !== -1) {
      return { collection: collection, instrument: rest.slice(0, sep), number: rest.slice(sep + 2) };
    }
    return { collection: collection, instrument: null, number: rest };
  }

  // ---- provision href → { collection, number } --------------------
  // href is  codex-article-viewer.html?id=<collection>_<number>[&x=atlas]
  function parseProvisionHref(href) {
    try {
      var m = /[?&]id=([^&#]+)/.exec(String(href || ''));
      if (!m) return null;
      var id;
      try { id = decodeURIComponent(m[1]); } catch (e) { id = m[1]; }
      return splitId(id);
    } catch (e) { return null; }
  }

  // ---- ?a= value → { collection, instrument, number } ------------
  // Written qualified ("civil_420") so it is self-sufficient when there is no
  // Atlas route hash (concept.html). A bare legacy value ("420") is still
  // accepted — the collection then comes from currentRoute().
  function parseParam(val) {
    if (val == null || val === '') return null;
    var s = String(val);
    if (s.indexOf('_') !== -1) {
      var r = splitId(s);
      if (r) return r;
    }
    return { collection: null, instrument: null, number: s };
  }

  // qualified ref for a resolved provision — the value we record in ?a=
  function refOf(resolved) {
    if (!resolved) return '';
    if (resolved.legacyId) return resolved.legacyId;
    var key = resolved.storageKey != null ? resolved.storageKey : resolved.number;
    return resolved.collection + '_' + key;
  }

  // ---- current Atlas route, READ (never routed) from the hash -----
  function currentRoute() {
    var h = (global.location && global.location.hash) || '';
    var m = /^#\/c\/([^/?&]+)(?:\/i\/([^/?&]+))?/.exec(h);
    if (!m) return { collection: null, instrument: null };
    function dec(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
    return { collection: dec(m[1]), instrument: m[2] ? dec(m[2]) : null };
  }

  function readParam() {
    var s = (global.location && global.location.search) || '';
    var m = new RegExp('[?&]' + PARAM + '=([^&#]*)').exec(s);
    if (!m) return null;
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }

  // rebuild the query string, keeping every param EXCEPT `a`; optionally
  // append `a=<ref>`. This is what keeps concept.html's own `?k=<slug>`
  // (and any other sibling param) intact when a provision is opened/closed.
  function buildSearch(ref) {
    var raw = ((global.location && global.location.search) || '').replace(/^\?/, '');
    var pairs = [];
    raw.split('&').forEach(function (kv) {
      if (!kv) return;
      if (kv.split('=')[0] === PARAM) return;   // drop any existing a=
      pairs.push(kv);
    });
    if (ref != null && ref !== '') pairs.push(PARAM + '=' + encodeURIComponent(ref));
    return pairs.length ? '?' + pairs.join('&') : '';
  }
  function urlWithParam(ref) {
    var loc = global.location;
    return (loc.pathname || '') + buildSearch(ref) + (loc.hash || '');
  }
  function urlWithoutParam() {
    var loc = global.location;
    return (loc.pathname || '') + buildSearch(null) + (loc.hash || '');
  }

  // ================================================================
  // F11.2 — lossless legacy-fallback round-trip.
  //
  // The PRIMARY path is the URL: the legacy viewer's "← กลับไป" carries
  // ?a=<collection>_<number>, which init()'s existing ?a= branch reopens.
  //
  // The RECOVERY path here is a safety net for a legacy return that arrives
  // WITHOUT ?a= (an older cached viewer, a stripped URL). It stores the open
  // provision under its OWN sessionStorage key `atlas:return:a` — deliberately
  // NOT a field inside `atlas:return`, because atlas-ui.js owns that object and
  // fully replaces it ({hash,keys}) on every render / persistReturn(), which
  // would destroy an `a` field before AtlasProvisionView.init() could read it.
  // The isolated key survives AtlasUI mount / render / tree-toggle / nav.
  // ================================================================
  function readRecoveryRef() {
    try { return global.sessionStorage.getItem(RETURN_PROVISION_KEY) || null; }
    catch (e) { return null; }
  }

  // remove the one-shot recovery ref (whole key). Called only after the round
  // trip is genuinely satisfied — a real recovery open, or the URL ?a= path.
  function consumeRecoveryRef() {
    try { global.sessionStorage.removeItem(RETURN_PROVISION_KEY); }
    catch (e) { /* ignore */ }
  }

  // Record the open provision just before the browser leaves for the legacy
  // reading tools. Touches ONLY the isolated key — never `atlas:return`.
  function writeFallbackReturn(resolved) {
    var ref = refOf(resolved);
    if (!ref) return;
    try { global.sessionStorage.setItem(RETURN_PROVISION_KEY, ref); }
    catch (e) { /* storage unavailable — the legacy viewer falls back to its ?id= */ }
  }

  // one-shot recovery: ONLY when there is no ?a= param, the saved ref is valid,
  // and it belongs to the collection the current Atlas view is showing. A stale
  // ref from another visit must never open a provision on an unrelated route,
  // and must NOT be consumed — it may become valid once the user returns to the
  // matching collection.
  function recoverFromReturn() {
    var ref = readRecoveryRef();
    if (!ref) return;
    var parsed = parseParam(ref);
    if (!parsed || parsed.number == null || parsed.number === '') return;
    var route = currentRoute();
    var collection = parsed.collection || route.collection;
    if (!route.collection || !collection || collection !== route.collection) return; // guard — leave intact
    var resolved = resolve(collection, parsed.number, parsed.instrument || route.instrument);
    if (!resolved) return;                        // unknown article — leave state intact
    consumeRecoveryRef();                         // one-shot: consume only on a real recovery
    openFresh(resolved, { history: 'replace' });  // ?a=<ref>, hash untouched, no AtlasUI re-render
  }

  // ================================================================
  // resolution
  // ================================================================
  function resolve(collection, number, instrument) {
    var AC = global.AtlasCore;
    if (!AC || typeof AC.resolveProvision !== 'function') return null;
    try {
      var r = AC.resolveProvision(collection, number, instrument || undefined);
      if (r && r.article) return r;
    } catch (e) { /* fail soft */ }
    return null;
  }
  function adjacent(collection, ref) {
    var AC = global.AtlasCore;
    if (!AC || typeof AC.getAdjacent !== 'function') return { prev: null, next: null };
    try { return AC.getAdjacent(collection, ref) || { prev: null, next: null }; }
    catch (e) { return { prev: null, next: null }; }
  }

  // ================================================================
  // case association — read the SAME prebuilt public index that
  // atlas-cases.js and neural-network.html consume. One memoised fetch;
  // fails soft to "no cases".
  // ================================================================
  function loadCaseIndex() {
    if (_caseIndexPromise) return _caseIndexPromise;
    if (typeof global.fetch !== 'function') {
      _caseIndexPromise = Promise.resolve({});
      return _caseIndexPromise;
    }
    _caseIndexPromise = global.fetch(CASE_INDEX_URL)
      .then(function (r) { return (r && r.ok) ? r.json() : {}; })
      .then(function (j) { return (j && typeof j === 'object') ? j : {}; })
      .catch(function () { return {}; });
    return _caseIndexPromise;
  }
  function publicCasesFrom(index, collection, number) {
    var key = collection + ':' + number;
    var arr = (index && Object.prototype.hasOwnProperty.call(index, key)) ? index[key] : null;
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (c && c.public === true && typeof c.id === 'string' && c.id) out.push(c);
    }
    return out;
  }

  // ================================================================
  // stylesheet (scoped .atlas-provision-view-*; no generic selectors)
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var css = [
      '.atlas-provision-view{position:fixed;inset:0;z-index:1000;display:flex;',
      '  justify-content:flex-end;}',
      '.atlas-provision-view[hidden]{display:none!important;}',
      '.atlas-provision-view-backdrop{position:absolute;inset:0;background:rgba(15,18,26,.10);',
      '  opacity:0;transition:opacity .18s ease;}',
      '.atlas-provision-view-panel{position:relative;width:min(460px,94vw);max-width:94vw;',
      '  height:100%;background:var(--panel,#fff);color:var(--ink,#1f2430);',
      '  border-left:1px solid var(--line,#e6e1d6);box-shadow:-8px 0 30px rgba(0,0,0,.14);',
      '  display:flex;flex-direction:column;transform:translateX(14px);opacity:0;',
      '  transition:transform .18s ease,opacity .18s ease;outline:none;}',
      '.atlas-provision-view-open .atlas-provision-view-backdrop{opacity:1;}',
      '.atlas-provision-view-open .atlas-provision-view-panel{transform:none;opacity:1;}',
      '.atlas-provision-view-header{display:flex;align-items:flex-start;gap:12px;',
      '  padding:16px 18px 12px;border-bottom:1px solid var(--line,#e6e1d6);}',
      '.atlas-provision-view-breadcrumb{flex:1;min-width:0;font-size:11.5px;line-height:1.7;',
      '  color:var(--muted,#5b6472);display:flex;flex-wrap:wrap;align-items:baseline;gap:1px 5px;}',
      '.atlas-provision-view-crumb-sep{opacity:.45;}',
      '.atlas-provision-view-crumb{color:var(--muted,#5b6472);}',
      '.atlas-provision-view-crumb-current{color:var(--ink,#1f2430);font-weight:600;}',
      '.atlas-provision-view-crumb-title{color:var(--muted,#5b6472);opacity:.85;}',
      // F6 — interactive collection / structural crumb: reveals the node in the tree
      'button.atlas-provision-view-crumb-nav,a.atlas-provision-view-crumb-nav{',
      '  font:inherit;font-size:inherit;line-height:inherit;margin:0;padding:0;border:0;',
      '  background:none;color:var(--accent,#2E4A7A);cursor:pointer;text-align:left;',
      '  text-decoration:none;}',
      'button.atlas-provision-view-crumb-nav:hover,a.atlas-provision-view-crumb-nav:hover{',
      '  text-decoration:underline;}',
      'button.atlas-provision-view-crumb-nav:focus-visible,a.atlas-provision-view-crumb-nav:focus-visible{',
      '  outline:2px solid var(--accent,#2E4A7A);outline-offset:2px;border-radius:3px;}',
      '.atlas-provision-view-crumb-nav .atlas-provision-view-crumb-title{color:inherit;opacity:.8;}',
      '.atlas-provision-view-close{flex:none;border:1px solid var(--line,#e6e1d6);',
      '  background:var(--panel,#fff);color:var(--muted,#5b6472);border-radius:6px;',
      '  width:28px;height:28px;font-size:14px;line-height:1;cursor:pointer;',
      '  font-family:inherit;}',
      '.atlas-provision-view-close:hover{border-color:var(--accent,#2E4A7A);color:var(--accent,#2E4A7A);}',
      '.atlas-provision-view-close:focus-visible{outline:2px solid var(--accent,#2E4A7A);outline-offset:2px;}',
      '.atlas-provision-view-body{flex:1;overflow-y:auto;padding:18px;}',
      '.atlas-provision-view-heading{margin:0 0 4px;font-size:19px;font-weight:700;line-height:1.35;',
      '  color:var(--ink,#1f2430);}',
      '.atlas-provision-view-badge{display:inline-block;margin-left:8px;font-size:11px;font-weight:600;',
      '  padding:1px 8px;border-radius:999px;background:var(--chip,#f2ede1);color:var(--muted,#5b6472);',
      '  vertical-align:middle;}',
      '.atlas-provision-view-collection{margin:0 0 14px;font-size:12px;color:var(--muted,#5b6472);}',
      // F11.3.2 — exam-frequency line: subordinate, sits under the heading
      '.atlas-provision-view-examfreq{margin:0 0 12px;font-size:11.5px;line-height:1.5;',
      '  color:var(--muted,#5b6472);display:flex;align-items:baseline;gap:6px;}',
      '.atlas-provision-view-examfreq-stars{color:var(--accent,#2E4A7A);font-size:11px;',
      '  letter-spacing:1px;flex:none;}',
      '.atlas-provision-view-examfreq-text{min-width:0;}',
      '.atlas-provision-view-text{font-size:15px;line-height:1.95;color:var(--ink,#1f2430);}',
      '.atlas-provision-view-text p{margin:0 0 .85em;}',
      '.atlas-provision-view-text p:last-child{margin-bottom:0;}',
      '.atlas-provision-view-cancelled .atlas-provision-view-text{opacity:.7;}',
      // F11.3.1A — formatted body: per-chunk วรรค/อนุ lead-in + in-drawer xref links
      '.atlas-provision-view-para{margin:0 0 .95em;}',
      '.atlas-provision-view-para:last-child{margin-bottom:0;}',
      '.atlas-provision-view-para-label{display:block;font-size:11px;font-weight:600;',
      '  letter-spacing:.02em;color:var(--muted,#5b6472);margin-bottom:1px;}',
      '.atlas-provision-view-para-text{display:block;}',
      'a.atlas-provision-view-xref{color:var(--accent,#2E4A7A);text-decoration:underline;',
      '  text-decoration-style:dotted;text-underline-offset:2px;cursor:pointer;}',
      'a.atlas-provision-view-xref:hover{text-decoration-style:solid;}',
      'a.atlas-provision-view-xref:focus-visible{outline:2px solid var(--accent,#2E4A7A);',
      '  outline-offset:2px;border-radius:2px;}',
      '.atlas-provision-view-cases{margin:18px 0 0;font-size:12px;}',
      '.atlas-provision-view-cases-d{border:1px dashed var(--line,#e6e1d6);border-radius:8px;',
      '  padding:6px 12px;}',
      '.atlas-provision-view-cases-sum{list-style:none;cursor:pointer;color:var(--muted,#5b6472);',
      '  font-variant-numeric:tabular-nums;-webkit-user-select:none;user-select:none;}',
      '.atlas-provision-view-cases-sum::-webkit-details-marker{display:none;}',
      '.atlas-provision-view-cases-sum::marker{content:"";}',
      '.atlas-provision-view-cases-d[open]>.atlas-provision-view-cases-sum{color:var(--accent,#2E4A7A);',
      '  font-weight:600;}',
      '.atlas-provision-view-cases-list{display:flex;flex-direction:column;gap:6px;margin-top:8px;}',
      '.atlas-provision-view-case-link{font-size:12px;color:var(--accent,#2E4A7A);line-height:1.45;}',
      '.atlas-provision-view-case-link:hover{text-decoration:underline;}',
      '.atlas-provision-view-adjacent{display:flex;justify-content:space-between;gap:8px;',
      '  margin:20px 0 0;}',
      '.atlas-provision-view-adj{flex:1;border:1px solid var(--line,#e6e1d6);background:var(--panel,#fff);',
      '  color:var(--ink,#1f2430);border-radius:8px;padding:8px 10px;font-size:12px;cursor:pointer;',
      '  font-family:inherit;font-variant-numeric:tabular-nums;text-align:center;}',
      '.atlas-provision-view-adj:hover{border-color:var(--accent,#2E4A7A);background:var(--accent-soft,#eaf0f8);}',
      '.atlas-provision-view-adj:focus-visible{outline:2px solid var(--accent,#2E4A7A);outline-offset:1px;}',
      '.atlas-provision-view-adj-next{text-align:right;}',
      '.atlas-provision-view-adj-prev{text-align:left;}',
      '.atlas-provision-view-full{display:inline-block;margin:20px 0 0;font-size:12.5px;',
      '  color:var(--accent,#2E4A7A);}',
      '.atlas-provision-view-full:hover{text-decoration:underline;}',
      '@media (prefers-reduced-motion:reduce){',
      '  .atlas-provision-view-backdrop,.atlas-provision-view-panel{transition:none;}}',
      '@media (max-width:760px){',
      '  .atlas-provision-view{justify-content:stretch;align-items:flex-end;}',
      '  .atlas-provision-view-backdrop{background:rgba(15,18,26,.34);}',
      '  .atlas-provision-view-panel{width:100%;max-width:100%;height:88vh;',
      '    border-left:0;border-top-left-radius:14px;border-top-right-radius:14px;',
      '    transform:translateY(18px);box-shadow:0 -8px 30px rgba(0,0,0,.22);}',
      '  .atlas-provision-view-open .atlas-provision-view-panel{transform:none;}}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  // ================================================================
  // panel construction
  // ================================================================
  function buildShell() {
    var wrap = make('div', 'atlas-provision-view');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'ตัวบทมาตรา');

    var backdrop = make('div', 'atlas-provision-view-backdrop');
    backdrop.addEventListener('click', function () { requestClose(); });

    var panel = make('div', 'atlas-provision-view-panel');
    panel.setAttribute('tabindex', '-1');

    wrap.appendChild(backdrop);
    wrap.appendChild(panel);
    return { wrap: wrap, panel: panel };
  }

  // F6 — the structural breadcrumb. Each crumb keeps its existing token
  // (c.text, e.g. "ลักษณะ 5") and gains the human title AtlasCore already
  // computed (c.title, e.g. "ละเมิด") as secondary text. The collection and
  // structural crumbs become interactive: activating one closes the drawer and
  // reveals that node in the Atlas tree via the established Phase 4B / F5
  // restore contract. The current provision crumb stays a plain current item.
  function breadcrumbEl(resolved) {
    var crumbs = (resolved && resolved.breadcrumb) || [];
    var nav = make('nav', 'atlas-provision-view-breadcrumb');
    var collection = resolved && resolved.collection;
    var instrument = (resolved && resolved.instrument) || null;
    var structPath = [];   // accumulates structural c.value in order

    crumbs.forEach(function (c, i) {
      if (i) nav.appendChild(make('span', 'atlas-provision-view-crumb-sep', '›'));
      var last = i === crumbs.length - 1;
      var title = (c && typeof c.title === 'string') ? c.title.trim() : '';

      // provision (current) — non-interactive, unchanged
      if (last || c.kind === 'provision' || (!c.field && c.kind !== 'collection')) {
        nav.appendChild(make('span',
          'atlas-provision-view-crumb atlas-provision-view-crumb-current', c.text));
        return;
      }

      // collection crumb — a real link to #/c/<collection>
      if (c.kind === 'collection' && collection) {
        var a = make('a', 'atlas-provision-view-crumb atlas-provision-view-crumb-nav');
        a.setAttribute('href', '#/c/' + encodeURIComponent(collection));
        a.textContent = c.text;
        a.addEventListener('click', function (e) {
          if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
                    (e.button != null && e.button !== 0))) return;   // let modified clicks run
          if (e && e.preventDefault) e.preventDefault();
          activateCrumb('collection', collection, instrument, []);
        });
        nav.appendChild(a);
        return;
      }

      // structural crumb — reveals ["บรรพ 2", …, this value] in the tree
      if (c.field && c.value != null) {
        structPath.push(c.value);
        var path = structPath.slice();
        var btn = make('button', 'atlas-provision-view-crumb atlas-provision-view-crumb-nav');
        btn.setAttribute('type', 'button');
        btn.appendChild(make('span', 'atlas-provision-view-crumb-token', c.text));
        if (title) btn.appendChild(make('span', 'atlas-provision-view-crumb-title', ' · ' + title));
        btn.setAttribute('aria-label',
          c.text + (title ? ' ' + title : '') + ' — เปิดในสารบบกฎหมาย');
        btn.setAttribute('data-atlas-collection', collection || '');
        btn.setAttribute('data-atlas-path', JSON.stringify(path));
        btn.addEventListener('click', function () {
          activateCrumb('structural', collection, instrument, path);
        });
        nav.appendChild(btn);
        return;
      }

      // anything else — plain text, keep the existing token
      nav.appendChild(make('span', 'atlas-provision-view-crumb', c.text));
    });
    return nav;
  }

  // Close the drawer, then return to the Atlas tree and reveal the crumb's
  // node. Reuses the EXISTING contract only:
  //   in-page (atlas.html, AtlasUI loaded) → AtlasUI._internal.restoreReturn(
  //       root, { hash, instrument, path })   (Phase 4B / F5, injected form)
  //   cross-page (concept.html, no tree here) → write the Phase 4B
  //       sessionStorage['atlas:return'] context, then load atlas.html#/c/<col>
  // Close the drawer for a crumb navigation: strip our ?a= param from the
  // CURRENT history entry (never history.back — see activateCrumb) and remove
  // the panel. Same effect as requestClose()'s non-own-entry branch.
  function closeDrawerForNav() {
    if (!isOpen()) return;
    try { global.history.replaceState({}, '', urlWithoutParam()); } catch (e) { /* ignore */ }
    try { teardown(); } catch (e) { /* ignore */ }
  }

  function activateCrumb(kind, collection, instrument, path) {
    if (!collection) return;
    var wantHash = '#/c/' + collection + (instrument ? '/i/' + instrument : '');
    var UI = global.AtlasUI;
    var canRevealInPage = !!(UI && UI._internal &&
      typeof UI._internal.restoreReturn === 'function' && _root);

    if (!canRevealInPage) {
      // cross-page: hand the reveal to atlas.html via the established key
      if (kind === 'structural') {
        try {
          global.sessionStorage.setItem('atlas:return', JSON.stringify({
            hash: wantHash, instrument: instrument || null, path: path
          }));
        } catch (e) { /* best effort */ }
      }
      closeDrawerForNav();
      try { global.location.assign('atlas.html' + wantHash); }
      catch (e) { try { global.location.href = 'atlas.html' + wantHash; } catch (e2) {} }
      return;
    }

    // in-page: close the drawer, then navigate + reveal.
    // NOTE: we do NOT use requestClose() here — its `_hasOwnEntry` branch calls
    // history.back(), which races the location.hash write below on a cross-
    // collection reveal. Strip our ?a= entry and tear down directly instead.
    closeDrawerForNav();

    var doReveal = function () {
      if (kind === 'collection') return;   // hash write already did it
      try { UI._internal.restoreReturn(_root, { hash: wantHash, instrument: instrument || null, path: path }); }
      catch (e) { /* fail soft */ }
    };

    setTimeout(function () {
      var sameCollection = (global.location.hash || '#/') === wantHash;
      if (kind === 'collection') {
        if (!sameCollection) { try { global.location.hash = wantHash; } catch (e) {} }
        return;
      }
      if (sameCollection) { doReveal(); return; }
      // switch collection, reveal after AtlasUI re-renders on hashchange (F5 pattern)
      var offOnce = function () {
        if (typeof global.removeEventListener === 'function') global.removeEventListener('hashchange', once);
      };
      var once = function () {
        offOnce();
        var raf = global.requestAnimationFrame || function (fn) { return setTimeout(fn, 0); };
        raf(doReveal);
      };
      global.addEventListener('hashchange', once);
      try { global.location.hash = wantHash; }
      catch (e) { offOnce(); }
    }, 0);
  }

  // ================================================================
  // F11.3.1A — formatted provision body + มาตรา cross-references
  //
  // Mirrors the legacy article-viewer's reading structure, built with DOM
  // nodes ONLY (never innerHTML — legal text is textContent throughout):
  //   - chunks split on "\n" (same as the legacy renderer)
  //   - > 1 chunk → each gets a วรรค<ลำดับ> / อนุ (n) lead-in; the chunk's
  //     own text (including any original "(n)" marker) is never altered
  //   - a genuine "มาตรา <n>" reference that resolves to a real provision in
  //     the SAME collection (and instrument) becomes an in-drawer link
  //     (.atlas-provision-view-xref → closestProvisionAnchor → onRootClick →
  //     updateOpen, history 'replace', hash untouched). Never self-links.
  //     Unknown / cross-collection-ambiguous refs stay plain text.
  // Fails soft to plain paragraphs whenever AtlasCore / the corpus is absent.
  // ================================================================
  var MATRA_SUFFIXES = 'ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว|ทศ';
  function matraRefRe() {
    // "มาตรา 28" · "มาตรา ๑๙๓/๑" · "มาตรา 4 ทวิ" — same shape the legacy
    // linkifyMatraRefs() matches. Fresh instance per call (own lastIndex).
    return new RegExp(
      'มาตรา\\s*([0-9๐-๙]+(?:\\s*\\/\\s*[0-9๐-๙]+)?)(?:\\s+(' +
        MATRA_SUFFIXES + ')(?![ก-ฮ]))?', 'g');
  }
  function toArabicDigits(s) {
    var AC = global.AtlasCore;
    if (AC && typeof AC.thaiToArabic === 'function') return AC.thaiToArabic(s);
    return String(s == null ? '' : s).replace(/[๐-๙]/g, function (d) {
      return String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d));
    });
  }
  function normalizeMatra(rawNum, rawSuffix) {
    var n = toArabicDigits(rawNum).replace(/\s+/g, '');
    return rawSuffix ? (n + ' ' + rawSuffix) : n;
  }

  var THAI_ORD_WORD = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  function thaiOrdinalWord(n) {
    if (n <= 0) return String(n);
    if (n < 10) return THAI_ORD_WORD[n];
    if (n < 20) return n === 10 ? 'สิบ' : (n === 11 ? 'สิบเอ็ด' : 'สิบ' + THAI_ORD_WORD[n - 10]);
    var tens = Math.floor(n / 10), ones = n % 10;
    var tensWord = tens === 2 ? 'ยี่สิบ' : THAI_ORD_WORD[tens] + 'สิบ';
    if (ones === 0) return tensWord;
    return tensWord + (ones === 1 ? 'เอ็ด' : THAI_ORD_WORD[ones]);
  }

  // Append `raw` into `target`, turning genuine มาตรา references into in-drawer
  // <a> links. `resolved` supplies the collection / instrument scope and the
  // current number (never self-links). Pure text otherwise.
  function appendLinkedText(target, raw, resolved) {
    var text = String(raw == null ? '' : raw);
    var AC = global.AtlasCore;
    var collection = resolved && resolved.collection;
    var canLink = !!(text && AC && collection && typeof AC.getProvisionBrief === 'function');
    if (!canLink) { target.appendChild(doc.createTextNode(text)); return; }

    var selfNum = (resolved && resolved.number != null) ? String(resolved.number) : null;
    var instrument = (resolved && resolved.instrument) || undefined;
    var re = matraRefRe();
    var pos = 0, m;
    while ((m = re.exec(text))) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      var candidate = normalizeMatra(m[1], m[2]);
      var brief = null;
      if (candidate && candidate !== selfNum) {
        // getProvisionBrief only ever checks the collection we pass — a bare
        // number is NEVER resolved against another collection.
        try { brief = AC.getProvisionBrief(collection, candidate, instrument); }
        catch (e) { brief = null; }
      }
      if (!brief || !brief.viewerUrl) continue;   // unknown ref → left in a later text slice
      if (m.index > pos) target.appendChild(doc.createTextNode(text.slice(pos, m.index)));
      var vu = brief.viewerUrl;   // codex-article-viewer.html?id=<collection>_<number>
      var a = make('a', 'atlas-provision-view-xref', m[0]);
      a.setAttribute('href', vu + (vu.indexOf('?') === -1 ? '?' : '&') + 'x=atlas');
      target.appendChild(a);
      pos = m.index + m[0].length;
    }
    target.appendChild(doc.createTextNode(text.slice(pos)));
  }

  function textEl(resolved) {
    var raw = resolved && resolved.article && resolved.article.text;
    var box = make('div', 'atlas-provision-view-text');
    var chunks = String(raw == null ? '' : raw).split('\n').filter(function (p) {
      return p.trim();
    });

    if (!chunks.length) {
      box.appendChild(make('p', 'atlas-provision-view-para', '(ไม่มีตัวบทในคลังข้อมูล)'));
      return box;
    }
    if (chunks.length === 1) {
      var only = make('p', 'atlas-provision-view-para');
      appendLinkedText(only, chunks[0].trim(), resolved);
      box.appendChild(only);
      return box;
    }
    var warakN = 0;
    chunks.forEach(function (chunk) {
      var t = chunk.trim();
      var para = make('div', 'atlas-provision-view-para');
      var anu = t.match(/^\(([0-9๐-๙]+)\)/);
      var label = anu ? ('อนุ (' + toArabicDigits(anu[1]) + ')')
                      : ('วรรค' + thaiOrdinalWord(warakN += 1));
      para.appendChild(make('span', 'atlas-provision-view-para-label', label));
      var bodySpan = make('span', 'atlas-provision-view-para-text');
      appendLinkedText(bodySpan, t, resolved);
      para.appendChild(bodySpan);
      box.appendChild(para);
    });
    return box;
  }

  // ================================================================
  // F11.3.2 — exam-frequency badge
  //
  // Faithful to the legacy article-viewer, which renders
  //   examFreq {count, stars}  →  ★×stars  (title "ออกสอบเนติ <count> ครั้ง")
  // `count` = how many times the provision has been examined in the
  // เนติบัณฑิต (Thai Bar) exam; `stars` is the legacy 1–3 tier of that count
  // (1: count 1 · 2: count 2–3 · 3: count 4+). We keep BOTH meanings:
  //   - a readable count sentence carries the signal for assistive tech and
  //     works without colour (STEP 5),
  //   - the stars are a decorative tier indicator, aria-hidden.
  // Never a percentage / ranking / probability / "importance" score. Not
  // interactive. Renders nothing (returns null) when examFreq is absent,
  // null, malformed, or non-positive — the drawer is otherwise untouched.
  // ================================================================
  function examFreqEl(resolved) {
    var ef = resolved && resolved.article && resolved.article.examFreq;
    if (!ef || typeof ef !== 'object' || _isArray(ef)) return null;
    var count = Number(ef.count);
    if (!isFinite(count) || count <= 0) return null;
    var stars = Math.round(Number(ef.stars));
    if (!isFinite(stars) || stars < 1) stars = 1;
    if (stars > 5) stars = 5;

    var wrap = make('p', 'atlas-provision-view-examfreq');
    var starEl = make('span', 'atlas-provision-view-examfreq-stars',
      new Array(stars + 1).join('★'));
    starEl.setAttribute('aria-hidden', 'true');
    wrap.appendChild(starEl);
    wrap.appendChild(make('span', 'atlas-provision-view-examfreq-text',
      'ออกสอบเนติ ' + count + ' ครั้ง'));
    return wrap;
  }
  function _isArray(x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  }

  function adjacentEl(resolved) {
    var nav = make('nav', 'atlas-provision-view-adjacent');
    var adj = adjacent(resolved.collection, resolved.storageKey);
    var AC = global.AtlasCore;
    function label(sk) {
      // sk is a storage key (bare number for single-instrument collections)
      var num = sk;
      try {
        if (AC && typeof AC.getProvisionBrief === 'function') {
          var b = AC.getProvisionBrief(resolved.collection, sk, resolved.instrument || undefined);
          if (b && b.number) return (b.unit || resolved.unit) + ' ' + b.number;
        }
      } catch (e) { /* ignore */ }
      return (resolved.unit || 'มาตรา') + ' ' + num;
    }
    if (adj.prev) {
      var pv = make('button', 'atlas-provision-view-adj atlas-provision-view-adj-prev',
        '‹ ' + label(adj.prev));
      pv.type = 'button';
      pv.addEventListener('click', function () { navigateTo(resolved.collection, adj.prev, resolved.instrument); });
      nav.appendChild(pv);
    }
    if (adj.next) {
      var nx = make('button', 'atlas-provision-view-adj atlas-provision-view-adj-next',
        label(adj.next) + ' ›');
      nx.type = 'button';
      nx.addEventListener('click', function () { navigateTo(resolved.collection, adj.next, resolved.instrument); });
      nav.appendChild(nx);
    }
    return nav.children && nav.children.length ? nav : null;
  }

  function casesEl(resolved) {
    var box = make('div', 'atlas-provision-view-cases');
    box.hidden = true;
    loadCaseIndex().then(function (index) {
      var cases;
      try { cases = publicCasesFrom(index, resolved.collection, resolved.number); }
      catch (e) { cases = []; }
      if (!cases.length || !box.parentNode) return;
      var d = make('details', 'atlas-provision-view-cases-d');
      var sum = make('summary', 'atlas-provision-view-cases-sum',
        '· ' + cases.length + ' คดีที่เกี่ยวข้อง');
      d.appendChild(sum);
      var list = make('div', 'atlas-provision-view-cases-list');
      cases.forEach(function (c) {
        var a = make('a', 'atlas-provision-view-case-link', c.title || c.id);
        a.setAttribute('href', 'prototype/read-case.html?id=' + encodeURIComponent(c.id));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        list.appendChild(a);
      });
      d.appendChild(list);
      box.appendChild(d);
      box.hidden = false;
    });
    return box;
  }

  function renderInto(panel, resolved) {
    while (panel.firstChild) panel.removeChild(panel.firstChild);

    var header = make('div', 'atlas-provision-view-header');
    header.appendChild(breadcrumbEl(resolved));
    var close = make('button', 'atlas-provision-view-close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', 'ปิดตัวบท');
    close.addEventListener('click', function () { requestClose(); });
    header.appendChild(close);
    panel.appendChild(header);

    var body = make('div', 'atlas-provision-view-body');

    var h = make('h2', 'atlas-provision-view-heading');
    h.setAttribute('tabindex', '-1');
    h.appendChild(doc.createTextNode((resolved.unit || 'มาตรา') + ' ' + resolved.number));
    if (resolved.cancelled) {
      h.appendChild(make('span', 'atlas-provision-view-badge', 'ยกเลิกแล้ว'));
    }
    body.appendChild(h);

    // F11.3.2 — read-only exam-frequency signal, subordinate to the heading.
    // Renders nothing when the provision has no examFreq (fail-soft).
    var ef = examFreqEl(resolved);
    if (ef) body.appendChild(ef);

    body.appendChild(make('p', 'atlas-provision-view-collection',
      resolved.collectionTitle || resolved.collection));

    body.appendChild(textEl(resolved));

    // F11.3.4 — provision-level lecture notes (editorial explanation), a
    // STANDALONE progressive-enhancement layer sourced from the SAME
    // codex-data.json articles.<n>.lectureNotes[] the legacy viewer and the
    // Concept layer already read (nothing copied, nothing new). atlas-
    // provision-lectures.js fills this container synchronously and renders
    // nothing when the provision has no lectureNotes. Sits between the
    // statutory text and the Concept backlink per the Atlas layering:
    // STRUCTURE → CONCEPT → PROVISION → CASE → REASONING/EXPLANATION.
    // Progressive enhancement: absent / failed → the panel is unchanged.
    var plectures = make('div', 'atlas-provision-view-lectures');
    body.appendChild(plectures);
    try {
      if (global.AtlasProvisionLectures &&
          typeof global.AtlasProvisionLectures.renderSection === 'function') {
        global.AtlasProvisionLectures.renderSection(plectures, resolved);
      }
    } catch (e) { /* fail soft */ }

    // Provision → Concept backlink (F4) — a curated Concept that covers this
    // provision, derived in memory from the Concept layer. atlas-provision-
    // concepts.js fills this container async and renders nothing when the
    // provision has no concept. Progressive enhancement: absent / failed /
    // no Concept layer on this page → the panel is unchanged.
    var pconcepts = make('div', 'atlas-provision-view-concepts');
    body.appendChild(pconcepts);
    try {
      if (global.AtlasProvisionConcepts &&
          typeof global.AtlasProvisionConcepts.renderSection === 'function') {
        global.AtlasProvisionConcepts.renderSection(pconcepts, resolved);
      }
    } catch (e) { /* fail soft */ }

    body.appendChild(casesEl(resolved));

    // Related Provision Legal Clusters (FINALIZATION 2) — a curated editorial
    // layer. atlas-clusters.js fills this container async and renders nothing
    // when there is no curated cluster for this provision. Progressive
    // enhancement: absent / failed → the panel is unchanged.
    var clusters = make('div', 'atlas-provision-view-clusters');
    body.appendChild(clusters);
    try {
      if (global.AtlasClusters && typeof global.AtlasClusters.renderSection === 'function') {
        global.AtlasClusters.renderSection(clusters, resolved);
      }
    } catch (e) { /* fail soft */ }

    var adj = adjacentEl(resolved);
    if (adj) body.appendChild(adj);

    // F11.2 — explicit, honestly-labelled fallback to the legacy reading tools
    // (เสียง / พิมพ์ / ไฮไลต์ / คำสำคัญ / ความถี่ข้อสอบ / ฎีกา / ตัวอย่าง) that the
    // Atlas drawer does not provide. NOT the primary provision action; it sits
    // after previous/next. The provision identity + x=atlas marker stay exactly
    // as AtlasCore computed them — this remains the compatibility URL.
    var full = make('a', 'atlas-provision-view-full', 'อ่านแบบเต็ม (เสียง · พิมพ์ · ไฮไลต์) →');
    var vu = resolved.viewerUrl || ('codex-article-viewer.html?id=' +
      encodeURIComponent(resolved.legacyId || (resolved.collection + '_' + resolved.number)));
    full.setAttribute('href', vu + (vu.indexOf('?') === -1 ? '?' : '&') + 'x=atlas');
    // Record the open provision under the isolated key `atlas:return:a` just
    // before the browser leaves, so a legacy return that lands WITHOUT ?a=
    // (older viewer / stripped URL) can still be recovered by init(). The
    // normal legacy "← กลับไป" carries ?a= and needs no storage. Never
    // preventDefault — the legacy navigation proceeds normally.
    full.addEventListener('click', function () {
      try { writeFallbackReturn(resolved); } catch (e) { /* never block navigation */ }
    });
    body.appendChild(full);

    panel.appendChild(body);
    if (_wrapEl) {
      _wrapEl.setAttribute('aria-label',
        (resolved.unit || 'มาตรา') + ' ' + resolved.number + ' — ' +
        (resolved.collectionTitle || resolved.collection));
    }
  }

  // ================================================================
  // focus management
  // ================================================================
  function focusables() {
    if (!_panelEl) return [];
    var sel = 'a[href],button:not([disabled]),summary,[tabindex]';
    var list = [];
    try {
      var found = _panelEl.querySelectorAll(sel);
      for (var i = 0; i < found.length; i++) {
        var n = found[i];
        if (n.hidden) continue;
        list.push(n);
      }
    } catch (e) { /* shim */ }
    return list;
  }
  function onKeydown(e) {
    if (!isOpen()) return;
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      requestClose();
      return;
    }
    if (e.key === 'Tab' || e.keyCode === 9) {
      var f = focusables();
      if (!f.length) { e.preventDefault(); if (_panelEl.focus) _panelEl.focus(); return; }
      var first = f[0], last = f[f.length - 1];
      var active = doc.activeElement;
      var within = false;
      for (var i = 0; i < f.length; i++) if (f[i] === active) { within = true; break; }
      if (!within) { e.preventDefault(); if (first.focus) first.focus(); return; }
      if (e.shiftKey && active === first) { e.preventDefault(); if (last.focus) last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); if (first.focus) first.focus(); }
    }
  }

  // ================================================================
  // open / close / navigate
  // ================================================================
  function isOpen() { return !!_wrapEl; }

  function lockScroll() {
    try {
      if (doc.body && _prevBodyOverflow === null) {
        _prevBodyOverflow = doc.body.style.overflow || '';
        doc.body.style.overflow = 'hidden';
      }
    } catch (e) { /* ignore */ }
  }
  function unlockScroll() {
    try {
      if (doc.body && _prevBodyOverflow !== null) {
        doc.body.style.overflow = _prevBodyOverflow;
        _prevBodyOverflow = null;
      }
    } catch (e) { /* ignore */ }
  }

  // open a NEW panel from a closed state
  function openFresh(resolved, opts) {
    opts = opts || {};
    injectStyle();
    var shell = buildShell();
    _wrapEl = shell.wrap;
    _panelEl = shell.panel;
    renderInto(_panelEl, resolved);
    // The panel is a SIBLING of #atlas-root, so clicks inside it never reach
    // the root's provision-pill handler. Bind the SAME handler here so a
    // cluster member pill (a.atlas-provision) opens in this reader, exactly
    // like a structure-tree pill. Lives and dies with this panel; updateOpen
    // reuses the same _panelEl so it persists across prev/next.
    try { _panelEl.addEventListener('click', onRootClick, true); } catch (e) { /* ignore */ }
    if (_root && _root.parentNode) _root.parentNode.insertBefore(_wrapEl, _root.nextSibling);
    else if (doc.body) doc.body.appendChild(_wrapEl);

    _current = { collection: resolved.collection, instrument: resolved.instrument || null, number: resolved.number };

    if (opts.source) _lastFocused = opts.source;
    else if (doc.activeElement) _lastFocused = doc.activeElement;

    // history: a real open pushes ONE entry; a popstate/deep-link open does not
    var ref = refOf(resolved);
    if (opts.history === 'push') {
      try { global.history.pushState({ apv: ref }, '', urlWithParam(ref)); _hasOwnEntry = true; }
      catch (e) { _hasOwnEntry = false; }
    } else if (opts.history === 'replace') {
      try { global.history.replaceState({ apv: ref }, '', urlWithParam(ref)); }
      catch (e) { /* ignore */ }
      _hasOwnEntry = false;
    } else {
      _hasOwnEntry = false;
    }

    lockScroll();
    // transition-in on next frame
    var raf = global.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
    raf(function () { if (_wrapEl) _wrapEl.className = 'atlas-provision-view atlas-provision-view-open'; });
    if (_panelEl && _panelEl.focus) { try { _panelEl.focus(); } catch (e) {} }
  }

  // change the article shown in an ALREADY-open panel (prev/next, or a
  // different pill clicked while the panel is up) — one history entry only.
  function updateOpen(resolved, opts) {
    opts = opts || {};
    renderInto(_panelEl, resolved);
    _current = { collection: resolved.collection, instrument: resolved.instrument || null, number: resolved.number };
    if (opts.source) _lastFocused = opts.source;
    if (opts.history === 'replace') {
      var ref = refOf(resolved);
      try { global.history.replaceState({ apv: ref }, '', urlWithParam(ref)); }
      catch (e) { /* ignore */ }
    }
    // keep the reader oriented: focus the new heading
    try {
      var hd = _panelEl.querySelector('.atlas-provision-view-heading');
      if (hd && hd.focus) hd.focus();
    } catch (e) { /* shim */ }
  }

  function openProvision(collection, number, opts) {
    opts = opts || {};
    var resolved = resolve(collection, number, opts.instrument);
    if (!resolved) return false;          // unknown → caller lets the legacy link run
    if (isOpen()) updateOpen(resolved, { source: opts.source, history: opts.history === 'none' ? 'none' : 'replace' });
    else openFresh(resolved, { source: opts.source, history: opts.history || 'push' });
    return true;
  }

  // prev/next inside the viewer — replace, never stack
  function navigateTo(collection, storageKey, instrument) {
    var resolved = resolve(collection, storageKey, instrument);
    if (!resolved) return;
    updateOpen(resolved, { history: 'replace' });
  }

  // user asked to close (button / Esc / backdrop)
  function requestClose() {
    if (!isOpen()) return;
    if (_hasOwnEntry) {
      // pop our entry; the popstate handler performs the teardown
      try { global.history.back(); return; }
      catch (e) { /* fall through to direct teardown */ }
    }
    try { global.history.replaceState({}, '', urlWithoutParam()); } catch (e) { /* ignore */ }
    teardown();
  }

  // actually remove the panel from the DOM + restore focus
  function teardown() {
    if (!_wrapEl) return;
    var wrap = _wrapEl;
    _wrapEl = null;
    _panelEl = null;
    _current = null;
    _hasOwnEntry = false;
    try { wrap.className = 'atlas-provision-view'; } catch (e) {}
    var done = function () {
      try { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } catch (e) {}
    };
    if (global.requestAnimationFrame) setTimeout(done, 200); else done();
    unlockScroll();
    var back = _lastFocused;
    _lastFocused = null;
    try {
      if (back && back.focus && (!doc.contains || doc.contains(back))) back.focus();
    } catch (e) { /* ignore */ }
  }

  // ================================================================
  // event wiring
  // ================================================================
  function onRootClick(e) {
    if (e.defaultPrevented) return;
    if (e.button != null && e.button !== 0) return;                 // middle / right
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // modified → passthrough
    var a = closestProvisionAnchor(e.target);
    if (!a) return;                                                 // not a provision pill
    var ref = parseProvisionHref(a.getAttribute && a.getAttribute('href'));
    if (!ref) return;                                               // malformed → let href run
    var route = currentRoute();
    var collection = ref.collection || route.collection;
    var instrument = ref.instrument || route.instrument;
    var resolved = resolve(collection, ref.number, instrument);
    if (!resolved) return;                                          // unknown → let href run
    e.preventDefault();
    if (isOpen()) updateOpen(resolved, { source: a, history: 'replace' });
    else openFresh(resolved, { source: a, history: 'push' });
  }

  function onPopState() {
    var p = parseParam(readParam());
    if (p) {
      var route = currentRoute();
      var resolved = resolve(p.collection || route.collection, p.number, p.instrument || route.instrument);
      if (!resolved) { if (isOpen()) teardown(); return; }
      if (isOpen()) updateOpen(resolved, { history: 'none' });
      else openFresh(resolved, { history: 'none' });
    } else if (isOpen()) {
      teardown();
    }
  }

  function onHashChange() {
    // the underlying Atlas route changed — a provision panel over the new
    // view would be wrong. Drop it (and the param) without adding history.
    if (!isOpen()) return;
    try { global.history.replaceState({}, '', urlWithoutParam()); } catch (e) { /* ignore */ }
    teardown();
  }

  function bind() {
    if (_bound || !_root) return;
    _bound = true;
    _root.addEventListener('click', onRootClick, true);   // capture phase
    global.addEventListener('popstate', onPopState);
    global.addEventListener('hashchange', onHashChange);
    doc.addEventListener('keydown', onKeydown, true);
  }

  // ================================================================
  // init  (called from atlas.html after AtlasUI.mount)
  // ================================================================
  function init(opts) {
    opts = opts || {};
    if (!doc) return;
    _root = opts.root || doc.getElementById(ROOT_ID);
    if (!_root) return;
    injectStyle();
    bind();
    // deep link / refresh:
    //   atlas.html?a=<collection>_<number>#/c/<collection>   (hash optional)
    //   concept.html?k=<slug>&a=<collection>_<number>
    var p = parseParam(readParam());
    if (p) {
      var route = currentRoute();
      var resolved = resolve(p.collection || route.collection, p.number, p.instrument || route.instrument);
      if (resolved) {
        openFresh(resolved, { history: 'replace' });
        consumeRecoveryRef();   // F11.2 — the URL ?a= satisfied the round-trip
      } else {
        // unknown article in a deep link — fail soft: strip only the param,
        // keep every sibling param (e.g. concept.html's ?k=<slug>)
        try { global.history.replaceState({}, '', urlWithoutParam()); } catch (e) { /* ignore */ }
      }
    } else {
      // F11.2 — one-shot recovery after an explicit legacy-fallback round-trip
      recoverFromReturn();
    }
  }

  // ================================================================
  // expose
  // ================================================================
  global.AtlasProvisionView = {
    version: '1.0',
    init: init,
    close: requestClose,
    isOpen: isOpen,
    _internal: {
      breadcrumbEl: breadcrumbEl,
      activateCrumb: activateCrumb,
      parseProvisionHref: parseProvisionHref,
      splitId: splitId,
      parseParam: parseParam,
      refOf: refOf,
      currentRoute: currentRoute,
      readParam: readParam,
      buildSearch: buildSearch,
      urlWithParam: urlWithParam,
      urlWithoutParam: urlWithoutParam,
      resolve: resolve,
      formattedTextEl: textEl,
      appendLinkedText: appendLinkedText,
      matraRefRe: matraRefRe,
      examFreqEl: examFreqEl,
      publicCasesFrom: publicCasesFrom,
      closestProvisionAnchor: closestProvisionAnchor,
      openProvision: openProvision,
      navigateTo: navigateTo,
      onRootClick: onRootClick,
      onPopState: onPopState,
      onHashChange: onHashChange,
      onKeydown: onKeydown,
      teardown: teardown,
      panelEl: function () { return _panelEl; },
      wrapEl: function () { return _wrapEl; },
      current: function () { return _current; },
      hasOwnEntry: function () { return _hasOwnEntry; },
      setCaseIndex: function (obj) { _caseIndexPromise = Promise.resolve(obj && typeof obj === 'object' ? obj : {}); },
      reset: function () {
        if (_wrapEl && _wrapEl.parentNode) { try { _wrapEl.parentNode.removeChild(_wrapEl); } catch (e) {} }
        _wrapEl = null; _panelEl = null; _current = null; _hasOwnEntry = false;
        _lastFocused = null; _prevBodyOverflow = null;
      }
    }
  };
})(typeof window !== 'undefined' ? window : this);
