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

  /* ---------- ขนาดตัวอักษร 3 ระดับ: ปกติ / อ่านง่าย / ตัวโต (ผู้สูงอายุ) ----------
     จำค่าไว้ใน localStorage ใช้ร่วมทุกหน้า · ใช้ zoom เพราะ CSS ของเว็บส่วนใหญ่กำหนดขนาดเป็น px */
  var FS_KEY = "cul-font-size";
  var FS_LEVELS = [
    { id: "normal", label: "ปกติ", px: 14 },
    { id: "easy", label: "อ่านง่าย", px: 17 },
    { id: "large", label: "ตัวโต (ผู้สูงอายุ)", px: 21 }
  ];
  function fsGet() {
    try { var v = localStorage.getItem(FS_KEY); if (v === "easy" || v === "large") return v; } catch (e) {}
    return "normal";
  }
  function fsApply(id) {
    var root = document.documentElement;
    if (id === "normal") root.removeAttribute("data-fs"); else root.setAttribute("data-fs", id);
    var btns = document.querySelectorAll("[data-fs-btn]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-fs-btn") === id;
      btns[i].classList.toggle("active", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }
  function fsSet(id) {
    try { if (id === "normal") localStorage.removeItem(FS_KEY); else localStorage.setItem(FS_KEY, id); } catch (e) {}
    fsApply(id);
  }
  function fsCSS() {
    if (document.getElementById("cul-fs-style")) return;
    var s = document.createElement("style");
    s.id = "cul-fs-style";
    s.textContent =
      "html[data-fs=easy]{zoom:1.12}" +
      "html[data-fs=easy] body{line-height:1.85;letter-spacing:.01em}" +
      "html[data-fs=large]{zoom:1.3}" +
      "html[data-fs=large] body{line-height:1.9;letter-spacing:.015em}" +
      ".cul-fs{display:inline-flex;align-items:flex-end;gap:2px;background:var(--card,#fff);border:1px solid var(--line,#E5E1D6);border-radius:999px;padding:3px;font-family:'Sarabun',system-ui,sans-serif}" +
      ".cul-fs button{border:none;background:transparent;color:var(--ink,#22283A);border-radius:999px;min-width:30px;height:30px;padding:0 6px;cursor:pointer;font-family:inherit;font-weight:700;line-height:1}" +
      ".cul-fs button:hover{background:var(--line,#E5E1D6)}" +
      ".cul-fs button.active{background:var(--accent,#2E4A7A);color:#fff}" +
      ".cul-fs button:focus-visible{outline:2px solid var(--accent,#2E4A7A);outline-offset:2px}" +
      ".cul-fs-float{position:fixed;left:12px;bottom:12px;z-index:998;box-shadow:0 2px 10px rgba(34,40,58,.15)}" +
      "@media(max-width:760px){.cul-fs{position:fixed;left:10px;bottom:10px;z-index:998;box-shadow:0 2px 10px rgba(34,40,58,.15)}}" +
      "@media print{.cul-fs{display:none!important}}";
    document.head.appendChild(s);
  }
  function fsControl() {
    if (document.querySelector(".cul-fs")) return;
    var box = document.createElement("div");
    box.className = "cul-fs";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "ขนาดตัวอักษร");
    FS_LEVELS.forEach(function (L) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = "ก";
      b.style.fontSize = L.px + "px";
      b.title = "ขนาดตัวอักษร: " + L.label;
      b.setAttribute("aria-label", "ขนาดตัวอักษร " + L.label);
      b.setAttribute("data-fs-btn", L.id);
      b.addEventListener("click", function () { fsSet(L.id); });
      box.appendChild(b);
    });
    // หน้าแรกมีปุ่มธีมบนแถบบน → วางต่อท้ายปุ่มธีม ; หน้าอื่นลอยมุมซ้ายล่าง
    var anchor = document.querySelector(".theme-toggle");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling);
    else { box.classList.add("cul-fs-float"); document.body.appendChild(box); }
    fsApply(fsGet());
  }
  fsCSS();
  fsApply(fsGet());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectCSS("legal-disclaimer.css");
      injectDisclaimer();
      fsControl();
    });
  } else {
    injectCSS("legal-disclaimer.css");
    injectDisclaimer();
    fsControl();
  }
})();
