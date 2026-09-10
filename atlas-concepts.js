/* ============================================================================
 * atlas-concepts.js  ::  Thai Legal Atlas · Legal Concept layer  (PHASE 1)
 * ----------------------------------------------------------------------------
 * ADDITIVE / STANDALONE: same contract as atlas-cases.js and
 * atlas-provision-view.js:
 *
 *   - never mutates AtlasCore / AtlasUI, never calls their internals
 *     (the only AtlasCore calls are the PUBLIC resolvers:
 *      resolveAtlasId / resolveProvision / getProvisionBrief / getCollection /
 *      getStructureTree / getBreadcrumb)
 *   - never touches location.hash, the Atlas route grammar, or any provision URL
 *   - every provision link keeps the frozen viewer URL
 *     codex-article-viewer.html?id=<collection>_<number>  (+ &x=atlas marker),
 *     and carries class "atlas-provision" so the EXISTING inline provision
 *     drawer (atlas-provision-view.js) enhances it for free
 *   - related cases are DERIVED from the SAME prebuilt public index
 *     (prototype/assets/cases/article-case-index.json) that atlas-cases.js and
 *     neural-network.html consume (not a new index, not persisted here)
 *   - fails soft: any error leaves a usable page, never throws
 *
 * A "Legal Concept" is NOT a new node.kind and NOT a graph. It is one authored
 * document in atlas-concepts.json whose fields are typed string refs into
 * identities that already exist in the Atlas.
 *
 * Classic script (no ES modules). Exposes window.AtlasConcepts.
 * Host page: concept.html?k=<slug>
 * ==========================================================================*/
(function (global) {
  'use strict';

  var CONCEPTS_URL = 'atlas-concepts.json';
  var CASE_INDEX_URL = 'prototype/assets/cases/article-case-index.json';
  var CASE_VIEW_URL = 'prototype/read-case.html?id=';
  var VIEWER_URL = 'codex-article-viewer.html?id=';

  var doc = global.document;

  var _doc = null;              // parsed atlas-concepts.json
  var _caseIndexPromise = null;

  // ================================================================
  // tiny DOM helpers (textContent only; never innerHTML with data)
  // ================================================================
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function append(parent, child) { if (parent && child) parent.appendChild(child); return parent; }

  // ================================================================
  // loading
  // ================================================================
  function load(url) {
    if (_doc) return Promise.resolve(_doc);
    if (typeof global.fetch !== 'function') return Promise.resolve(null);
    return global.fetch(url || CONCEPTS_URL)
      .then(function (r) { if (!r || !r.ok) throw new Error('atlas-concepts fetch ' + (r && r.status)); return r.json(); })
      .then(function (j) { _doc = (j && typeof j === 'object') ? j : null; return _doc; })
      .catch(function (e) {
        if (global.console && console.warn) console.warn('[atlas-concepts] load failed', e);
        _doc = null;
        return null;
      });
  }

  function loadCaseIndex() {
    if (_caseIndexPromise) return _caseIndexPromise;
    if (typeof global.fetch !== 'function') { _caseIndexPromise = Promise.resolve({}); return _caseIndexPromise; }
    _caseIndexPromise = global.fetch(CASE_INDEX_URL)
      .then(function (r) { return (r && r.ok) ? r.json() : {}; })
      .then(function (j) { return (j && typeof j === 'object') ? j : {}; })
      .catch(function () { return {}; });
    return _caseIndexPromise;
  }

  function getConcept(slug) {
    if (!_doc || !_doc.concepts) return null;
    return Object.prototype.hasOwnProperty.call(_doc.concepts, slug) ? _doc.concepts[slug] : null;
  }

  // ================================================================
  // ref resolution :: PUBLIC AtlasCore only
  // ================================================================
  // "civil_420" / "tortofficials_5"  ->  { collection, number, exists, viewerUrl, unit, cancelled }
  function resolveProvisionRef(ref) {
    var AC = global.AtlasCore;
    var out = { ref: ref, collection: null, number: null, exists: false,
                viewerUrl: null, unit: 'มาตรา', cancelled: false };
    if (!AC || !ref) return out;
    try {
      var r = AC.resolveAtlasId(ref);
      if (r) {
        out.collection = r.collection;
        out.number = r.number;
        out.exists = !!r.exists;
        out.viewerUrl = r.viewerUrl || (VIEWER_URL + encodeURIComponent(ref));
      }
      if (out.collection && out.number && typeof AC.getProvisionBrief === 'function') {
        var b = AC.getProvisionBrief(out.collection, out.number);
        if (b) { out.unit = b.unit || out.unit; out.cancelled = !!b.cancelled;
                 if (b.viewerUrl) out.viewerUrl = b.viewerUrl; }
      }
    } catch (e) { /* fail soft */ }
    if (!out.viewerUrl) out.viewerUrl = VIEWER_URL + encodeURIComponent(ref);
    return out;
  }

  // lectureRef "lec-civil_420-2"  ->  { book, number }  (best effort)
  function parseLectureRef(id) {
    var m = /^lec-([a-z0-9]+)_(.+)-\d+$/i.exec(String(id || ''));
    if (!m) return null;
    return { book: m[1], number: m[2] };
  }

  // case-index key for a provision ref
  function caseKey(pref) {
    var p = resolveProvisionRef(pref);
    return (p.collection && p.number != null) ? (p.collection + ':' + p.number) : null;
  }

  function publicCasesForKey(index, key) {
    var arr = (key && index && Object.prototype.hasOwnProperty.call(index, key)) ? index[key] : null;
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i];
      if (c && c.public === true && typeof c.id === 'string' && c.id) out.push(c);
    }
    return out;
  }

  // Every provision ref mentioned anywhere in a concept (core list + section
  // bodies + section items + featuredCases hints). Used for case derivation.
  function allProvisionRefs(concept) {
    var seen = {}, out = [];
    function add(r) { if (r && !Object.prototype.hasOwnProperty.call(seen, r)) { seen[r] = 1; out.push(r); } }
    (concept.provisions || []).forEach(function (p) { add(p && p.ref); });
    (concept.definition && concept.definition.provisions || []).forEach(add);
    (concept.principle && concept.principle.provisions || []).forEach(add);
    (concept.sections || []).forEach(function (s) {
      (s.provisions || []).forEach(add);
      (s.items || []).forEach(function (it) { (it.provisions || []).forEach(add); });
    });
    (concept.featuredCases || []).forEach(function (fc) { (fc.provisions || []).forEach(add); });
    return out;
  }

  // concept -> { featured:[{id,note,cases?}], derived:[caseObj] }  (derived excludes featured ids)
  function deriveCases(concept, index) {
    var featuredIds = {};
    var featured = (concept.featuredCases || []).map(function (fc) {
      if (fc && fc.id) featuredIds[fc.id] = 1;
      return fc;
    });
    var byId = {};
    allProvisionRefs(concept).forEach(function (pref) {
      var k = caseKey(pref);
      publicCasesForKey(index, k).forEach(function (c) {
        if (!Object.prototype.hasOwnProperty.call(byId, c.id)) byId[c.id] = c;
      });
    });
    var derived = [];
    for (var id in byId) {
      if (Object.prototype.hasOwnProperty.call(byId, id) && !featuredIds[id]) derived.push(byId[id]);
    }
    return { featured: featured, derived: derived };
  }

  // ================================================================
  // rendering
  // ================================================================
  function provisionPill(pref, label) {
    var p = resolveProvisionRef(pref);
    var a = el('a', 'atlas-provision' + (p.cancelled ? ' atlas-provision-cancelled' : ''));
    var url = p.viewerUrl || (VIEWER_URL + encodeURIComponent(pref));
    a.href = url + (url.indexOf('?') === -1 ? '?' : '&') + 'x=atlas';
    a.textContent = label || ((p.unit || 'มาตรา') + ' ' + (p.number != null ? p.number : pref));
    if (!p.exists) {
      a.classList.add('atlas-concept-ref-missing');
      a.title = 'ไม่พบบทบัญญัตินี้ในคลังข้อมูล';
    }
    return a;
  }

  function provisionPillRow(refs) {
    var row = el('div', 'atlas-concept-pills');
    (refs || []).forEach(function (r) {
      var ref = (typeof r === 'string') ? r : (r && r.ref);
      if (ref) append(row, provisionPill(ref));
    });
    return row.childNodes.length ? row : null;
  }

  // `seen` (optional) is a shared {articleKey:1} map so a section-level row can
  // skip articles already surfaced by its items.
  function lectureRefRow(ids, seen) {
    var uniq = seen || {}, arts = [];
    (ids || []).forEach(function (id) {
      var p = parseLectureRef(id);
      if (!p) return;
      var key = p.book + '_' + p.number;
      if (!uniq[key]) { uniq[key] = 1; arts.push(p); }
    });
    if (!arts.length) return null;
    var row = el('div', 'atlas-concept-lectures');
    append(row, el('span', 'atlas-concept-lectures-label', '🎓 คำอธิบายประกอบ:'));
    arts.forEach(function (p) {
      var a = el('a', 'atlas-concept-lecture-link');
      a.href = VIEWER_URL + encodeURIComponent(p.book + '_' + p.number) + '&x=atlas';
      a.textContent = 'ม.' + p.number;
      append(row, a);
    });
    return row;
  }

  function needsVerifyBanner(node) {
    if (!node || !node.needsSourceVerification) return null;
    var b = el('p', 'atlas-concept-verify',
      '⚠ ส่วนนี้ยังต้องตรวจสอบกับแหล่งอ้างอิงก่อนใช้อ้างอิง'
      + (node.verificationNote ? ' (' + node.verificationNote + ')' : ''));
    return b;
  }

  function renderSection(sec) {
    var wrap = el('section', 'atlas-concept-section');
    try { wrap.dataset.key = sec.key || ''; } catch (e) { /* shim */ }
    append(wrap, el('h2', 'atlas-concept-section-title', sec.label || sec.key || ''));
    var vb = needsVerifyBanner(sec);
    if (vb) append(wrap, vb);
    if (sec.body) append(wrap, el('p', 'atlas-concept-body', sec.body));

    var seenLectures = {};   // article keys already shown by an item's lectureRefs
    (sec.items || []).forEach(function (it) {
      var item = el('div', 'atlas-concept-item');
      append(item, el('h3', 'atlas-concept-item-title', it.label || ''));
      if (it.text) append(item, el('p', 'atlas-concept-body', it.text));
      var pills = provisionPillRow(it.provisions);
      if (pills) append(item, pills);
      var lec = lectureRefRow(it.lectureRefs, seenLectures);
      if (lec) append(item, lec);
      append(wrap, item);
    });

    var secPills = provisionPillRow(sec.provisions);
    if (secPills) append(wrap, secPills);
    var secLec = lectureRefRow(sec.lectureRefs, seenLectures);
    if (secLec) append(wrap, secLec);

    (sec.scholarViews || []).forEach(function (sv) {
      var card = scholarViewCard(sv);
      if (card) append(wrap, card);
    });

    (sec.relatedConcepts || []).forEach(function (rc) {
      append(wrap, relatedConceptChip(rc, true));
    });
    return wrap;
  }

  // A short, clearly-attributed scholarly view. Always visually distinct from
  // the Atlas's own synthesis; carries its own provenance line. Never a bare
  // quotation unless the data says mode:"quote" (verbatim, traceable source).
  function scholarViewCard(sv) {
    if (!sv || (!sv.text && !sv.attribution)) return null;
    var card = el('aside', 'atlas-concept-scholar');
    append(card, el('span', 'atlas-concept-scholar-kicker',
      sv.mode === 'quote' ? 'นักกฎหมายอธิบาย (คำพูดโดยตรง)' : 'มุมมองนักนิติศาสตร์'));
    if (sv.attribution) append(card, el('p', 'atlas-concept-scholar-who', sv.attribution));
    if (sv.text) {
      var t = el(sv.mode === 'quote' ? 'blockquote' : 'p', 'atlas-concept-scholar-text',
        sv.mode === 'quote' ? ('“' + sv.text + '”') : sv.text);
      append(card, t);
    }
    var prov = sv.basis || sv.provenance;
    if (prov) append(card, el('p', 'atlas-concept-scholar-prov', 'ที่มา: ' + prov));
    return card;
  }

  // Resolve a relatedConcepts entry against the LIVE concept document.
  // When the target slug is an authored concept, its CURRENT titleTH / status
  // are authoritative. rc.labelTH / rc.status are denormalised cache: they are
  // fallback only, used when the target concept is not (yet) authored here.
  // Identity is always the stable slug from rc.ref, never a display label.
  function resolveRelated(rc) {
    var ref = (typeof rc === 'string') ? rc : (rc && rc.ref);
    var slug = String(ref || '').replace(/^atlas:concept\//, '');
    var known = getConcept(slug);
    return {
      slug: slug,
      known: !!known,
      label: (known && known.titleTH) || (rc && rc.labelTH) || slug,
      status: known ? known.status : ((rc && rc.status) || null)
    };
  }

  function relatedConceptChip(rc, inline) {
    var r = resolveRelated(rc);
    var relTxt = (rc && rc.rel) ? ('[' + rc.rel + '] ') : '';
    if (r.known && r.status === 'published') {
      var a = el('a', 'atlas-concept-related-chip' + (inline ? ' is-inline' : ''));
      a.href = 'concept.html?k=' + encodeURIComponent(r.slug);
      a.textContent = relTxt + r.label;
      return a;
    }
    var span = el('span', 'atlas-concept-related-chip is-planned' + (inline ? ' is-inline' : ''));
    span.textContent = relTxt + r.label + ' · เร็ว ๆ นี้';
    if (rc && rc.note) span.title = rc.note;
    return span;
  }

  // opts.conceptLink: make "แนวคิดทางกฎหมาย" a link back to the directory
  // (used on a concept page); omitted on the directory itself, where it is the
  // current location.
  function renderCrumbs(opts) {
    opts = opts || {};
    var nav = el('nav', 'atlas-concept-crumbs');
    var a1 = el('a', 'atlas-concept-crumb', 'Atlas'); a1.href = 'atlas.html';
    append(nav, a1);
    append(nav, el('span', 'atlas-concept-crumb-sep', '›'));
    if (opts.conceptLink) {
      var a2 = el('a', 'atlas-concept-crumb', 'แนวคิดทางกฎหมาย'); a2.href = 'concept.html';
      append(nav, a2);
      append(nav, el('span', 'atlas-concept-crumb-sep', '›'));
    } else {
      append(nav, el('span', 'atlas-concept-crumb', 'แนวคิดทางกฎหมาย'));
    }
    return nav;
  }

  // ================================================================
  // F7-C1 — make a concept's structural anchor path[] actionable
  // ----------------------------------------------------------------
  // Consumer of the shipped Phase-4B / F6 reveal contract. concept.html is
  // always a CROSS-PAGE context (it never hosts the Atlas structure tree):
  // hand the ordered structural node.value chain to atlas.html through the
  // established sessionStorage['atlas:return'] key, then navigate to the
  // collection route. The Atlas page already opens the ancestor chain and
  // focuses the exact node on load. No new mechanism, no new dataset, no
  // schema change; never writes location.hash or history.
  // ================================================================
  var ATLAS_RETURN_KEY = 'atlas:return';   // Phase-4B / F6 hand-off key

  function anchorHash(an) {
    if (!an || !an.collection) return null;
    var inst = an.instrument || null;   // structuralAnchor carries no instrument today -> null
    return '#/c/' + an.collection + (inst ? '/i/' + inst : '');
  }

  // the exact { hash, instrument, path } shape the Atlas restore contract consumes
  function anchorReturnPayload(an) {
    var hash = anchorHash(an);
    if (!hash) return null;
    return {
      hash: hash,
      instrument: (an && an.instrument) || null,
      path: (an && Array.isArray(an.path)) ? an.path.slice() : []
    };
  }

  // write the hand-off (best effort) then navigate to atlas.html#/c/<collection>
  function activateAnchor(an) {
    var payload = anchorReturnPayload(an);
    if (!payload) return false;
    try {
      if (global.sessionStorage && payload.path.length) {
        global.sessionStorage.setItem(ATLAS_RETURN_KEY, JSON.stringify(payload));
      }
    } catch (e) { /* no sessionStorage / blocked -> navigation still works, no reveal */ }
    var dest = 'atlas.html' + payload.hash;
    try { global.location.assign(dest); return true; }
    catch (e) {
      try { global.location.href = dest; return true; } catch (e2) { return false; }
    }
  }

  function renderAnchor(concept) {
    if (!concept.structuralAnchor || !concept.structuralAnchor.length) return null;
    var sec = el('section', 'atlas-concept-section atlas-concept-anchor');
    append(sec, el('h2', 'atlas-concept-section-title', 'ตำแหน่งในสารบบกฎหมาย'));
    concept.structuralAnchor.forEach(function (an) {
      var line = el('p', 'atlas-concept-anchor-line');
      var AC = global.AtlasCore;
      var colTitle = an.collection;
      try { var c = AC && AC.getCollection && AC.getCollection(an.collection); if (c) colTitle = c.short || c.title; }
      catch (e) { /* ignore */ }
      var a = el('a', 'atlas-concept-anchor-link');
      a.href = 'atlas.html#/c/' + encodeURIComponent(an.collection);
      a.textContent = colTitle + (an.path && an.path.length ? ' › ' + an.path.join(' › ') : '');
      // F7-C1: an authored path[] becomes actionable — an unmodified activation
      // hands the exact node to atlas.html and navigates; a modified click
      // (new tab / window) keeps the plain href = collection route.
      if (an.path && an.path.length) {
        try { a.setAttribute('title', 'เปิดในสารบบกฎหมาย: ' + an.path.join(' › ')); } catch (e) { /* shim */ }
        a.addEventListener('click', function (ev) {
          if (ev && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey ||
                     (ev.button != null && ev.button !== 0))) return;
          if (ev && ev.preventDefault) ev.preventDefault();
          activateAnchor(an);
        });
      }
      append(line, a);
      append(sec, line);
      if (an.note) append(sec, el('p', 'atlas-concept-body', an.note));
    });
    return sec;
  }

  function renderCases(concept) {
    var sec = el('section', 'atlas-concept-section atlas-concept-cases');
    append(sec, el('h2', 'atlas-concept-section-title', 'คดีที่เกี่ยวข้อง'));
    var status = el('p', 'atlas-concept-body atlas-concept-cases-status', 'กำลังโหลดคดี…');
    append(sec, status);

    loadCaseIndex().then(function (index) {
      try {
        var res = deriveCases(concept, index);
        clear(status); status.remove ? status.remove() : (status.parentNode && status.parentNode.removeChild(status));

        if (res.featured.length) {
          append(sec, el('h3', 'atlas-concept-cases-sub', 'คดีคัดสรร (curated)'));
          var fl = el('div', 'atlas-concept-case-list');
          res.featured.forEach(function (fc) { append(fl, caseLink(fc.id, fc.note)); });
          append(sec, fl);
        }
        if (res.derived.length) {
          append(sec, el('h3', 'atlas-concept-cases-sub',
            'คดีอื่นที่อ้างมาตราในแนวคิดนี้ (' + res.derived.length + ') · จากดัชนีคดี'));
          var dl = el('div', 'atlas-concept-case-list');
          res.derived.forEach(function (c) { append(dl, caseLink(c.id, c.title)); });
          append(sec, dl);
        }
        if (!res.featured.length && !res.derived.length) {
          append(sec, el('p', 'atlas-concept-body', 'ยังไม่มีคดีสาธารณะที่เชื่อมโยงกับมาตราในแนวคิดนี้'));
        }
      } catch (e) { /* fail soft */ }
    });
    return sec;
  }

  function caseLink(id, note) {
    var row = el('div', 'atlas-concept-case');
    var a = el('a', 'atlas-concept-case-link', note || id);
    a.href = CASE_VIEW_URL + encodeURIComponent(id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
    append(row, a);
    return row;
  }

  function renderProvisionsList(concept) {
    if (!concept.provisions || !concept.provisions.length) return null;
    var sec = el('section', 'atlas-concept-section atlas-concept-provisions');
    append(sec, el('h2', 'atlas-concept-section-title', 'มาตราที่เกี่ยวข้อง'));
    ['core', 'related'].forEach(function (role) {
      var group = concept.provisions.filter(function (p) { return (p.role || 'related') === role; });
      if (!group.length) return;
      append(sec, el('h3', 'atlas-concept-cases-sub', role === 'core' ? 'มาตราหลัก' : 'มาตราประกอบ'));
      group.forEach(function (p) {
        var line = el('div', 'atlas-concept-prov-line');
        append(line, provisionPill(p.ref));
        if (p.note) append(line, el('span', 'atlas-concept-prov-note', ': ' + p.note));
        append(sec, line);
      });
    });
    return sec;
  }

  function renderRelated(concept) {
    if (!concept.relatedConcepts || !concept.relatedConcepts.length) return null;
    var sec = el('section', 'atlas-concept-section atlas-concept-related');
    append(sec, el('h2', 'atlas-concept-section-title', 'แนวคิดที่เกี่ยวข้อง'));
    var wrap = el('div', 'atlas-concept-related-wrap');
    concept.relatedConcepts.forEach(function (rc) { append(wrap, relatedConceptChip(rc, false)); });
    append(sec, wrap);
    return sec;
  }

  function renderSources(concept) {
    if (!concept.sources || !concept.sources.length) return null;
    var sec = el('section', 'atlas-concept-section atlas-concept-sources');
    append(sec, el('h2', 'atlas-concept-section-title', 'ที่มา'));
    var ul = el('ul', 'atlas-concept-source-list');
    concept.sources.forEach(function (s) {
      var li = el('li', 'atlas-concept-source' + (s.needsSourceVerification || s.kind === 'todo' ? ' is-todo' : ''));
      li.textContent = (s.kind ? '[' + s.kind + '] ' : '') + (s.text || '') + (s.note ? ' (' + s.note + ')' : '');
      append(ul, li);
    });
    append(sec, ul);
    return sec;
  }

  function renderInto(rootEl, slug) {
    if (!rootEl) return false;
    var concept = getConcept(slug);
    clear(rootEl);
    if (!concept) {
      var avail = Object.keys((_doc && _doc.concepts) || {}).filter(function (k) {
        return _doc.concepts[k] && _doc.concepts[k].status === 'published';
      });
      append(rootEl, el('p', 'atlas-concept-error',
        'ไม่พบแนวคิด "' + slug + '"' +
        (avail.length ? ' — แนวคิดที่เผยแพร่ขณะนี้: ' + avail.join(', ') : '') +
        ' (ดูทั้งหมดที่ concept.html)'));
      return false;
    }

    var art = el('article', 'atlas-concept');
    try { art.dataset.slug = concept.slug || slug; art.dataset.conceptId = concept.id || ''; }
    catch (e) { /* shim */ }

    append(art, renderCrumbs({ conceptLink: true }));

    var head = el('header', 'atlas-concept-head');
    var h1 = el('h1', 'atlas-concept-title', concept.titleTH || slug);
    if (concept.titleEN) append(h1, el('span', 'atlas-concept-en', ' ' + concept.titleEN));
    append(head, h1);

    if (concept.aliases && concept.aliases.length) {
      append(head, el('p', 'atlas-concept-aliases', 'เรียกอีกอย่างว่า: ' + concept.aliases.join(' · ')));
    }

    // curated cross-language legal terminology (Encyclopedia F3): render only
    // when present. titleEN is already shown beside the title; latin[] is an
    // additive, deliberately-curated field (never an auto-translation).
    if (concept.latin && concept.latin.length) {
      append(head, el('p', 'atlas-concept-aliases', 'ละติน: ' + concept.latin.join(' · ')));
    }

    // subject-area chips: reuse the registry taxonomy labels
    if (concept.subjectAreas && concept.subjectAreas.length) {
      var areas = el('div', 'atlas-concept-areas');
      var areaMap = {};
      try {
        var reg = global.AtlasCore && global.AtlasCore.getRegistry && global.AtlasCore.getRegistry();
        ((reg && reg.subjectAreas) || []).forEach(function (a) { areaMap[a.key] = a.title; });
      } catch (e) { /* ignore */ }
      concept.subjectAreas.forEach(function (k) {
        append(areas, el('span', 'atlas-concept-area-chip', areaMap[k] || k));
      });
      append(head, areas);
    }

    if (concept.definition) {
      append(head, el('p', 'atlas-concept-def', concept.definition.text || ''));
      var dp = provisionPillRow(concept.definition.provisions);
      if (dp) append(head, dp);
      var dl = lectureRefRow(concept.definition.lectureRefs);
      if (dl) append(head, dl);
    }
    append(art, head);

    if (concept.principle) {
      var pr = el('section', 'atlas-concept-section atlas-concept-principle');
      // heading is per-concept: liability concepts read "หลักการปรับบท", but a
      // validity/effect concept (นิติกรรม) or a procedural one needs its own.
      append(pr, el('h2', 'atlas-concept-section-title',
        concept.principle.label || 'หลักการปรับบท'));
      append(pr, el('p', 'atlas-concept-body', concept.principle.text || ''));
      var prp = provisionPillRow(concept.principle.provisions);
      if (prp) append(pr, prp);
      var prl = lectureRefRow(concept.principle.lectureRefs);
      if (prl) append(pr, prl);
      append(art, pr);
    }

    var anchor = renderAnchor(concept);
    if (anchor) append(art, anchor);

    (concept.sections || []).forEach(function (sec) { append(art, renderSection(sec)); });

    var provList = renderProvisionsList(concept);
    if (provList) append(art, provList);

    append(art, renderCases(concept));

    var related = renderRelated(concept);
    if (related) append(art, related);

    var sources = renderSources(concept);
    if (sources) append(art, sources);

    // authoring provenance footer
    if (concept.authoring) {
      var foot = el('footer', 'atlas-concept-foot');
      append(foot, el('p', null, 'ที่มาการเรียบเรียง: ' + (concept.authoring.provenance || '')));
      if (concept.authoring.needsSourceVerification && concept.authoring.needsSourceVerification.length) {
        append(foot, el('p', 'atlas-concept-verify',
          'ส่วนที่ยังต้องตรวจสอบ: ' + concept.authoring.needsSourceVerification.join(' · ')));
      }
      append(art, foot);
    }

    append(rootEl, art);
    return true;
  }

  // ================================================================
  // Concept Directory  (concept.html with no ?k= parameter)
  // A lightweight index only. NOT a new node.kind, NOT a graph. It reads the
  // SAME atlas-concepts.json (source of truth for concepts) and reuses the
  // registry subjectAreas taxonomy for domain labels.
  // ================================================================
  // every relatedConcepts ref that is not itself an authored concept yet,
  // deduped, in first-seen order. This is the "coming soon" list. No descriptions.
  function collectPlanned(concepts) {
    var seen = {}, out = [];
    Object.keys(concepts || {}).forEach(function (k) {
      (concepts[k].relatedConcepts || []).forEach(function (rc) {
        var ref = rc && rc.ref;
        if (!ref || String(ref).indexOf('atlas:concept/') !== 0) return;
        var s = ref.replace('atlas:concept/', '');
        if (concepts[s] || seen[s]) return;
        seen[s] = 1;
        out.push({ slug: s, labelTH: (rc && rc.labelTH) || s });
      });
    });
    return out;
  }

  function areaLabels(keys) {
    var map = {};
    try {
      var reg = global.AtlasCore && global.AtlasCore.getRegistry && global.AtlasCore.getRegistry();
      ((reg && reg.subjectAreas) || []).forEach(function (x) { map[x.key] = x.title; });
    } catch (e) { /* ignore */ }
    return (keys || []).map(function (k) { return map[k] || k; });
  }

  // A section heading with an optional English secondary label, matching the
  // bilingual pattern used elsewhere in the Concept layer (Thai primary,
  // English muted). Defaults live here the same way the previous Thai-only
  // labels did; a data-driven override may be supplied via _doc.directory.
  function directoryHeading(textTH, textEN) {
    var h = el('h2', 'atlas-concept-section-title', textTH);
    if (textEN) append(h, el('span', 'atlas-concept-section-en', textEN));
    return h;
  }

  // One published concept as a compact textual index entry (NOT a card):
  //   <li> <a>ชื่อไทย</a>  ชื่ออังกฤษ  สรุปหนึ่งบรรทัด  พื้นที่กฎหมาย
  // The concept name is the link; everything else is plain supporting text.
  function directoryListItem(concept, slug) {
    var li = el('li', 'atlas-concept-index-item');

    var a = el('a', 'atlas-concept-index-link', concept.titleTH || slug);
    a.href = 'concept.html?k=' + encodeURIComponent(concept.slug || slug);
    append(li, a);

    if (concept.titleEN) append(li, el('span', 'atlas-concept-index-en', concept.titleEN));

    var desc = concept.summary || (concept.definition && concept.definition.text) || '';
    if (desc) {
      if (!concept.summary && desc.length > 160) {
        desc = desc.slice(0, 158).replace(/\s+\S*$/, '') + '…';
      }
      append(li, el('p', 'atlas-concept-index-desc', desc));
    }

    var labels = areaLabels(concept.subjectAreas);
    if (labels.length) append(li, el('p', 'atlas-concept-index-areas', labels.join(' · ')));

    return li;
  }

  function renderDirectoryInto(rootEl) {
    if (!rootEl) return false;
    clear(rootEl);
    var d = (_doc && _doc.directory) || {};
    var concepts = (_doc && _doc.concepts) || {};
    var soonLabel = d.comingSoonLabel || 'เร็ว ๆ นี้';

    var art = el('article', 'atlas-concept atlas-concept-directory');
    try { art.dataset.view = 'directory'; } catch (e) { /* shim */ }

    append(art, renderCrumbs());

    var head = el('header', 'atlas-concept-head');
    var h1 = el('h1', 'atlas-concept-title', d.titleTH || 'แนวคิดทางกฎหมาย');
    if (d.titleEN) append(h1, el('span', 'atlas-concept-en', ' ' + d.titleEN));
    append(head, h1);
    if (d.intro) append(head, el('p', 'atlas-concept-def', d.intro));
    append(art, head);

    var published = Object.keys(concepts).filter(function (k) {
      return concepts[k] && concepts[k].status === 'published';
    });
    var availSec = el('section', 'atlas-concept-section');
    try { availSec.dataset.key = 'directory-available'; } catch (e) { /* shim */ }
    append(availSec, directoryHeading(
      d.publishedHeadingTH || 'แนวคิดที่เผยแพร่',
      d.publishedHeadingEN || 'Published Concepts'));
    if (!published.length) {
      append(availSec, el('p', 'atlas-concept-body', 'ยังไม่มีแนวคิดที่เผยแพร่ในระยะนี้'));
    } else {
      var list = el('ul', 'atlas-concept-index');
      published.forEach(function (k) { append(list, directoryListItem(concepts[k], k)); });
      append(availSec, list);
    }
    append(art, availSec);

    var planned = collectPlanned(concepts);
    if (planned.length) {
      var soonSec = el('section', 'atlas-concept-section');
      try { soonSec.dataset.key = 'directory-soon'; } catch (e) { /* shim */ }
      append(soonSec, directoryHeading(
        d.comingSoonHeadingTH || 'แนวคิดที่กำลังจัดทำ',
        d.comingSoonHeadingEN || 'Coming Soon'));
      var soonList = el('ul', 'atlas-concept-soon');
      planned.forEach(function (p) {
        append(soonList, el('li', 'atlas-concept-soon-item', p.labelTH));
      });
      append(soonSec, soonList);
      var soonNote = el('p', 'atlas-concept-soon-note',
        'รายการนี้สร้างจากแนวคิดที่อ้างถึงแต่ยังไม่ได้เขียน (' + soonLabel + ')');
      append(soonSec, soonNote);
      append(art, soonSec);
    }

    var note = el('footer', 'atlas-concept-foot');
    append(note, el('p', null,
      'ชั้นแนวคิดเป็นส่วนเสริมของ Thai Legal Atlas ไม่ใช่โครงสร้างใหม่: ' +
      'LEGAL DOMAIN › LEGAL CONCEPT › PROVISION › CASE. ' +
      'ทุกแนวคิดอ้างอิงกลับไปยังตัวบทและคดีเดิมของ Atlas'));
    append(art, note);

    append(rootEl, art);
    return true;
  }

  // ================================================================
  // public entry
  // ================================================================
  // slug falsy  -> render the Concept Directory
  // slug given  -> render that concept (Golden Sample when 'lamoed')
  function render(rootEl, slug, opts) {
    opts = opts || {};
    var url = opts.url || CONCEPTS_URL;
    return load(url).then(function () {
      var okRender = slug ? renderInto(rootEl, slug) : renderDirectoryInto(rootEl);
      // hand the newly-rendered provision pills to the inline drawer, if present
      if (okRender && slug && global.AtlasProvisionView && typeof global.AtlasProvisionView.init === 'function') {
        try { global.AtlasProvisionView.init({ root: rootEl }); } catch (e) { /* fail soft */ }
      }
      return okRender;
    }).catch(function (e) {
      if (global.console && console.warn) console.warn('[atlas-concepts] render failed', e);
      if (rootEl) { clear(rootEl); append(rootEl, el('p', 'atlas-concept-error', 'โหลดแนวคิดไม่สำเร็จ')); }
      return false;
    });
  }

  global.AtlasConcepts = {
    version: '0.1',
    render: render,
    renderDirectory: function (rootEl, opts) { return render(rootEl, null, opts); },
    load: load,
    _internal: {
      getConcept: getConcept,
      resolveRelated: resolveRelated,
      resolveProvisionRef: resolveProvisionRef,
      parseLectureRef: parseLectureRef,
      anchorHash: anchorHash,
      anchorReturnPayload: anchorReturnPayload,
      activateAnchor: activateAnchor,
      caseKey: caseKey,
      allProvisionRefs: allProvisionRefs,
      deriveCases: deriveCases,
      publicCasesForKey: publicCasesForKey,
      renderInto: renderInto,
      renderDirectoryInto: renderDirectoryInto,
      collectPlanned: collectPlanned,
      setDoc: function (d) { _doc = d || null; },
      setCaseIndex: function (o) { _caseIndexPromise = Promise.resolve(o && typeof o === 'object' ? o : {}); },
      reset: function () { _doc = null; _caseIndexPromise = null; },
      doc: function () { return _doc; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
