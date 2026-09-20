/* Thai Legal Atlas — subject-specific evidence policy for LEGAL HISTORY concepts.

   Why this exists
   ---------------
   Every other Atlas concept is anchored to statute text: a published concept must
   cite at least one มาตรา and one structuralAnchor into a real codex collection
   (atlas-validate.js, F3). Legal history has no codex collection — its evidence is
   people, doctrines, sources of law, institutions, historical documents and
   developments — so that rule cannot apply to it.

   This module is NOT a general "provisions are optional" switch. It defines one
   narrow, opt-in policy, `evidencePolicy: "legal-history"`, and a concept only
   gets the exemption when it passes EVERY check below. A concept that does not
   carry the marker (or fails a check) is judged by the original rules, unchanged.

   What a qualifying concept must carry
   ------------------------------------
   - status "published" and "legal-history" among its subjectTags
   - historicalEvidence.type  ∈ person | doctrine | source-of-law | institution |
                                document | development
   - historicalEvidence.basis[] — traceable references, each { source, locator, label }
       * ≥1 to the course study page (source "legalhist-page", locator study:<topicId>
         where topicId really exists in legalhist.html STUDY_TOPICS)
       * ≥1 to a registered NotebookLM source of kind audio | document | video | web
         (atlas-historical-sources.json). Exam material alone never counts.
   - historicalEvidence.verification — { method, notebook, date, query }: how the
       claim was checked against the source (audio verification needs an audio basis)
   - authoring.provenance (non-empty) — as for every concept

   What it does NOT relax: definition text, ≥1 section, relation contracts,
   alias/title hygiene, provision/anchor/lecture-ref resolution for whatever IS
   present. It only removes the *presence* requirement for provisions,
   structuralAnchor and non-empty subjectAreas.
*/
(function (global) {
  'use strict';

  var POLICY = 'legal-history';
  var TAG = 'legal-history';
  var TYPES = ['person', 'doctrine', 'source-of-law', 'institution', 'document', 'development'];
  var TYPE_LABEL_TH = {
    'person': 'บุคคลสำคัญ',
    'doctrine': 'หลักกฎหมาย / doctrine',
    'source-of-law': 'แหล่งที่มาของกฎหมาย',
    'institution': 'สถาบันหรือระบบกฎหมาย',
    'document': 'เอกสาร/กฎหมายประวัติศาสตร์',
    'development': 'เหตุการณ์หรือพัฒนาการทางกฎหมาย',
  };
  var VERIFY_METHODS = ['notebooklm-audio', 'notebooklm-document'];
  var EVIDENCE_KINDS = ['audio', 'document', 'video', 'web'];   // exam-material never counts alone
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var LOCATOR_RE = /^study:([a-z0-9]+)$/;

  function isMarked(c) { return !!c && c.evidencePolicy === POLICY; }

  // Parse STUDY_TOPICS ids out of the study page source (no DOM needed).
  function readStudyTopicIds(html) {
    var s = String(html || '');
    var i = s.indexOf('const STUDY_TOPICS');
    if (i < 0) return [];
    var j = s.indexOf('const VIDEO_GROUPS', i);
    var block = s.slice(i, j < 0 ? undefined : j);
    var ids = [], re = /\{\s*id:\s*"([a-z0-9]+)"\s*,\s*cat:/g, m;
    while ((m = re.exec(block))) ids.push(m[1]);
    return ids;
  }

  function makeContext(registryDoc, studyPageHtml) {
    var reg = registryDoc || {};
    return {
      sources: reg.sources || {},
      studyPageId: (reg.studyPage && reg.studyPage.id) || 'legalhist-page',
      notebookId: (reg.notebook && reg.notebook.id) || null,
      topicIds: readStudyTopicIds(studyPageHtml),
    };
  }

  // Returns [] when the concept satisfies the policy; otherwise a list of problems.
  function check(c, ctx) {
    var p = [];
    var add = function (code, msg) { p.push({ code: code, message: msg }); };
    if (!isMarked(c)) { add('not-marked', 'evidencePolicy is not "' + POLICY + '"'); return p; }
    if (c.status !== 'published') add('status', 'policy applies to published concepts only');
    if (!Array.isArray(c.subjectTags) || c.subjectTags.indexOf(TAG) === -1) add('tag', 'subjectTags must include "' + TAG + '"');
    var h = c.historicalEvidence;
    if (!h || typeof h !== 'object') { add('missing', 'historicalEvidence is required'); return p; }
    if (TYPES.indexOf(h.type) === -1) add('type', 'historicalEvidence.type must be one of ' + TYPES.join('|'));
    var basis = Array.isArray(h.basis) ? h.basis : [];
    if (basis.length < 2) add('basis-count', 'historicalEvidence.basis needs >=2 traceable items');
    var hasPage = false, hasSource = false, hasAudio = false;
    basis.forEach(function (b, i) {
      var at = 'basis[' + i + ']';
      if (!b || typeof b.source !== 'string' || typeof b.locator !== 'string' || !b.locator.trim()) { add('basis-shape', at + ' needs source + locator'); return; }
      if (typeof b.label !== 'string' || !b.label.trim()) add('basis-label', at + ' needs a display label');
      if (b.source === ctx.studyPageId) {
        var m = LOCATOR_RE.exec(b.locator);
        if (!m) add('locator', at + ' study-page locator must be study:<topicId>');
        else if (ctx.topicIds.indexOf(m[1]) === -1) add('locator-unresolved', at + ' study topic "' + m[1] + '" does not exist in legalhist.html');
        else hasPage = true;
      } else {
        var s = ctx.sources[b.source];
        if (!s) add('source-unregistered', at + ' source "' + b.source + '" is not in atlas-historical-sources.json');
        else if (EVIDENCE_KINDS.indexOf(s.kind) !== -1) { hasSource = true; if (s.kind === 'audio') hasAudio = true; }
      }
    });
    if (!hasPage) add('no-page', 'needs >=1 basis on the course study page (source ' + ctx.studyPageId + ')');
    if (!hasSource) add('no-source', 'needs >=1 registered NotebookLM source of kind ' + EVIDENCE_KINDS.join('|') + ' (exam material alone does not count)');
    var v = h.verification;
    if (!v || typeof v !== 'object') add('verification', 'historicalEvidence.verification is required');
    else {
      if (VERIFY_METHODS.indexOf(v.method) === -1) add('verification-method', 'verification.method must be ' + VERIFY_METHODS.join('|'));
      if (!ctx.notebookId || v.notebook !== ctx.notebookId) add('verification-notebook', 'verification.notebook must equal the registered notebook id');
      if (typeof v.date !== 'string' || !DATE_RE.test(v.date)) add('verification-date', 'verification.date must be YYYY-MM-DD');
      if (typeof v.query !== 'string' || v.query.trim().length < 10) add('verification-query', 'verification.query must record what was asked');
      if (v.method === 'notebooklm-audio' && !hasAudio) add('verification-audio', 'audio verification needs >=1 audio basis');
    }
    if (!c.authoring || typeof c.authoring.provenance !== 'string' || !c.authoring.provenance.trim()) add('provenance', 'authoring.provenance is required');
    return p;
  }

  // The ONLY thing callers may use to grant the exemption.
  function qualifies(c, ctx) { return isMarked(c) && check(c, ctx).length === 0; }

  // A concept carrying historical evidence without the marker (or vice versa) is malformed.
  function stray(c) { return !isMarked(c) && !!c && c.historicalEvidence != null; }

  var api = {
    POLICY: POLICY, TAG: TAG, TYPES: TYPES, TYPE_LABEL_TH: TYPE_LABEL_TH,
    isMarked: isMarked, readStudyTopicIds: readStudyTopicIds, makeContext: makeContext,
    check: check, qualifies: qualifies, stray: stray,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.AtlasLegalHistoryPolicy = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
