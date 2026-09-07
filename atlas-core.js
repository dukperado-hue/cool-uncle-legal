/* ============================================================================
 * atlas-core.js  —  Thai Legal Atlas · shared structural layer
 * ----------------------------------------------------------------------------
 * ONE ATLAS, MULTIPLE LEGAL ONTOLOGIES.
 *
 * This module is the common navigation/information layer that sits ABOVE the
 * native structure of each legal collection. It does NOT normalize Thai law
 * into one hierarchy — it reads collections-registry.json, where every
 * collection declares its own ordered list of structural levels, and walks
 * whatever each collection actually has.
 *
 * Hard rules honoured here:
 *   - NO hardcoded phaak / laksana / muad / suan level list. Levels come
 *     from the registry, per collection.
 *   - Article IDs and URLs are NEVER changed. resolveProvision() /
 *     resolveAtlasId() always emit codex-article-viewer.html?id=<key>_<number>
 *     exactly as before. This layer is purely additive.
 *   - The meta.<field> value already contains the Thai structural word
 *     ("บรรพ 3", "ภาค 2"); the registry 'label' is only for UI chrome.
 *
 * Classic script (no ES modules). Exposes window.AtlasCore.
 * Optional dependency: window.AtlasPatches (atlas-patches.js) — if present,
 * source-gap corrections are applied lazily per collection.
 *
 * Typical wiring on a page that already fetches codex-data.json:
 *     <script src="atlas-patches.js"></script>
 *     <script src="atlas-core.js"></script>
 *     ...
 *     const [codex] = await Promise.all([
 *       fetch('codex-data.json?v=...').then(r => r.json()),
 *       AtlasCore.loadRegistry()          // fetches collections-registry.json
 *     ]);
 *     AtlasCore.attachCorpus(codex);
 *     // now AtlasCore.getBreadcrumb(key, number) etc. are usable
 * ==========================================================================*/
(function (global) {
  'use strict';

  var REG = null;          // parsed collections-registry.json
  var CORPUS = null;       // parsed codex-data.json
  var _regPromise = null;
  var _patched = {};       // collectionKey -> true once meta patches applied

  // ------------------------------------------------------------------ utils
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isEnabled(c) { return c && c.enabled !== false && !c.planned; }

  // ------------------------------------------- article-number ordering (1×)
  // Single source of truth for มาตรา ordering across the whole site. Handles
  // Thai digits, "/n" sub-numbers, and the Thai ordinal suffix family
  // (ทวิ ตรี จัตวา เบญจ ฉ สัตต อัฏฐ นว ทศ ...).
  var SUFFIX_RANK = {
    '': 0, 'ทวิ': 1, 'ตรี': 2, 'จัตวา': 3, 'เบญจ': 4, 'ฉ': 5, 'ฉก': 5,
    'สัตต': 6, 'อัฏฐ': 7, 'อัฎฐ': 7, 'นว': 8, 'ทศ': 9, 'เอกาทศ': 10, 'ทวาทศ': 11
  };
  var THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

  function thaiToArabic(s) {
    return String(s == null ? '' : s).replace(/[๐-๙]/g, function (d) {
      return String(THAI_DIGITS.indexOf(d));
    });
  }

  function sortKey(numStr) {
    var s = thaiToArabic(numStr).trim();
    var sp = s.indexOf(' ');
    var numPart = sp === -1 ? s : s.slice(0, sp);
    var suffix = sp === -1 ? '' : s.slice(sp + 1).trim();
    var mp = numPart.split('/');
    var main = parseInt(mp[0], 10);
    if (isNaN(main)) main = Number.MAX_SAFE_INTEGER;
    var sub = mp[1] ? (parseInt(mp[1], 10) || 0) : 0;
    var suffixSub = 0;
    var ss = suffix.indexOf('/');
    if (ss !== -1) {
      suffixSub = parseInt(suffix.slice(ss + 1), 10) || 0;
      suffix = suffix.slice(0, ss).trim();
    }
    var rank = has(SUFFIX_RANK, suffix) ? SUFFIX_RANK[suffix] : (suffix ? 99 : 0);
    return [main, sub, rank, suffixSub];
  }

  function compareNumbers(a, b) {
    var ka = sortKey(a), kb = sortKey(b);
    for (var i = 0; i < 4; i++) { if (ka[i] !== kb[i]) return ka[i] - kb[i]; }
    return 0;
  }

  // Compare two structural-level values like "บรรพ 3" / "ภาค 2" / "หมวด 10"
  // by the number they carry. Rules:
  //   - numbered values sort ascending by number (then "/sub")
  //   - a value with no number sorts AFTER all numbered ones
  //   - บทเฉพาะกาล / บทเบ็ดเสร็จ (transitional / final clauses) sort last
  function _levelRank(v) {
    var s = String(v);
    if (/เฉพาะกาล/.test(s)) return 2;   // บทเฉพาะกาล — always last
    return /\d/.test(s) ? 0 : 1;         // numbered first, other text between
  }
  function compareLevelValues(a, b) {
    var ra = _levelRank(a), rb = _levelRank(b);
    if (ra !== rb) return ra - rb;
    var ma = String(a).match(/(\d+)(?:\/(\d+))?/);
    var mb = String(b).match(/(\d+)(?:\/(\d+))?/);
    if (!ma || !mb) return String(a).localeCompare(String(b), 'th');
    var na = parseInt(ma[1], 10), nb = parseInt(mb[1], 10);
    if (na !== nb) return na - nb;
    return (ma[2] ? +ma[2] : 0) - (mb[2] ? +mb[2] : 0);
  }

  // ---------------------------------------------------------- registry load
  function loadRegistry(url) {
    if (_regPromise) return _regPromise;
    url = url || 'collections-registry.json';
    _regPromise = fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('atlas: registry fetch ' + r.status);
        return r.json();
      })
      .then(function (json) { REG = json; return json; })
      .catch(function (err) { _regPromise = null; throw err; });
    return _regPromise;
  }
  function setRegistry(obj) { REG = obj; return REG; }
  function attachCorpus(codexData) { CORPUS = codexData; return CORPUS; }
  function isReady() { return !!REG; }
  function hasCorpus() { return !!CORPUS; }
  function getRegistry() { return REG; }

  // --------------------------------------------------------------- patches
  function patchMeta(collectionKey, number, meta) {
    meta = meta || {};
    if (global.AtlasPatches && typeof global.AtlasPatches.patchMeta === 'function') {
      return global.AtlasPatches.patchMeta(collectionKey, number, meta);
    }
    return meta;
  }

  function ensurePatched(collectionKey) {
    if (_patched[collectionKey]) return;
    if (!CORPUS || !CORPUS.books || !CORPUS.books[collectionKey]) return;
    var arts = CORPUS.books[collectionKey].articles || {};
    for (var n in arts) {
      if (has(arts, n)) arts[n].meta = patchMeta(collectionKey, n, arts[n].meta || {});
    }
    _patched[collectionKey] = true;
  }

  // ---------------------------------------------------- collection helpers
  function _collections() { return (REG && REG.collections) || {}; }
  function _raw(key) { return _collections()[key] || null; }

  function collectionInCorpus(key) {
    return !!(CORPUS && CORPUS.books && CORPUS.books[key] &&
              CORPUS.books[key].articles &&
              Object.keys(CORPUS.books[key].articles).length);
  }

  function _defaultUnit() {
    return (REG && REG.defaults && REG.defaults.provisionUnit) || 'มาตรา';
  }
  function _defaultSource() {
    return (REG && REG.defaults && REG.defaults.source) || null;
  }

  function _instrumentField(c) {
    return (c && c.instrumentField) || 'instrument';
  }
  function _findInstrument(c, instrumentId) {
    if (!c || !c.instruments || !instrumentId) return null;
    for (var i = 0; i < c.instruments.length; i++) {
      if (c.instruments[i].id === instrumentId) return c.instruments[i];
    }
    return null;
  }
  function _isMulti(c) { return !!(c && c.instrumentModel === 'multi'); }

  // ----- storage-key model -------------------------------------------------
  // A "storage key" is the key under CORPUS.books[<collection>].articles.
  //   single-instrument collections : storageKey === number   (UNCHANGED)
  //   multi-instrument collections   : storageKey === "<instrumentId>::<number>"
  // The "::" separator cannot appear in a Thai มาตรา/ข้อ number (digits, "/",
  // and the ทวิ/ตรี suffix words only), so same-number provisions in different
  // instruments never collide.
  var KEY_SEP = '::';

  function _storageKey(c, instrumentId, number) {
    if (_isMulti(c) && instrumentId) return instrumentId + KEY_SEP + number;
    return String(number);
  }
  // Split a storage key (or a bare number) into { instrument, number }.
  function _splitKey(c, storageKey) {
    var s = String(storageKey);
    if (_isMulti(c)) {
      var i = s.indexOf(KEY_SEP);
      if (i !== -1) return { instrument: s.slice(0, i), number: s.slice(i + KEY_SEP.length) };
    }
    return { instrument: null, number: s };
  }
  // Legacy viewer id for a storage key. Single: "<collection>_<number>"
  // (byte-identical to before). Multi: "<collection>_<instrument>::<number>"
  // — still exactly one "_" at the split point, so the viewer's existing
  // id.slice(0, id.indexOf('_')) parse keeps working.
  function _legacyId(collectionKey, storageKey) {
    return collectionKey + '_' + storageKey;
  }
  function _viewerUrl(collectionKey, storageKey) {
    return 'codex-article-viewer.html?id=' +
      encodeURIComponent(_legacyId(collectionKey, storageKey));
  }

  function getInstrument(collectionKey, instrumentId) {
    var c = _raw(collectionKey);
    var inst = _findInstrument(c, instrumentId);
    if (!inst) return null;
    return {
      id: inst.id, type: inst.type, title: inst.title,
      short: inst.short || inst.title,
      authorityRank: inst.authorityRank || null,
      provisionUnit: inst.provisionUnit || (c && c.provisionUnit) || _defaultUnit(),
      levels: (inst.levels || []).slice(),
      collection: collectionKey
    };
  }

  function _unitFor(c, instrumentId) {
    if (c && c.instrumentModel === 'multi' && instrumentId) {
      var inst = _findInstrument(c, instrumentId);
      if (inst && inst.provisionUnit) return inst.provisionUnit;
    }
    return (c && c.provisionUnit) || _defaultUnit();
  }

  // Ordered list of structural levels that apply to a given
  // (collection [, instrument]) pair. For a multi-instrument collection with
  // no instrument chosen yet, the instrument itself is the only "level".
  function _levelsFor(c, instrumentId) {
    if (!c) return [];
    if (c.instrumentModel === 'multi') {
      if (!instrumentId) {
        return [{
          kind: 'instrument',
          field: _instrumentField(c),
          label: 'ฉบับกฎหมาย',
          __instrument: true
        }];
      }
      var inst = _findInstrument(c, instrumentId);
      return (inst && inst.levels) ? inst.levels.slice() : [];
    }
    return (c.levels || []).slice();
  }

  function _summary(c) {
    return {
      key: c.key,
      title: c.title,
      short: c.short || c.title,
      icon: c.icon || '📄',
      subjectArea: c.subjectArea || null,
      instrumentModel: c.instrumentModel || 'single',
      instrumentType: c.instrumentType || null,
      provisionUnit: c.provisionUnit || _defaultUnit(),
      levels: (c.levels || []).slice(),
      levelCount: (c.levels || []).length,
      articleCount: c.articleCount ||
        (collectionInCorpus(c.key) ? Object.keys(CORPUS.books[c.key].articles).length : 0),
      inCorpus: collectionInCorpus(c.key),
      planned: !!c.planned || c.enabled === false,
      enacted: c.enacted || null,
      source: c.source || _defaultSource(),
      blurb: c.blurb || '',          // user-facing structural description
      notes: c.notes || '',          // developer metadata — not for UI display
      instrumentCount: (c.instruments || []).length
    };
  }

  // ------------------------------------------------------------- public API

  function listCollections(opts) {
    opts = opts || {};
    var cs = _collections();
    var out = [];
    for (var k in cs) {
      if (!has(cs, k)) continue;
      var c = cs[k];
      if (!opts.includePlanned && !isEnabled(c)) continue;
      if (opts.requireCorpus && !collectionInCorpus(k)) continue;
      out.push(_summary(c));
    }
    var areaOrder = _areaOrderMap();
    out.sort(function (a, b) {
      var oa = areaOrder[a.subjectArea] || 999, ob = areaOrder[b.subjectArea] || 999;
      if (oa !== ob) return oa - ob;
      return b.articleCount - a.articleCount;
    });
    return out;
  }

  function _areaOrderMap() {
    var m = {};
    ((REG && REG.subjectAreas) || []).forEach(function (a) { m[a.key] = a.order || 0; });
    return m;
  }

  function listSubjectAreas(opts) {
    opts = opts || {};
    var areas = ((REG && REG.subjectAreas) || []).slice()
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
      .filter(function (a) { return opts.includePlanned || !a.planned; });
    var cols = listCollections(opts);
    return areas.map(function (a) {
      return {
        key: a.key,
        title: a.title,
        order: a.order || 0,
        planned: !!a.planned,
        collections: cols.filter(function (c) { return c.subjectArea === a.key; })
      };
    });
  }

  function getCollection(key) {
    var c = _raw(key);
    if (!c) return null;
    var s = _summary(c);
    if (c.instruments) {
      s.instruments = c.instruments.map(function (inst) {
        return {
          id: inst.id, type: inst.type, title: inst.title,
          short: inst.short || inst.title,
          authorityRank: inst.authorityRank || null,
          provisionUnit: inst.provisionUnit || s.provisionUnit,
          levels: (inst.levels || []).slice()
        };
      });
    }
    return s;
  }

  // Union of every structural field declared anywhere in the registry, in
  // canonical depth order. Consumers that still keep a private LEVELS array
  // (e.g. neural-network.html's graph builder) can source it from here
  // instead of hardcoding.
  var CANON_ORDER = ['instrument', 'phaak', 'laksana', 'muad', 'suan',
                     'part', 'title', 'division', 'subdivision', 'clause'];
  function getStructuralFieldOrder() {
    var seen = {}, order = [];
    var cs = _collections();
    for (var k in cs) {
      if (!has(cs, k)) continue;
      var lists = [];
      if (cs[k].levels) lists.push(cs[k].levels);
      (cs[k].instruments || []).forEach(function (i) { if (i.levels) lists.push(i.levels); });
      lists.forEach(function (ls) {
        ls.forEach(function (l) { if (!seen[l.field]) { seen[l.field] = 1; order.push(l.field); } });
      });
    }
    order.sort(function (a, b) {
      var ia = CANON_ORDER.indexOf(a); if (ia === -1) ia = 99;
      var ib = CANON_ORDER.indexOf(b); if (ib === -1) ib = 99;
      return ia - ib;
    });
    return order;
  }

  // ----- structure tree -------------------------------------------------
  // Recursively group a flat article list by the collection's declared
  // levels. Any article missing a value at the first non-empty level is
  // collected into a synthetic node (value:null) so NOTHING is ever
  // silently dropped.
  function _buildLevel(arts, levels, startIdx, pathValues, opts) {
    opts = opts || {};
    for (var i = startIdx; i < levels.length; i++) {
      var lv = levels[i];
      var groups = {};
      var order = [];
      var untagged = [];
      for (var a = 0; a < arts.length; a++) {
        var v = (arts[a].meta || {})[lv.field];
        if (v) {
          if (!has(groups, v)) { groups[v] = []; order.push(v); }
          groups[v].push(arts[a]);
        } else {
          untagged.push(arts[a]);
        }
      }
      if (order.length === 0) continue; // this level unused in this subtree

      order.sort(compareLevelValues);
      var out = order.map(function (v) {
        return _makeNode(lv, v, groups[v], levels, i + 1, pathValues.concat([v]), opts);
      });
      if (untagged.length) {
        out.push(_makeNode(lv, null, untagged, levels, i + 1, pathValues.concat([null]), opts));
      }
      return out;
    }
    return null; // no more structural levels -> caller emits provision leaves
  }

  function _makeNode(levelDef, value, arts, levels, nextIdx, pathValues, opts) {
    opts = opts || {};
    var title = '';
    for (var j = 0; j < arts.length; j++) {
      var t = (arts[j].meta || {})[levelDef.field + 'Title'];
      if (t) { title = t; break; }
    }
    var children = _buildLevel(arts, levels, nextIdx, pathValues, opts);
    var node = {
      kind: levelDef.kind,
      field: levelDef.field,
      levelLabel: levelDef.label || '',
      value: value,                                   // "บรรพ 1" | null
      label: value ||
        (opts.unsortedLabel || ('ไม่ได้จัดเข้า' + (levelDef.label || 'หมวด'))),
      title: title,
      count: arts.length,
      path: pathValues.slice()
    };
    if (children) {
      node.children = children;
      node.articles = null;
    } else {
      node.children = null;
      // leaf list holds STORAGE KEYS (== number for single-instrument
      // collections; "<instrument>::<number>" for multi). Sorted by number.
      var keyOf = opts.keyOf || function (x) { return x.number; };
      node.articles = arts.map(keyOf).sort(function (a, b) {
        return compareNumbers(_numberPart(a), _numberPart(b));
      });
    }
    return node;
  }

  function _numberPart(storageKey) {
    var s = String(storageKey);
    var i = s.indexOf(KEY_SEP);
    return i === -1 ? s : s.slice(i + KEY_SEP.length);
  }

  function getStructureTree(collectionKey) {
    var c = _raw(collectionKey);
    if (!c) return null;
    if (!collectionInCorpus(collectionKey)) {
      return {
        collection: collectionKey,
        instrumentModel: c.instrumentModel || 'single',
        planned: true,
        nodes: []
      };
    }
    ensurePatched(collectionKey);
    var artsMap = CORPUS.books[collectionKey].articles;
    var arts = Object.keys(artsMap).map(function (n) { return artsMap[n]; });

    if (c.instrumentModel === 'multi') {
      var field = _instrumentField(c);
      var byInst = {};
      arts.forEach(function (a) {
        var iid = (a.meta || {})[field] || '__none__';
        (byInst[iid] = byInst[iid] || []).push(a);
      });
      var nodes = (c.instruments || []).map(function (inst) {
        var sub = byInst[inst.id] || [];
        var keyOf = function (x) { return inst.id + KEY_SEP + x.number; };
        var buildOpts = { unsortedLabel: c.unsortedLabel, keyOf: keyOf };
        var children = _buildLevel(sub, inst.levels || [], 0, [], buildOpts);
        return {
          kind: 'instrument',
          field: field,
          value: inst.id,
          label: inst.short || inst.title,
          title: inst.title,
          instrumentType: inst.type,
          authorityRank: inst.authorityRank || null,
          provisionUnit: inst.provisionUnit || c.provisionUnit || _defaultUnit(),
          count: sub.length,
          path: [inst.id],
          children: children,
          articles: children ? null : sub.map(keyOf).sort(function (a, b) {
            return compareNumbers(_numberPart(a), _numberPart(b));
          })
        };
      }).filter(function (n) { return n.count > 0; });
      return {
        collection: collectionKey, instrumentModel: 'multi',
        instruments: (c.instruments || []).map(function (i) {
          return { id: i.id, type: i.type, short: i.short || i.title, authorityRank: i.authorityRank || null };
        }),
        nodes: nodes
      };
    }

    var levels = c.levels || [];
    var tree = _buildLevel(arts, levels, 0, [], { unsortedLabel: c.unsortedLabel });
    return {
      collection: collectionKey,
      instrumentModel: 'single',
      levels: levels.slice(),
      // when a collection has no structural levels at all (flat Act),
      // _buildLevel returns null -> expose provisions directly.
      nodes: tree,
      articles: tree ? null : arts.map(function (x) { return x.number; }).sort(compareNumbers)
    };
  }

  // ----- single provision --------------------------------------------
  // ref may be a bare number (single-instrument, UNCHANGED) or a storage key
  // "<instrument>::<number>" (multi). An explicit instrumentId 3rd arg wins.
  function resolveProvision(collectionKey, ref, instrumentId) {
    var c = _raw(collectionKey);
    if (!c || !collectionInCorpus(collectionKey)) return null;
    ensurePatched(collectionKey);

    var sk;
    if (_isMulti(c)) {
      var parsed = _splitKey(c, ref);
      var instId = instrumentId || parsed.instrument ||
        // last resort: a bare number was passed for a multi collection —
        // fall back to the meta.instrument of whatever key matches, if unique
        _uniqueInstrumentFor(collectionKey, parsed.number);
      sk = _storageKey(c, instId, parsed.number);
    } else {
      sk = String(ref);
    }

    var art = CORPUS.books[collectionKey].articles[sk];
    if (!art) return null;
    var split = _splitKey(c, sk);
    var instFinal = _isMulti(c)
      ? (split.instrument || (art.meta || {})[_instrumentField(c)] || null)
      : null;
    return {
      collection: collectionKey,
      collectionTitle: c.title,
      collectionShort: c.short || c.title,
      instrument: instFinal,
      number: art.number,
      storageKey: sk,
      unit: _unitFor(c, instFinal),
      cancelled: !!art.cancelled,
      article: art,
      atlasId: makeAtlasId(collectionKey, instFinal, art.number),
      legacyId: _legacyId(collectionKey, sk),
      viewerUrl: _viewerUrl(collectionKey, sk),
      breadcrumb: getBreadcrumb(collectionKey, sk)
    };
  }

  function _uniqueInstrumentFor(collectionKey, number) {
    var c = _raw(collectionKey);
    if (!_isMulti(c) || !collectionInCorpus(collectionKey)) return null;
    var artsMap = CORPUS.books[collectionKey].articles;
    var found = null;
    for (var k in artsMap) {
      if (!has(artsMap, k)) continue;
      var sp = _splitKey(c, k);
      if (sp.number === String(number)) {
        if (found) return null; // ambiguous
        found = sp.instrument;
      }
    }
    return found;
  }

  // Lean per-provision lookup for RENDERING leaf links — no breadcrumb, no
  // article object. Safe to call once per pill when a branch is expanded.
  // (resolveProvision stays the full semantic lookup; do NOT use it just to
  // build a hyperlink.)  ref = bare number (single) or storage key (multi).
  function getProvisionBrief(collectionKey, ref, instrumentId) {
    var c = _raw(collectionKey);
    if (!c || !collectionInCorpus(collectionKey)) return null;
    ensurePatched(collectionKey);
    var sk;
    if (_isMulti(c)) {
      var parsed = _splitKey(c, ref);
      var inst = instrumentId || parsed.instrument ||
        _uniqueInstrumentFor(collectionKey, parsed.number);
      sk = _storageKey(c, inst, parsed.number);
    } else {
      sk = String(ref);
    }
    var art = CORPUS.books[collectionKey].articles[sk];
    if (!art) return null;
    var split = _splitKey(c, sk);
    var instFinal = _isMulti(c)
      ? (split.instrument || (art.meta || {})[_instrumentField(c)] || null)
      : null;
    return {
      number: art.number,
      unit: _unitFor(c, instFinal),
      cancelled: !!art.cancelled,
      storageKey: sk,
      legacyId: _legacyId(collectionKey, sk),
      viewerUrl: _viewerUrl(collectionKey, sk)
    };
  }

  // Returns an array of crumb objects, first = collection, last = provision.
  // Each crumb: { kind, field?, label, value, title, text }
  //   text  -> ready-to-print label (structural crumbs use the stored value
  //            which already contains the Thai word, e.g. "บรรพ 1")
  //   label -> the level word from the registry ("บรรพ" / "ภาค" / "หมวด")
  // ref = bare number (single) or storage key "<instrument>::<number>" (multi).
  function getBreadcrumb(collectionKey, ref) {
    var c = _raw(collectionKey);
    if (!c) return [];
    var crumbs = [{
      kind: 'collection',
      value: collectionKey,
      label: c.short || c.title,
      title: c.title,
      text: c.title
    }];
    if (!collectionInCorpus(collectionKey)) return crumbs;
    ensurePatched(collectionKey);

    var sk = _isMulti(c)
      ? _storageKey(c, _splitKey(c, ref).instrument ||
          _uniqueInstrumentFor(collectionKey, _splitKey(c, ref).number), _splitKey(c, ref).number)
      : String(ref);
    var art = CORPUS.books[collectionKey].articles[sk];
    if (!art) return crumbs;
    var m = art.meta || {};

    var levels = (c.levels || []).slice();
    if (_isMulti(c)) {
      var instId = _splitKey(c, sk).instrument || m[_instrumentField(c)];
      var inst = _findInstrument(c, instId);
      if (inst) {
        crumbs.push({
          kind: 'instrument', value: inst.id,
          label: inst.short || inst.title, title: inst.title,
          text: inst.short || inst.title
        });
        levels = (inst.levels || []).slice();
      }
    }

    levels.forEach(function (lv) {
      var v = m[lv.field];
      if (v) {
        crumbs.push({
          kind: lv.kind, field: lv.field, value: v,
          label: lv.label || '', title: m[lv.field + 'Title'] || '',
          text: v
        });
      }
    });

    var unit = _unitFor(c, _isMulti(c) ? (_splitKey(c, sk).instrument || m[_instrumentField(c)]) : null);
    crumbs.push({
      kind: 'provision', value: art.number, label: unit, title: '',
      text: unit + ' ' + art.number
    });
    return crumbs;
  }

  // Build breadcrumb crumbs from a structure-tree node.path (an array of
  // level values) — for UI breadcrumbs at mid-tree positions (no provision).
  function describePath(collectionKey, pathValues, instrumentId) {
    var c = _raw(collectionKey);
    if (!c) return [];
    var crumbs = [{ kind: 'collection', value: collectionKey, label: c.short || c.title, title: c.title, text: c.title }];
    var levels = (c.levels || []).slice();
    if (_isMulti(c) && instrumentId) {
      var inst = _findInstrument(c, instrumentId);
      if (inst) {
        crumbs.push({ kind: 'instrument', value: inst.id, label: inst.short || inst.title, title: inst.title, text: inst.short || inst.title });
        levels = (inst.levels || []).slice();
      }
    }
    (pathValues || []).forEach(function (v, i) {
      var lv = levels[i] || {};
      crumbs.push({
        kind: lv.kind || 'level', field: lv.field || null, value: v,
        label: lv.label || '', title: '',
        text: v == null ? (c.unsortedLabel || 'ไม่ได้จัดเข้าหมวด') : v
      });
    });
    return crumbs;
  }

  // Prev / next provision. Returns STORAGE KEYS (== number for single-
  // instrument collections). For multi-instrument collections adjacency
  // stays within the same instrument.
  function getAdjacent(collectionKey, ref) {
    var c = _raw(collectionKey);
    if (!c || !collectionInCorpus(collectionKey)) return { prev: null, next: null };
    ensurePatched(collectionKey);
    var artsMap = CORPUS.books[collectionKey].articles;
    var keys = Object.keys(artsMap);

    var sk = String(ref);
    if (_isMulti(c)) {
      var sp = _splitKey(c, ref);
      var targetInst = sp.instrument ||
        (artsMap[ref] && (artsMap[ref].meta || {})[_instrumentField(c)]) ||
        _uniqueInstrumentFor(collectionKey, sp.number);
      sk = _storageKey(c, targetInst, sp.number);
      keys = keys.filter(function (k) {
        return _splitKey(c, k).instrument === targetInst;
      });
    }

    keys.sort(function (a, b) { return compareNumbers(_numberPart(a), _numberPart(b)); });
    var idx = keys.indexOf(sk);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? keys[idx - 1] : null,
      next: idx < keys.length - 1 ? keys[idx + 1] : null
    };
  }

  // ----- Atlas ID <-> legacy ID -------------------------------------
  //
  //   Atlas ID (canonical, internal):
  //     single : atlas:<collection>/<number>
  //     multi  : atlas:<collection>/<instrument>/<number>
  //
  //   Legacy ID (frozen — every current link + GA4 + SEO uses this):
  //     single : <collection>_<number>            e.g. civil_1448 , civil_1447/2
  //     multi  : <collection>_<instrument>::<number>   e.g. aviation_act::12
  //     (collection keys never contain "_", so the first "_" is always the
  //      split point; "::" then separates instrument from number.)
  //
  //   Both forms resolve to the SAME viewer URL, which stays
  //   codex-article-viewer.html?id=<legacyId>  — never migrated.
  function makeAtlasId(collectionKey, instrumentId, number) {
    var c = _raw(collectionKey);
    if (_isMulti(c) && instrumentId) {
      return 'atlas:' + collectionKey + '/' + instrumentId + '/' + number;
    }
    return 'atlas:' + collectionKey + '/' + number;
  }

  // Accepts any of: atlas:<c>/<n> · atlas:<c>/<i>/<n> · <c>_<n> ·
  // <c>_<i>::<n> · a bare storage key when `collectionHint` is given.
  function resolveAtlasId(anyId, collectionHint) {
    if (!anyId) return null;
    var s = String(anyId).trim();
    var collection = null, instrument = null, number = null;

    if (s.indexOf('atlas:') === 0) {
      var rest = s.slice(6);
      var slash = rest.indexOf('/');
      if (slash === -1) return null;
      collection = rest.slice(0, slash);
      var tail = rest.slice(slash + 1);
      var cCfg = _raw(collection);
      if (_isMulti(cCfg)) {
        // multi: first segment MAY be an instrument id. Only treat it as one
        // if it actually matches a declared instrument — otherwise the whole
        // tail is the number (which itself can contain "/").
        var seg = tail.indexOf('/') === -1 ? tail : tail.slice(0, tail.indexOf('/'));
        if (_findInstrument(cCfg, seg)) {
          instrument = seg;
          number = tail.slice(seg.length + 1);
        } else {
          number = tail;
        }
      } else {
        number = tail; // single: everything after collection is the number
      }
    } else if (s.indexOf('_') !== -1) {
      collection = s.slice(0, s.indexOf('_'));
      var afterUnderscore = s.slice(s.indexOf('_') + 1);
      var sep = afterUnderscore.indexOf(KEY_SEP);
      if (sep !== -1) {
        instrument = afterUnderscore.slice(0, sep);
        number = afterUnderscore.slice(sep + KEY_SEP.length);
      } else {
        number = afterUnderscore;
      }
    } else if (collectionHint) {
      collection = collectionHint;
      var sp = _splitKey(_raw(collectionHint), s);
      instrument = sp.instrument;
      number = sp.number;
    } else {
      return null;
    }

    var c = _raw(collection);

    // resolve instrument when omitted but corpus can tell us unambiguously
    if (_isMulti(c) && !instrument && collectionInCorpus(collection)) {
      instrument = _uniqueInstrumentFor(collection, number);
    }

    var storageKey = _storageKey(c, instrument, number);
    var out = {
      collection: collection,
      instrument: instrument,
      number: number,
      storageKey: storageKey,
      known: !!c,
      exists: false,
      legacyId: _legacyId(collection, storageKey),
      atlasId: makeAtlasId(collection, instrument, number),
      viewerUrl: _viewerUrl(collection, storageKey)
    };

    if (c && collectionInCorpus(collection)) {
      ensurePatched(collection);
      var art = CORPUS.books[collection].articles[storageKey];
      out.exists = !!art;
      if (art && _isMulti(c) && !out.instrument) {
        out.instrument = (art.meta || {})[_instrumentField(c)] || null;
        out.atlasId = makeAtlasId(collection, out.instrument, number);
        out.storageKey = _storageKey(c, out.instrument, number);
        out.legacyId = _legacyId(collection, out.storageKey);
        out.viewerUrl = _viewerUrl(collection, out.storageKey);
      }
    }
    return out;
  }

  // --------------------------------------------------------------- expose
  global.AtlasCore = {
    version: '2.1',

    // lifecycle
    loadRegistry: loadRegistry,
    setRegistry: setRegistry,
    attachCorpus: attachCorpus,
    isReady: isReady,
    hasCorpus: hasCorpus,
    getRegistry: getRegistry,
    collectionInCorpus: collectionInCorpus,

    // navigation spine
    listSubjectAreas: listSubjectAreas,
    listCollections: listCollections,
    getCollection: getCollection,
    getInstrument: getInstrument,

    // structure
    getStructureTree: getStructureTree,
    resolveProvision: resolveProvision,
    getProvisionBrief: getProvisionBrief,
    getBreadcrumb: getBreadcrumb,
    describePath: describePath,
    getAdjacent: getAdjacent,

    // identity
    resolveAtlasId: resolveAtlasId,
    resolveRef: resolveAtlasId,   // alias
    makeAtlasId: makeAtlasId,

    // shared primitives (dedupe from codex-search / codex-article-viewer)
    compareNumbers: compareNumbers,
    sortKey: sortKey,
    thaiToArabic: thaiToArabic,
    getStructuralFieldOrder: getStructuralFieldOrder,

    // low-level
    patchMeta: patchMeta,
    ensurePatched: ensurePatched
  };
})(typeof window !== 'undefined' ? window : this);
