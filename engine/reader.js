/* ============================================================================
 * engine/reader.js  --  domain-neutral READER for knowledge entities
 * ----------------------------------------------------------------------------
 * Renders one entity (concept | lecture | document | source | reference |
 * provision | topic) in the layout the Atlas concept pages use: kind chips,
 * title (TH + EN), status/provenance banner, summary, body, sources, related,
 * tags, footer id.  The entity shape is engine-level (see Engineer/schema/);
 * domain content lives in the entity's `body` blocks.
 *
 * Body blocks are data:  { type: 'heading'|'para'|'list'|'table'|'quote'|'note', ... }
 * A world may add its own block types:  Engine.reader.registerBlock(type, fn(block, ctx) -> Node|Promise<Node>)
 * Unknown block types render a visible "unsupported block" note (never silently dropped).
 *
 * Everything is inserted with textContent; URLs go through Engine.safeUrl.
 * ========================================================================== */
(function (global) {
  'use strict';
  var Engine = global.Engine, el = Engine.el;
  var BLOCKS = {};

  var KIND_LABEL = { concept: 'แนวคิด', lecture: 'บรรยาย', document: 'เอกสาร', source: 'แหล่งข้อมูล', reference: 'อ้างอิง', provision: 'บทบัญญัติ', topic: 'หัวข้อ' };
  var STATUS_LABEL = { 'ai-assisted': 'ร่างโดย AI — ยังไม่ได้ตรวจกับต้นฉบับ', 'draft': 'ฉบับร่าง', 'published': 'เผยแพร่', 'source-text': 'ข้อความจากต้นฉบับ', 'derived': 'สรุป/สร้างจากแหล่งที่ระบุ', 'editorial': 'เรียบเรียงโดยผู้จัดทำ' };

  var TYPE_LABEL = { EVENT: 'กิจกรรม', CONCEPT: 'แนวคิด', PRACTICE: 'แนวปฏิบัติ', STANDARD: 'มาตรฐาน/ข้อกำหนด', CASE_STUDY: 'กรณีศึกษา', ORGANIZATION: 'องค์กร', SYSTEM: 'ระบบ', METHODOLOGY: 'วิธีการ', SOURCE: 'แหล่งข้อมูล', SERIES: 'ชุดกิจกรรม', MODULE: 'โมดูล' };
  var EXTRACT_LABEL = { 'pdf-text': 'ข้อความจาก PDF', 'machine-transcript': 'ถอดเสียงอัตโนมัติ', 'web-page': 'หน้าเว็บ', 'human-read': 'อ่านโดยผู้จัดทำ' };

  BLOCKS.heading = function (b) { return el(b.level === 3 ? 'h3' : 'h2', null, b.text); };
  BLOCKS.para = function (b) { return el('p', null, b.text); };
  BLOCKS.list = function (b) {
    var l = el(b.ordered ? 'ol' : 'ul');
    (b.items || []).forEach(function (t) { l.appendChild(el('li', null, t)); });
    return l;
  };
  BLOCKS.quote = function (b) {
    var q = el('blockquote', null, b.text);
    if (b.cite) q.appendChild(el('cite', null, b.cite));
    return q;
  };
  BLOCKS.link = function (b) { return el('p', null, null).appendChild(el('a', 'btn secondary', b.text, { href: Engine.safeUrl(b.href) })).parentNode; };
  BLOCKS.note = function (b) {
    var n = el('div', 'reader-note ' + (b.kind === 'warn' ? 'warn' : 'info'));
    n.appendChild(Engine.icons.node(b.kind === 'warn' ? 'warning' : 'info'));
    n.appendChild(document.createTextNode(' ' + b.text));
    return n;
  };
  BLOCKS.table = function (b) {
    var t = el('table'), th = el('thead'), tr = el('tr');
    (b.headers || []).forEach(function (h) { tr.appendChild(el('th', null, h)); });
    th.appendChild(tr); t.appendChild(th);
    var tb = el('tbody');
    (b.rows || []).forEach(function (r) {
      var row = el('tr'); r.forEach(function (c) { row.appendChild(el('td', null, c)); }); tb.appendChild(row);
    });
    t.appendChild(tb); return t;
  };

  function renderBlocks(blocks, ctx) {
    var host = el('div', 'reader-body');
    (blocks || []).forEach(function (b) {
      var fn = BLOCKS[b.type];
      if (!fn) { host.appendChild(el('div', 'reader-note warn', 'ไม่รองรับบล็อกชนิด "' + b.type + '"')); return; }
      var slot = el('div'); host.appendChild(slot);
      Promise.resolve().then(function () { return fn(b, ctx); })
        .then(function (n) { if (n) slot.appendChild(n); })
        .catch(function (e) { slot.appendChild(el('div', 'reader-note warn', 'โหลดบล็อก "' + b.type + '" ไม่สำเร็จ: ' + e.message)); });
    });
    return host;
  }

  /* one linked reference: { urn, rel, label?, labelSnapshot? } -> <li> */
  function refItem(ref, ctx) {
    var li = el('li');
    var a = el('a', 'chip', ref.labelSnapshot || ref.label || (ctx && ctx.labelFor && ctx.labelFor(ref.urn)) || ref.urn);
    li.appendChild(a);
    if (ref.rel) li.appendChild(el('span', 'chip', ref.rel));
    Engine.worlds.resolve(ref.urn).then(function (r) {
      if (!r) { a.removeAttribute('href'); li.appendChild(el('span', 'chip', 'ไม่รู้จัก namespace')); return; }
      a.setAttribute('href', r.href);
      var wchip = el('span', 'chip is-world', r.world.name.th);
      li.insertBefore(wchip, a);
    });
    return li;
  }

  function section(title, node) {
    var s = el('section', 'reader-section'); s.appendChild(el('h2', null, title)); s.appendChild(node); return s;
  }

  Engine.reader = {
    registerBlock: function (type, fn) { BLOCKS[type] = fn; },
    refItem: refItem,
    /* ctx (supplied by the world): { subjects: {id -> subject}, subjectHref(id), labelFor(urn) -> string|null, back: {href,text} } */
    render: function (host, ent, ctx) {
      ctx = ctx || {};
      host.textContent = '';
      var art = el('article', 'reader');
      if (ctx.back) art.appendChild(el('a', 'back-link', ctx.back.text, { href: ctx.back.href }));
      var head = el('header', 'reader-head');
      var kinds = el('div', 'reader-kind');
      var kn = el('span', 'chip');
      kn.appendChild(Engine.icons.node(ent.kind)); kn.appendChild(document.createTextNode(' ' + (KIND_LABEL[ent.kind] || ent.kind)));
      kinds.appendChild(kn);
      if (ent.type) kinds.appendChild(el('span', 'chip', TYPE_LABEL[ent.type] || ent.type));
      (ent.subjects || []).forEach(function (sid) {
        var s = ctx.subjects && ctx.subjects[sid];
        kinds.appendChild(el('a', 'chip', s ? s.titleTH : sid, { href: ctx.subjectHref ? ctx.subjectHref(sid) : '#' }));
      });
      head.appendChild(kinds);
      head.appendChild(el('h1', null, ent.titleTH || ent.titleEN || ent.id));
      if (ent.titleTH && ent.titleEN) head.appendChild(el('div', 'reader-sub', ent.titleEN));
      art.appendChild(head);

      var origin = ent.provenance && ent.provenance.origin;
      if (origin && origin !== 'source-text') {
        var warn = origin === 'ai-assisted';
        art.appendChild(BLOCKS.note({ kind: warn ? 'warn' : 'info', text: (STATUS_LABEL[origin] || origin) + (ent.provenance.note ? ' — ' + ent.provenance.note : '') }));
      }
      if (ent.summary) art.appendChild(el('p', 'reader-summary', ent.summary));
      if (ent.body && ent.body.length) art.appendChild(renderBlocks(ent.body, ctx));

      if (ent.sources && ent.sources.length) {
        var ul = el('ul', 'reader-list');
        ent.sources.forEach(function (s) {
          var li = el('li');
          if (s.url) li.appendChild(el('a', null, s.label || s.url, { href: Engine.safeUrl(s.url), target: '_blank', rel: 'noopener' }));
          else li.appendChild(el('span', null, s.label || s.ref));
          if (s.ref) li.appendChild(el('span', 'chip', s.ref));
          if (s.locator) li.appendChild(el('span', 'chip', s.locator));
          if (s.note) li.appendChild(el('span', null, s.note));
          ul.appendChild(li);
        });
        art.appendChild(section('แหล่งที่มา', ul));
      }
      var ps = ent.provenance && ent.provenance.sources;
      if (ps && ps.length) {
        var pl = el('ul', 'reader-list');
        ps.forEach(function (p) {
          var li = el('li');
          li.appendChild(el('span', null, p.sourceDocument));
          if (p.locator) li.appendChild(el('span', 'chip', p.locator));
          li.appendChild(el('span', 'chip', EXTRACT_LABEL[p.extraction] || p.extraction));
          if (p.status === 'needs-review') li.appendChild(el('span', 'chip', 'รอตรวจทาน'));
          pl.appendChild(li);
        });
        art.appendChild(section('หลักฐานในชุดแหล่งข้อมูล', pl));
      }
      if (ent.needsReview && ent.needsReview.length) {
        var nl = el('ul', 'reader-list');
        ent.needsReview.forEach(function (t) { nl.appendChild(el('li', null, t)); });
        art.appendChild(section('ต้องตรวจทานกับต้นฉบับ', nl));
      }
      if (ent.related && ent.related.length) {
        var rl = el('ul', 'reader-list');
        ent.related.forEach(function (r) { rl.appendChild(refItem(r, ctx)); });
        art.appendChild(section('เกี่ยวข้อง', rl));
      }
      if (ent.tags && ent.tags.length) {
        var tg = el('div');
        ent.tags.forEach(function (t) { tg.appendChild(el('span', 'chip', t)); tg.appendChild(document.createTextNode(' ')); });
        art.appendChild(section('แท็ก', tg));
      }
      art.appendChild(el('div', 'reader-meta', ent.id + (ent.status ? '  ·  ' + ent.status : '')));
      host.appendChild(art);
      Engine.icons.hydrate(host);
      return art;
    }
  };
})(window);
