# 📦 Deployment Guide - Cool Uncle Legal Lab

ไม่แนะนำ Netlify (เหตุผล: ความไม่แน่นอนระยะยาว) แทนที่จะเป็น 3 ทางเลือกที่เสถียรและง่าย

---

## 🎯 Option 1: GitHub Pages (⭐ แนะนำมากสุด)

### ข้อดี:
- ✅ **ฟรีแบบถาวร** - ไม่มีค่าใช้จ่าย
- ✅ **เสถียร** - GitHub ไม่หายตัวไป
- ✅ **CDN** - เร็ว (อัตโนมัติ)
- ✅ **Version control** - มี Git history

### ขั้นตอน:

#### 1️⃣ สร้าง GitHub Account (ถ้ายังไม่มี)
- ไปที่ https://github.com/signup
- ยืนยัน email

#### 2️⃣ สร้าง Repository
- ชื่อ: `cool-uncle-legal` (หรืออะไรก็ได้)
- ✅ Public
- ✅ Initialize with README

#### 3️⃣ อัพโหลดไฟล์
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/cool-uncle-legal.git
cd cool-uncle-legal

# Copy ทั้งหมด:
# - index-new.html (เปลี่ยนชื่อเป็น index.html)
# - shared.css
# - tts-helper.js
# - เกมทุกไฟล์
# - hub templates

# Push ขึ้น
git add .
git commit -m "Initial commit: Cool Uncle Legal Lab"
git push origin main
```

#### 4️⃣ เปิด GitHub Pages
- ไปที่ Settings → Pages
- Branch: `main`
- Folder: `/ (root)`
- Save

#### 5️⃣ เข้าได้ที่
```
https://YOUR_USERNAME.github.io/cool-uncle-legal/
```

---

## 🎯 Option 2: Vercel (ทางเลือกที่ 2)

### ข้อดี:
- ✅ **ฟรี** + ถูกกว่า Netlify เมื่ออัพเกรด
- ✅ **ง่ายมากๆ** - ใช้ GitHub integration
- ✅ **เร็ว** - CDN อย่างมันหนา

### ขั้นตอน:

#### 1️⃣ ไปที่ https://vercel.com/signup
- Signup ด้วย GitHub

#### 2️⃣ Import Project
- Import from GitHub
- เลือก `cool-uncle-legal` repo
- Deploy!

#### 3️⃣ เข้าได้ที่
```
https://cool-uncle-legal.vercel.app/
```

---

## 🎯 Option 3: Own Hosting (ตัวเอง)

ถ้าต้องการเต็มควบคุม (VPS / Shared Hosting)

### ขั้นตอน:

#### 1️⃣ ซื้อ Hosting
- ตัวอย่าง: Bluehost, SiteGround, DigitalOcean (VPS)
- ต้องมี FTP or SSH access

#### 2️⃣ ซื้อ Domain (ถ้าต้องการ)
- ตัวอย่าง: coolunclelegal.com

#### 3️⃣ อัพโหลดไฟล์
- ใช้ FileZilla (FTP) หรือ Terminal
- ใส่ไฟล์ทั้งหมดเข้า `public_html/` folder

#### 4️⃣ เข้าได้ที่
```
https://coolunclelegal.com/
```

---

## 📋 Checklist ก่อน Deploy

- [ ] `index.html` มีชื่อถูก (`index-new.html` → `index.html`)
- [ ] `shared.css` ตรวจสอบ path ให้ถูก
- [ ] `tts-helper.js` ตรวจสอบ path ให้ถูก
- [ ] ทุกไฟล์เกมชื่อถูก (ไม่มี space หรือ Unicode ที่มีปัญหา)
- [ ] ไฟล์ hub templates อัพเสร็จหมด
- [ ] ทดสอบลิงก์ทั้งหมด (ว่าไปหน้าต่างๆ ได้)
- [ ] ทดสอบ TTS (เสียงอ่านไทยเสร็จ)
- [ ] ทดสอบ YouTube widget (embed ได้)

---

## 🔧 หลังจาก Deploy

### เพิ่ม YouTube Videos
เปิดไฟล์ hub templates แล้วแก้:
```javascript
const youtubeVideos = [
  {
    title: 'บทนำนิติกรรม',
    channel: 'Law School Channel',
    url: 'https://www.youtube.com/watch?v=VIDEO_ID'
  }
];
```

### เพิ่มวิชาใหม่
แก้ `index.html`:
```javascript
const SUBJECTS = {
  bachelor: [
    {
      id: "new-subject",
      name: "ชื่อวิชา",
      code: "CODE",
      desc: "รายละเอียด...",
      color: "#HEXCOLOR",
      // ...
      href: "hub-new-subject.html"
    }
  ]
};
```

### การ Update
ทุกครั้งที่แก้ไฟล์:

**GitHub Pages:**
```bash
git add .
git commit -m "Update subjects"
git push origin main
```

**Vercel:**
- แก้ไฟล์ + Push ก็ auto-deploy ทันที

**Own Hosting:**
- ใช้ FTP upload ใหม่

---

## ⚠️ ข้อมูลสำคัญ

### สำหรับ TTS (อ่านไทย):
- ✅ ทำงานได้ใน Chrome, Edge, Safari (ส่วนใหญ่)
- ⚠️ Firefox อาจมีปัญหากับภาษาไทย
- ✅ Mobile browsers โดยส่วนใหญ่รองรับ
- 📌 **สำหรับอ่านเสริมเท่านั้น** ไม่ใช่การเรียนการอ่าน

### สำหรับ YouTube:
- ใช้ Embed URL จาก YouTube
- Format: `https://www.youtube.com/watch?v=VIDEO_ID`
- Responsive โดยอัตโนมัติ

### Security:
- GitHub Pages ปลอดภัย ✅
- Vercel ปลอดภัย ✅
- Own Hosting: ต้องตั้งค่า HTTPS เอง

---

## 📞 Troubleshooting

### ปัญหา: Deploy แล้วไม่เห็น
**แก้:**
```bash
# ลบ cache ของ git
git rm -r --cached .
git add .
git commit -m "Fix cache"
git push
```

### ปัญหา: ลิงก์ไม่ได้
**แก้:** ตรวจสอบ path ให้ถูก
```html
<!-- ❌ ผิด -->
<link rel="stylesheet" href="/shared.css">

<!-- ✅ ถูก -->
<link rel="stylesheet" href="shared.css">
```

### ปัญหา: TTS ไม่ทำงาน
**แก้:**
1. ใช้ Chrome ล่าสุด
2. ตรวจสอบเสียงไทยติดตั้ง (Windows/Mac settings)
3. ตรวจสอบ console (F12) มีข้อผิดพลาดไหม

---

## 🚀 ยังไม่พร้อม?

ลองจะไว้ทดสอบก่อนเปิดเว็บจริง:

### Local Testing:
```bash
# Terminal/Command Prompt
python -m http.server 8000

# หรือใช้ VS Code Live Server
# Extension: Live Server (Ritwick Dey)
```

แล้วเข้า `http://localhost:8000`

---

**ทำให้สำเร็จ? 🎉 ยินดีด้วย!**
