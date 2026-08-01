# Courtroom Trial Script — "คดีที่สวนสัตว์" (v2)

Replaces the current flat MC-quiz "courtroom mode" in `game-crimlaw-scenario.html`
with a dramatized Ace Attorney-style trial: อัยการ accuses, ทนายจำเลย counters,
the player picks which side's legal theory is correct (same underlying MC data as
today — this is a presentation upgrade, not a new assessment mechanic), then
ผู้พิพากษา delivers the ruling. New characters needed: see `GAME_ART_PIPELINE.md`
section 2b (`judge`, `prosecutor`, `defense_lawyer`, `courtroom_cat`).

**Do not re-derive or rephrase the legal reasoning below** — it's lifted directly
from the already-verified `reveal` text in the current `questions[]` array
(`game-crimlaw-scenario.html`, lines ~416-479). Only the *framing* (who says it,
in what dramatic order) is new.

Format below mirrors the engine's existing beat shape
(`{ speaker, pose, caption }`) so it can be pasted into a new `trial` array on
the scenario object with minimal translation work. `speaker` values map to the
4 new sprite ids; `defendantSprite` beats reuse the existing 6 character ids for
reaction shots.

---

## Opening (once, before charge 1)

```
{ speaker: 'judge', pose: 'neutral',
  caption: 'ศาลนี้นัดพิจารณาคดีที่สวนสัตว์เปิดเขาเขียว มีผู้ถูกกล่าวหาหลายคน หลายข้อหา — เริ่มจากคนแรก' }
```

---

## Charge 1 — นางดำ (ม.300 ประมาท)

*(สมมติว่านางดำยังมีชีวิตอยู่ในเหตุการณ์นี้)*

```
{ speaker: 'judge', pose: 'neutral',
  caption: 'ข้อหาแรก: นางดำเบียดคิวเดินชนคนจนทำให้ นส.เหลือง ตกบ่อหมูเด้ง แล้วถูกโจนาห์กัดจนบาดเจ็บสาหัส' }

{ speaker: 'prosecutor', pose: 'confident',
  caption: 'อัยการ: จำเลยเบียดจนผู้เสียหายบาดเจ็บสาหัส ต้องรับผิดฐานทำร้ายร่างกายตามมาตรา 295 โดยตรง!' }

{ speaker: 'defense_lawyer', pose: 'confident',
  caption: 'ทนายจำเลย: คัดค้าน! ลูกความของดิฉันไม่มีเจตนาทำร้ายใครทั้งสิ้น เป็นเพียงอุบัติเหตุจากความไม่ระมัดระวัง' }

{ speaker: 'judge', pose: 'neutral',
  caption: 'ศาลฟังทั้งสองฝ่ายแล้ว ท่านผู้ตัดสิน — ท่านเห็นว่าข้อกล่าวหาใดตรงตามหลักกฎหมายที่สุด?' }

// --- MC question here: reuse questions[0] verbatim (female_influencer / นางดำ) ---

{ speaker: 'judge', pose: 'confident',
  caption: 'ศาลพิพากษา: แม้นางดำไม่มีเจตนาทำร้ายใคร แต่การเบียดคิวจนคนอื่นตกบ่อสัตว์ในสวนสัตว์เป็นการขาดความระมัดระวังที่วิญญูชนพึงมีตามภาวะเช่นนั้น ผลที่สัตว์ทำร้ายผู้ตกบ่อถือเป็นผลตามธรรมชาติที่คาดหมายได้ตามทฤษฎีเหตุที่เหมาะสม นางดำจึงมีความผิดฐานกระทำโดยประมาทเป็นเหตุให้ผู้อื่นรับอันตรายสาหัส ตามมาตรา 300' }

{ speaker: 'prosecutor', pose: 'sad',
  caption: 'อัยการ: ...ศาลว่าตามนั้น' }
{ speaker: 'defense_lawyer', pose: 'neutral',
  caption: 'ทนายจำเลย: (พยักหน้ารับคำพิพากษา)' }
```

---

## Charge 2 — นายแดง การกระทำที่ 1 จาก 3 (ลักทรัพย์บุพการี ม.334+ม.71)

```
{ speaker: 'judge', pose: 'neutral',
  caption: 'ข้อหาต่อไป: นายแดงแอบหยิบแหวนทองของมารดาไปจำนำเพื่อเอาเงินมาเที่ยว' }

{ speaker: 'prosecutor', pose: 'confident',
  caption: 'อัยการ: จำเลยลักทรัพย์ตามมาตรา 334 ต้องรับโทษเต็มตามกฎหมาย!' }

{ speaker: 'defense_lawyer', pose: 'confident',
  caption: 'ทนายจำเลย: คัดค้าน! แหวนวงนี้เป็นของมารดาลูกความดิฉันเอง กฎหมายยกเว้นโทษให้กรณีเช่นนี้ไว้ชัดเจน' }

{ speaker: 'judge', pose: 'neutral',
  caption: 'ท่านผู้ตัดสิน — คดีนี้ควรจบลงอย่างไร?' }

// --- MC question here: reuse questions[1] verbatim (male_teen / นายแดง act 1) ---

{ speaker: 'judge', pose: 'confident',
  caption: 'ศาลพิพากษา: การกระทำครบองค์ประกอบความผิดฐานลักทรัพย์ตามมาตรา 334 แต่กฎหมายยกเว้น "โทษ" ให้แก่ผู้กระทำต่อทรัพย์ของบุพการีตามมาตรา 71 วรรคแรก เพราะแหวนเป็นทรัพย์ของมารดา นายแดงจึงยังคง "มีความผิด" ฐานลักทรัพย์อยู่ เพียงแต่ไม่ต้องรับโทษเท่านั้น' }
```

---

## Charge 3 — นายแดง การกระทำที่ 2 จาก 3 (ทำร้ายนางดำจนตาย — สายเหตุถูกตัด)

```
{ speaker: 'judge', pose: 'sad',
  caption: 'ข้อหาที่หนักที่สุด: นายแดงแย่งขาตั้งกล้องจากนางดำมากระหน่ำตี จนนางดำบาดเจ็บที่แขนและขา สามวันต่อมานางดำเสียชีวิตเพราะแผลติดเชื้อ — แต่เธอปฏิเสธไปหาหมอ เลือกดื่ม/อาบน้ำมนต์แทน' }

{ speaker: 'prosecutor', pose: 'angry',
  caption: 'อัยการ: ผู้ตายเสียชีวิตจากบาดแผลที่จำเลยเป็นผู้ก่อ จำเลยต้องรับผิดฐานทำร้ายร่างกายจนเป็นเหตุถึงแก่ความตายตามมาตรา 290!' }

{ speaker: 'defense_lawyer', pose: 'confident',
  caption: 'ทนายจำเลย: คัดค้าน! ผู้ตายเองเป็นผู้ปฏิเสธการรักษาทางการแพทย์ นี่คือเหตุแทรกแซงที่ตัดความสัมพันธ์ระหว่างการกระทำกับผลแห่งความตาย' }

{ speaker: 'judge', pose: 'neutral',
  caption: 'ท่านผู้ตัดสิน — จำเลยต้องรับผิดในความตายนี้หรือไม่?' }

// --- MC question here: reuse questions[2] verbatim (male_teen / นายแดง act 2) ---

{ speaker: 'judge', pose: 'confident',
  caption: 'ศาลพิพากษา: นายแดงมีเจตนาทำร้ายและเป็นผลให้นางดำบาดเจ็บ (ยังไม่ถึงขั้นสาหัส) จึงมีความผิดฐานทำร้ายร่างกายตามมาตรา 295 เท่านั้น — นายแดงไม่ต้องรับผิดในผลถึงแก่ความตายของนางดำ เพราะนางดำปฏิเสธการรักษาทางการแพทย์ไปดื่ม/อาบน้ำมนต์แทน ถือเป็นเหตุแทรกแซงที่ผิดปกติวิสัยของบุคคลทั่วไป ตัดความสัมพันธ์ระหว่างการกระทำกับผลแห่งความตายตามทฤษฎีเหตุที่เหมาะสม' }

{ speaker: 'prosecutor', pose: 'shocked',
  caption: 'อัยการ: (ถอนหายใจ) ...รับทราบคำพิพากษา' }
```

---

## 🐱 Comic-relief beat (stress-relief cat break, per user request)

Placed right here — after the trial's heaviest/darkest charge (a death), before
moving to the lighter self-defense case. A tonal breather, not a plot beat.

```
{ speaker: 'courtroom_cat', pose: 'neutral',
  caption: '(เงียบไปครู่หนึ่ง... จู่ ๆ แมวศาลตัวหนึงก็เดินยิ้มเข้ามากลางห้องพิจารณาคดีอย่างไม่สนใจใคร)' }

{ speaker: 'judge', pose: 'shocked',
  caption: 'ผู้พิพากษา: เอ่อ... ใครก็ได้พาแมวออกไปที... (ยังพยายามคงความสงบขององค์คณะ)' }

{ speaker: 'courtroom_cat', pose: 'sleepy',
  caption: '(แมวศาลไม่สนใจ นอนหมอบใต้บัลลังก์ผู้พิพากษาอย่างสบายใจ)' }

{ speaker: 'prosecutor', pose: 'neutral',
  caption: 'อัยการ: (อดยิ้มไม่ได้) ...ศาลที่เคารพ ขอเราพักสัก 1 นาทีได้ไหมครับ' }

{ speaker: 'judge', pose: 'confident',
  caption: 'ผู้พิพากษา: (สูดหายใจลึก) ได้... พักสั้น ๆ แล้วกลับมาว่าความกันต่อ' }
```

---

## Charge 4 — นายแดง การกระทำที่ 3 จาก 3 (ตัวเขาเองตกบ่อ — ไม่ใช่ผู้กระทำ)

```
{ speaker: 'judge', pose: 'neutral',
  caption: 'กลับเข้าสู่การพิจารณา — เหตุการณ์ต่อไป: นายแดงเองถูกผลักตกบ่อหมูเด้งไปด้วย ถูกหมูเด้ง (ลูก) งับขา และมีแผลถลอกตามตัว' }

{ speaker: 'prosecutor', pose: 'neutral',
  caption: 'อัยการ: จำเลยเป็นต้นเหตุของเหตุการณ์วุ่นวายทั้งหมดคืนนี้ ต้องรับผิดด้วยหรือไม่?' }

{ speaker: 'defense_lawyer', pose: 'confident',
  caption: 'ทนายจำเลย: คัดค้าน! ตอนนี้ลูกความดิฉันเป็นฝ่ายถูกกระทำต่างหาก ไม่ใช่ผู้กระทำต่อผู้ใดเลย' }

{ speaker: 'judge', pose: 'neutral',
  caption: 'ท่านผู้ตัดสิน — เหตุการณ์ตอนนี้ นายแดงมีความผิดหรือไม่?' }

// --- MC question here: reuse questions[3] verbatim (male_teen / นายแดง act 3) ---

{ speaker: 'judge', pose: 'confident',
  caption: 'ศาลพิพากษา: ในเหตุการณ์ตอนนี้นายแดงเป็นฝ่าย "ถูกกระทำ" ไม่ใช่ผู้กระทำต่อผู้อื่น จึงไม่มีความผิดใด ๆ เกิดขึ้นจากตอนนี้ — เขาเป็นผู้เสียหายในเหตุการณ์นี้เอง' }
```

---

## Charge 5 — นายเขียว (ป้องกันโดยชอบ ม.68)

```
{ speaker: 'judge', pose: 'neutral',
  caption: 'ข้อหาสุดท้าย: นายเขียว แฟนคลับที่จำนางดำได้ วิ่งเข้าไปผลักนายแดงเพื่อหยุดไม่ให้ทำร้ายนางดำต่อ ทำให้นายแดงตกบ่อหมูเด้งไปอีกคนและถูกกัด' }

{ speaker: 'prosecutor', pose: 'confident',
  caption: 'อัยการ: จำเลยผลักผู้อื่นจนได้รับบาดเจ็บ ต้องมีความผิดฐานทำร้ายร่างกายตามมาตรา 295!' }

{ speaker: 'defense_lawyer', pose: 'confident',
  caption: 'ทนายจำเลย: คัดค้าน! ลูกความดิฉันกระทำไปเพื่อป้องกันผู้อื่นจากภยันตรายที่ใกล้จะถึงโดยชอบด้วยกฎหมายเท่านั้น' }

{ speaker: 'judge', pose: 'neutral',
  caption: 'ท่านผู้ตัดสิน — นี่คือการป้องกันโดยชอบ หรือความผิดฐานทำร้ายร่างกาย?' }

// --- MC question here: reuse questions[4] verbatim (male_fan / นายเขียว) ---

{ speaker: 'judge', pose: 'confident',
  caption: 'ศาลพิพากษา: นายเขียวกระทำไปเพื่อป้องกันนางดำจากภยันตรายที่ใกล้จะถึงจากการประทุษร้ายอันละเมิดต่อกฎหมายของนายแดง การผลักเพื่อหยุดคนที่กำลังใช้อาวุธทำร้ายผู้อื่น เป็นวิธีที่พอสมควรแก่เหตุ จึงเข้าเหตุยกเว้นความผิดฐานป้องกันโดยชอบด้วยกฎหมายตามมาตรา 68 ไม่มีความผิด' }

{ speaker: 'defense_lawyer', pose: 'confident',
  caption: 'ทนายจำเลย: ยุติธรรมสมกับที่รอคอย!' }
```

---

## Closing (once, after charge 5 — leads into score screen)

```
{ speaker: 'judge', pose: 'neutral',
  caption: 'ศาลได้พิจารณาครบทุกข้อกล่าวหาแล้ว ขอบคุณทุกฝ่ายที่มาให้ปากคำในวันนี้ — ปิดการพิจารณาคดี' }
```

---

## Notes for whoever wires this into the engine

- Each `// --- MC question here ---` marker means: pause the beat sequence,
  render the existing `questions[n]` MC UI unchanged (same options/correct
  flag/reveal data — nothing about the assessment logic changes), then resume
  the beat sequence at the next line once answered. The judge's "ศาลพิพากษา:"
  line right after each marker **is** that question's existing `reveal` text,
  just re-attributed to the judge as spoken dialogue instead of a plain reveal
  card.
- `pose` values above reuse the 5-key expression set from
  `GAME_ART_PIPELINE.md` section 4 (`neutral`/`shocked`/`angry`/`sad`/`confident`)
  — same portrait files convention (`pics/game/portraits/<speaker>_<pose>.png`).
- `courtroom_cat` only needs its 3 simple poses (`neutral`/`startled`/`sleepy`)
  per section 2b — reused `neutral`/`sleepy` above, `startled` is available if a
  future edit wants the cat to react to something instead of just wandering in
  calmly.
- This script assumes the AA-style portrait+textbox UI described as "the next
  real coding task" already exists — this script is content to drop into that
  UI once built, not something to wire into the current small-circular-avatar
  system.
