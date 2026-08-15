/* Legal footer + video credit bar — auto-injected on every page of coolunclelab.com */
(function () {
  "use strict";
  var DISCLAIMER = "การจัดทำสื่อนี้เพื่อแสดงความเห็น และความเกี่ยวข้องเชิงกฎหมายโดยสุจริตตามข่าวที่เกิด ไม่ใช่ข้อเท็จจริงทั้งหมด โปรดตรวจสอบข้อมูลเพิ่มเติมจากแหล่งข่าวที่น่าเชื่อถืออีกครั้ง";

  function injectDisclaimer() {
    if (document.querySelector(".legal-disclaimer-bar")) return;
    var bar = document.createElement("div");
    bar.className = "legal-disclaimer-bar";
    bar.innerHTML = '<span class="ld-label">⚖️ คำชี้แจง: </span>' + DISCLAIMER;
    // prefer body end, but before any existing <footer> if present at body level
    var footers = Array.prototype.slice.call(document.body.querySelectorAll("footer"));
    var lastFooter = footers.length ? footers[footers.length - 1] : null;
    if (lastFooter) {
      lastFooter.parentNode.insertBefore(bar, lastFooter.nextSibling);
    } else {
      document.body.appendChild(bar);
    }
  }

  function injectCSS(href) {
    if (document.querySelector('link[href$="' + href + '"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectCSS("legal-disclaimer.css");
      injectDisclaimer();
    });
  } else {
    injectCSS("legal-disclaimer.css");
    injectDisclaimer();
  }
})();
