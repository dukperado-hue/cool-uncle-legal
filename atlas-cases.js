/* atlas-cases.js — Phase 4C-1: provision → associated public cases.

   ADDITIVE / STANDALONE. Decorates the .atlas-provision pills that the
   frozen Phase 3/4A/4B renderer emits in atlas.html with a compact
   "· N คดี" disclosure listing the PUBLIC cases that cite that มาตรา.

   Source of truth: prototype/assets/cases/article-case-index.json — the
   SAME prebuilt index neural-network.html consumes. Not regenerated here.

   Hard boundaries (see Phase 4C-0 / 4C-1 gates):
     - never calls AtlasUI / AtlasCore internals, nodeKey(), node.path
     - never touches atlas:return, routing or breadcrumbs
     - never nests an <a> inside the existing provision <a>
     - counts PUBLIC cases only; never exposes a private slug/title/link
     - works with lazy expansion (decorates pills as they appear); never
       forces the whole legal tree to render
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
    if (root) eachPill(root, decoratePill);
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
          for (var j = 0; j < added.length; j++) eachPill(added[j], decoratePill);
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
    version: '1.0',
    _internal: {
      keyFromHref: keyFromHref,
      publicCasesFor: publicCasesFor,
      decoratePill: decoratePill,
      decorateAll: decorateAll,
      eachPill: eachPill,
      setIndex: function (o) { INDEX = (o && typeof o === 'object') ? o : {}; READY = true; },
      reset: function () { INDEX = {}; READY = false; },
      state: function () { return { ready: READY, keys: Object.keys(INDEX).length }; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
