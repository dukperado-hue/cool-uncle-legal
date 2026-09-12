# Thai Legal Atlas Encyclopedia — Glossary Coverage Gap Audit

Generated 2026-09-12, alongside the alias-mapping pass on `atlas-concepts.json`
and the new Encyclopedia subject-tag system (`atlas-subject-tags.json` /
`atlas-subject-tags.js`). This file records every glossary term from the
requested 12-subject pass that is a **genuine content gap** — no existing
Concept or authored prose anywhere in `atlas-concepts.json` represents it.
Per the pass's own rule, none of these were fabricated to fill the list; they
are left here for a future content-authoring session.

Do not treat this file as a second source of truth for coverage — the live
answer for "is X covered" is always `atlas-concepts.json` (`titleTH` +
`aliases[]`) checked against the full concept text, not this snapshot.

## Subjects with existing authored concepts (real gaps only)

Only these 4 subjects have any authored Concepts today. Every other term in
their target glossary was resolved this pass (exact concept title, or a
newly-registered `aliases[]` entry — see the alias-schema note below).

### หนี้ (12 of 50 terms — see `nee`, `bo-koet-haeng-nee`, `sanya`, `laap-mikhuan-dai`, `sitthi-yeud-nuang-burimsit`)
- ทรัพย์ทั่วไป — generic/fungible-thing category of the object of an obligation; not separately named anywhere.
- หนี้เลือกกระทำ — alternative obligations (ม.198–201); not yet authored.
- การช่วงทรัพย์ — subrogation into a substituted item; not yet authored (distinct from การรับช่วงสิทธิ, which is already an alias).
- การโอนสิทธิเรียกร้อง — assignment of claims (ม.303–313); `nee`'s own text explicitly notes this is unwritten pending more lectureNotes (only 2/11 articles have any).
- เจ้าหนี้ร่วม — joint creditors (ม.290–302); `nee`'s own text explicitly notes this is unwritten pending more lectureNotes (only 6/13 articles have any). (ลูกหนี้ร่วม *is* covered — but only via `lamoed`'s ม.432 joint-tortfeasor cross-reference, not as its own หนี้-law doctrine.)
- สิทธิอุปกรณ์ / หนี้ประธาน — accessory-right / principal-debt terminology; not yet authored.
- การวางทรัพย์ / การขอปฏิบัติการชำระหนี้ — deposit / tender of performance (ม.331–339); not yet authored.
- เหตุส่วนตัว / เหตุในลักษณะคดี — personal vs. case-wide grounds (joint-obligor doctrine, ม.295 area); not yet authored.
- จัดการงานนอกสั่ง — negotiorum gestio. A placeholder concept slug (`atlas:concept/jadkan-ngan-nok-sang`) already exists in `relatedConcepts[]` on `nee` and `lamoed`, both marked `status: "planned"` — no prose exists yet anywhere.

### ทรัพย์ (5 of 50 terms — see `sap`, `kammasit`, `krobkrong`, `sitthi-thang-sap-uen`)
- ที่ดินรกร้างว่างเปล่า / ที่ชายตลิ่ง — named in ม.1304's own text that `kammasit` cites, but not spelled out as their own sub-terms.
- ที่ราชพัสดุ — a different, unauthored topic (state-property-act land), not part of ม.1304.
- การอุทิศโดยปริยาย — implied dedication of private land to public domain; not yet authored.
- ผู้รับโอนไม่มีสิทธิดีกว่าผู้โอน — the general *nemo dat quod non habet* principle; `kammasit`'s ม.1299 discussion assumes it as background but never states it as its own named doctrine.

### ละเมิด (7 of 50 terms — see `lamoed`)
- ไกลเกินกว่าเหตุ — remoteness of damage; only the "เหตุขาดตอน" (intervening-cause) half of this pairing is covered.
- การละเว้นการกระทำ / หน้าที่ตามความสัมพันธ์ที่มีอยู่ก่อน — omission liability and the pre-existing-relationship duty that grounds it; not yet authored.
- การใช้สิทธิโดยไม่สุจริต — abuse-of-right liability (ม.421); ม.421–422 are named in `lamoed`'s principle text but the doctrine itself has no dedicated section yet.
- ความยินยอมไม่เป็นละเมิด — consent as a defence; not yet authored.
- ผู้รับจ้างทำของ — the independent contractor's *own* direct liability (as opposed to ผู้ว่าจ้างทำของ's liability for one, which `lamoed` does cover under ม.428).
- จัดการงานนอกสั่ง — same planned-but-unwritten concept noted under หนี้ above.

### นิติกรรม (1 of 49 terms — see `nitikam`, `sanya`)
- สัญญาไม่ต่างตอบแทน — unilateral (non-reciprocal) contracts; `sanya` covers สัญญาต่างตอบแทน (bilateral/reciprocal) in depth but never names its opposite.

## Subjects with zero authored concepts today (100% gap)

`atlas-concepts.json` has no Concept in any of these 8 subjects, so nothing
could be aliased or cross-linked — every term in each subject's target
glossary (the full lists in the originating request) is a genuine content
gap pending that subject's first authored concept:

| Subject | Terms audited |
| --- | ---: |
| วิแพ่ง | 50 |
| คดีเมือง | 50 |
| องค์กรธุรกิจ | 50 |
| ปกครอง | 50 |
| มรดก | 50 |
| อาญา | 50 |
| ครอบครัว | 50 |
| ประวัติศาสตร์กฎหมายไทย | 50 |

Two notes worth carrying into that future work:
- **ปกครอง** already has one relevant placeholder: `atlas:concept/lamoed-jao-na-thi` (ความรับผิดทางละเมิดของเจ้าหน้าที่), referenced from `lamoed` as `specializes`, `status: "planned"` — no prose written.
- **คดีเมือง**'s glossary is doctrinal Latin/English public-international-law terms (Jus Cogens, Pacta Sunt Servanda, …), not Thai statutory terms — authoring it would need to be grounded in the `intlcommlaw.html` lecture content, not `codex-data.json`, since there is no PIL codex collection.

## Alias-schema note

Every non-gap term above (and everywhere else in the 4 covered subjects'
glossaries) was resolved one of three ways, in order of preference:
1. **Exact concept title** — no action.
2. **Existing `aliases[]` entry already present before this pass** — no action (includes all 4 explicit cross-link examples from the request: ทำนิติกรรม→นิติกรรม, ทำละเมิด→ละเมิด, ทำสัญญา→สัญญา, ที่มาของหนี้→บ่อเกิดแห่งหนี้ — all four were already implemented).
3. **New `aliases[]` entry added this pass** — the term's underlying legal idea was found, and verified in context (not just a substring hit), inside an existing concept's own prose; the alias was added to whichever concept actually holds that content, even across subject lines (e.g. ประมาทเลินเล่อ, appearing in the หนี้ glossary, is aliased to `lamoed` — the concept that actually explains it).

No new Concepts were authored and no existing Concept prose was duplicated
or rewritten in this pass — only `aliases[]` arrays and the new
`subjectTags[]` classification field were touched.
