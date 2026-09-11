/* ============================================================================
 * atlas-clusters.js  —  Thai Legal Atlas · Related Provision Legal Clusters
 * ----------------------------------------------------------------------------
 * FINALIZATION 2. A STANDALONE presentation layer — same contract as
 * atlas-cases.js and atlas-provision-view.js:
 *
 *   - never mutates AtlasCore / AtlasUI, never calls their internals
 *     (the only AtlasCore calls are the PUBLIC resolvers getProvisionBrief /
 *      resolveProvision — used only to LABEL a pill, never to store anything)
 *   - never touches location.hash, the route grammar, or any provision URL
 *   - never duplicates statutory text or structural metadata — the มาตรา
 *     number / title / ตัวบท / breadcrumb / cancellation come from AtlasCore
 *     at render time; this module only carries curated editorial relationships
 *   - every member pill is  <a class="atlas-provision"
 *        href="codex-article-viewer.html?id=<collection>_<number>&x=atlas">
 *     so the click handler atlas-provision-view.js binds to the open panel
 *     intercepts it EXACTLY like a structure-tree pill — the Finalization 1
 *     in-context reader is reused, the ordinary Codex page is never opened
 *   - fails soft: any error leaves the panel fully usable, never throws
 *   - never adds a permanent role/kind/pattern field to any provision; a
 *     provision may appear in many clusters with a different relationship
 *     in each
 *
 * Source of truth: atlas-clusters.json — a curated file. Nothing here is
 * auto-generated and nothing is inferred from article-number proximity.
 *
 * Classic script (no ES modules). Exposes window.AtlasClusters.
 * Entry point: AtlasClusters.renderSection(container, resolved) — called by
 * atlas-provision-view.js from inside the reader panel body.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var CLUSTERS_URL = 'atlas-clusters.json';
  var STYLE_ID = 'atlas-clusters-style';
  var VIEWER_URL = 'codex-article-viewer.html?id=';

  // the frozen relationship taxonomy (FINALIZATION 2). A cluster or member
  // patternId outside this set is treated as unknown and shown verbatim.
  var PATTERN_IDS = {
    'general-special': 1, 'base-aggravated': 1, 'rule-exception': 1,
    'contrast-set': 1, 'trigger-consequence': 1, 'precondition': 1
  };

  var doc = global.document;

  var _doc = null;      // parsed atlas-clusters.json  ({ patternKinds, clusters[] } | null)
  var _byRef = null;    // { "<collection>_<number>": [clusterObj, ...] }
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
  // load + index
  // ================================================================
  function setDoc(j) {
    _doc = (j && typeof j === 'object' && Array.isArray(j.clusters)) ? j : null;
    _byRef = {};
    if (_doc) {
      for (var i = 0; i < _doc.clusters.length; i++) {
        var c = _doc.clusters[i];
        if (!c || !c.id || !Array.isArray(c.members)) continue;
        var refs = {};
        if (typeof c.anchor === 'string' && c.anchor) refs[c.anchor] = 1;
        for (var m = 0; m < c.members.length; m++) {
          var mm = c.members[m];
          if (mm && typeof mm.ref === 'string' && mm.ref) refs[mm.ref] = 1;
        }
        for (var k in refs) {
          if (Object.prototype.hasOwnProperty.call(refs, k)) {
            (_byRef[k] = _byRef[k] || []).push(c);
          }
        }
      }
    }
    return _doc;
  }

  function load(url) {
    if (_loadP) return _loadP;
    if (typeof global.fetch !== 'function') { _loadP = Promise.resolve(setDoc(null)); return _loadP; }
    _loadP = global.fetch(url || CLUSTERS_URL)
      .then(function (r) { if (!r || !r.ok) throw new Error('atlas-clusters fetch ' + (r && r.status)); return r.json(); })
      .then(function (j) { return setDoc(j); })
      .catch(function (e) {
        if (global.console && console.warn) console.warn('[atlas-clusters] load failed — related-provision clusters disabled', e);
        return setDoc(null);
      });
    return _loadP;
  }

  // ================================================================
  // lookups
  // ================================================================
  function patternLabel(pid) {
    var pk = (_doc && _doc.patternKinds) || {};
    if (pk[pid] && pk[pid].labelTH) return pk[pid].labelTH;
    return pid || '';
  }

  function clustersFor(collection, number) {
    if (!_byRef || !collection || number == null) return [];
    return _byRef[collection + '_' + number] || [];
  }

  // "<collection>_<number>" -> { collection, number }  (first "_" splits;
  // sub-numbers use "/", collection keys never contain "_")
  function splitRef(ref) {
    var s = String(ref == null ? '' : ref);
    var us = s.indexOf('_');
    if (us < 1 || us === s.length - 1) return null;
    return { collection: s.slice(0, us), number: s.slice(us + 1) };
  }

  function currentRefOf(resolved) {
    if (!resolved) return null;
    if (resolved.legacyId) return resolved.legacyId;
    var key = resolved.storageKey != null ? resolved.storageKey : resolved.number;
    return resolved.collection + '_' + key;
  }

  // ================================================================
  // stylesheet — scoped .atlas-cluster* ; theme via the Atlas -- vars
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var css = [
      '.atlas-cluster-sec{margin:0;}',
      '.atlas-cluster-sec-title{margin:0 0 12px;font-size:11px;font-weight:700;',
      '  letter-spacing:.03em;color:var(--muted,#5b6472);}',
      '.atlas-cluster{margin:0 0 14px;padding:12px 13px;border:1px solid var(--line,#e6e1d6);',
      '  border-radius:9px;background:var(--panel,#fff);}',
      '.atlas-cluster:last-child{margin-bottom:0;}',
      '.atlas-cluster-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 8px;margin:0 0 6px;}',
      '.atlas-cluster-title{font-size:12.5px;font-weight:700;line-height:1.45;color:var(--ink,#1f2430);}',
      '.atlas-cluster-pattern{flex:none;font-size:10.5px;font-weight:600;padding:1px 8px;',
      '  border-radius:999px;background:var(--chip,#f2ede1);color:var(--muted,#5b6472);}',
      '.atlas-cluster-explain{margin:0 0 10px;font-size:12px;line-height:1.75;color:var(--muted,#5b6472);}',
      '.atlas-cluster-members{display:flex;flex-wrap:wrap;align-items:flex-start;gap:6px 4px;}',
      '.atlas-cluster-members.is-seq{align-items:center;}',
      '.atlas-cluster-connector{margin:6px 0;font-size:13px;color:var(--muted,#5b6472);}',
      '.atlas-cluster-cell{display:flex;flex-direction:column;gap:3px;min-width:0;}',
      '.atlas-cluster-cell.is-current .atlas-provision{border-color:var(--accent,#2E4A7A);',
      '  background:var(--accent-soft,#eaf0f8);font-weight:700;}',
      '.atlas-cluster-sep{flex:none;align-self:center;font-size:12px;color:var(--muted,#5b6472);',
      '  padding:0 1px;}',
      '.atlas-cluster-note{font-size:11px;line-height:1.5;color:var(--muted,#5b6472);max-width:230px;}',
      '.atlas-cluster .atlas-provision{display:inline-block;padding:3px 9px;border:1px solid var(--line,#e6e1d6);',
      '  border-radius:6px;font-size:12px;background:var(--panel,#fff);color:var(--ink,#1f2430);',
      '  text-decoration:none;white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '.atlas-cluster .atlas-provision:hover{border-color:var(--accent,#2E4A7A);',
      '  background:var(--accent-soft,#eaf0f8);}',
      '.atlas-cluster .atlas-provision:focus-visible{outline:2px solid var(--accent,#2E4A7A);outline-offset:1px;}',
      '.atlas-cluster .atlas-provision-cancelled{opacity:.55;text-decoration:line-through;}',
      '.atlas-cluster-ref-missing{border-style:dashed !important;opacity:.6;}',
      '@media (max-width:760px){.atlas-cluster-note{max-width:none;}}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  // ================================================================
  // rendering
  // ================================================================
  // one clickable provision pill. It carries class "atlas-provision" and the
  // frozen viewer href + &x=atlas marker, so the capture-phase click handler
  // that atlas-provision-view.js attaches to the panel opens it in the same
  // in-context reader (progressive enhancement: if that handler is absent the
  // href just runs).
  function memberPill(ref) {
    var parts = splitRef(ref);
    var a = el('a', 'atlas-provision');
    var url = VIEWER_URL + encodeURIComponent(ref);
    a.setAttribute('href', url + (url.indexOf('?') === -1 ? '?' : '&') + 'x=atlas');

    var label = ref;
    var known = false;
    if (parts) {
      label = 'มาตรา ' + parts.number;
      try {
        var AC = global.AtlasCore;
        if (AC && typeof AC.getProvisionBrief === 'function') {
          var b = AC.getProvisionBrief(parts.collection, parts.number);
          if (b && b.number != null) {
            known = true;
            label = (b.unit || 'มาตรา') + ' ' + b.number;
            if (b.cancelled) a.className = 'atlas-provision atlas-provision-cancelled';
          }
        }
      } catch (e) { /* label falls back to the ref */ }
    }
    a.textContent = label;
    if (!known) {
      a.classList.add('atlas-cluster-ref-missing');
      a.title = 'ไม่พบบทบัญญัตินี้ในคลังข้อมูล';
    }
    return a;
  }

  function memberCell(m, clusterPatternId, currentRef) {
    var cell = el('span', 'atlas-cluster-cell' + (m.ref === currentRef ? ' is-current' : ''));
    cell.appendChild(memberPill(m.ref));
    var subs = [];
    if (m.patternId && m.patternId !== clusterPatternId) subs.push(patternLabel(m.patternId));
    if (m.noteTH) subs.push(String(m.noteTH));
    if (m.statuteCrossRefers === true) subs.push('กฎหมายโยงให้นำบทนี้มาใช้บังคับ');
    if (subs.length) cell.appendChild(el('span', 'atlas-cluster-note', subs.join(' · ')));
    return cell;
  }

  function clusterBlock(c, currentRef) {
    var box = el('div', 'atlas-cluster');
    try { box.dataset.clusterId = c.id || ''; } catch (e) { /* shim */ }

    var head = el('div', 'atlas-cluster-head');
    head.appendChild(el('span', 'atlas-cluster-title', c.titleTH || c.id || ''));
    if (c.patternId) head.appendChild(el('span', 'atlas-cluster-pattern', patternLabel(c.patternId)));
    box.appendChild(head);

    if (c.explanationTH) box.appendChild(el('p', 'atlas-cluster-explain', String(c.explanationTH)));

    var members = (c.members || []).filter(function (m) { return m && typeof m.ref === 'string' && m.ref; });
    // members WITHOUT an order render first as a "read alongside" set (also the
    // whole body of a G4 contrast-set); members WITH an order render as a
    // directional sequence. Both present → a "↓" connector between them.
    var setMembers = members.filter(function (m) { return typeof m.order !== 'number'; });
    var seqMembers = members.filter(function (m) { return typeof m.order === 'number'; })
      .sort(function (a, b) { return a.order - b.order; });

    if (setMembers.length) {
      var setRow = el('div', 'atlas-cluster-members is-set');
      setMembers.forEach(function (m, i) {
        if (i) setRow.appendChild(el('span', 'atlas-cluster-sep', '·'));
        setRow.appendChild(memberCell(m, c.patternId, currentRef));
      });
      box.appendChild(setRow);
    }

    if (setMembers.length && seqMembers.length) {
      box.appendChild(el('div', 'atlas-cluster-connector', '↓'));
    }

    if (seqMembers.length) {
      var seqRow = el('div', 'atlas-cluster-members is-seq');
      seqMembers.forEach(function (m, i) {
        if (i) seqRow.appendChild(el('span', 'atlas-cluster-sep', '→'));
        seqRow.appendChild(memberCell(m, c.patternId, currentRef));
      });
      box.appendChild(seqRow);
    }

    return box;
  }

  // build the "มาตราที่เกี่ยวข้อง" section for the resolved provision and
  // append it into `container` (an empty node already sitting in the panel
  // body). Async — waits for the curated file. Renders nothing when there is
  // no curated cluster for this provision.
  function renderSection(container, resolved) {
    if (!container || !resolved) return;
    injectStyle();
    load().then(function () {
      try {
        if (!container.parentNode) return;                 // panel closed/re-rendered meanwhile
        while (container.firstChild) container.removeChild(container.firstChild);
        var list = clustersFor(resolved.collection, resolved.number);
        if (!list.length) return;
        var currentRef = currentRefOf(resolved);
        var sec = el('section', 'atlas-cluster-sec');
        sec.appendChild(el('h3', 'atlas-cluster-sec-title', 'มาตราที่เกี่ยวข้อง'));
        list.forEach(function (c) { sec.appendChild(clusterBlock(c, currentRef)); });
        container.appendChild(sec);
      } catch (e) { /* fail soft */ }
    });
  }

  // ================================================================
  // expose
  // ================================================================
  global.AtlasClusters = {
    version: '1.0',
    renderSection: renderSection,
    load: load,
    _internal: {
      setDoc: setDoc,
      doc: function () { return _doc; },
      byRef: function () { return _byRef; },
      clustersFor: clustersFor,
      patternLabel: patternLabel,
      splitRef: splitRef,
      currentRefOf: currentRefOf,
      memberPill: memberPill,
      clusterBlock: clusterBlock,
      PATTERN_IDS: PATTERN_IDS,
      reset: function () { _doc = null; _byRef = null; _loadP = null; }
    }
  };
})(typeof window !== 'undefined' ? window : this);
