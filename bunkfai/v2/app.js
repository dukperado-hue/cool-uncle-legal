/* แจ้งก่อนจุด v2 — ต้นแบบระบบรับคำขอ (Sandbox)
 * ข้อมูล: v2/data/*.js (สร้างจาก v1 ด้วย v2/build_data.js)  ·  สถานะ: ทดสอบ ไม่มีข้อมูลจริง
 * โครงไฟล์: helpers → ข้อมูล/GIS → state → layers registry → router/shell → views */
(function () {
'use strict';
var BF = window.BF = window.BF || {};
var D = window.BF_DATA || {};
var AIR = D.airspace || { airports: [], lhzKm: 10, meta: {} };
var REG = (D.regulations && D.regulations.provinces) || [];
var AM = (D.amphoes && D.amphoes.byProvinceEn) || {};
var CT = D.contacts || {};

/* ================= helpers ================= */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ic(n, c) { return '<span class="ms ' + (c || '') + '" aria-hidden="true">' + n + '</span>'; }
function iso(d) { var x = new Date(Date.now() + d * 864e5); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
function fmtDate(s) { if (!s) return '-'; var p = s.split('-'); return (+p[2]) + ' ' + ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][+p[1] - 1] + ' ' + (+p[0] + 543); }
function fmtTs(t) { try { return new Date(t).toLocaleString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3400); }
function daysFromToday(s) { return Math.round((new Date(s + 'T00:00:00') - new Date(iso(0) + 'T00:00:00')) / 864e5); }

/* ================= GIS (พอร์ตจาก v1 app.js) ================= */
function rad(d) { return d * Math.PI / 180; }
function hav(a, b) {
  var dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
function bearing(a, b) {
  var dLon = rad(b[1] - a[1]), la1 = rad(a[0]), la2 = rad(b[0]);
  var y = Math.sin(dLon) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}
function crossTrack(ap, pt, brg) {
  var ang = hav(ap, pt) / 6371, init = rad(bearing(ap, pt));
  return Math.abs(Math.asin(Math.sin(ang) * Math.sin(init - rad(brg)))) * 6371;
}
var LHZ = AIR.lhzKm || 10;
function nearestAirports(lat, lon, n) {
  return AIR.airports.map(function (a) { return { d: hav([lat, lon], [a.lat, a.lon]), ap: a }; }).sort(function (x, y) { return x.d - y.d; }).slice(0, n || 1);
}
// คืนรายการเขตที่จุดนี้อยู่ (LHZ / PHZ) เรียงตามระยะ — ตรรกะเดียวกับ v1
function clearance(lat, lon) {
  var pt = [lat, lon], hits = [];
  AIR.airports.forEach(function (ap) {
    var d = hav(pt, [ap.lat, ap.lon]);
    if (d <= LHZ) {
      hits.push({ icao: ap.icao, nameTh: ap.nameTh, type: 'LHZ', label: 'เขตห้าม 10 กม. รอบท่าอากาศยาน (LHZ)', d: d, rule: 'ห้ามจุด/ปล่อยวัตถุขึ้นอากาศ เว้นแต่ได้รับอนุญาตจากผู้จัดการ/ผู้ประกอบท่าอากาศยาน' });
      return;
    }
    var hit = null;
    (ap.phz_bands || []).forEach(function (band) {
      if (hit || d < band.d0 || d > band.d1) return;
      var brg = ap.rwyBearingDeg;
      for (var dir = 0; dir < 2 && !hit; dir++) {
        var b = dir === 0 ? brg : (brg + 180) % 360;
        var rel = (((bearing([ap.lat, ap.lon], pt) - b + 540) % 360) - 180);
        if (Math.abs(rel) > 90) continue;
        var half = d * Math.tan(rad(band.halfAngleDeg));
        if (band.d1 <= 3 && band.d0 === 0) half = (band.w0 + (band.w1 - band.w0) * d / band.d1) / 2;
        if (crossTrack([ap.lat, ap.lon], pt, b) < half) hit = band;
      }
    });
    if (hit) hits.push({ icao: ap.icao, nameTh: ap.nameTh, type: 'PHZ', label: hit.nameTh, d: d, rule: 'แนวขึ้น-ลงเครื่องบิน (PHZ) — ห้ามปล่อยวัตถุเด็ดขาด' });
  });
  return hits.sort(function (a, b) { return a.d - b.d; });
}
function nearestProvince(lat, lon) {
  var best = null;
  REG.forEach(function (p) { var d = hav([lat, lon], [p.lat, p.lon]); if (!best || d < best.d) best = { d: d, p: p }; });
  return best && best.p;
}
function provOf(th) { return REG.filter(function (p) { return p.th === th; })[0] || null; }
function amphoesOf(th) {
  var p = provOf(th); if (!p) return [];
  return AM[p.en === 'Bangkok' ? 'Bangkok Metropolis' : p.en] || AM[p.en] || [];
}
function atcOf(icao) { return (CT.atc && CT.atc[icao]) || null; }
// เบอร์ที่ทำการอำเภอ (ชุดข้อมูลจาก v1 — บางอำเภอไม่มีเบอร์ จะคืน null)
function amphoeContact(prov, th) {
  var a = amphoesOf(prov).filter(function (x) { return x.th === th; })[0];
  var c = a && D.amphoeContacts && D.amphoeContacts[a.catm];
  return c && c.has_phone ? c : null;
}
function telLink(s) { var m = String(s || '').match(/[0-9][0-9\-\s]{6,}/); return m ? '<a class="tel" href="tel:' + m[0].replace(/[^0-9]/g, '') + '">' + esc(s) + '</a>' : esc(s); }

/* ================= ตัวจำลองวิถี (พอร์ตจาก v1 — ประมาณการอย่างง่าย ไม่ใช่ค่ารับรอง) ================= */
var SIM = {
  mun: { label: 'บั้งไฟหมื่น (≈ 30 กก.)', mode: 'rocket', v0: 25, mass: 30, thrust: 620, tburn: 2.4, peakM: 500 },
  saen: { label: 'บั้งไฟแสน (≈ 120 กก.)', mode: 'rocket', v0: 30, mass: 120, thrust: 2300, tburn: 5.0, peakM: 1100 },
  lan: { label: 'บั้งไฟล้าน (≈ 1,000 กก.)', mode: 'rocket', v0: 35, mass: 1000, thrust: 19000, tburn: 8.5, peakM: 3000 },
  plu: { label: 'พลุ / ตะไล', mode: 'rocket', v0: 60, mass: 1, thrust: 62, tburn: 1.2, peakM: 300 },
  khom: { label: 'โคมลอย / โคมไฟ', mode: 'khom', riseV: 3, burnMin: 45, fallV: 2, peakM: 1500 }
};
var SIM_DEFAULT = { bangfai: 'saen', komloy: 'khom', talai: 'plu', plu: 'plu', other: 'plu' };
function simPeakM(k) {
  var t = SIM[k];
  if (t.mode === 'khom') return Math.min(t.riseV * t.burnMin * 60, t.peakM);
  var g = 9.81, rho = 1.1, cd = 0.7, A = 0.02, dt = 0.005, v = t.v0, z = 0, tt = 0, mass = t.mass, rate = (0.65 * t.mass) / t.tburn, peak = 0;
  while (tt < 600) {
    var drag = 0.5 * rho * cd * A * v * v, a;
    if (tt < t.tburn) { a = (t.thrust - drag) / mass - g; mass -= rate * dt; } else a = -drag / Math.max(mass, 0.05) - g;
    v += a * dt; z += v * dt; tt += dt; if (z > peak) peak = z; if (v < 0 && z <= 0) break;
  }
  return Math.min(peak, t.peakM * 1.1);
}
function simDriftKm(k) { // ลม 5 ม./วิ
  var t = SIM[k], peak = simPeakM(k), wind = 5;
  return t.mode === 'khom' ? Math.round((peak / (t.fallV * 1000) * wind + t.burnMin * wind / 60) * 10) / 10 : peak / 15 * wind / 1000;
}

/* ================= ชนิด/สถานะ ================= */
var STATUS = {
  draft: ['ร่าง', 'edit_note', 'off'], submitted: ['ส่งแล้ว', 'send', 'info'], review: ['อยู่ระหว่างพิจารณา', 'hourglass_top', 'wait'],
  info: ['ขอข้อมูลเพิ่ม', 'help', 'wait'], approved: ['อนุมัติแล้ว', 'check_circle', 'ok'], rejected: ['ไม่อนุมัติ', 'block', 'bad'],
  cancelled: ['ยกเลิก', 'cancel', 'off'], expired: ['หมดอายุ', 'schedule', 'off']
};
var LAUNCH = { none: 'ยังไม่ถึงวันจุด', asked: 'รอไฟเขียวจากหน่วยควบคุมจราจรทางอากาศ', green: 'ได้รับไฟเขียว', denied: 'ยังไม่ให้จุด', burning: 'กำลังจุด/ปล่อย', paused: 'พักชั่วคราว', ended: 'สิ้นสุดแล้ว' };
var TYPES = {
  bangfai: ['บั้งไฟ', 'rocket_launch', 'หมื่น / แสน / ล้าน'], komloy: ['โคมลอย', 'cloud', 'โคมควัน / โคมไฟ'],
  talai: ['ตะไล', 'toys_fan', 'ตะไลหมุน / ตะไลแตก'], plu: ['พลุ / ดอกไม้เพลิง', 'auto_awesome', 'มหรสพ / งานฉลอง'], other: ['อื่น ๆ', 'more_horiz', 'วัตถุคล้ายคลึงกัน']
};
function chip(s, cls) { var x = STATUS[s] || [s, 'info', 'off']; return '<span class="chip ' + (cls || '') + ' ' + x[2] + '">' + ic(x[1], 'fill sm') + esc(x[0]) + '</span>'; }

/* ================= state ================= */
var KEY = 'bf_v2_sandbox', SESS = 'bf_v2_session';
var S, session = null;
function mk(id, own, name, type, qty, prov, amp, lat, lon, dd, from, to, status, hist, extra) {
  var r = { id: id, no: 'BF-2569-' + ('000' + id).slice(-4), owner: own, applicant: name, phone: '08x-xxx-' + ('0000' + (1000 + id * 37)).slice(-4), type: type, qty: qty, province: prov, amphoe: amp, tambon: '', place: '', lat: lat, lon: lon, date: iso(dd), from: from, to: to, status: status, launch: 'none', history: hist, permit: null, ceil: '', contacts: [] };
  for (var k in extra || {}) r[k] = extra[k];
  return r;
}
function seed() {
  var N = Date.now(), H = 36e5;
  return { seq: 8, users: [['สมชาย ใจดี (ทดสอบ)', 'ประชาชน', 'ThaID (จำลอง)'], ['สมหญิง รักษ์ถิ่น (ทดสอบ)', 'ประชาชน', 'บัญชีชั่วคราว'], ['นายอำเภอ ตัวอย่าง ก', 'นายอำเภอ', 'ชื่อผู้ใช้/รหัสผ่าน'], ['ปลัดจังหวัด ตัวอย่าง', 'ปลัดจังหวัด', 'ชื่อผู้ใช้/รหัสผ่าน'], ['เจ้าหน้าที่ ATC ตัวอย่าง', 'ATC', 'ชื่อผู้ใช้/รหัสผ่าน'], ['ผู้ดูแล ตัวอย่าง', 'ผู้ดูแลระบบ', 'ชื่อผู้ใช้/รหัสผ่าน']], requests: [
    mk(1, 'me', 'สมชาย ใจดี (ทดสอบ)', 'bangfai', 20, 'ร้อยเอ็ด', 'เมืองร้อยเอ็ด', 16.0450, 103.6900, 6, '09:00', '12:00', 'approved', [{ t: N - 30 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }, { t: N - 26 * H, by: 'นายอำเภอ', s: 'review', n: 'เริ่มพิจารณา' }, { t: N - 20 * H, by: 'นายอำเภอ', s: 'approved', n: 'ครบถ้วน อยู่นอกเขต LHZ' }], { permit: 'BF-P-2569-0001', place: 'ลานกิจกรรมทุ่งนา หมู่ 4', ceil: '5000', contacts: [['นายสมหมาย ใจดี (ทดสอบ)', '081-234-5678'], ['นายประเสริฐ สุขี (ทดสอบ)', '089-876-5432']] }),
    mk(2, 'me', 'สมชาย ใจดี (ทดสอบ)', 'komloy', 50, 'บุรีรัมย์', 'เมืองบุรีรัมย์', 15.2000, 103.2600, 4, '18:00', '20:00', 'rejected', [{ t: N - 50 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }, { t: N - 40 * H, by: 'นายอำเภอ', s: 'rejected', n: 'พื้นที่อยู่ในเขต LHZ รอบท่าอากาศยานบุรีรัมย์ กรุณาเลือกพื้นที่ใหม่' }], { place: 'ลานวัด' }),
    mk(3, 'me', 'สมชาย ใจดี (ทดสอบ)', 'talai', 100, 'ยโสธร', 'เมืองยโสธร', 15.7900, 104.1400, 12, '14:00', '16:00', 'submitted', [{ t: N - 3 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }], { place: 'ลานกิจกรรม ต.ตาดทอง' }),
    mk(4, 'o', 'สมหญิง รักษ์ถิ่น (ทดสอบ)', 'bangfai', 15, 'ยโสธร', 'ป่าติ้ว', 15.8200, 104.0500, 12, '10:00', '13:00', 'review', [{ t: N - 8 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }, { t: N - 5 * H, by: 'นายอำเภอ', s: 'review', n: 'เริ่มพิจารณา' }]),
    mk(5, 'o', 'ประเสริฐ บ้านนา (ทดสอบ)', 'komloy', 30, 'ขอนแก่น', 'เมืองขอนแก่น', 16.4300, 102.8200, 5, '19:00', '21:00', 'submitted', [{ t: N - 2 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }]),
    mk(6, 'o', 'บุญมี มีสุข (ทดสอบ)', 'bangfai', 25, 'ร้อยเอ็ด', 'เมืองร้อยเอ็ด', 16.0600, 103.7000, 6, '11:00', '14:00', 'info', [{ t: N - 20 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }, { t: N - 10 * H, by: 'นายอำเภอ', s: 'info', n: 'ขอรายละเอียดผู้ประสานงานคนที่ 2' }]),
    mk(7, 'o', 'วิชัย ทองดี (ทดสอบ)', 'plu', 10, 'อุดรธานี', 'เมืองอุดรธานี', 17.3900, 102.7900, 3, '20:00', '22:00', 'approved', [{ t: N - 60 * H, by: 'ผู้ขอ', s: 'submitted', n: '' }, { t: N - 48 * H, by: 'นายอำเภอ', s: 'approved', n: 'มีเงื่อนไข: จำกัดความสูง' }], { permit: 'BF-P-2569-0002', launch: 'asked' })
  ] };
}
function load() { try { var j = localStorage.getItem(KEY); if (j) { S = JSON.parse(j); } } catch (e) { } if (!S) S = seed(); try { var s = localStorage.getItem(SESS); if (s) session = JSON.parse(s); } catch (e) { } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function saveSess() { try { if (session) localStorage.setItem(SESS, JSON.stringify(session)); else localStorage.removeItem(SESS); } catch (e) { } }
function byId(id) { return S.requests.filter(function (r) { return r.id == +id; })[0]; }
function setStatus(r, s, by, n) {
  r.history.push({ t: Date.now(), by: by, s: s, n: n || '' }); r.status = s;
  if (s === 'approved' && !r.permit) r.permit = 'BF-P-2569-' + ('000' + (S.requests.filter(function (x) { return x.permit; }).length + 1)).slice(-4);
  save();
}
function logLaunch(r, l, by, n) { r.launch = l; r.history.push({ t: Date.now(), by: by, s: 'L:' + l, n: n || '' }); save(); }
function histLabel(h) { return h.s.indexOf('L:') === 0 ? (LAUNCH[h.s.slice(2)] || h.s) : (STATUS[h.s] || [h.s])[0]; }

/* ================= ผลตรวจอัตโนมัติ (ตัวช่วย ไม่ตัดสินแทน) ================= */
function checkHTML(list) {
  var icn = { pass: 'check_circle', warn: 'warning', fail: 'block', note: 'info' };
  return list.map(function (c) { return '<div class="check ' + c.k + '">' + ic(icn[c.k], 'fill') + '<div><b>' + esc(c.t) + '</b><small>' + esc(c.d) + '</small></div></div>'; }).join('');
}
function autoChecks(r) {
  var out = [], hits = clearance(r.lat, r.lon), ne = nearestAirports(r.lat, r.lon, 1)[0];
  var ph = hits.filter(function (h) { return h.type === 'PHZ'; })[0], lh = hits.filter(function (h) { return h.type === 'LHZ'; })[0];
  if (ph) out.push({ k: 'fail', t: 'อยู่ในแนวขึ้น-ลงเครื่องบิน (PHZ)', d: ph.label + ' · ' + ph.nameTh + ' (' + ph.icao + ') ห่าง ' + ph.d.toFixed(1) + ' กม. — ห้ามปล่อยวัตถุเด็ดขาด' });
  if (lh) out.push({ k: 'fail', t: 'อยู่ในเขตห้าม 10 กม. (LHZ)', d: 'ห่างท่าอากาศยาน' + lh.nameTh + ' (' + lh.icao + ') ' + lh.d.toFixed(1) + ' กม. — ห้ามเว้นแต่ได้รับอนุญาตจากผู้ประกอบท่าอากาศยาน' });
  if (!ph && !lh) {
    if (ne.d <= LHZ + 5) out.push({ k: 'warn', t: 'ใกล้เขต LHZ', d: 'ห่างท่าอากาศยาน' + ne.ap.nameTh + ' ' + ne.d.toFixed(1) + ' กม. (เกณฑ์ ' + LHZ + ' กม.)' });
    else out.push({ k: 'pass', t: 'อยู่นอกเขต LHZ และ PHZ', d: 'ท่าอากาศยานที่ใกล้สุด: ' + ne.ap.nameTh + ' (' + ne.ap.icao + ') ' + ne.d.toFixed(1) + ' กม.' });
  }
  var cf = S.requests.filter(function (o) { return o.id !== r.id && o.date === r.date && ['submitted', 'review', 'info', 'approved'].indexOf(o.status) > -1 && hav([r.lat, r.lon], [o.lat, o.lon]) < 5 && o.from < r.to && r.from < o.to; });
  if (cf.length) out.push({ k: 'warn', t: 'พบคำขอซ้อนวัน-เวลาใกล้เคียง ' + cf.length + ' รายการ', d: cf.map(function (o) { return o.no; }).join(', ') + ' (ภายใน 5 กม. เวลาทับซ้อน)' });
  else out.push({ k: 'pass', t: 'ไม่พบคำขออื่นซ้อนวัน-เวลา-พื้นที่', d: 'ตรวจภายในรัศมี 5 กม.' });
  var pv = provOf(r.province), need = pv && pv.reg ? +pv.reg.applyDaysAdvance || 7 : 7, days = daysFromToday(r.date);
  if (days < need) out.push({ k: 'warn', t: 'ยื่นล่วงหน้าน้อยกว่าที่ระเบียบกำหนด', d: 'จังหวัด' + r.province + ' กำหนดล่วงหน้า ≥ ' + need + ' วัน (เหลือ ' + days + ' วัน)' });
  else out.push({ k: 'pass', t: 'ยื่นล่วงหน้าเพียงพอ', d: 'เหลือ ' + days + ' วัน (เกณฑ์ ' + need + ' วัน)' });
  if (pv && pv.reg) out.push({ k: 'note', t: 'ผู้พิจารณาตามระเบียบจังหวัด: ' + (pv.reg.authority || 'นายอำเภอ'), d: pv.reg.verified ? 'ระเบียบนี้ตรวจกับเอกสารต้นฉบับแล้วใน v1' : 'ใช้เกณฑ์แบบมาตรฐาน ยังไม่ได้ตรวจกับประกาศฉบับจริงของจังหวัดนี้' });
  return out;
}

/* ================= ชั้นข้อมูล GIS (layer registry) =================
 * เพิ่มชั้นใหม่: BF.registerLayer({id,name,source,effective,status,owner,draw(map,group)})
 * status: 'verified' = เจ้าของข้อมูลรับรองแล้ว | 'reference' = ข้อมูลประกอบ ยังไม่รับรอง */
var LAYERS = [];
BF.registerLayer = function (def) { LAYERS = LAYERS.filter(function (l) { return l.id !== def.id; }); LAYERS.push(def); };
BF.layers = function () { return LAYERS.slice(); };
var AIRMETA = AIR.meta || {};
BF.registerLayer({ id: 'lhz', name: 'เขตห้าม 10 กม. (LHZ)', source: AIRMETA.source || 'AIP Thailand', effective: AIRMETA.effective, status: 'reference', owner: 'กพท. (ต้องยืนยัน)', on: true,
  draw: function (map, g) { AIR.airports.forEach(function (a) { L.circle([a.lat, a.lon], { radius: LHZ * 1000, color: '#EF4444', weight: 1.5, fillColor: '#EF4444', fillOpacity: .13, dashArray: '5 4' }).bindTooltip(a.nameTh + ' (' + a.icao + ') — LHZ 10 กม.').addTo(g); }); } });
BF.registerLayer({ id: 'phz', name: 'แนวขึ้น-ลง (PHZ)', source: AIRMETA.source || 'AIP Thailand', effective: AIRMETA.effective, status: 'reference', owner: 'กพท. (ต้องยืนยัน)', on: true,
  draw: function (map, g) { AIR.airports.forEach(function (a) { (a.phz_bands || []).forEach(function (b) { (b.rings || []).forEach(function (ring) { L.polygon(ring, { color: '#F97316', weight: 1, fillColor: b.d1 <= 3 ? '#EF4444' : '#F97316', fillOpacity: b.d1 <= 3 ? .6 : .4 }).bindTooltip(a.nameTh + ' — ' + b.nameTh).addTo(g); }); }); }); } });
BF.registerLayer({ id: 'airports', name: 'ท่าอากาศยาน (จุด ARP)', source: AIRMETA.source || 'AIP Thailand', effective: AIRMETA.effective, status: 'reference', owner: 'กพท. (ต้องยืนยัน)', on: true,
  draw: function (map, g) { AIR.airports.forEach(function (a) { L.circleMarker([a.lat, a.lon], { radius: 4, color: '#fff', weight: 1.5, fillColor: '#13243B', fillOpacity: 1 }).bindTooltip(a.nameTh + ' (' + a.icao + ')').addTo(g); }); } });
function dest(lat, lon, brg, km) {
  var d = km / 6371, b = rad(brg), la = rad(lat), lo = rad(lon);
  var la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
  var lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
  return [la2 * 180 / Math.PI, lo2 * 180 / Math.PI];
}
// เส้นกลางทางวิ่งต่อยาวออกไป 10 กม. ทั้งสองด้าน (ข้อมูลทิศทางทางวิ่งจาก AIP AD 2.12 ผ่าน v1)
BF.registerLayer({ id: 'rwy', name: 'แนวเส้นกลางทางวิ่ง (ต่อออก 10 กม.)', source: 'AIP AD 2.12', effective: AIRMETA.effective, status: 'reference', owner: 'กพท. (ต้องยืนยัน)', on: false,
  draw: function (map, g) {
    var FP = window.FLIGHT_PATH_DATA || {};
    AIR.airports.forEach(function (a) {
      (FP[a.icao] || []).forEach(function (r) {
        var p1 = dest(a.lat, a.lon, r.trueBrg, 10), p2 = dest(a.lat, a.lon, (r.trueBrg + 180) % 360, 10);
        L.polyline([p1, p2], { color: '#7C3AED', weight: 1.5, dashArray: '2 6', opacity: .8 }).bindTooltip(a.nameTh + ' ทางวิ่ง ' + r.desig + ' (ทิศจริง ' + r.trueBrg + '°)').addTo(g);
      });
    });
  } });

var maps = [];
function killMaps() { maps.forEach(function (m) { try { m.remove(); } catch (e) { } }); maps = []; }
// สร้างแผนที่พร้อมแผงเปิด/ปิดชั้นข้อมูล (แสดงที่มา+วันที่ของทุกชั้น)
function mkMap(id, center, zoom, opt) {
  opt = opt || {}; var el = document.getElementById(id);
  if (!el) return null;
  if (!window.L) { el.innerHTML = '<div class="empty">แผนที่ไม่พร้อมใช้งาน</div>'; return null; }
  var m = L.map(el, { scrollWheelZoom: opt.wheel !== false }).setView(center || [15.9, 103.4], zoom || 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(m);
  maps.push(m); m._groups = {};
  LAYERS.forEach(function (l) { var g = L.layerGroup(); m._groups[l.id] = g; l.draw(m, g); if (l.on !== false && (!opt.only || opt.only.indexOf(l.id) > -1)) g.addTo(m); });
  if (opt.panel) {
    var box = document.createElement('details'); box.className = 'layerpanel noprint'; if (opt.panel === 'open') box.open = true;
    box.innerHTML = '<summary>' + ic('layers', 'sm') + ' ชั้นข้อมูล (' + LAYERS.length + ')</summary>' + LAYERS.map(function (l) {
      return '<label><input type="checkbox" data-l="' + l.id + '"' + (m.hasLayer(m._groups[l.id]) ? ' checked' : '') + '><span>' + esc(l.name) + '<br><span class="tiny mute">' + esc(l.source || '') + (l.effective ? ' · ' + esc(l.effective) : '') + (l.status === 'verified' ? ' · รับรองแล้ว' : ' · ข้อมูลประกอบ') + '</span></span></label>';
    }).join('');
    el.parentNode.appendChild(box);
    $$('input', box).forEach(function (cb) { cb.onchange = function () { var g = m._groups[cb.dataset.l]; if (cb.checked) g.addTo(m); else m.removeLayer(g); }; });
  }
  return m;
}

/* ================= ผู้ใช้/เมนู ================= */
var ROLES = {
  citizen: { label: 'ประชาชน / ผู้ขอ', name: 'สมชาย ใจดี (ทดสอบ)', nav: [['home', 'home', 'หน้าหลัก'], ['mine', 'assignment', 'รายการคำขอ'], ['launch', 'local_fire_department', 'แจ้งจุดวันนี้'], ['account', 'account_circle', 'บัญชีของฉัน']] },
  officer: { label: 'นายอำเภอ (ผู้พิจารณา)', name: 'นายอำเภอ ตัวอย่าง ก', nav: [['inbox', 'inbox', 'กล่องคำขอ'], ['gis', 'map', 'แผนที่ GIS'], ['reports', 'bar_chart', 'รายงาน'], ['account', 'account_circle', 'บัญชี']] },
  atc: { label: 'หน่วยควบคุมจราจรทางอากาศ', name: 'เจ้าหน้าที่ ATC ตัวอย่าง', nav: [['atc', 'cell_tower', 'คอนโซล ATC'], ['gis', 'map', 'แผนที่ GIS'], ['account', 'account_circle', 'บัญชี']] },
  admin: { label: 'ผู้ดูแลระบบ (กรมการปกครอง)', name: 'ผู้ดูแล ตัวอย่าง', nav: [['inbox', 'inbox', 'คำขอทั้งหมด'], ['gis', 'map', 'แผนที่ GIS'], ['reports', 'bar_chart', 'รายงาน'], ['users', 'group', 'บัญชีและสิทธิ์'], ['data', 'layers', 'ชั้นข้อมูล'], ['audit', 'fact_check', 'บันทึกการเปลี่ยนแปลง'], ['account', 'account_circle', 'บัญชี']] }
};
var TITLES = { home: 'หน้าหลัก', new: 'สร้างคำขอใหม่', mine: 'รายการคำขอ', detail: 'รายละเอียดคำขอ', permit: 'ใบอนุญาต', launch: 'แจ้งจุด/ปล่อยวันนี้', account: 'บัญชีของฉัน', inbox: 'กล่องคำขอ', review: 'พิจารณาคำขอ', gis: 'แผนที่ GIS', reports: 'รายงานสรุป', users: 'บัญชีและสิทธิ์', atc: 'คอนโซล ATC', audit: 'บันทึกการเปลี่ยนแปลง', data: 'ชั้นข้อมูลและที่มา', login: 'เข้าสู่ระบบ' };
var page = 'login', arg = null, wz = null;
function role() { return session ? session.role : null; }

/* ================= router/shell ================= */
function go(p, a) {
  var h = '#' + p + (a !== undefined && a !== null ? '/' + a : '');
  if (location.hash === h) render(); else location.hash = h; // hash เดิม = ไม่มี hashchange จึงต้อง render เอง
}
function parseHash() { var h = (location.hash || '').replace(/^#/, '').split('/'); return { p: h[0] || '', a: h[1] }; }
function counts() { var c = {}; S.requests.forEach(function (r) { c[r.status] = (c[r.status] || 0) + 1; }); return c; }
function cntBadge(k) {
  var c = counts();
  if (k === 'inbox') { var n = (c.submitted || 0) + (c.review || 0); return n ? '<span class="cnt">' + n + '</span>' : ''; }
  if (k === 'atc') { var a = S.requests.filter(function (r) { return r.launch === 'asked'; }).length; return a ? '<span class="cnt">' + a + '</span>' : ''; }
  return '';
}
function curNavKey() {
  if (page === 'detail' || page === 'permit' || page === 'new') return role() === 'citizen' ? (page === 'new' ? 'home' : 'mine') : 'inbox';
  if (page === 'review') return 'inbox';
  return page;
}
function renderShell() {
  var rl = session && ROLES[session.role], logged = !!rl;
  var nav = logged ? rl.nav : [], on = curNavKey();
  $('#bnav').style.display = logged && page !== 'login' ? '' : 'none';
  $('#side').style.display = logged && page !== 'login' ? '' : 'none';
  $('#app').classList.toggle('bare', !(logged && page !== 'login'));
  var btn = function (n, side) { return '<button data-p="' + n[0] + '"' + (n[0] === on ? ' class="on" aria-current="page"' : '') + '>' + ic(n[1], n[0] === on ? 'fill' : '') + '<span>' + n[2] + '</span>' + cntBadge(n[0]) + '</button>'; };
  $('#bnav').innerHTML = nav.map(function (n) { return btn(n); }).join('');
  $('#side').innerHTML = logged ? '<button class="brand homebtn" data-home title="กลับหน้าเลือกผู้ใช้ (เฉพาะ sandbox)" aria-label="แจ้งก่อนจุด กลับหน้าเลือกผู้ใช้"><div class="logo">' + ic('rocket_launch', 'lg') + '</div><div><b>แจ้งก่อนจุด</b><small>กลับไปเลือกผู้ใช้</small></div></button><nav>' + nav.map(function (n) { return btn(n); }).join('') + '</nav><div class="foot">' + esc(rl.label) + '</div>' : '';
  $$('#bnav button, #side nav button').forEach(function (b) { b.onclick = function () { go(b.dataset.p); }; });
  $('#head').innerHTML = '<button class="homebtn" data-home title="กลับหน้าเลือกผู้ใช้ (เฉพาะ sandbox)" aria-label="แจ้งก่อนจุด กลับหน้าเลือกผู้ใช้"><div class="logo">' + ic('rocket_launch', 'lg') + '</div><div><div class="hname">แจ้งก่อนจุด</div><div class="hsub">ต้นแบบระบบรับคำขอ (ไม่ใช่ระบบของหน่วยงานรัฐ)</div></div></button><div class="ttl"><div class="h2">' + esc(TITLES[page] || '') + '</div></div>' +
    (logged ? '<div class="hwho"><span class="nm">' + esc(session.name || rl.name) + '</span><div class="avatar" aria-hidden="true">' + esc((session.name || rl.name).charAt(0)) + '</div></div>' : '');
  $('#head').style.display = page === 'login' ? 'none' : '';
  // sandbox: แตะโลโก้ = กลับหน้าเลือกผู้ใช้ (ข้อมูลคำขอยังอยู่ ไม่ถูกล้าง)
  $$('[data-home]').forEach(function (b) { b.onclick = function () { session = null; wz = null; saveSess(); go('login'); }; });
}
function render() {
  killMaps();
  var h = parseHash();
  if (!session) { page = 'login'; }
  else {
    var valid = ROLES[session.role].nav.map(function (n) { return n[0]; }).concat(['detail', 'review', 'permit', 'new', 'data', 'users', 'audit']);
    page = valid.indexOf(h.p) > -1 ? h.p : ROLES[session.role].nav[0][0]; arg = h.a;
    // หน้าเฉพาะบทบาท
    var only = { new: ['citizen'], launch: ['citizen'], mine: ['citizen'], home: ['citizen'], review: ['officer', 'admin'], inbox: ['officer', 'admin'], users: ['admin'], data: ['admin'], audit: ['admin'], atc: ['atc'], reports: ['officer', 'admin'] };
    if (only[page] && only[page].indexOf(session.role) < 0) page = ROLES[session.role].nav[0][0];
  }
  renderShell();
  var v = $('#view'); v.innerHTML = '';
  ({ login: vLogin, home: vHome, new: vNew, mine: vMine, detail: vDetail, permit: vPermit, launch: vLaunch, account: vAccount, inbox: vInbox, review: vReview, gis: vGis, reports: vReports, users: vUsers, atc: vAtc, audit: vAudit, data: vData }[page] || vLogin)(v);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);

/* ================= shared pieces ================= */
function reqCard(r) {
  var t = TYPES[r.type];
  return '<button class="rq" data-id="' + r.id + '"><div class="row between"><span class="no">เลขที่: ' + esc(r.no) + '</span>' + chip(r.status) + '</div><div class="t">' + esc(t[0]) + ' (' + r.qty + ' ชิ้น)</div>' +
    '<div class="m">' + ic('calendar_today', 'sm') + fmtDate(r.date) + ' · ' + r.from + '–' + r.to + ' น.</div><div class="m">' + ic('pin_drop', 'sm') + esc(r.place || r.amphoe) + ' อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '</div></button>';
}
function bindReqCards(root, to) {
  $$('.rq', root).forEach(function (b) { b.onclick = function () { go(to || 'detail', b.dataset.id); }; });
  $$('[data-permit]', root).forEach(function (b) { b.onclick = function () { go('permit', b.dataset.permit); }; });
  $$('[data-launch]', root).forEach(function (b) { b.onclick = function () { go('launch', b.dataset.launch); }; });
}
// การ์ดคำขอ + ปุ่มลัดเมื่ออนุมัติแล้ว (ตาม Stitch หน้าหลัก)
function reqCardAct(r) {
  return '<div class="rqwrap">' + reqCard(r) + (r.status === 'approved' && r.permit ? '<div class="rqact"><button class="btn ghost sm" data-permit="' + r.id + '">' + ic('description', 'sm') + 'ดูใบอนุญาต</button><button class="btn sm" data-launch="' + r.id + '">' + ic('campaign', 'sm') + 'แจ้งก่อนจุด</button></div>' : '') + '</div>';
}
function legendHTML() {
  return '<div class="legend"><div class="lg-item"><span class="dot" style="background:var(--zone-red)"></span><div><b>เขตห้ามรัศมี 10 กม. รอบท่าอากาศยาน (LHZ)</b><span class="small mute">ห้ามจุด/ปล่อย เว้นแต่ได้รับอนุญาต</span></div></div>' +
    '<div class="lg-item"><span class="sq" style="background:var(--zone-orange)"></span><div><b>แนวขึ้น-ลงเครื่องบิน (PHZ)</b><span class="small mute">ห้ามปล่อยวัตถุเด็ดขาด</span></div></div></div>';
}
function qr(canvas, seedStr) {
  var n = 25, cs = 8, ctx = canvas.getContext('2d'); canvas.width = canvas.height = n * cs; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, n * cs, n * cs); ctx.fillStyle = '#13243B';
  var h = 2166136261; for (var i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  function rnd() { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; }
  function fin(x, y) { ctx.fillRect(x * cs, y * cs, 7 * cs, 7 * cs); ctx.clearRect((x + 1) * cs, (y + 1) * cs, 5 * cs, 5 * cs); ctx.fillRect((x + 2) * cs, (y + 2) * cs, 3 * cs, 3 * cs); }
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { var f = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); if (!f && rnd() > .52) ctx.fillRect(x * cs, y * cs, cs, cs); }
  fin(0, 0); fin(n - 7, 0); fin(0, n - 7);
}
function timeline(r) {
  return '<ul class="tl">' + r.history.map(function (h) {
    var k = (h.s === 'approved' || h.s === 'L:green') ? 'ok' : (h.s === 'rejected' || h.s === 'L:denied') ? 'bad' : 'ok';
    return '<li class="' + k + '"><span class="ico">' + ic(k === 'bad' ? 'close' : 'check', 'fill') + '</span><div class="tt">' + esc(histLabel(h)) + '</div><div class="ts">โดย ' + esc(h.by) + ' · ' + fmtTs(h.t) + '</div>' + (h.n ? '<div class="small">' + esc(h.n) + '</div>' : '') + '</li>';
  }).join('') + '</ul>';
}
function regCard(th, open) {
  var p = provOf(th); if (!p || !p.reg) return '';
  var g = p.reg;
  var rows = [['ผู้อนุญาต', g.authority || 'นายอำเภอ'], ['เงื่อนไข', g.permit], ['ยื่นล่วงหน้า', g.applyDaysAdvance ? '≥ ' + g.applyDaysAdvance + ' วัน' : ''], ['ใกล้สนามบิน', g.airportNotify], ['ช่วงเทศกาล', g.festival], ['ข้อห้ามพิเศษ', g.special], ['โทษ (ที่ระบุในประกาศ)', g.penalty]].filter(function (x) { return x[1]; });
  return '<details class="fold"' + (open ? ' open' : '') + '><summary><span>' + ic('gavel', 'sm') + ' ระเบียบจังหวัด' + esc(p.th) + '</span><span class="chip sm ' + (g.verified ? 'ok' : 'wait') + '">' + (g.verified ? 'ตรวจกับต้นฉบับแล้ว' : 'ใช้แบบมาตรฐาน') + '</span></summary>' +
    '<p class="small" style="margin-bottom:10px">' + esc(g.title || '') + '</p><dl class="kv2 reg">' + rows.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' +
    (g.sourceUrl ? '<p class="small" style="margin:6px 0 12px"><a href="' + esc(g.sourceUrl) + '" target="_blank" rel="noopener">แหล่งที่มา ↗</a></p>' : '') + '<p class="tiny mute" style="margin-bottom:12px">สรุปจากข้อมูลที่รวบรวมไว้ ตรวจกับประกาศฉบับจริงก่อนใช้งานเสมอ</p></details>';
}

/* ================= LOGIN ================= */
function vLogin(v) {
  v.innerHTML = '<div class="login"><div class="mark">' + ic('rocket_launch', 'fill') .replace('class="ms ', 'style="font-size:52px" class="ms ') + '</div>' +
    '<div style="text-align:center"><span class="chip wait">' + ic('shield', 'sm fill') + 'ต้นแบบระบบรับคำขอ</span><h1 class="h1" style="margin-top:12px">แจ้งก่อนจุด</h1><p class="lead" style="margin-top:6px">ยื่นคำขอจุดบั้งไฟ ตะไล โคมลอย และพลุ ใกล้เขตการบินพลเรือน</p></div>' +
    '<div class="card dark"><button class="thaid" id="thaid"><span class="bx">' + ic('badge', 'lg') + '</span><span style="flex:1"><b style="font-size:19px;display:block">เข้าสู่ระบบด้วย ThaID (จำลอง)</b><span class="small" style="color:#b7c7e5">ใน sandbox ยังไม่เชื่อม ThaID จริง</span></span>' + ic('arrow_forward') + '</button></div>' +
    '<div class="sep">หรือเข้าสู่ระบบด้วยชื่อผู้ใช้</div>' +
    '<div class="card"><label class="f" for="lid" style="margin-top:0">ชื่อผู้ใช้ <span class="req">*</span></label><input id="lid" class="in" autocomplete="off" placeholder="ใช้ชื่อสมมติใน sandbox"><label class="f" for="lpw">รหัสผ่าน <span class="req">*</span></label><input id="lpw" type="password" class="in" autocomplete="off" placeholder="รหัสสมมติ"><button class="btn amber block" id="lgo" style="margin-top:20px">' + ic('login') + 'เข้าสู่ระบบ</button><p class="hint">ห้ามกรอกเลขบัตรประชาชนหรือรหัสผ่านจริงของใคร ระบบนี้ไม่ตรวจรหัสและไม่ส่งข้อมูลออกนอกเครื่อง</p></div>' +
    '<div class="card flat"><h2 class="h3">ทดลองด้วยบทบาทอื่น</h2><p class="small mute" style="margin:4px 0 12px">เฉพาะ sandbox เพื่อดูหน้าจอของแต่ละฝ่าย</p><div class="rolebtns">' +
    ['citizen', 'officer', 'atc', 'admin'].map(function (k) { return '<button class="btn ghost sm" data-r="' + k + '">' + esc(ROLES[k].label) + '</button>'; }).join('') + '</div></div>' +
    '<div class="card help"><h2 class="h3">' + ic('support_agent', 'fill') + ' ต้องการความช่วยเหลือ หรือใช้งานไม่เป็น?</h2><p class="small" style="margin:6px 0 12px">ผู้สูงอายุหรือไม่มีสมาร์ตโฟน ให้เจ้าหน้าที่ช่วยยื่นคำขอแทนได้ ไม่ต้องใช้แอปเอง</p>' +
    '<div class="tile" style="margin-bottom:10px"><div class="k">สายด่วนกรมการปกครอง / ที่ทำการอำเภอ</div><div class="v">' + esc((CT.hotlines && CT.hotlines.amphoe) || '1567') + '</div></div>' +
    '<div class="tile"><div class="k">หรือติดต่อใกล้บ้าน</div><div class="v">ผู้ใหญ่บ้าน / กำนัน / เจ้าหน้าที่ อบต. ช่วยยื่นคำขอแทนได้</div></div></div>' +
    '<div class="warnbox">' + ic('gavel', 'fill') + '<div><b>การจุดโดยไม่ได้รับอนุญาตมีความผิดตามกฎหมาย</b><div class="small">โทษและเงื่อนไขขึ้นกับประกาศของแต่ละจังหวัดและกฎหมายการเดินอากาศ ดูรายละเอียดของจังหวัดคุณได้ในขั้นตอนสร้างคำขอ</div></div></div>' +
    '<p class="tiny mute" style="text-align:center">Sandbox v0.3 · ข้อมูลห้วงอากาศอ้างอิง AIP Thailand ' + esc(AIRMETA.effective || '') + ' (ข้อมูลประกอบ ยังไม่รับรอง)</p></div>';
  var enter = function (r) { session = { role: r, name: ROLES[r].name }; saveSess(); go(ROLES[r].nav[0][0]); };
  $('#thaid').onclick = function () { enter('citizen'); };
  $('#lgo').onclick = function () { enter('citizen'); };
  $$('[data-r]', v).forEach(function (b) { b.onclick = function () { enter(b.dataset.r); }; });
}

/* ================= CITIZEN: home ================= */
function vHome(v) {
  var mine = S.requests.filter(function (r) { return r.owner === 'me'; }).slice().reverse();
  var active = mine.filter(function (r) { return ['draft', 'submitted', 'review', 'info', 'approved'].indexOf(r.status) > -1; });
  v.innerHTML = '<div class="grid g2"><div class="stack lg">' +
    '<div class="card"><span class="chip wait sm">' + ic('event', 'sm') + 'ช่วงนี้ยื่นล่วงหน้าตามระเบียบจังหวัด</span><h1 class="h1" style="margin:10px 0 4px">สวัสดีครับ ' + esc(session.name.replace(' (ทดสอบ)', '')) + '</h1><p class="lead">ยื่นคำขอก่อนจุดทุกครั้ง ระบบจะตรวจเขตห้ามรอบท่าอากาศยานให้ทันที</p></div>' +
    '<button class="hero btn" id="cta" style="display:flex;text-align:left;gap:16px;width:100%;justify-content:flex-start;border-radius:16px;min-height:0;padding:20px"><span class="ic">' + ic('rocket_launch', 'lg fill') + '</span><span style="flex:1"><b style="font-size:20px;display:block">ยื่นคำขอจุดบั้งไฟ / โคมลอย</b><span class="small" style="color:#b7c7e5;font-weight:400">กรอก 4 ขั้นตอน ตรวจแนวเขตปลอดภัยอัตโนมัติ</span></span>' + ic('arrow_forward') + '</button>' +
    '<div><div class="row between" style="margin-bottom:12px"><h2 class="h2">คำขอของฉัน</h2><button class="link" id="all">ดูทั้งหมด (' + mine.length + ')</button></div><div class="stack">' + (active.length ? active.slice(0, 3).map(reqCardAct).join('') : '<div class="card empty">' + ic('inbox') + '<p>ยังไม่มีคำขอที่กำลังดำเนินการ</p></div>') + '</div></div>' +
    '<div class="safety">' + ic('info', 'fill') + '<div><b>คำแนะนำเพื่อความปลอดภัย</b><p class="small">ยื่นคำขอล่วงหน้าอย่างน้อยตามที่ประกาศจังหวัดกำหนด (ส่วนใหญ่ 7 วัน) เพื่อให้อำเภอและหน่วยที่เกี่ยวข้องมีเวลาพิจารณาและประสานงาน</p></div></div></div>' +
    '<div class="stack lg"><div class="card"><h2 class="h2" style="margin-bottom:4px">แนวเขตปลอดภัยทางอากาศ</h2><p class="small mute" style="margin-bottom:12px">ท่าอากาศยาน ' + AIR.airports.length + ' แห่งทั่วประเทศ</p><div class="mapbox"><div id="m1" class="map"></div></div><div style="margin-top:14px">' + legendHTML() + '</div><p class="tiny mute" style="margin-top:10px">ข้อมูลอ้างอิง AIP Thailand ' + esc(AIRMETA.effective || '') + ' · ข้อมูลประกอบ ยังไม่รับรองโดยหน่วยงานเจ้าของข้อมูล</p></div></div></div>';
  $('#cta').onclick = function () { wz = null; go('new'); };
  $('#all').onclick = function () { go('mine'); };
  bindReqCards(v);
  mkMap('m1', [15.2, 101.2], 6, { panel: true, wheel: false });
}

/* ================= CITIZEN: wizard ================= */
function newWz() { return { step: 1, type: 'bangfai', qty: 10, size: '', province: '', amphoe: '', tambon: '', place: '', lat: null, lon: null, date: iso(8), from: '09:00', to: '12:00', ceil: '', c1n: '', c1p: '', c2n: '', c2p: '', ack: false, provTouched: false }; }
function vNew(v) {
  if (!wz) wz = newWz();
  var labels = ['พิกัด', 'ชนิด/จำนวน', 'วัน-เวลา', 'ส่งคำขอ'];
  v.innerHTML = '<div class="narrow"><div class="row between" style="margin-bottom:6px"><b>ขั้นตอนที่ ' + wz.step + ' จาก 4</b><span class="small mute">เสร็จสมบูรณ์ ' + (wz.step * 25 - 25) + '%</span></div><div class="steps" role="list">' + labels.map(function (l, i) { return '<div class="step ' + (i + 1 < wz.step ? 'done' : i + 1 === wz.step ? 'on' : '') + '" role="listitem">' + (i + 1) + '. ' + l + '</div>'; }).join('') + '</div><div id="wzc" class="stack lg"></div></div>';
  var c = $('#wzc');
  if (wz.step === 1) step1(c); else if (wz.step === 2) step2(c); else if (wz.step === 3) step3(c); else step4(c);
}
function clearanceCard() {
  if (wz.lat == null) return '<div class="check note">' + ic('touch_app', 'fill') + '<div><b>แตะบนแผนที่เพื่อปักหมุด</b><small>หรือกดปุ่มใช้ตำแหน่งปัจจุบัน ระบบจะตรวจเขตห้ามให้ทันที</small></div></div>';
  var hits = clearance(wz.lat, wz.lon), ne = nearestAirports(wz.lat, wz.lon, 1)[0];
  var ph = hits.filter(function (h) { return h.type === 'PHZ'; })[0], lh = hits.filter(function (h) { return h.type === 'LHZ'; })[0];
  var head = ph ? ['fail', 'จุดนี้อยู่ในแนวขึ้น-ลงเครื่องบิน (PHZ) ห้ามปล่อยวัตถุ', ph.nameTh + ' (' + ph.icao + ') ห่าง ' + ph.d.toFixed(1) + ' กม. กรุณาเลือกพื้นที่อื่น']
    : lh ? ['fail', 'จุดนี้อยู่ในเขตห้าม 10 กม. รอบท่าอากาศยาน (LHZ)', lh.nameTh + ' (' + lh.icao + ') ห่าง ' + lh.d.toFixed(1) + ' กม. ห้ามจุด/ปล่อย เว้นแต่ได้รับอนุญาตจากผู้ประกอบท่าอากาศยาน']
      : ne.d <= LHZ + 5 ? ['warn', 'ใกล้เขตห้าม ควรขยับห่างออกไป', 'ท่าอากาศยาน' + ne.ap.nameTh + ' ห่าง ' + ne.d.toFixed(1) + ' กม. (เกณฑ์ ' + LHZ + ' กม.)']
        : ['pass', 'พื้นที่นี้อยู่นอกเขตห้ามที่ระบบรู้จัก', 'ท่าอากาศยานที่ใกล้สุด: ' + ne.ap.nameTh + ' (' + ne.ap.icao + ') ห่าง ' + ne.d.toFixed(1) + ' กม.'];
  var out = checkHTML([{ k: head[0], t: head[1], d: head[2] }]);
  if (lh && !ph) out += '<label class="check warn" style="cursor:pointer"><input type="checkbox" id="ack" style="width:24px;height:24px;flex:none;margin-top:2px"' + (wz.ack ? ' checked' : '') + '><div><b>ฉันรับทราบ</b><small>ต้องขออนุญาตผู้ประกอบท่าอากาศยานด้วย และเจ้าหน้าที่จะพิจารณาเป็นรายกรณี</small></div></label>';
  return out + '<p class="tiny mute" style="margin-top:8px">ผลตรวจเป็นตัวช่วย ใช้ข้อมูลห้วงอากาศ AIP ' + esc(AIRMETA.effective || '') + ' (ยังไม่รับรอง) เจ้าหน้าที่เป็นผู้ตัดสินขั้นสุดท้าย</p>';
}
function step1(c) {
  c.innerHTML = '<div><h1 class="h1">กำหนดจุดที่จะจุดบั้งไฟหรือปล่อยโคม</h1><p class="lead" style="margin-top:6px">ระบบจะคำนวณระยะห่างจากท่าอากาศยานและแนวขึ้น-ลงให้</p></div>' +
    '<button class="btn block" id="gps">' + ic('my_location') + 'ใช้ตำแหน่งปัจจุบันของฉัน (GPS)</button>' +
    '<div class="mapbox"><div id="m2" class="map"></div></div><p class="hint" style="margin-top:-8px">หรือแตะบนแผนที่เพื่อปักหมุด · ' + ic('lock', 'sm') + ' พิกัดไม่ถูกส่งออกจากเครื่องนี้ใน sandbox</p>' +
    '<div id="wres"></div><div id="wreg"></div>' +
    '<div class="card"><h2 class="h3">ข้อมูลเขตการปกครองและสถานที่</h2>' +
    '<label class="f" for="wp">จังหวัด <span class="req">*</span></label><select id="wp" class="in"><option value="">— เลือกจังหวัด —</option>' + REG.slice().sort(function (a, b) { return a.th.localeCompare(b.th, 'th'); }).map(function (p) { return '<option' + (p.th === wz.province ? ' selected' : '') + '>' + esc(p.th) + '</option>'; }).join('') + '</select>' +
    '<div class="two"><div><label class="f" for="wa">อำเภอ/เขต <span class="req">*</span></label><select id="wa" class="in"></select></div><div><label class="f" for="wt">ตำบล/แขวง</label><input id="wt" class="in" value="' + esc(wz.tambon) + '"></div></div>' +
    '<label class="f" for="wl">จุดสังเกต / ชื่อสถานที่</label><textarea id="wl" class="in" placeholder="เช่น ลานวัด ท้ายหมู่บ้าน ใกล้โรงเรียน">' + esc(wz.place) + '</textarea></div>' +
    '<div class="stickybar"><button class="btn amber block" id="nx" disabled>บันทึกและไปขั้นตอนถัดไป ' + ic('arrow_forward') + '</button></div>';
  var m = mkMap('m2', wz.lat != null ? [wz.lat, wz.lon] : [15.9, 103.4], wz.lat != null ? 12 : 7, { panel: true }), pin = null;
  function fillAmphoe() {
    var list = amphoesOf(wz.province);
    $('#wa').innerHTML = '<option value="">— เลือกอำเภอ —</option>' + list.slice().sort(function (a, b) { return a.th.localeCompare(b.th, 'th'); }).map(function (a) { return '<option' + (a.th === wz.amphoe ? ' selected' : '') + '>' + esc(a.th) + '</option>'; }).join('');
    $('#wreg').innerHTML = wz.province ? regCard(wz.province, false) : '';
  }
  function upd() {
    $('#wres').innerHTML = clearanceCard();
    var ack = $('#ack'); if (ack) ack.onchange = function () { wz.ack = this.checked; gate(); };
    gate();
  }
  function gate() {
    var ok = wz.lat != null && wz.province && wz.amphoe;
    if (ok) { var h = clearance(wz.lat, wz.lon); if (h.some(function (x) { return x.type === 'PHZ'; })) ok = false; else if (h.some(function (x) { return x.type === 'LHZ'; }) && !wz.ack) ok = false; }
    $('#nx').disabled = !ok;
  }
  function setPin(lat, lon, zoom) {
    wz.lat = lat; wz.lon = lon; wz.ack = false;
    if (m) { if (pin) pin.setLatLng([lat, lon]); else pin = L.marker([lat, lon]).addTo(m); if (zoom) m.setView([lat, lon], zoom); }
    if (!wz.provTouched) { var p = nearestProvince(lat, lon); if (p && p.th !== wz.province) { wz.province = p.th; wz.amphoe = ''; $('#wp').value = p.th; fillAmphoe(); } }
    upd();
  }
  if (m) { if (wz.lat != null) pin = L.marker([wz.lat, wz.lon]).addTo(m); m.on('click', function (e) { setPin(e.latlng.lat, e.latlng.lng); }); }
  $('#gps').onclick = function () {
    if (!navigator.geolocation) { toast('เบราว์เซอร์นี้ไม่รองรับ GPS กรุณาแตะบนแผนที่'); return; }
    navigator.geolocation.getCurrentPosition(function (p) { setPin(p.coords.latitude, p.coords.longitude, 14); }, function () { toast('ไม่สามารถอ่านตำแหน่งได้ กรุณาแตะบนแผนที่แทน'); }, { enableHighAccuracy: true, timeout: 10000 });
  };
  $('#wp').onchange = function () { wz.province = this.value; wz.amphoe = ''; wz.provTouched = true; fillAmphoe(); gate(); if (m && provOf(wz.province) && wz.lat == null) { var p = provOf(wz.province); m.setView([p.lat, p.lon], 9); } };
  $('#wa').onchange = function () { wz.amphoe = this.value; gate(); };
  $('#wt').oninput = function () { wz.tambon = this.value; };
  $('#wl').oninput = function () { wz.place = this.value; };
  $('#nx').onclick = function () { wz.step = 2; render(); };
  fillAmphoe(); upd();
}
function step2(c) {
  c.innerHTML = '<div><h1 class="h1">เลือกประเภทวัตถุที่จะจุด</h1><p class="lead" style="margin-top:6px">เลือกได้ 1 รายการต่อ 1 คำขอ</p></div>' +
    '<div class="opts" role="radiogroup" aria-label="ประเภท">' + Object.keys(TYPES).map(function (k) { return '<button class="opt' + (wz.type === k ? ' on' : '') + '" role="radio" aria-checked="' + (wz.type === k) + '" data-k="' + k + '">' + ic(TYPES[k][1], 'fill') + '<b>' + TYPES[k][0] + '</b><span class="d">' + TYPES[k][2] + '</span></button>'; }).join('') + '</div>' +
    '<div class="card"><label class="f" for="wq" style="margin-top:0">จำนวน (ชิ้น/ลูก) <span class="req">*</span></label><input id="wq" type="number" min="1" inputmode="numeric" class="in" value="' + wz.qty + '">' +
    '<label class="f" for="wsz">ขนาด/รายละเอียดเพิ่มเติม</label><input id="wsz" class="in" value="' + esc(wz.size) + '" placeholder="เช่น บั้งไฟหมื่น ท่อ 3 นิ้ว">' +
    '<label class="f" for="wc">ความสูงสูงสุดที่คาดว่าจะขึ้น (ฟุต)</label><input id="wc" type="number" min="0" inputmode="numeric" class="in" value="' + esc(wz.ceil) + '"><p class="hint">ไม่บังคับ เจ้าหน้าที่อาจกำหนดเงื่อนไขความสูงในใบอนุญาต</p></div>' +
    '<details class="fold" id="simbox"><summary><span>' + ic('calculate', 'sm') + ' ช่วยประมาณความสูงและระยะตก (จำลองอย่างง่าย)</span></summary><label class="f" for="sk" style="margin-top:0">แบบจำลอง</label><select id="sk" class="in">' + Object.keys(SIM).map(function (k) { return '<option value="' + k + '">' + SIM[k].label + '</option>'; }).join('') + '</select><div id="simout" style="margin-top:12px"></div><p class="tiny mute" style="margin:10px 0 14px">ประมาณจากแบบจำลองฟิสิกส์อย่างง่าย (ลม 5 ม./วิ) ไม่ใช่ค่ารับรอง ใช้เพื่อช่วยกรอกความสูงที่คาดไว้เท่านั้น</p></details>' +
    '<div class="actbar"><button class="btn ghost" id="bk">' + ic('arrow_back') + 'ย้อนกลับ</button><button class="btn amber" id="nx">ถัดไป ' + ic('arrow_forward') + '</button></div>';
  function sim() {
    var k = $('#sk').value, pm = Math.round(simPeakM(k)), ft = Math.round(pm * 3.28084 / 100) * 100;
    $('#simout').innerHTML = '<div class="grid g2"><div class="tile"><div class="k">ความสูงสูงสุด (ประมาณ)</div><div class="v">≈ ' + pm.toLocaleString('th-TH') + ' ม. (≈ ' + ft.toLocaleString('th-TH') + ' ฟุต)</div></div><div class="tile"><div class="k">ระยะตก/ล่องลอยตามลม</div><div class="v">≈ ' + simDriftKm(k).toFixed(1) + ' กม.</div></div></div><button class="btn ghost sm" id="usesim" style="margin-top:10px">' + ic('input', 'sm') + 'ใช้ ' + ft.toLocaleString('th-TH') + ' ฟุต เป็นความสูงที่คาด</button>';
    $('#usesim').onclick = function () { wz.ceil = String(ft); $('#wc').value = wz.ceil; toast('ใส่ความสูงที่คาดแล้ว'); };
  }
  $('#sk').value = SIM_DEFAULT[wz.type] || 'plu'; $('#sk').onchange = sim; sim();
  $$('.opt', c).forEach(function (o) { o.onclick = function () { wz.type = o.dataset.k; $$('.opt', c).forEach(function (x) { x.classList.toggle('on', x === o); x.setAttribute('aria-checked', x === o); }); }; });
  $('#wq').oninput = function () { wz.qty = +this.value || 1; }; $('#wsz').oninput = function () { wz.size = this.value; }; $('#wc').oninput = function () { wz.ceil = this.value; };
  $('#bk').onclick = function () { wz.step = 1; render(); }; $('#nx').onclick = function () { wz.step = 3; render(); };
}
function step3(c) {
  var pv = provOf(wz.province), need = pv && pv.reg ? +pv.reg.applyDaysAdvance || 7 : 7;
  c.innerHTML = '<div><h1 class="h1">วัน-เวลาและผู้ประสานงาน</h1></div><div class="card"><div class="two"><div style="grid-column:1/-1"><label class="f" for="wd" style="margin-top:0">วันที่จุด/ปล่อย <span class="req">*</span></label><input id="wd" type="date" class="in" min="' + iso(0) + '" value="' + wz.date + '"><p class="hint" id="wdh"></p></div><div><label class="f" for="wf">เวลาเริ่ม</label><input id="wf" type="time" class="in" value="' + wz.from + '"></div><div><label class="f" for="wt2">เวลาสิ้นสุด</label><input id="wt2" type="time" class="in" value="' + wz.to + '"></div></div></div>' +
    '<div class="card"><h2 class="h3">ผู้ประสานงานที่ติดต่อได้ 2 ท่าน</h2><p class="small mute" style="margin:2px 0 6px">ใน sandbox ใช้ชื่อและเบอร์สมมติเท่านั้น</p>' +
    '<div class="two"><div><label class="f" for="n1">ชื่อ-สกุล (1)</label><input id="n1" class="in" value="' + esc(wz.c1n) + '"></div><div><label class="f" for="p1">โทรศัพท์ (1)</label><input id="p1" class="in" inputmode="tel" value="' + esc(wz.c1p) + '"></div><div><label class="f" for="n2">ชื่อ-สกุล (2)</label><input id="n2" class="in" value="' + esc(wz.c2n) + '"></div><div><label class="f" for="p2">โทรศัพท์ (2)</label><input id="p2" class="in" inputmode="tel" value="' + esc(wz.c2p) + '"></div></div></div>' +
    '<div class="actbar"><button class="btn ghost" id="bk">' + ic('arrow_back') + 'ย้อนกลับ</button><button class="btn amber" id="nx">ถัดไป ' + ic('arrow_forward') + '</button></div>';
  function hintDays() { var d = daysFromToday(wz.date); $('#wdh').innerHTML = d < need ? ic('warning', 'sm fill') + ' จังหวัด' + esc(wz.province) + ' กำหนดยื่นล่วงหน้า ≥ ' + need + ' วัน (เหลือ ' + d + ' วัน) เจ้าหน้าที่อาจไม่อนุมัติ' : 'ยื่นล่วงหน้า ' + d + ' วัน (เกณฑ์ ' + need + ' วัน)'; }
  hintDays();
  [['wd', 'date'], ['wf', 'from'], ['wt2', 'to'], ['n1', 'c1n'], ['p1', 'c1p'], ['n2', 'c2n'], ['p2', 'c2p']].forEach(function (p) { $('#' + p[0]).oninput = function () { wz[p[1]] = this.value; if (p[0] === 'wd') hintDays(); }; });
  $('#bk').onclick = function () { wz.step = 2; render(); };
  $('#nx').onclick = function () { if (!wz.date || wz.from >= wz.to) { toast('กรุณาตรวจวันและเวลา (เวลาเริ่มต้องก่อนเวลาสิ้นสุด)'); return; } wz.step = 4; render(); };
}
function step4(c) {
  var tmp = { id: -1, lat: wz.lat, lon: wz.lon, date: wz.date, from: wz.from, to: wz.to, province: wz.province };
  c.innerHTML = '<div><h1 class="h1">ตรวจทานก่อนส่ง</h1></div><div class="card"><dl class="kv"><dt>พื้นที่</dt><dd>' + esc(wz.place || '-') + '<br>อ.' + esc(wz.amphoe) + ' จ.' + esc(wz.province) + '<br><span class="tiny mute">' + wz.lat.toFixed(4) + ', ' + wz.lon.toFixed(4) + '</span></dd><dt>ประเภท/จำนวน</dt><dd>' + TYPES[wz.type][0] + ' × ' + wz.qty + (wz.size ? ' (' + esc(wz.size) + ')' : '') + '</dd><dt>วัน-เวลา</dt><dd>' + fmtDate(wz.date) + ' ' + wz.from + '–' + wz.to + ' น.</dd><dt>ผู้ประสานงาน</dt><dd>' + esc(wz.c1n || '-') + ' / ' + esc(wz.c2n || '-') + '</dd></dl></div>' +
    '<div class="card"><h2 class="h3">ผลตรวจเบื้องต้น</h2>' + checkHTML(autoChecks(tmp)) + '<p class="tiny mute" style="margin-top:10px">เจ้าหน้าที่เป็นผู้ตัดสินขั้นสุดท้าย ผลตรวจนี้เป็นเพียงตัวช่วย</p></div>' +
    '<div class="actbar"><button class="btn ghost" id="bk">' + ic('arrow_back') + 'ย้อนกลับ</button><button class="btn soft" id="dr">' + ic('save') + 'บันทึกร่าง</button><button class="btn amber" id="sb">' + ic('send') + 'ส่งคำขอ</button></div>';
  $('#bk').onclick = function () { wz.step = 3; render(); };
  function fin(st) {
    var r = mk(S.seq++, 'me', session.name, wz.type, wz.qty, wz.province, wz.amphoe, wz.lat, wz.lon, 0, wz.from, wz.to, st, [], { tambon: wz.tambon, place: wz.place, ceil: wz.ceil, size: wz.size, contacts: [[wz.c1n, wz.c1p], [wz.c2n, wz.c2p]] });
    r.date = wz.date; r.history.push({ t: Date.now(), by: 'ผู้ขอ', s: st, n: '' }); S.requests.push(r); save(); wz = null;
    toast(st === 'draft' ? 'บันทึกร่างแล้ว' : 'ส่งคำขอแล้ว เลขที่ ' + r.no); go('detail', r.id);
  }
  $('#dr').onclick = function () { fin('draft'); }; $('#sb').onclick = function () { fin('submitted'); };
}

/* ================= CITIZEN: list / detail / permit / launch / account ================= */
function vMine(v) {
  var mine = S.requests.filter(function (r) { return r.owner === 'me'; }).slice().reverse();
  v.innerHTML = '<div class="narrow stack"><div class="row between"><h1 class="h1">รายการคำขอ</h1><button class="btn amber sm" id="nw">' + ic('add') + 'สร้างคำขอ</button></div>' + (mine.length ? mine.map(reqCard).join('') : '<div class="card empty">' + ic('inbox') + '<p>ยังไม่มีคำขอ</p></div>') + '</div>';
  bindReqCards(v); $('#nw').onclick = function () { wz = null; go('new'); };
}
function vDetail(v) {
  var r = byId(arg); if (!r) { go(role() === 'citizen' ? 'mine' : 'inbox'); return; }
  var last = r.history[r.history.length - 1], t = TYPES[r.type], ck = autoChecks(r);
  var worst = ck.some(function (x) { return x.k === 'fail'; }) ? 'fail' : ck.some(function (x) { return x.k === 'warn'; }) ? 'warn' : 'pass';
  var st = r.status, step = function (cls, ico, tt, sub) { return '<li class="' + cls + '"><span class="ico">' + ic(ico, 'fill') + '</span><div class="tt">' + tt + '</div><div class="ts">' + sub + '</div></li>'; };
  var sub = r.history.filter(function (h) { return h.s === 'submitted'; })[0];
  var tl = '<ul class="tl">' + step('ok', 'check', 'ยื่นคำขอเรียบร้อยแล้ว', sub ? fmtTs(sub.t) : '-') + step('ok', 'radar', 'ระบบตรวจเบื้องต้น', worst === 'fail' ? 'พบข้อควรพิจารณาด้านเขตห้าม' : worst === 'warn' ? 'ผ่าน มีข้อสังเกต' : 'ผ่านทุกข้อ') +
    step(st === 'submitted' ? 'cur' : st === 'review' || st === 'info' ? 'cur' : st === 'rejected' ? 'bad' : st === 'approved' ? 'ok' : 'future', st === 'rejected' ? 'close' : st === 'approved' ? 'check' : 'hourglass_top', 'ฝ่ายปกครองพิจารณา', st === 'rejected' ? 'ไม่อนุมัติ' : st === 'approved' ? 'อนุมัติแล้ว' : st === 'info' ? 'รอข้อมูลเพิ่มจากผู้ขอ' : 'กำลังดำเนินการ') +
    step(st === 'approved' ? 'ok' : 'future', 'cell_tower', 'ประสานหน่วยควบคุมจราจรทางอากาศ', 'เจ้าหน้าที่ประสานนอกระบบ (ยังไม่เชื่อมใน sandbox)') + step(st === 'approved' ? 'ok' : 'future', 'verified', 'ออกใบอนุญาต', r.permit ? 'เลขที่ ' + esc(r.permit) : 'รอผลพิจารณา') + '</ul>';
  var ne = nearestAirports(r.lat, r.lon, 1)[0], atc = atcOf(ne.ap.icao), amp = amphoeContact(r.province, r.amphoe);
  var rej = st === 'rejected' ? '<div class="reason"><b>เหตุผลที่ไม่อนุมัติ</b><br>' + esc(last.n || '-') + '</div>' : st === 'info' ? '<div class="reason info"><b>เจ้าหน้าที่ขอข้อมูลเพิ่ม</b><br>' + esc(last.n || '-') + '</div>' : '';
  var isC = role() === 'citizen';
  v.innerHTML = '<div class="row" style="margin-bottom:16px"><button class="btn ghost sm" id="bk">' + ic('arrow_back') + 'กลับ</button></div><div class="grid side"><div class="stack lg">' +
    '<div class="hero"><div class="row between"><span class="chip wait">' + ic(STATUS[st][1], 'fill sm') + esc(STATUS[st][0]) + '</span><span class="small" style="color:#b7c7e5">' + esc(r.no) + '</span></div><h1 class="h1" style="margin:12px 0 6px">คำขอจุด' + esc(t[0]) + '</h1><div class="small" style="color:#b7c7e5">ยื่นเมื่อ ' + (sub ? fmtTs(sub.t) : '-') + '</div></div>' + rej +
    '<div class="card"><h2 class="h2" style="margin-bottom:12px">ไทม์ไลน์สถานะ</h2>' + tl + '<details class="fold"><summary>ประวัติการเปลี่ยนสถานะ</summary>' + timeline(r) + '</details></div>' +
    '<div class="card"><h2 class="h2" style="margin-bottom:12px">ผลตรวจเบื้องต้น</h2>' + checkHTML(ck) + '</div>' + regCard(r.province, false) +
    (isC ? '<details class="fold"><summary><span>' + ic('help', 'sm') + ' ข้อควรทราบ: ถ้าไม่อนุมัติหรือต้องการข้อมูลเพิ่ม</span></summary><p class="small" style="margin-bottom:10px">เจ้าหน้าที่จะระบุเหตุผลไว้ในหน้านี้และแจ้งให้ทราบ ผู้ขอสามารถแก้ไขข้อมูลแล้วกด "แก้ไขแล้วส่งใหม่" ได้</p><p class="small" style="margin-bottom:12px">หากไม่เข้าใจเหตุผล หรือเร่งด่วน ติดต่อที่ทำการอำเภอตามเบอร์ในกล่อง "ติดต่อสอบถาม" ได้โดยตรง</p></details>' : '') + '</div>' +
    '<div class="stack lg"><div class="card"><h2 class="h2" style="margin-bottom:12px">รายละเอียด</h2><dl class="kv"><dt>ประเภท</dt><dd>' + t[0] + ' × ' + r.qty + (r.size ? ' (' + esc(r.size) + ')' : '') + '</dd><dt>วัน-เวลา</dt><dd>' + fmtDate(r.date) + ' ' + r.from + '–' + r.to + ' น.</dd><dt>สถานที่</dt><dd>' + esc(r.place || '-') + '<br>อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '</dd><dt>พิกัด</dt><dd>' + r.lat.toFixed(4) + ', ' + r.lon.toFixed(4) + '</dd>' + (r.ceil ? '<dt>ความสูงที่คาด</dt><dd>' + esc(r.ceil) + ' ฟุต</dd>' : '') + '<dt>ผู้ขอ</dt><dd>' + esc(r.applicant) + '<br><span class="tiny mute">โทร ' + esc(r.phone) + '</span></dd></dl><div class="mapbox" style="margin-top:14px"><div id="m3" class="map" style="height:260px"></div></div></div>' +
    coordCard(r) +
    '<div class="card"><h2 class="h3" style="margin-bottom:8px">ติดต่อสอบถาม</h2><div class="stack" style="gap:10px">' + (amp ? '<div class="tile"><div class="k">ที่ทำการอำเภอ' + esc(r.amphoe) + '</div><div class="v">' + telLink(amp.phone) + '</div>' + '<div class="tiny mute">เบอร์จากชุดข้อมูล v1 ยังไม่ได้ตรวจกับต้นฉบับ</div></div>' : '') + '<div class="tile"><div class="k">สายด่วนกรมการปกครอง</div><div class="v">' + esc((CT.hotlines && CT.hotlines.amphoe) || '-') + '</div></div>' + (atc ? '<div class="tile"><div class="k">หน่วยควบคุมจราจรทางอากาศใกล้พื้นที่ (' + esc(ne.ap.icao) + ')</div><div class="v">' + esc(atc.unit) + '<br><span class="small">โทร ' + esc(atc.tel || '-') + '</span></div></div>' : '') + '</div></div>' +
    '<div class="stack">' + (isC && st === 'approved' ? '<button class="btn amber block" id="pm">' + ic('description') + 'ดูใบอนุญาต</button><button class="btn ghost block" id="gl">' + ic('local_fire_department') + 'ไปหน้าวันจุด</button>' : '') +
    (isC && (st === 'rejected' || st === 'info') ? '<button class="btn amber block" id="rs">' + ic('edit') + 'แก้ไขแล้วส่งใหม่</button>' : '') + (isC && st === 'draft' ? '<button class="btn block" id="sd">' + ic('send') + 'ส่งคำขอ</button>' : '') +
    (isC && ['draft', 'submitted', 'review', 'info'].indexOf(st) > -1 ? '<button class="btn ghost block" id="cn">' + ic('cancel') + 'ยกเลิกคำขอ</button>' : '') + (!isC && st === 'approved' ? '<button class="btn amber block" id="pm">' + ic('description') + 'ดูใบอนุญาต</button>' : '') + '</div></div></div>';
  $('#bk').onclick = function () { history.length > 1 ? history.back() : go(isC ? 'mine' : 'inbox'); };
  var b = function (i, f) { var e = $(i); if (e) e.onclick = f; };
  b('#pm', function () { go('permit', r.id); }); b('#gl', function () { go('launch', r.id); });
  b('#rs', function () { setStatus(r, 'submitted', 'ผู้ขอ', 'แก้ไขและส่งใหม่'); toast('ส่งใหม่แล้ว'); render(); });
  b('#cn', function () { setStatus(r, 'cancelled', 'ผู้ขอ', 'ผู้ขอยกเลิกเอง'); render(); }); b('#sd', function () { setStatus(r, 'submitted', 'ผู้ขอ', ''); render(); });
  var m = mkMap('m3', [r.lat, r.lon], 11, { wheel: false }); if (m) L.marker([r.lat, r.lon]).addTo(m);
}
// ผู้ประสานงานหน้างาน (กดโทรได้) — ตามหน้ารายละเอียดใน Stitch
function coordCard(r) {
  var co = (r.contacts || []).filter(function (c) { return c && (c[0] || c[1]); });
  if (!co.length) return '';
  return '<div class="card"><h2 class="h3" style="margin-bottom:8px">' + ic('groups', 'sm') + ' ผู้ประสานงานหน้างาน</h2><div class="stack" style="gap:10px">' + co.map(function (c, i) { return '<div class="tile row between"><div><div class="k">คนที่ ' + (i + 1) + '</div><div class="v">' + esc(c[0] || '-') + '</div></div>' + (c[1] ? '<a class="btn ghost sm tel" href="tel:' + esc(String(c[1]).replace(/[^0-9]/g, '')) + '" aria-label="โทรหา ' + esc(c[0] || '') + '">' + ic('call', 'sm') + esc(c[1]) + '</a>' : '') + '</div>'; }).join('') + '</div></div>';
}
function vPermit(v) {
  var r = byId(arg); if (!r || !r.permit) { go('mine'); return; }
  var t = TYPES[r.type], ap = r.history.filter(function (h) { return h.s === 'approved'; })[0], ne = nearestAirports(r.lat, r.lon, 1)[0];
  v.innerHTML = '<div class="narrow stack"><div class="row noprint"><button class="btn ghost sm" id="bk">' + ic('arrow_back') + 'กลับ</button></div>' +
    '<div class="permit"><div class="ph"><div class="small" style="color:#b7c7e5">ใบอนุญาตตัวอย่าง (Sandbox)</div><h1 class="h1" style="margin-top:4px">ใบอนุญาตจุด/ปล่อย' + esc(t[0]) + '</h1><div class="small" style="color:#b7c7e5;margin-top:6px">เลขที่ ' + esc(r.permit) + ' · อ้างอิงคำขอ ' + esc(r.no) + '</div></div>' +
    '<div class="pb stack"><div class="chip ok" style="align-self:flex-start">' + ic('check_circle', 'fill sm') + 'อนุมัติแล้ว (ตัวอย่างทดสอบ)</div><dl class="kv"><dt>ผู้ได้รับอนุญาต</dt><dd>' + esc(r.applicant) + '</dd><dt>ประเภท/จำนวน</dt><dd>' + t[0] + ' × ' + r.qty + '</dd><dt>วัน-เวลา</dt><dd>' + fmtDate(r.date) + ' ' + r.from + '–' + r.to + ' น.</dd><dt>สถานที่</dt><dd>' + esc(r.place || '-') + '<br>อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '</dd><dt>พิกัด</dt><dd>' + r.lat.toFixed(4) + ', ' + r.lon.toFixed(4) + '</dd><dt>ท่าอากาศยานใกล้สุด</dt><dd>' + esc(ne.ap.nameTh) + ' (' + esc(ne.ap.icao) + ') ห่าง ' + ne.d.toFixed(1) + ' กม.</dd>' + (r.ceil ? '<dt>เพดานบินสูงสุด (AGL)</dt><dd><b>' + esc(Number(r.ceil).toLocaleString('th-TH')) + ' ฟุต</b> · ห้ามเกินที่ระบุ</dd>' : '') + '<dt>NOTAM</dt><dd>ประสานผ่านหน่วยควบคุมจราจรทางอากาศ (ยังไม่เชื่อมระบบจริงใน sandbox)</dd><dt>ผู้อนุมัติ</dt><dd>' + esc((ap && ap.by) || '-') + ' <span class="chip ok sm">' + ic('verified', 'fill sm') + 'ลงนามดิจิทัล (ตัวอย่าง)</span></dd><dt>เงื่อนไข</dt><dd>' + esc((ap && ap.n) || 'ต้องได้รับไฟเขียวจากหน่วยควบคุมจราจรทางอากาศก่อนจุดทุกครั้ง') + '</dd></dl>' +
    '<div class="row between" style="align-items:flex-end"><div><canvas id="qr" style="width:132px;height:132px;image-rendering:pixelated" aria-label="คิวอาร์โค้ดตัวอย่าง"></canvas><div class="tiny mute">สแกนเพื่อตรวจสถานะ (ตัวอย่าง)<br>สร้างรหัสเมื่อ ' + fmtTs(ap ? ap.t : Date.now()) + '</div></div><div style="text-align:center"><div style="height:44px"></div>……………………………<br><span class="tiny mute">ผู้พิจารณา (ตัวอย่าง)</span></div></div></div></div>' +
    '<div class="warnbox">' + ic('warning', 'fill') + '<div><b>ต้องกดขอไฟเขียวก่อนจุดจริงทุกครั้ง</b><div class="small">ใบอนุญาตนี้เป็นตัวอย่างทดสอบ ไม่มีผลทางกฎหมาย</div></div></div>' +
    '<div class="stack noprint"><button class="btn amber block" id="gl">' + ic('local_fire_department') + 'ไปหน้าวันจุด (ขอไฟเขียว)</button><div class="two"><button class="btn ghost" onclick="window.print()">' + ic('print') + 'พิมพ์ / PDF</button><button class="btn ghost" id="shr">' + ic('share') + 'แชร์ให้ทีมงาน</button></div>' +
    '<div class="card help"><b>' + ic('support_agent', 'fill') + ' ต้องการความช่วยเหลือ?</b><div class="small" style="margin:4px 0 8px">' + esc((CT.hotlines && CT.hotlines.amphoe) || '') + '</div></div></div></div>';
  $('#shr').onclick = function () {
    var txt = 'ใบอนุญาต (ตัวอย่างทดสอบ) ' + r.permit + ' · ' + t[0] + ' · ' + fmtDate(r.date) + ' ' + r.from + '–' + r.to + ' น. · อ.' + r.amphoe + ' จ.' + r.province;
    if (navigator.share) navigator.share({ title: 'ใบอนุญาตตัวอย่าง', text: txt }).catch(function () { });
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('คัดลอกข้อความแล้ว'); }, function () { toast('คัดลอกไม่ได้ กรุณาคัดลอกเอง'); });
    else toast('เบราว์เซอร์นี้ไม่รองรับการแชร์');
  };
  qr($('#qr'), r.permit); $('#bk').onclick = function () { go('detail', r.id); }; $('#gl').onclick = function () { go('launch', r.id); };
}
function vLaunch(v) {
  var ap = S.requests.filter(function (r) { return r.owner === 'me' && r.status === 'approved'; });
  if (!ap.length) { v.innerHTML = '<div class="narrow card empty">' + ic('event_busy') + '<p>ยังไม่มีคำขอที่ได้รับอนุมัติ</p></div>'; return; }
  var r = byId(arg); if (!r || ap.indexOf(r) < 0) r = ap[0];
  var L_ = r.launch, body = '', sig = '', ne = nearestAirports(r.lat, r.lon, 1)[0], atc = atcOf(ne.ap.icao);
  var fired = Math.min(r.fired || 0, r.qty), nextNo = fired + 1, left = r.qty - fired;
  if (L_ === 'none' || L_ === 'denied' || L_ === 'paused') {
    sig = '<div class="signal ' + (L_ === 'none' ? 'grey' : L_ === 'denied' ? 'red' : 'amber') + '"><div class="big">' + ic(L_ === 'paused' ? 'pause' : 'front_hand', 'fill') + '</div><b>' + (L_ === 'none' ? 'ยังไม่ได้ขอไฟเขียว' : L_ === 'denied' ? 'สถานะ: ยังไม่ให้จุด' : 'สถานะ: พักชั่วคราว') + '</b></div>';
    var dn = r.history[r.history.length - 1]; body = (L_ === 'denied' && dn.n ? '<div class="reason"><b>เหตุผลจากหน่วยควบคุมจราจรทางอากาศ</b><br>' + esc(dn.n) + '</div>' : '') + '<div class="warnbox">' + ic('block', 'fill') + '<div><b>ห้ามจุดจนกว่าจะได้รับไฟเขียว</b></div></div><button class="btn big" id="a1">' + ic('cell_tower') + (fired > 0 ? 'ขอไฟเขียวจุดชิ้นถัดไป (ชิ้นที่ ' + nextNo + ')' : L_ === 'none' ? 'ขอไฟเขียวจากหน่วยควบคุมจราจรทางอากาศ' : 'ขอไฟเขียวอีกครั้ง') + '</button><p class="tiny mute">ใน sandbox ไม่บังคับให้ตรงวัน เพื่อให้ทดลองได้</p>';
  } else if (L_ === 'asked') {
    sig = '<div class="signal amber"><div class="spin" aria-hidden="true"></div><b>รอไฟเขียว…</b></div>'; body = '<div class="warnbox">' + ic('block', 'fill') + '<div><b>ห้ามจุดจนกว่าจะได้รับไฟเขียว</b><div class="small">ทดลอง: สลับไปบทบาท ATC จากหน้าเข้าสู่ระบบเพื่อกดให้ไฟเขียว</div></div></div><button class="btn ghost block" id="a0">ยกเลิกการขอ</button>';
  } else if (L_ === 'green') {
    sig = '<div class="signal green"><div class="big">' + ic('check', 'fill') + '</div><b>ได้รับไฟเขียว จุดได้ตามเวลาที่ขอ</b></div>'; body = '<button class="btn ok big" id="a2">' + ic('local_fire_department', 'fill') + 'เริ่มจุด/ปล่อย (ชิ้นที่ ' + nextNo + ')</button>';
  } else if (L_ === 'burning') {
    sig = '<div class="signal green"><div class="big">' + ic('local_fire_department', 'fill') + '</div><b>กำลังจุด/ปล่อย ชิ้นที่ ' + nextNo + '</b></div>'; body = '<button class="btn ok big" id="a5">' + ic('task_alt', 'fill') + 'จุดชิ้นที่ ' + nextNo + ' เสร็จแล้ว</button><div class="actbar" style="margin-top:0"><button class="btn ghost" id="a3">' + ic('pause') + 'พักชั่วคราว</button><button class="btn bad" id="a4">' + ic('stop') + 'ปิดงานก่อนครบ</button></div>';
  } else { sig = '<div class="signal grey"><div class="big">' + ic('flag', 'fill') + '</div><b>สิ้นสุดการจุดแล้ว ใบอนุญาตนี้หมดผลแล้ว</b></div>'; }
  v.innerHTML = '<div class="narrow stack lg"><div><h1 class="h1">วันจุด/ปล่อย</h1><label class="f" for="ls">เลือกคำขอที่ได้รับอนุมัติ</label><select id="ls" class="in">' + ap.map(function (x) { return '<option value="' + x.id + '"' + (x.id === r.id ? ' selected' : '') + '>' + esc(x.no) + ' · ' + TYPES[x.type][0] + ' · ' + fmtDate(x.date) + '</option>'; }).join('') + '</select></div>' +
    '<div class="card stack"><div class="row between"><b>ใบอนุญาต ' + esc(r.permit) + '</b><span class="chip ' + (L_ === 'ended' ? 'off' : 'ok') + '">' + ic('check_circle', 'fill sm') + (L_ === 'ended' ? 'สิ้นสุดแล้ว' : 'ใช้งานได้') + '</span></div><div class="tile"><div class="k">' + fmtDate(r.date) + '</div><div class="v">' + r.from + '–' + r.to + ' น. · ' + TYPES[r.type][0] + ' × ' + r.qty + '</div></div>' +
    '<div class="grid g2"><div class="tile"><div class="k">ระบบวิทยุการบิน</div><div class="v">ยังไม่เชื่อมต่อ</div><div class="tiny mute">sandbox · ATC กดไฟเขียวในระบบนี้แทน</div></div><div class="tile"><div class="k">ลม / ทัศนวิสัย</div><div class="v">ไม่มีข้อมูลจริง</div><div class="tiny mute">ยังไม่เชื่อมแหล่งข้อมูลสภาพอากาศ</div></div></div></div>' +
    '<div class="card"><div class="row between"><div><div class="small mute">ความคืบหน้าการจุดประจำวัน</div><div class="h2">จุดแล้ว ' + fired + ' <span class="mute" style="font-weight:500">/ ' + r.qty + ' ชิ้น</span></div></div><span class="chip info">เหลืออีก ' + left + ' ชิ้น</span></div><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="' + r.qty + '" aria-valuenow="' + fired + '"><i style="width:' + (r.qty ? fired / r.qty * 100 : 0) + '%"></i></div></div>' +
    '<div class="card stack">' + sig + body + '</div>' +
    '<div class="card"><h2 class="h3" style="margin-bottom:10px">สายด่วน</h2><div class="stack" style="gap:10px"><div class="tile"><div class="k">กรมการปกครอง / ที่ทำการอำเภอ</div><div class="v">' + esc((CT.hotlines && CT.hotlines.amphoe) || '-') + '</div></div><div class="tile"><div class="k">เหตุด่วน</div><div class="v">' + esc((CT.hotlines && CT.hotlines.police) || '191') + '</div></div>' + (atc ? '<div class="tile"><div class="k">หน่วยควบคุมจราจรทางอากาศใกล้พื้นที่ (' + esc(ne.ap.icao) + ')</div><div class="v">' + esc(atc.unit) + '<br><span class="small">โทร ' + esc(atc.tel || '-') + '</span></div></div>' : '') + '</div></div></div>';
  $('#ls').onchange = function () { go('launch', this.value); };
  var b = function (i, f) { var e = $(i); if (e) e.onclick = f; };
  b('#a1', function () { logLaunch(r, 'asked', 'ผู้ขอ'); render(); }); b('#a0', function () { logLaunch(r, 'none', 'ผู้ขอ', 'ยกเลิกการขอไฟเขียว'); render(); });
  b('#a5', function () {
    r.fired = fired + 1;
    if (r.fired >= r.qty) { logLaunch(r, 'ended', 'ผู้ขอ', 'จุดครบ ' + r.qty + ' ชิ้น'); toast('จุดครบแล้ว ปิดงานอัตโนมัติ'); }
    else { logLaunch(r, 'none', 'ผู้ขอ', 'จุดชิ้นที่ ' + r.fired + ' เสร็จ — ต้องขอไฟเขียวชิ้นถัดไป'); }
    render();
  });
  b('#a2', function () { logLaunch(r, 'burning', 'ผู้ขอ'); render(); }); b('#a3', function () { logLaunch(r, 'paused', 'ผู้ขอ'); render(); }); b('#a4', function () { logLaunch(r, 'ended', 'ผู้ขอ'); render(); });
}
function vAccount(v) {
  var rl = ROLES[session.role];
  v.innerHTML = '<div class="narrow stack lg"><div class="card row" style="gap:16px"><div class="avatar" style="width:60px;height:60px;font-size:24px">' + esc((session.name || rl.name).charAt(0)) + '</div><div><h1 class="h2">' + esc(session.name || rl.name) + '</h1><div class="small mute">' + esc(rl.label) + '</div></div></div>' +
    '<div class="card"><h2 class="h3">สลับบทบาททดลอง</h2><p class="small mute" style="margin:4px 0 12px">เฉพาะ sandbox</p><div class="rolebtns">' + ['citizen', 'officer', 'atc', 'admin'].map(function (k) { return '<button class="btn ' + (k === session.role ? '' : 'ghost') + ' sm" data-r="' + k + '">' + esc(ROLES[k].label) + '</button>'; }).join('') + '</div></div>' +
    '<div class="card"><h2 class="h3">เวอร์ชันเก่า (เก็บไว้อ้างอิง)</h2><p class="small mute" style="margin:4px 0 12px">ตัวจำลองวิถี ร่างหนังสือ ข้อมูลอำเภอ และระเบียบ 77 จังหวัดย้ายมาไว้ใน v2 แล้ว ที่ยังอยู่เฉพาะใน v1: ตัวสร้างคำร้องแจ้ง 3 หน่วยงาน และแผนที่ความเสี่ยงจากบันทึกเหตุการณ์</p><a class="btn ghost" href="v1.html">' + ic('open_in_new') + 'เปิด v1</a></div>' +
    '<div class="card stack"><button class="btn ghost" id="rst">' + ic('restart_alt') + 'รีเซ็ตข้อมูลตัวอย่าง</button><button class="btn" id="out">' + ic('logout') + 'ออกจากระบบ</button><p class="tiny mute">ข้อมูลของ sandbox เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</p></div></div>';
  $$('[data-r]', v).forEach(function (b) { b.onclick = function () { session = { role: b.dataset.r, name: ROLES[b.dataset.r].name }; saveSess(); go(ROLES[b.dataset.r].nav[0][0]); }; });
  $('#rst').onclick = function () { S = seed(); save(); wz = null; toast('รีเซ็ตข้อมูลตัวอย่างแล้ว'); };
  $('#out').onclick = function () { session = null; saveSess(); go('login'); };
}

/* ================= OFFICER / ADMIN ================= */
function vInbox(v) {
  var open = ['submitted', 'review', 'info'], f = (arg && arg.indexOf('f:') === 0) ? arg.slice(2) : 'open';
  var list = S.requests.filter(function (r) { return r.status !== 'draft' && (f === 'all' || (f === 'open' ? open.indexOf(r.status) > -1 : r.status === f)); }).sort(function (a, b) { return b.history[b.history.length - 1].t - a.history[a.history.length - 1].t; });
  var c = counts();
  v.innerHTML = '<div class="stack lg"><div class="grid g4"><div class="card stat"><span class="n">' + ((c.submitted || 0) + (c.review || 0)) + '</span><span class="l">รอพิจารณา</span></div><div class="card stat"><span class="n">' + (c.info || 0) + '</span><span class="l">รอข้อมูลเพิ่ม</span></div><div class="card stat"><span class="n">' + (c.approved || 0) + '</span><span class="l">อนุมัติแล้ว</span></div><div class="card stat"><span class="n">' + (c.rejected || 0) + '</span><span class="l">ไม่อนุมัติ</span></div></div>' +
    '<div class="grid g2"><div class="card"><div class="row" style="margin-bottom:12px"><label for="flt" class="small mute">แสดง:</label><select id="flt" class="in" style="width:auto;min-height:44px;font-size:16px"><option value="open">รอดำเนินการ</option><option value="all">ทั้งหมด</option>' + Object.keys(STATUS).filter(function (k) { return k !== 'draft'; }).map(function (k) { return '<option value="' + k + '">' + STATUS[k][0] + '</option>'; }).join('') + '</select></div>' +
    '<div class="tablewrap">' + (list.length ? '<table><thead><tr><th>เลขที่</th><th>ผู้ขอ / พื้นที่</th><th>วันที่</th><th>สถานะ</th></tr></thead><tbody>' + list.map(function (r) { return '<tr class="click" data-id="' + r.id + '" tabindex="0"><td><b>' + esc(r.no) + '</b><br><span class="tiny mute">' + TYPES[r.type][0] + '</span></td><td>' + esc(r.applicant) + '<br><span class="tiny mute">อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '</span></td><td>' + fmtDate(r.date) + '</td><td>' + chip(r.status) + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">' + ic('celebration') + '<p>ไม่มีรายการ</p></div>') + '</div></div>' +
    '<div class="card"><h2 class="h2" style="margin-bottom:12px">แผนที่คำขอ</h2><div class="mapbox"><div id="m4" class="map tall"></div></div></div></div></div>';
  $('#flt').value = f; $('#flt').onchange = function () { go('inbox', 'f:' + this.value); };
  $$('tbody tr', v).forEach(function (tr) { tr.onclick = function () { go('review', tr.dataset.id); }; tr.onkeydown = function (e) { if (e.key === 'Enter') go('review', tr.dataset.id); }; });
  var m = mkMap('m4', [15.9, 103.4], 7, { panel: true });
  if (m) { var pts = []; list.forEach(function (r) { var col = { approved: '#15803D', rejected: '#B91C1C' }[r.status] || '#13243B'; L.circleMarker([r.lat, r.lon], { radius: 9, color: '#fff', weight: 2, fillColor: col, fillOpacity: 1 }).addTo(m).bindTooltip(r.no + ' · ' + STATUS[r.status][0]).on('click', function () { go('review', r.id); }); pts.push([r.lat, r.lon]); }); if (pts.length > 1) m.fitBounds(pts, { padding: [30, 30], maxZoom: 9 }); }
}
/* ร่างหนังสือแจ้งผล (พอร์ตจาก v1 แก้คำผิดแล้ว) — ร่างอัตโนมัติ ต้องให้ผู้มีอำนาจตรวจก่อนใช้จริง */
function letterLines(r, decision) {
  var pv = provOf(r.province), g = pv && pv.reg, hits = clearance(r.lat, r.lon), inZone = hits.length > 0, t = TYPES[r.type][0], D_ = new Date();
  var dateStr = D_.getDate() + ' ' + ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][D_.getMonth()] + ' ' + (D_.getFullYear() + 543);
  var basis = 'ประกาศจังหวัด' + r.province + (g && g.title ? ' เรื่อง ' + g.title : '') + ' ประกอบพระราชบัญญัติการเดินอากาศ พ.ศ. 2497';
  var L = [];
  if (decision === 'allow') {
    L.push('เรื่อง อนุญาตให้จุด/ปล่อย' + t + ' ตามคำขอเลขที่ ' + r.no);
    L.push('ตามที่ ' + r.applicant + ' ยื่นคำขอจุด/ปล่อย' + t + ' จำนวน ' + r.qty + ' ชิ้น ในวันที่ ' + fmtDate(r.date) + ' เวลา ' + r.from + '–' + r.to + ' น. ณ ' + (r.place || '-') + ' อำเภอ' + r.amphoe + ' จังหวัด' + r.province + ' นั้น');
    L.push('ผู้พิจารณาได้พิจารณาแล้ว อนุญาตตามที่ขอ โดยอาศัยอำนาจตาม' + basis);
    if (inZone) L.push('เงื่อนไข: ตำแหน่งที่ขออยู่ในเขตปลอดภัยทางการเดินอากาศของท่าอากาศยาน ต้องได้รับความเห็นชอบจากผู้ประกอบท่าอากาศยานก่อน');
    L.push('เงื่อนไข: ต้องขอและได้รับสัญญาณไฟเขียวจากหน่วยควบคุมจราจรทางอากาศก่อนจุด/ปล่อยทุกครั้ง');
    if (r.ceil) L.push('เงื่อนไข: ห้ามให้วัตถุขึ้นสูงเกิน ' + Number(r.ceil).toLocaleString('th-TH') + ' ฟุต จากพื้นดิน');
  } else {
    L.push('เรื่อง ไม่อนุญาตให้จุด/ปล่อย' + t + ' ตามคำขอเลขที่ ' + r.no);
    L.push('ตามที่ ' + r.applicant + ' ยื่นคำขอจุด/ปล่อย' + t + ' ในวันที่ ' + fmtDate(r.date) + ' ณ อำเภอ' + r.amphoe + ' จังหวัด' + r.province + ' นั้น');
    L.push(inZone ? 'ผู้พิจารณาไม่อนุญาต เนื่องจากตำแหน่งที่ขออยู่ในเขตปลอดภัยทางการเดินอากาศของท่าอากาศยาน ซึ่งห้ามจุด/ปล่อยวัตถุขึ้นอากาศ เว้นแต่ได้รับอนุญาตจากผู้ประกอบท่าอากาศยาน' : 'ผู้พิจารณาไม่อนุญาต ด้วยเหตุผล: [ระบุเหตุผล]');
    L.push('ทั้งนี้ อาศัยอำนาจตาม' + basis);
    L.push('ผู้ขอมีสิทธิอุทธรณ์คำสั่งนี้ตามพระราชบัญญัติวิธีปฏิบัติราชการทางปกครอง พ.ศ. 2539 มาตรา 44 ภายใน 15 วันนับแต่วันที่ได้รับแจ้งคำสั่ง');
  }
  return { head: decision === 'allow' ? 'หนังสืออนุญาต (ร่าง)' : 'หนังสือไม่อนุญาต (ร่าง)', date: 'ลงวันที่ ' + dateStr, lines: L, note: 'ร่างอัตโนมัติจากระบบทดสอบ ต้องให้ผู้มีอำนาจและผู้ตรวจสอบข้อกฎหมายตรวจก่อนใช้เป็นทางการ · ข้อกฎหมายอ้างอิงยังไม่ได้ตรวจกับต้นฉบับ' };
}
function letterBox(r) {
  var inZone = clearance(r.lat, r.lon).length > 0;
  return '<details class="fold" id="lbx"><summary><span>' + ic('mail', 'sm') + ' ร่างหนังสือแจ้งผล</span><span class="chip off sm">ร่าง</span></summary><label class="f" for="ld" style="margin-top:0">ผลที่ต้องการแจ้ง</label><select id="ld" class="in"><option value="allow"' + (inZone ? '' : ' selected') + '>อนุญาต</option><option value="deny"' + (inZone ? ' selected' : '') + '>ไม่อนุญาต</option></select><div id="lout" class="letter"></div><div class="actbar" style="margin:12px 0 14px"><button class="btn ghost sm" id="lcp">' + ic('content_copy', 'sm') + 'คัดลอกข้อความ</button><button class="btn ghost sm" id="lpr">' + ic('print', 'sm') + 'พิมพ์</button></div></details>';
}
function wireLetter(r) {
  var sel = $('#ld'); if (!sel) return;
  function draw() { var x = letterLines(r, sel.value); $('#lout').innerHTML = '<h3>' + esc(x.head) + '</h3><div class="d">' + esc(x.date) + '</div>' + x.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '<div class="n">' + esc(x.note) + '</div>'; return x; }
  draw(); sel.onchange = draw;
  $('#lcp').onclick = function () { var x = letterLines(r, sel.value), txt = [x.head, x.date].concat(x.lines, [x.note]).join('\n'); if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('คัดลอกแล้ว'); }, function () { toast('คัดลอกไม่ได้'); }); };
  $('#lpr').onclick = function () { var w = window.open('', '_blank'); if (!w) { toast('เบราว์เซอร์บล็อกหน้าต่างพิมพ์'); return; } w.document.write('<!doctype html><meta charset="utf-8"><title>ร่างหนังสือ</title><body style="font-family:Sarabun,Tahoma,sans-serif;max-width:640px;margin:24px auto;line-height:1.7">' + $('#lout').innerHTML + '</body>'); w.document.close(); w.focus(); w.print(); };
}
function vReview(v) {
  var r = byId(arg); if (!r) { go('inbox'); return; }
  var canAct = ['submitted', 'review', 'info'].indexOf(r.status) > -1;
  if (r.status === 'submitted') setStatus(r, 'review', 'นายอำเภอ', 'เริ่มพิจารณา');
  var t = TYPES[r.type], ne = nearestAirports(r.lat, r.lon, 1)[0], atc = atcOf(ne.ap.icao);
  v.innerHTML = '<div class="row" style="margin-bottom:16px"><button class="btn ghost sm" id="bk">' + ic('arrow_back') + 'กลับกล่องคำขอ</button></div><div class="grid side"><div class="stack lg">' +
    '<div class="card"><div class="row between"><h1 class="h2">' + esc(r.no) + '</h1>' + chip(r.status) + '</div><dl class="kv" style="margin-top:14px"><dt>ผู้ขอ</dt><dd>' + esc(r.applicant) + '<br><span class="tiny mute">โทร ' + esc(r.phone) + '</span></dd><dt>ประเภท/จำนวน</dt><dd>' + t[0] + ' × ' + r.qty + '</dd><dt>พื้นที่</dt><dd>' + esc(r.place || '-') + '<br>อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '</dd><dt>วัน-เวลา</dt><dd>' + fmtDate(r.date) + ' ' + r.from + '–' + r.to + ' น.</dd>' + (r.ceil ? '<dt>ความสูงที่คาด</dt><dd>' + esc(r.ceil) + ' ฟุต</dd>' : '') + '</dl></div>' +
    '<div class="card"><div class="row between" style="margin-bottom:6px"><h2 class="h2">ผลตรวจอัตโนมัติ</h2><span class="chip off sm">ตัวช่วย ไม่ตัดสินแทน</span></div>' + checkHTML(autoChecks(r)) + '</div>' + regCard(r.province, true) + letterBox(r) +
    (amphoeContact(r.province, r.amphoe) ? '<div class="card"><h2 class="h3" style="margin-bottom:8px">ที่ทำการอำเภอ' + esc(r.amphoe) + '</h2><div class="small">โทร ' + telLink(amphoeContact(r.province, r.amphoe).phone) + '</div></div>' : '') +
    (atc ? '<div class="card"><h2 class="h3" style="margin-bottom:8px">หน่วยควบคุมจราจรทางอากาศใกล้พื้นที่ (' + esc(ne.ap.icao) + ')</h2><div class="small">' + esc(atc.unit) + '<br>โทร ' + esc(atc.tel || '-') + (atc.email ? '<br>' + esc(atc.email) : '') + '</div></div>' : '') +
    '<div class="card"><h2 class="h2" style="margin-bottom:12px">ความคืบหน้า</h2>' + timeline(r) + '</div></div>' +
    '<div class="card" style="position:sticky;top:96px"><h2 class="h2" style="margin-bottom:12px">ตำแหน่งและการตัดสินใจ</h2><div class="mapbox"><div id="m5" class="map" style="height:300px"></div></div>' +
    (canAct ? '<label class="f" for="rn">หมายเหตุ / เหตุผล <span class="small mute">(บังคับเมื่อไม่อนุมัติหรือขอข้อมูลเพิ่ม)</span></label><textarea id="rn" class="in"></textarea><div class="actbar"><button class="btn ok" id="ap">' + ic('check_circle', 'fill') + 'อนุมัติ</button><button class="btn ghost" id="in">' + ic('help') + 'ขอข้อมูลเพิ่ม</button><button class="btn bad" id="rj">' + ic('block') + 'ไม่อนุมัติ</button></div>' : '<p class="small mute" style="margin-top:14px">คำขอนี้ปิดการพิจารณาแล้ว</p>' + (r.permit ? '<button class="btn amber block" id="pm" style="margin-top:12px">' + ic('description') + 'ดูใบอนุญาต</button>' : '')) + '</div></div>';
  $('#bk').onclick = function () { go('inbox'); };
  var m = mkMap('m5', [r.lat, r.lon], 11, { panel: true, wheel: false }); if (m) L.marker([r.lat, r.lon]).addTo(m);
  var pm = $('#pm'); if (pm) pm.onclick = function () { go('permit', r.id); };
  wireLetter(r);
  if (canAct) {
    var need = function () { var n = $('#rn').value.trim(); if (!n) { toast('กรุณาระบุเหตุผล'); $('#rn').focus(); return null; } return n; };
    $('#ap').onclick = function () { setStatus(r, 'approved', 'นายอำเภอ', $('#rn').value.trim()); toast('อนุมัติแล้ว ออกใบอนุญาต ' + r.permit); go('inbox'); };
    $('#in').onclick = function () { var n = need(); if (n) { setStatus(r, 'info', 'นายอำเภอ', n); toast('ส่งคำขอข้อมูลเพิ่มแล้ว'); go('inbox'); } };
    $('#rj').onclick = function () { var n = need(); if (n) { setStatus(r, 'rejected', 'นายอำเภอ', n); toast('บันทึกไม่อนุมัติแล้ว'); go('inbox'); } };
  }
}
function vGis(v) {
  v.innerHTML = '<div class="grid side"><div class="card"><h2 class="h2" style="margin-bottom:4px">แผนที่ GIS</h2><p class="small mute" style="margin-bottom:12px">แตะแผนที่เพื่อตรวจเขตห้ามและระเบียบจังหวัดของจุดนั้น · เปิด/ปิดชั้นข้อมูลได้ที่แผงมุมขวา</p><div class="mapbox"><div id="mg" class="map fill"></div></div></div><div class="stack" id="gres"><div class="card empty">' + ic('touch_app') + '<p>ยังไม่ได้เลือกจุด</p></div><div class="card">' + legendHTML() + '</div></div></div>';
  var m = mkMap('mg', [15.2, 101.2], 6, { panel: 'open' }), mk_ = null;
  if (S.requests.length && m) S.requests.forEach(function (r) { if (r.status === 'draft') return; L.circleMarker([r.lat, r.lon], { radius: 7, color: '#fff', weight: 2, fillColor: { approved: '#15803D', rejected: '#B91C1C' }[r.status] || '#D97706', fillOpacity: 1 }).addTo(m).bindTooltip(r.no + ' · ' + STATUS[r.status][0]); });
  if (m) m.on('click', function (e) {
    var lat = e.latlng.lat, lon = e.latlng.lng; if (mk_) mk_.setLatLng(e.latlng); else mk_ = L.marker(e.latlng).addTo(m);
    var hits = clearance(lat, lon), ns = nearestAirports(lat, lon, 3), p = nearestProvince(lat, lon);
    var near = S.requests.filter(function (r) { return r.status !== 'draft' && hav([lat, lon], [r.lat, r.lon]) < 10; });
    $('#gres').innerHTML = '<div class="card"><div class="tiny mute">พิกัด</div><b>' + lat.toFixed(4) + ', ' + lon.toFixed(4) + '</b><div style="margin-top:10px">' + (hits.length ? hits.map(function (h) { return checkHTML([{ k: 'fail', t: h.label, d: h.nameTh + ' (' + h.icao + ') ห่าง ' + h.d.toFixed(1) + ' กม. · ' + h.rule }]); }).join('') : checkHTML([{ k: 'pass', t: 'อยู่นอกเขต LHZ และ PHZ', d: 'ตามข้อมูลประกอบที่โหลดอยู่' }])) + '</div></div>' +
      '<div class="card"><h2 class="h3" style="margin-bottom:8px">ท่าอากาศยานใกล้เคียง</h2>' + ns.map(function (x) { return '<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>' + esc(x.ap.nameTh) + ' (' + esc(x.ap.icao) + ')</span><b>' + x.d.toFixed(1) + ' กม.</b></div>'; }).join('') + '</div>' +
      (p ? regCard(p.th, true) : '') + '<div class="card"><b>คำขอในรัศมี 10 กม.: ' + near.length + '</b>' + near.map(function (r) { return '<div class="small">' + esc(r.no) + ' · ' + STATUS[r.status][0] + '</div>'; }).join('') + '</div>';
  });
}
function vReports(v) {
  var R = S.requests.filter(function (r) { return r.status !== 'draft'; });
  function tally(f) { var o = {}; R.forEach(function (r) { var k = f(r); o[k] = (o[k] || 0) + 1; }); return o; }
  function bars(o) { var mx = Math.max.apply(null, Object.keys(o).map(function (k) { return o[k]; }).concat([1])); return '<div class="bars">' + Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).map(function (k) { return '<div class="bar"><span>' + esc(k) + '</span><i style="width:' + (o[k] / mx * 100) + '%"></i><b>' + o[k] + '</b></div>'; }).join('') + '</div>'; }
  var st = tally(function (r) { return r.status; }), cols = { approved: '#15803D', rejected: '#B91C1C', submitted: '#2d5183', review: '#D97706', info: '#B45309', cancelled: '#8a93a3', expired: '#b8b2a0' }, acc = 0, tot = R.length || 1, grad = [];
  Object.keys(st).forEach(function (k) { var a = acc / tot * 100, b = (acc + st[k]) / tot * 100; grad.push((cols[k] || '#999') + ' ' + a + '% ' + b + '%'); acc += st[k]; });
  v.innerHTML = '<div class="stack lg"><div class="row" style="justify-content:flex-end"><button class="btn ghost sm" id="csv">' + ic('download') + 'ส่งออก CSV (เปิดใน Excel ได้)</button></div><div class="grid g3"><div class="card"><h2 class="h3" style="margin-bottom:12px">ตามประเภท</h2>' + bars(tally(function (r) { return TYPES[r.type][0]; })) + '</div><div class="card"><h2 class="h3" style="margin-bottom:12px">ตามจังหวัด</h2>' + bars(tally(function (r) { return r.province; })) + '</div><div class="card"><h2 class="h3" style="margin-bottom:12px">ตามสถานะ</h2><div class="donut" style="background:conic-gradient(' + (grad.join(',') || '#ddd 0% 100%') + ')" role="img" aria-label="สัดส่วนสถานะคำขอ"></div><div class="lgd" style="margin-top:14px">' + Object.keys(st).map(function (k) { return '<span><i style="background:' + (cols[k] || '#999') + '"></i>' + STATUS[k][0] + ' · ' + st[k] + '</span>'; }).join('') + '</div></div></div>' +
    '<div class="card"><h2 class="h2" style="margin-bottom:12px">รายการทั้งหมด</h2><div class="tablewrap"><table><thead><tr><th>เลขที่</th><th>ชนิด</th><th>จังหวัด/อำเภอ</th><th>วันที่</th><th>สถานะ</th></tr></thead><tbody>' + R.map(function (r) { return '<tr><td>' + esc(r.no) + '</td><td>' + TYPES[r.type][0] + ' × ' + r.qty + '</td><td>' + esc(r.province) + ' / ' + esc(r.amphoe) + '</td><td>' + fmtDate(r.date) + '</td><td>' + chip(r.status) + '</td></tr>'; }).join('') + '</tbody></table></div></div></div>';
  $('#csv').onclick = function () {
    var rows = [['เลขที่', 'ชนิด', 'จำนวน', 'จังหวัด', 'อำเภอ', 'วันที่', 'สถานะ']].concat(R.map(function (r) { return [r.no, TYPES[r.type][0], r.qty, r.province, r.amphoe, r.date, STATUS[r.status][0]]; }));
    var csv = '﻿' + rows.map(function (x) { return x.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'bangfai-sandbox-report.csv'; a.click();
  };
}
function vUsers(v) {
  v.innerHTML = '<div class="grid g2"><div class="card"><h2 class="h2" style="margin-bottom:12px">บัญชีในระบบ (ตัวอย่าง)</h2><div class="tablewrap"><table><thead><tr><th>ชื่อ</th><th>บทบาท</th><th>เข้าสู่ระบบด้วย</th></tr></thead><tbody>' + S.users.map(function (u) { return '<tr><td>' + esc(u[0]) + '</td><td><span class="chip info sm">' + esc(u[1]) + '</span></td><td class="small mute">' + esc(u[2]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
    '<div class="stack"><div class="card"><h2 class="h2" style="margin-bottom:8px">ลำดับการสร้างบัญชี</h2><ol style="padding-left:20px;margin:0"><li>กรมการปกครอง สร้าง/จัดการ ผู้ว่าราชการจังหวัด ปลัดจังหวัด และนายอำเภอ</li><li>ผู้ว่าฯ / ปลัดจังหวัด สร้าง/จัดการ นายอำเภอ</li><li>นายอำเภอ ออกบัญชีชั่วคราวให้ประชาชนที่ยังไม่มี ThaID (ต้องมีวันหมดอายุ)</li></ol></div>' +
    '<div class="card"><h2 class="h2" style="margin-bottom:8px">สร้างบัญชีชั่วคราวให้ประชาชน</h2><div class="check note">' + ic('info', 'fill') + '<div><small>ใน sandbox ใช้ชื่อสมมติเท่านั้น</small></div></div><label class="f" for="un">ชื่อ-สกุล (สมมติ)</label><input id="un" class="in"><button class="btn amber" id="uadd" style="margin-top:16px">สร้างบัญชี</button></div></div></div>';
  $('#uadd').onclick = function () { var n = $('#un').value.trim(); if (!n) { toast('กรุณากรอกชื่อ'); return; } S.users.push([n + ' (ทดสอบ)', 'ประชาชน', 'บัญชีชั่วคราว']); save(); toast('สร้างบัญชีชั่วคราวแล้ว'); render(); };
}
function vAtc(v) {
  var ask = S.requests.filter(function (r) { return r.launch === 'asked'; }), up = S.requests.filter(function (r) { return r.status === 'approved' && r.launch === 'none'; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  v.innerHTML = '<div class="grid g2e"><div class="card"><h2 class="h2" style="margin-bottom:12px">รอไฟเขียว (' + ask.length + ')</h2><div class="stack">' + (ask.length ? ask.map(function (r) {
    var ne = nearestAirports(r.lat, r.lon, 1)[0]; return '<div class="card flat" style="border:2px solid var(--amber)"><div class="row between"><b style="font-size:19px">' + esc(r.no) + '</b>' + chip('approved') + '</div><p style="margin:8px 0">' + TYPES[r.type][0] + ' × ' + r.qty + ' · อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '<br><span class="small mute">' + r.from + '–' + r.to + ' น. · ท่าอากาศยานใกล้สุด ' + esc(ne.ap.nameTh) + ' ' + ne.d.toFixed(1) + ' กม.</span></p><textarea class="in" id="t' + r.id + '" placeholder="เหตุผล (บังคับถ้าไม่ให้)"></textarea><div class="actbar" style="margin-top:12px"><button class="btn ok" data-g="' + r.id + '">' + ic('check_circle', 'fill') + 'ให้ไฟเขียว</button><button class="btn bad" data-d="' + r.id + '">' + ic('block') + 'ไม่ให้</button></div></div>';
  }).join('') : '<div class="empty">' + ic('coffee') + '<p>ไม่มีคำขอไฟเขียวในขณะนี้</p></div>') + '</div></div>' +
    '<div class="card"><h2 class="h2" style="margin-bottom:12px">อนุมัติแล้วและจะถึง</h2>' + (up.length ? '<div class="tablewrap"><table><thead><tr><th>เลขที่</th><th>พื้นที่</th><th>วัน-เวลา</th></tr></thead><tbody>' + up.map(function (r) { return '<tr><td>' + esc(r.no) + '<br><span class="tiny mute">' + TYPES[r.type][0] + '</span></td><td>อ.' + esc(r.amphoe) + ' จ.' + esc(r.province) + '</td><td>' + fmtDate(r.date) + '<br><span class="tiny mute">' + r.from + '–' + r.to + '</span></td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">ไม่มีรายการ</div>') + '</div></div>';
  $$('[data-g]', v).forEach(function (b) { b.onclick = function () { logLaunch(byId(b.dataset.g), 'green', 'ATC'); toast('ให้ไฟเขียวแล้ว'); render(); }; });
  $$('[data-d]', v).forEach(function (b) { b.onclick = function () { var n = $('#t' + b.dataset.d).value.trim(); if (!n) { toast('กรุณาระบุเหตุผล'); return; } logLaunch(byId(b.dataset.d), 'denied', 'ATC', n); toast('บันทึกไม่ให้จุดแล้ว'); render(); }; });
}
function vAudit(v) {
  var ev = []; S.requests.forEach(function (r) { r.history.forEach(function (h) { ev.push({ t: h.t, no: r.no, by: h.by, s: histLabel(h), n: h.n }); }); }); ev.sort(function (a, b) { return b.t - a.t; });
  v.innerHTML = '<div class="card stack"><div class="check note">' + ic('info', 'fill') + '<div><small>ในระบบจริง ตารางนี้เป็นแบบเขียนอย่างเดียว (append-only) มีแฮชต่อเนื่อง ไม่มีใครแก้หรือลบได้ (ดู sandbox/schema.sql)</small></div></div><div class="tablewrap"><table><thead><tr><th>เวลา</th><th>คำขอ</th><th>เหตุการณ์</th><th>โดย</th><th>หมายเหตุ</th></tr></thead><tbody>' + ev.map(function (e) { return '<tr><td class="small mute">' + fmtTs(e.t) + '</td><td>' + esc(e.no) + '</td><td><b>' + esc(e.s) + '</b></td><td>' + esc(e.by) + '</td><td class="small mute">' + esc(e.n) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
}
function vData(v) {
  var rm = (D.regulations && D.regulations.meta) || {}, issues = [];
  AIR.airports.forEach(function (a) { if (!/^VT[A-Z]{2}$/.test(a.icao)) issues.push('รหัส ICAO ผิดรูปแบบ: ' + a.icao + ' (' + a.nameTh + ') — ต้องยืนยันกับ AIP'); });
  var unver = REG.filter(function (p) { return p.reg && !p.reg.verified; }).length;
  v.innerHTML = '<div class="stack lg"><div class="card"><h2 class="h2" style="margin-bottom:6px">ชั้นข้อมูลแผนที่ (Layer registry)</h2><p class="small mute" style="margin-bottom:12px">ทุกชั้นต้องมีที่มา วันที่ข้อมูล และเจ้าของ · เพิ่มชั้นใหม่ได้ด้วย BF.registerLayer()</p><div class="tablewrap"><table><thead><tr><th>ชั้นข้อมูล</th><th>ที่มา</th><th>วันที่มีผล</th><th>เจ้าของข้อมูล</th><th>สถานะ</th></tr></thead><tbody>' + LAYERS.map(function (l) { return '<tr><td><b>' + esc(l.name) + '</b></td><td class="small">' + esc(l.source || '-') + '</td><td>' + esc(l.effective || '-') + '</td><td class="small">' + esc(l.owner || '-') + '</td><td><span class="chip sm ' + (l.status === 'verified' ? 'ok' : 'wait') + '">' + (l.status === 'verified' ? 'รับรองแล้ว' : 'ข้อมูลประกอบ') + '</span></td></tr>'; }).join('') + '</tbody></table></div></div>' +
    '<div class="grid g2e"><div class="card"><h2 class="h3" style="margin-bottom:8px">ชุดข้อมูลที่โหลด</h2><dl class="kv"><dt>สนามบิน</dt><dd>' + AIR.airports.length + ' แห่ง · ' + esc(AIRMETA.source || '') + ' · มีผล ' + esc(AIRMETA.effective || '-') + '</dd><dt>ระเบียบจังหวัด</dt><dd>' + REG.length + ' จังหวัด (ตรวจกับต้นฉบับ ' + (REG.length - unver) + ' · ใช้แบบมาตรฐาน ' + unver + ')</dd><dt>อำเภอ</dt><dd>' + Object.keys(AM).length + ' จังหวัด (ชุดข้อมูล DOPA)</dd><dt>สร้างข้อมูลเมื่อ</dt><dd>' + esc((AIRMETA.builtAt || '').slice(0, 10)) + '<br><span class="tiny mute">สร้างด้วย v2/build_data.js จากข้อมูล v1</span></dd></dl></div>' +
    '<div class="card"><h2 class="h3" style="margin-bottom:8px">ประเด็นที่ต้องตรวจ</h2>' + (issues.map(function (x) { return checkHTML([{ k: 'warn', t: x, d: 'บันทึกใน sandbox/AIRPORT-DATA-AUDIT.md' }]); }).join('')) + ((rm.corrections || []).map(function (c) { return checkHTML([{ k: 'note', t: 'แก้ข้อมูลต้นทาง: ' + c.province + ' · ' + c.field + ' ' + c.from + ' → ' + c.to, d: c.why }]); }).join('')) + checkHTML([{ k: 'note', t: 'ความครบถ้วนของสนามบิน 43 แห่งและพิกัดรายแห่ง', d: 'ยังไม่ได้เทียบกับ AIP ต้นฉบับ ต้องให้ผู้มีอำนาจของ กพท. ยืนยันก่อนใช้ตัดสินใจจริง' }]) + '</div></div></div>';
}

/* ================= boot ================= */
load();
BF.state = function () { return S; };
if (!location.hash) { if (session) location.hash = '#' + ROLES[session.role].nav[0][0]; }
render();
})();
