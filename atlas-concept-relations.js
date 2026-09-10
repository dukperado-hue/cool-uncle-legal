/* ============================================================================
 * atlas-concept-relations.js  —  Thai Legal Atlas · Concept ↔ Concept relations
 * ----------------------------------------------------------------------------
 * F8. A STANDALONE, ADDITIVE consumer of the Concept layer — same contract as
 * atlas-provision-concepts.js (F4) / atlas-clusters.js / atlas-cases.js:
 *
 *   - the SINGLE source of truth stays atlas-concepts.json, read through the
 *     PUBLIC AtlasConcepts.load(). The inbound ("who points here") view is
 *     DERIVED IN MEMORY from the SAME authored relatedConcepts[] arrays — the
 *     exact F4 principle. No stored reverse array, no second JSON file, no new
 *     dataset, no schema change.
 *   - relationships are DIRECTIONAL. An authored edge  A --rel--> B  is NOT
 *     assumed to imply  B --rel--> A. The reverse index only records, for each
 *     target, which concepts authored an edge toward it and with which rel.
 *   - never mutates AtlasCore / AtlasUI / AtlasConcepts, never calls their
 *     internals; never touches location.hash / the Atlas route grammar / any
 *     provision or concept URL beyond the frozen concept-entry concept.html?k=.
 *   - runs ONLY on concept.html, AFTER AtlasConcepts.render() has painted the
 *     Concept Entry: enhance(root, slug) adds an explicit direction caption to
 *     the existing "แนวคิดที่เกี่ยวข้อง" (outbound) section and, when something
 *     actually points at this concept, appends a clearly-distinguished inbound
 *     section. Nothing points here → nothing renders (hidden, like F4).
 *   - fails soft: any error leaves the Concept Entry exactly as atlas-concepts.js
 *     rendered it.
 *
 * Also exposes _internal.auditRelations(doc) — the integrity check consumed by
 * atlas-validate.js (reference existence · relation kind · target status ·
 * duplicate edge · self-reference), so the rules live in one place.
 *
 * Classic script (no ES modules). Exposes window.AtlasConceptRelations.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var STYLE_ID = 'atlas-concept-relations-style';
  var CONCEPT_URL = 'concept.html?k=';
  var NS = 'atlas:concept/';

  var doc = global.document;

  // How to read an authored edge  X --rel--> (this page)  from THIS page's side.
  // Directional: parent/specializes/prerequisite invert when read backwards;
  // contrast/seealso are effectively symmetric. Full relationKinds[rel] text
  // (authored in atlas-concepts.json) rides along as the title attribute.
  var INBOUND_REL_TH = {
    parent:       'ระบุว่าแนวคิดนี้เป็นแนวคิดที่กว้างกว่า',
    specializes:  'ถือว่าแนวคิดนี้เป็นชนิดย่อยของตน',
    prerequisite: 'ถือว่าแนวคิดนี้เป็นพื้นฐานที่ต้องเข้าใจก่อน',
    contrast:     'ยกแนวคิดนี้ขึ้นเทียบเคียง',
    seealso:      'โยงถึงแนวคิดนี้ให้อ่านประกอบ'
  };

  // ================================================================
  // tiny DOM helpers — textContent only, never innerHTML with data
  // ================================================================
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function slugOf(ref) {
    if (typeof ref !== 'string') return null;
    var t = ref.trim();
    if (!t || t.indexOf(NS) !== 0) return null;
    var s = t.slice(NS.length).trim();
    return s || null;
  }

  // ================================================================
  // STEP 2 — related-concept integrity audit
  // ----------------------------------------------------------------
  // Deterministic, fail-fast. Checks the TOP-LEVEL concept.relatedConcepts[]
  // of every authored concept (the structured, rel-typed relationship layer).
  // Section-level inline mentions (bare slug strings, no rel) are a different,
  // contextual thing and are out of scope here.
  //
  // Problem kinds:
  //   empty-or-malformed-ref · bad-namespace · self-reference · missing-rel
  //   unknown-rel · dangling-target · duplicate
  // ================================================================
  function auditRelations(conceptDoc) {
    var problems = [];
    var concepts = (conceptDoc && conceptDoc.concepts) || null;
    if (!concepts) return { problems: problems, checked: 0, concepts: 0 };

    var kinds = (conceptDoc && conceptDoc.relationKinds) || {};
    var checked = 0;

    Object.keys(concepts).forEach(function (sourceSlug) {
      var c = concepts[sourceSlug];
      var list = (c && Array.isArray(c.relatedConcepts)) ? c.relatedConcepts : [];
      var seenPairs = {};

      list.forEach(function (rc, i) {
        checked++;
        function P(kind, detail) {
          problems.push({
            concept: sourceSlug, index: i,
            ref: (rc && rc.ref) || null, rel: (rc && rc.rel) || null,
            problem: kind, detail: detail != null ? detail : null
          });
        }

        var rawRef = rc && rc.ref;
        if (typeof rawRef !== 'string' || !rawRef.trim()) { P('empty-or-malformed-ref'); return; }
        if (rawRef.trim().indexOf(NS) !== 0) { P('bad-namespace'); return; }

        var targetSlug = slugOf(rawRef);
        if (!targetSlug) { P('empty-or-malformed-ref'); return; }

        // A. self-reference — flagged; no field in the current schema marks a
        //    self-relation as intentional, so it is always a problem.
        if (targetSlug === sourceSlug) P('self-reference');

        // B. relation kind — required, and one of the authored relationKinds.
        var rel = rc.rel;
        if (rel == null || rel === '') P('missing-rel');
        else if (!Object.prototype.hasOwnProperty.call(kinds, rel)) P('unknown-rel', String(rel));

        // C. target status — the target must be authored here OR explicitly
        //    marked planned. A planned target is NOT required to become
        //    published to satisfy the validator (schema semantics: rc.status).
        var authored = Object.prototype.hasOwnProperty.call(concepts, targetSlug);
        if (!authored && rc.status !== 'planned') P('dangling-target');

        // D. duplicate — same target + same rel from the same concept. Two
        //    edges to the same target with genuinely different rel kinds are
        //    legitimate and NOT flagged.
        var key = targetSlug + '|' + (rel == null ? '' : rel);
        if (seenPairs[key]) P('duplicate');
        seenPairs[key] = 1;
      });
    });

    return { problems: problems, checked: checked, concepts: Object.keys(concepts).length };
  }

  // ================================================================
  // STEP 3 — derived inbound relationship index
  // ----------------------------------------------------------------
  // { targetSlug: [ { slug (author of the edge), rel, labelTH, note } ] }
  // Derived from TOP-LEVEL concept.relatedConcepts[] only. Direction is
  // preserved: `slug` is always the concept that AUTHORED the outbound edge,
  // `rel` is that concept's authored relation kind. A self-edge is never an
  // inbound edge. Identical (source, rel) pairs are de-duplicated.
  // Fail-soft: no document → {}.
  // ================================================================
  function buildInboundIndex(conceptDoc) {
    var idx = {};
    var concepts = (conceptDoc && conceptDoc.concepts) || null;
    if (!concepts) return idx;

    Object.keys(concepts).forEach(function (sourceSlug) {
      var c = concepts[sourceSlug];
      var list = (c && Array.isArray(c.relatedConcepts)) ? c.relatedConcepts : [];

      list.forEach(function (rc) {
        var targetSlug = slugOf(rc && rc.ref);
        if (!targetSlug || targetSlug === sourceSlug) return;

        var bucket = idx[targetSlug] || (idx[targetSlug] = []);
        var rel = (rc && rc.rel) || null;
        for (var i = 0; i < bucket.length; i++) {
          if (bucket[i].slug === sourceSlug && bucket[i].rel === rel) return; // dedup
        }
        bucket.push({
          slug: sourceSlug,
          rel: rel,
          labelTH: (rc && rc.labelTH) || null,
          note: (rc && rc.note) || null
        });
      });
    });

    return idx;
  }

  // targetSlug -> [ { slug, rel, relPhraseTH, relFullTH, title, status, known, note } ]
  // Each source is resolved against the LIVE document: its current titleTH /
  // status win over the denormalised cache (same principle as
  // AtlasConcepts.resolveRelated). Fail-soft: unknown doc / slug -> [].
  function inboundFor(conceptDoc, targetSlug) {
    var raw = buildInboundIndex(conceptDoc)[targetSlug] || [];
    var concepts = (conceptDoc && conceptDoc.concepts) || {};
    var kinds = (conceptDoc && conceptDoc.relationKinds) || {};
    return raw.map(function (e) {
      var src = Object.prototype.hasOwnProperty.call(concepts, e.slug) ? concepts[e.slug] : null;
      return {
        slug: e.slug,
        rel: e.rel,
        relPhraseTH: (e.rel && INBOUND_REL_TH[e.rel]) || null,
        relFullTH: (e.rel && kinds[e.rel]) || null,
        title: (src && src.titleTH) || e.labelTH || e.slug,
        status: src ? src.status : null,
        known: !!src,
        note: e.note
      };
    });
  }

  // ================================================================
  // stylesheet — scoped, theme-aware through the Atlas -- vars
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || (doc.getElementById && doc.getElementById(STYLE_ID))) return;
    var css = [
      '.atlas-concept-direction{margin:0 0 12px;font-size:12px;color:var(--muted,#5b6472);' +
        'letter-spacing:.01em}',
      '.atlas-concept-inbound-list{display:flex;flex-direction:column;gap:12px}',
      '.atlas-concept-inbound-row{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}',
      '.atlas-concept-inbound-rel{font-size:12px;color:var(--muted,#5b6472)}',
      '.atlas-concept-inbound-note{flex-basis:100%;margin:2px 0 0;font-size:12px;' +
        'color:var(--muted,#5b6472);line-height:1.6}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  // ================================================================
  // STEP 4 / STEP 5 — Concept Entry inbound surfacing
  // ================================================================
  function directionCaption(text) { return el('p', 'atlas-concept-direction', text); }

  // one inbound source: a link (published source) or a quiet span (authored but
  // unpublished — mirrors relatedConceptChip), plus the directional relation
  // phrase and, if present, the relationship note on its own muted line.
  function inboundRow(entry) {
    var row = el('div', 'atlas-concept-inbound-row');

    var isLink = entry.known && entry.status === 'published';
    var chip = isLink
      ? el('a', 'atlas-concept-related-chip is-inline')
      : el('span', 'atlas-concept-related-chip is-inline is-planned');
    if (isLink) chip.href = CONCEPT_URL + encodeURIComponent(entry.slug);
    chip.textContent = entry.title;
    row.appendChild(chip);

    var phrase = entry.relPhraseTH || (entry.rel ? ('[' + entry.rel + ']') : '');
    if (phrase) {
      var relEl = el('span', 'atlas-concept-inbound-rel', phrase);
      if (entry.relFullTH) {
        try { relEl.setAttribute('title', entry.relFullTH); } catch (e) { /* shim */ }
      }
      row.appendChild(relEl);
    }

    if (entry.note) row.appendChild(el('p', 'atlas-concept-inbound-note', entry.note));
    return row;
  }

  function buildInboundSection(entries) {
    var sec = el('section', 'atlas-concept-section atlas-concept-related atlas-concept-inbound');
    try { sec.dataset.key = 'inbound-concepts'; } catch (e) { /* shim */ }
    sec.appendChild(el('h2', 'atlas-concept-section-title', 'แนวคิดที่อ้างถึงแนวคิดนี้'));
    sec.appendChild(directionCaption('← แนวคิดอื่นที่ระบุความสัมพันธ์มายังหน้านี้'));
    var list = el('div', 'atlas-concept-inbound-list');
    entries.forEach(function (e) { list.appendChild(inboundRow(e)); });
    sec.appendChild(list);
    return sec;
  }

  function insertAfter(parent, node, ref) {
    if (!parent) return;
    var next = ref ? ref.nextSibling : null;
    if (next) parent.insertBefore(node, next);
    else parent.appendChild(node);
  }

  // enhance the already-rendered Concept Entry for `slug` inside `root`.
  // Async (waits for the concept document, which render() has already cached).
  function enhance(root, slug) {
    if (!root || !slug) return Promise.resolve(false);
    var AC = global.AtlasConcepts;
    if (!AC || typeof AC.load !== 'function') return Promise.resolve(false);

    injectStyle();

    return AC.load().then(function (conceptDoc) {
      try {
        if (!conceptDoc || !conceptDoc.concepts ||
            !Object.prototype.hasOwnProperty.call(conceptDoc.concepts, slug)) return false;

        var article = root.querySelector('.atlas-concept') || root;
        var outbound = root.querySelector('.atlas-concept-related');

        // STEP 5 — make the OUTBOUND section's direction explicit. Never merge
        // the two lists; this only adds a caption under the existing heading.
        if (outbound && !outbound.querySelector('.atlas-concept-direction')) {
          var h = outbound.querySelector('.atlas-concept-section-title');
          var cap = directionCaption('แนวคิดที่หน้านี้อ้างถึง →');
          if (h) insertAfter(outbound, cap, h);
          else outbound.appendChild(cap);
        }

        // STEP 4 — inbound section. Hidden entirely when nothing points here.
        var entries = inboundFor(conceptDoc, slug);
        if (!entries.length) return false;

        var sec = buildInboundSection(entries);
        if (outbound && outbound.parentNode === article) {
          insertAfter(article, sec, outbound);
        } else {
          var sources = root.querySelector('.atlas-concept-sources');
          if (sources && sources.parentNode === article) article.insertBefore(sec, sources);
          else article.appendChild(sec);
        }
        return true;
      } catch (e) {
        if (global.console && console.warn) console.warn('[atlas-concept-relations] enhance failed', e);
        return false;
      }
    }).catch(function (e) {
      if (global.console && console.warn) console.warn('[atlas-concept-relations] load failed', e);
      return false;
    });
  }

  // ================================================================
  // expose
  // ================================================================
  global.AtlasConceptRelations = {
    version: '1.0',
    enhance: enhance,
    _internal: {
      auditRelations: auditRelations,
      buildInboundIndex: buildInboundIndex,
      inboundFor: inboundFor,
      buildInboundSection: buildInboundSection,
      inboundRow: inboundRow,
      slugOf: slugOf,
      RELATION_PHRASES: INBOUND_REL_TH
    }
  };
})(typeof window !== 'undefined' ? window : this);
