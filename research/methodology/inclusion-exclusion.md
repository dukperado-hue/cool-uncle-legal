# Inclusion / Exclusion Criteria (v0.2-draft)

## Inclusion — a candidate is registered as a source if ALL hold

1. It reproduces, in English, the text (or a stated portion, incl. amendments) of one of the four Codes, or of an Act amending one.
2. It is traceable to a bibliographic record or locatable artefact (URL, catalog entry, physical copy, file).
3. The Thai Code/amendment it renders is identifiable, even if only to a year/edition (unknown is allowed and recorded as such).

**No minimum coverage threshold.** A single-section, amendment-only or Book-specific translation is a valid source. Exclusion is only for substantive reasons (X1-X5).

Register **liberally**: when in doubt, include with `provenance_status = unverified` and exclude later with a logged reason.

## Exclusion (logged, never deleted)

Excluded candidates stay in `sources/exclusions.csv` with `exclusion_reason` and date. Valid reasons:

| code | reason |
|---|---|
| `X1` | Commentary/summary only; does not reproduce Code text |
| `X2` | Not about one of the four Codes (other statute) |
| `X3` | Exact duplicate of an already-registered source (record the link) |
| `X4` | Unverifiable artefact: cannot be located/opened and verification is impossible after documented effort (kept as citation-only record if cited elsewhere) |
| `X5` | Machine/Atlas-generated translation produced under this project |

## Explicit non-assumptions

- English ≠ official. Government publication ≠ authoritative English text.
- `official` requires explicit evidence of official/authorized status (`authority_evidence`); `government_published` never upgrades to `official` automatically.
- `authority_status` is assigned from **evidence** (statement of status in the document, issuing body, legal basis), not from where it was found.
- Thai text remains authoritative; English sources are never used to resolve Thai legal content.
- Conflicting information between sources about the same item (e.g., differing years) is recorded in `notes` with both values; neither is chosen silently.

## Temporal scope

All dates; no lower bound (historical translations, e.g. early-20th-century Book V translations, are in scope). Upper bound = search execution date, recorded per search.

## Language scope

English text only for inclusion. Thai/other-language metadata about English translations is used as evidence.
