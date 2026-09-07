/* atlas-cases.js — Atlas ↔ case-law association layer.

   ADDITIVE / STANDALONE. Two decorations over the DOM the frozen Phase
   3/4A/4B renderer emits in atlas.html:

   Phase 4C-1 — per provision pill: a compact "· N คดี" disclosure listing
     the PUBLIC cases that cite that มาตรา.
   Phase 4C-2 — per expanded structural LEAF node body: a "· N คดีที่เกี่ยวข้อง"
     disclosure listing the UNIQUE public cases across every provision under
     that node. Data-derived from AtlasCore.getStructureTree() (public
     read-only API) — NOT from the rendered pills — so it is correct even
     before/without pill decoration and never forces the tree to expand.

   Source of truth: prototype/assets/cases/article-case-index.json — the
   SAME prebuilt index neural-network.html consumes. Not regenerated here.

   Hard boundaries (see Phase 4C-0 / 4C-1 / 4C-2-0 gates):
     - never calls AtlasUI internals or nodeKey(); the only AtlasCore call
       is the public getStructureTree(); AtlasCore is never mutated
     - never touches atlas:return, routing, breadcrumbs, node.path, or the
       route grammar (the hash is READ to know the current collection)
     - structural identity = collection + instrument? + the actual node
       object from getStructureTree() reached by positional DOM↔data walk;
       never label text, never dataset.atlasKey
     - never nests an <a> inside the existing provision <a>
     - counts PUBLIC cases only, deduped by case id; never exposes a
       private slug/title/link
     - lazy: decorates pills / node bodies only as they appear; never
       force-expands the tree, never reads un-rendered DOM
     - fails soft: any error leaves the Atlas fully usable, no throw
*/
(function (global) {
  'use strict';

  var INDEX_URL = 'prototype/assets/cases/article-case-index.json';
  var ROOT_ID = 'atlas-root';
  var PILL_SELECTOR = 'a.atlas-provision, a.atlas-provision-cancelled';

  var INDEX = {};
  var READY = false;
  var observer = null;

  // ---- join key -----------------------------------------------------
  // A pill href is  codex-article-viewer.html?id=<collection>_<number>[&x=atlas]
  // The index key is "<collection>:<number>". Collection keys never contain
  // "_" and provision numbers never contain "_" (sub-numbers use "/", e.g.
  // 1447/2), so the FIRST "_" is the split point. Multi-instrument ids carry
  // "<instrument>::<number>" — out of scope for this MVP, skipped.
  function keyFromHref(href) {
    try {
      var m = /[?&]id=([^&#]+)/.exec(String(href || ''));
      if (!m) return null;
      var id;
      try { id = decodeURIComponent(m[1]); } catch (e) { id = m[1]; }
      var us = id.indexOf('_');
      if (us < 1 || us === id.length - 1) return null;
      var number = id.slice(us + 1);
      if (number.indexOf('::') !== -1) return null;   // multi-instrument
      return id.slice(0, us) + ':' + number;
    } catch (e) { return null; }
  }

  // ---- public-only case list -------------------------------------
  function publicCasesFor(key) {
    var arr = (key && INDEX && Object.prototype.hasOwnProperty.call(INDEX, key))
      ? INDEX[key] : null;
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (c && c.public === true && typeof c.id === 'string' && c.id) out.push(c);
    }
    return out;
  }

  // ---- decorate one pill ---------------------------------------
  function decoratePill(pill) {
    try {
      if (!READY || !pill || !pill.getAttribute) return;
      if (pill.dataset && pill.dataset.casesDecorated) return;
      var parent = pill.parentNode;
      if (!parent || !parent.insertBefore) return;

      var key = keyFromHref(pill.getAttribute('href'));
      var cases = key ? publicCasesFor(key) : [];

      // Mark BEFORE building — a pill with no public cases is settled and
      // must not be rescanned; a decorated pill must not be re-wrapped.
      if (pill.dataset) pill.dataset.casesDecorated = '1';
      if (!cases.length) return;

      var doc = global.document;

      // Wrapper becomes the grid cell; the provision <a> keeps its class,
      // its href and its text unchanged — it is only moved one level down.
      var wrap = doc.createElement('span');
      wrap.className = 'atlas-pcases';
      parent.insertBefore(wrap, pill);
      wrap.appendChild(pill);

      // Native <details> — accessible, keyboard-operable, no JS toggle, and
      // its links are SIBLINGS of the provision <a>, never nested in it.
      var d = doc.createElement('details');
      d.className = 'atlas-pcases-d';

      var sum = doc.createElement('summary');
      sum.className = 'atlas-pcases-sum';
      sum.textContent = '· ' + cases.length + ' คดี';
      d.appendChild(sum);

      var list = doc.createElement('div');
      list.className = 'atlas-pcases-list';
      for (var i = 0; i < cases.length; i++) {
        var a = doc.createElement('a');
        a.className = 'atlas-pcases-link';
        a.setAttribute('href',
          'prototype/read-case.html?id=' + encodeURIComponent(cases[i].id));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        a.textContent = cases[i].title || cases[i].id;
        list.appendChild(a);
      }
      d.appendChild(list);
      wrap.appendChild(d);
    } catch (e) { /* fail soft — never break the Atlas */ }
  }

  function eachPill(node, fn) {
    if (!node || node.nodeType !== 1) return;
    try {
      if (node.matches && node.matches(PILL_SELECTOR)) fn(node);
      if (node.querySelectorAll) {
        var found = node.querySelectorAll(PILL_SELECTOR);
        for (var i = 0; i < found.length; i++) fn(found[i]);
      }
    } catch (e) { /* ignore */ }
  }

  function decorateAll() {
    var root = global.document && global.document.getElementById(ROOT_ID);
    if (!root) return;
    eachPill(root, decoratePill);   // Phase 4C-1 — per-provision badges
    scanNodeBodies(root);           // Phase 4C-2 — per-leaf-node aggregates
  }

  // ================================================================
  // Phase 4C-2 — structural LEAF node → aggregated public cases
  // ================================================================
  // treeCache is a pure per-collection function cache of the (route-invariant)
  // structural tree; it holds no per-node or per-route mutable state, so it
  // cannot go stale across hash changes.
  var treeCache = {};

  // Current Atlas route, READ (not routed) from the hash: "#/c/<col>[/i/<inst>]".
  function currentRoute() {
    var h = (global.location && global.location.hash) || '';
    var m = /^#\/c\/([^/?&]+)(?:\/i\/([^/?&]+))?/.exec(h);
    if (!m) return { collection: null, instrument: null };
    function dec(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
    return { collection: dec(m[1]), instrument: m[2] ? dec(m[2]) : null };
  }

  // AtlasCore.getStructureTree is the PUBLIC navigation-spine API (read-only,
  // no mutation). Cached per collection — the tree is invariant for the page.
  function getTree(collection) {
    if (!collection) return null;
    if (Object.prototype.hasOwnProperty.call(treeCache, collection)) return treeCache[collection];
    var t = null;
    try {
      var AC = global.AtlasCore;
      if (AC && typeof AC.getStructureTree === 'function') t = AC.getStructureTree(collection);
    } catch (e) { t = null; }
    treeCache[collection] = t;
    return t;
  }

  // Positional DOM ↔ data-node correspondence.
  // FROZEN-RENDERER ASSUMPTION: the Phase 3/4B renderer builds each level with
  // `nodes.forEach(function (n) { ul.appendChild(treeNode(n)); })` and applies
  // NO filtering for single-instrument collections, so the Nth <li.atlas-node>
  // inside a <ul.atlas-tree> is exactly nodes[N], recursively. We ascend from
  // `li` collecting sibling indices, then descend the data tree by those
  // indices. Identity is never taken from label text, nodeKey, or dataset.
  function dataNodeForEl(li, collection) {
    if (!li || !li.classList || !li.classList.contains('atlas-node')) return null;
    var chain = [];
    var cur = li;
    while (cur && cur.classList && cur.classList.contains('atlas-node')) {
      var ul = cur.parentNode;
      if (!ul || !ul.children) return null;
      var sibs = [];
      for (var s = 0; s < ul.children.length; s++) {
        var ch = ul.children[s];
        if (ch && ch.classList && ch.classList.contains('atlas-node')) sibs.push(ch);
      }
      var idx = sibs.indexOf(cur);
      if (idx < 0) return null;
      chain.unshift(idx);
      var up = ul.parentNode;   // .atlas-node-body  OR  .atlas-structure (root)
      if (up && up.classList && up.classList.contains('atlas-node-body')) {
        cur = up.parentNode;    // the parent <li.atlas-node>
      } else {
        cur = null;             // reached the root <ul.atlas-tree>
      }
    }
    var tree = getTree(collection);
    if (!tree || !tree.nodes) return null;
    var nodes = tree.nodes, node = null;
    for (var k = 0; k < chain.length; k++) {
      node = nodes[chain[k]];
      if (!node) return null;
      nodes = node.children || [];
    }
    return node;
  }

  // Generic descendant sweep — every provision number at or below a node.
  // Recursion is ready for a future parent-rollup UI; the MVP only calls it
  // on leaf nodes (where node.children is empty).
  function collectArticleNumbers(node, out) {
    if (!node) return out;
    var i;
    if (node.articles) for (i = 0; i < node.articles.length; i++) out.push(node.articles[i]);
    if (node.children) for (i = 0; i < node.children.length; i++) collectArticleNumbers(node.children[i], out);
    return out;
  }

  // node → unique PUBLIC cases, deduped by case id.
  function aggregatePublicCases(collection, node) {
    var nums = collectArticleNumbers(node, []);
    var byId = {};
    for (var i = 0; i < nums.length; i++) {
      var sk = String(nums[i]);
      if (sk.indexOf('::') !== -1) continue;              // multi-instrument — skip (MVP)
      var pub = publicCasesFor(collection + ':' + sk);    // already public + id filtered
      for (var j = 0; j < pub.length; j++) {
        if (!Object.prototype.hasOwnProperty.call(byId, pub[j].id)) byId[pub[j].id] = pub[j];
      }
    }
    var out = [];
    for (var k in byId) if (Object.prototype.hasOwnProperty.call(byId, k)) out.push(byId[k]);
    return out;
  }

  // Add the "· N คดีที่เกี่ยวข้อง" disclosure at the top of one expanded LEAF
  // node body, above its provision grid. Silent, idempotent, fail-soft.
  function decorateNodeBody(list) {
    try {
      if (!READY || !list || !list.parentNode) return;
      var body = list.parentNode;
      if (!body.classList || !body.classList.contains('atlas-node-body')) return;  // flat Act: no structural node
      if (body.dataset && body.dataset.nodeCasesDone) return;
      if (body.dataset) body.dataset.nodeCasesDone = '1';

      var li = body.parentNode;
      if (!li || !li.classList || !li.classList.contains('atlas-node')) return;

      var route = currentRoute();
      if (!route.collection || route.instrument) return;    // multi-instrument out of scope (MVP)

      var node = dataNodeForEl(li, route.collection);
      if (!node) return;
      if (node.children && node.children.length) return;    // MVP: leaf structural nodes only
      if (!node.articles || !node.articles.length) return;

      var cases = aggregatePublicCases(route.collection, node);
      if (!cases.length) return;                            // zero public cases → render nothing

      var doc = global.document;
      var wrap = doc.createElement('span');
      wrap.className = 'atlas-node-cases';

      var d = doc.createElement('details');
      d.className = 'atlas-node-cases-d';
      var sum = doc.createElement('summary');
      sum.className = 'atlas-node-cases-sum';
      sum.textContent = '· ' + cases.length + ' คดีที่เกี่ยวข้อง';
      d.appendChild(sum);

      var cl = doc.createElement('div');
      cl.className = 'atlas-node-case-list';
      for (var i = 0; i < cases.length; i++) {
        var a = doc.createElement('a');
        a.className = 'atlas-node-case-link';
        a.setAttribute('href',
          'prototype/read-case.html?id=' + encodeURIComponent(cases[i].id));
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        a.textContent = cases[i].title || cases[i].id;
        cl.appendChild(a);
      }
      d.appendChild(cl);
      wrap.appendChild(d);

      body.insertBefore(wrap, list);   // above the provision grid
    } catch (e) { /* fail soft — never break the Atlas */ }
  }

  function scanNodeBodies(node) {
    if (!node || node.nodeType !== 1) return;
    try {
      if (node.matches && node.matches('.atlas-provision-list')) decorateNodeBody(node);
      if (node.querySelectorAll) {
        var found = node.querySelectorAll('.atlas-provision-list');
        for (var i = 0; i < found.length; i++) decorateNodeBody(found[i]);
      }
    } catch (e) { /* ignore */ }
  }

  // ---- lifecycle ---------------------------------------------
  function startObserver() {
    if (observer || typeof global.MutationObserver !== 'function') return;
    var root = global.document && global.document.getElementById(ROOT_ID);
    if (!root) return;
    observer = new global.MutationObserver(function (muts) {
      try {
        for (var i = 0; i < muts.length; i++) {
          var added = muts[i].addedNodes || [];
          for (var j = 0; j < added.length; j++) {
            eachPill(added[j], decoratePill);   // Phase 4C-1 — per-provision badges
            scanNodeBodies(added[j]);           // Phase 4C-2 — per-leaf-node aggregates
          }
        }
      } catch (e) { /* ignore */ }
    });
    try {
      observer.observe(root, { childList: true, subtree: true });
    } catch (e) { observer = null; }
  }

  function loadIndex() {
    if (typeof global.fetch !== 'function') { READY = true; return; }
    global.fetch(INDEX_URL, { cache: 'no-store' })
      .then(function (r) { return (r && r.ok) ? r.json() : {}; })
      .then(function (j) { INDEX = (j && typeof j === 'object') ? j : {}; })
      .catch(function () {
        INDEX = {};
        if (global.console && console.warn) {
          console.warn('[atlas-cases] case index unavailable — ' +
            'provision case badges disabled');
        }
      })
      .then(function () { READY = true; decorateAll(); });
  }

  function init() {
    startObserver();   // catch pills rendered before the index resolves
    loadIndex();
  }

  if (global.document) {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // Small explicit surface — for tests and for any future page that wants to
  // reuse the join. No AtlasUI/AtlasCore coupling in either direction.
  global.AtlasCases = {
    version: '1.1',
    _internal: {
      keyFromHref: keyFromHref,
      publicCasesFor: publicCasesFor,
      decoratePill: decoratePill,
      decorateAll: decorateAll,
      eachPill: eachPill,
      // Phase 4C-2
      currentRoute: currentRoute,
      getTree: getTree,
      dataNodeForEl: dataNodeForEl,
      collectArticleNumbers: collectArticleNumbers,
      aggregatePublicCases: aggregatePublicCases,
      decorateNodeBody: decorateNodeBody,
      scanNodeBodies: scanNodeBodies,
      setTree: function (col, t) { if (col) treeCache[col] = t; },
      setIndex: function (o) { INDEX = (o && typeof o === 'object') ? o : {}; READY = true; },
      reset: function () { INDEX = {}; READY = false; treeCache = {}; },
      state: function () { return { ready: READY, keys: Object.keys(INDEX).length }; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
