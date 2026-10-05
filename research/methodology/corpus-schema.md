# Corpus Schema (v0.3-draft) — section grid and article-level table

Both files are UTF-8, no BOM. They are **derived**: every value is reproducible from `sources/` tables plus the section grid.

## 1. `corpus/section_grid.csv` (fully derived, deterministic)

Built by `analysis/build_article_skeleton.py` from the Atlas `codex-data.json`, **read-only**. Only labels, storage order and the cancelled flag are extracted; no Atlas text, notes or metadata are copied. Same input → byte-identical output (input SHA-256 recorded per row; `--check` mode detects drift).

`code, section, statutory_order, atlas_order, provision_status, grid_status, grid_source, grid_source_key, grid_source_sha256`

- `grid_status`: **`PROXY`** (built from Atlas data; current state of all four Codes) or **`RECONCILED`** (only after comparison with a frozen Thai authoritative corpus; see `thai-authoritative-corpus.md` and `sources/section_grid_reconciliation.csv`). The Atlas grid is never described as authoritative; the builder only emits PROXY.

- `section`: **string** label — `1`, `1/1`, `193/10`, `4 ทวิ`, `172 ทวิ/1`. Never coerced to integers; sorting uses a derived `statutory_order` (numeric main, Thai multiplier rank ทวิ<ตรี<จัตวา<เบญจ<ฉ<สัตต<อัฎฐ, then `/n`). An unknown suffix makes the build fail rather than guess.
- `atlas_order`: Atlas storage order (informational; not statutory order).
- `provision_status`: `in_force | repealed | unknown`. Repealed provisions are retained, never deleted.
- **Caveat:** the Atlas grid is a PROXY of the Thai section index, not an authoritative one. Reconciliation against a frozen Thai authoritative corpus records differences (statuses `MATCH | MISSING_FROM_ATLAS | EXTRA_IN_ATLAS | RENAMED | REPEALED | INSERTED | UNCERTAIN`); it never silently alters the Atlas grid or `codex-data.json`.

## 2. `corpus/article_level.csv`

Grain: one row per **(code, section, thai_version, english_source_id, source_version)**. A section covered by three English sources → three `IDENTIFIED` rows.

| field | notes |
|---|---|
| `code`, `section` | `section` must exist in `section_grid` for that code |
| `thai_version` | Thai text reference; skeleton rows carry `unknown` |
| `thai_effective_date` | ISO date or empty |
| `search_status` | **`NOT_ASSESSED | NONE_IDENTIFIED | IDENTIFIED`** |
| `english_source_id` | FK to `source_register`; **empty** unless `IDENTIFIED` (the literal `NONE` is not an identifier) |
| `source_version` | must equal the register's `source_version` of that source |
| `english_text_available` | `yes | no | unknown` |
| `coverage_status` | `full_code | partial | amendment_only | section_specific | unknown` |
| `translation_status` | `translated | not_translated_in_source | unknown` |
| `authority_status` | from source; section-level override only with evidence in `notes` |
| `currency_status` | `current_to_thai_version | pre_amendment | superseded | unknown` |
| `traceability_status` | `traceable_to_page | traceable_to_source | not_traceable | unknown` |
| `notes` | |

### `search_status` semantics

| value | meaning | field rules (validator-enforced) |
|---|---|---|
| `NOT_ASSESSED` | the systematic search has not yet been run/completed for this section. **Default for every skeleton row.** | `english_source_id`, `source_version`, and all source-specific statuses empty; `english_text_available` empty |
| `NONE_IDENTIFIED` | the defined systematic search was **completed** for this Code and no identifiable translation source was found. Not "does not exist". | source fields empty; `english_text_available = no`; only allowed when `protocol_state.json` has `search_completed[code] = true` (Conductor sign-off) |
| `IDENTIFIED` | ≥1 identified source covers the section | `english_source_id`, `source_version`, `english_text_available` and all five status fields required |

`NONE_IDENTIFIED` therefore can never be set merely because a search has not happened; and "no row yet" ≠ "no translation".

## 3. Generation rules (no second source of truth)

1. `build_article_skeleton.py` only **adds** `NOT_ASSESSED` rows for sections that have no row; it never modifies or deletes an existing row.
2. `IDENTIFIED` rows are produced from `source_coverage` by later, reproducible scripts (D2+), or manually with `notes` prefixed `manual:`.
3. English text, if captured later, lives in `corpus/text/<source_id>/…` as hash-linked derivatives of `sources/raw/`; never in these CSVs.
4. Atlas's own translation never populates this table.
5. Excel/Sheets must not be used to save these CSVs (auto-typing destroys string section ids like `1/1`); the validator rejects invalid section labels.
