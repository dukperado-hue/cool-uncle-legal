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
      if (area.planned) h.appendChild(el('span', 'atlas-tag', 'planned'));
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
      meta.textContent = 'multi-instrument · ' + instN + ' ฉบับ (สถาปัตยกรรม)';
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
        list.appendChild(el('p', 'atlas-empty',
          'ยังไม่มีเนื้อหา — โครงสร้างฉบับกฎหมายด้านบนมาจาก registry ล้วน ๆ (Phase 2 อ่านได้ Phase หน้าค่อยเติมตัวบท)'));
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

    if (c.source) {
      var src = el('p', 'atlas-source');
      src.textContent = 'ที่มา: ' + c.source.name +
        (c.source.official ? ' · ฉบับทางการ' : ' · ฉบับอ้างอิง (ไม่ใช่ราชกิจจาฯ)');
      h.appendChild(src);
    }
    if (c.notes) h.appendChild(el('p', 'atlas-structure-note', 'หมายเหตุโครงสร้าง: ' + c.notes));
    return h;
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
      wrap.appendChild(el('p', 'atlas-empty', 'ยังไม่มีตัวบทของฉบับนี้ในคลังข้อมูล'));
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
      box.appendChild(provisionList(key, tree.articles || []));
      return box;
    }
    if (!tree.nodes || !tree.nodes.length) {
      box.appendChild(el('p', 'atlas-empty', 'ยังไม่มีเนื้อหาสำหรับส่วนนี้'));
      return box;
    }
    box.appendChild(treeList(key, tree.nodes, 0));
    return box;
  }

  function treeList(key, nodes, depth) {
    var ul = el('ul', 'atlas-tree atlas-tree-depth-' + depth);
    nodes.forEach(function (n) { ul.appendChild(treeNode(key, n, depth)); });
    return ul;
  }

  function treeNode(key, node, depth) {
    var li = el('li', 'atlas-node atlas-node-' + (node.kind || 'level'));
    var hasKids = !!(node.children && node.children.length);
    var hasProvs = !!(node.articles && node.articles.length);
    var openByDefault = depth === 0 && (!hasKids || node.children.length <= 14);

    var row = el('div', 'atlas-node-row');
    var toggle = el('button', 'atlas-node-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', String(openByDefault));
    toggle.textContent = (hasKids || hasProvs) ? (openByDefault ? '▾' : '▸') : '·';

    var label = el('span', 'atlas-node-label');
    if (node.levelLabel) label.appendChild(el('span', 'atlas-node-levelword', node.levelLabel));
    label.appendChild(el('span', 'atlas-node-value', node.value || node.label));
    if (node.title) label.appendChild(el('span', 'atlas-node-title', '— ' + node.title));
    label.appendChild(el('span', 'atlas-node-count', '(' + node.count + ')'));

    row.appendChild(toggle);
    row.appendChild(label);
    li.appendChild(row);

    var body = el('div', 'atlas-node-body');
    if (!openByDefault) body.hidden = true;
    if (hasKids) body.appendChild(treeList(key, node.children, depth + 1));
    else if (hasProvs) body.appendChild(provisionList(key, node.articles));
    li.appendChild(body);

    function flip() {
      if (!hasKids && !hasProvs) return;
      body.hidden = !body.hidden;
      toggle.textContent = body.hidden ? '▸' : '▾';
      toggle.setAttribute('aria-expanded', String(!body.hidden));
    }
    toggle.addEventListener('click', flip);
    label.addEventListener('click', flip);
    return li;
  }

  function provisionList(key, storageKeys) {
    var wrap = el('div', 'atlas-provision-list');
    storageKeys.forEach(function (sk) {
      var p = AtlasCore.resolveProvision(key, sk);
      var a = el('a', 'atlas-provision' + (p && p.cancelled ? ' atlas-provision-cancelled' : ''));
      a.href = p ? p.viewerUrl
        : ('codex-article-viewer.html?id=' + encodeURIComponent(key + '_' + sk));
      a.textContent = (p ? p.unit : 'มาตรา') + ' ' + (p ? p.number : sk);
      if (p) a.dataset.atlasId = p.atlasId;
      if (p && p.cancelled) a.title = 'ยกเลิกแล้ว';
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
    if (r.view === 'instrument') renderInstrument(root, r.collection, r.instrument);
    else if (r.view === 'collection') renderCollection(root, r.collection);
    else renderHome(root);
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

  global.AtlasUI = {
    version: '2.0',
    mount: mount,
    parseRoute: parseRoute,
    // exposed for Phase 3 / other pages that want just a piece
    _internal: {
      collectionCard: collectionCard,
      structureTreeView: structureTreeView,
      breadcrumbBar: breadcrumbBar
    }
  };
})(typeof window !== 'undefined' ? window : this);
