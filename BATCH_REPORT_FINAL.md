# BATCH REPORT — Agent A content upgrade (รวมทุก batch)

รายงานฉบับนี้สรุปรวมการยกระดับคุณภาพคดีตั้งแต่เริ่มต้นจนถึงปัจจุบัน ตามแนวทาง Agent A v2.2 §24

## ยอดรวม (จาก cases-grade.json ปัจจุบัน)

| รายการ | จำนวน |
|---|---|
| Cases processed (ทั้งหมดในระบบ) | 235 |
| Cases upgraded to A (รวม) | 111 (จาก 49 เริ่มต้น = +62) |
| Cases remaining B | 61 |
| Cases remaining C | 63 |
| Cases skipped (ยังไม่นับรวม A) | 124 (B/C ที่เหลือ — รายชื่อและเหตุผลด้านล่าง) |
| BLOCK ในคดี A ใหม่ | 0 |
| WARN ในคดี A ใหม่ | 111 (ส่วนใหญ่ = external_law สำหรับคดีกฎหมายระหว่างประเทศ และ video pending สำหรับคดีไทยบางคดี) |
| Video pending (A ไม่มีวิดีโอ) | 12 — บันทึกลง TODO_VIDEOS.md |
| External law (provisions นอก codex) | ราว 40+ รายการ ในคดีกฎหมายระหว่างประเทศ |
| Judicial potential (ส่ง Agent C) | 15 คดี — บันทึกลง research_handoff.md |

## สัดส่วนโดยประมาณของคดี A

- กฎหมายระหว่างประเทศ / ICJ / WTO / ITLOS / PCA: ~35 คดี (Lotus, Corfu Channel ×2, Barcelona Traction, Chorzów Factory, Nicaragua, Temple of Preah Vihear, South China Sea, Nuclear Weapons AO, Wall AO, Reparation for Injuries AO, Reservations Genocide AO ฯลฯ)
- คดีอาญาไทย: ~55 คดี (STARK, ฆาตกรรม 6 ศพชลบุรี, ตู้ห่าว, ศีอุย, โซบราจ, เสาไฟกินรี ฯลฯ)
- คดีปกครอง/รัฐธรรมนูญ/ทรัพย์สินทางปัญญา: ~21 คดี (พ.ร.ป.ส.ว., หัวหน้า คสช., วอยซ์ทีวี, ลิขสิทธิ์กางเกงช้าง, ป้าบัวผัน ฯลฯ)

## เหตุผลในการข้ามคดี B/C ที่เหลือ (61 B + 63 C)

1. **Legacy structure บางเกินไป (release = BLOCKED)** — เนื้อหา legacy ของหลายคดีสั้นเกินไปและไม่มี legal issues ให้ยกระดับโดยไม่แต่งเติม (เช่น Western Sahara AO 57, Trendtex 57, Trail Smelter 57) — การจะให้เป็น A ต้องสร้าง legal analysis ใหม่ = ฝืน Rule 1 (ห้ามเดา/เติม) → NEEDS_REVIEW
2. **คะแนน ≤ 69 และไม่มี primary source เพียงพอ** — คดีที่เหลือส่วนใหญ่คะแนน 54–69 และเนื้อหา legacy เป็น placeholder ทั่วไป
3. **ความเสี่ยง fabrication** — บางคดีเป็นข่าวลือ/ข้อมูลขัดกันสูง (เช่นคดีที่มี source ต่ำ) ตาม §20 คดีกลุ่มท้ายสุดให้ข้ามและบันทึกเหตุผล

## รายการที่ส่งต่อ

- **TODO_VIDEOS.md** — 12 คดี A ที่ยังไม่มีวิดีโอ (ต้องค้นหาแหล่งภาษาไทยที่เหมาะสม)
- **research_handoff.md** — 15 คดี judicial potential สำหรับ Agent C ตรวจ judicial authority
- **Agent B handoff** — คดี A ที่พร้อมสำหรับ Read/Play mode presentation ไม่มีการแก้ UI ใน task นี้

## สรุปสถานะ

- Branch: `feature/a-batch-3` (commit ล่าสุด fc708bc) — รวม 8 batches
- Quality Gate: ทุกคดี A ใหม่ score ≥ 85, paras ≤ 350, 8 sections ครบ, provisions match codex (หรือ external_law), 0 BLOCK
- Deploy: ยังไม่ deploy production (ตาม §23 — publication เป็นขั้นตอนแยก)

**สถานะ: READY_FOR_REVIEW** — รอการทบทวนและตัดสินใจ publication รวมถึง handoff ให้ Agent C ตรวจ judicial candidates
