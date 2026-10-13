/* comics-tab.js — แท็บ "🎭 Comics" ใช้ร่วมกันทุกหน้าวิชา (อ่านรายการจาก comics/index.json)
   ใช้งาน:  <script src="comics-tab.js?v=1"></script>  แล้วเรียก
     ComicsTab.install('iplaw')            หน้าที่ยังไม่มีแถบแท็บ: สร้างแถบ 📖 สรุปรายครั้ง / 🎭 Comics ให้เอง
     ComicsTab.mount('constproc', element) หน้าที่มีแถบแท็บอยู่แล้ว: วาดตอนการ์ตูนลงใน element ที่ให้ */
(function(){
  var V = '1';
  var css = [
    '.ct-tabs{display:flex;gap:8px;margin:22px 0 18px;flex-wrap:wrap}',
    '.ct-tab{flex:1;min-width:150px;background:var(--card,#fff);border:1px solid var(--line,#e2ded3);border-radius:12px;padding:12px 14px;font:inherit;font-size:14px;font-weight:700;color:var(--ink-soft,#5A6072);cursor:pointer;transition:all .15s;text-align:center}',
    '.ct-tab.active{background:var(--accent,#c0392b);color:#fff;border-color:var(--accent,#c0392b)}',
    '.ct-tab:hover:not(.active){border-color:var(--gold,#b8892b)}',
    '.ct-panel{display:none}',
    '.ct-panel.active{display:block}',
    '.ct-intro{background:var(--card,#fff);border:1px solid var(--line,#e2ded3);border-radius:14px;padding:14px 16px;margin-bottom:14px;color:var(--ink-soft,#5A6072);font-size:14px;line-height:1.7}',
    '.ct-intro a{color:var(--accent,#c0392b);font-weight:700}',
    '.ct-ep{background:var(--card,#fff);border:1px solid var(--line,#e2ded3);border-radius:16px;margin-bottom:14px;overflow:hidden}',
    '.ct-ep-head{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left}',
    '.ct-ep-badge{flex:none;background:var(--accent,#c0392b);color:#fff;font-weight:900;border-radius:10px;padding:6px 10px;font-size:13px;letter-spacing:.5px}',
    ':root[data-theme="dark"] .ct-ep-badge,:root[data-theme="horror"] .ct-ep-badge{background:var(--gold-soft,#3a3320);color:var(--gold,#e0b95a)}',
    '.ct-ep-title{flex:1;font-weight:800;color:var(--ink,#22283A);line-height:1.4}',
    '.ct-ep-title small{display:block;font-weight:600;color:var(--ink-faint,#8a8fa0);font-size:12.5px;margin-top:2px}',
    '.ct-ep-meta{flex:none;color:var(--ink-faint,#8a8fa0);font-size:12.5px;white-space:nowrap}',
    '.ct-ep-body{display:none;padding:0 12px 14px}',
    '.ct-ep.open .ct-ep-body{display:block}',
    '.ct-pages{display:flex;flex-direction:column;gap:14px;align-items:center;margin:6px 0 4px}',
    '.ct-pages img{width:100%;max-width:720px;height:auto;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.25);display:block}',
    '.ct-empty{color:var(--ink-soft,#5A6072);padding:20px 4px}'
  ].join('\n');
  var styled = false;
  function addCss(){
    if (styled) return; styled = true;
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function two(n){ return ('0' + n).slice(-2); }

  var dataP = null;
  function load(){
    if (!dataP) dataP = fetch('comics/index.json?v=' + V).then(function(r){ return r.json(); });
    return dataP;
  }

  function mount(code, host){
    addCss();
    host.innerHTML = '<div class="ct-empty">กำลังโหลดการ์ตูน…</div>';
    return load().then(function(d){
      var s = (d.subjects || []).filter(function(x){ return x.code === code; })[0];
      var intro = '<div class="ct-intro">🎭 <b>Cool Uncle Comics</b> — เรียนผ่านการ์ตูนทีละครั้งเรียน กดที่ตอนเพื่อเปิดอ่านทุกหน้า (แตะรูปเพื่อดูขนาดเต็ม) · <a href="comics.html#' + esc(code) + '">ดูการ์ตูนทุกวิชา →</a></div>';
      if (!s || !s.eps || !s.eps.length){ host.innerHTML = intro + '<div class="ct-empty">ยังไม่มีตอนของวิชานี้ — กำลังทำ</div>'; return 0; }
      var m = location.hash.match(/^#comics-(\d+)$/);
      var openEp = m ? +m[1] : 0;
      host.innerHTML = intro + s.eps.map(function(e){
        var pages = '';
        for (var i = 1; i <= e.pages; i++){
          var u = 'comics/' + s.code + '/ep' + two(e.ep) + '/web/p' + i + '.jpg?v=' + V;
          pages += '<a href="' + u + '" target="_blank" rel="noopener"><img loading="lazy" src="' + u + '" alt="EP.' + e.ep + ' หน้า ' + i + '"></a>';
        }
        return '<div class="ct-ep' + (openEp === e.ep ? ' open' : '') + '" id="comics-' + e.ep + '">' +
          '<button type="button" class="ct-ep-head"><span class="ct-ep-badge">EP.' + two(e.ep) + '</span>' +
          '<span class="ct-ep-title">' + esc(e.title) + (e.sub ? '<small>' + esc(e.sub) + '</small>' : '') + '</span>' +
          '<span class="ct-ep-meta">' + e.pages + ' หน้า ▾</span></button>' +
          '<div class="ct-ep-body"><div class="ct-pages">' + pages + '</div></div></div>';
      }).join('');
      host.addEventListener('click', function(ev){
        var h = ev.target.closest('.ct-ep-head'); if (h) h.parentNode.classList.toggle('open');
      });
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

  window.ComicsTab = { mount: mount, install: install };
})();
