/* ============================================================================
 * atlas-concept-clusters.js  ::  Thai Legal Atlas · Encyclopedia LEVEL 2
 * ----------------------------------------------------------------------------
 * A Concept Cluster groups published atlas-concepts.json CONCEPTS into one
 * coherent, ORDERED legal-knowledge group ("what other ideas belong with this
 * one, and in what order should I read them"). It is NOT the same thing as
 * atlas-clusters.js (window.AtlasClusters) — that pre-existing module groups
 * มาตรา/PROVISIONS by relationship pattern for the F1 provision reader. The two
 * are unrelated features that happen to share the English word "cluster"; this
 * module is named AtlasConceptClusters throughout to keep them distinct.
 *
 * ADDITIVE / STANDALONE — same contract as atlas-concepts.js / atlas-concept-
 * relations.js:
 *   - single source of truth for concept CONTENT stays atlas-concepts.json,
 *     read only through the public AtlasConcepts.load() / _internal.getConcept.
 *     This file's own JSON (atlas-concept-clusters.json) holds ONLY grouping
 *     metadata (ordered concept refs + a short editorial note) — never a copy
 *     of concept text.
 *   - never mutates AtlasCore / AtlasConcepts / AtlasUI, never touches
 *     location.hash or the Atlas route grammar.
 *   - every concept link is the frozen concept-entry URL concept.html?k=<slug>;
 *     a cluster itself is a new, disjoint route concept.html?g=<clusterSlug>
 *     ("g" = group, chosen to avoid any collision with ?k= concept / ?t= topic).
 *   - textContent only, never innerHTML with data. Fails soft.
 *
 * Classic script (no ES modules). Exposes window.AtlasConceptClusters.
 * Host: concept.html?g=<slug>  (same host page as ?k=<slug>, disjoint param)
 * ==========================================================================*/
(function (global) {
  'use strict';

  var CLUSTERS_URL = 'atlas-concept-clusters.json';
  var CONCEPT_URL = 'concept.html?k=';
  var CLUSTER_URL = 'concept.html?g=';
  var TOPIC_URL = 'concept.html?t=';
  var NS = 'atlas:cluster/';
  var CONCEPT_NS = 'atlas:concept/';
  var TOPIC_NS = 'atlas:topic/';

  var doc = global.document;
  var _doc = null;

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function append(p, c) { if (p && c) p.appendChild(c); return p; }

  function slugOf(ref, ns) {
    if (typeof ref !== 'string') return null;
    var t = ref.trim();
    if (!t || t.indexOf(ns) !== 0) return null;
    var s = t.slice(ns.length).trim();
    return s || null;
  }

  // ================================================================
  // loading
  // ================================================================
  function load(url) {
    if (_doc) return Promise.resolve(_doc);
    if (typeof global.fetch !== 'function') return Promise.resolve(null);
    return global.fetch(url || CLUSTERS_URL)
      .then(function (r) { if (!r || !r.ok) throw new Error('atlas-concept-clusters fetch ' + (r && r.status)); return r.json(); })
      .then(function (j) { _doc = (j && typeof j === 'object') ? j : null; return _doc; })
      .catch(function (e) {
        if (global.console && console.warn) console.warn('[atlas-concept-clusters] load failed', e);
        _doc = null;
        return null;
      });
  }

  function getCluster(slug) {
    if (!_doc || !_doc.clusters) return null;
    return Object.prototype.hasOwnProperty.call(_doc.clusters, slug) ? _doc.clusters[slug] : null;
  }

  // every cluster whose concepts[] mentions conceptSlug, in file order
  function clustersForConcept(conceptSlug) {
    var out = [];
    var clusters = (_doc && _doc.clusters) || {};
    Object.keys(clusters).forEach(function (cslug) {
      var c = clusters[cslug];
      var hit = (c.concepts || []).some(function (m) { return slugOf(m && m.ref, CONCEPT_NS) === conceptSlug; });
      if (hit) out.push({ slug: cslug, titleTH: c.titleTH, status: c.status });
    });
    return out;
  }

  // resolve one concept member against the LIVE concept document (title/status
  // authoritative there — same principle as AtlasConcepts.resolveRelated)
  function resolveConceptMember(m) {
    var slug = slugOf(m && m.ref, CONCEPT_NS);
    var AC = global.AtlasConcepts;
    var known = (slug && AC && AC._internal && typeof AC._internal.getConcept === 'function')
      ? AC._internal.getConcept(slug) : null;
    return {
      slug: slug,
      known: !!known,
      titleTH: (known && known.titleTH) || slug,
      titleEN: known && known.titleEN,
      summary: known && (known.summary || (known.definition && known.definition.text)),
      status: known ? known.status : null,
      note: (m && m.note) || null,
      featured: !!(m && m.featured)
    };
  }

  // ================================================================
  // rendering — Cluster Entry (concept.html?g=<slug>)
  // ================================================================
  function crumbs() {
    var nav = el('nav', 'atlas-concept-crumbs');
    var a1 = el('a', 'atlas-concept-crumb', 'Atlas'); a1.href = 'atlas.html';
    append(nav, a1);
    append(nav, el('span', 'atlas-concept-crumb-sep', '›'));
    var a2 = el('a', 'atlas-concept-crumb', 'แนวคิดทางกฎหมาย'); a2.href = 'concept.html';
    append(nav, a2);
    append(nav, el('span', 'atlas-concept-crumb-sep', '›'));
    append(nav, el('span', 'atlas-concept-crumb', 'กลุ่มแนวคิด'));
    return nav;
  }

  function conceptCard(member) {
    var li = el('li', 'atlas-cluster-item' + (member.featured ? ' is-featured' : ''));
    if (member.known && member.status === 'published') {
      var a = el('a', 'atlas-cluster-item-title', member.titleTH);
      a.href = CONCEPT_URL + encodeURIComponent(member.slug);
      append(li, a);
    } else {
      append(li, el('span', 'atlas-cluster-item-title is-planned', member.titleTH + ' · เร็ว ๆ นี้'));
    }
    if (member.featured) append(li, el('span', 'atlas-cluster-item-badge', 'จุดเริ่มต้นแนะนำ'));
    if (member.note) append(li, el('p', 'atlas-cluster-item-note', member.note));
    return li;
  }

  function renderInto(rootEl, slug) {
    if (!rootEl) return false;
    var cluster = getCluster(slug);
    clear(rootEl);
    if (!cluster) {
      append(rootEl, el('p', 'atlas-concept-error', 'ไม่พบกลุ่มแนวคิด "' + slug + '"'));
      return false;
    }

    var art = el('article', 'atlas-concept atlas-cluster');
    try { art.dataset.clusterSlug = cluster.slug || slug; } catch (e) { /* shim */ }
    append(art, crumbs());

    var head = el('header', 'atlas-concept-head');
    var h1 = el('h1', 'atlas-concept-title', cluster.titleTH || slug);
    if (cluster.titleEN) append(h1, el('span', 'atlas-concept-en', ' ' + cluster.titleEN));
    append(head, h1);
    if (cluster.description) append(head, el('p', 'atlas-concept-def', cluster.description));
    append(art, head);

    var sec = el('section', 'atlas-concept-section');
    append(sec, el('h2', 'atlas-concept-section-title', 'แนวคิดในกลุ่มนี้ (เรียงตามลำดับการอ่าน)'));
    var list = el('ol', 'atlas-cluster-list');
    (cluster.concepts || []).forEach(function (m) { append(list, conceptCard(resolveConceptMember(m))); });
    append(sec, list);
    append(art, sec);

    // upward nav — which Topic(s) feature this cluster
    var topicSlugs = (cluster.topics || []).map(function (t) { return slugOf(t, TOPIC_NS); }).filter(Boolean);
    if (topicSlugs.length && global.AtlasTopics && global.AtlasTopics._internal) {
      var tsec = el('section', 'atlas-concept-section');
      append(tsec, el('h2', 'atlas-concept-section-title', 'อยู่ในหัวข้อ'));
      var twrap = el('div', 'atlas-concept-related-wrap');
      topicSlugs.forEach(function (ts) {
        var t = global.AtlasTopics._internal.getTopic(ts);
        var a = el('a', 'atlas-concept-related-chip');
        a.href = TOPIC_URL + encodeURIComponent(ts);
        a.textContent = (t && t.titleTH) || ts;
        append(twrap, a);
      });
      append(tsec, twrap);
      append(art, tsec);
    }

    append(rootEl, art);
    return true;
  }

  // ================================================================
  // Concept Entry enhancement — "อยู่ในกลุ่มแนวคิด" upward-nav section,
  // appended into an already-rendered concept.html?k=<slug> page. Mirrors the
  // atlas-concept-relations.js STEP 4 contract: hidden entirely when the
  // concept belongs to no cluster.
  // ================================================================
  function enhanceConceptPage(root, conceptSlug) {
    if (!root || !conceptSlug || !_doc) return false;
    var hits = clustersForConcept(conceptSlug).filter(function (h) { return h.status === 'published'; });
    if (!hits.length) return false;

    var article = root.querySelector('.atlas-concept') || root;
    var sec = el('section', 'atlas-concept-section atlas-concept-related');
    try { sec.dataset.key = 'concept-clusters'; } catch (e) { /* shim */ }
    append(sec, el('h2', 'atlas-concept-section-title', 'อยู่ในกลุ่มแนวคิด'));
    var wrap = el('div', 'atlas-concept-related-wrap');
    hits.forEach(function (h) {
      var a = el('a', 'atlas-concept-related-chip');
      a.href = CLUSTER_URL + encodeURIComponent(h.slug);
      a.textContent = h.titleTH;
      append(wrap, a);
    });
    append(sec, wrap);

    var sources = article.querySelector('.atlas-concept-sources');
    var foot = article.querySelector('.atlas-concept-foot');
    if (sources && sources.parentNode === article) article.insertBefore(sec, sources);
    else if (foot && foot.parentNode === article) article.insertBefore(sec, foot);
    else article.appendChild(sec);
    return true;
  }

  function render(rootEl, slug, opts) {
    opts = opts || {};
    return load(opts.url || CLUSTERS_URL).then(function () {
      return renderInto(rootEl, slug);
    }).catch(function (e) {
      if (global.console && console.warn) console.warn('[atlas-concept-clusters] render failed', e);
      if (rootEl) { clear(rootEl); append(rootEl, el('p', 'atlas-concept-error', 'โหลดกลุ่มแนวคิดไม่สำเร็จ')); }
      return false;
    });
  }

  global.AtlasConceptClusters = {
    version: '0.1',
    render: render,
    load: load,
    enhanceConceptPage: enhanceConceptPage,
    _internal: {
      getCluster: getCluster,
      clustersForConcept: clustersForConcept,
      resolveConceptMember: resolveConceptMember,
      renderInto: renderInto,
      slugOf: slugOf,
      setDoc: function (d) { _doc = d || null; },
      reset: function () { _doc = null; },
      doc: function () { return _doc; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
