# 📝 Update Guide - Index.html ใหม่

ผมได้สร้าง `index-upgraded.html` แล้ว มีปรับปรุง 10 อย่างใหญ่ๆ:

---

## ✨ ปรับปรุงหลัก

### 1️⃣ **โครงสร้าง Bachelor - แบ่ง 4 ปี ด้วยสี**
```javascript
const SUBJECTS = {
  year2: [ /* LA101-107 */ ],  // สีแดง (#FF6B6B)
  year3: [ /* LA201-209 */ ],  // สีเขียวมิ้น (#4ECDC4)
  year4: [ /* LA270, 311, 351 */ ],  // สีเขียวอ่อน (#95E1D3)
};
```
- ปี 2: นิติกรรม, อาญาภาคทั่วไป, ละเมิด, ทรัพย์, หนี้สิน, สัญญาพาณิชย์, ความผิด
- ปี 3: ครอบครัว, มรดก, องค์กรธุรกิจ, วิ.แพ่ง, ประวัติศาสตร์, ปรัชญา, กฎหมายระหว่างประเทศ, ปกครอง, รัฐธรรมนูญ
- ปี 4: วิ.อาญา, วิ.ปกครอง/รัฐธรรมนูญ, ภาษาอังกฤษกฎหมาย

### 2️⃣ **โครงสร้าง Postgrad (เนติฯ) - แบ่ง 4 ขา ด้วยสี**
```javascript
const SUBJECTS = {
  civil: [ /* ขาแพ่ง */ ],           // สีเขียวเข้ม (#2E7D32)
  criminal: [ /* ขาอาญา */ ],         // สีแดงเข้ม (#C62828)
  civpro: [ /* ขาวิ.แพ่ง */ ],       // สีน้ำเงินเข้ม (#1565C0)
  crimproc: [ /* ขาวิ.อาญา */ ],     // สีส้ม (#F57C00)
};
```

### 3️⃣ **Exam Countdown Timer**
```javascript
const EXAM_DATES = [
  { code: "LA351", date: "2569-11-07", name: "Constitutional Procedural Law" },
  { code: "LA311", date: "2569-11-23", name: "Criminal Procedure" },
  // ... อื่นๆ
];
```
- แสดงในที่ `topbar-countdown` (ด้านขวาบน)
- Auto update ทุกชั่วโมง
- แสดง: "📅 สอบ LA311: 0d 15h"

### 4️⃣ **YouTube Channel Link**
```html
<a href="https://www.youtube.com/@CoolUncleLaw/videos" 
   target="_blank" rel="noopener">
  📺 Channel
</a>
```
- ที่ Top bar (ขวา)
- ที่ Codex section ด้านล่าง (พร้อม big button)

### 5️⃣ **Codex Section (ประมวลกฎหมาย)**
```html
<div class="codex-section">
  <!-- ประมวลแพ่ง (6 บรรพ) -->
  <!-- ประมวลอาญา -->
  <!-- ประมวลวิแพ่ง -->
  <!-- พระธรรมนูญศาลยุติธรรม -->
</div>
```
- ตอนนี้เป็น placeholder (onclick="alert(...)")
- ในอนาคต: link ไปหน้า codex-search.html

### 6️⃣ **High Scores - ย้ายไปล่างสุด**
ตอนเดิม:
```
Hero
Arcade (High Score) ← อยู่ที่นี่
Subjects
```
ตอนใหม่:
```
Hero
Quick Links
Tab Buttons
Subjects (Year 1-4 / Branches)
Codex
YouTube
Arcade (High Score) ← อยู่ที่นี่ ✅
```

### 7️⃣ **Tab Navigation**
- 4 Tabs: ปริญญาตรี, เนติศาสตร์, สอบทนาย, ประมวล
- Click tab → แสดง/ซ่อนเนื้อหา
- มี Quick Links ด้านบน (grid 4 ไอคอน)

### 8️⃣ **Responsive Grid**
- Desktop: 3-4 column grid
- Mobile: 1 column
- Smooth animation fadeIn

### 9️⃣ **ชื่อวิชาภาษาอังกฤษ**
แทนที่:
```
❌ เกมนิติกรรมและสัญญา
✅ Contract Law (LA101)
```
ใช้ `href="contract-law.html"` แบบนี้

### 🔟 **เพิ่ม Exam Dates เนติฯ**
```javascript
// ใน LA351, LA311, LA270, LA335, LA259
exam: "23 พ.ย. 2569"  // ระบุในไฟล์
```

---

## 📋 วิธีใช้งาน

### ตั้งชื่อไฟล์เพื่ออัพโหลด:
```
index-upgraded.html  →  index.html
```

### โฟลเดอร์ต้องมี:
```
cool-uncle-legal/
├── index.html              ← index-upgraded.html ที่ rename
├── shared.css
├── tts-helper.js
├── subject-hub-template.html
└── เกม_ทั้งหมด.html (หรือ familylaw.html, crimgen.html, etc.)
```

---

## 🔧 ปรับแต่ง (Customize)

### เปลี่ยน Exam Dates:
```javascript
const EXAM_DATES = [
  { code: "LA351", date: "2569-11-07", time: "17:30", name: "..." },
  // เปลี่ยนวันที่ตามสอบจริง
];
```

### เพิ่มวิชา:
```javascript
const SUBJECTS = {
  year2: [
    { 
      name: "New Subject",
      code: "LA999",
      desc: "รายละเอียด",
      icon: "🎓",
      href: "newsubject.html",
      status: "ready"  // หรือ "coming-soon"
    },
    // ... เพิ่มเติม
  ]
};
```

### เปลี่ยนสี:
```css
:root {
  --year2: #FF6B6B;      /* ปี 2 - สีแดง */
  --year3: #4ECDC4;      /* ปี 3 - สีเขียวมิ้น */
  --year4: #95E1D3;      /* ปี 4 - สีเขียวอ่อน */
  
  --branch-civil: #2E7D32;      /* ขาแพ่ง */
  --branch-criminal: #C62828;   /* ขาอาญา */
  --branch-civpro: #1565C0;     /* ขาวิ.แพ่ง */
  --branch-crimproc: #F57C00;   /* ขาวิ.อาญา */
}
```

---

## 📊 Exam Countdown Logic

### อัลกอริทึม:
1. ดึงวันสอบทั้งหมดจาก `EXAM_DATES`
2. เทียบกับเวลาปัจจุบัน
3. หาสอบที่อยู่ใกล้ที่สุด (ยังไม่ผ่านไป)
4. คำนวณ Days + Hours
5. แสดง: "📅 สอบ [CODE]: [DAYS]d [HOURS]h"

### Update ทุกชั่วโมง:
```javascript
setInterval(updateCountdown, 3600000); // 1 hour
```

---

## 🎨 Design Tokens

| Element | Color | Usage |
|---------|-------|-------|
| Year 2 Border | `#FF6B6B` | ปี 2 (เทอม แรม) |
| Year 3 Border | `#4ECDC4` | ปี 3 (วิชาเฉพาะ) |
| Year 4 Border | `#95E1D3` | ปี 4 (วิธีพิจารณา) |
| Branch Civil | `#2E7D32` | ขาแพ่ง |
| Branch Criminal | `#C62828` | ขาอาญา |
| Branch CivPro | `#1565C0` | ขาวิ.แพ่ง |
| Branch CrimProc | `#F57C00` | ขาวิ.อาญา |

---

## 📱 Mobile Experience

✅ Tab buttons: flex-wrap (ลงมือ 2 แถว)
✅ Grid: 1 column
✅ Codex grid: 2 columns (fit ได้)
✅ Top bar: flex-wrap (countdown ไปบรรทัดใหม่)
✅ Font sizes: responsive (clamp)

---

## 🔗 Link Mapping

| ปี | วิชา | File Suggested |
|----|------|-----------------|
| 2 | Contract Law | `contract-law.html` |
| 2 | Criminal General | `crimgen.html` |
| 2 | Tort | `tort.html` |
| 3 | Family Law | `familylaw.html` |
| 3 | Inheritance | `inheritance.html` |
| 3 | Business Organization | `biz-org.html` |
| 4 | Legal English | `legaleng.html` |
| 4 | Criminal Procedure | `crimpro.html` |

---

## ⚠️ Important Notes

1. **Exam Countdown**: ระบบหา exam ที่เหลือแค่วันหนึ่ง (ถ้าเกิน วันสอบแล้ว) จะแสดง "✨ ยินดีด้วย! ลุมพุกเรียบร้อยแล้ว"

2. **Codex Placeholder**: ปัจจุนนี้ alert("🔨 กำลังพัฒนา...") ให้ click ได้
   - อนาคต: Link ไปหน้า codex-search.html (โครงสร้างแบบ pkpb-law.vercel.app)

3. **Coming Soon Status**: วิชา status "coming-soon" จะ:
   - ⏳ แสดง badge เป็นสี
   - ❌ ลิงก์ไม่คลิกได้

4. **YouTube Links**:
   - ที่ Top bar: link ไปหน้า videos ทั้งหมด
   - ที่ Codex section: Big button "ไปที่ Cool Uncle Law Channel"

---

## ✅ Checklist ก่อน Deploy

- [ ] Rename `index-upgraded.html` → `index.html`
- [ ] ทดสอบ Tab switching (ปริญญาตรี/เนติ/ทนาย/ประมวล)
- [ ] ทดสอบ Exam countdown (ควรเห็นเลขนับถอยหลัง)
- [ ] ทดสอบ YouTube links (เปิดได้ 2 ที่)
- [ ] ทดสอบ Responsive (Desktop + Mobile)
- [ ] ทดสอบ Color coding (สีต่างกันสำหรับปี/ขา)
- [ ] ตรวจ Links ทั้งหมด (ยังเป็น placeholder "#")
- [ ] ลบ console.log ถ้ามี
- [ ] Deploy ไป GitHub Pages / Vercel

---

## 📌 Next Steps

1. **Rename ไฟล์** → index.html
2. **เพิ่มวิชาที่เหลือ** → แก้ SUBJECTS data
3. **สร้าง Hub pages** → hub-familylaw.html, hub-crimgen.html, etc.
4. **แก้ไฟล์เกม** → ตาม INTEGRATION_GUIDE.md
5. **ทดสอบ + Deploy** → ตาม DEPLOYMENT_GUIDE.md

---

**Ready? 🚀**
