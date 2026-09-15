/* study-print.js — adds "print this reading" / "print all" buttons to any
   subject page built on the shared .study-panel reading-mode markup
   (civpro.html, legalhist.html, tort.html, property.html, inheritance.html,
   familylaw.html, debt.html, constlaw.html, commcontract.html, biz-org.html,
   adminlaw.html).

   Unlike lecture-print.js (for the .lecture-list pages, where every row is
   always in the DOM), these pages render only the CURRENTLY selected
   topic/lecture into #study-panel/.study-panel and swap it on click or tab
   change — sometimes destroying and recreating the whole panel (SPA-style
   single-root re-render, e.g. civpro.html's reading tab). So this script
   can't discover "all rows" generically off the DOM the way lecture-print.js
   does. Instead:
     - "print this reading" always works generically: it prints whatever is
       on screen right now, and a MutationObserver keeps the button
       present/enabled across those re-renders.
     - "print all" only appears if the page defines a global
       window.buildStudyPrintAll() returning an array of already-rendered
       HTML strings (one per topic/lecture), built from that page's own data
       array + helpers — see the small per-page adapter script placed just
       before this file's <script> tag. No adapter, no "print all" button;
       "print this reading" still works either way.
   Include with:
     <script src="study-print.js"></script>
   placed near the end of <body>, after the page's own render scripts AND
   after that page's buildStudyPrintAll adapter (if any). */
(function(){
  var PANEL_SELECTOR = '#study-panel, .study-panel';
  var STRIP_SELECTORS = ['.study-toc', '.study-nav', '.tts-bar', '.study-progress', '.read-btn', 'button', '[id$="-sentinel"]'];

  /* ---- screen-only CSS (button chrome, only visible while browsing) ---- */
  var SCREEN_CSS = [
    '#printArea{display:none}',
    '.study-print-bar{display:flex;justify-content:flex-end;margin:6px 0 14px}',
    '.study-print-btn{background:var(--card,#FDFCF8);color:var(--ink,#22283A);border:1px solid var(--line,#E5E1D6);border-radius:8px;padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit}',
    '.study-print-btn:hover{border-color:var(--gold,#B08A3C);color:var(--gold,#B08A3C)}',
    '.study-print-btn:disabled{opacity:.4;cursor:default;pointer-events:none}'
  ].join('\n');

  /* ---- print-only CSS: same binding-margin spec as lecture-print.js —
     left 30mm (spiral/comb "กระดูกงู" punch side), right/top/bottom 20mm.
     Keep both files' PRINT_CSS in sync if the spec ever changes. ---- */
  var PRINT_CSS = [
    '@media print{',
    '  @page{margin:20mm 20mm 20mm 30mm}',
    '  body *{visibility:hidden}',
    '  #printArea{display:block !important;visibility:visible;position:absolute;left:0;top:0;width:100%;padding:0}',
    '  #printArea, #printArea *{visibility:visible}',
    '  #printArea, #printArea *{color:#111 !important;background:transparent !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
    '  #printArea h1{font-size:20px;margin-bottom:12px}',
    '  #printArea .study-head,#printArea .study-title{font-size:15.5px;font-weight:700;margin:0 0 10px;padding-bottom:5px;border-bottom:1px solid #999}',
    '  #printArea img{max-width:100%;page-break-inside:avoid}',
    '  #printArea table{border-collapse:collapse;width:100%}',
    '  #printArea th,#printArea td{border:1px solid #999;padding:5px 7px}',
    '  #printArea .examAns{display:block !important}',
    '  #printArea .print-study-section{page-break-before:always;padding-top:2px}',
    '  #printArea .print-study-section:first-child{page-break-before:avoid}',
    '}'
  ].join('\n');

  function injectStyle(){
    if (document.getElementById('study-print-style')) return;
    var style = document.createElement('style');
    style.id = 'study-print-style';
    style.textContent = SCREEN_CSS + '\n' + PRINT_CSS;
    document.head.appendChild(style);
  }

  function ensurePrintArea(){
    var area = document.getElementById('printArea');
    if (!area) {
      area = document.createElement('div');
      area.id = 'printArea';
      document.body.appendChild(area);
    }
    return area;
  }

  function pageTitle(){
    var h1 = document.querySelector('.page-head h1');
    return (h1 && h1.textContent.trim()) || document.title;
  }

  function currentPanel(){
    return document.querySelector(PANEL_SELECTOR);
  }

  function strippedClone(panel){
    var clone = panel.cloneNode(true);
    STRIP_SELECTORS.forEach(function(sel){
      clone.querySelectorAll(sel).forEach(function(el){ el.remove(); });
    });
    clone.querySelectorAll('img').forEach(function(img){ img.removeAttribute('loading'); });
    return clone;
  }

  function hasContent(panel){
    if (!panel) return false;
    return strippedClone(panel).textContent.trim().length > 0;
  }

  window.printStudyPanel = function(){
    var panel = currentPanel();
    if (!hasContent(panel)) return;
    injectStyle();
    var area = ensurePrintArea();
    area.innerHTML = '<h1>' + pageTitle() + '</h1>' + strippedClone(panel).innerHTML;
    setTimeout(function(){ window.print(); }, 60);
  };

  window.printStudyAll = function(){
    if (typeof window.buildStudyPrintAll !== 'function') return;
    var htmls = window.buildStudyPrintAll();
    if (!htmls || !htmls.length) return;
    injectStyle();
    var wrap = document.createElement('div');
    wrap.innerHTML = htmls.map(function(h){ return '<section class="print-study-section">' + h + '</section>'; }).join('');
    STRIP_SELECTORS.forEach(function(sel){
      wrap.querySelectorAll(sel).forEach(function(el){ el.remove(); });
    });
    wrap.querySelectorAll('img').forEach(function(img){ img.removeAttribute('loading'); });
    var area = ensurePrintArea();
    area.innerHTML = '<h1>' + pageTitle() + '</h1>' + wrap.innerHTML;
    setTimeout(function(){ window.print(); }, 60);
  };

  function makeBar(){
    var bar = document.createElement('div');
    bar.className = 'study-print-bar';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'study-print-btn';
    btn.innerHTML = '🖨️ พิมพ์บทอ่านนี้';
    btn.addEventListener('click', function(){ window.printStudyPanel(); });
    bar.appendChild(btn);
    if (typeof window.buildStudyPrintAll === 'function') {
      var btnAll = document.createElement('button');
      btnAll.type = 'button';
      btnAll.className = 'study-print-btn study-print-all-btn';
      btnAll.innerHTML = '🖨️ พิมพ์ทั้งหมด';
      btnAll.addEventListener('click', function(){ window.printStudyAll(); });
      bar.appendChild(btnAll);
    }
    return bar;
  }

  function sync(){
    var panel = currentPanel();
    if (!panel) return;
    var bar = panel.previousElementSibling;
    if (!bar || !bar.classList || !bar.classList.contains('study-print-bar')) {
      bar = makeBar();
      panel.parentNode.insertBefore(bar, panel);
    }
    bar.querySelector('.study-print-btn').disabled = !hasContent(panel);
  }

  var syncQueued = false;
  function scheduleSync(){
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(function(){ syncQueued = false; sync(); });
  }

  function init(){
    injectStyle();
    ensurePrintArea();
    sync();
    new MutationObserver(scheduleSync).observe(document.body, { childList: true, subtree: true });
  }

  init();
})();
