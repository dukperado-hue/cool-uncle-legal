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
| `source_version` | yes | `v1`, `v2`…; (family, version) unique. A version number is assigned only when evidence establishes the version; unrelated or unproven-related sources are each `v1` with no family |
| `origin` | yes | `prior_lead` (from a previously identified lead; requires `lead_ids`), `project_holding` (already held by the project, e.g. SRC-0001), `newly_found` (surfaced during verification) |
| `lead_ids` | no | `;`-separated `LD-nnn` (FK `leads.lead_id`); must be reciprocal with `leads.resolved_source_ids` |
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
| `amendment_coverage` | no | which amendments are/are not reflected (e.g. "through Act No. 17 B.E. 2547 (highest cited); later Acts not reflected") |
| `version_notes` | no | version caveats: which date is file metadata vs publication date vs Thai effective date |
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
**Authority coding order** (first match wins; every coding needs a basis in `notes`/`evidence_location`): `official` (only with `authority_evidence`) > `government_published` (published/hosted/commissioned by a government body, official status not evidenced) > `academic` (university/research-institution publisher) > `commercial` (for-profit firm or site publishing it as a product/service) > `unofficial` (self-described reference-only text with no identifiable institutional publisher) > `unknown`. A trade-book publisher whose type is not evidenced stays `unknown` (note "likely trade publisher; to confirm"). An unofficial *disclaimer* is recorded in `notes`; it does not by itself change a `commercial` coding.

**Dates are never conflated:** `publication_year`/`publication_date` (when the English text was published), `effective_date` (effective date of the Thai text rendered), `thai_version_reference` + `last_amending_act` (which Thai law is rendered), `date_accessed` (our access), and file metadata (PDF creation dates, capture dates), which is recorded in `version_notes`/`notes` and is **not** a publication date. A translation published in year Y does not imply the Thai law as amended in year Y.

**Source conflicts** are preserved verbatim in `notes` (e.g. "B.E. 2510 (1977)") and the contested field is set to `unknown`, never silently normalised.

**What `provenance_status` means.** It describes the *source record*: that the source's identity and the claims recorded about it were checked. `verified` is **not** a statement about completeness: how much of a Code a source covers is carried separately by `coverage` and the `source_coverage` rows (each with its own `verification`). A source can be `verified` with `coverage = partial` (e.g. SRC-0006, SRC-0012); a `verified` status must never be read as "full-Code coverage verified". Records whose coverage is `full_code` additionally need a Conductor review before `verified`.

5. Nothing is overwritten silently: corrections append to `notes` (`[date old→new: reason]`) and live in git history.
6. Absence of coverage rows means *not yet determined*, not *no coverage*. **No minimum coverage threshold**: a single-section, amendment-only or Book-specific translation is a valid source.

## source_coverage.csv

Mapping of the research-view names: `book`, `chapter` = human-facing context columns; `section_start`/`section_end` = `unit_from`/`unit_to`; `coverage_notes` = `notes`.

`coverage_id (COV-0001), source_id, code, book, chapter, unit_type, unit_from, unit_to, coverage_status, thai_version_reference, verification, evidence_location, pass1_extractor, pass2_verifier, verification_outcome, conductor_review, notes`

- `unit_type` ∈ `whole_code | book | title | chapter | section_range | single_section`.
- For `single_section`/`section_range`, `unit_from`/`unit_to` must be valid **string** section labels (`1`, `1/1`, `4 ทวิ`, `172 ตรี/1`; `01` and `1.5` are rejected). Never integers.
- `verification` uses the provenance vocabulary and the same Pass rules.

## verification_claims.csv

`claim_id (VC-0001), source_id, field, pass1_value, pass2_value, result (confirmed|rejected|unresolved|not_stated), pass1_extractor, pass2_verifier, verification_independence, verified_date, evidence, resolution_status (none|open|resolved_by_evidence|conductor_pending), notes`

One row per checked claim, keeping Pass 1 and Pass 2 values and actors separately (`methodology/pass2-verification.md`). Rules: `rejected`/`unresolved` need a `resolution_status` other than `none` (conflicts are kept and tracked); `rejected` needs notes; independence must equal the value derived from the actor ids; a source may be `verified` only if it has claims and none is unresolved/open/awaiting adjudication (a `rejected` claim corrected with evidence is `resolved_by_evidence`); a source with a `conductor_pending` claim cannot have outcome `agreed`.

## leads.csv

`lead_id (LD-nnn), code, origin (conductor_brief|incidental), lead_text (verbatim), lead_received, resolution (confirmed|partially_confirmed|corrected|unresolved|noted_not_examined|rejected), resolved_source_ids, resolution_notes, evidence, resolved_date`

Previously identified leads are preserved verbatim and never erased. `resolved_source_ids` lists the `source_register` rows created from / matched to the lead (they may themselves be unverified seeds). `confirmed|partially_confirmed|corrected` need resolved sources; `rejected` needs positive evidence - failing to find a lead is `unresolved`, never `rejected`. Leads are claims/pointers, not sources, and never evidence of a translation gap.

## search_venues.csv

`venue_id (VEN-001), category (C1–C10), venue_class, institution, platform, url, access_method, scope, date_checked, verification_status, verification_evidence, verified_date, proposed_disposition, venue_status (proposed|frozen|withdrawn), frozen_in_protocol_version, deviation_id, notes`

- `venue_class`: `authoritative_government | academic_library | international_database | commercial_legal | general_discovery`.
- `verification_status` (URL resolves to the intended institution/platform; *never* implies any source was searched): `verified`, `verified_redirected` (resolves after a recorded URL update), `identity_unconfirmed` (host reached but blocked, e.g. bot challenge — never bypassed), `tls_error` (invalid certificate chain — never bypassed), `unreachable`, `not_verified`. `verification_evidence` is mandatory unless `not_verified`; `verified_date` only for `verified*`.
- `proposed_disposition`: `include | include_conditional | drop | merge`. `drop`/`merge` require `venue_status = withdrawn` and a reason in `notes`. A venue that is `not_verified` or `unreachable` cannot be frozen.

The list is **frozen before any systematic search**. While `protocol_state.venues_frozen = false`, the validator rejects any `search_log` row. After freeze, a new venue may be added only through a `protocol_deviations` row (type `venue_added`) and carries that `deviation_id`; venues are never silently added, edited into the frozen set, or deleted (use `withdrawn`).

## search_log.csv

`search_id, date, code, category, venue_id, query, language, result_count, outcome (hit|negative|inconclusive|not_accessible), source_ids, performer, deviation_id, notes`
