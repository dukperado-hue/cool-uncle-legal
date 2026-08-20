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
