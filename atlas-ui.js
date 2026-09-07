/* ============================================================================
 * atlas-ui.js  —  Thai Legal Atlas · navigation UI structure (Phase 2)
 * ----------------------------------------------------------------------------
 * This is the UI *structure* Phase 3 will style. It is deliberately
 * un-styled: every element gets a semantic `atlas-*` class and NO inline
 * visual CSS (only structural `hidden` toggles). Phase 3 supplies the
 * stylesheet; this file should not need to change for a restyle.
 *
 * Everything is data-driven from collections-registry.json via AtlasCore —
 * there is not one hardcoded collection name, level name, or Thai label here.
 *
 * Route scheme (hash-based, so it works on GitHub Pages with no server):
 *   #/                              subject areas
 *   #/c/<collection>                collection — native hierarchy
 *                                   (multi-instrument: instrument picker)
 *   #/c/<collection>/i/<instrument> one instrument's native hierarchy
 *
 * Provisions always link OUT to the UNCHANGED viewer:
 *   codex-article-viewer.html?id=<legacyId>
 *
 * Usage:
 *   AtlasUI.mount(document.getElementById('atlas-root'));
 * (AtlasCore must already have loadRegistry()+attachCorpus() resolved.)
 * ==========================================================================*/
(function (global) {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  // ---- return context (Phase 4A) -------------------------------------
  // Remember which structural branches are open so that returning from the
  // article viewer lands on the same spot instead of a collapsed tree.
  // Best-effort: sessionStorage may be absent (test shim) or blocked.
  var RETURN_KEY = 'atlas:return';
  var SEP = '¦';           // node-key path separator (not a legal char)
  var openKeys = {};            // nodeKey -> 1 for every currently-open branch
  var suspendPersist = false;   // true while (re)building or restoring a view

  function nodeKey(instrumentId, path) {
    return (instrumentId || '') + SEP + (path || []).join(SEP);
  }
  function persistReturn() {
    if (suspendPersist) return;
    try {
      sessionStorage.setItem(RETURN_KEY, JSON.stringify({
        hash: location.hash || '#/',
        keys: Object.keys(openKeys)
      }));
    } catch (e) { /* no sessionStorage / blocked / quota — navigation still works */ }
  }
  function readReturn() {
    try { return JSON.parse(sessionStorage.getItem(RETURN_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function collectOpenables(elm, out) {
    out = out || [];
    if (elm && typeof elm._atlasSetOpen === 'function') out.push(elm);
    var kids = elm && elm.children;
    if (kids) for (var i = 0; i < kids.length; i++) collectOpenables(kids[i], out);
    return out;
  }
  // Re-open the branches recorded before the user left for the viewer.
  // Opening a node builds its children lazily, so sweep until a pass opens
  // nothing (bounded — the deepest native model is 5 levels).
  //
  // Two context shapes are accepted:
  //   { hash, keys:[<nodeKey>, ...] }              Phase 4A — restore an open set
  //   { hash, instrument, path:[<value>, ...] }    Phase 4B — open one ancestor
  //                                                chain and focus its last node
  // `injected` (tests only) supplies the context directly; production omits it
  // and reads sessionStorage.
  function restoreReturn(root, injected) {
    var saved = injected || readReturn();
    if (!saved ||
        (!(saved.keys && saved.keys.length) &&
         !(saved.path && saved.path.length))) return;
    if ((saved.hash || '#/') !== (location.hash || '#/')) return;

    var want = {};
    var focusKey = null;
    if (saved.path && saved.path.length) {
      // Phase 4B — semantic structural path. atlas-ui owns the value -> nodeKey
      // conversion; the transported data is just the ordered value array.
      var inst = saved.instrument || null;
      for (var i = 1; i <= saved.path.length; i++) {
        want[nodeKey(inst, saved.path.slice(0, i))] = 1;
      }
      focusKey = nodeKey(inst, saved.path);
    } else {
      saved.keys.forEach(function (k) { want[k] = 1; });
    }

    suspendPersist = true;
    for (var pass = 0; pass < 8; pass++) {
      var opened = 0;
      collectOpenables(root).forEach(function (li) {
        if (want[li._atlasKey] &&
            String(li.className || '').indexOf('atlas-node-open') === -1) {
          li._atlasSetOpen(true); opened++;
        }
      });
      if (!opened) break;
    }
    suspendPersist = false;
    persistReturn();   // a consumed path becomes an ordinary {hash, keys} snapshot

    try {
      var target = null;
      if (focusKey) {
        // exact node for a path restore — a stale/invalid path simply finds
        // nothing here; we never force focus onto an unrelated node.
        collectOpenables(root).forEach(function (li) {
          if (!target && li._atlasKey === focusKey) target = li;
        });
      } else {
        // Phase 4A fallback — scroll the deepest branch the user had open.
        var openNow = collectOpenables(root).filter(function (li) {
          return String(li.className || '').indexOf('atlas-node-open') !== -1;
        });
        target = openNow[openNow.length - 1] || null;
      }
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'center' });
      if (target && target.classList && focusKey) {
        target.classList.add('atlas-node-focus');
        setTimeout(function () {
          try { target.classList.remove('atlas-node-focus'); } catch (e) {}
        }, 1500);
      }
    } catch (e) { /* shim — no scrollIntoView / classList / setTimeout */ }
  }

  // ---- route parsing ---------------------------------------------------
  function parseRoute() {
    var h = (location.hash || '').replace(/^#/, '');
    var mi = h.match(/^\/c\/([A-Za-z0-9_-]+)\/i\/([A-Za-z0-9_.:-]+)$/);
    if (mi) return { view: 'instrument', collection: mi[1], instrument: mi[2] };
    var mc = h.match(/^\/c\/([A-Za-z0-9_-]+)$/);
    if (mc) return { view: 'collection', collection: mc[1] };
    return { view: 'home' };
  }
  function hrefHome() { return '#/'; }
  function hrefCollection(k) { return '#/c/' + k; }
  function hrefInstrument(k, i) { return '#/c/' + k + '/i/' + i; }

  // ---- breadcrumb ----------------------------------------------------
  function breadcrumbBar(crumbs) {
    var bar = el('nav', 'atlas-crumbs');
    crumbs.forEach(function (c, i) {
      if (i) bar.appendChild(el('span', 'atlas-crumb-sep', '›'));
      if (c.href) {
        var a = el('a', 'atlas-crumb', c.text);
        a.href = c.href;
        bar.appendChild(a);
      } else {
        bar.appendChild(el('span', 'atlas-crumb atlas-crumb-current', c.text));
      }
    });
    return bar;
  }

  // ---- home : subject areas -> collections --------------------------
  function renderHome(root) {
    var wrap = el('div', 'atlas-home');
    wrap.appendChild(breadcrumbBar([{ text: 'Atlas' }]));

    AtlasCore.listSubjectAreas({ includePlanned: true }).forEach(function (area) {
      var sec = el('section', 'atlas-area' + (area.planned ? ' atlas-area-planned' : ''));
      sec.dataset.area = area.key;
      var h = el('h2', 'atlas-area-title', area.title);
      if (area.planned) h.appendChild(el('span', 'atlas-tag', 'เร็ว ๆ นี้'));
      sec.appendChild(h);

      var grid = el('div', 'atlas-collection-grid');
      area.collections.forEach(function (c) {
        grid.appendChild(collectionCard(c));
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });

    mountInto(root, wrap);
  }

  function collectionCard(c) {
    var planned = c.planned;
    var node = el(planned ? 'div' : 'a',
      'atlas-collection-card' + (planned ? ' atlas-collection-card-planned' : ''));
    if (!planned) node.href = hrefCollection(c.key);
    node.dataset.collection = c.key;

    node.appendChild(el('span', 'atlas-collection-icon', c.icon));
    var body = el('span', 'atlas-collection-body');
    var name = el('span', 'atlas-collection-name', c.short);
    if (planned) name.appendChild(el('span', 'atlas-tag', 'เร็ว ๆ นี้'));
    body.appendChild(name);
    body.appendChild(el('span', 'atlas-collection-full', c.title));

    var meta = el('span', 'atlas-collection-meta');
    var instN = c.instrumentCount || (c.instruments ? c.instruments.length : 0);
    if (planned) {
      meta.textContent = instN + ' ฉบับกฎหมาย';
    } else if (c.instrumentModel === 'multi') {
      meta.textContent = instN + ' ฉบับกฎหมาย · ' +
        c.articleCount.toLocaleString('th-TH') + ' บทบัญญัติ';
    } else {
      meta.textContent = c.articleCount.toLocaleString('th-TH') + ' ' + c.provisionUnit +
        ' · ' + (c.levelCount ? c.levelCount + ' ชั้นโครงสร้าง' : 'ไม่มีชั้นย่อย');
    }
    body.appendChild(meta);
    node.appendChild(body);
    return node;
  }

  // ---- collection --------------------------------------------------
  function renderCollection(root, key) {
    var c = AtlasCore.getCollection(key);
    if (!c) { renderHome(root); return; }

    var wrap = el('div', 'atlas-collection');
    wrap.appendChild(breadcrumbBar([
      { text: 'Atlas', href: hrefHome() },
      { text: c.short }
    ]));
    wrap.appendChild(collectionHeader(c));

    if (c.instrumentModel === 'multi') {
      // instrument picker — the Instrument level of the ladder
      var list = el('div', 'atlas-instrument-list');
      var tree = AtlasCore.getStructureTree(key); // {nodes:[instrument nodes]} or planned:[]
      var present = {};
      (tree.nodes || []).forEach(function (n) { present[n.value] = n.count; });
      (c.instruments || []).forEach(function (inst) {
        list.appendChild(instrumentCard(key, inst, present[inst.id] || 0, tree.planned));
      });
      if (tree.planned) {
        list.appendChild(el('p', 'atlas-empty atlas-empty-planned',
          'ยังไม่เปิดใช้ — แสดงเฉพาะโครงสร้างของแต่ละฉบับ ยังไม่มีตัวบท'));
      }
      wrap.appendChild(list);
    } else {
      wrap.appendChild(structureTreeView(key, AtlasCore.getStructureTree(key), null));
    }

    mountInto(root, wrap);
  }

  function collectionHeader(c) {
    var h = el('header', 'atlas-collection-header');
    h.appendChild(el('h1', 'atlas-collection-h1', c.icon + ' ' + c.title));

    var levelPath = el('div', 'atlas-level-path');
    levelPath.appendChild(el('span', 'atlas-level-path-label', 'โครงสร้างดั้งเดิม:'));
    if (c.instrumentModel === 'multi') {
      levelPath.appendChild(el('span', 'atlas-level-chip', 'ฉบับกฎหมาย'));
      levelPath.appendChild(el('span', 'atlas-level-arrow', '›'));
      levelPath.appendChild(el('span', 'atlas-level-chip', '(แล้วแต่ฉบับ)'));
    } else {
      (c.levels || []).forEach(function (lv, i) {
        if (i) levelPath.appendChild(el('span', 'atlas-level-arrow', '›'));
        levelPath.appendChild(el('span', 'atlas-level-chip', lv.label));
      });
      if ((c.levels || []).length) levelPath.appendChild(el('span', 'atlas-level-arrow', '›'));
      levelPath.appendChild(el('span', 'atlas-level-chip atlas-level-chip-unit', c.provisionUnit));
    }
    h.appendChild(levelPath);

    var facts = el('div', 'atlas-collection-facts');
    facts.appendChild(fact('ประเภท', instrumentTypeLabel(c.instrumentType) ||
      (c.instrumentModel === 'multi' ? 'หลายฉบับ' : '—')));
    if (c.instrumentModel !== 'multi') {
      facts.appendChild(fact('จำนวน', c.articleCount.toLocaleString('th-TH') + ' ' + c.provisionUnit));
    }
    if (c.enacted) facts.appendChild(fact('ปี', String(c.enacted)));
    h.appendChild(facts);

    // User-facing structural description. Prefer a hand-written `blurb` from
    // the registry; otherwise synthesise one from the declared levels.
    // Developer `notes` are NOT shown here — they stay in the registry and in
    // AtlasCore.getCollection() for tooling.
    var blurb = c.blurb || structuralBlurb(c);
    if (blurb) h.appendChild(el('p', 'atlas-structure-note', blurb));

    if (c.source) {
      var src = el('p', 'atlas-source');
      src.textContent = 'ที่มา: ' + c.source.name +
        (c.source.official ? ' · ฉบับทางการ' : ' · ฉบับอ้างอิง (ไม่ใช่ราชกิจจาฯ)');
      h.appendChild(src);
    }
    return h;
  }

  function structuralBlurb(c) {
    if (c.instrumentModel === 'multi') {
      return 'ประกอบด้วยกฎหมายหลายฉบับ แต่ละฉบับมีลำดับชั้นและหน่วยบทบัญญัติของตนเอง';
    }
    var labels = (c.levels || []).map(function (lv) { return lv.label; });
    if (!labels.length) {
      return 'จัดเรียงเป็น' + c.provisionUnit + 'โดยตรง ไม่มีการแบ่งโครงสร้างภายใน';
    }
    return 'จัดโครงสร้างเป็น ' + labels.join(' › ') + ' › ' + c.provisionUnit;
  }
  function fact(k, v) {
    var f = el('span', 'atlas-fact');
    f.appendChild(el('span', 'atlas-fact-k', k));
    f.appendChild(el('span', 'atlas-fact-v', v));
    return f;
  }
  function instrumentTypeLabel(t) {
    var reg = AtlasCore.getRegistry();
    return (reg && reg.instrumentTypes && reg.instrumentTypes[t]) || t || '';
  }

  function instrumentCard(collectionKey, inst, count, planned) {
    var node = el(count || !planned ? 'a' : 'div',
      'atlas-instrument-card' + (planned && !count ? ' atlas-instrument-card-empty' : ''));
    if (count || !planned) node.href = hrefInstrument(collectionKey, inst.id);
    node.dataset.instrument = inst.id;
    node.appendChild(el('span', 'atlas-instrument-type', instrumentTypeLabel(inst.type)));
    node.appendChild(el('span', 'atlas-instrument-title', inst.title));
    var meta = el('span', 'atlas-instrument-meta');
    meta.textContent = 'หน่วยบทบัญญัติ: ' + inst.provisionUnit +
      (inst.authorityRank != null ? ' · ลำดับศักดิ์ ' + inst.authorityRank : '') +
      (count ? ' · ' + count + ' ' + inst.provisionUnit : ' · (ยังไม่มีเนื้อหา)');
    node.appendChild(meta);
    return node;
  }

  // ---- instrument (one instrument of a multi collection) -----------
  function renderInstrument(root, key, instrumentId) {
    var c = AtlasCore.getCollection(key);
    var inst = AtlasCore.getInstrument(key, instrumentId);
    if (!c || !inst) { renderCollection(root, key); return; }

    var wrap = el('div', 'atlas-instrument');
    wrap.appendChild(breadcrumbBar([
      { text: 'Atlas', href: hrefHome() },
      { text: c.short, href: hrefCollection(key) },
      { text: inst.short }
    ]));
    var h = el('header', 'atlas-instrument-header');
    h.appendChild(el('h1', 'atlas-collection-h1', inst.title));
    var lp = el('div', 'atlas-level-path');
    (inst.levels || []).forEach(function (lv, i) {
      if (i) lp.appendChild(el('span', 'atlas-level-arrow', '›'));
      lp.appendChild(el('span', 'atlas-level-chip', lv.label));
    });
    if ((inst.levels || []).length) lp.appendChild(el('span', 'atlas-level-arrow', '›'));
    lp.appendChild(el('span', 'atlas-level-chip atlas-level-chip-unit', inst.provisionUnit));
    h.appendChild(lp);
    wrap.appendChild(h);

    var full = AtlasCore.getStructureTree(key);
    var instNode = (full.nodes || []).filter(function (n) { return n.value === instrumentId; })[0];
    if (!instNode || !instNode.count) {
      var cls = (c.planned || full.planned) ? 'atlas-empty atlas-empty-planned' : 'atlas-empty';
      wrap.appendChild(el('p', cls, 'ยังไม่มีตัวบทของฉบับนี้ในคลังข้อมูล'));
    } else {
      wrap.appendChild(structureTreeView(key,
        { collection: key, instrumentModel: 'multi',
          nodes: instNode.children, articles: instNode.children ? null : instNode.articles },
        instrumentId));
    }
    mountInto(root, wrap);
  }

  // ---- structure tree (shared by single collections & instruments) --
  function structureTreeView(key, tree, instrumentId) {
    var box = el('div', 'atlas-structure');
    if (tree.nodes === null || (Array.isArray(tree.nodes) && !tree.nodes.length && tree.articles)) {
      // flat — provisions directly
      box.appendChild(provisionList(key, tree.articles || [], instrumentId));
      return box;
    }
    if (!tree.nodes || !tree.nodes.length) {
      box.appendChild(el('p', 'atlas-empty', 'ยังไม่มีเนื้อหาสำหรับส่วนนี้'));
      return box;
    }
    box.appendChild(treeList(key, tree.nodes, 0, instrumentId));
    return box;
  }

  function treeList(key, nodes, depth, instrumentId) {
    var ul = el('ul', 'atlas-tree atlas-tree-depth-' + depth);
    nodes.forEach(function (n) { ul.appendChild(treeNode(key, n, depth, instrumentId)); });
    return ul;
  }

  // LAZY: a node renders only its own row up front. Its body (child rows or
  // provision pills) is built on first expand — collapsed branches cost one
  // <li>. Top-level nodes are opened by default, which materialises exactly
  // ONE more level of rows, never the whole subtree.
  function treeNode(key, node, depth, instrumentId) {
    var li = el('li', 'atlas-node atlas-node-' + (node.kind || 'level'));
    li._atlasKey = nodeKey(instrumentId, node.path);
    try { li.dataset.atlasKey = li._atlasKey; } catch (e) { /* shim */ }
    var hasKids = !!(node.children && node.children.length);
    var hasProvs = !!(node.articles && node.articles.length);
    var expandable = hasKids || hasProvs;
    // Auto-open only top-level nodes that have STRUCTURAL sub-levels — this
    // shows one level of the ladder (cheap: rows only). Leaf top-nodes stay
    // collapsed so provision pills are never dumped without a click.
    var openByDefault = depth === 0 && hasKids;

    var row = el('div', 'atlas-node-row');
    var toggle = el('button', 'atlas-node-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', String(openByDefault && expandable));
    toggle.textContent = expandable ? (openByDefault ? '▾' : '▸') : '·';

    var label = el('span', 'atlas-node-label');
    // node.value already carries the Thai structural word ("บรรพ 1",
    // "ส่วนที่ 2"). Only emit the registry level word as a separate lead-in
    // when the value does NOT already begin with it (defensive — in the
    // current data it always does), so we never render "บรรพ บรรพ 1".
    if (node.levelLabel && node.value && node.value.indexOf(node.levelLabel) !== 0) {
      label.appendChild(el('span', 'atlas-node-levelword', node.levelLabel));
    }
    label.appendChild(el('span', 'atlas-node-value', node.value || node.label));
    if (node.title) label.appendChild(el('span', 'atlas-node-title', '— ' + node.title));
    label.appendChild(el('span', 'atlas-node-count', '(' + node.count + ')'));

    row.appendChild(toggle);
    row.appendChild(label);
    li.appendChild(row);

    var body = el('div', 'atlas-node-body');
    body.hidden = true;
    li.appendChild(body);

    var built = false;
    function buildBody() {
      if (built) return;
      built = true;
      if (hasKids) body.appendChild(treeList(key, node.children, depth + 1, instrumentId));
      else if (hasProvs) body.appendChild(provisionList(key, node.articles, instrumentId));
    }
    function setOpen(open) {
      if (!expandable) return;
      if (open) buildBody();
      body.hidden = !open;
      li.className = 'atlas-node atlas-node-' + (node.kind || 'level') +
        (open ? ' atlas-node-open' : '');
      toggle.textContent = open ? '▾' : '▸';
      toggle.setAttribute('aria-expanded', String(open));
      if (open) openKeys[li._atlasKey] = 1; else delete openKeys[li._atlasKey];
      persistReturn();
    }
    function flip() { setOpen(body.hidden); }
    toggle.addEventListener('click', flip);
    label.addEventListener('click', flip);

    // test/programmatic hook (see atlas-ui-smoke.js) + future "expand all"
    li._atlasSetOpen = setOpen;

    if (openByDefault && expandable) setOpen(true);
    return li;
  }

  // Provision pills. Uses AtlasCore.getProvisionBrief (lean: no breadcrumb,
  // no article object) — only ever runs for a leaf branch the user opened.
  function provisionList(key, storageKeys, instrumentId) {
    var wrap = el('div', 'atlas-provision-list');
    storageKeys.forEach(function (sk) {
      var b = AtlasCore.getProvisionBrief(key, sk, instrumentId);
      var a = el('a', 'atlas-provision' + (b && b.cancelled ? ' atlas-provision-cancelled' : ''));
      // Canonical viewer id is UNCHANGED; `x=atlas` is navigation metadata only
      // — it tells the viewer this visit came from the Atlas so it can offer a
      // "back to <collection>" link and keep prev/next inside the Atlas.
      var url = b ? b.viewerUrl
        : ('codex-article-viewer.html?id=' + encodeURIComponent(key + '_' + sk));
      a.href = url + (url.indexOf('?') === -1 ? '?' : '&') + 'x=atlas';
      a.textContent = (b ? b.unit : 'มาตรา') + ' ' + (b ? b.number : sk);
      if (b && b.cancelled) a.title = 'ยกเลิกแล้ว';
      wrap.appendChild(a);
    });
    return wrap;
  }

  // ---- mount / route -------------------------------------------------
  function mountInto(root, node) {
    clear(root);
    root.appendChild(node);
    window.scrollTo(0, 0);
  }

  function render(root) {
    var r = parseRoute();
    openKeys = {};
    suspendPersist = true;         // don't thrash sessionStorage while building
    if (r.view === 'instrument') renderInstrument(root, r.collection, r.instrument);
    else if (r.view === 'collection') renderCollection(root, r.collection);
    else renderHome(root);
    suspendPersist = false;
    restoreReturn(root);           // re-open whatever branches we left open
    persistReturn();               // record the resulting state for this route
  }

  function mount(root, opts) {
    opts = opts || {};
    render(root);
    window.addEventListener('hashchange', function () { render(root); });
    return {
      refresh: function () { render(root); },
      route: parseRoute
    };
  }

  // Walk a rendered subtree and open every expandable node (materialising
  // lazily-built bodies). Used by atlas-ui-smoke.js; handy for a future
  // "expand all" affordance. `maxNodes` guards against opening a huge tree.
  function expandAll(rootEl, maxNodes) {
    maxNodes = maxNodes || 5000;
    var opened = 0;
    function walk(node) {
      if (opened >= maxNodes) return;
      var kids = node.children || [];
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i];
        if (c && typeof c._atlasSetOpen === 'function') { c._atlasSetOpen(true); opened++; }
        walk(c);
      }
    }
    walk(rootEl);
    return opened;
  }

  global.AtlasUI = {
    version: '2.4',
    mount: mount,
    parseRoute: parseRoute,
    // exposed for Phase 3 / other pages / tests that want just a piece
    _internal: {
      collectionCard: collectionCard,
      structureTreeView: structureTreeView,
      breadcrumbBar: breadcrumbBar,
      expandAll: expandAll,
      restoreReturn: restoreReturn,
      persistReturn: persistReturn,
      nodeKey: nodeKey
    }
  };
})(typeof window !== 'undefined' ? window : this);
