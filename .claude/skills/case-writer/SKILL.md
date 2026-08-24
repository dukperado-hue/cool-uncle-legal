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
4. **Deidentify living private individuals — and scale caution to how recent the case is.** Public officials, historical figures (deceased), and state/corporate parties can generally be named regardless of era. For everyone else, apply a time-graduated standard (per explicit user instruction, 2026-08-24):
   - **Old/historical cases** (roughly pre-1990s, or all named parties long deceased — e.g. `rs-130-rebellion-2454`, `boworadet-rebellion-2476`, `nualchawee-legend-2502`): full real names are fine. Historical distance itself is a privacy safeguard.
   - **Contemporary but settled cases** (concluded, final verdict reached, not actively developing in the news — e.g. `shayamala-2536`, `four-ministers-murder-2492`): name the victim and the accused as needed to tell the case accurately, but keep applying Level C deidentification to collateral living private individuals (family members, witnesses, complainants) per the pattern below — don't name people who aren't the case's own principal parties.
   - **Very recent cases** (roughly last 1-2 years, or still developing/appealing/in the news cycle) involving a private individual — not already a public official/public figure under the existing exception — as victim or accused: avoid direct identification even of the principal parties. Describe by role instead ("จำเลย", "ผู้เสียหาย", occupation/relationship) rather than by name, out of PDPA caution — the person's current life and reputation are still actively exposed in a way historical distance doesn't yet buffer.
   A living private person needing deidentification gets Level C treatment — initials only (e.g. "น.ส. ก.", "นาย ส."), matching the pattern in `janeera-2541.json`'s `deident` block. When unsure whether someone counts as a public figure, or unsure which recency band a case falls into, default to the more cautious (more deidentified) option.
5. **No duplicate `id`.** Run the "check for duplicates" step below before writing anything — the library already has ~82 cases; skim it so you don't re-cover a case that already exists under a different slug.
6. **Every article citation must be real** — don't guess a มาตรา number to sound authoritative. If the source only says "the court applied the civil code's inheritance provisions" without a number, write it that vague and flag it, don't invent a number.
8. **Release gradually, not in a batch, and only cases that have actually gone through this skill's review.** Per explicit user instruction (2026-08-23): don't flip a large group of cases from `visibility.public: false` to `true` in one pass, even when several are individually ready — publish a few at a time, spread over multiple days. Only flip `visibility.public: true` for a case that has genuinely been through this skill's research-and-write (or an equivalent fix/verify) process in the current or a prior session — never as a side effect of a bulk data-repair pass. `news-index.html`'s case library only shows what `golden-cases.json`'s manifest entries *and* the individual case file both mark public, so this is the actual publish gate for readers.
9. **Use the rich `read.sections` schema, never the flat one — and render-test before calling anything done.** `prototype/read-case.html` renders each section by branching on `s.key` (`overview` / `background` / `case_details` / `legal_issues` / `provisions` / `lessons` / `judicial` / ...) and expects `s.content` to be an **object** (`{paragraphs:[...]}`, `{timeline:[...], analysis:[...], links:[...]}`, `{issues:[...]}`, `{articles:[...]}`, `{items:[...]}`, `{verdict:{...}}` depending on the key) — see step 4's template below. A large chunk of the existing library was written with a *different*, incompatible flat schema (`{"id":"02","title":"...","content":"plain string"}`) that `read-case.html` silently fails to render: the heading shows, the body is empty. **Discovered 2026-08-23**: 39 currently-public case pages have this bug, including several flagged `VERIFIED_S` (e.g. `adultery-damages-landmark-2565`, `marriage-equality-landmark-2567`, `rice-pledging-landmark-2560`) — being marked verified/public says nothing about whether a file actually renders. Never trust a file's own `grade`/`s_verified`/`public` flags as proof its schema is correct; always confirm by opening `prototype/read-case.html?id={slug}` in a browser and checking the section bodies actually show text, not just headings. This is a known, large, separate cleanup job (see `<known-issue-flat-schema>` below) — don't try to silently fix it as a side effect of writing one new case; flag it to the user instead.
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
**Discovered 2026-08-23. The `visibility.public: true` half was fixed the same day** by a schema-conversion script (mechanical restructuring of existing content into the rich schema below, not new research) — the 40 files that were public + broken (the original 39 minus 3 removed as duplicates in the same day's cleanup pass, plus 4 previously-uninvestigated `list`-typed files that turned out broken the same way) now render real section bodies. Verified live via local server + browser text extraction on several, including edge cases (a stub with only `overview`, a file missing `meta.title` entirely, a Q/A-less `legal_issues` section). Two files (`aerial-incident-1999`, `bunpeng-hiblek-2462`) were also missing `meta.title` — added honest titles derived from their own existing content, not fabricated. `khdii-abolition-slavery-2448` and 5 similar historical stubs had only a generic `ฐานกฎหมาย` tag (no real มาตรา citation) — folded into the overview paragraph as a category note rather than faked into a fake law-accordion. Where a `ฐานกฎหมาย` bullet cited a current, lookupable code (ป.อ./ป.พ.พ./ป.วิ.อ./รัฐธรรมนูญ 2560), pulled the real article text from `codex-data.json` instead of leaving it blank; historical/repealed/external-act citations (กฎหมายลักษณะอาญา ร.ศ.127, old constitutions, PDVA, etc.) were correctly left as citation-only since they aren't in the codex and inventing their text would be fabrication.

**Still broken, not yet fixed (lower urgency — not `visibility.public`, so not live-visible to readers):** `9near-2566`, `chainmanee-2567`, `concept-water-2565`, `corfu-channel-2492`, `kamnan-nok-bok-pit-2567`, `kamnan-nok-pai-rot-2566`, `lagrand-2544`, `nayna-2533`, `nice-review-2562`, `one-tablet-2556`, `pong-5-sop-2540`, `preah-vihear-2505`, `rolls-royce-2566`, `sappaya-siristhaan-2566`, `sawan-khot-r8-2489`, `siuy-2501`, `songkram-yasadep-2563`, `sukhum-cheedcheun-2539`, `tuohao-civil-2566`, `tuohao-criminal-2566`, `wisanyan-6-sop-joe-danchang-2539`, `zipmex-2565` — same flat/`list`-typed schema bug, same fix approach would apply, just do a fresh `visibility.public`+schema audit before trusting this list (don't assume it's still accurate by the time you read it — files get added/removed/flipped public over time).

**`dr-supat-skeleton-2555`'s schema is now fixed but its citation problem is separate and still open**: `rank.judicial_case` is still just `"ประมวลกฎหมายอาญา"` (a bare code name, not a real ฎีกา number) — per the earlier note in this file, the real person has 3 separate real prosecutions and disentangling which one this citation refers to needs actual research, not a guess.

This skill still does **not** fix newly-discovered flat-schema files as a side effect of writing one new case — surface any you find to the user rather than silently mass-editing.
</known-issue-flat-schema>

<serial-offenders-multi-incident>
A real person sometimes has more than one prosecutable incident (e.g. a serial offender charged in separate cases across different years/courts). Don't try to cram all of it into one case's `read.sections` — the library is one-entry-per-incident. Instead:
- Write the incident actually being requested as its own case (own `id`, own real citation for *that* incident).
- In its `เบื้องหลัง`/`ลำดับเหตุการณ์` text, mention the other known incidents by name only as context (one sentence, no invented details) so a reader isn't confused why the same name shows up elsewhere.
- Note the other incidents in that case's `sources` or a short `internal_notes` field as candidate future entries — don't build them now unless asked.
This keeps the door open for neuralnetworklegalcode to later graph a person across multiple case-nodes ("nexus node" concept) without this skill having to model that graph itself — out of scope per the "light touch" nn-linking decision above. See `<neuralnetworklegalcode-nexus-integration>` below — the nn cross-link is no longer purely hypothetical, it shipped 2026-08-24.
</serial-offenders-multi-incident>

<reuse-across-case-types>
This skill is deliberately generic across `คดีอาญา` / `คดีแพ่ง` / `คดีรัฐธรรมนูญ` / historical / ICJ / policy cases — the schema, dual-mode registration, and validation steps are identical regardless of category. Only two things change per category:
- **Deident rules** (hard-rule #4) — living-private-person cases need it, historical/state/corporate-party cases don't.
- **What counts as the citation** — ฎีกาศาลฎีกา for ordinary court cases, คำวินิจฉัยศาลรัฐธรรมนูญที่ for con-court cases, I.C.J. Reports citation for ICJ cases, or the historical court's own record for pre-modern cases (see `phrayod-muangkwang-2436.json`'s `judicial_case` field for a worked historical example — no ฎีกา existed yet in ร.ศ.112, so it names the actual tribunal and sentence instead).
</reuse-across-case-types>

<neuralnetworklegalcode-nexus-integration>
**2026-08-24: the "future ประมวล nn cross-link" from hard-rule #3 shipped, in the sibling repo `neuralnetworklegalcode`.** Its case-nexus feature (`client/src/data/caseGraphs.ts`, `CaseIssuePanel.tsx`) now shows, per case and per legal issue, *why that nexus node exists* - a case-level `basedOn` note ("จากคดีจริง...") and a per-issue `reasoning` field (the real court's own reasoning on that specific issue, shown when the issue node is clicked). Two lessons from building it, worth carrying forward whenever either repo touches a case both projects share:

1. **Source nexus "why" content from this skill's own already-researched case files - never re-research fresh via NotebookLM/WebSearch for a case this skill has already covered.** Two independently-researched explanations of the same real ฎีกา is worse than reusing one verified source; it also risks the two projects drifting apart on facts. Before writing a `basedOn`/`reasoning` value in `caseGraphs.ts`, check `ls prototype/assets/cases/*.json` here first for a matching slug.
2. **Field mapping** (case-writer's rich schema -> neuralnetworklegalcode's `CaseGraphData`):
   - `CaseGraphData.basedOn` (one case-level line) <- `read.sections[key=overview].content.paragraphs[0]` or `meta.blurb_60`, plus `rank.judicial_case` for the citation/year.
   - `CaseIssue.reasoning` (per issue node) <- the matching entry in `read.sections[key=legal_issues].content.issues[]` (`.anchor` in the current template, `.text` in older files that predate the `question`/`anchor` split - `shayamala-2536.json` is one such older file) or `read.sections[key=provisions].content.articles[].anchor` when the reasoning is really about one specific มาตรา rather than the issue as a whole.
   - A case/issue with no real ruling behind it (built from an exam-sourced or otherwise hypothetical fact pattern) should leave `basedOn`/`reasoning` unset entirely - neuralnetworklegalcode's UI falls back to an explicit "สถานการณ์สมมติ...ไม่มีคำวินิจฉัยจริง" note rather than fabricating one. Never invent a `reasoning` value to fill the gap, same no-fabrication rule as hard-rule #1 here.

**Known discrepancy, not yet reconciled (flag if you touch either of these two cases again):** neuralnetworklegalcode's currently-live two cases (`serm-jenjira`, `syamol-forensic` in its `caseGraphs.ts`) source their `newsUrl` from this repo's **old, superseded** `news-case-khdii-serm-sakonrat-2541.html` / `news-case-khdii-syamol-forensic-2536.html` pages (the pre-`golden-cases.json` pipeline this skill's `<objective>` says to ignore) - written before this skill's rich-schema system existed. Both cases *do* now also exist in the current system, under different slugs: `serm-sakonrat-41` and `shayamala-2536`. Neither project has re-pointed `newsUrl` at `read-case.html?id=...` yet. Worth doing next time either case gets touched, but not urgent enough to fix as a drive-by - the old pages still render fine, they're just off the canonical path.
</neuralnetworklegalcode-nexus-integration>
