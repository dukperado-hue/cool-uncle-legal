/* Lung Kai Tools — web edition. Every tool runs in the browser; files never leave the device.
   Each tool: async (files: File[], form: FormData, progress: fn) => {blob, name, note?} */
'use strict';

// Browsers pause requestAnimationFrame in background tabs, which stalls pdf.js rendering mid-job.
(() => {
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => document.hidden ? setTimeout(() => cb(performance.now()), 0) : raf(cb);
})();

const { PDFDocument, rgb } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';

/* ---------- helpers ---------- */
class UserError extends Error {}
const stem = n => (n.replace(/\.[^.]+$/, '') || 'file');
const ext = n => (n.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
const yieldUI = () => new Promise(r => setTimeout(r, 0));
const buf = f => f.arrayBuffer();
const mimeOf = {
  pdf: 'application/pdf', zip: 'application/zip', mp3: 'audio/mpeg', wav: 'audio/wav',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const asBlob = (data, name) => new Blob([data], { type: mimeOf[ext(name)] || 'application/octet-stream' });
const canvasBlob = (cv, type, q) => new Promise(r => cv.toBlob(r, type, q));
const canvasBytes = async (cv, type, q) => new Uint8Array(await (await canvasBlob(cv, type, q)).arrayBuffer());

async function zipOf(items) {
  const z = new JSZip();
  items.forEach(([n, d]) => z.file(n, d));
  return z.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

function parseRanges(spec, n) {
  const pages = [];
  for (const part of spec.split(/[,\s]+/).filter(Boolean)) {
    let a, b, m;
    if ((m = part.match(/^(\d*)-(\d*)$/))) { a = +(m[1] || 1); b = +(m[2] || n); }
    else if (/^\d+$/.test(part)) a = b = +part;
    else throw new UserError('รูปแบบช่วงหน้าไม่ถูกต้อง: ' + part);
    if (a < 1 || b > n || a > b) throw new UserError(`ช่วงหน้าเกินขอบเขต: ${part} (เอกสารมี ${n} หน้า)`);
    for (let i = a; i <= b; i++) pages.push(i - 1);
  }
  if (!pages.length) throw new UserError('ระบุช่วงหน้าไม่ถูกต้อง');
  return pages;
}

async function pdfLibOpen(file) {
  try { return await PDFDocument.load(await buf(file)); }
  catch (e) {
    if (/encrypt/i.test(e.message)) throw new UserError('PDF ถูกล็อกด้วยรหัสผ่าน — เวอร์ชันเว็บยังไม่รองรับ');
    throw new UserError('เปิดไฟล์ PDF ไม่ได้: ' + file.name);
  }
}
async function pdfJsOpen(file) {
  try { return await pdfjsLib.getDocument({ data: new Uint8Array(await buf(file)) }).promise; }
  catch (e) {
    if (e.name === 'PasswordException') throw new UserError('PDF ถูกล็อกด้วยรหัสผ่าน — เวอร์ชันเว็บยังไม่รองรับ');
    throw new UserError('เปิดไฟล์ PDF ไม่ได้: ' + file.name);
  }
}
async function renderPage(pdf, i, scale) {
  const page = await pdf.getPage(i);
  const vp = page.getViewport({ scale });
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return { cv, ctx, page, vp };
}
async function imageToJpeg(file, q = 0.92) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const cv = document.createElement('canvas');
  cv.width = bmp.width; cv.height = bmp.height;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bmp, 0, 0);
  return { bytes: await canvasBytes(cv, 'image/jpeg', q), w: cv.width, h: cv.height };
}
async function addImagePage(doc, file) {
  const { bytes, w, h } = await imageToJpeg(file);
  const img = await doc.embedJpg(bytes);
  const page = doc.addPage([w * 0.75, h * 0.75]);
  page.drawImage(img, { x: 0, y: 0, width: w * 0.75, height: h * 0.75 });
}

/* ---------- PDF tools ---------- */
async function merge(files, f, progress) {
  const out = await PDFDocument.create();
  for (const file of files) {
    progress(`กำลังรวม ${file.name}`);
    if (ext(file.name) === 'pdf') {
      const src = await pdfLibOpen(file);
      (await out.copyPages(src, src.getPageIndices())).forEach(p => out.addPage(p));
    } else await addImagePage(out, file);
  }
  // running number persists per browser: loongkai_001.pdf, loongkai_002.pdf, ...
  let n = 1;
  try { n = (+localStorage.getItem('lk_merge_n') || 0) + 1; localStorage.setItem('lk_merge_n', n); } catch {}
  return { blob: asBlob(await out.save(), 'a.pdf'), name: `loongkai_${String(n).padStart(3, '0')}.pdf` };
}

async function split(files, f) {
  const file = files[0], src = await pdfLibOpen(file), n = src.getPageCount();
  if (f.get('mode') === 'each') {
    const items = [];
    for (let i = 0; i < n; i++) {
      const d = await PDFDocument.create();
      d.addPage((await d.copyPages(src, [i]))[0]);
      items.push([`${stem(file.name)}_p${String(i + 1).padStart(3, '0')}.pdf`, await d.save()]);
    }
    return { blob: await zipOf(items), name: `${stem(file.name)}_split.zip` };
  }
  const pages = parseRanges(f.get('ranges') || '1', n);
  const d = await PDFDocument.create();
  (await d.copyPages(src, pages)).forEach(p => d.addPage(p));
  return { blob: asBlob(await d.save(), 'a.pdf'), name: `${stem(file.name)}_extract.pdf` };
}

async function compress(files, f, progress) {
  const file = files[0], pdf = await pdfJsOpen(file);
  const [dpi, q] = { light: [150, 0.8], medium: [110, 0.6], strong: [72, 0.45] }[f.get('level') || 'medium'];
  const out = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    progress(`หน้า ${i}/${pdf.numPages}`);
    const { cv, page } = await renderPage(pdf, i, dpi / 72);
    const [w, h] = (({ view }) => [view[2] - view[0], view[3] - view[1]])(page);
    const img = await out.embedJpg(await canvasBytes(cv, 'image/jpeg', q));
    out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
    await yieldUI();
  }
  const bytes = await out.save();
  if (bytes.length >= file.size)
    return { blob: file, name: file.name, note: 'บีบแล้วไม่เล็กลง จึงคืนไฟล์เดิมให้' };
  return { blob: asBlob(bytes, 'a.pdf'), name: `${stem(file.name)}_compressed.pdf`,
           note: 'หมายเหตุ: หน้ากระดาษถูกแปลงเป็นภาพ ข้อความจะเลือก/ค้นหาไม่ได้' };
}

async function pdf2img(files, f, progress) {
  const file = files[0], pdf = await pdfJsOpen(file);
  const dpi = +(f.get('dpi') || 150), jpg = f.get('fmt') === 'jpg', items = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    progress(`หน้า ${i}/${pdf.numPages}`);
    const { cv } = await renderPage(pdf, i, dpi / 72);
    items.push([`${stem(file.name)}_p${String(i).padStart(3, '0')}.${jpg ? 'jpg' : 'png'}`,
      await canvasBytes(cv, jpg ? 'image/jpeg' : 'image/png', 0.9)]);
    await yieldUI();
  }
  return { blob: await zipOf(items), name: `${stem(file.name)}_images.zip` };
}

async function img2pdf(files, f, progress) {
  const out = await PDFDocument.create();
  for (const file of files) { progress(file.name); await addImagePage(out, file); }
  return { blob: asBlob(await out.save(), 'a.pdf'), name: 'images.pdf' };
}

async function tables(files, f, progress) {
  const file = files[0], pdf = await pdfJsOpen(file);
  const wb = XLSX.utils.book_new();
  let multiCellRows = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    progress(`หน้า ${p}/${pdf.numPages}`);
    const tc = await (await pdf.getPage(p)).getTextContent();
    const its = tc.items.filter(i => i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width }));
    its.sort((a, b) => b.y - a.y || a.x - b.x);
    const rows = [];
    for (const it of its) {
      const r = rows.find(r => Math.abs(r.y - it.y) < 3);
      r ? r.items.push(it) : rows.push({ y: it.y, items: [it] });
    }
    const aoa = rows.sort((a, b) => b.y - a.y).map(r => {
      r.items.sort((a, b) => a.x - b.x);
      const cells = [];
      let last = null;
      for (const it of r.items) {
        if (last && it.x - (last.x + last.w) < 6) cells[cells.length - 1] += (it.x - (last.x + last.w) > 1 ? ' ' : '') + it.s;
        else cells.push(it.s);
        last = it;
      }
      if (cells.length > 1) multiCellRows++;
      return cells;
    });
    if (aoa.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'p' + p);
  }
  if (!multiCellRows) throw new UserError('ไม่พบตารางในไฟล์ PDF นี้ (ไฟล์สแกนเป็นภาพใช้ไม่ได้)');
  const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return { blob: asBlob(data, 'a.xlsx'), name: `${stem(file.name)}_tables.xlsx`,
           note: 'ตรวจคอลัมน์ในไฟล์ Excel อีกครั้ง — ตัดคอลัมน์จากตำแหน่งข้อความ อาจเพี้ยนกับตารางซับซ้อน' };
}

let fontReady;
function loadMarkFont() {
  fontReady ??= new FontFace('LKThai', 'url(static/fonts/NotoSansThai-700.ttf)').load()
    .then(ff => document.fonts.add(ff)).catch(() => {});
  return fontReady;
}
async function makeMark(text, color, opacity, deg) {
  await loadMarkFont();
  const S = 240, font = `700 ${S}px LKThai, Tahoma, "Leelawadee UI", sans-serif`;
  const m = document.createElement('canvas').getContext('2d');
  m.font = font;
  const tw = Math.ceil(m.measureText(text).width), th = Math.ceil(S * 1.5), pad = 40;
  const w0 = tw + pad * 2, h0 = th + pad * 2, r = deg * Math.PI / 180;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(Math.abs(w0 * Math.cos(r)) + Math.abs(h0 * Math.sin(r)));
  cv.height = Math.ceil(Math.abs(w0 * Math.sin(r)) + Math.abs(h0 * Math.cos(r)));
  const ctx = cv.getContext('2d');
  ctx.translate(cv.width / 2, cv.height / 2); ctx.rotate(r);
  ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.globalAlpha = opacity; ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  return { bytes: await canvasBytes(cv, 'image/png'), ratio: cv.width / cv.height };
}
async function watermark(files, f) {
  const file = files[0], doc = await pdfLibOpen(file);
  const text = (f.get('text') || '').trim() || 'ลับ';
  const layout = f.get('layout') || 'header';
  const color = { red: '#C14953', black: '#111111', teal: '#2D4746' }[f.get('color')] || '#C14953';
  const { bytes, ratio } = await makeMark(text, color, (+f.get('opacity') || 25) / 100, layout === 'header' ? 0 : -35);
  const img = await doc.embedPng(bytes);
  for (const page of doc.getPages()) {
    const { width: W, height: H } = page.getSize();
    if (layout === 'header') {
      const h = 46, w = h * ratio;
      page.drawImage(img, { x: W / 2 - w / 2, y: H - 14 - h, width: w, height: h });
    } else if (layout === 'tile') {
      const w = W / 3.2, h = w / ratio;
      for (let y = 0, row = 0; y < H; y += h * 1.05, row++)
        for (let x = row % 2 ? -w / 2 : 0; x < W; x += w * 1.05)
          page.drawImage(img, { x, y: H - y - h, width: w, height: h });
    } else {
      const w = Math.min(W * 0.85, H * 0.85 * ratio), h = w / ratio;
      page.drawImage(img, { x: W / 2 - w / 2, y: H / 2 - h / 2, width: w, height: h });
    }
  }
  return { blob: asBlob(await doc.save(), 'a.pdf'), name: `${stem(file.name)}_watermark.pdf` };
}

/* ---------- Data: de-identification ---------- */
const SEP = '[\\s\\-\\u00ad\\u2010-\\u2015]?';
const PATTERNS = {
  thai_id: `(?<!\\d)\\d${SEP}\\d{4}${SEP}\\d{5}${SEP}\\d{2}${SEP}\\d(?!\\d)`,
  phone: `(?<!\\d)0\\d{1,2}${SEP}\\d{3}${SEP}\\d{3,4}(?!\\d)`,
  email: '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+',
  aircraft: '\\b(?:HS|N|B|9V|VT|RP|PK|9M|JA|D|F|G)[-\\u00ad\\u2010-\\u2015][A-Z0-9]{3,5}\\b',
  titled_name: '(?:นาย|นางสาว|นาง|น\\.ส\\.|Mr\\.?|Mrs\\.?|Ms\\.?|Capt\\.?|กัปตัน|ร\\.อ\\.|พ\\.อ\\.)\\s?[\\u0E00-\\u0E7FA-Za-z]+(?:\\s[\\u0E00-\\u0E7FA-Za-z]+)?',
};
const escRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function buildRedactor(f) {
  const pats = f.getAll('kinds').filter(k => PATTERNS[k]).map(k => PATTERNS[k]);
  (f.get('words') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(w => pats.push(escRx(w)));
  const custom = (f.get('regex') || '').trim();
  if (custom) { try { new RegExp(custom); } catch (e) { throw new UserError('Regex ไม่ถูกต้อง: ' + e.message); } pats.push(custom); }
  if (!pats.length) throw new UserError('เลือกชนิดข้อมูลที่จะเซ็นเซอร์อย่างน้อย 1 อย่าง');
  const src = pats.map(p => `(?:${p})`).join('|');
  const tag = f.get('mask') === 'tag';
  return {
    rx: () => new RegExp(src, 'g'),
    sub: s => s.replace(new RegExp(src, 'g'), m => tag ? '[REDACTED]' : '█'.repeat(Math.max(4, Math.min(m.length, 14)))),
  };
}

async function redactPdf(file, R, progress) {
  const pdf = await pdfJsOpen(file), out = await PDFDocument.create();
  const SC = 2;
  for (let i = 1; i <= pdf.numPages; i++) {
    progress(`${file.name} — หน้า ${i}/${pdf.numPages}`);
    const { cv, ctx, page, vp } = await renderPage(pdf, i, SC);
    const items = (await page.getTextContent()).items.filter(t => t.str);
    let text = '', spans = [], prev = null;
    for (const it of items) {
      if (prev) {
        const sameLine = Math.abs(it.transform[5] - prev.transform[5]) < 2;
        const gap = it.transform[4] - (prev.transform[4] + prev.width);
        if (!sameLine) text += '\n';
        else if (gap > 0.5) text += ' ';
      }
      spans.push({ it, s: text.length, e: text.length + it.str.length });
      text += it.str;
      prev = it;
    }
    ctx.fillStyle = '#000';
    for (const m of text.matchAll(R.rx())) {
      const ms = m.index, me = ms + m[0].length;
      for (const sp of spans) {
        const a = Math.max(ms, sp.s), b = Math.min(me, sp.e);
        if (a >= b) continue;
        const t = sp.it, len = t.str.length, x = t.transform[4], y = t.transform[5];
        const h = Math.abs(t.transform[3]) || t.height || 10;
        // proportional fonts: split the item's width by measured glyph widths, not char count
        const mctx = redactPdf.m ??= document.createElement('canvas').getContext('2d');
        mctx.font = '100px Arial, "Leelawadee UI", sans-serif';
        const tot = mctx.measureText(t.str).width || 1;
        const x0 = x + t.width * mctx.measureText(t.str.slice(0, a - sp.s)).width / tot;
        const x1 = x + t.width * mctx.measureText(t.str.slice(0, b - sp.s)).width / tot;
        const [vx0, vy0, vx1, vy1] = vp.convertToViewportRectangle([x0, y - h * 0.25, x1, y + h * 1.0]);
        ctx.fillRect(Math.min(vx0, vx1) - 2, Math.min(vy0, vy1) - 2, Math.abs(vx1 - vx0) + 4, Math.abs(vy1 - vy0) + 4);
      }
    }
    const [w, h] = [page.view[2] - page.view[0], page.view[3] - page.view[1]];
    const img = await out.embedJpg(await canvasBytes(cv, 'image/jpeg', 0.85));
    out.addPage([w, h]).drawImage(img, { x: 0, y: 0, width: w, height: h });
    await yieldUI();
  }
  return await out.save();
}

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
async function redactDocx(file, R) {
  const z = await JSZip.loadAsync(await buf(file));
  const parts = Object.keys(z.files).filter(n => /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(n));
  for (const n of parts) {
    const xml = new DOMParser().parseFromString(await z.file(n).async('string'), 'application/xml');
    for (const p of xml.getElementsByTagNameNS(W_NS, 'p')) {
      const ts = [...p.getElementsByTagNameNS(W_NS, 't')];
      if (!ts.length) continue;
      const old = ts.map(t => t.textContent).join(''), neu = R.sub(old);
      if (neu === old) continue;
      ts[0].textContent = neu; ts[0].setAttribute('xml:space', 'preserve');
      ts.slice(1).forEach(t => (t.textContent = ''));
    }
    z.file(n, new XMLSerializer().serializeToString(xml));
  }
  if (z.file('docProps/core.xml')) {
    const core = (await z.file('docProps/core.xml').async('string'))
      .replace(/(<dc:creator>)[^<]*(<\/dc:creator>)/, '$1$2').replace(/(<cp:lastModifiedBy>)[^<]*(<\/cp:lastModifiedBy>)/, '$1$2');
    z.file('docProps/core.xml', core);
  }
  return z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

async function redactXlsx(file, R) {
  const wb = XLSX.read(await buf(file), { type: 'array', cellStyles: true });
  for (const ws of Object.values(wb.Sheets))
    for (const [k, c] of Object.entries(ws)) {
      if (k[0] === '!' || c.f || c.v == null || (c.t !== 's' && c.t !== 'n')) continue;
      const s = String(c.v), r = R.sub(s);
      if (r !== s) { c.v = r; c.t = 's'; delete c.w; delete c.z; }
    }
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

async function redact(files, f, progress) {
  const R = buildRedactor(f), items = [];
  for (const file of files) {
    const e = ext(file.name);
    let data;
    if (e === 'pdf') data = await redactPdf(file, R, progress);
    else if (e === 'docx') data = await redactDocx(file, R);
    else if (e === 'xlsx') data = await redactXlsx(file, R);
    else if (['txt', 'csv', 'md', 'json'].includes(e)) {
      const b = await buf(file); let t;
      try { t = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { t = new TextDecoder('windows-874').decode(b); }
      data = new TextEncoder().encode(R.sub(t));
    } else throw new UserError(`ไม่รองรับไฟล์ .${e} (รองรับ PDF/DOCX/XLSX/TXT/CSV)`);
    items.push([`${stem(file.name)}_redacted.${e}`, data]);
  }
  const note = 'PDF: แปลงเป็นภาพแล้วปิดทึบจริง (ข้อความในไฟล์ใหม่ค้นหาไม่ได้) · XLSX: สไตล์บางส่วนอาจหาย · ตรวจผลก่อนเผยแพร่ทุกครั้ง';
  return items.length === 1
    ? { blob: asBlob(items[0][1], items[0][0]), name: items[0][0], note }
    : { blob: await zipOf(items), name: 'redacted_files.zip', note };
}

/* ---------- Media (Web Audio + lamejs) ---------- */
function parseTime(s) {
  s = (s || '').trim();
  if (!s) return null;
  const p = s.split(':').map(Number);
  if (p.some(isNaN)) throw new UserError('รูปแบบเวลาไม่ถูกต้อง: ' + s);
  return p.reduce((a, v) => a * 60 + v, 0);
}
async function decodeAudio(file, sampleRate) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC(sampleRate ? { sampleRate } : undefined);
  try { return await ctx.decodeAudioData(await buf(file)); }
  catch { throw new UserError('เบราว์เซอร์อ่านเสียงจากไฟล์นี้ไม่ได้ (ลองไฟล์ MP3/WAV/M4A/MP4)'); }
  finally { ctx.close(); }
}
const toI16 = a => { const o = new Int16Array(a.length); for (let i = 0; i < a.length; i++) { const v = Math.max(-1, Math.min(1, a[i])); o[i] = v < 0 ? v * 32768 : v * 32767; } return o; };
function channelsOf(ab, mono, from, to) {
  const chs = [];
  const n = mono || ab.numberOfChannels < 2 ? 1 : 2;
  for (let c = 0; c < n; c++) {
    if (mono && ab.numberOfChannels > 1) {   // downmix
      const m = new Float32Array(to - from);
      for (let k = 0; k < ab.numberOfChannels; k++) { const d = ab.getChannelData(k); for (let i = from; i < to; i++) m[i - from] += d[i] / ab.numberOfChannels; }
      chs.push(m); break;
    }
    chs.push(ab.getChannelData(c).subarray(from, to));
  }
  return chs;
}
function encodeWav(chs, sr) {
  const n = chs[0].length, ch = chs.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const str = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVEfmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const i16 = chs.map(toI16);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { out.setInt16(o, i16[c][i], true); o += 2; }
  return new Blob([out], { type: 'audio/wav' });
}
async function encodeMp3(chs, sr, kbps, progress) {
  const enc = new lamejs.Mp3Encoder(chs.length, sr, kbps), parts = [], B = 1152 * 20;
  const i16 = chs.map(toI16), n = i16[0].length;
  for (let i = 0; i < n; i += B) {
    const b = enc.encodeBuffer(...i16.map(c => c.subarray(i, i + B)));
    if (b.length) parts.push(new Uint8Array(b));
    if ((i / B) % 20 === 0) { progress(`เข้ารหัส MP3 ${Math.round(i / n * 100)}%`); await yieldUI(); }
  }
  const end = enc.flush(); if (end.length) parts.push(new Uint8Array(end));
  return new Blob(parts, { type: 'audio/mpeg' });
}
async function audioTo(file, { fmt, kbps = 128, mono = false, start = null, end = null, sr = null }, progress) {
  progress('กำลังอ่านไฟล์เสียง...');
  const ab = await decodeAudio(file, sr);
  const from = Math.max(0, Math.floor((start || 0) * ab.sampleRate));
  const to = Math.min(ab.length, end == null ? ab.length : Math.floor(end * ab.sampleRate));
  if (to <= from) throw new UserError('ช่วงเวลาไม่ถูกต้อง (เริ่ม ≥ จบ หรือเกินความยาวไฟล์)');
  const chs = channelsOf(ab, mono, from, to);
  return fmt === 'wav' ? encodeWav(chs, ab.sampleRate) : encodeMp3(chs, ab.sampleRate, kbps, progress);
}

async function audio_trim(files, f, progress) {
  const fmt = f.get('fmt') || 'mp3', file = files[0];
  const blob = await audioTo(file, { fmt, start: parseTime(f.get('start')), end: parseTime(f.get('end')) }, progress);
  return { blob, name: `${stem(file.name)}_cut.${fmt}` };
}
async function audio_convert(files, f, progress) {
  const fmt = f.get('fmt') || 'mp3', file = files[0];
  return { blob: await audioTo(file, { fmt }, progress), name: `${stem(file.name)}.${fmt}` };
}
async function audio_compress(files, f, progress) {
  const file = files[0], kbps = +(f.get('bitrate') || 96);
  const blob = await audioTo(file, { fmt: 'mp3', kbps, mono: f.get('mono') === '1', sr: kbps <= 96 ? 22050 : 44100 }, progress);
  return { blob, name: `${stem(file.name)}_${kbps}k.mp3`,
           note: `${fmtBytes(file.size)} → ${fmtBytes(blob.size)}` };
}
async function video_mp3(files, f, progress) {
  const file = files[0];
  return { blob: await audioTo(file, { fmt: 'mp3', kbps: 128 }, progress), name: `${stem(file.name)}.mp3`,
           note: 'ถ้าเบราว์เซอร์อ่านเสียงจากวิดีโอไม่ได้ ให้ลองไฟล์ MP4 (H.264/AAC)' };
}
const fmtBytes = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

async function img_resize(files, f, progress) {
  const max = +(f.get('maxside') || 1600), png = f.get('fmt') === 'png', q = (+f.get('quality') || 85) / 100, items = [];
  for (const file of files) {
    progress(file.name);
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas');
    cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    const ctx = cv.getContext('2d');
    if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    items.push([`${stem(file.name)}.${png ? 'png' : 'jpg'}`, await canvasBytes(cv, png ? 'image/png' : 'image/jpeg', q)]);
    await yieldUI();
  }
  return items.length === 1
    ? { blob: new Blob([items[0][1]]), name: items[0][0] }
    : { blob: await zipOf(items), name: 'resized_images.zip' };
}

const TOOLS = { merge, split, compress, pdf2img, img2pdf, tables, watermark, redact,
                audio_trim, audio_convert, audio_compress, video_mp3, img_resize };
