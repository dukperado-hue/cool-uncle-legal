---
name: case-writer
description: "Research and write one new court case into Cool Uncle Legal Lab's case library (prototype/assets/cases/*.json + golden-cases.json). One file, live in both โหมดข่าว (news-index.html) and โหมดประมวล (prototype/read-case.html, play-case.html) at once. Use for classic ฎีกาศาลฎีกา precedent cases and other case types (historical, ICJ, constitutional, policy)."
argument-hint: "[case name, or ฎีกา number, or 'list' to see what's already covered]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - AskUserQuestion
---

<objective>
Produce ONE new case entry for coolunclelab.com, fact-checked against a real court judgment, written into the exact schema the site already uses, and registered so it appears live in both surfaces at once:

- **โหมดข่าว** (`news-index.html`) — reads `prototype/assets/cases/golden-cases.json` directly, links to `prototype/read-case.html?id=...`
- **โหมดประมวล** (`prototype/read-case.html`, `prototype/play-case.html`, `prototype/explore.html`) — reads the case's own `prototype/assets/cases/{id}.json`

Writing to these two files is the entire "publish" step — there is no separate news-mode build. Confirmed by reading `news-index.html`'s own script (`GOLDEN_URL = 'prototype/assets/cases/golden-cases.json'`).

**Ignore the older `news-case-*.html` static pages, `cases-grade.json`, `cases_350.json`, and anything under `manus-backup/`** — those belong to a superseded pipeline that ran on a different (Manus) cloud sandbox this session cannot reach. The live site has already moved on to the `golden-cases.json` + `prototype/assets/cases/*.json` system; don't try to reconcile the two.
</objective>

<hard-rules>
These carry over from the case library's existing quality bar (found in `manus-backup/agent-b-files/SENOFF_PLAN.md` and observed in the live data) — do not relax them:

1. **No fabrication.** Every ฎีกา/case number, date, and fact must come from a real, checkable source (WebSearch + WebFetch the actual judgment summary or a reputable secondary source — Supreme Court's own site, ThaiJustice, Deka Wisdom, ISOC, a law-school case brief, a specific news article). If you cannot verify a fact, cut it or write "ควรตรวจสอบเพิ่มเติม" — never invent a ฎีกา number to fill the field.
2. **Paragraphs ≤ 350 characters.** Split at a sentence boundary if a drafted paragraph runs long.
3. **No blank explanations.** The `ฐานกฎหมาย` section is the bridge to a future "ประมวล nn" cross-link — every มาตรา cited must have an actual sentence explaining what it does in this case, not `"...มาตรา 1523: "` with nothing after the colon (a real bug seen in `adultery-damages-landmark-2565.json`).
4. **Deidentify living private individuals.** Public officials, historical figures (deceased), and state/corporate parties can be named. A living private person (victim, defendant not a public figure, family member) gets Level C treatment — initials only (e.g. "น.ส. ก.", "นาย ส."), matching the pattern in `janeera-2541.json`'s `deident` block. When unsure whether someone counts as a public figure, default to deidentifying.
5. **No duplicate `id`.** Run the "check for duplicates" step below before writing anything — the library already has ~82 cases; skim it so you don't re-cover a case that already exists under a different slug.
6. **Every article citation must be real** — don't guess a มาตรา number to sound authoritative. If the source only says "the court applied the civil code's inheritance provisions" without a number, write it that vague and flag it, don't invent a number.
7. **Use the rich `read.sections` schema, never the flat one — and render-test before calling anything done.** `prototype/read-case.html` renders each section by branching on `s.key` (`overview` / `background` / `case_details` / `legal_issues` / `provisions` / `lessons` / `judicial` / ...) and expects `s.content` to be an **object** (`{paragraphs:[...]}`, `{timeline:[...], analysis:[...], links:[...]}`, `{issues:[...]}`, `{articles:[...]}`, `{items:[...]}`, `{verdict:{...}}` depending on the key) — see step 4's template below. A large chunk of the existing library was written with a *different*, incompatible flat schema (`{"id":"02","title":"...","content":"plain string"}`) that `read-case.html` silently fails to render: the heading shows, the body is empty. **Discovered 2026-08-23**: 39 currently-public case pages have this bug, including several flagged `VERIFIED_S` (e.g. `adultery-damages-landmark-2565`, `marriage-equality-landmark-2567`, `rice-pledging-landmark-2560`) — being marked verified/public says nothing about whether a file actually renders. Never trust a file's own `grade`/`s_verified`/`public` flags as proof its schema is correct; always confirm by opening `prototype/read-case.html?id={slug}` in a browser and checking the section bodies actually show text, not just headings. This is a known, large, separate cleanup job (see `<known-issue-flat-schema>` below) — don't try to silently fix it as a side effect of writing one new case; flag it to the user instead.
</hard-rules>

<workflow>

## 1. Check for duplicates and pick the case

```bash
cd "path/to/Cool-uncle-legal-web"
ls prototype/assets/cases/*.json | sed 's#.*/##; s/\.json$//' | grep -v -E "golden-cases|explore-inventory" | sort
```

If the user named a case, confirm it isn't already covered (slugs aren't always obvious — grep the list and also grep case titles inside `prototype/assets/cases/golden-cases.json` for the ฎีกา number or a key name). If the user just said "next classic ฎีกา case" with no name, propose 2-3 well-known candidates (favor cases every Thai law student would recognize — a landmark ฎีกา on เจตนา, ป้องกันตัว, สัญญา, ละเมิด, etc.) and confirm before researching deeply.

## 2. Research (WebSearch + WebFetch)

Find:
- The real ฎีกา/case citation (เลขที่คำพิพากษา, or for non-ฎีกา cases the equivalent — ICJ case number, ศาลรัฐธรรมนูญ คำวินิจฉัยที่, etc.)
- What happened (facts), in enough detail to write a real ลำดับเหตุการณ์, not a vague summary
- What legal question the court actually decided, and which มาตรา it applied — this is the entire point of "classic ฎีกา first": it tells you exactly which codex articles this case should eventually cross-reference in ประมวล nn
- The outcome/holding

Prefer primary or near-primary sources. If the only sources are low-quality blog summaries, say so in the case's `sources` field rather than presenting it as fully verified — set `rank.s_verified: false` if you can't confirm the citation from a credible source.

## 3. Determine deident level (see hard-rules #4) and category

Pick a clean `cat` value — reuse an existing category verbatim where possible (`คดีอาญา`, `คดีแพ่ง`, `คดีรัฐธรรมนูญ`, `คดีประวัติศาสตร์กฎหมาย`, `คดีศาลโลก ICJ`, `คดีนโยบาย`) rather than inventing a new phrasing or typo-ing one (the existing data has drift like "คดีอาญา · เศรฐกิจ" and "คดยุคโบราณ" — don't add to it).

## 4. Write the case JSON

File: `prototype/assets/cases/{slug}.json` — slug = short-ascii-kebab + 4-digit พ.ศ. year, matching existing convention (e.g. `adultery-damages-landmark-2565`).

Use the **rich** schema — verified working by actually rendering it in a browser (`wisut-2544.json`, `banyin-suchuwong-2567.json` — read one of these fresh each time rather than trusting this template to stay in sync):

```json
{
  "id": "{slug}",
  "meta": { "title": "...", "year": "2565", "cat": "...", "blurb_60": "<one-line hook, <=60 chars>" },
  "visibility": { "public": true, "gate": "none" },
  "rank": {
    "grade": "VERIFIED_S",
    "score": 90,
    "s_verified": true,
    "judicial_case": "คำพิพากษาศาลฎีกาที่ .../....",
    "verified_by": "case-writer skill"
  },
  "status": "พร้อมใช้งาน",
  "deident": { "required": false },
  "read": {
    "sections": [
      { "order": 1, "key": "overview", "title": "01 ภาพรวมคดี",
        "content": { "paragraphs": ["...", "..."] } },
      { "order": 2, "key": "background", "title": "02 เบื้องหลัง — คดีนี้เกิดขึ้นอย่างไร",
        "content": { "paragraphs": ["...", "..."] } },
      { "order": 4, "key": "case_details", "title": "04 รายละเอียดคดี",
        "content": {
          "timeline": [{ "label": "...", "events": [{ "year": "...", "text": "..." }] }],
          "analysis": ["..."],
          "links": [{ "text": "...", "url": "https://..." }]
        } },
      { "order": 5, "key": "legal_issues", "title": "05 ประเด็นกฎหมายที่คดีนี้ถาม",
        "content": { "issues": [{ "id": "q1", "question": "...?", "anchor": "<the answer>" }] } },
      { "order": 6, "key": "provisions", "title": "06 บทบัญญัติที่เกี่ยวข้อง (กดดูกฎหมายเต็ม)",
        "content": { "articles": [{ "ref": "มาตรา ... — อาญา", "loc": "...", "text": "<the article's actual text>", "anchor": "<why it applies here, not blank>" }] } },
      { "order": 7, "key": "lessons", "title": "07 บทเรียนจากคดีนี้",
        "content": { "items": [{ "id": "l1", "text": "..." }] } }
    ]
  },
  "play": { "flow": [], "anti_reveal_rules": [] },
  "media": { "video": null, "status": "none" },
  "sources": { "seed_facts": ["<real source URL you actually used>"] },
  "migration": { "from": "new_research", "verified": true, "checker": "case-writer skill", "check_date": "<today>" },
  "validation": { "schema_ok": true, "paragraph_ok": true, "sections_complete": true, "links_ok": true, "gate": "none", "last_validated_at": "<today>T00:00:00+07:00", "last_changed_after_validation": false }
}
```

Notes:
- Sections are optional and order-independent — include whichever of `overview`/`background`/`summary`/`case_details`/`legal_issues`/`provisions`/`lessons`/`judicial` you have real material for. Don't force a `judicial` (verbatim court-by-court quotes) section unless you actually have that level of source detail — news-summary-level research is enough for the others, just don't invent quoted courtroom language you don't have.
- Do **not** add placeholder "ข้อมูลเพิ่มเติม" filler sections — several existing files have leftover `"รอการอัปเดตข้อมูลเพิ่มเติมจาก Agent C"` junk from the old pipeline; don't reproduce that pattern.
- If `s_verified` is true, `visibility.public` should be true too (that's what makes it actually show up) unless deident review is still pending — in which case set `public: false` and `visibility.gate: "deident_required"` until the human confirms the redaction, matching `janeera-2541.json`'s pattern. If you can't find the exact official citation number (ฎีกาที่ X/YYYY) despite confirming outcome/date/facts from multiple reputable sources, it's fine to ship with `grade: "A"`, `s_verified: false`, and a `judicial_case` string that honestly describes what you *do* have (reading date, court, trial-court case number) — don't block on it or invent the number.

## 5. Register in golden-cases.json

Add one entry to the `golden_cases` array in `prototype/assets/cases/golden-cases.json`:

```json
{
  "id": "{slug}",
  "title": "<same as meta.title>",
  "cat": "<same as meta.cat>",
  "has_video": false,
  "rank": {
    "grade": "VERIFIED_S",
    "score": 85,
    "s_verified": true,
    "judicial_case": "<same as read-case's rank.judicial_case>",
    "verified_by": "case-writer skill"
  },
  "visibility": { "public": true, "gate": "none" },
  "modes": ["read", "play"]
}
```

(Verified against the real `illegitimate-child-inheritance-2563` entry — `rank` is a nested object here, not flat fields, and there's a top-level `modes` array. Still worth re-reading a live neighboring entry each time in case the shape drifts further.)

## 6. Validate before showing the user

```bash
python3 -c "import json; json.load(open('prototype/assets/cases/{slug}.json', encoding='utf-8'))"
python3 -c "import json; json.load(open('prototype/assets/cases/golden-cases.json', encoding='utf-8'))"
```

Then serve locally and open `prototype/read-case.html?id={slug}` in the browser (claude-in-chrome) to confirm it renders — check console for fetch errors, check no section is empty/truncated, check no paragraph visibly runs on forever (the ≤350 char rule).

## 7. Report and confirm before pushing

Summarize: case title, real citation used, source(s), deident decision and why, category. Show the local render. **Do not commit/push without asking** — same as any other change to this repo (git push is a visible, shared-state action).

</workflow>

<known-issue-flat-schema>
**Discovered 2026-08-23, not yet fixed.** 39 case files under `prototype/assets/cases/*.json` are marked `visibility.public: true` (several `grade: "VERIFIED_S"`) but were written in the flat, incompatible `content: "string"` schema — they render on `prototype/read-case.html` with visible section headings and completely empty bodies. This is a real, live, site-wide content bug, not a hypothetical.

Confirmed broken-and-public as of that date: `adultery-damages-landmark-2565`, `aerial-incident-1999`, `bawornadej-2476`, `boworadet-rebellion-2476`, `bunpeng-hiblek-2462`, `domestic-violence-protection-2562`, `dr-supat-skeleton-2555`, `four-ministers-murder-2492`, `hangthong-mystery-2542`, `illegitimate-child-inheritance-2563`, `khdii-abolition-slavery-2448`, `khdii-book-club-scandal-2449`, `khdii-khun-yuam-logging-2445`, `khdii-ministry-agri-embezzlement-2416`, `khdii-penalcode-rs127-2451`, `khdii-phum-saat-embezzlement-2440`, `khdii-rs103-petition-2427`, `khdii-rs130-rebellion-2455`, `klong-dan-corruption-2545`, `living-will-right-to-die-2558`, `marriage-equality-landmark-2567`, `nenkham-2556`, `nikorn-2533`, `nualchawee-legend-2502`, `palace-rebellion-2492`, `peace-rebellion-2495`, `phra-prom-chedi-2561`, `phra-prom-dilok-2561`, `rama-8-forensic-landmark-2489`, `rice-pledging-landmark-2560`, `rs-130-rebellion-2454`, `serm-sakonrat-41`, `sherry-ann-duncan-scapegoat-2529`, `si-quey-human-rights-2563`, `somchai-neelapaijit-2547`, `syamol-forensic-2536`, `tee-yai-legend-2524`, `yantra-2537`, `young-turk-rebellion-2524`. (Plus a similar number of non-public flat-schema files, and 7 files using a third, `list`-typed content shape — `kabot-r130-2455`, `khdii-aiauaom-okroy-2414`, `khdii-ksr-kulap-2443`, `khdii-sanghan-4-ratthamontri-2492`, `khdii-somdet-phra-nang-ruea-lom-2423`, `khdii-thanabat-plom-r5-2446`, `nangthongloen-2468` — not yet investigated for renderability.)

This skill does **not** fix these as a side effect of writing a new case — it's a large, separate content-migration job (converting flat strings into structured `paragraphs`/`timeline`/`issues`/`articles`/`items` per section, which is a real editorial/restructuring task per file, not a mechanical rename). Surface this list to the user and let them decide whether to prioritize a fix pass before writing more new cases.
</known-issue-flat-schema>

<serial-offenders-multi-incident>
A real person sometimes has more than one prosecutable incident (e.g. a serial offender charged in separate cases across different years/courts). Don't try to cram all of it into one case's `read.sections` — the library is one-entry-per-incident. Instead:
- Write the incident actually being requested as its own case (own `id`, own real citation for *that* incident).
- In its `เบื้องหลัง`/`ลำดับเหตุการณ์` text, mention the other known incidents by name only as context (one sentence, no invented details) so a reader isn't confused why the same name shows up elsewhere.
- Note the other incidents in that case's `sources` or a short `internal_notes` field as candidate future entries — don't build them now unless asked.
This keeps the door open for neuralnetworklegalcode to later graph a person across multiple case-nodes ("nexus node" concept) without this skill having to model that graph itself — out of scope per the "light touch" nn-linking decision above.
</serial-offenders-multi-incident>

<reuse-across-case-types>
This skill is deliberately generic across `คดีอาญา` / `คดีแพ่ง` / `คดีรัฐธรรมนูญ` / historical / ICJ / policy cases — the schema, dual-mode registration, and validation steps are identical regardless of category. Only two things change per category:
- **Deident rules** (hard-rule #4) — living-private-person cases need it, historical/state/corporate-party cases don't.
- **What counts as the citation** — ฎีกาศาลฎีกา for ordinary court cases, คำวินิจฉัยศาลรัฐธรรมนูญที่ for con-court cases, I.C.J. Reports citation for ICJ cases, or the historical court's own record for pre-modern cases (see `phrayod-muangkwang-2436.json`'s `judicial_case` field for a worked historical example — no ฎีกา existed yet in ร.ศ.112, so it names the actual tribunal and sentence instead).
</reuse-across-case-types>
