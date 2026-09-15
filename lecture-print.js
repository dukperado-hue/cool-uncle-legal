/* lecture-print.js — adds "print this lecture" and "print all" buttons to any
   subject page built on the standard .lecture-list/.lecture-row/.lecture-head
   markup (see iplaw.html for the reference template). Works purely off the
   rendered DOM, so it needs no knowledge of each page's own LECTURES array or
   render function names. Include with:
     <script src="lecture-print.js"></script>
   placed after the page's own renderLectures() call so the rows already exist. */
(function(){
  function injectStyle(){
    if (document.getElementById('lecture-print-style')) return;
    var css = [
      '#printArea{display:none}',
      '.print-bar{display:flex;justify-content:flex-end;margin:6px 0 14px}',
      '.print-all-btn{background:var(--card,#FDFCF8);color:var(--ink,#22283A);border:1px solid var(--line,#E5E1D6);border-radius:8px;padding:7px 13px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit}',
      '.print-all-btn:hover{border-color:var(--gold,#B08A3C);color:var(--gold,#B08A3C)}',
      '.lecture-print-btn{background:transparent;border:1px solid var(--line,#E5E1D6);border-radius:6px;width:26px;height:26px;flex-shrink:0;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;justify-content:center;margin-right:4px;color:var(--ink-soft,#5A6072)}',
      '.lecture-print-btn:hover{border-color:var(--gold,#B08A3C)}',
      '@media print{',
      '  body *{visibility:hidden}',
      '  #printArea{display:block !important;visibility:visible;position:absolute;left:0;top:0;width:100%;padding:24px}',
      '  #printArea, #printArea *{visibility:visible}',
      '  #printArea, #printArea *{color:#111 !important;background:transparent !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '  #printArea h1{font-size:20px;margin-bottom:4px}',
      '  #printArea h2{font-size:15.5px;margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid #999}',
      '  #printArea .print-lecture-body{font-size:13px;line-height:1.7;white-space:pre-line}',
      '  #printArea mark{background:#fdeeb0 !important}',
      '  #printArea .exercise-box{border:1px solid #999 !important;background:#f5f0df !important;padding:10px 12px;border-radius:6px;margin:10px 0}',
      '  #printArea .print-video-link{font-size:12px;margin:6px 0}',
      '  #printArea img{max-width:100%;page-break-inside:avoid}',
      '  #printArea .lecture-img-pair{display:flex;gap:8px}',
      '  #printArea .lecture-img-pair img{height:160px;width:auto}',
      '  #printArea .lecture-img-inline{float:none;width:auto;margin:8px 0}',
      '}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'lecture-print-style';
    style.textContent = css;
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

  function printableBodyHtml(row){
    var body = row.querySelector('.lecture-body');
    if (!body) return '';
    var clone = body.cloneNode(true);
    clone.querySelectorAll('img').forEach(function(img){ img.removeAttribute('loading'); });
    clone.querySelectorAll('.lecture-video').forEach(function(v){
      var iframe = v.querySelector('iframe');
      var src = iframe ? (iframe.getAttribute('src') || '') : '';
      var m = src.match(/embed\/([^"?]+)/);
      var link = m ? ('https://youtu.be/' + m[1]) : src;
      v.outerHTML = link ? ('<p class="print-video-link">📺 วิดีโอประกอบ: ' + link + '</p>') : '';
    });
    return clone.innerHTML;
  }

  function buildFragment(rows){
    var html = '<h1>' + pageTitle() + '</h1>';
    rows.forEach(function(row){
      var numEl = row.querySelector('.lecture-num');
      var titleEl = row.querySelector('.lecture-title');
      var num = numEl ? numEl.textContent.trim() : '';
      var title = titleEl ? titleEl.textContent.trim() : '';
      html += '<h2>ครั้งที่ ' + num + ': ' + title + '</h2><div class="print-lecture-body">' + printableBodyHtml(row) + '</div>';
    });
    return html;
  }

  function printRows(rows){
    if (!rows.length) return;
    injectStyle();
    var area = ensurePrintArea();
    area.innerHTML = buildFragment(rows);
    setTimeout(function(){ window.print(); }, 60);
  }

  window.printLectureRow = function(row){ printRows([row]); };
  window.printAllLectures = function(list){
    printRows(Array.prototype.slice.call(list.querySelectorAll('.lecture-row')));
  };

  function init(){
    injectStyle();
    ensurePrintArea();

    document.querySelectorAll('.lecture-list').forEach(function(list){
      var prev = list.previousElementSibling;
      if (prev && prev.classList.contains('print-bar')) return;
      var bar = document.createElement('div');
      bar.className = 'print-bar';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'print-all-btn';
      btn.innerHTML = '🖨️ พิมพ์ทั้งหมด';
      btn.addEventListener('click', function(){ window.printAllLectures(list); });
      bar.appendChild(btn);
      list.parentNode.insertBefore(bar, list);
    });

    document.querySelectorAll('.lecture-head').forEach(function(head){
      if (head.querySelector('.lecture-print-btn')) return;
      var row = head.closest('.lecture-row');
      if (!row) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lecture-print-btn';
      btn.title = 'พิมพ์บรรยายครั้งนี้';
      btn.textContent = '🖨️';
      btn.addEventListener('click', function(e){ e.stopPropagation(); window.printLectureRow(row); });
      var toggle = head.querySelector('.lecture-toggle');
      if (toggle) head.insertBefore(btn, toggle); else head.appendChild(btn);
    });
  }

  init();
})();
