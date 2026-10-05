# Scoring Rubric — raw LTGI variables (v0.2-draft)

**No weights are assigned at D0.** This document defines how raw variables are *measured*. Any composite index ("LTGI") is constructed later, with several weighting specifications and a sensitivity analysis, over the frozen dataset.

## Unit of analysis

Per Code × per Thai-version snapshot, computed from `corpus/article_level.csv` (section grain) and `sources/*`. Variables are computed by scripts in `analysis/` from the data only (reproducible).

## Raw variables (each in [0,1] unless noted, or a count)

| id | variable | operational definition |
|---|---|---|
| V1 | `coverage_any` | share of in-force sections with ≥1 source row where `english_text_available = yes` |
| V2 | `coverage_single_full` | share of sections covered by one source that is `full_code` |
| V3 | `coverage_unknown` | share of sections with `coverage_status = unknown` (measurement-uncertainty variable, reported alongside, not hidden) |
| V4 | `source_multiplicity` | mean (and distribution) of distinct sources per section (fragmentation) |
| V5 | `temporal_gap` | for each section, years between `thai_effective_date` and the Thai version the best-available source reflects; undefined if unknown |
| V6 | `currency_share` | share of covered sections with `currency_status = current_to_thai_version` |
| V7 | `authority_share_by_class` | distribution over authority_status classes among covered sections |
| V8 | `traceability_share` | share of covered sections with `traceable_to_page` / `traceable_to_source` |
| V9 | `version_divergence` | count of sections where ≥2 sources reflect different Thai versions (version fragmentation) |
| V10 | `machine_readable_share` | share of covered sections whose source is machine-readable |
| V11 | `provenance_share` | share of sources `verified` (data-quality, not landscape) |

Candidates for additional justified variables (each needs written justification before inclusion): textual divergence between parallel translations of the same section (term-level), terminology-consistency across Codes, translator-attribution completeness.

## Rules

0. **Search status gates every variable.** Only sections of Codes whose search is complete enter denominators as `IDENTIFIED`/`NONE_IDENTIFIED`; `NOT_ASSESSED` sections are reported separately and never counted as gaps.
1. **Missing is not zero.** Unknown values are excluded from numerators *and* reported via V3; sensitivity analyses treat them both ways (all-unknown-as-absent / as-present / excluded).
2. Report each variable separately before any aggregation.
3. Weighting: later stage evaluates at minimum (a) equal weights, (b) expert-elicited weights, (c) data-driven (PCA/entropy) weights, and rank-stability across them. Variable directions (higher = better/worse) are fixed at that stage and pre-registered.
4. Variables may be dropped only with logged reason; inputs frozen with dataset version hash.
5. Atlas's own translation is excluded from all variables.
