/* comics-tab.js — แท็บ "🎭 Comics" + โหมดอ่านเต็มจอ ใช้ร่วมกันทุกหน้าวิชา (อ่านรายการจาก comics/index.json)
   <script src="comics-tab.js?v=3"></script> แล้วเรียก
     ComicsTab.install('iplaw')                 หน้าที่ยังไม่มีแถบแท็บ: สร้างแถบ 📖 สรุปรายครั้ง / 🎭 Comics ให้เอง
     ComicsTab.mount('constproc', el, opts)     วาดรายการตอนลงใน el (opts.idPrefix เปลี่ยน id ตอน)
     ComicsTab.openReader('crimprowar', 1, 0)   เปิดโหมดอ่านเต็มจอที่ตอน/หน้าที่ต้องการ (หน้า 0 = หน้าแรก)
   โหมดอ่าน: ทีละหน้า (← → / คลิกซ้าย-ขวา / ปัด) หรือเลื่อนต่อเนื่อง · จำตอนและหน้าที่อ่านค้างไว้ · จบตอนแล้วไปตอนถัดไปได้ทันที */
(function(){
  var V = '3';
  var css = [
    '.ct-tabs{display:flex;gap:8px;margin:22px 0 18px;flex-wrap:wrap}',
    '.ct-tab{flex:1;min-width:150px;background:var(--card,#fff);border:1px solid var(--line,#e2ded3);border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;font-weight:700;color:var(--ink-soft,#5A6072);cursor:pointer;transition:all .15s;text-align:center}',
    '.ct-tab.active{background:var(--accent,#c0392b);color:#fff;border-color:var(--accent,#c0392b)}',
    '.ct-tab:hover:not(.active){border-color:var(--gold,#b8892b)}',
    '.ct-panel{display:none}',
    '.ct-panel.active{display:block}',
    '.ct-intro{background:var(--card,#fff);border:1px solid var(--line,#e2ded3);border-radius:14px;padding:14px 16px;margin-bottom:14px;color:var(--ink-soft,#5A6072);font-size:14px;line-height:1.7;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}',
    '.ct-intro a{color:var(--accent,#c0392b);font-weight:700}',
    '.ct-btn{appearance:none;border:0;border-radius:999px;background:var(--accent,#c0392b);color:#fff;font:inherit;font-weight:800;font-size:14px;padding:9px 16px;cursor:pointer;white-space:nowrap}',
    '.ct-btn.ghost{background:transparent;color:var(--accent,#c0392b);border:1px solid var(--accent,#c0392b)}',
    '.ct-ep{background:var(--card,#fff);border:1px solid var(--line,#e2ded3);border-radius:16px;margin-bottom:14px;overflow:hidden}',
    '.ct-ep-head{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;width:100%;color:inherit;font:inherit;text-align:left}',
    '.ct-ep-badge{flex:none;background:var(--accent,#c0392b);color:#fff;font-weight:900;border-radius:10px;padding:6px 10px;font-size:13px;letter-spacing:.5px}',
    ':root[data-theme="dark"] .ct-ep-badge,:root[data-theme="horror"] .ct-ep-badge{background:var(--gold-soft,#3a3320);color:var(--gold,#e0b95a)}',
    '.ct-ep-title{flex:1;font-weight:800;color:var(--ink,#22283A);line-height:1.4}',
    '.ct-ep-title small{display:block;font-weight:600;color:var(--ink-faint,#8a8fa0);font-size:12.5px;margin-top:2px}',
    '.ct-ep-meta{flex:none;color:var(--ink-faint,#8a8fa0);font-size:12.5px;white-space:nowrap}',
    '.ct-ep-body{display:none;padding:0 12px 14px}',
    '.ct-ep.open .ct-ep-body{display:block}',
    '.ct-pages{display:flex;flex-direction:column;gap:14px;align-items:center;margin:6px 0 4px}',
    '.ct-pages img{width:100%;max-width:720px;height:auto;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.25);display:block}',
    '.ct-empty{color:var(--ink-soft,#5A6072);padding:20px 4px}',
    /* ---- โหมดอ่านเต็มจอ ---- */
    '.ctr{position:fixed;inset:0;z-index:99999;background:#101218;color:#eee;display:flex;flex-direction:column;font-family:inherit}',
    '.ctr-bar{flex:none;display:flex;align-items:center;gap:10px;padding:8px 12px;background:#181b25;border-bottom:1px solid #2a2f40;flex-wrap:wrap}',
    '.ctr-x{appearance:none;border:0;background:#2a2f40;color:#fff;width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer}',
    '.ctr-title{flex:1;min-width:140px;font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ctr-title b{background:var(--accent,#c0392b);color:#fff;border-radius:7px;padding:2px 8px;margin-right:8px;font-size:12px}',
    '.ctr select{background:#2a2f40;color:#fff;border:0;border-radius:8px;padding:7px 8px;font:inherit;font-size:13px;max-width:210px}',
    '.ctr-mode{display:flex;gap:4px}',
    '.ctr-mode button{appearance:none;border:0;background:#2a2f40;color:#cfd3e2;border-radius:8px;padding:7px 10px;font:inherit;font-size:13px;cursor:pointer}',
    '.ctr-mode button.on{background:var(--accent,#c0392b);color:#fff}',
    '.ctr-pg{font-size:13px;color:#aab;min-width:54px;text-align:right}',
    '.ctr-stage{flex:1;min-height:0;position:relative;outline:none}',
    '.ctr-stage.page{display:flex;align-items:center;justify-content:center;overflow:hidden}',
    '.ctr-stage.page img{max-width:100%;max-height:100%;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none}',
    '.ctr-stage.scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 0 40px}',
    '.ctr-stage.scroll img{display:block;width:min(100%,760px);height:auto;margin:0 auto 10px}',
    '.ctr-nav{position:absolute;top:0;bottom:0;width:18%;max-width:150px;border:0;background:transparent;color:#fff;font-size:42px;cursor:pointer;opacity:0;transition:opacity .15s}',
    '.ctr-nav:hover,.ctr-nav:focus-visible{opacity:.85;background:linear-gradient(90deg,rgba(0,0,0,.45),transparent)}',
    '.ctr-nav.r{right:0}.ctr-nav.r:hover{background:linear-gradient(270deg,rgba(0,0,0,.45),transparent)}',
    '.ctr-nav.l{left:0}',
    '.ctr-nav[disabled]{display:none}',
    '.ctr-end{display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;text-align:center;padding:40px 20px;color:#dde}',
    '.ctr-end h3{margin:0;font-size:22px}',
    '.ctr-hint{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-size:12px;color:#8a90a8;pointer-events:none}',
    '@media (max-width:640px){.ctr-hint{display:none}.ctr-title{flex-basis:100%;order:5}}'
  ].join('\n');
  var styled = false;
  function addCss(){
    if (styled) return; styled = true;
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function two(n){ return ('0' + n).slice(-2); }
  function pageUrl(code, ep, i){ return 'comics/' + code + '/ep' + two(ep) + '/web/p' + i + '.jpg?v=' + V; }

  var dataP = null;
  function load(){
    if (!dataP) dataP = fetch('comics/index.json?v=' + V).then(function(r){ return r.json(); });
    return dataP;
  }
  function subj(d, code){ return (d.subjects || []).filter(function(x){ return x.code === code; })[0]; }

  /* ---- จำที่อ่านค้างไว้ (localStorage ใช้ได้เฉพาะเครื่องนี้) ---- */
  function getProg(code){ try { return (JSON.parse(localStorage.getItem('ct-progress') || '{}'))[code] || null; } catch (e) { return null; } }
  function setProg(code, ep, page){ try { var o = JSON.parse(localStorage.getItem('ct-progress') || '{}'); o[code] = {ep: ep, page: page}; localStorage.setItem('ct-progress', JSON.stringify(o)); } catch (e) {} }
  function getMode(){ try { var m = localStorage.getItem('ct-mode'); if (m === 'page' || m === 'scroll') return m; } catch (e) {} return window.innerWidth >= 900 ? 'page' : 'scroll'; }
  function setMode(m){ try { localStorage.setItem('ct-mode', m); } catch (e) {} }

  /* ---------------------------------------------------------------- โหมดอ่านเต็มจอ */
  var R = null;   // สถานะ reader ที่เปิดอยู่
  function closeReader(){
    if (!R) return;
    document.removeEventListener('keydown', R.key, true);
    R.root.remove(); document.documentElement.style.overflow = R.prevOverflow;
    R = null;
  }
  function openReader(code, ep, page){
    addCss();
    return load().then(function(d){
      var s = subj(d, code); if (!s || !s.eps.length) return;
      closeReader();
      var eps = s.eps;
      var st = { s: s, code: code, ep: ep, page: page || 0, mode: getMode() };
      var root = document.createElement('div'); root.className = 'ctr'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
      root.innerHTML = '<div class="ctr-bar"><button type="button" class="ctr-x" title="ปิด (Esc) · ← → เปลี่ยนหน้า · คลิกครึ่งซ้าย/ขวาของภาพก็ได้" aria-label="ปิด">✕</button>' +
        '<div class="ctr-title"></div><select class="ctr-ep" aria-label="เลือกตอน"></select>' +
        '<div class="ctr-mode"><button type="button" data-m="page">📖 ทีละหน้า</button><button type="button" data-m="scroll">📜 เลื่อนอ่าน</button></div>' +
        '<span class="ctr-pg"></span></div><div class="ctr-stage" tabindex="-1"></div>';
      document.body.appendChild(root);
      var prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
      var stage = root.querySelector('.ctr-stage'), sel = root.querySelector('.ctr-ep'), ttl = root.querySelector('.ctr-title'), pg = root.querySelector('.ctr-pg');
      sel.innerHTML = eps.map(function(e){ return '<option value="' + e.ep + '">EP.' + two(e.ep) + ' ' + esc(e.title) + '</option>'; }).join('');

      function cur(){ return eps.filter(function(e){ return e.ep === st.ep; })[0] || eps[0]; }
      function nextEp(){ var i = eps.indexOf(cur()); return eps[i + 1] || null; }
      function prevEp(){ var i = eps.indexOf(cur()); return eps[i - 1] || null; }
      function endCard(){
        var n = nextEp();
        return '<div class="ctr-end"><h3>จบตอนที่ ' + st.ep + ' แล้ว 🎉</h3>' +
          (n ? '<button type="button" class="ct-btn" data-go="next">ตอนถัดไป → EP.' + two(n.ep) + ' ' + esc(n.title) + '</button>' : '<div>นี่คือตอนล่าสุดของวิชานี้ — ตอนใหม่จะทยอยมา</div>') +
          '<button type="button" class="ct-btn ghost" data-go="again">↺ อ่านตอนนี้อีกรอบ</button><button type="button" class="ct-btn ghost" data-go="close">ปิด</button></div>';
      }
      function paint(){
        var e = cur(), total = e.pages;
        ttl.innerHTML = '<b>EP.' + two(e.ep) + '</b>' + esc(e.title); sel.value = String(e.ep);
        root.querySelectorAll('.ctr-mode button').forEach(function(b){ b.classList.toggle('on', b.dataset.m === st.mode); });
        stage.className = 'ctr-stage ' + st.mode;
        if (st.mode === 'page'){
          if (st.page >= total){ stage.innerHTML = endCard(); pg.textContent = 'จบตอน'; setProg(code, e.ep, 0); }
          else {
            stage.innerHTML = '<button type="button" class="ctr-nav l" aria-label="หน้าก่อน"' + ((st.page === 0 && !prevEp()) ? ' disabled' : '') + '>‹</button>' +
              '<img alt="EP.' + e.ep + ' หน้า ' + (st.page + 1) + '" src="' + pageUrl(code, e.ep, st.page + 1) + '" draggable="false">' +
              '<button type="button" class="ctr-nav r" aria-label="หน้าถัดไป">›</button>';
            pg.textContent = (st.page + 1) + ' / ' + total;
            setProg(code, e.ep, st.page);
            for (var k = 1; k <= 2; k++) if (st.page + k < total) (new Image()).src = pageUrl(code, e.ep, st.page + k + 1);   // โหลดหน้าถัดไปรอไว้
          }
        } else {
          var h = '';
          for (var i = 1; i <= total; i++) h += '<img loading="' + (i <= 3 ? 'eager' : 'lazy') + '" data-i="' + (i - 1) + '" alt="EP.' + e.ep + ' หน้า ' + i + '" src="' + pageUrl(code, e.ep, i) + '">';
          stage.innerHTML = h + endCard();
          pg.textContent = '1 / ' + total;
          if (st.page > 0 && st.page < total) setTimeout(function(){ var im = stage.querySelector('img[data-i="' + st.page + '"]'); if (im) stage.scrollTop = im.offsetTop - 8; }, 80);
          else stage.scrollTop = 0;
        }
        try { stage.focus({preventScroll: true}); } catch (x) {}
      }
      function go(dir){   // +1 / -1 (โหมดทีละหน้า)
        var e = cur();
        if (dir > 0){ if (st.page < e.pages) { st.page++; paint(); } }
        else if (st.page > 0){ st.page--; paint(); }
        else { var p = prevEp(); if (p){ st.ep = p.ep; st.page = p.pages - 1; paint(); } }
      }
      function openEp(n, pageNo){ st.ep = n; st.page = pageNo || 0; paint(); }

      stage.addEventListener('click', function(ev){
        var g = ev.target.closest('[data-go]');
        if (g){ var a = g.dataset.go; if (a === 'next'){ var n = nextEp(); if (n) openEp(n.ep, 0); } else if (a === 'again') openEp(st.ep, 0); else if (a === 'close') closeReader(); return; }
        if (st.mode !== 'page') return;
        if (ev.target.closest('.ctr-nav.l')) return go(-1);
        if (ev.target.closest('.ctr-nav.r')) return go(1);
        var im = ev.target.closest('img'); if (im){ var r = im.getBoundingClientRect(); go(ev.clientX < r.left + r.width * 0.35 ? -1 : 1); }
      });
      var sx = null;
      stage.addEventListener('touchstart', function(ev){ sx = ev.touches[0].clientX; }, {passive: true});
      stage.addEventListener('touchend', function(ev){
        if (sx == null || st.mode !== 'page') return; var dx = ev.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }, {passive: true});
      stage.addEventListener('scroll', function(){   // โหมดเลื่อน: อัปเดตเลขหน้า + จำตำแหน่ง
        if (st.mode !== 'scroll') return;
        if (stage._raf) return; stage._raf = requestAnimationFrame(function(){
          stage._raf = 0; var e = cur(), imgs = stage.querySelectorAll('img[data-i]'), top = stage.scrollTop + stage.clientHeight * 0.35, idx = 0;
          for (var i = 0; i < imgs.length; i++) if (imgs[i].offsetTop <= top) idx = i;
          st.page = idx; pg.textContent = (idx + 1) + ' / ' + e.pages; setProg(code, e.ep, idx);
        });
      }, {passive: true});
      root.querySelector('.ctr-x').addEventListener('click', closeReader);
      sel.addEventListener('change', function(){ openEp(+sel.value, 0); });
      root.querySelector('.ctr-mode').addEventListener('click', function(ev){
        var b = ev.target.closest('button'); if (!b) return; st.mode = b.dataset.m; setMode(st.mode);
        if (st.page >= cur().pages) st.page = 0; paint();
      });
      var key = function(ev){
        if (ev.key === 'Escape'){ ev.preventDefault(); closeReader(); return; }
        if (ev.target && ev.target.tagName === 'SELECT') return;
        if (st.mode === 'page'){
          if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || ev.key === ' ' || ev.key === 'ArrowDown'){ ev.preventDefault(); go(1); }
          else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp' || ev.key === 'ArrowUp'){ ev.preventDefault(); go(-1); }
        } else if (ev.key === ' ' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp' || ev.key === 'PageDown' || ev.key === 'PageUp' || ev.key === 'Home' || ev.key === 'End'){
          if (document.activeElement !== stage){ try { stage.focus({preventScroll: true}); } catch (x) {} }
        }
      };
      document.addEventListener('keydown', key, true);
      R = { root: root, key: key, prevOverflow: prevOverflow };
      if (!eps.some(function(e){ return e.ep === st.ep; })) st.ep = eps[0].ep;
      paint();
    });
  }

  /* ---------------------------------------------------------------- รายการตอนในหน้า */
  function mount(code, host, opts){
    addCss();
    var px = (opts && opts.idPrefix) || 'comics-';
    host.innerHTML = '<div class="ct-empty">กำลังโหลดการ์ตูน…</div>';
    return load().then(function(d){
      var s = subj(d, code);
      if (!s || !s.eps || !s.eps.length){
        host.innerHTML = '<div class="ct-intro"><span>🎭 <b>Cool Uncle Comics</b> — ยังไม่มีตอนของวิชานี้ กำลังทำ</span></div>'; return 0;
      }
      var prog = getProg(code), pe = prog && s.eps.filter(function(e){ return e.ep === prog.ep; })[0];
      var resume = pe ? '<button type="button" class="ct-btn" data-read="' + pe.ep + '" data-page="' + prog.page + '">▶ อ่านต่อ EP.' + two(pe.ep) + ' หน้า ' + (prog.page + 1) + '</button>' : '';
      var start = '<button type="button" class="ct-btn' + (pe ? ' ghost' : '') + '" data-read="' + s.eps[0].ep + '" data-page="0">' + (pe ? '↺ เริ่มจากตอนแรก' : '▶ เริ่มอ่านตั้งแต่ตอนที่ ' + s.eps[0].ep) + '</button>';
      var intro = '<div class="ct-intro"><span>🎭 <b>Cool Uncle Comics</b> — อ่านเต็มจอได้ทีละหน้าหรือเลื่อนต่อเนื่อง (กดปุ่ม ▶ หรือกดที่ตอนเพื่อดูในหน้านี้) · <a href="comics.html#' + esc(code) + '">การ์ตูนทุกวิชา →</a></span><span style="display:flex;gap:8px;flex-wrap:wrap">' + resume + start + '</span></div>';
      var m = location.hash.match(new RegExp('^#' + px + '(\\d+)$'));
      var openEp = m ? +m[1] : 0;
      host.innerHTML = intro + s.eps.map(function(e){
        var pages = '';
        for (var i = 1; i <= e.pages; i++){
          var u = pageUrl(s.code, e.ep, i);
          pages += '<a href="' + u + '" target="_blank" rel="noopener"><img loading="lazy" src="' + u + '" alt="EP.' + e.ep + ' หน้า ' + i + '"></a>';
        }
        return '<div class="ct-ep' + (openEp === e.ep ? ' open' : '') + '" id="' + px + e.ep + '">' +
          '<div class="ct-ep-head" role="button" tabindex="0"><span class="ct-ep-badge">EP.' + two(e.ep) + '</span>' +
          '<span class="ct-ep-title">' + esc(e.title) + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</span>' +
          '<span class="ct-ep-meta">' + e.pages + ' หน้า</span><button type="button" class="ct-btn" data-read="' + e.ep + '" data-page="0">▶ อ่าน</button></div>' +
          '<div class="ct-ep-body"><div class="ct-pages">' + pages + '</div></div></div>';
      }).join('');
      host.onclick = function(ev){
        var rd = ev.target.closest('[data-read]');
        if (rd){ ev.preventDefault(); openReader(code, +rd.dataset.read, +rd.dataset.page || 0); return; }
        var h = ev.target.closest('.ct-ep-head'); if (h) h.parentNode.classList.toggle('open');
      };
      host.onkeydown = function(ev){ if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('ct-ep-head')){ ev.preventDefault(); ev.target.parentNode.classList.toggle('open'); } };
      return s.eps.length;
    }).catch(function(){ host.innerHTML = '<div class="ct-empty">โหลดรายการการ์ตูนไม่สำเร็จ</div>'; return 0; });
  }

  /* หน้าที่ยังไม่มีแถบแท็บ: สร้างแถบ + ห่อเนื้อหาเดิมไว้ในแท็บ "สรุปรายครั้ง" */
  function install(code){
    addCss();
    var head = document.querySelector('.page-head');
    var end = document.querySelector('.coffee-widget');
    if (!head || !end) return;
    var readPanel = document.createElement('div'); readPanel.className = 'ct-panel active'; readPanel.id = 'ct-panel-read';
    var node = head.nextSibling;
    while (node && node !== end){ var nx = node.nextSibling; readPanel.appendChild(node); node = nx; }
    var comicsPanel = document.createElement('div'); comicsPanel.className = 'ct-panel'; comicsPanel.id = 'ct-panel-comics';
    var tabs = document.createElement('div'); tabs.className = 'ct-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'เลือกมุมมอง');
    tabs.innerHTML = '<button type="button" class="ct-tab active" role="tab" data-tab="read">📖 สรุปรายครั้ง</button>' +
                     '<button type="button" class="ct-tab" role="tab" data-tab="comics">🎭 Comics</button>';
    end.parentNode.insertBefore(tabs, end);
    end.parentNode.insertBefore(readPanel, end);
    end.parentNode.insertBefore(comicsPanel, end);
    var mounted = false;
    function show(name, keepHash){
      if (name === 'comics' && !mounted){
        mounted = true;
        mount(code, comicsPanel).then(function(n){
          if (n) tabs.querySelector('[data-tab="comics"]').textContent = '🎭 Comics (' + n + ' ตอน)';
          var m = location.hash.match(/^#comics-(\d+)$/);
          if (m){ var el = document.getElementById('comics-' + m[1]); if (el) el.scrollIntoView(); }
        });
      }
      tabs.querySelectorAll('.ct-tab').forEach(function(b){ b.classList.toggle('active', b.dataset.tab === name); });
      readPanel.classList.toggle('active', name === 'read');
      comicsPanel.classList.toggle('active', name === 'comics');
      try { if (typeof TTS !== 'undefined') TTS.stop(); } catch (e) {}
      if (!keepHash) { try { history.replaceState(null, '', name === 'comics' ? '#comics' : location.pathname + location.search); } catch (e) {} }
    }
    tabs.addEventListener('click', function(ev){ var b = ev.target.closest('.ct-tab'); if (b) show(b.dataset.tab); });
    if (/^#comics(-\d+)?$/.test(location.hash)) show('comics', true);
  }

  window.ComicsTab = { mount: mount, install: install, openReader: openReader, closeReader: closeReader };
})();
