/* ============================================================================
 * atlas-provision-concepts.js  —  Thai Legal Atlas · Provision → Concept backlinks
 * ----------------------------------------------------------------------------
 * F4. A STANDALONE presentation layer — same contract as atlas-clusters.js /
 * atlas-cases.js / atlas-provision-view.js:
 *
 *   - closes the one missing edge of the F1–F3 network. Concept → Provision
 *     already works (concept.html lists a concept's provisions); this module
 *     renders the REVERSE inside the F1 reader: "อยู่ในแนวคิด: ละเมิด".
 *   - single source of truth stays atlas-concepts.json, read through the
 *     PUBLIC AtlasConcepts.load(). The Provision → Concept map is DERIVED in
 *     memory from AtlasConcepts._internal.allProvisionRefs(concept) — the same
 *     function concept.html already uses. NO new dataset, NO schema change,
 *     NO hand-authored provision→concept mapping.
 *   - never mutates AtlasCore / AtlasUI / AtlasConcepts, never calls their
 *     internals beyond the two documented helpers (allProvisionRefs, getConcept).
 *   - never touches location.hash / the Atlas route grammar / any provision URL.
 *   - every concept link is the frozen concept-entry URL concept.html?k=<slug>.
 *   - fails soft: if the Concept layer is absent or fails to load, this renders
 *     NOTHING and the F1 reader (and F2 clusters) are completely unaffected.
 *   - renders nothing when a provision has no concept — no empty card.
 *
 * Classic script (no ES modules). Exposes window.AtlasProvisionConcepts.
 * Entry point: AtlasProvisionConcepts.renderSection(container, resolved) —
 * called by atlas-provision-view.js from inside the reader panel body.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var STYLE_ID = 'atlas-provision-concepts-style';
  var CONCEPT_URL = 'concept.html?k=';

  var doc = global.document;

  var _byRef = null;   // { "<collection>_<number>": [{ slug, core }] }
  var _built = false;
  var _loadP = null;

  // ================================================================
  // tiny DOM helpers — textContent only, never innerHTML with data
  // ================================================================
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // ================================================================
  // derive the reverse index  (Concept → provision refs) ⁻¹
  // ================================================================
  function isCoreRef(concept, ref) {
    var arr = (concept && concept.provisions) || [];
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      if (p && p.ref === ref && (p.role || 'related') === 'core') return true;
    }
    return false;
  }

  // conceptDoc -> { ref: [{slug, core}] } ; also stored on _byRef
  function buildIndex(conceptDoc) {
    _byRef = {};
    _built = true;
    var concepts = (conceptDoc && conceptDoc.concepts) || null;
    if (!concepts) return _byRef;

    var AC = global.AtlasConcepts;
    var allRefs = (AC && AC._internal && typeof AC._internal.allProvisionRefs === 'function')
      ? AC._internal.allProvisionRefs : null;

    Object.keys(concepts).forEach(function (slug) {
      var c = concepts[slug];
      if (!c || c.status !== 'published') return;

      var refs = allRefs
        ? allRefs(c)
        : ((c.provisions || []).map(function (p) { return p && p.ref; }));

      (refs || []).forEach(function (ref) {
        if (!ref || typeof ref !== 'string') return;
        var list = _byRef[ref] || (_byRef[ref] = []);
        for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return;
        list.push({ slug: slug, core: isCoreRef(c, ref) });
      });
    });
    return _byRef;
  }

  function load() {
    if (_loadP) return _loadP;
    var AC = global.AtlasConcepts;
    if (!AC || typeof AC.load !== 'function') {
      _loadP = Promise.resolve(buildIndex(null));   // Concept layer not on this page
      return _loadP;
    }
    _loadP = AC.load()
      .then(function (conceptDoc) { return buildIndex(conceptDoc); })
      .catch(function (e) {
        if (global.console && console.warn) {
          console.warn('[atlas-provision-concepts] concept layer unavailable — backlinks disabled', e);
        }
        return buildIndex(null);
      });
    return _loadP;
  }

  // ================================================================
  // lookups
  // ================================================================
  // resolved provision -> its stable "<collection>_<number>" ref
  function currentRefOf(resolved) {
    if (!resolved) return null;
    if (resolved.legacyId) return resolved.legacyId;
    var key = resolved.storageKey != null ? resolved.storageKey : resolved.number;
    if (!resolved.collection || key == null) return null;
    return resolved.collection + '_' + key;
  }

  // ref -> [{ slug, titleTH, core }]  (core concepts first, then doc order)
  function conceptsForProvision(ref) {
    if (!_byRef || !ref) return [];
    var raw = _byRef[ref] || [];
    var AC = global.AtlasConcepts;
    var getConcept = (AC && AC._internal && typeof AC._internal.getConcept === 'function')
      ? AC._internal.getConcept : null;

    var out = raw.map(function (x) {
      var c = getConcept ? getConcept(x.slug) : null;
      return { slug: x.slug, titleTH: (c && c.titleTH) || x.slug, core: !!x.core };
    });
    // stable sort: core first, otherwise keep discovery order
    out.forEach(function (o, i) { o._i = i; });
    out.sort(function (a, b) {
      if (a.core !== b.core) return a.core ? -1 : 1;
      return a._i - b._i;
    });
    out.forEach(function (o) { delete o._i; });
    return out;
  }

  // ================================================================
  // stylesheet — scoped .atlas-pcpt-* ; theme via the Atlas -- vars
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var css = [
      '.atlas-pcpt-sec{margin:16px 0 0;font-size:12.5px;line-height:1.75;color:var(--muted,#5b6472);}',
      '.atlas-pcpt-label{font-weight:600;}',
      '.atlas-pcpt-link{color:var(--accent,#2E4A7A);text-decoration:none;}',
      '.atlas-pcpt-link:hover{text-decoration:underline;}',
      '.atlas-pcpt-link:focus-visible{outline:2px solid var(--accent,#2E4A7A);outline-offset:2px;}',
      '.atlas-pcpt-sep{opacity:.5;padding:0 4px;}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  // ================================================================
  // rendering
  // ================================================================
  // build the "อยู่ในแนวคิด" line for the resolved provision and append it into
  // `container` (an empty node already sitting in the panel body). Async — waits
  // for the concept document. Renders NOTHING when the provision has no concept.
  function renderSection(container, resolved) {
    if (!container || !resolved) return;
    injectStyle();
    load().then(function () {
      try {
        if (!container.parentNode) return;                    // panel closed / re-rendered
        while (container.firstChild) container.removeChild(container.firstChild);

        var ref = currentRefOf(resolved);
        var concepts = conceptsForProvision(ref);
        if (!concepts.length) return;                         // no relationship → no UI

        var p = el('p', 'atlas-pcpt-sec');
        p.appendChild(el('span', 'atlas-pcpt-label', 'อยู่ในแนวคิด: '));
        concepts.forEach(function (c, i) {
          if (i) p.appendChild(el('span', 'atlas-pcpt-sep', '·'));
          var a = el('a', 'atlas-pcpt-link', c.titleTH);
          a.setAttribute('href', CONCEPT_URL + encodeURIComponent(c.slug));
          p.appendChild(a);
        });
        container.appendChild(p);
      } catch (e) { /* fail soft */ }
    });
  }

  // ================================================================
  // expose
  // ================================================================
  global.AtlasProvisionConcepts = {
    version: '1.0',
    renderSection: renderSection,
    load: load,
    _internal: {
      buildIndex: buildIndex,
      conceptsForProvision: conceptsForProvision,
      currentRefOf: currentRefOf,
      isCoreRef: isCoreRef,
      byRef: function () { return _byRef; },
      isBuilt: function () { return _built; },
      setDoc: function (d) { _loadP = Promise.resolve(buildIndex(d || null)); return _loadP; },
      reset: function () { _byRef = null; _built = false; _loadP = null; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
