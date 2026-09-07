# Promotion gate — candidate → public case

**Phase 4D-1: promotion is MANUAL ONLY. No script in this repository
performs any step below automatically. The validator cannot promote.**

A candidate becomes a public case only after a human has walked it through
every stage and then deliberately copied and published it.

## Lifecycle (candidate `status` field)

```
candidate
   ↓   SOURCE VERIFIED
source_verified
   ↓   CITATION VERIFIED
citation_verified
   ↓   MAPPING VERIFIED
mapping_verified
   ↓   CONTENT REVIEWED
content_reviewed
   ↓   PROMOTION  (manual copy + publish)
promoted        (promoted_case_id names the public case)
```

The validator enforces that `status` only moves **one forward step at a
time**, that the `reviewers[]` log matches, and that each stage's
prerequisites exist.

## Stage checklist (single researcher can operate this)

| Stage | What a human confirms | Recorded as |
|---|---|---|
| **SOURCE VERIFIED** | The `source.quote` / `source.ref` is real and actually says what the candidate claims. `factual_summary` and `legal_issue` are written from the source. | `reviewers[]` entry `→ source_verified` |
| **CITATION VERIFIED** | The ฎีกา / คำวินิจฉัย / ICJ number is real, confirmed against a judgment **or ≥ 2 reputable independent sources**. `claimed_citation.case_number` filled. (This is the existing `rank.s_verified` bar from the `case-writer` skill.) | `reviewers[]` entry `→ citation_verified` |
| **MAPPING VERIFIED** | Every `cited_provisions[]` entry is real. Every `evidence: "agent_inferred"` entry is **confirmed or removed** by the human. `candidate_structural_path` is present and was **derived** from a verified provision via `AtlasCore.getBreadcrumb` / `describePath` — never hand-typed. | `reviewers[]` entry `→ mapping_verified`, with `action: "cleared_agent_inferred"` if any inferred provision existed |
| **CONTENT REVIEWED** | Deidentification decision made (time-graduated, per the `case-writer` skill). Paragraphs ≤ 350 chars. No blank `ฐานกฎหมาย` explanations. Rich schema. **Rendered in a browser** and section bodies actually show text. | `reviewers[]` entry `→ content_reviewed` |
| **PROMOTION** | The researcher decides *new file* vs *merge into an existing case* (see `possible_duplicate_of`). Then: | see below |

## The promotion act (manual, by a human)

1. **Duplicate check.** If `possible_duplicate_of` matches an existing
   `prototype/assets/cases/<id>.json`, **merge**: append this candidate's
   `source` into that case's `sources[]` and note it in
   `meta.internal_notes`. Do **not** create a second public file. Stop here
   — the canonical case already exists.

2. **New case.** Otherwise, hand-author (or adapt via the `case-writer`
   skill) `prototype/assets/cases/<id>.json` in the **public** case schema
   (`read.sections` rich form), using the candidate as the research packet.
   Set `visibility.public: false` initially.

3. **Register** one entry in `golden-cases.json`.

4. **Validate + render-test** the new public file
   (`python -c "import json; json.load(open(...))"` + open
   `prototype/read-case.html?id=<id>` in a browser).

5. **Publish, gradually.** Flip `visibility.public: true` on both the file
   and the `golden-cases.json` entry — a few cases at a time, spread over
   days (the `case-writer` skill's gradual-release rule).

6. **Rebuild the public index**, manually and deliberately:
   `python build-article-case-index.py`. Commit its output only when you
   intend the public case coverage to change.

7. **Record** on the candidate: `status: "promoted"`,
   `promoted_case_id: "<id>"`, and a final `reviewers[]` entry `→ promoted`.

## Hard stops

- A candidate with `status` below `content_reviewed` is **not eligible**
  for step 2.
- A candidate with any un-cleared `evidence: "agent_inferred"` provision is
  **not eligible** for step 2 (`mapping_verified` cannot be reached).
- No tool flips `visibility.public`. A human does, in step 5.
- No tool rebuilds `article-case-index.json` as a side effect. Step 6 is
  run on purpose.
