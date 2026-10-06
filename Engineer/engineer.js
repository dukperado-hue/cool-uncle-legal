/* ============================================================================
 * Engineer/engineer.js  --  the ENGINEER world: data access + page controllers
 * ----------------------------------------------------------------------------
 * Everything generic (theme, icons, shell, reader, URN resolution) comes from
 * ../engine/.  This file only knows where Engineer's data lives and registers
 * the few block types that read Engineer-specific data (dictionary rows, the
 * aviation source registry).  Adding a subject or an entity needs NO change here.
 * Paths inside data/registry.json 'external' are relative to the Engineer/ folder.
 * ========================================================================== */
(function (global) {
  'use strict';
  var Engine = global.Engine, el = Engine.el;
  var V = '20261006c';                                  /* data cache-bust token: bump on content updates */
  var BASE = new URL('./', document.currentScript.src).href;     /* .../Engineer/ */

  Engine.icons.register('engineer', {
    safety: '🦺', sms: '🛡️', hazard: '⚠️', report: '📝', investigation: '🔎',
    runway: '🛬', bird: '🐦', gnss: '🛰️', human: '🧠', regulation: '📜',
    law: '⚖️', icao: '🌐', history: '🏛️', airworthiness: '🔧'
  });

  var STATUS = {
    planned: { label: 'วางแผน', soon: true }, seeded: { label: 'มีตัวอย่าง' }, referenced: { label: 'อ้างอิง Atlas' }, published: { label: 'พร้อมอ่าน' }
  };

  /* ---- data --------------------------------------------------------------- */
  var CORE = null, SHARDS = null;
  var Engineer = global.Engineer = {
    base: BASE,
    subjectHref: function (id) { return BASE + 'subject.html?k=' + encodeURIComponent(id); },
    entryHref: function (urn) { return BASE + 'entry.html?id=' + encodeURIComponent(urn); },
    ext: function (path) { return new URL(path, BASE).href; },
    load: function () {
      if (!CORE) CORE = Engine.data.fetchJSON(BASE + 'data/registry.json', { v: V }).then(function (reg) {
        return Engine.data.fetchJSON(BASE + 'data/' + reg.subjects, { v: V }).then(function (sub) {
          var by = {}; sub.subjects.forEach(function (s) { by[s.id] = s; });
          var open = sub.subjects.filter(function (s) { return !s.hidden; });
          var dom = {}; sub.domains.forEach(function (d) { dom[d.id] = d; });
          return { registry: reg, subjectsDoc: sub, subjects: by, domains: dom, visible: open };
        });
      });
      return CORE;
    },
    entities: function () {
      if (!SHARDS) SHARDS = Engineer.load().then(function (c) {
        return Promise.all(c.registry.shards.map(function (sh) { return Engine.data.fetchJSON(BASE + 'data/' + sh.path, { v: V }); }))
          .then(function (lists) {
            var by = c.subjects;
            return [].concat.apply([], lists).filter(function (e) {
              return (e.subjects || []).some(function (id) { return by[id] && !by[id].hidden; });
            });
          });
      });
      return SHARDS;
    },
    external: function (group, id) {
      return Engineer.load().then(function (c) {
        var it = (c.registry.external[group] || []).filter(function (x) { return x.id === id; })[0];
        if (!it) throw new Error('external ' + group + '/' + id + ' not registered');
        return it;
      });
    },
    search: function (q) {
      var f = Engine.fold(q);
      return Promise.all([Engineer.load(), Engineer.entities()]).then(function (r) {
        var core = r[0], ents = r[1], out = [];
        core.visible.forEach(function (s) {
          var hay = Engine.fold([s.id, s.titleTH, s.titleEN].concat((s.declaredSources || []).map(function (d) { return d.name; })).join(' '));
          if (hay.indexOf(f) >= 0) out.push({ title: s.titleTH, desc: s.titleEN, tag: 'วิชา', icon: s.icon, href: Engineer.subjectHref(s.id) });
        });
        ents.forEach(function (e) {
          var hay = Engine.fold([e.id, e.titleTH, e.titleEN, e.summary].concat(e.tags || []).join(' '));
          if (hay.indexOf(f) >= 0) out.push({ title: e.titleTH || e.titleEN, desc: e.titleEN || '', tag: e.kind, icon: e.kind, href: Engineer.entryHref(e.id) });
        });
        return out;
      });
    }
  };

  var NAV = [   /* every page of the world; pages not listed in registry.publicPages are not linked yet */
    { id: 'home', label: 'หน้าแรก', icon: 'home', href: BASE + 'index.html' },
    { id: 'dictionary', label: 'พจนานุกรม', icon: 'dictionary', href: BASE + 'dictionary.html' },
    { id: 'sources', label: 'แหล่งข้อมูล', icon: 'source', href: BASE + 'sources.html' }
  ];
  function isPublic(core, id) { return (core.registry.publicPages || []).indexOf(id) >= 0; }
  function mount(current) {
    return Engineer.load().then(function (core) {
      var nav = NAV.filter(function (n) { return isPublic(core, n.id); });
      return Engine.shell.mount({
      world: 'engineer', nav: nav.length > 1 ? nav : null, current: current,
      search: { placeholder: 'ค้นหาวิชา แนวคิด แหล่งข้อมูล...', provider: Engineer.search },
      footer: 'Cool Uncle · Engineer — ฐานความรู้ที่เพิ่มทีละเรื่อง ทุกหน้าระบุที่มา · ข้อมูลที่ร่างโดย AI จะมีป้ายกำกับ'
      });
    });
  }
  function closed(host) { host.textContent = ''; host.appendChild(el('div', 'empty-state', 'หน้านี้ยังไม่เปิดให้ชม — กำลังเตรียมเนื้อหา')); }
  function labeler(core, ents) {
    var m = {};
    core.subjectsDoc.subjects.forEach(function (x) { m[x.urn] = x.titleTH; });
    ents.forEach(function (x) { m[x.id] = x.titleTH || x.titleEN; });
    return function (urn) { return m[urn] || null; };
  }
  function fail(host, e) { host.textContent = ''; host.appendChild(el('div', 'empty-state', 'โหลดข้อมูลไม่สำเร็จ: ' + e.message)); }
  function param(k) { return new URLSearchParams(location.search).get(k); }

  /* ---- reader blocks that read Engineer's external data ------------------- */
  function loadExternal(group, id) {
    return Engineer.external(group, id).then(function (it) { return Engine.data.fetchJSON(Engineer.ext(it.path), { v: V }).then(function (d) { return { item: it, data: d }; }); });
  }
  Engine.reader.registerBlock('dict-header', function (b) {
    return loadExternal('dictionaries', b.volume).then(function (r) {
      var box = el('div', 'reader-note info');
      box.appendChild(el('strong', null, r.item.title + ' — ' + (r.data.entries || []).length.toLocaleString('en-US') + ' แถว'));
      box.appendChild(el('div', null, 'สถานะไฟล์: ' + r.data.status + ' · สร้าง ' + r.data.generated));
      if (r.data.note) box.appendChild(el('div', null, r.data.note));
      return box;
    });
  });
  Engine.reader.registerBlock('dict-rows', function (b) {
    return loadExternal('dictionaries', b.volume).then(function (r) {
      var want = (b.match || []).map(function (m) { return String(m).toUpperCase(); });
      var rows = (r.data.entries || []).filter(function (e) { return want.indexOf(String(e.abbr || '').toUpperCase()) >= 0; });
      var ul = el('ul', 'reader-list');
      if (!rows.length) { ul.appendChild(el('li', null, 'ไม่พบแถวที่ตรงกันในไฟล์ต้นทาง')); return ul; }
      rows.forEach(function (e) {
        (e.meanings || []).forEach(function (m) {
          var li = el('li');
          li.appendChild(el('strong', null, e.abbr));
          li.appendChild(el('span', null, m.en));
          (m.th || []).forEach(function (t) { li.appendChild(el('span', null, t)); });
          (m.src || []).forEach(function (sid) {
            var url = (r.data.sources || {})[sid];
            li.appendChild(url ? el('a', 'chip', 'แหล่ง #' + sid, { href: Engine.safeUrl(url), target: '_blank', rel: 'noopener' }) : el('span', 'chip', 'แหล่ง #' + sid));
          });
          ul.appendChild(li);
        });
      });
      return ul;
    });
  });
  Engine.reader.registerBlock('av-source-list', function (b) {
    return Engineer.external('sourceRegistries', b.registry).then(function (it) {
      return Engine.data.fetchJSON(Engineer.ext(it.path), { v: V }).then(function (reg) {
        var all = reg.sources || [], field = it.publicFilter || { equals: b.filter };
        var open = all.filter(function (s) { return (s.redistribution || {}).status === field.equals; });
        var host = el('div');
        host.appendChild(el('p', null, 'ทะเบียนมี ' + all.length + ' รายการ · เผยแพร่ได้ (' + field.equals + ') ' + open.length + ' · รอทบทวนสิทธิ์ ' + (all.length - open.length) + ' (ไม่แสดงชื่อ)'));
        var ul = el('ul', 'reader-list');
        open.forEach(function (s) {
          var li = el('li');
          li.appendChild(s.url ? el('a', null, s.title, { href: Engine.safeUrl(s.url), target: '_blank', rel: 'noopener' }) : el('span', null, s.title));
          li.appendChild(el('span', 'chip', s.id));
          if (s.textState) li.appendChild(el('span', 'chip', s.textState));
          ul.appendChild(li);
        });
        host.appendChild(ul);
        return host;
      });
    });
  });

  /* ---- page controllers --------------------------------------------------- */
  Engineer.pages = {
    home: function () {
      mount('home');
      var host = document.getElementById('domains');
      Promise.all([Engineer.load(), Engineer.entities()]).then(function (r) {
        var core = r[0], ents = r[1];
        core.subjectsDoc.domains.forEach(function (d) {
          if (!core.visible.some(function (s) { return s.domain === d.id; })) return;
          var sec = el('section', 'section');
          var hd = el('div', 'section-header');
          var badge = el('div', 'section-badge'); badge.appendChild(Engine.icons.node(d.icon)); hd.appendChild(badge);
          var tt = el('div', 'section-title'); tt.appendChild(el('h2', null, d.titleTH + ' · ' + d.titleEN)); tt.appendChild(el('p', 'section-subtitle', d.summaryTH)); hd.appendChild(tt);
          sec.appendChild(hd);
          var grid = el('div', 'grid');
          core.visible.filter(function (s) { return s.domain === d.id; }).forEach(function (s) {
            var st = STATUS[s.status] || { label: s.status };
            var n = ents.filter(function (e) { return (e.subjects || []).indexOf(s.id) >= 0; }).length;
            var a = el('a', 'subject-card' + (st.soon ? ' coming-soon' : ''), null, { href: Engineer.subjectHref(s.id) });
            var th = el('div', 'subject-thumb ' + d.brand);
            th.appendChild(el('span', 'status-pill', st.label));
            var badge2 = el('div', 'thumb-badge'); badge2.appendChild(Engine.icons.node(s.icon)); th.appendChild(badge2);
            a.appendChild(th);
            var body = el('div', 'subject-body');
            body.appendChild(el('div', 'subject-name', s.titleTH));
            body.appendChild(el('div', 'subject-desc', s.titleEN));
            var ft = el('div', 'subject-footer');
            ft.appendChild(el('span', 'subject-meta', n ? n + ' รายการ' : ((s.references || []).length ? (s.references.length + ' อ้างอิง') : 'ยังไม่มีเนื้อหา')));
            ft.appendChild(el('span', 'subject-cta', 'เปิด →'));
            body.appendChild(ft); a.appendChild(body); grid.appendChild(a);
          });
          sec.appendChild(grid); host.appendChild(sec);
        });
        var live = document.getElementById('live-status');
        live.textContent = 'กำลังเตรียมเนื้อหา — ยังไม่เปิดให้ชม';
      }).catch(function (e) { fail(host, e); });
    },

    subject: function () {
      mount('home');
      var host = document.getElementById('subject');
      Promise.all([Engineer.load(), Engineer.entities()]).then(function (r) {
        var core = r[0], ents = r[1], s = core.subjects[param('k')]; if (s && s.hidden) s = null;
        host.textContent = '';
        if (!s) { host.appendChild(el('div', 'empty-state', 'ไม่พบวิชา "' + (param('k') || '') + '"')); return; }
        var d = core.domains[s.domain], st = STATUS[s.status] || { label: s.status };
        document.title = s.titleTH + ' · Engineer';
        var art = el('article', 'reader'); art.appendChild(el('a', 'back-link', '← กลับหน้าแรก', { href: BASE + 'index.html' }));
        var ctxS = { labelFor: labeler(core, ents) }, head = el('header', 'reader-head'), k = el('div', 'reader-kind');
        var c1 = el('span', 'chip'); c1.appendChild(Engine.icons.node(d.icon)); c1.appendChild(document.createTextNode(' ' + d.titleTH)); k.appendChild(c1);
        k.appendChild(el('span', 'chip is-world', st.label)); head.appendChild(k);
        head.appendChild(el('h1', null, s.titleTH)); head.appendChild(el('div', 'reader-sub', s.titleEN)); art.appendChild(head);
        if (s.summary) art.appendChild(el('p', 'reader-summary', s.summary));

        var mine = ents.filter(function (e) { return (e.subjects || []).indexOf(s.id) >= 0; });
        var sec = el('section', 'reader-section'); sec.appendChild(el('h2', null, 'เนื้อหาในวิชานี้'));
        if (mine.length) {
          var ul = el('ul', 'reader-list');
          mine.forEach(function (e) {
            var li = el('li'); li.appendChild(Engine.icons.node(e.kind));
            li.appendChild(el('a', null, e.titleTH || e.titleEN, { href: Engineer.entryHref(e.id) }));
            li.appendChild(el('span', 'chip', e.type || e.kind));
            if ((e.provenance || {}).origin === 'ai-assisted') li.appendChild(el('span', 'chip', 'ร่างโดย AI'));
            ul.appendChild(li);
          });
          sec.appendChild(ul);
        } else sec.appendChild(el('div', 'empty-state', 'ยังไม่มีเนื้อหา — วิชานี้ประกาศไว้แล้ว รอเพิ่มข้อมูลทีละเรื่อง'));
        art.appendChild(sec);

        if ((s.references || []).length) {
          var rl = el('ul', 'reader-list');
          s.references.forEach(function (ref) { rl.appendChild(Engine.reader.refItem(ref, ctxS)); });
          var rs = el('section', 'reader-section'); rs.appendChild(el('h2', null, 'อ้างอิงข้ามโลกความรู้ (เนื้อหาอยู่ที่ต้นทาง ไม่ได้คัดลอก)')); rs.appendChild(rl); art.appendChild(rs);
        }
        var ds = el('section', 'reader-section'); ds.appendChild(el('h2', null, 'แหล่งที่ผู้จัดทำประกาศไว้'));
        var dl = el('ul', 'reader-list');
        (s.declaredSources || []).forEach(function (x) {
          var li = el('li'); li.appendChild(el('span', null, x.name));
          li.appendChild(el('span', 'chip', x.verifiedInRepo ? 'ตรวจในคลังแล้ว' : 'ยังไม่ได้ตรวจ/นำเข้า'));
          dl.appendChild(li);
        });
        ds.appendChild(dl); art.appendChild(ds);
        art.appendChild(el('div', 'reader-meta', s.urn + '  ·  ' + s.status));
        host.appendChild(art); Engine.icons.hydrate(host);
      }).catch(function (e) { fail(host, e); });
    },

    entry: function () {
      mount('home');
      var host = document.getElementById('entry');
      Promise.all([Engineer.load(), Engineer.entities()]).then(function (r) {
        var core = r[0], id = param('id'), ent = r[1].filter(function (e) { return e.id === id; })[0];
        if (!ent) { host.textContent = ''; host.appendChild(el('div', 'empty-state', 'ไม่พบรายการ "' + (id || '') + '"')); return; }
        document.title = (ent.titleTH || ent.titleEN) + ' · Engineer';
        Engine.reader.render(host, ent, { subjects: core.subjects, subjectHref: Engineer.subjectHref, labelFor: labeler(core, r[1]), back: { href: BASE + 'index.html', text: '← กลับหน้าแรก' } });
      }).catch(function (e) { fail(host, e); });
    },

    dictionary: function () {
      mount('dictionary');
      var host = document.getElementById('atlas-dictionary');
      Engineer.load().then(function (c) {
        if (!isPublic(c, 'dictionary')) return closed(host);
        /* the Atlas dictionary component reads the SAME files the Atlas dictionary page reads */
        var vols = c.registry.external.dictionaries.map(function (d, i) {
          return { id: d.id, type: d.id === 'abbr' ? 'abbr' : 'terms', title: d.title, sub: d.status, url: Engineer.ext(d.path) + '?v=' + V };
        });
        global.AtlasDictionaryView.mountPage(host, { volumes: vols });
      }).catch(function (e) { fail(host, e); });
    },

    sources: function () {
      mount('sources');
      var host = document.getElementById('sources');
      Promise.all([Engineer.load(), Engineer.entities()]).then(function (r) {
        var core = r[0], ents = r[1];
        if (!isPublic(core, 'sources')) return closed(host);
        host.textContent = '';
        var sec = el('section', 'reader-section'); sec.appendChild(el('h2', null, 'ทะเบียนแหล่งข้อมูลที่ใช้อยู่แล้ว'));
        var ul = el('ul', 'reader-list');
        ents.filter(function (e) { return e.kind === 'source' || e.kind === 'reference'; }).forEach(function (e) {
          var li = el('li'); li.appendChild(Engine.icons.node(e.kind));
          li.appendChild(el('a', null, e.titleTH || e.titleEN, { href: Engineer.entryHref(e.id) })); li.appendChild(el('span', 'chip', e.type || e.kind)); ul.appendChild(li);
        });
        sec.appendChild(ul); host.appendChild(sec);
        var d2 = el('section', 'reader-section'); d2.appendChild(el('h2', null, 'แหล่งที่ประกาศไว้ แต่ยังไม่ได้ตรวจ/นำเข้า'));
        var dl = el('ul', 'reader-list');
        core.visible.forEach(function (s) {
          (s.declaredSources || []).forEach(function (x) {
            var li = el('li'); li.appendChild(el('span', null, x.name)); li.appendChild(el('a', 'chip', s.titleTH, { href: Engineer.subjectHref(s.id) }));
            li.appendChild(el('span', 'chip', x.verifiedInRepo ? 'ตรวจแล้ว' : 'ยังไม่ได้ตรวจ')); dl.appendChild(li);
          });
        });
        (core.subjectsDoc.unclassifiedCorpus || []).forEach(function (u) {
          var li = el('li'); li.appendChild(el('span', null, u.name)); li.appendChild(el('span', 'chip', 'ยังไม่จัดหมวด — ความหมายยังไม่ระบุ')); dl.appendChild(li);
        });
        d2.appendChild(dl); host.appendChild(d2); Engine.icons.hydrate(host);
      }).catch(function (e) { fail(host, e); });
    }
  };
})(window);
