/* ============================================================================
 * engine/core.js  --  shared ENGINE core for every Cool Uncle knowledge world
 * ----------------------------------------------------------------------------
 *   Engine.base        site root URL (derived from this script's own URL)
 *   Engine.icons       icon registry: names -> glyphs (the site's existing icon
 *                      mechanism is glyph text in <span class="icon">; this keeps it)
 *   Engine.theme       light/dark preference ('codex-theme', same key as index.html)
 *   Engine.data        fetchJSON with in-memory cache + versioning
 *   Engine.worlds      worlds.json + URN -> link resolution (cross-world references)
 *   Engine.el / esc    tiny DOM helpers (all text goes through textContent)
 *
 * It knows nothing about law or aviation.  World-specific behaviour is added by
 * the world through registration hooks (icons, reader blocks, search providers).
 * ========================================================================== */
(function (global) {
  'use strict';
  var Engine = global.Engine = global.Engine || {};

  /* ---- site root (engine/ lives directly under it) ------------------------ */
  var me = document.currentScript && document.currentScript.src;
  Engine.base = me ? me.replace(/engine\/[^\/?#]*(\?.*)?$/, '') : location.origin + '/';
  Engine.url = function (rel) { return new URL(rel, Engine.base).href; };

  /* ---- DOM helpers -------------------------------------------------------- */
  Engine.el = function (tag, cls, text, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  };
  /* only http(s) or site-relative URLs may become href values */
  Engine.safeUrl = function (u) {
    u = String(u || '');
    return (/^(https?:\/\/|\/|\.{0,2}\/|[A-Za-z0-9_\-][^:]*$)/.test(u) && !/^\s*javascript:/i.test(u)) ? u : '#';
  };
  Engine.fold = function (s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[่-์]/g, '').replace(/\s+/g, ' ').trim();
  };

  /* ---- icons -------------------------------------------------------------- */
  var ICONS = {};
  Engine.icons = {
    /* register a namespace of name -> glyph; later registrations never overwrite earlier names */
    register: function (ns, map) {
      for (var k in map) if (!(k in ICONS)) ICONS[k] = { glyph: map[k], ns: ns };
    },
    get: function (name) { return ICONS[name] ? ICONS[name].glyph : '▫'; },
    node: function (name, cls) {
      var s = Engine.el('span', 'icon' + (cls ? ' ' + cls : ''), Engine.icons.get(name), { 'aria-hidden': 'true' });
      s.setAttribute('data-icon', name);
      return s;
    },
    /* fill every <span data-icon="name"> under root */
    hydrate: function (root) {
      var list = (root || document).querySelectorAll('[data-icon]');
      for (var i = 0; i < list.length; i++) {
        if (!list[i].textContent) list[i].textContent = Engine.icons.get(list[i].getAttribute('data-icon'));
        list[i].setAttribute('aria-hidden', 'true');
        list[i].classList.add('icon');
      }
    }
  };
  Engine.icons.register('base', {
    home: '🏠', search: '🔍', light: '☀️', dark: '🌙',
    concept: '💡', lecture: '🎓', document: '📄', source: '📚',
    reference: '🔗', provision: '📜', topic: '🧭', subject: '📘',
    dictionary: '📖', legal: '⚖️', aircraft: '✈️', warning: '⚠️', info: 'ℹ️', back: '←'
  });

  /* ---- theme -------------------------------------------------------------- */
  var THEME_KEY = 'codex-theme';
  Engine.theme = {
    get: function () { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; } },
    apply: function (t) {
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    },
    set: function (t) {
      t = t === 'dark' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
      Engine.theme.apply(t);
      var b = document.querySelectorAll('[data-theme-btn]');
      for (var i = 0; i < b.length; i++) b[i].classList.toggle('active', b[i].getAttribute('data-theme-btn') === t);
    }
  };
  Engine.theme.apply(Engine.theme.get());          /* run before first paint */

  /* ---- data --------------------------------------------------------------- */
  var CACHE = {};
  Engine.data = {
    /* url is resolved against the page; opts.v appends a cache-busting ?v= */
    fetchJSON: function (url, opts) {
      var u = url + ((opts && opts.v) ? (url.indexOf('?') < 0 ? '?' : '&') + 'v=' + opts.v : '');
      if (!CACHE[u]) {
        CACHE[u] = fetch(u).then(function (r) {
          if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
          return r.json();
        });
        CACHE[u].catch(function () { delete CACHE[u]; });
      }
      return CACHE[u];
    }
  };

  /* ---- worlds + URN resolution ------------------------------------------- */
  /* URN grammar:  <ns>:<kind>/<slug>   e.g.  eng:concept/sms   atlas:concept/lamoed   av:source/AV-SRC-NLM-021 */
  var WORLDS = null;
  Engine.worlds = {
    load: function () {
      if (!WORLDS) WORLDS = Engine.data.fetchJSON(Engine.url('engine/worlds.json'), { v: '1' });
      return WORLDS;
    },
    parse: function (urn) {
      var m = /^([a-z][a-z0-9-]*):([a-z][a-z0-9-]*)\/(.+)$/.exec(String(urn || ''));
      return m ? { ns: m[1], kind: m[2], slug: m[3] } : null;
    },
    /* resolves to { href, world } using worlds.json "urns" templates; null when the namespace is unknown */
    resolve: function (urn) {
      return Engine.worlds.load().then(function (cfg) {
        var p = Engine.worlds.parse(urn);
        if (!p) return null;
        for (var i = 0; i < cfg.worlds.length; i++) {
          var tpl = (cfg.worlds[i].urns || {})[p.ns + ':' + p.kind];
          if (tpl) return { world: cfg.worlds[i], href: Engine.url(tpl.replace('{slug}', encodeURIComponent(p.slug)).replace('{urn}', encodeURIComponent(urn))), parsed: p };
        }
        return null;
      });
    }
  };
})(window);
