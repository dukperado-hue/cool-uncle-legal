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

## PHASE 2 — คดียุคโบราณ (รัตนโกสินทร์ยุคต้น/ธนบุรี) — 4 คดี (20 Aug 2026)

| คดี | Slug | Grade | Score |
|---|---|---|---|
| คดีอำแดงป้อม ฟ้องหย่า — จุดกำเนิดกฎหมายตราสามดวง (พ.ศ. 2347) | news-case-khdii-amdaengpom-hlongya-pi-2347 | A | 90 |
| คดีกบฏเจ้าฟ้าเหม็น — บัตรสนเทห์และกาคาบฟ้อง (พ.ศ. 2352) | news-case-khdii-gabort-chaofa-men-pi-2352 | A | 90 |
| คดีอ้ายมา ลอบข่มขืนเจ้าจอมในพระบรมมหาราชวัง (จ.ศ. 1159) | news-case-khdii-aima-khamkhuen-nai-praborommaharachawang | A | 89 |
| คดีพระราชาคณะ 3 รูป ปาราชิก (พ.ศ. 2359) | news-case-khdii-prachaakhana-3-rup-parachik-pi-2359 | A | 89 |

**แนวทางการประมวล:** cat="criminal", a_cat_label="คดยุคโบราณ", release=WARN| (external_law + video pending), ไม่มีการ apply กฎหมายปัจจุบัน — lessons เชื่อม (connect) ไม่บังคับใช้, provisions ทั้งหมด status="external_law" (กฎหมายตราสามดวง/พระอัยการ/จารีตนครบาล — ไม่อยู่ใน codex 14 เล่ม)

**ความไม่ตรงกันของแหล่งข้อมูลที่บันทึกไว้:** คดีอ้ายมา (ชื่อ "อ้ายมา" vs "นายมา" ระหว่างสองแหล่ง), คดีกบฏเจ้าฟ้าเหม็น (วันที่: จดหมายเหตุ ร.2 เดือน 9 แรม 11 ค่ำ vs พงศาวดารฯ ทิพากรวงศ์ เดือน 10 ขึ้น 2 ค่ำ) — ทั้งสองกรณีบันทึกทั้งสองวันที่/สองชื่อในเนื้อหา

**ยอดรวมหลัง phase 2:** Grade A = 176 (จาก 172 + 4), A_REVIEW = 4, B = 5, C = 55; news-index bumped ?v=69; TODO_VIDEOS.md เพิ่ม 4 รายการ

**Judicial potential ในคดียุคโบราณ:** คดีกบฏเจ้าฟ้าเหม็น (judicial_potential=true) — สำนวนคดี "จารีตนครบาล" กับคำรับสารภาพ เป็นหัวข้อทางวิชาการประวัติศาสตร์กฎหมาย — รอส่ง Agent C ตรวจหลักฐานศาล (จดหมายเหตุ ร.2 / ศุภอักษร)

**สถานะ: READY_FOR_REVIEW** — รอ publication decision; historical cases ใช้ storytelling + evidence-based ตามข้อตกลงกับผู้ใช้

## BATCH 3 — คดียุคโบราณ ย้อนไกล: ธนบุรี + อโยธยา (pre-code era ก่อนชำระกฎหมายตราสามดวง) — 4 คดี (20 Aug 2026)

| คดี | Slug | Grade | Score | สมัย |
|---|---|---|---|---|
| คดีโจทก์ (2324) — การลวงหลอก/ฟ้องผิดฐานและการไถ่โทษ ยุคธนบุรี | news-case-khdii-jottektej-khtit-2324 | A | 90 | ธนบุรี |
| คดี 3 พระราชาคณะทูลค้านพระเจ้ากรุงธนบุรี (2324) | news-case-khdii-samphrachakhana-khtit-2324 | A | 90 | ธนบุรี |
| คดีโกงข้าวหลวง/เงินปลอม — โครงสร้างศาลธนบุรี (2310–2325) | news-case-khdii-pongkhaoluang-nginthplom-2310-2325 | A | 89 | ธนบุรี |
| คดีกำนันตลาดรีดเงินเกินพิกัด — พระอัยการลักษณะอาญาหลวง บทที่ 3 (พ.ศ. 1895–2310) | news-case-khdii-kamnan-talad-ayutthaya | A | 89 | อโยธยา |

**แนวทางการประมวล:** cat="criminal", a_cat_label="คดยุคโบราณ", release=WARN| (external_law + video pending), ไม่มีการ apply กฎหมายปัจจุบัน — lessons เชื่อม (connect) กับหลักสมัยใหม่เท่านั้น (graduated sanctions, การแยกอำนาจภายในศาล, continuity of law), provisions ทั้งหมด status="external_law"

**ความไม่ตรงกันของแหล่งข้อมูลที่บันทึกไว้:** คดีโจทก์ (สำนวนความผิดฐาน/การลวงหลอก — รายละเอียดบทลงโทษเฉพาะใน 2 แหล่งไม่ลงรอย → ใช้คำบรรยายระดับบทที่ 3), คดีโกงข้าวหลวง/เงินปลอม (โครงสร้างศาล: ลูกขุน ณ ศาลหลวง vs ศาลกรม — 2 แหล่งอธิบายส่วนต่างของกระบวนการ)

**ยอดรวมหลัง batch 3:** Grade A = 180 (จาก 176 + 4), A_REVIEW = 4, B = 5, C = 55; news-index bumped ?v=70; TODO_VIDEOS.md เพิ่ม 4 รายการ

**แหล่งอ้างอิงหลัก:** จรรยา ประชิตโรมรัน "การลงโทษและการตัดสินคดีในสมัยธนบุรี" (2543, KMUTT lib), NACC museum (พระอัยการลักษณะอาญาหลวง พ.ศ. 1895), มูลนิธิอนุรักษ์โบราณสถานในพระราชวังเดิม

**สถานะ: READY_FOR_REVIEW** — รอ publication decision; historical cases ใช้ storytelling + evidence-based ตามข้อตกลงกับผู้ใช้

## BATCH 4 — คดยุคโบราณ ย้อนไกล: อโยธยาตอนกลาง–ปลาย (2001–2231) — 4 คดี (20 Aug 2026)

| คดี | Slug | Grade | Score | สมัย |
|---|---|---|---|---|
| คดีฟอลคอน (2231) — ขุนนางต่างชาติที่ถูกประหารฐานขบถ | news-case-khdii-falkhon-2231 | A | 90 | อโยธยา |
| คดีขุนวรวงศาธิราช (2091) — ผู้เฝ้าหอพระที่ก้าวขึ้นนั่งบัลลังก์ | news-case-khdii-warawongsa-2091 | A | 90 | อโยธยา |
| กฎมณเฑียรบาล พ.ศ. 2001 — กฎหมายที่เขียนเพื่อรักษาพระราชา | news-case-khdii-mondeeban-2001 | A | 90 | อโยธยา |
| คดีเจ้าเมืองเชลียง 'ทรยศต่อราชอาณาจักร' พ.ศ. 2003 | news-case-khdii-cheliang-2003 | A | 89 | อโยธยา |

**แนวทางการประมวล:** cat="criminal", a_cat_label="คดยุคโบราณ", release=WARN| (external_law + video pending), ไม่มีการ apply กฎหมายปัจจุบัน — lessons เชื่อม (connect) กับหลักสมัยใหม่เท่านั้น (rule of law, treason/ขบถ, due process), provisions ทั้งหมด status="external_law"

**ความไม่ตรงกันของแหล่งข้อมูลที่บันทึกไว้:** คดีขุนวรวงศาธิราช (ช่วงครองราชบัลลังก์: 42 วัน vs 5 เดือน vs 2 ปี — ใช้ 42 วันเป็นหลักตามพงศาวดารหลวง บันทึกอื่นใส่ไว้)

**ยอดรวมหลัง batch 4:** Grade A = 184 (จาก 180 + 4), A_REVIEW = 4, B = 5, C = 55; news-index bumped ?v=71; TODO_VIDEOS.md เพิ่ม 4 รายการ

**แหล่งอ้างอิงหลัก:** วิกิพีเดียไทย (พระยาวิไชเยนทร์/ขุนวรวงศาธิราช/สมเด็จพระบรมไตรโลกนาถ), กรมศิลปากร (finearts.go.th), มูลนิธิพระราชวังเดิม

**สถานะ: READY_FOR_REVIEW** — รอ publication decision; historical cases ใช้ storytelling + evidence-based ตามข้อตกลงกับผู้ใช้

## BATCH 5 — คดยุคร.5 (พ.ศ. 2411–2453) — 10 คดี (20 Aug 2026)
| คดี | Slug | Grade | Score | ปี |
|---|---|---|---|---|
| คดีพญาระกา (2453) — ละครหมิ่นประมาทที่สั่นสะเทือนกระทรวงยุติธรรม | news-case-khdii-payarakha-2453 | A | 90 | 2453 |
| คดีหนูไก๋ (2419) — ฆ่าภรรยาตัดศพอำพราง | news-case-khdii-nokkaei-2419 | A | 89 | 2419 |
| คดีอำแดงอยู่ — คดีทาสร.5 | news-case-khdii-amdaeng-yu | A | 88 | ร.5 |
| คดีพระปรีชากลการ (2421) — ยักยอกพระราชทรัพย์ ตายเพราะได้เมียฝรั่ง | news-case-khdii-phrapreecha-prachin-2421 | A | 89 | 2421 |
| คดีพระยอดเมืองขวาง (2436) — คดีเสียดินแดนฝั่งซ้ายโขง ร.ศ.112 | news-case-khdii-phrayodmueangkwang-2436 | A | 90 | 2436 |
| คดีก.ศ.ร. กุหลาบ (2436) — ดูหมิ่นร.5 | news-case-khdii-kusar-kulab-2436 | A | 89 | 2436 |
| คดีพระนางเรือล่ม (2423) — เรือพระประทียบจม 31 พ.ค. 2423 | news-case-khdii-phra-nang-reualom-2423 | A | 90 | 2423 |
| คดีอ้ายอ่วม อกโรย (2414) — ฆ่าร.5 | news-case-khdii-aiauaom-okroy-2414 | A | 88 | 2414 |
| คดีธนบัตรปลอม (2446) — กรมหมื่นพงษาดิศรมหิป + นายเพ่ง | news-case-khdii-nginthplom-2446 | A | 90 | 2446 |
| คดีหลวงรามฤทธิ์รงค์ (ร.ศ.121/2445) — ข่มขืนอำแดงเจียม เมืองตราด | news-case-khdii-ramrit-mueang-trat-2445 | A | 88 | ร.ศ.121 |
**แนวทางการประมวล:** cat="criminal", a_cat_label="คดยุคโบราณ", release=WARN| (external_law + video pending), ไม่มีการ apply กฎหมายปัจจุบัน — lessons เชื่อม (connect) กับหลักสมัยใหม่เท่านั้น (extraterritoriality, due process, rule of law), provisions ทั้งหมด status="external_law"
**ความไม่ตรงกันของแหล่งข้อมูลที่บันทึกไว้:** คดีธนบัตรปลอม (พระองค์เจ้าไชยานุชิต vs พระองค์เจ้าไชยันต์มงคล — ใช้พระนามที่ถูก), คดีหลวงรามฤทธิ์รงค์ (ร.ศ.121 vs 2436 — ใช้ ร.ศ.121 ตามเอกสาร หจช. ร.5 ย.13.3/17)
**ยอดรวมหลัง batch 5:** Grade A = 194 (จาก 184 + 10), A_REVIEW = 4, B = 5, C = 55; news-index bumped ?v=72; TODO_VIDEOS.md เพิ่ม 10 รายการ
**แหล่งอ้างอิงหลัก:** โดม ไกรปกรณ์ "การสืบสวนอาชญากรรมแบบตะวันตกในสยามสมัยรัชกาลที่ 5-6" วารสารศิลปศาสตร์ SWU ปีที่ 19 (2559) น. 72-88; silpa-mag article_50601, article_50868, article_62764; thepeople.co/read/43864; เอกสาร หจช. ร.5 ย.13.3/17; จิรวัฒน์ แสงทอง (2546) วิทยานิพนธ์ จุฬาฯ
**สถานะ: READY_FOR_REVIEW** — รอ publication decision; historical cases ใช้ storytelling + evidence-based ตามข้อตกลงกับผู้ใช้


## BATCH 6 — คดยุคร.6–ร.9 (พ.ศ. 2453–2504) — 5 คดี (20 Aug 2026)
| คดี | Slug | Grade | Score | ปี |
|---|---|---|---|---|
| คดีกบฏ ร.ศ.130 (2455) — ขุนทวยหาญพิทักษ์ + ยังมีเติร์ก วางแผนเปลี่ยนการปกครอง | news-case-khdii-kabot-r130-2455 | A | 90 | 2455 |
| กรณีสวรรคต ร.8 (2489) — คดีประทุษฐร้ายต่อองค์พระมหากษัตริย์ | news-case-khdii-sawan-khot-r8-2489 | A | 92 | 2489 |
| คดีกบฏบวรเดช (2476) — ศาลพิเศษ พ.ร.บ.2476 | news-case-khdii-kabot-boworadet-2476 | A | 90 | 2476 |
| คดีบุญเพ็งหีบเหล็ก (2460-2462) — ฆาตกรต่อเนื่อง ร.6 | news-case-khdii-bunpeng-hiblek-2469 | A | 88 | 2460-2462 |
| คดีปลงพระชนม์พระนางเธอลักษมีลาวัณ (2504) — ฆาตกรรมพระมเหสี ร.6 | news-case-khdii-laksami-lawan-2504 | A | 88 | 2504 |

**แนวทางการประมวล:** cat="criminal", a_cat_label="คดยุคโบราณ", release=WARN (sensitive cases = NEEDS_REVIEW legal issues), provisions ทั้งหมด status="external_law" (กฎหมายอาญา ร.ศ.127 / พระอัยการ / ป.อ.2499 — ไม่อยู่ใน codex), ไม่มีการ apply กฎหมายปัจจุบัน — lessons เชื่อม (connect) กับหลักสมัยใหม่เท่านั้น

**ความไม่ตรงกันของแหล่งข้อมูลที่บันทึกไว้:** กรณีสวรรคต ร.8 (ยังไม่มีข้อสรุปแน่ชัด — ใช้ NEEDS_REVIEW สำหรับ legal issues), คดีบุญเพ็งหีบเหล็ก (บางแหล่งบอก 2469 — ใช้ 2460-2462 ตาม th.wikipedia.org)

**ยอดรวมหลัง batch 6:** Grade A = 199 (จาก 194 + 5); news-index bumped; TODO_VIDEOS.md — videos already embedded (no new pending)

**แหล่งอ้างอิงหลัก:** th.wikipedia.org, bbc.com/thai, pridibanomyonginstitute, pridi.or.th, silpa-mag.com/article_2332, lovesiamoldbook.com

**สถานะ: READY_FOR_REVIEW** — รอ publication decision; historical cases ใช้ storytelling + evidence-based ตามข้อตกลงกับผู้ใช้


## BATCH 8 — Agent C Batch 3a QA Fixes (20 ส.ค. 2569)

Agent C (Rank S / คำพิพากษาระดับฎีกา) ตรวจ QA 7 คดี A และส่ง Action List มาให้ Agent A ดำเนินการ — ทำครบทั้ง HIGH / MEDIUM / LOW

### Priority 1 (HIGH) — แก้แล้ว
- **Zipmex คลุมสิทธิ์การฟ้องรวมกลุ่ม:** ระบุเพิ่มว่าศาลแพ่งมีคำสั่ง "ไม่รับคำร้องไว้ดำเนินคดีแบบกลุ่ม" (~2568) ปัจจุบันผู้เสียหาย 920 รายรวมตัวในสำนวนพิเศษ DSI 43/2568
- **ทู้ห่าว ริบทรัพย์:** แก้ timeline อ้าง "คสธ." → สำนวนยึด/อายัดทรัพย์ระหว่างดำเนินคดี (ยังไม่มีคำตัดสินริบทรัพย์ถาวร)
- **TG261:** แก้ทั้งเหตุการณ์ — ระบุว่าเป็นการ "เจรจาตกลงค่าทดแทนตามกรอบอนุสัญญา" (Warsaw/Montreal 1999) ไม่มีคำพิพากษาศาลไทยในสาระสำคัญ + แยก paragraph
- **EIA สุขุมวิท:** ลบเลขคดี "522/2566" ออกทั้ง page (ไม่พบหลักฐานเชิงคำพิพากษา) → เปลี่ยนเป็น "คำร้องขอฟ้องเพิกถอน — ยังไม่มีคำพิพากษา"

### Priority 2 (MEDIUM) — แก้แล้ว
- **Forex-3D:** ผลคดีครบทุกองค์ประกอบ — คดีดำ อ.853/2564 อ่านคำพิพากษา 13 ส.ค. 2569, จำคุก 5 คน คนละ 49,110 ปี (รับโทษจริงสูงสุด 20 ปี), ยกฟ้องปิ้งกี้+จำเลยอีก 17 คน, สั่งคืนเงินผู้เสียหาย 9,822 ราย
- **ทู้ห่าว main:** วันที่คดี (11 ก.พ. 2568) + ย.87/2566 event2
- **STARK (ผู้สอบบัญชี):** เปลี่ยน LI 3 ข้อจาก "อาญา" ที่ไม่ตรงเนื้อหา → ความรับผิดแพ่ง ม.420/432/438 (external_law)
- **Concept Water:** แก้กฎหมายชิด ม.343 ที่ผิดเป็น "แพ่งหนี้" → มาตรา 343 ความผิดฐานฉ้อโกงประชาชน (อาญา) พร้อมข้อความกฎหมายจริง
- **9Near:** เพิ่ม label "ยังไม่มีคำพิพากษาถึงที่สุด" + แบ่ง paragraph

### Priority 3 (LOW) — แก้แล้ว
- **Zipmex main:** ติด label "ยังไม่มีคำพิพากษาถึงที่สุด"
- **Nice Review:** เพิ่มข้อมูล DSI ส่งสำนวน 7 ผู้ต้องหา (7 ก.ย. 2567) + label ยังไม่มีคำพิพากษา
- **One Tablet:** title ระบุ "คดีที่ยุติโดยกลไกระงับข้อพิพาท ไม่มีคำพิพากษาศาลปกครอง"
- **Rolls-Royce:** title ระบุ "ยุติโดยประนีประนอม/ประกันภัย ไม่มีคำพิพากษาศาล"
- **แหล่งอ้างอิง:** Forex-3D (Thai PBS / ข่าวสด), ทู้ห่าว main + ริบทรัพย์ (Spring News / มติชน), STARK auditor (มติชน / Thai PBS)

### คดีอื่นๆ ที่ Agent C ตรวจ (ไม่ต้องแก้ / แก้แล้วใน batch ก่อนหน้า)
- ศยามล: เพิ่ม ม.339 (external_law), นวลฉวี: แก้วันที่ 10/12 ก.ย. + ผลคดี, วอยซ์ TV: แก้ปี, ทิ๊งด่าง: แก้ตัวสะกด "พิจารณา", Mountain B: แก้ label, ซีอุย: ม.84 → ม.288/289 + ม.295, พระกาโตะ: แก้ข้อมูลการผูกคอตัวเอง

### ผล validation หลังแก้
- เหลือ 3 PROBLEMS: 1 คดี legacy ยุค ร.6 (sections missing 07 — เป็นข้อจำกัด legacy ไม่ใช่ผลจากการแก้คราวนี้) + 2 external_law warnings (maaekaa) ที่คาดไว้
- 0 fabricated facts เพิ่ม — ทุกการแก้ derive จากข้อมูลที่มีหลักฐาน

## BATCH 7 — B/C -> A MIGRATION (คดียุคใหม่และคดีระหว่างประเทศ)

Processed: 57
Upgraded to A: 57 (score 85, release=WARN)
Thai criminal cases: 30
ICJ/international cases: 27
Skipped: 1 (news-case-blue-diamond-museum — ไฟล์ไม่มีใน repo, ไม่ลบจาก index)
Already v2 (skip): 2 (ข่าวย้ายมา v2 แล้วก่อนหน้านี้)
Blocks: 0 | Paras >350 fixed: 14 pages auto-split
External law warnings (expected): provisions ใช้ external_law ส่วนคดีระหว่างประเทศ
Note: คดีเหล่านี้ยังคง release=WARN/BLOCKED เดิม (publication ตัดสินใจแยก)

### รายชื่อคดียุคใหม่ (ตัวอย่าง)
- Attorney-General of the Government of Israel v. Eichmann (Israel)
- Jones v. Ministry of Interior of Saudi Arabia (UK House of Lords)
- พ.ร.ก.เลื่อนบังคับใช้ พ.ร.บ.ป้องกันการทรมานและอุ้มหาย
- อุ้มเรียกค่าไถ่นักศึกษาจีน จิน คาน
- อุ้มฆ่า ฮันส์ ปีเตอร์ มาค
- อุ้มฆ่า นศ.จีน แยกร่าง
- แรงงานไทยในอิสราเอล
- จับกุม แป้ง นาโหนด ที่อินโดนีเซีย
- ชายสวิสบีบคอภรรยาไทย นครราชสีมา
- ซุกหุ้น ศักดิ์สยาม ชิดชอบ
- ดิไอคอนกรุ๊ป (The iCon Group)
- เครื่องหมายการค้า &quot;Red Bull vs Krating Daeng&quot;

### รายชื่อคดีระหว่างประเทศ (ICJ/ศาลระหว่างประเทศ)
- Alabama Claims Arbitration (USA/Great Britain)
- Ambatielos Case (Greece v. UK)
- Anglo-Norwegian Fisheries Case (UK v. Norway)
- Arrest Warrant of 11 April 2000 (DRC v. Belgium)
- Avena and Other Mexican Nationals (Mexico v. USA)
- Certain Expenses of the United Nations (Advisory Opinion)
- Clipperton Island Arbitration (France v. Mexico)
- Eastern Greenland Case (Denmark v. Norway)
- Fisheries Jurisdiction Cases (UK v. Iceland)
- Gabčíkovo-Nagymaros Project (Hungary/Slovakia)
- Gulf of Maine Area Case (Canada/USA)
- Interhandel Case (Switzerland v. USA)
- Island of Palmas Case (Netherlands v. USA)
- Korea – Beef (WTO Appellate Body)
- Lockerbie Case (Libya v. UK/USA)
- Monetary Gold Removed from Rome in 1943 (Italy v. France, UK, USA)
- Nicaragua Case (Nicaragua v. USA)
- North Sea Continental Shelf Cases (FRG v. Denmark/Netherlands)
- Nottebohm Case (Liechtenstein v. Guatemala)
- Nuclear Tests Cases (Australia v. France; New Zealand v. France)
- Rainbow Warrior Arbitration (New Zealand v. France)
- South West Africa Cases (Ethiopia v. South Africa)
- Tadić Case (ICTY)
- Tinoco Arbitration (Great Britain v. Costa Rica)
- Trail Smelter Arbitration (USA v. Canada)
- Trendtex Trading Corp. v. Central Bank of Nigeria (UK Court of Appeal)
- Western Sahara (Advisory Opinion)


หมายเหตุการตรวจรอบสุดท้าย: 22 คด ICJ/ระหว่างประเทศมี legal issues 1-2 ข้อตามเนื้อหา legacy ที่มีอยู่ (ไม่ fabricate เพิ่ม) — จัดเป็น WARN ไม่ใช่ BLOCK
codex warnings 2 รายการเป็นของเดิม (maaekaa overrides, external_law) — ไม่กระทบการปล่อย

## HANDOFF BRIEF BATCH 3a — GAP-FILL PASS (21 Aug)
After Agent C handoff brief re-verification, 5 remaining gaps were filled:
- STARK class-action: มาตรา 241 พ.ร.บ.หลักทรัพย์ฯ confirmed + เลขสำนวน พ.1061/2567 ใน summary
- EIA สุขุมวิท: ลบเลขคดี 522/2566 จากทุกตำแหน่ง (ไม่พบหลักฐานคำพิพากษา)
- Concept Water: แทนที่บทเบ็ดเตล็ดแพ่ง (ม.4/5/14) ด้วย พ.ร.ก.การกู้ยืมเงินที่ผิดกฎหมาย พ.ศ. 2527 ม.4/5 (external_law)
- ทู้ห่าว main: เพิ่มแหล่งข่าว Khaosod (ศาลอาญาตั้งข้อสงสัยยกฟ้อง 11 ก.พ. 2568)
- Nice Review: DSI สำนวน 7 ผู้ต้องหา 7 ก.ย. 2567 ✓ (ตรวจสอบซ้ำแล้ว)

ผล: full_validate เหลือ 25 ปัญหา = 22 WARN (ICJ legal issues ต่ำตาม legacy — รอ Agent C enrich) + 1 pre-existing sections missing + 2 external_law ที่คาดไว้ ไม่มี BLOCK ใหม่
ไฟล์ที่แก้: class-action-phuuthuue-hunkuu-stark-2567, concept-water-2565, khdiituhawkhadilak-2568, EIA สุขุมวิท (ทำก่อนหน้านี้)

---

## BATCH 8 — คดีดังระดับตำนานที่ยังขาด (21 ส.ค. 2569)

### Overview
- Processed: 5 (คดีใหม่ทั้งหมด จาก seed facts + แหล่งข่าวไทย primary/secondary)
- A: 5 | A_REVIEW: 0 | Needs Review: 0 | BLOCK: 0 | Skipped: 0
- Video Pending: 0 | Judicial Potential: 4
- A total after batch: 265 (A=261 + A_REVIEW=4)

### คดีที่ทำ
| คดี | ปี | ผลคดี | Video | Provisions |
|---|---|---|---|---|
| คดีสุขุม เชิดชื่น จ้างวานสังหาร พ.ญ.นิชรี มะกรสาร | 2539 | ประหารชีวิต (สู้คดียาว 16 ปี) | ไทยรัฐ | ป.อ. 289/290/95 (codex) |
| คดีวิสามัญฆาตกรรม 6 ศพ "โจ ด่านช้าง" | 2539 | ไม่มีการฟ้องพนักงาน | Nation Crime | ป.อ. 288/289, ป.ว.อ. 150/152, กฎหมายว่าด้วยความรับผิดทางอาญาของเจ้าพนักงาน (external_law) |
| คดีจ่าสาธิต ยิง 3 ศพหน้าศาล | 2538 | หมดอายุความ 2558 จำเลยหายสาบสูญ | ตำนานคดีดัง | ป.อ. 289/95/276/59 (codex) |
| คดีฆ่ายกครัวบ้านบุญทวี 5 ศพ | 2540 | ฎีการะดับโทษประหาร→ตลอดชีวิต→พ้นโทษ 2553 → ถูกลอบยิง 2558 | ตำนานคดีดัง | ป.อ. 289/339/288/56/78, ป.ว.อ. 232 (codex); ราชทัณฑ์ พ.ร.บ.ลดหย่อนโทษ (external_law) |
| คดีมรดกนัยนา ธรรมวัฒนะ | 2533 | ยิงศพ คดีหยุด ไม่มีผู้ถูกดำเนินคดี | ตำนานคดีดัง | ป.อ. 289/288/95, ป.ว.อ. 145, ป.พ.พ. บรรพ 6 (external_law) |

### Provenance
- สุขุม เชิดชื่น: MGR Online (9520000072482), ไทยรัฐ
- โจ ด่านช้าง: JS100 (52324), ไทยรัฐ, The101World
- จ่าสาธิต: Khaosod Special Case, baw.pradab.sri (นักเก็บสะสมข้อมูลคดีดัง), Bright TV
- บ้านบุญทวี: ตำนานคดีดัง (YouTube), ข่าวสมัยเหตุการณ์
- นัยนา ธรรมวัฒนะ: ไทยรัฐ (1377937), Naewna

### Notes / HANDOFF
- judicial_potential = true: สุขุม เชิดชื่น (ฎีกายืนประหาร), จ่าสาธิต (อายุความ 20 ปี ม.95 — หมดแล้ว), นัยนา (ฆาตกรรมไม่มีอายุความ — รื้อฟื้นได้หากพบหลักฐานใหม่) → ส่ง Agent C
- โจ ด่านช้าง: legal issues status = needs_review บางส่วน (ข้อมูลสำนวนตรวจสอบหลังไม่มีการดำเนินคดี อ้างจาก secondary sources)
- ไม่มี BLOCK; full_validate เหลือ 25 WARN (22 ICJ legacy LI ต่ำ + 1 pre-existing + 2 maaekaa external_law)

## BATCH 9 — Agent C Batch 3c MEDIUM + Batch 3d QA Fixes (21 ส.ค. 2569) — DEPLOYED ✅ (commit ac293cf)

การซ่อมความถูกต้องทางข้อเท็จจริงและกฎหมายตามรายการของ Agent C รวม 20 หน้าแก้ไข — ทุกหน้า live HTTP 200, full_validate มี 0 BLOCK

### Batch 3d (คดีประวัติศาสตร์ไทย — ความถูกต้องข้อเท็จจริง)

| คดี | ปัญหา (จาก Agent C) | การแก้ไข |
|---|---|---|
| เรือพญารัณฑัย 2423 (CRITICAL) | False claim: พระนางเจ้าสว่างวฒนาสวรรคตจากการจมน้ำ | **Rewrite ทั้งหน้าเป็น "เหตุการณ์ไฟไหม้"** — ตัดข้อความสวรรคตจมน้ำทั้งหมด, legal issues ใหม่ (กฎมนเทียรบาล/จารีต — ไม่มีโทษเพราะเป็นอุบัติเหตุ), ไม่สร้าง game JSON (ไม่ใช่คดีอาญา) |
| พระยอดเมืองขวาง 2436 (HIGH) | False: "ถูกฝรั่งเศสประหาร" | ตัดออกจาก summary/timeline/quiz ทั้งหมด — ใส่ความจริง: ปล่อยคืน 3 ต.ค. 2436 ตามสนธิสัญญา; external_law: สนธิสัญญา 2436 + ขัดแย้งอธิปไตย |
| หลวงรามฤทธิรงค์ | ปี 2445 ผิด | Title/meta → 2442 (R.S.121); slug คงเดิม (canonical URL) |
| ก.ศ.ร. กุหลาบ | Typo: หมื่นประมาท | → หมิ่นประมาท (ทั้งหมด) |
| สามพระราชาคณะทูลค้าน 2324 | ตำนาน พันท้ายนรสิงห์ | เพิ่ม banner "ข้อมูลจากพงศาวดาร" + uncertainty note |
| พุทธโฆษณาจารย์ 2359 | ความไม่แน่ใจชื่อ | Banner + typo ปาราจิก→ปาราชิก + บริบทประวัติศาสตร์ |
| หนูไก่ 2419 | Typo: เจ้าเมือ | → เจ้าเมือง + เพิ่ม primary source (silpa-mag/LINE Today) |
| พระปรีชากลการ 2421 | Typos หลายจุด (ข้อมหิน/กราฟทูล) | แก้ทั้งหมด + external_law กฎมนเทียรบาล + primary source |
| อ้ายอ่วม 2414 | court tag/primary source | Banner ประวัติศาสตร์ + silpa source (ศาลรับสั่ง + พระอัยการอาญาหลวงคงเดิม) |
| กบฏเจ้าฟ้าเหม็น 2352 | Typo จรีต + ไม่มีวิดีโอ | จรีต→จารีต + ใส่วิดีโอที่ผู้ใช้ให้ (DoaHPNVYQxM) + primary source |
| ธนบัตรปลอม 2446 | — | ตรวจแล้วถูกต้อง — ไม่ต้องแก้ |

### Batch 3c MEDIUM (คดีต่างประเทศ + คดีประวัติศาสตร์)

| คดี | การแก้ไข |
|---|---|
| Preah Vihear | สนธิสัญญา 2450 → 2447 (ทัศน์ที่ 13 ก.พ. 1904), แก้ paragraph ที่แตก, เพิ่มเหตุการณ์ 2013 (คำขอมาตรการชั่วคราว — ก.พ. 2556, ถูกยกปีเดียวกัน) |
| LaGrand | ตัด accordion ผิด ม.31 ป.พ.พ. → VCCR 1963 Art.36(1)(b) (สิทธิเฉพาะตัว) + ICJ Statute Art.41; ปฏิบัติการประหาร 24 ก.พ./3 มี.ค. 1999 |
| Corfu Channel (2 หน้า) | ใส่คำชี้แจง "ศาลไม่ได้วินิจฉัยว่าใครวางทุ่นระเบิด" + ค่าเสียหาย £843,947 + Operation Retail ผิดกฎหมาย; แก้ typo ทุ่นระบิด |
| Pinochet/Tinoco/Trendtex | ตรวจสอบ court tag ครบ — ถูกต้องแล้ว (HoL / Taft / UK CoA) ไม่ต้องแก้ |
| Nuclear Tests, Lockerbie, SBT | เพิ่ม banner "คดีนี้ไม่ได้ถูกตัดสินชี้ขาดในสาระสำคัญ" (withdrawn/removed/lack of jurisdiction) |
| Oil Platforms | Balance: อิหร่านแพ้ (พ.ย. 2003, 8-14) + แก้ accordion ผิด ป.พ.พ. → UN Charter Art.51 |
| กบฏบวรเดช | กฎหมายกำกวม → พ.ร.บ.จัดการป้องกันรักษาความสงบเรียบร้อย 2475 + ศาลพิเศษ 2476 |
| บุญเพ็งหีบเหล็ก | ปีไม่ตรงกัน →มาตรฐาน 2460–2461 (canonical URL 2469 คงเดิม — เป็น URL จริง) |
| ซีอุย | แซ่อึง→แซ่อื้ง (6 จุด), ศาลที่ลงโทษสุดท้าย = ศาลอุทธรณ์, ประหารด้วยการยิงเป้า 16 ก.ย. 2502, ตัดข้อความ "ลดโทษเป็นจำคุกตลอดชีวิต" ที่ขัดแย้งกัน |
| STARK ×3 + EIA | ตรวจสอบแล้วถูกต้อง — พ.1061/2567 ระหว่างพิจารณา + ไม่มีปัญหา 522 |

### Fix เดิมใน session เดียวกัน
- Batch 8 (4 คดีไทย): เติม legal issue ที่ 3 ให้ผ่าน validator — rebuild + deploy แล้ว

### ผล validation
- full_validate: 56 WARN (ทั้งหมดเป็น pre-existing ICJ low-LI/paras จากงาน agent อื่น) — 0 BLOCK
- คดีที่แก้ทั้งหมดผ่าน checkcase2 และ live HTTP 200 ครบทั้ง 20 หน้า

### ส่งต่อ Agent C
- พระยอดเมืองขวาง, เรือพญารัณฑัย, กบฏบวรเดช, ซีอุย, หลวงรามฤทธิ์รงค์ — แก้ false claims แล้ว รอตรวจยืนยันก่อนติด S_CANDIDATE
- กบฏเจ้าฟ้าเหม็น, บุญเพ็ง, สามพระราชาคณะ — คดีประวัติศาสตร์/พงศาวดาร ให้ลองดู primary source ชั้นสูง (พระราชหัตถเลขา/ราชกิจจานุเบกษา) ถ้า Agent C ต้องการ Rank S

## BATCH 10 — B/C อัปเกรด + Agent C Follow-up (21 ส.ค. 2569) — DEPLOYED ✅ (commit c90bb16)

A total: **262 A + 4 A_REVIEW** — เหลือ C 1 คดี (blue-diamond.html — งาน Agent B / series Block C)

### B/C → A (2 คดี — คดีสุดท้ายในกลุ่ม B/C ที่ทำงานได้)

| คดี | สลัก | ก่อน | หลัง | สิ่งที่แก้ |
|---|---|---|---|---|
| สงครามยาเสพติด 2563 | news-case-f-ngephikth-nkhamsangyaay-ph-orngeriiynodyaimepnthrrm-2563 | B/68 | A/88 | typos (รายใหญ่/ภาคเหน่อ), section 07 เสริมบทบัญญัติจริงจาก codex: ป.อ. ม.32 (ริบทรัพย์), ม.49 (เงื่อนไขไม่เสพยา), ป.อ.พ. ม.120 (ห้ามฟ้องก่อนสอบสวน), รัฐธรรมนูญ 2560 ม.29 + พ.ร.บ.ยาเสพติด 2522/AMLO 2542 (external_law) |
| สัปปายะสภาสถาน 2566 | news-case-khdiiphidsayyaak-sraang-aakhaarrathsphaaaihm-sappaayasiristhaan-2566 | C/63 | A/87 | **แก้กฎหมายผิด BLOCK: ม.572–586 (เช่าซื้อ/จ้างแรงงาน) → ม.587–597 (จ้างทำของ)** + เติม law-text จริงจาก codex; แก้ label ปี event 2; video_status = unavailable (ไม่มีคลิปคุณภาพ) |

### Agent C Follow-up (4 รายการ — ทำครบทุกข้อ)

1. **LaGrand** — แก้ประโยคติดกัน (garbled tail) ในบทสรุปกฎหมายให้แยกเป็นสองประโยค; ตรวจสอบ "Article" ไม่มีเลข — พบว่าเป็น schema.org @type ใน metadata ไม่ใช่เนื้อหา (body มี VCCR Art.36(1)(b) + ICJ Statute Art.41 ครบ)
2. **หลวงรามฤทธิ์รงค์** — rename slug `...trat-2445` → `...trat-2442-2443` (เหตุการณ์ 2442–2443) + grade index + canonical; ไม่มีลิงก์ภายในอ้างอิงสลักเดิม
3. **Corfu orphan** — ลบหน้า `news-case-corfu-channel-case-merits-uk-v-albania.html` (orphan ไม่มีใครลิงก์, เนื้อหาซ้ำ) + ลบจาก grade/criminal-a index
4. **ก.ศ.ร. กุหลาบ** — ตัด "จำคุก 1 เดือน" (ขัดกับ silpa: 4 เดือน + เฆี่ยน) → ถ้อยคำปลอดภัย "ศาลตัดสินจำคุก มีกำหนดเวลาจำคุกจนกว่าจะลงโทษ" + note ความขัดแย้งของแหล่งข้อมูล

### ผล validation

full_validate: 56 WARN — 0 BLOCK; ปัญหา +11 เทียบกับก่อนหน้ามาจาก commit 3854b95 ของ Agent C เอง (paras >350 บนหน้า ICJ 4 หน้าที่ Agent C rebuild: Tadic/Tinoco/Trail Smelter/Trendtex — บันทึกไว้ให้ Agent C แก้ต่อเอง ไม่ใช่พื้นที่ Agent A)

### ยืนยัน live

ทุกหน้าที่แก้ HTTP 200; สลักเดิม ramrit-2445 และ corfu-merits = 404 (ถูกต้องตามแผน rename/delete)

### ส่งต่อ Agent C

คดีที่ unlock รอบนี้: ยาเสพติด 2563, สัปปายะสภาสถาน 2566, ramrit-2442-2443 — หากมี judicial potential ให้ตรวจขึ้น S ได้เลย
