# 🔗 Integration Guide - นำเข้า TTS + YouTube + Shared CSS

แนวทางการนำระบบใหม่เข้าไปในเกมที่มีอยู่เดิม

---

## 📋 ขั้นตอน 1: นำเข้า Shared CSS

ไฟล์เกมเดิมของคุณมี CSS inline แบบเดิม ให้เปลี่ยนเป็น:

### ในส่วน `<head>`:

```html
<!-- ❌ ลบเก่า:  -->
<!-- <style>
:root{
  --paper:#FBF9F4;
  ...
</style> -->

<!-- ✅ เพิ่มใหม่: -->
<link rel="stylesheet" href="shared.css">
<style>
/* เฉพาะ CSS ของเกมนี้เท่านั้น */
.game-specific-class {
  /* ... */
}
</style>
```

### ผลที่ได้:
- ✅ ไฟล์เบาลง (ลดแบนด์วิท)
- ✅ Theme เป็นหนึ่งเดียว
- ✅ ดูแลรักษาง่าย

---

## 📖 ขั้นตอน 2: เพิ่ม TTS (อ่านไทย)

### 2.1 ใน `<head>` เพิ่ม:
```html
<link rel="stylesheet" href="shared.css">
<script src="tts-helper.js"></script>
```

### 2.2 ในไฟล์เกม `<body>` ที่จุดที่ต้องการ:
```html
<!-- ตัวอย่าง: อ่านหน้าหลักของเกม -->
<div id="audio-controls"></div>

<script>
// เมื่อ DOM load เสร็จ
document.addEventListener('DOMContentLoaded', () => {
  // สร้าง TTS control
  thaiTTS.createAudioControl('audio-controls', [
    'game-title',      // ID ของ element ที่จะอ่าน
    'game-description'
  ]);
});
</script>
```

### 2.3 ตัวอย่างปุ่มสำหรับอ่าน element เดียว:
```html
<!-- ในคำถามข้อสอบ -->
<div id="question-text">
  แนว: นายเอ และ นายบี ตกลงซื้อขายสิ่งของ...
</div>

<button onclick="thaiTTS.speakElement('question-text')">
  🔊 อ่านคำถาม
</button>
```

### 2.4 อ่านข้อความตรง ๆ:
```javascript
// เมื่อผู้เล่นคลิกปุ่มให้คำแนะนำ
document.getElementById('hint-btn').addEventListener('click', () => {
  thaiTTS.speakText('ให้อ่านมาตรา 276 แล้วตัดสินใจว่าการกระทำนี้ก่อให้เกิดหนี้สินหรือไม่');
});
```

---

## 🎥 ขั้นตอน 3: เพิ่ม YouTube Widget

### 3.1 ในส่วน `<style>` เพิ่ม (ถ้าเกมไม่มี youtube-section):
```css
.youtube-section{
  margin:24px 0;padding:16px;background:var(--card);
  border:1px solid var(--line);border-radius:var(--radius);
}
.youtube-list{
  display:flex;flex-direction:column;gap:10px;
}
.youtube-item{
  display:flex;align-items:center;gap:10px;
  padding:10px;background:#F9F7F2;border-radius:8px;
  text-decoration:none;color:inherit;transition:all .2s;
  cursor:pointer;
}
.youtube-item:hover{
  background:#F1EDE2;border-left:3px solid var(--accent);
}
.youtube-item .thumb{
  width:60px;height:45px;background:#E0DDD5;border-radius:4px;
  display:flex;align-items:center;justify-content:center;
  font-size:20px;flex-shrink:0;
}
.youtube-item .meta{flex:1;display:flex;flex-direction:column;gap:4px}
.youtube-item .title{font-size:14px;font-weight:600;color:var(--ink)}
.youtube-item .channel{font-size:12px;color:var(--ink-soft)}
```

### 3.2 ในส่วน `<body>` เพิ่ม HTML:
```html
<div class="youtube-section" id="youtube-widget">
  <h3>📺 แนะนำวิดีโอเสริมเรียน</h3>
  <div class="youtube-list" id="youtube-list">
    <!-- Dynamic content here -->
  </div>
</div>
```

### 3.3 ใน `<script>` เพิ่ม:
```javascript
// ⚠️ อ่านเสริมเท่านั้น
const youtubeVideos = [
  {
    title: 'บทนำสัญญา',
    channel: 'Law Learning Academy',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    title: 'สัญญาขายและผลของสัญญา',
    channel: 'Thai Bar Prep',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
  }
];

// Render YouTube list
if (youtubeVideos.length > 0) {
  const list = document.getElementById('youtube-list');
  list.innerHTML = youtubeVideos.map(v => `
    <a href="${v.url}" target="_blank" rel="noopener" class="youtube-item">
      <div class="thumb">▶️</div>
      <div class="meta">
        <div class="title">${v.title}</div>
        <div class="channel">${v.channel}</div>
      </div>
    </a>
  `).join('');
} else {
  document.getElementById('youtube-widget').style.display = 'none';
}
```

---

## 🔄 ขั้นตอน 4: Back Button (กลับไปหน้า Hub)

ในเกมเดิม ให้เพิ่มที่ด้านบน:

```html
<a href="hub-nitikam.html" class="back-button">← กลับไปเลือกเกมอื่น</a>
```

เพิ่มใน CSS:
```css
.back-button{
  display:inline-flex;align-items:center;gap:6px;
  color:var(--accent);font-weight:600;font-size:14px;
  text-decoration:none;margin-bottom:16px;transition:all .2s;
}
.back-button:hover{transform:translateX(-4px);color:var(--ink)}
```

---

## ✅ ตัวอย่างการแก้ไฟล์เกมแบบสมบูรณ์

ให้ดู: `subject-hub-template.html` (มีตัวอย่างครบ)

หรือดูตัวอย่างเกมเดิม + แก้:

### BEFORE (ไฟล์เดิม):
```html
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>เกมจำมาตรา · นิติกรรมและสัญญา</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700&family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#FBF9F4;
  --card:#FFFFFF;
  /* 100+ lines ของ CSS */
}
/* ... */
</style>
</head>
<body>
<!-- ขนาดหนัก! -->
```

### AFTER (แก้ไข):
```html
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>เกมจำมาตรา · นิติกรรมและสัญญา</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@500;600;700;900&family=Sarabun:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="shared.css">
<script src="tts-helper.js"></script>
<style>
/* เฉพาะ CSS ของเกมนี้ - เหลือแค่ 20-30 lines */
.game-card { /* ... */ }
</style>
</head>
<body>
<a href="hub-nitikam.html" class="back-button">← กลับ</a>
<div id="audio-controls"></div>

<div id="game-content">
  <!-- เกมทำงานเหมือนเดิม -->
</div>

<div id="youtube-widget"></div>

<script>
// ✅ เพิ่ม TTS
thaiTTS.createAudioControl('audio-controls', ['game-title', 'game-desc']);

// ✅ เพิ่ม YouTube
const youtubeVideos = [ /* ... */ ];
// render...
</script>
</body>
</html>
```

### ผลลัพธ์:
- ✅ ไฟล์เบาลง ~30% (จาก 236KB → ~150KB)
- ✅ มี TTS สำหรับอ่านเสริม
- ✅ มี YouTube widget
- ✅ มี Back button
- ✅ Theme เดียวกับ Index

---

## 🎯 Quick Checklist

- [ ] ลบ `<style>` ที่มี CSS variables ทั้งหมด
- [ ] เพิ่ม `<link rel="stylesheet" href="shared.css">`
- [ ] เพิ่ม `<script src="tts-helper.js"></script>`
- [ ] เพิ่ม `<div id="audio-controls"></div>`
- [ ] เพิ่ม `<div id="youtube-widget"></div>`
- [ ] เพิ่ม Back button
- [ ] เพิ่มข้อมูล YouTube ในไฟล์
- [ ] ทดสอบ TTS (เสียงอ่านไทย)
- [ ] ทดสอบ YouTube embed
- [ ] ทดสอบ Back button

---

## 📞 FAQ

**Q: TTS ไม่ทำงาน?**
A: ตรวจสอบ:
1. Browser support (Chrome, Edge, Safari)
2. ภาษาไทยติดตั้ง (Windows Settings → Speech)
3. Console error (F12)

**Q: YouTube iframe ไม่ embed ได้?**
A: ใช้ `target="_blank"` ให้เปิดใหม่ แล้วเพิ่ม `rel="noopener"` ความปลอดภัย

**Q: ไฟล์แต่ละเกม ยังต้องเก็บ HTML inline สำหรับ Game Logic ใช่ไหม?**
A: ✅ ถูก! เฉพาะ CSS ที่ใช้ร่วมกัน และ HTML structure เท่านั้นที่เอาออก

---

**✅ เสร็จแล้ว!**

ทีนี้แต่ละเกมจะ:
1. เบาลง (เร็วขึ้น)
2. มีเสียงอ่านไทย
3. มี YouTube เสริมเรียน
4. เชื่อมกับ Hub page
