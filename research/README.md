# Lost in Translation — research infrastructure (Phase D0)

Reproducible research + data pipeline on the English translations of Thailand's four principal codes (CCC, Criminal, Civil Procedure, Criminal Procedure).
Two outputs: **(A)** empirical study of the translation landscape; **(B)** consolidated, provenance-audited English platform text. D0 builds infrastructure only: **no searches run, no translation done.**

## Layout

```
research/
  methodology/   thai-authoritative-corpus, search-protocol, inclusion-exclusion, source-schema, corpus-schema, scoring-rubric, schemas/master-dataset.schema.json
  sources/       thai_corpus_register/state + section_grid_reconciliation (Thai authoritative corpus, separate from venues), source_register, source_coverage, search_venues, protocol_deviations, search_log, exclusions, raw_manifest, protocol_state.json (+ raw/ immutable artefacts)
  corpus/        section_grid.csv (derived), article_level.csv (section-grain)
  analysis/      validate_dataset.py, build_article_skeleton.py, render_venue_review.py, tests/
  outputs/       generated reports only (never hand-edited)
```

## Rules (summary)

Thai text is authoritative. English ≠ official; government-published ≠ authoritative. "Not found" is only ever "not systematically identified under protocol vX". Every source and conflict is preserved; nothing silently overwritten or deleted. Atlas's own translations are never landscape evidence. Research data lives only here; the Atlas `codex-data.json` is read-only input (never copied). Commits only after Conductor review; nothing pushed.

## Validate

```
python research/analysis/validate_dataset.py
python -m unittest research/analysis/tests/test_validate_dataset.py
python research/analysis/build_article_skeleton.py [--check]   # section grid + NOT_ASSESSED skeleton; reads codex-data.json read-only
```

## Working hypotheses (NOT findings — to be verified via the protocol)

- H1 CCC: multiple English translations (historical official translation of Book V; later academic/commercial).
- H2 Criminal Code: multiple unofficial/academic translations.
- H3 Civil Procedure: government-published English amendments plus unofficial translations.
- H4 Criminal Procedure: multiple English materials; existence of a current consolidated official English Code uncertain.

## Papers (not drafted)

Paper 1: landscape, fragmentation, version divergence, status ambiguity, traceability. Paper 2: methodology + Thai Legal Atlas as proof-of-concept infrastructure.

## Status

**D1 seed inventory (2026-10-05, uncommitted):** 25 sources (16 `partially_verified` = existence confirmed from a document or catalogue record read by one pass; 9 `unverified` = lead seeds or unreadable records; none `verified`, Pass 2 pending), 17 leads (11 from the Conductor brief + 6 incidental), 40 coverage rows, 4 exclusions, 8 locally held raw PDFs (not committed; hashed in `sources/raw_manifest.csv`). Lead verification was targeted and is **not** protocol searching (`methodology/seed-inventory-log.md`). Derived views: `outputs/coverage_view.*`, `outputs/source_family_history.md`, `outputs/article_research_view.csv` (empty until article rows are IDENTIFIED). No translation gap is asserted anywhere.

Protocol v0.3-draft, **not frozen**. Venue list: 40 proposed rows URL-verified 2026-10-05 (see `outputs/venue_review.md`), 4 proposed for withdrawal, awaiting Conductor freeze. No Thai authoritative corpus acquired; all grids PROXY. No searches run. SRC-0001 stays unverified: no PDF is held and none may be fabricated, inferred or placeholdered. Registry holds one placeholder source (SRC-0001, the incomplete CCC PDF), `unverified`. Article table: 3,089 `NOT_ASSESSED` skeleton rows.
