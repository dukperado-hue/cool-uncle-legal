/* ============================================================================
 * atlas-provision-lectures.js  —  Thai Legal Atlas · Provision Lecture Notes
 * ----------------------------------------------------------------------------
 * F11.3.4. A STANDALONE presentation layer — same contract as
 * atlas-clusters.js / atlas-provision-concepts.js:
 *
 *   - single source of truth: codex-data.json articles.<n>.lectureNotes[]
 *     ({id, topic, text, source}), already attached to resolved.article by
 *     AtlasCore.resolveProvision() — the SAME field atlas-concepts.js
 *     lectureRefRow() and the legacy codex-article-viewer.html already read.
 *     NO new dataset, NO schema change, NOTHING copied or duplicated.
 *   - never mutates AtlasCore / AtlasUI, never calls their internals — the
 *     only data read is resolved.article.lectureNotes, already resolved by
 *     the caller.
 *   - never touches location.hash, the route grammar, or any provision URL.
 *   - มาตรา cross-references inside note text reuse the EXISTING
 *     AtlasProvisionView._internal.appendLinkedText() linkifier verbatim —
 *     no second linkifier is written here. ฎีกา numbers are never linkified
 *     (there is no target page for them).
 *   - renders nothing when a provision has no lectureNotes — no empty card.
 *   - fails soft: any error leaves the F1 reader fully usable, never throws.
 *     Tolerates every irregular article shape seen in codex-data.json
 *     (missing field, non-array, null/malformed entries, missing sub-fields).
 *   - textContent only for lecture text/topic/source — never innerHTML.
 *   - AUTHORITY (non-negotiable): a persistent, always-visible label marks
 *     this content as editorial/AI-summarised lecture material, distinct
 *     from the statutory text above it and from any judicial ruling. Never
 *     styled to resemble either.
 *
 * Classic script (no ES modules). Exposes window.AtlasProvisionLectures.
 * Entry point: AtlasProvisionLectures.renderSection(container, resolved) —
 * called by atlas-provision-view.js from inside the reader panel body,
 * immediately after the statutory text and before the Concept backlink.
 * ==========================================================================*/
(function (global) {
  'use strict';

  var STYLE_ID = 'atlas-provision-lectures-style';

  // Mandatory, persistent authority label (F11.3.3 gate, constraint 4/6).
  // Never remove; never let it live only inside a collapsed <details>.
  var LABEL = 'คำอธิบายประกอบ — ไม่ใช่ตัวบทหรือคำพิพากษา';

  var doc = global.document;

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
  // data — read-only, no fetch, no cache: resolved.article.lectureNotes is
  // already the corpus array (AtlasCore attaches it when it builds `article`).
  // Filters out anything malformed instead of throwing.
  // ================================================================
  function isArray(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

  function notesFrom(resolved) {
    var art = resolved && resolved.article;
    var raw = art && art.lectureNotes;
    if (!isArray(raw)) return [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var n = raw[i];
      if (!n || typeof n !== 'object') continue;               // null / string / number entry
      var topic = (typeof n.topic === 'string') ? n.topic : '';
      var text = (typeof n.text === 'string') ? n.text : '';
      if (!topic && !text) continue;                            // nothing to show
      out.push({
        topic: topic,
        text: text,
        source: (typeof n.source === 'string') ? n.source : ''
      });
    }
    return out;
  }

  // ================================================================
  // stylesheet — scoped .atlas-plec-* ; a visually distinct editorial band
  // (never the statutory-text classes, never a "ruling" treatment)
  // ================================================================
  function injectStyle() {
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
    var css = [
      '.atlas-plec-sec{margin:0;}',
      '.atlas-plec-label{margin:0 0 10px;font-size:11px;font-weight:700;',
      '  letter-spacing:.03em;text-transform:uppercase;color:var(--muted,#5b6472);}',
      '.atlas-plec-note{margin:0 0 8px;border:1px solid var(--line,#e6e1d6);',
      '  border-left:3px solid var(--muted,#5b6472);border-radius:8px;',
      '  background:var(--chip,#f2ede1);padding:0 12px;}',
      '.atlas-plec-note:last-child{margin-bottom:0;}',
      '.atlas-plec-sum{list-style:none;cursor:pointer;padding:9px 0;',
      '  font-size:12.5px;font-weight:600;line-height:1.4;color:var(--ink,#1f2430);',
      '  -webkit-user-select:none;user-select:none;}',
      '.atlas-plec-sum::-webkit-details-marker{display:none;}',
      '.atlas-plec-sum::marker{content:"";}',
      '.atlas-plec-note[open]>.atlas-plec-sum{color:var(--accent,#2E4A7A);}',
      '.atlas-plec-body{padding:0 0 10px;font-size:12.5px;line-height:1.85;',
      '  color:var(--ink,#1f2430);}',
      '.atlas-plec-para{margin:0 0 .8em;}',
      '.atlas-plec-para:last-child{margin-bottom:0;}',
      '.atlas-plec-source{margin:8px 0 10px;padding-top:8px;',
      '  border-top:1px dashed var(--line,#e6e1d6);font-size:11px;',
      '  color:var(--muted,#5b6472);}'
    ].join('\n');
    var style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    doc.head.appendChild(style);
  }

  // ================================================================
  // rendering
  // ================================================================
  // Append `raw` into `target`, reusing the EXISTING AtlasProvisionView
  // มาตรา-linkifier when it is present. Never re-implements it; falls back to
  // plain text when the linkifier is unavailable (progressive enhancement).
  function appendNoteText(target, raw, resolved) {
    var APV = global.AtlasProvisionView;
    var fn = APV && APV._internal && APV._internal.appendLinkedText;
    if (typeof fn === 'function') { fn(target, raw, resolved); return; }
    target.appendChild(doc.createTextNode(String(raw == null ? '' : raw)));
  }

  // Preserve the note's paragraph/newline structure: one <p> per non-blank
  // line, mirroring the legacy article-viewer's white-space:pre-line intent
  // as real DOM paragraphs (same approach the statutory textEl() uses).
  function bodyEl(text, resolved) {
    var box = el('div', 'atlas-plec-body');
    var chunks = String(text == null ? '' : text).split('\n');
    for (var i = 0; i < chunks.length; i++) {
      var t = chunks[i].trim();
      if (!t) continue;
      var p = el('p', 'atlas-plec-para');
      appendNoteText(p, t, resolved);
      box.appendChild(p);
    }
    return box;
  }

  // One note → one collapsed <details>/<summary> (F11.3.3 gate: long notes
  // collapsed by default, topic shown in the summary — reusing the same
  // disclosure shape as the existing atlas-pcases / provision-view-cases
  // pattern). The mandatory source line sits inside, under the text.
  function noteEl(note, resolved) {
    var d = el('details', 'atlas-plec-note');
    d.appendChild(el('summary', 'atlas-plec-sum', note.topic || 'คำอธิบายประกอบ'));
    if (note.text) d.appendChild(bodyEl(note.text, resolved));
    if (note.source) d.appendChild(el('p', 'atlas-plec-source', 'ℹ️ ' + note.source));
    return d;
  }

  // Build the "🎓 คำอธิบายประกอบ" section for the resolved provision and append
  // it into `container` (an empty node already sitting in the panel body,
  // right after the statutory text). Synchronous — lectureNotes are already
  // in memory on resolved.article, no fetch involved. Renders nothing when
  // the provision has no lectureNotes.
  function renderSection(container, resolved) {
    if (!container || !resolved) return;
    try {
      injectStyle();
      while (container.firstChild) container.removeChild(container.firstChild);

      var notes = notesFrom(resolved);
      if (!notes.length) return;                      // no lectureNotes → no UI at all

      var sec = el('section', 'atlas-plec-sec');
      sec.appendChild(el('p', 'atlas-plec-label', LABEL));
      for (var i = 0; i < notes.length; i++) sec.appendChild(noteEl(notes[i], resolved));
      container.appendChild(sec);
    } catch (e) { /* fail soft — never break the F1 reader */ }
  }

  // ================================================================
  // expose
  // ================================================================
  global.AtlasProvisionLectures = {
    version: '1.0',
    renderSection: renderSection,
    _internal: {
      LABEL: LABEL,
      notesFrom: notesFrom,
      noteEl: noteEl,
      bodyEl: bodyEl,
      appendNoteText: appendNoteText
    }
  };
})(typeof window !== 'undefined' ? window : this);
