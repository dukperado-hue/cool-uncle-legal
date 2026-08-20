# BATCH REPORT FINAL — Agent A content upgrade (รวมทุก batch)

รายงานฉบับนี้สรุปรวมการยกระดับคุณภาพคดีตั้งแต่เริ่มต้นจนถึงปัจจุบัน ตามแนวทาง Agent A v2.2 §24

## ยอดรวม (จาก cases-grade.json ปัจจุบัน — commit 5a4b40a)

| รายการ | จำนวน |
|---|---|
| Cases processed (ทั้งหมดในระบบ) | 236 |
| Grade A | 172 |
| Grade A_REVIEW | 4 |
| Grade B | 5 (เหลือ — เนื้อหาบางเกินกว่าจะยกระดับโดยไม่ฝืน Rule 1) |
| Grade C | 55 (ส่วนใหญ่ legacy international law / คดีความไม่แน่นอนสูง) |
| Cases elevated ตั้งแต่เริ่มงาน | +127 (จาก A=49 เริ่มต้น) |
| BLOCK ในคดี A/A_REVIEW ใหม่ | 0 |
| WARN ในคดี A/A_REVIEW ใหม่ | เกือบทุกคดี = external_law/needs_review (codex ไม่มีพระราชบัญญัติเฉพาะ) + video pending |
| Judicial potential (judicial_potential=true, needs_verification) | ~30+ — ส่งต่อ Agent C ตรวจคำพิพากษาฎีกา |

## คดียกตัวอย่างที่ยกระดับใน Batch 10b (update 11)
เบ้นทลีชนคน (ม.391/300), หวยก้นหุบ (ม.451), ตัดสิทธิผู้สมัคร/ทศทิศ, PM2.5 ภาคเหนือ, สัญญาอาคารรัฐสภา, นทท.เกาหลีพนทยา, รถบัสเรียนไฟไหม้, ประตูหนีฉกเฉินเครื่องบิน, อวี้ฉิงรีดไถ, หลีเป๊ะชนเผ่า, ฟ้องหย่า-มือที่สาม, EIA คอนโดสุขุมวิท, กราดยิงพารากอน 14 ปี, 9Near รั่วข้อมูล, Lady of the Hills 2547, เพชรซาอุอัลรูไวลี 2533 (Series 131–133), ไล่ทีมอแกนสุรินทร์, แชร์พลังงาน Energy De-daction, เสี้แป้ง นาโหนด (2566–2567)

## เหตุผลในการข้าม B/C ที่เหลือ (5 B + 55 C)
1. **Legacy structure บางเกินไป (release = BLOCKED)** — เนื้อหา legacy ของหลายคดีสั้นเกินไปและไม่มี legal issues ให้ยกระดับโดยไม่แต่งเติม (เช่น Western Sahara AO 57, Trendtex 57, Trail Smelter 57) — การจะทำเป็น A ต้องสร้าง legal analysis ใหม่ = ฝืน Rule 1 (ห้ามเดา/เติม/fabricate) → คง NEEDS_REVIEW/HIDDEN
2. **≤ 3 legal issues จาก extract** — เกณฑ์ที่ใช้: LI ≥ 5 จึง rescuable; 4 LI พิจารณาเป็นรายกรณี (ข้าม 2 คดี 4 LI เพราะเนื้อหาบาง); 0–3 LI ข้ามทั้งหมด
3. **ความเสี่ยง fabrication** — บางคดีเป็นข่าวลือ/ข้อมูลขัดกันสูง (source ต่ำ) ตาม §20 คดีกลุ่มท้ายสุดให้ข้ามและบันทึกเหตุผล
4. **คดีกฎหมายระหว่างประเทศ legacy 32 คดี** — เนื้อหา legacy ไม่มี codex ไทยรองรับ ไม่มี legal issues แบบไทย → ไม่สามารถเป็น A ได้อย่างซื่อสัตย์ จัด NEEDS_REVIEW/HIDDEN

## รายการที่ส่งต่อ
- **TODO_VIDEOS.md** — รายชื่อคดี A/A_REVIEW ที่ยังไม่มีวิดีโอ (ต้องค้นหาแหล่งภาษาไทยที่เหมาะสม)
- **Agent C handoff** — คดี judicial_potential=true (เช่น เสี้แป้ง นาโหนด, ฟ้องหย่า-มือที่สาม, หวยก้นหุบ, EIA, เพชรซาอุ 2533, อวี้ฉิง, PM2.5, กราดยิงพารากอน ฯลฯ) รอตรวจ judicial authority/เลขฎีกา → Rank S
- **Agent B handoff** — คดี A ที่พร้อมสำหรับ Read/Play mode presentation — Agent A ไม่แก้ UI ตาม §7
- **Team review** — A_REVIEW 4 คดี (ดีปกครอง: ยุบสภา อบต. 2558, สัมปทานรังนก 2561, โฉนดเกาะลิบบง 2562, รถย้อมแมว 2566) ควรมีมนุษย์ตรวจเนื้อหา

## สุดสถานะ
- Branch: `feature/a-batch-3` (commit ล่าสุด 5a4b40a) — รวม 11 commits / 10 batches
- Quality Gate: ทุกคดี A/A_REVIEW ใหม่ score ≥ 85, paras ≤ 350 (แบ่งประโยคไทยด้วย thai_safe_split), 8 sections ครบ, provisions match codex หรือระบุ external_law/needs_review, 0 BLOCK
- Rule 3: เมื่อแก้ summary/background หลัง gate → rebuild + verify ใหม่เสมอ (ทำแล้วกับ 4 คดีที่ summary เกิน 350)
- Deploy: **ยังไม่ deploy production** (ตาม §23 — publication เป็นขั้นตอนแยก ต้องผ่าน publication decision)

**สถานะ: READY_FOR_REVIEW** — รอการทบทวน publication, handoff Agent C (judicial candidates) และ Agent B (presentation)
