/* ============================================================================
 * atlas-subject-tags.js  —  Thai Legal Atlas · Encyclopedia Subject Tags
 * ----------------------------------------------------------------------------
 * A STANDALONE presentation layer — same additive contract as atlas-clusters.js:
 *
 *   - never mutates AtlasCore / AtlasConcepts / AtlasEncyclopedia, never touches
 *     location.hash or any route
 *   - never duplicates concept content — reads only the small key→titleTH→hue
 *     registry in atlas-subject-tags.json plus whatever subjectTags[] a caller
 *     hands it (normally concept.subjectTags from atlas-concepts.json)
 *   - fails soft: an unknown tag key is skipped silently, a missing/failed
 *     registry load renders nothing (callers keep their existing fallback,
 *     e.g. the plain-text subjectAreas[] line)
 *   - textContent only, never innerHTML with data
 *
 * Purpose: give a term-level, fine-grained "which subject is this in" signal
 * distinct from collections-registry.json's subjectAreas[] (a coarser,
 * whole-collection classification — see atlas-subject-tags.json's own
 * "principle" field for why the two are not merged). One shared module owns
 * the key→color mapping so no color value is hard-coded in atlas-concepts.js
 * or atlas-encyclopedia.js.
 *
 * Classic script (no ES modules). Exposes window.AtlasSubjectTags.
 * Entry points:
 *   AtlasSubjectTags.load()                        → Promise, lazy singleton
 *   AtlasSubjectTags.list()                         → [{key,titleTH,order}, ...]
 *   AtlasSubjectTags.get(key)                       → {key,titleTH,order} | null
 *   AtlasSubjectTags.renderInto(container, keys[])  → appends <span> pills for
 *                                                      every KNOWN key (unknown
 *                                                      keys are skipped, not
 *                                                      shown as raw codes)
 * ==========================================================================*/
(function (global) {
  'use strict';

  var TAGS_URL = 'atlas-subject-tags.json';
  var STYLE_ID = 'atlas-subject-tags-style';

  var doc = global.document;

  var _doc = null;     // parsed atlas-subject-tags.json ({ tags: [...] } | null)
  var _byKey = null;   // { key: tagObj }
  var _loadP = null;

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function setDoc(json) {
    _doc = (json && Array.isArray(json.tags)) ? json : null;
    _byKey = {};
    (( _doc && _doc.tags) || []).forEach(function (t) {
      if (t && typeof t.key === 'string') _byKey[t.key] = t;
    });
    ensureStyle();
    return _doc;
  }

  function load(url) {
    if (_loadP) return _loadP;
    if (typeof global.fetch !== 'function') { _loadP = Promise.resolve(setDoc(null)); return _loadP; }
    _loadP = global.fetch(url || TAGS_URL)
      .then(function (r) { if (!r || !r.ok) throw new Error('atlas-subject-tags fetch ' + (r && r.status)); return r.json(); })
      .then(function (j) { return setDoc(j); })
      .catch(function (e) {
        if (global.console && console.warn) console.warn('[atlas-subject-tags] load failed — colored subject tags disabled', e);
        return setDoc(null);
      });
    return _loadP;
  }

  function list() {
    return ((_doc && _doc.tags) || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function get(key) {
    return (_byKey && _byKey[key]) || null;
  }

  // ================================================================
  // one shared <style> block, generated from the registry's hue values —
  // no per-subject color is ever written into a consuming file.
  // Soft tinted background + border (calm, not a saturated/rainbow fill);
  // light + dark variants both covered (prefers-color-scheme AND the
  // explicit data-theme override, matching the rest of the Atlas CSS).
  // ================================================================
  function ensureStyle() {
    if (!doc || doc.getElementById(STYLE_ID)) return;
    var tags = list();
    if (!tags.length) return;
    var base = '.atlas-subject-tag{display:inline-block;font-size:11px;font-weight:600;' +
      'padding:2px 10px;margin:0 6px 4px 0;border-radius:999px;border:1px solid transparent;' +
      'line-height:1.6;white-space:nowrap}';
    var light = [];
    tags.forEach(function (t) {
      var h = (typeof t.hue === 'number') ? t.hue : 210;
      var sel = '.atlas-subject-tag[data-tag="' + t.key + '"]';
      light.push(sel + '{background:hsl(' + h + ' 42% 93%);border-color:hsl(' + h + ' 32% 74%);color:hsl(' + h + ' 45% 26%)}');
    });
    var darkMedia = '@media (prefers-color-scheme:dark){' +
      tags.map(function (t) {
        var h = (typeof t.hue === 'number') ? t.hue : 210;
        return ':root:not([data-theme="light"]) .atlas-subject-tag[data-tag="' + t.key + '"]{' +
          'background:hsl(' + h + ' 28% 22%);border-color:hsl(' + h + ' 26% 42%);color:hsl(' + h + ' 42% 88%)}';
      }).join('') + '}';
    var darkForced = tags.map(function (t) {
      var h = (typeof t.hue === 'number') ? t.hue : 210;
      return ':root[data-theme="dark"] .atlas-subject-tag[data-tag="' + t.key + '"]{' +
        'background:hsl(' + h + ' 28% 22%);border-color:hsl(' + h + ' 26% 42%);color:hsl(' + h + ' 42% 88%)}';
    }).join('');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = base + light.join('') + darkMedia + darkForced;
    (doc.head || doc.documentElement).appendChild(style);
  }

  // ================================================================
  // renderInto(container, keys) — appends one pill per KNOWN key, in
  // registry order (not caller order), deduped. Unknown keys are skipped
  // silently (fail soft — never shows a raw internal key to a reader).
  // Returns the number of pills actually rendered.
  // ================================================================
  function renderInto(container, keys) {
    if (!container || !keys || !keys.length || !_byKey) return 0;
    var seen = {};
    var ordered = list().filter(function (t) { return keys.indexOf(t.key) !== -1; });
    var n = 0;
    ordered.forEach(function (t) {
      if (seen[t.key]) return;
      seen[t.key] = true;
      var span = el('span', 'atlas-subject-tag', t.titleTH);
      span.setAttribute('data-tag', t.key);
      container.appendChild(span);
      n++;
    });
    return n;
  }

  global.AtlasSubjectTags = {
    load: load,
    list: list,
    get: get,
    renderInto: renderInto,
    _internal: {
      setDoc: setDoc,
      doc: function () { return _doc; },
      byKey: function () { return _byKey; },
      ensureStyle: ensureStyle,
      reset: function () { _doc = null; _byKey = null; _loadP = null; var s = doc && doc.getElementById(STYLE_ID); if (s && s.parentNode) s.parentNode.removeChild(s); }
    }
  };
})(typeof window !== 'undefined' ? window : this);
