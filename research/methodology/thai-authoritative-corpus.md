# Thai Authoritative Corpus vs Search Venues (v0.3-draft)

Two different things that must never be conflated:

| | **Search venues** | **Thai authoritative corpus** |
|---|---|---|
| purpose | where we look for *English translations* | the authoritative *Thai text* of each Code: reference baseline for the section grid, Thai versions, amendments and effective dates |
| files | `sources/search_venues.csv`, `protocol_deviations.csv`, `protocol_state.json` | `sources/thai_corpus_register.csv`, `sources/thai_corpus/` (raw), `sources/thai_corpus_state.json`, `sources/section_grid_reconciliation.csv` |
| versioning | protocol version + venue freeze | `corpus_version` per Code, e.g. `TCV-CCC-001` |
| freeze | `venues_frozen` | per-Code `frozen` in `thai_corpus_state.json` |

The two freezes are **independent**: freezing venues does not freeze or imply any Thai corpus, and acquiring/refreezing a Thai corpus never changes the venue list. The same website (e.g. the Council of State's law database, or the Royal Gazette) may appear in both roles; it is then recorded separately in each registry.

## Rules

1. **The Atlas section grid is NOT authoritative.** `corpus/section_grid.csv` is built from the Atlas `codex-data.json` and every row carries `grid_status = PROXY`. It is an operational working list only.
2. A Thai authoritative corpus is an artefact acquired from an authoritative Thai source (e.g. Council of State / Royal Gazette), stored read-only under `sources/thai_corpus/`, hashed (SHA-256) and registered in `thai_corpus_register.csv` with `last_amending_act_incorporated` and `as_of_date`. Statuses: `planned → acquired → frozen → superseded`. A change in the Thai law (new amendment) produces a **new** `corpus_version` (old one `superseded_by`), never an in-place edit.
3. **Reconciliation** (`sources/section_grid_reconciliation.csv`) compares the Atlas grid with a *frozen* corpus version, one row per (code, section, corpus version):
   `atlas_present (yes/no)`, `authoritative_present (yes/no/unknown)`, `status ∈ MATCH | MISSING_FROM_ATLAS | EXTRA_IN_ATLAS | RENAMED | REPEALED | INSERTED | UNCERTAIN`, `authoritative_source` (required when present), `notes`. Differences are recorded, never silently resolved.
4. `grid_status = RECONCILED` for a Code is permitted only when: its corpus is frozen; every grid section has a reconciliation row against that frozen version; no `UNCERTAIN` rows remain; and the grid has been **rebuilt from the Thai corpus** (`grid_source` no longer `atlas:*`). Relabelling PROXY rows as RECONCILED is rejected by the validator. `build_article_skeleton.py` only emits PROXY and refuses to run over a RECONCILED grid.
5. While PROXY, `atlas_present` must agree with the grid; once RECONCILED the grid must equal the authoritative corpus (`authoritative_present = yes`).
6. `codex-data.json` is never modified by this project, and the Atlas grid is never changed to match an assumed authoritative corpus.
7. `article_level.thai_version` should reference the `corpus_version` once a corpus is frozen for that Code; until then it stays `unknown`.

## Current state (2026-10-05)

No Thai authoritative corpus has been acquired for any Code (`thai_corpus_register.csv` empty; all four `frozen = false`). All four grids are `PROXY`; reconciliation file is empty.
