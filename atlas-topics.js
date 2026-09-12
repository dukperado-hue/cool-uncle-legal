/* ============================================================================
 * atlas-topics.js  ::  Thai Legal Atlas · Encyclopedia LEVEL 3 (Collection/Topic)
 * ----------------------------------------------------------------------------
 * A Topic is a broad legal SUBJECT a learner can study end-to-end: an ORDERED
 * pathway through atlas-concept-clusters.json Clusters and/or individual
 * atlas-concepts.json Concepts. The word "Topic" is used in code (never
 * "Collection") because `collection` already names a codex statute book
 * throughout the Atlas (AtlasCore.getCollection / collections-registry.json /
 * atlas-search.js dest type 'collection') — reusing it here would silently
 * collide with that existing, unrelated meaning. UI copy may still read
 * "หมวดวิชา" / "Collection" for the reader; the code stays unambiguous.
 *
 * ADDITIVE / STANDALONE — same contract as atlas-concept-clusters.js:
 *   - holds ONLY an ordered path[] of typed refs + a short editorial note per
 *     step. No legal explanation is duplicated here; every title/summary is
 *     read live from atlas-concepts.json (via AtlasConcepts) or
 *     atlas-concept-clusters.json (via AtlasConceptClusters).
 *   - never mutates AtlasCore / AtlasConcepts / AtlasConceptClusters / AtlasUI,
 *     never touches location.hash or the Atlas route grammar.
 *   - route: concept.html?t=<topicSlug>  (disjoint from ?k= concept / ?g= cluster)
 *   - textContent only, never innerHTML with data. Fails soft.
 *
 * Classic script (no ES modules). Exposes window.AtlasTopics.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var TOPICS_URL = 'atlas-topics.json';
  var CONCEPT_URL = 'concept.html?k=';
  var CLUSTER_URL = 'concept.html?g=';
  var CONCEPT_NS = 'atlas:concept/';
  var CLUSTER_NS = 'atlas:cluster/';

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

  function load(url) {
    if (_doc) return Promise.resolve(_doc);
    if (typeof global.fetch !== 'function') return Promise.resolve(null);
    return global.fetch(url || TOPICS_URL)
      .then(function (r) { if (!r || !r.ok) throw new Error('atlas-topics fetch ' + (r && r.status)); return r.json(); })
      .then(function (j) { _doc = (j && typeof j === 'object') ? j : null; return _doc; })
      .catch(function (e) {
        if (global.console && console.warn) console.warn('[atlas-topics] load failed', e);
        _doc = null;
        return null;
      });
  }

  function getTopic(slug) {
    if (!_doc || !_doc.topics) return null;
    return Object.prototype.hasOwnProperty.call(_doc.topics, slug) ? _doc.topics[slug] : null;
  }

  function topicsForConcept(conceptSlug) {
    var out = [];
    var topics = (_doc && _doc.topics) || {};
    Object.keys(topics).forEach(function (tslug) {
      var t = topics[tslug];
      var hit = (t.path || []).some(function (p) {
        return p && p.kind === 'concept' && slugOf(p.ref, CONCEPT_NS) === conceptSlug;
      });
      if (hit) out.push({ slug: tslug, titleTH: t.titleTH, status: t.status });
    });
    return out;
  }

  function topicsForCluster(clusterSlug) {
    var out = [];
    var topics = (_doc && _doc.topics) || {};
    Object.keys(topics).forEach(function (tslug) {
      var t = topics[tslug];
      var hit = (t.path || []).some(function (p) {
        return p && p.kind === 'cluster' && slugOf(p.ref, CLUSTER_NS) === clusterSlug;
      });
      if (hit) out.push({ slug: tslug, titleTH: t.titleTH, status: t.status });
    });
    return out;
  }

  // resolve one path[] entry (concept OR cluster) against the LIVE documents
  function resolvePathEntry(p) {
    if (!p) return null;
    if (p.kind === 'cluster') {
      var cslug = slugOf(p.ref, CLUSTER_NS);
      var AC = global.AtlasConceptClusters;
      var known = (cslug && AC && AC._internal && typeof AC._internal.getCluster === 'function')
        ? AC._internal.getCluster(cslug) : null;
      return {
        kind: 'cluster', slug: cslug, known: !!known,
        titleTH: (known && known.titleTH) || cslug, status: known ? known.status : null,
        note: p.note || null, size: known ? (known.concepts || []).length : 0
      };
    }
    var slug = slugOf(p.ref, CONCEPT_NS);
    var ACo = global.AtlasConcepts;
    var knownC = (slug && ACo && ACo._internal && typeof ACo._internal.getConcept === 'function')
      ? ACo._internal.getConcept(slug) : null;
    return {
      kind: 'concept', slug: slug, known: !!knownC,
      titleTH: (knownC && knownC.titleTH) || slug, status: knownC ? knownC.status : null,
      note: p.note || null
    };
  }

  // ================================================================
  // rendering — Topic Entry (concept.html?t=<slug>)
  // ================================================================
  function crumbs() {
    var nav = el('nav', 'atlas-concept-crumbs');
    var a1 = el('a', 'atlas-concept-crumb', 'Atlas'); a1.href = 'atlas.html';
    append(nav, a1);
    append(nav, el('span', 'atlas-concept-crumb-sep', '›'));
    var a2 = el('a', 'atlas-concept-crumb', 'แนวคิดทางกฎหมาย'); a2.href = 'concept.html';
    append(nav, a2);
    append(nav, el('span', 'atlas-concept-crumb-sep', '›'));
    append(nav, el('span', 'atlas-concept-crumb', 'หัวข้อวิชา'));
    return nav;
  }

  function pathStepNode(step, index) {
    var li = el('li', 'atlas-topic-step atlas-topic-step-' + step.kind);
    var num = el('span', 'atlas-topic-step-num', String(index + 1));
    append(li, num);
    var body = el('div', 'atlas-topic-step-body');

    if (step.kind === 'cluster') {
      append(body, el('span', 'atlas-topic-step-kind', 'กลุ่มแนวคิด'));
      if (step.known) {
        var ca = el('a', 'atlas-topic-step-title', step.titleTH);
        ca.href = CLUSTER_URL + encodeURIComponent(step.slug);
        append(body, ca);
        append(body, el('span', 'atlas-topic-step-meta', step.size + ' แนวคิด'));
      } else {
        append(body, el('span', 'atlas-topic-step-title is-planned', step.titleTH + ' · เร็ว ๆ นี้'));
      }
    } else {
      append(body, el('span', 'atlas-topic-step-kind', 'แนวคิด'));
      if (step.known && step.status === 'published') {
        var a = el('a', 'atlas-topic-step-title', step.titleTH);
        a.href = CONCEPT_URL + encodeURIComponent(step.slug);
        append(body, a);
      } else {
        append(body, el('span', 'atlas-topic-step-title is-planned', step.titleTH + ' · เร็ว ๆ นี้'));
      }
    }
    if (step.note) append(body, el('p', 'atlas-topic-step-note', step.note));
    append(li, body);
    return li;
  }

  function renderInto(rootEl, slug) {
    if (!rootEl) return false;
    var topic = getTopic(slug);
    clear(rootEl);
    if (!topic) {
      append(rootEl, el('p', 'atlas-concept-error', 'ไม่พบหัวข้อวิชา "' + slug + '"'));
      return false;
    }

    var art = el('article', 'atlas-concept atlas-topic');
    try { art.dataset.topicSlug = topic.slug || slug; } catch (e) { /* shim */ }
    append(art, crumbs());

    var head = el('header', 'atlas-concept-head');
    var h1 = el('h1', 'atlas-concept-title', topic.titleTH || slug);
    if (topic.titleEN) append(h1, el('span', 'atlas-concept-en', ' ' + topic.titleEN));
    append(head, h1);
    if (topic.description) append(head, el('p', 'atlas-concept-def', topic.description));
    append(art, head);

    var sec = el('section', 'atlas-concept-section');
    append(sec, el('h2', 'atlas-concept-section-title', 'เส้นทางการเรียนรู้'));
    var list = el('ol', 'atlas-topic-path');
    (topic.path || []).forEach(function (p, i) { append(list, pathStepNode(resolvePathEntry(p), i)); });
    append(sec, list);
    append(art, sec);

    append(rootEl, art);
    return true;
  }

  function render(rootEl, slug, opts) {
    opts = opts || {};
    return load(opts.url || TOPICS_URL).then(function () {
      return renderInto(rootEl, slug);
    }).catch(function (e) {
      if (global.console && console.warn) console.warn('[atlas-topics] render failed', e);
      if (rootEl) { clear(rootEl); append(rootEl, el('p', 'atlas-concept-error', 'โหลดหัวข้อวิชาไม่สำเร็จ')); }
      return false;
    });
  }

  // ================================================================
  // Concept Entry enhancement — "อยู่ในหัวข้อวิชา" upward-nav section,
  // appended into an already-rendered concept.html?k=<slug> page. Only
  // topics that feature the concept DIRECTLY (kind:'concept' path steps);
  // membership via a cluster is surfaced by atlas-concept-clusters.js's own
  // enhancer + the cluster page's own "อยู่ในหัวข้อ" section — no duplication.
  // Hidden entirely when the concept is not a direct topic member.
  // ================================================================
  function enhanceConceptPage(root, conceptSlug) {
    if (!root || !conceptSlug || !_doc) return false;
    var hits = topicsForConcept(conceptSlug).filter(function (h) { return h.status === 'published'; });
    if (!hits.length) return false;

    var article = root.querySelector('.atlas-concept') || root;
    var sec = el('section', 'atlas-concept-section atlas-concept-related');
    try { sec.dataset.key = 'concept-topics'; } catch (e) { /* shim */ }
    append(sec, el('h2', 'atlas-concept-section-title', 'อยู่ในหัวข้อวิชา'));
    var wrap = el('div', 'atlas-concept-related-wrap');
    hits.forEach(function (h) {
      var a = el('a', 'atlas-concept-related-chip');
      a.href = CONCEPT_URL_TOPIC(h.slug);
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
  function CONCEPT_URL_TOPIC(slug) { return 'concept.html?t=' + encodeURIComponent(slug); }

  global.AtlasTopics = {
    version: '0.1',
    render: render,
    load: load,
    enhanceConceptPage: enhanceConceptPage,
    _internal: {
      getTopic: getTopic,
      topicsForConcept: topicsForConcept,
      topicsForCluster: topicsForCluster,
      resolvePathEntry: resolvePathEntry,
      renderInto: renderInto,
      slugOf: slugOf,
      setDoc: function (d) { _doc = d || null; },
      reset: function () { _doc = null; },
      doc: function () { return _doc; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
