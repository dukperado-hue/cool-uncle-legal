# Source Schema (v0.3-draft)

Machine-readable definition: `methodology/schemas/master-dataset.schema.json` (authoritative for enums, patterns, keys). Data files: CSV, UTF-8 **no BOM**, header row required, values are always read as strings.

| file | grain | key |
|---|---|---|
| `sources/source_register.csv` | one row per distinct English-translation **publication/version** | `source_id` |
| `sources/source_coverage.csv` | one row per (source × contiguous unit of a Code) — **the only place one-to-many Code coverage lives** | `coverage_id` |
| `sources/search_venues.csv` | one row per search venue (frozen list) | `venue_id` |
| `sources/protocol_deviations.csv` | one row per post-freeze protocol deviation | `deviation_id` |
| `sources/search_log.csv` | one row per executed search | `search_id` |
| `sources/exclusions.csv` | one row per excluded candidate | `exclusion_id` |
| `sources/raw/` + `sources/raw_manifest.csv` | immutable raw artefacts with SHA-256 | `filename` |
| `sources/protocol_state.json` | gate flags (venues frozen, per-code search completed) | — |
| `sources/thai_corpus_register.csv`, `thai_corpus_state.json`, `section_grid_reconciliation.csv` | Thai authoritative corpus (separate from venues; see `thai-authoritative-corpus.md`) | `thai_corpus_id` |

## source_register.csv

| field | req | notes |
|---|---|---|
| `source_id` | yes | `SRC-0001`; never reused/renumbered |
| `source_family_id` | no | `FAM-0001`; groups versions of the same translation work |
| `source_version` | yes | `v1`, `v2`…; (family, version) unique |
| `code` | yes | `CCC`, `PENAL`, `CIVPRO`, `CRIMPRO`, or `MULTI` |
| `title`, `translator`, `publisher` | yes | as printed; `unknown` allowed |
| `publication_year` | yes | 4-digit year or `unknown` |
| `publication_date` | no | `YYYY`, `YYYY-MM` or `YYYY-MM-DD` |
| `edition_statement` | no | edition as printed (e.g. "2nd ed.") |
| `source_type` | yes | enum |
| `source_url_or_bibliographic_reference` | yes | |
| `authority_status` | yes | `official | government_published | academic | commercial | unofficial | unknown` |
| `authority_evidence` | if `official` | explicit evidence of official/authorized status (quote + location) |
| `provenance_status` | yes | `verified | partially_verified | unverified` |
| `machine_readable` | yes | `yes | no | partial | unknown` |
| `coverage` | yes | summary: `full_code | partial | amendment_only | section_specific | unknown` (detail in coverage table) |
| `thai_version_reference` | yes | Thai text/edition the translation renders, or `unknown` |
| `last_amending_act` | yes | latest amending Act reflected, or `unknown` |
| `effective_date` | yes | effective date of the Thai text rendered (`YYYY[-MM[-DD]]` or `unknown`) |
| `amendment_reference` | yes | amending Acts reflected / `unknown` / `none_stated` |
| `notes` | no | conflicts, caveats |
| `evidence_location` | yes | proof location; non-empty required if provenance ≠ `unverified` |
| `date_accessed`, `raw_file_sha256`, `registered_by` | no | |
| `pass1_extractor`, `pass2_verifier` | verified | actor ids `tool:run` (e.g. `claude:2026-10-06a`, `gemini:…`, `human:name`, `conductor`) |
| `verification_independence` | if Pass 2 set | `A` independent model/tool (or human/conductor); `B` same model/tool family, independent run; `C` same run / self-check. Must equal the value derived from the actor ids |
| `verification_outcome` | yes | `pending | agreed | disputed | adjudicated` |
| `conductor_review` | adjudicated / high-impact | name + date |

## Rules

1. **One publication = one row.** A publication spanning several Codes (`code = MULTI`) is still ONE `source_id`; each Code/unit goes in `source_coverage.csv` (`MULTI` rows need ≥2 distinct Codes once coverage is entered; single-Code sources may not carry other-Code coverage rows). Never duplicate a source to represent multi-section/multi-Code coverage.
2. **Versioning.** An identical reprint is the **same** source (note it in `notes`). A substantively revised translation (changed text, new Thai version reflected) is a **new** `source_id`; link with the same `source_family_id` and increment `source_version`. The four version dimensions are kept apart: `thai_version_reference` (what Thai text), `last_amending_act`, edition/`publication_date` (when/what edition published), `effective_date` (effective date of the Thai text rendered).
3. **Authority.** `government_published` never implies `official`. `official` requires `authority_evidence` (explicit statement of official/authorized status with location) and cannot be `unverified`.
4. **Verification.** Pass 1 = primary extraction; Pass 2 = independent verification; dispute = Conductor adjudication. `verified` requires independence **A or B** (**C (same-run/self-check) is a valid, storable value but can never count as independent Pass 2: a record with C that is `verified` or has outcome `agreed` is an ERROR; a C self-check recorded as `pending`/`disputed`/`adjudicated` and not `verified` is fine**; **B always raises a validator WARNING** that it is same-family verification, not an error), `verification_outcome` ∈ `agreed|adjudicated`, and `conductor_review` for high-impact records (`official` authority or `full_code` coverage). A `disputed` record can never be `verified`.
5. Nothing is overwritten silently: corrections append to `notes` (`[date old→new: reason]`) and live in git history.
6. Absence of coverage rows means *not yet determined*, not *no coverage*. **No minimum coverage threshold**: a single-section, amendment-only or Book-specific translation is a valid source.

## source_coverage.csv

`coverage_id (COV-0001), source_id, code, unit_type, unit_from, unit_to, coverage_status, thai_version_reference, verification, evidence_location, pass1_extractor, pass2_verifier, verification_outcome, conductor_review, notes`

- `unit_type` ∈ `whole_code | book | title | chapter | section_range | single_section`.
- For `single_section`/`section_range`, `unit_from`/`unit_to` must be valid **string** section labels (`1`, `1/1`, `4 ทวิ`, `172 ตรี/1`; `01` and `1.5` are rejected). Never integers.
- `verification` uses the provenance vocabulary and the same Pass rules.

## search_venues.csv

`venue_id (VEN-001), category (C1–C10), venue_class, institution, platform, url, access_method, scope, date_checked, verification_status, verification_evidence, verified_date, proposed_disposition, venue_status (proposed|frozen|withdrawn), frozen_in_protocol_version, deviation_id, notes`

- `venue_class`: `authoritative_government | academic_library | international_database | commercial_legal | general_discovery`.
- `verification_status` (URL resolves to the intended institution/platform; *never* implies any source was searched): `verified`, `verified_redirected` (resolves after a recorded URL update), `identity_unconfirmed` (host reached but blocked, e.g. bot challenge — never bypassed), `tls_error` (invalid certificate chain — never bypassed), `unreachable`, `not_verified`. `verification_evidence` is mandatory unless `not_verified`; `verified_date` only for `verified*`.
- `proposed_disposition`: `include | include_conditional | drop | merge`. `drop`/`merge` require `venue_status = withdrawn` and a reason in `notes`. A venue that is `not_verified` or `unreachable` cannot be frozen.

The list is **frozen before any systematic search**. While `protocol_state.venues_frozen = false`, the validator rejects any `search_log` row. After freeze, a new venue may be added only through a `protocol_deviations` row (type `venue_added`) and carries that `deviation_id`; venues are never silently added, edited into the frozen set, or deleted (use `withdrawn`).

## search_log.csv

`search_id, date, code, category, venue_id, query, language, result_count, outcome (hit|negative|inconclusive|not_accessible), source_ids, performer, deviation_id, notes`
