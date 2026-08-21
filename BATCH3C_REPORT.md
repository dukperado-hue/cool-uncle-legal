# รายงาน Batch 3c — เสร็จครบ 2 เฟส (commit 2d39be5)

## เฟส 1 — Cross-check คด+ีดร Tier-1 ทียบ judicial_authority record (commit 478b535)

ตรวจและซ่อม 7 คด+ีดร Tier-1 ตาม record ของ Agent C พร้อม patch golden manifest 6 รายการทุกจุดใช้ byte-level verification (hex probe) ไม่ใช่การอ่านจาก terminal:

| คด+ีดร | สิ่งที่แก้ |
|---|---|
| forex3d-2564 | meta.cat (คด+ีดรอาญา/เศรษฐกิจ), status.state (ยังไม่ถึงที่สุด), เลขคด+ีดรดำ อ.853/2564, ป้าย timeline |
| shayamala-2536 | rank.grade + badge → VERIFIED_S (รายแรกที่ Agent C ตรวจยืนยัน) |
| tuohao-criminal-2566 | status → ยังไม่ถึงที่สุด, เพิ่ม judicial block (ยกฟ้องจำเลยที่ 2 ทู้ห่าว), แก้ tone ห่าว e48→e49 |
| tuohao-civil-2566 | holding → ยึด/อายัดชั่วคราว ~117.9 ล., note → ยับยั้งแปง ปปง. |
| zipmex-2565 | holding → ถูกปฏิเสธ (คด+ีดรเฉพาะ 43/2568) |
| 9near-2566 | gate reset |
| nualchawee-2502 | OK — ไม่ต้องแก้ |

รอยรั่ว golden manifest ที่พบเพิ่มระหว่างตรวจ: ทู้ห้าว→ทู้ห่าว, คด+ีดร.87→คด+ีดร ย.87, เฉิเพาะ→เฉพาะ, ท้ายคด+ีดร 9near เขียนใหม่ตาม brief — ซ่อมครบ 4 จุดแล้ว (hex-verified)

## เฟส 2 — สร้าง 12 คด+ีดรใหม่ (commit 2d39be5)

ทุกคด+ีดร: grade = S_CANDIDATE, s_verified = false, public = false, gate = agent_a_approval_required — พร้อมส่ง Agent C ตรวจเทียบ record ต่อ

| ID | ชื่อ | สถานะ/แหล่ง | พิเศษ |
|---|---|---|---|
| [aerial-incident-1999](https://coolunclelab.com/prototype/read-case.html?id=aerial-incident-1999) | Aerial Incident 10 Aug 1999 (Pakistan v. India) | ICJ Case 107 — ยกคำร้อง 21 มิ.ย. 2543 | Migrate จาก legacy ครบ |
| [kamnan-nok-pai-rot-2566](https://coolunclelab.com/prototype/read-case.html?id=kamnan-nok-pai-rot-2566) | กำนันนก × คด+ีดรหลัก (ฐานผู้ใช้) | ศาลอาญา 30 ม.ค. 2568 — จำคุกตลอดชีวิต ม.288+ม.60 + บวกโทษเดิม 12 ปี | Migrate ครบ |
| [kamnan-nok-bok-pit-2567](https://coolunclelab.com/prototype/read-case.html?id=kamnan-nok-bok-pit-2567) | กำนันนก × คด+ีดรรอง (งานเลี้ยง) | ศาลอาญาคด+ีดรทุจริตกลาง 9 เม.ย. 2567 — 2 ปี | Migrate ครบ |
| [nice-review-2562](https://coolunclelab.com/prototype/read-case.html?id=nice-review-2562) | Nice Review — แช่รลูกโซ่ดาราดัง | DSI คด+ีดรพิเศษ 7 ผู้ต้องหา อายัด ~300 ล. — ไม่มีคำพิพากษา | Q&A format |
| [concept-water-2565](https://coolunclelab.com/prototype/read-case.html?id=concept-water-2565) | Concept Water — แช่รลูกโซ่เครื่องกรอง | DSI คด+ีดรพิเศษ — ไม่มีคำพิพากษา | Q&A format |
| [one-tablet-2556](https://coolunclelab.com/prototype/read-case.html?id=one-tablet-2556) | One Tablet Per Child | คด+ีดรโต้แย้งสัญญาจัดซื้อแท็บเล็ต | Migrate ครบ |
| [rolls-royce-2566](https://coolunclelab.com/prototype/read-case.html?id=rolls-royce-2566) | กระบะชนท้าย Rolls-Royce | ละเมิดหลายล้านบาท | Migrate ครบ |
| [sawan-khot-r8-2489](https://coolunclelab.com/prototype/read-case.html?id=sawan-khot-r8-2489) | กรณีสวรรคต ร.8 (2489) | เปรียบเทียบ 3 เวอร์ดิกต์ (ยก→ยก→ประหาร); ตัดสิน 12 ต.ค. 2497; ยิง 17 ก.พ. 2498 | **HIGHEST CAUTION** — ห้าม "ปลงพระชนม์" เป็น fact; compare mode |
| [bawornadej-2476](https://coolunclelab.com/prototype/read-case.html?id=bawornadej-2476) | กบฏบวรเดช 2476 — ศาลพิเศษ | SKELETON ONLY — ตัวเลข 5/47/107/154 ไม่ lock (แท็ก "รอ A deploy fix"); อ้าง ภูธร ภูมะธน (2521) น.114–119,150 + รชก.เล่ม 50 | รอ Agent A |
| [chainmanee-2567](https://coolunclelab.com/prototype/read-case.html?id=chainmanee-2567) | เชนแมนี่ — Nominee Forex-3D | คด+ีดรแดง อ.2812/2567 — ผูก Forex-3D theme | Seed facts จาก brief เท่านั้น |
| [bunpeng-hiblek-2462](https://coolunclelab.com/prototype/read-case.html?id=bunpeng-hiblek-2462) | โบ๊นเพ็งหีบเหล็ก 2462 | ตัดคอ 19 ส.ค. 2462 ลานวัดภาษี — คนสุดท้ายของสยาม; แยกตำนาน 7 ศพ vs ยืนยัน 2 ศพ | Seed facts; ไม่ lock VERIFIED_S |
| [ratthamontri-2492](https://coolunclelab.com/prototype/read-case.html?id=ratthamontri-2492) | การสังหาร 4 รัฐมนตรี 2492 | ไม่มีคำพิพากษา — ไม่เคยถึงที่สุด | Seed facts เท่านั้น |

## กติกาที่ปฏิบัติ (Agent Rules)
- **RULE 2**: ไม่แก้ facts/legal — เนื้อหา migrate แบบ verbatim จากไฟล์ migration.txt ที่ Agent C ตรวจแล้ว
- **RULE 3**: ไม่ fabricate — คด+ีดร chainmanee/ratthamontri/bunpeng ไม่มีหน้า news ใน repo จึงสร้างจาก seed facts ของ brief เท่านั้น (ส่วนน้อยสุด ที่จำเป็น)
- **RULE 5**: ทุกคด+ีดร public=false — ซ่อนไม่ใช่ลบ
- **RULE 6**: ไม่มี S badge เลย (s_verified=false ทุกคด+ีดร) — sawan/bawornadej/bunpeng ไม่ lock VERIFIED_S เด็ดขาด
- **RULE 7**: gate reset → agent_a_approval_required ทุกไฟล์ (รวมส่วนแก้ Phase 1)
- **RULE 8**: migration ครบไม่ทิ้งเนื้อหา legacy
- **RULE 9**: ทุก paragraph ≤ 350 ตัวอักษร (aerial พบ 363 → แยกที่รอยต่อประโยคแล้ว)
- **RULE 10**: golden-cases manifest เพิ่ม 12 รายการ (รวม 39 รายการ) โดย judicial_case คัดลอก byte-perfect จาก case JSON

## การตรวจคุณภาพ
- valid JSON: ทุกไฟล์ผ่าน
- paragraphs > 350: 0 (แก้ aerial แล้ว)
- gate/reset: ครบทุกไฟล์
- Render: ทุกหน้า HTTP 200 ทั้ง sandbox และ coolunclelab.com live

## ขั้นตอนถัดไป
- ส่ง 12 คด+ีดรให้ Agent C ตรวจเทียบ judicial_authority record (ส่งต่อได้ทันที — ไฟล์ JSON ครบ)
- sawan-khot-r8-2489: รอ A แก้ binding ก่อน lock ใดๆ; คด+ีดรนี้ใช้ mode compare 3 เวอร์ดิกต์เท่านั้น
- bawornadej-2476: รอ A deploy fix ตัวเลข (5/47/107/154) — B ไม่อัปเดตจนกว่าจะมีคำสั่ง
- 3 คด+ีดร NOT_READY: สามพระราชาคณะ 2324 (BANNED), แสงชัย, ชลบุรี 5 ศพ — ไม่ได้สร้าง
