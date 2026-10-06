/* ============================================================================
 * engine/shell.js  --  page chrome shared by every world
 *   topbar (brand, search, world switcher, theme toggle) + in-world tab nav +
 *   footer.  A world calls Engine.shell.mount({ world, nav, current, search }).
 *     world   id from worlds.json
 *     nav     [{ id, label, icon, href }]  href relative to the page
 *     current id of the active nav item
 *     search  { placeholder, provider(query) -> Promise<[{title, desc, tag, icon, href}]> }
 * ========================================================================== */
(function (global) {
  'use strict';
  var Engine = global.Engine, el = Engine.el;

  function buildTopbar(cfg, world) {
    var bar = el('div', 'topbar');
    var brand = el('a', 'topbar-brand', null, { href: Engine.url(world.home) });
    brand.appendChild(Engine.icons.node(world.icon, 'topbar-logo'));
    var bt = el('span', 'topbar-brand-text', world.brand.th);
    bt.appendChild(el('span', 'topbar-brand-sub', world.brand.sub));
    brand.appendChild(bt);
    bar.appendChild(brand);

    if (cfg.search) {
      var sw = el('div', 'topbar-search');
      sw.appendChild(Engine.icons.node('search', 'topbar-search-icon'));
      var input = el('input', null, null, { type: 'text', placeholder: cfg.search.placeholder || '', autocomplete: 'off', 'aria-label': 'ค้นหา' });
      var out = el('div', 'search-results');
      sw.appendChild(input); sw.appendChild(out); bar.appendChild(sw);
      wireSearch(input, out, cfg.search.provider);
    }

    var right = el('span', 'topbar-right');
    var ws = el('div', 'world-switch', null, { role: 'group', 'aria-label': 'เลือกโลกความรู้' });
    Engine.worlds.load().then(function (all) {
      all.worlds.forEach(function (w) {
        var a = el('a', w.id === world.id ? 'is-current' : '', w.name.th, { href: Engine.url(w.home) });
        ws.appendChild(a);
      });
    });
    right.appendChild(ws);
    right.appendChild(el('span', 'topbar-divider'));
    var tg = el('div', 'theme-toggle', null, { role: 'group', 'aria-label': 'เลือกธีม' });
    ['light', 'dark'].forEach(function (t) {
      var b = el('button', null, null, { type: 'button', 'data-theme-btn': t, title: t === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง' });
      b.appendChild(Engine.icons.node(t));
      b.addEventListener('click', function () { Engine.theme.set(t); });
      tg.appendChild(b);
    });
    right.appendChild(tg);
    bar.appendChild(right);
    return bar;
  }

  function wireSearch(input, out, provider) {
    var timer = null, seq = 0;
    function show(items) {
      out.textContent = '';
      if (!items.length) out.appendChild(el('div', 'search-empty', 'ไม่พบรายการที่ตรงกัน'));
      items.slice(0, 20).forEach(function (r) {
        var a = el('a', 'search-result-item', null, { href: Engine.safeUrl(r.href) });
        a.appendChild(Engine.icons.node(r.icon || 'document', 'sr-icon'));
        var t = el('span', 'sr-text');
        t.appendChild(el('span', 'sr-name', r.title));
        if (r.desc) t.appendChild(el('span', 'sr-desc', r.desc));
        a.appendChild(t);
        if (r.tag) a.appendChild(el('span', 'sr-tag', r.tag));
        out.appendChild(a);
      });
      out.classList.add('active');
    }
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim(), my = ++seq;
      if (!q) { out.classList.remove('active'); return; }
      timer = setTimeout(function () {
        Promise.resolve(provider(q)).then(function (items) { if (my === seq) show(items || []); })
          .catch(function () { if (my === seq) { out.textContent = ''; out.appendChild(el('div', 'search-empty', 'ค้นหาไม่สำเร็จ')); out.classList.add('active'); } });
      }, 120);
    });
    document.addEventListener('click', function (e) { if (!out.parentNode.contains(e.target)) out.classList.remove('active'); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { out.classList.remove('active'); input.blur(); } });
  }

  function buildNav(items, current) {
    var nav = el('nav', 'tab-buttons', null, { 'aria-label': 'เมนู' });
    items.forEach(function (it) {
      var a = el('a', 'tab-btn' + (it.id === current ? ' active' : ''), null, { href: it.href });
      if (it.id === current) a.setAttribute('aria-current', 'page');
      if (it.icon) a.appendChild(Engine.icons.node(it.icon));
      a.appendChild(document.createTextNode(it.label));
      nav.appendChild(a);
    });
    return nav;
  }

  Engine.shell = {
    mount: function (cfg) {
      return Engine.worlds.load().then(function (all) {
        var world = all.worlds.filter(function (w) { return w.id === cfg.world; })[0];
        if (!world) throw new Error('unknown world ' + cfg.world);
        document.body.insertBefore(buildTopbar(cfg, world), document.body.firstChild);
        var slot = document.getElementById('engine-nav');
        if (slot && cfg.nav) slot.appendChild(buildNav(cfg.nav, cfg.current));
        var foot = document.getElementById('engine-footer');
        if (foot) { foot.className = 'footer'; foot.textContent = cfg.footer || ''; }
        Engine.theme.set(Engine.theme.get());     /* sync toggle state */
        Engine.icons.hydrate(document);
        return world;
      });
    }
  };
})(window);
