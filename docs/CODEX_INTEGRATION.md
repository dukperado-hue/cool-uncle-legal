# 🔗 Codex Integration Snippet

**สำหรับต่อ Codex Search เข้า Index.html**

---

## 📝 ขั้นตอน 1: แก้ไข Index.html

ในไฟล์ `index-upgraded.html` ให้ค้นหาส่วน:

```html
<div id="tab-codex" class="tab-content">
  <div class="codex-section">
    <!-- ... -->
  </div>
</div>
```

---

## 🔄 ขั้นตอน 2: เปลี่ยน Codex Cards

### **ปัจจุบัน (ไม่ได้ใช้):**

```html
<a href="#" class="codex-card" onclick="alert('🔨 กำลังพัฒนา...')">
  <div class="icon">📜</div>
  <div class="name">ประมวลแพ่ง</div>
  <div class="status">6 บรรพ</div>
</a>
```

### **เปลี่ยนเป็น:**

```html
<a href="codex-search.html?book=civil" class="codex-card">
  <div class="icon">📜</div>
  <div class="name">ประมวลแพ่ง</div>
  <div class="status">6 บรรพ · 800+ มาตรา</div>
</a>
```

---

## 🔗 ตัวอย่าง Link Pattern

| ประมวล | Link |
|--------|------|
| ประมวลแพ่ง | `codex-search.html?book=civil` |
| ประมวลอาญา | `codex-search.html?book=criminal` |
| ประมวลวิ.แพ่ง | `codex-search.html?book=civpro` |
| ประมวลวิ.อาญา | `codex-search.html?book=crimpro` |
| พระธรรมนูญ | `codex-search.html?book=constitution` |

---

## 💡 Update Codex Section HTML

### **ใหม่ (ต่อสำหรับใช้จริง):**

```html
<!-- ===== TAB: CODEX (Law Compendiums) ===== -->
<div id="tab-codex" class="tab-content">
  <div class="codex-section">
    <div class="codex-header">
      <div class="codex-icon">📚</div>
      <div class="codex-header-text">
        <h2>ประมวลกฎหมาย</h2>
        <p>ค้นหาและเรียนรู้มาตราของประมวลกฎหมายแต่ละฉบับ</p>
      </div>
    </div>
    <div class="codex-grid">
      
      <!-- CIVIL CODE -->
      <a href="codex-search.html?book=civil" class="codex-card">
        <div class="icon">📜</div>
        <div class="name">ประมวลแพ่ง</div>
        <div class="status">6 บรรพ · 800+ มาตรา</div>
      </a>

      <!-- CRIMINAL CODE -->
      <a href="codex-search.html?book=criminal" class="codex-card">
        <div class="icon">📋</div>
        <div class="name">ประมวลอาญา</div>
        <div class="status">2 ภาค · 450+ มาตรา</div>
      </a>

      <!-- CIVIL PROCEDURE -->
      <a href="codex-search.html?book=civpro" class="codex-card">
        <div class="icon">⚖️</div>
        <div class="name">ประมวลวิธีพิจารณาความแพ่ง</div>
        <div class="status">700+ มาตรา</div>
      </a>

      <!-- CRIMINAL PROCEDURE -->
      <a href="codex-search.html?book=crimpro" class="codex-card">
        <div class="icon">🔍</div>
        <div class="name">ประมวลวิธีพิจารณาความอาญา</div>
        <div class="status">500+ มาตรา</div>
      </a>

      <!-- CONSTITUTION -->
      <a href="codex-search.html?book=constitution" class="codex-card">
        <div class="icon">🏛️</div>
        <div class="name">พระธรรมนูญศาลยุติธรรม</div>
        <div class="status">300+ มาตรา</div>
      </a>

      <!-- COMING SOON -->
      <a href="#" class="codex-card" style="opacity: .6; cursor: not-allowed;" onclick="return false;">
        <div class="icon">📖</div>
        <div class="name">ประมวลกฎหมายอื่น</div>
        <div class="status">coming soon</div>
      </a>

    </div>
  </div>

  <!-- YOUTUBE LINK (ไว้เดิม) -->
  <div class="youtube-section">
    <div class="youtube-header">
      <h3>📺 ติดตามช่องของเรา</h3>
      <span class="youtube-badge">
        <span style="color:#FF0000;font-weight:900">▶</span>
        Cool Uncle Law
      </span>
    </div>
    <p style="margin-bottom:16px;color:var(--ink-soft);">ดูวิดีโอบรรยายและเรียนแบบคลิปสั้นเพื่อเข้าใจง่าย</p>
    <a href="https://www.youtube.com/@CoolUncleLaw/videos" target="_blank" rel="noopener" class="youtube-link">
      🔗 ไปที่ Cool Uncle Law Channel
    </a>
  </div>
</div>
```

---

## 🔧 Update Codex Search Page

ในไฟล์ `codex-search.html` เพิ่มนี้ที่ `<script>` ด้านล่าง:

```javascript
// Parse URL parameter for book selection
function getBookFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('book') || 'all';
}

// Auto-select book on load
document.addEventListener('DOMContentLoaded', () => {
  const book = getBookFromURL();
  if (book !== 'all') {
    selectBook(book);
    // Auto-trigger button
    const btn = document.querySelector(`[onclick="selectBook('${book}')"]`);
    if (btn) btn.classList.add('active');
  }
});
```

---

## 📊 File Structure (ตอนนี้)

```
cool-uncle-legal/
├── index.html                    ← ใหม่ (updated)
├── codex-search.html             ← ใหม่
├── codex-article-viewer.html     ← ใหม่
├── codex-data.json              ← ยังไม่มี (Phase 1)
├── codex-schema.json            ← ข้อมูลอ้างอิง
│
├── shared.css
├── tts-helper.js
├── subject-hub-template.html
└── เกม + hub pages ต่างๆ
```

---

## ⏳ Timeline

1. ✅ **Design Schema** (เสร็จ)
2. ✅ **Create UI** (codex-search + codex-viewer)
3. ⏳ **Extract PDF** (ค่อยๆ ใช้ pdf-knowledge-extractor)
4. ⏳ **Generate codex-data.json** (1-2 วัน)
5. ⏳ **Test + Deploy** (ทำให้เห็น)
6. ⏳ **Add Case Laws** (Phase 2)

---

## 🎯 ตอนนี้ (Ready Now)

- ✅ Codex Search Page (ready ใช้ได้)
- ✅ Article Viewer (ready ใช้ได้)
- ⏳ JSON Data (ต้อง extract PDF)

**ตอนที่ PDF extract เสร็จ → เดินก่อสร้าง codex-data.json → ทดสอบ search**

---

## 🔗 Link to Pages

| Page | Purpose | Status |
|------|---------|--------|
| `codex-search.html` | หลัก: ค้นหามาตรา | ✅ Ready |
| `codex-article-viewer.html` | แสดงมาตรา + ฎีกา | ✅ Ready |
| `codex-data.json` | ข้อมูล ~1250 มาตรา | ⏳ Extraction |

---

## 📌 Important

⚠️ **ตอนนี้ยังไม่มี `codex-data.json`** → ใช้ demo data ก่อน

เมื่อ PDF extract เสร็จ:
1. อัพเดท codex-search.html
2. เปลี่ยน demoData → window.codexData (fetch JSON)
3. Test ทั้งระบบ

---

**Ready? สำหรับ PDF extraction phase ✨**
