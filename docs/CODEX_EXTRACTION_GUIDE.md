# 📚 Codex Data Extraction & Import Guide

**Status:** 🚀 Ready for Phase 1 (Auto-extract + Manual Review)

---

## 🎯 ขั้นตอนการสร้าง Codex Database

### **Phase 1: Auto-Extract + Organize (ตอนนี้)**
```
PDF Files → Extract Articles → JSON Structure → Search Index
[21 MB + 51 MB] → python/claude → codex-data.json → ready
```

### **Phase 2: Case Law & Examples (ค่อยๆ)**
```
Real Case Laws → Manual Entry → Link to Articles → Admin Panel
[Real Fikgeda] → UI Form → article.caseLaw[] → update
```

### **Phase 3: Dashboard & Stats (ไม่มีกำหนด)**
```
Analytics → Usage Stats → Popular Articles → Admin Dashboard
→ Trending → Most Cited → Add New Cases
```

---

## 📖 1. PDF Extraction Plan

### **Using pdf-knowledge-extractor (Skill ใช้ได้)**

ผมจะใช้ `/mnt/skills/user/pdf-knowledge-extractor/SKILL.md` ทำดังนี้:

#### **Step 1: Setup**
```bash
# ให้ Claude เรียก pdf-knowledge-extractor skill
# Input: ไฟล์ PDF ทั้ง 5 ไฟล์
# - ประมวลกฎหมายอาญา (21 MB)
# - ประมวลกฎหมายแพ่ง (51 MB)
# - ประมวลวิธีพิจารณาความแพ่ง
# - ประมวลวิธีพิจารณาความอาญา
# - พระธรรมนูญศาลยุติธรรม
```

#### **Step 2: Extract & Parse**
```
Output: Knowledge base JSON + Markdown summary
- แยกตามระดับ (ภาค/บรรพ > ลักษณะ > หมวด > ส่วน > มาตรา)
- บันทึก full text แต่ละมาตรา
- Extract keywords / subject
```

#### **Step 3: Organize to Schema**
```javascript
// Input: Raw extracted data
// Process: Map to our JSON schema
// Output: codex-data.json (พร้อมใช้)

{
  "criminal": { ... },
  "civil": { ... },
  "civpro": { ... },
  "crimpro": { ... },
  "constitution": { ... },
  "searchIndex": { ... }
}
```

---

## 🔨 2. Manual Process (ถ้าต้อง Auto ไม่ได้)

ถ้า pdf-knowledge-extractor ไม่ได้ผล ทำ manual แบบนี้:

### **Step 1: ใช้ OCR / Copy-Paste**
```
- Open PDF in Adobe/Foxit
- Copy text by section (ภาค/บรรพ)
- Paste into spreadsheet (มาตรา | ข้อความ | keywords)
```

### **Step 2: Structure Data**
```
CSV Format:
ID | Number | Text | Breadcrumb | Keywords | HasExamples | CaseCount
criminal_1 | 1 | ในประมวล... | ภาค 1 > ลักษณะ 1 > หมวด 1 | บทนิยาม, ความหมาย | FALSE | 0
civil_276 | 276 | ผู้ซื้อมีสิทธิ... | บรรพ 4 > ลักษณะ 1 > หมวด 2 | สัญญา, คัดค้าน | TRUE | 8
```

### **Step 3: CSV → JSON**
```
ใช้ python script หรือ online tool แปลง CSV → JSON
```

---

## 📊 3. JSON Output Format

### **ตัวอย่าง (codex-data.json)**

```json
{
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2024-01-01",
    "totalArticles": 1250
  },

  "criminal": {
    "title": "ประมวลกฎหมายอาญา",
    "parts": [
      {
        "id": "part-1",
        "name": "ภาค 1",
        "title": "บทบัญญัติทั่วไป",
        "characteristics": [
          {
            "id": "char-1-1",
            "name": "ลักษณะ 1",
            "title": "บทบัญญัติที่ใช้แก่ความผิดทั่วไป",
            "categories": [
              {
                "id": "cat-1-1-1",
                "name": "หมวด 1",
                "title": "บทนิยาม",
                "articles": [
                  {
                    "id": "criminal_1",
                    "number": "1",
                    "title": "บทนิยาม",
                    "text": "ในประมวลกฎหมายนี้...",
                    "keywords": ["บทนิยาม", "ความหมาย"],
                    "caseLaw": [],
                    "examples": [],
                    "references": {
                      "relatedArticles": ["2", "3"],
                      "relatedLaws": [],
                      "notes": ""
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  "searchIndex": {
    "articles": {
      "1": ["criminal_1"],
      "276": ["civil_276"],
      "315": ["civil_315"]
    },
    "keywords": {
      "บทนิยาม": ["criminal_1"],
      "สัญญา": ["civil_45", "civil_276"],
      "ความผิด": ["criminal_5", "criminal_10"]
    }
  }
}
```

---

## 🔍 4. Data Validation Checklist

### **ต้องตรวจสอบ:**

- [ ] **ทั้งหมด 1,250 มาตรา** ✅
- [ ] **Hierarchical structure ถูกต้อง**
  - ภาค/บรรพ → ลักษณะ → หมวด → (ส่วน) → มาตรา
- [ ] **ไม่มีมาตรา missing** (ตรวจ ID sequence)
- [ ] **ข้อความไม่มี encoding error** (Thai characters ถูกต้อง)
- [ ] **Keywords มีความหมาย** (ไม่เยอะเกิน/น้อยเกิน)
- [ ] **Search Index ทำงาน** (test search "276" ต้องหา)

---

## 📝 5. Manual Entry: Case Laws & Examples

### **ขั้นตอน:**

1. **แยกมาตรา 200+ ที่มีฎีกา** (Phase 2 เริ่ม)
2. **สำหรับแต่ละมาตรา ให้:**
   - ค้นหาฎีกาจาก: ศาลฎีกา, ศาลอุทธรณ์, ศาลตรวจสอบการเมือง
   - บันทึก: เลขฎีกา, ชื่อคดี, สรุป, หลักการ
   - เพิ่มเข้า: `article.caseLaw[]` array

3. **สำหรับตัวอย่างปลอม (ตอนนี้)**
   - ใช้ scenario สมมติ (ง่าย, ทำให้เข้าใจ)
   - ต้องใช้ภาษาไทยถูกต้อง
   - ให้ explanation ที่ชัดเจน

### **ตัวอย่าง Case Law Entry:**

```json
{
  "id": "case-276-1",
  "caseNumber": "ฎีกา 1234/2562",
  "year": 2562,
  "title": "คดี: ผู้ซื้อคัดค้านสินค้า",
  "summary": "ผู้ซื้อซื้อสินค้าแล้วพบว่าชำรุด ศาลตัดสินให้ผู้ซื้อมีสิทธิคัดค้าน",
  "holding": "หลักการ: ผู้ซื้อมีสิทธิคัดค้านตามมาตรา 276 แม้เกินระยะเวลา หากมีเหตุสดวร",
  "citedIn": ["276", "270", "275"],
  "source": "https://deka.coj.go.th/..."
}
```

---

## 🛠️ 6. Import to System

### **ขั้นตอน:**

1. **Save JSON file**
   ```
   /codex-data.json (ใส่ในโฟลเดอร์เดียวกับ HTML)
   ```

2. **Update Search Logic** (codex-search.html)
   ```javascript
   // เปลี่ยนจาก demoData → fetch codex-data.json
   
   // ปัจจุบัน:
   const demoData = { /* demo */ };
   
   // ต่อไป:
   fetch('codex-data.json')
     .then(r => r.json())
     .then(data => window.codexData = data);
   ```

3. **Update Search Function**
   ```javascript
   // ใช้ window.codexData แทน demoData
   books.forEach(book => {
     const bookData = window.codexData[book] || [];
     // ... search logic
   });
   ```

4. **Test ทั้งหมด**
   - Search by keyword
   - Search by number
   - Filter by book/part
   - Display article + cases

---

## 📱 7. Admin Panel (Phase 2)

ตอนนี้ placeholder แค่ UI เมื่อขึ้นไป Phase 2 จะเพิ่ม:

```html
<!-- Admin Panel Features -->
- ✅ Add/Edit Case Law
- ✅ Add/Edit Examples
- ✅ Verify Data
- ✅ Export to JSON
- ✅ Backup & Restore
```

---

## 🔄 8. Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| **1** | Auto-extract + Organize | 1-2 วัน | 🚀 START |
| **1** | JSON validate | 1 วัน | ⏳ Next |
| **2** | Case Law entry (manual) | 2-4 สัปดาห์ | ❌ Later |
| **2** | Admin Panel UI | 1 สัปดาห์ | ❌ Later |
| **3** | Analytics + Stats | ??? | ❌ Future |

---

## 📌 Important Notes

### **สำคัญ:**

1. **Thai Character Encoding**
   - ✅ ต้อง UTF-8 everywhere
   - ✅ ต้องตรวจ ป้ายกำกับภาษาไทย

2. **Hierarchical Consistency**
   - ✅ ทั้ง อาญา แพ่ง ต้อง structure เดียวกัน
   - ✅ ไม่ mix ภาค กับ บรรพ

3. **Search Performance**
   - ✅ JSON ถ้า < 10MB ใช้ได้ดี
   - ✅ ถ้า > 20MB ต้อง Database

4. **Fallback (ถ้า extract ไม่ได้)**
   - Option 1: Copy manual จาก PDF
   - Option 2: ใช้ OCR tool อื่น (Adobe, Tesseract)
   - Option 3: ระบาดไป Phase 2 พร้อม manual

---

## 🚀 Next: เริ่มแยก PDF

**พอพร้อมหรือยัง? ทำ pdf-knowledge-extractor เลยครับ** 

ขั้นตอน:
1. ✅ ออกแบบเสร็จ (Schema + UI + Guide)
2. ⏳ ต่อไป: Extract PDF (ใช้ pdf-knowledge-extractor)
3. ⏳ Validate + นำเข้า JSON
4. ⏳ Test search + display

---

**Ready? Let's build the Codex! 📚✨**
