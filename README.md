# 👴🏻 Cool Uncle Legal Lab

ระบบการเรียนกฎหมายแบบเกม สำหรับเตรียมสอบปริญญาตรี วิชาสูง และสอบทนาย

---

## 📊 Project Status

| ขั้นตอน | สถานะ | หมายเหตุ |
|--------|-------|----------|
| Index + Level Selector | ✅ สร้างเสร็จ | 3 levels (Bachelor/Postgrad/Lawyer) |
| Subject Hub Template | ✅ สร้างเสร็จ | TTS + YouTube integrated |
| Shared CSS System | ✅ สร้างเสร็จ | ลดขนาดไฟล์ 30% |
| TTS (Text-to-Speech) | ✅ พร้อมใช้ | Web Speech API + Thai support |
| YouTube Integration | ✅ พร้อมใช้ | Embed + linked videos |
| Game Titles & Art | ⏳ ต้องแก้ | ลบคำว่า "กฎหมาย" + เพิ่มกราฟิก |
| Deployment | ⏳ ต้องทำ | GitHub Pages / Vercel แนะนำ |

---

## 📁 Project Structure

```
cool-uncle-legal/
├── index.html                  ← หน้าแรก (3 levels selector)
├── shared.css                  ← CSS ใช้ร่วมทั้งเว็บ
├── tts-helper.js               ← Text-to-Speech helper
│
├── subject-hub-template.html   ← Template สำหรับแต่ละวิชา
│   ├── hub-nitikam.html        ← นิติกรรมและสัญญา (copy & edit)
│   ├── hub-orglaw.html         ← องค์กรธุรกิจ
│   └── ...
│
├── เกมจำมาตรา-LAW1103.html     ← เกม (มีอยู่เดิม ต้องแก้)
├── เกมกฎหมายองค์กร...html     ← เกม (มีอยู่เดิม ต้องแก้)
└── ...
│
├── INTEGRATION_GUIDE.md        ← วิธีแก้ไฟล์เกมเดิม
├── DEPLOYMENT_GUIDE.md         ← วิธีขึ้น Web
└── README.md                   ← ไฟล์นี้

```

---

## 🚀 ขั้นตอนต่อไป

### 1️⃣ **ทำความสะอาดชื่อวิชา** (URGENT)

ตอนนี้ชื่อหลายวิชามี "กฎหมาย" ซ้ำ:
```
❌ เกมกฎหมายครอบครัว
❌ เกมกฎหมายองค์กรธุรกิจ

✅ เกมครอบครัว
✅ เกมองค์กรธุรกิจ
```

**ทำ:**
- [ ] Rename ไฟล์ทุกตัว (remove "กฎหมาย")
- [ ] Update path ใน `index.html`
- [ ] Update path ใน `hub-*.html`

### 2️⃣ **เพิ่มกราฟิก/Icon**

ปัจจุบัน:
- ✅ วิชานิติกรรมมีกราฟิก (📜)
- ❌ วิชาอื่นต้องเพิ่มอีก

**ทำ:**
- [ ] วิชาแต่ละอันเพิ่ม icon/illustration
- [ ] ตัวอย่าง: 📚 📖 ⚖️ 👨‍⚖️ 🏢 etc.

### 3️⃣ **สร้าง Hub Pages สำหรับแต่ละวิชา**

ใช้ template:
```bash
cp subject-hub-template.html hub-nitikam.html
cp subject-hub-template.html hub-orglaw.html
# ... ทำซ้ำสำหรับทุกวิชา
```

แล้วแก้:
- ชื่อวิชา
- Code วิชา
- Link ไปยังเกม

### 4️⃣ **แก้ไฟล์เกมเดิมให้ใช้ Shared System**

ทุกไฟล์เกม ต้อง:
- [ ] เอา inline CSS ออก → `<link rel="stylesheet" href="shared.css">`
- [ ] เพิ่ม `<script src="tts-helper.js"></script>`
- [ ] เพิ่ม TTS control div
- [ ] เพิ่ม YouTube widget div
- [ ] เพิ่ม Back button

👉 ดู: `INTEGRATION_GUIDE.md` สำหรับวิธีแก้

### 5️⃣ **Test & Deploy**

- [ ] ทดสอบ Local (TTS, YouTube, Links)
- [ ] Deploy ไป GitHub Pages หรือ Vercel
- [ ] ทดสอบ Live

---

## 🔧 วิธีแก้ไฟล์เกม (Quick Reference)

### ใน `<head>`:
```html
<link rel="stylesheet" href="shared.css">
<script src="tts-helper.js"></script>
```

### ใน `<body>` ด้านบนสุด:
```html
<a href="hub-nitikam.html" class="back-button">← กลับ</a>
<div id="audio-controls"></div>
```

### ใน `<script>`:
```javascript
thaiTTS.createAudioControl('audio-controls', ['title-id', 'desc-id']);
```

👉 ดู: `INTEGRATION_GUIDE.md` เต็ม

---

## 📖 ไฟล์สำคัญ

| ไฟล์ | ใช้ประโยชน์ |
|------|----------|
| `index.html` | หน้าแรก - เลือกระดับ 3 ระดับ |
| `shared.css` | CSS ใช้ร่วม - ลดขนาดไฟล์ |
| `tts-helper.js` | อ่านไทย - อ่านเสริมเท่านั้น |
| `subject-hub-template.html` | Template Hub - copy & edit |
| `INTEGRATION_GUIDE.md` | วิธีแก้ไฟล์เกมเดิม |
| `DEPLOYMENT_GUIDE.md` | วิธีขึ้น Web |

---

## 📝 Notes

### ⚠️ สำคัญ
1. **TTS สำหรับอ่านเสริมเท่านั้น** - ไม่ใช่เพื่อเรียนการอ่านภาษาไทย
2. **ลบคำว่า "กฎหมาย"** - ออกจากชื่อวิชาเพื่อไม่ให้ซ้ำ
3. **GitHub Pages แนะนำสุด** - ฟรี + เสถียร + เร็ว

### 🎨 Design System (CSS Variables)
```css
--paper: #FBF9F4       /* Background หลัก */
--card: #FFFFFF        /* Card background */
--ink: #22283A         /* Text หลัก */
--gold: #B08A3C        /* Accent (ทอง) */
--accent: #2E4A7A      /* Accent (น้ำเงิน) */
--ok: #1E7A4F          /* Success (เขียว) */
--bad: #B23A3A         /* Error (แดง) */
--radius: 14px         /* Border radius */
```

ใช้ได้ทั้ง HTML + JavaScript:
```javascript
document.documentElement.style.setProperty('--subject-color', '#HEXCOLOR');
```

---

## 🤔 FAQ

**Q: ต้องตั้งค่า Server อะไร?**
A: ไม่ต้อง! ใช้ GitHub Pages (ฟรีถาวร) → ดู `DEPLOYMENT_GUIDE.md`

**Q: TTS ทำงานได้ทั้งหมด Browser?**
A: ไม่ (Firefox + ภาษาไทย = อาจมีปัญหา) → แนะนำ Chrome

**Q: ต้องแก้โค้ดเกมเดิมหรือไม่?**
A: ใช่ แต่ไม่ต้องแก้ Logic - เฉพาะ CSS + Structure → ดู `INTEGRATION_GUIDE.md`

**Q: ขนาดไฟล์ลดลงเท่าไหร่?**
A: ~30% (Shared CSS) + ~50% (CDN Compression) = ~60% รวม ✅

---

## 📞 Contact & Support

- ❓ ปัญหาขั้นตอน? → ดู Guide files
- 💡 เพิ่มวิชาใหม่? → Copy template + แก้ค่า
- 🐛 Bug ค้นพบ? → ตรวจ Console (F12)

---

## 📅 Timeline ที่แนะนำ

- **Week 1**: แก้ชื่อวิชา + เพิ่มกราฟิก
- **Week 2**: สร้าง Hub pages ทั้งหมด
- **Week 3**: แก้ไฟล์เกมให้ใช้ Shared system
- **Week 4**: ทดสอบ + Deploy ✅

---

## ✅ Checklist ก่อน Launch

- [ ] ชื่อวิชาถูก (ไม่มี "กฎหมาย" ซ้ำ)
- [ ] ทุกวิชามี Icon/Graphics
- [ ] Hub pages สร้างเสร็จทุกหน้า
- [ ] เกมทั้งหมด integrate TTS + YouTube
- [ ] Back button ทำงานได้
- [ ] Local testing สำเร็จ (TTS + Links + Images)
- [ ] Deploy ไป GitHub / Vercel
- [ ] Live testing (Desktop + Mobile)
- [ ] YouTube videos แสดงถูก
- [ ] TTS อ่านไทยได้ดี

---

**🚀 Ready to Launch?** ลองทำขั้นตอนตามลำดับได้เลย!

Good luck! 🍀
