# Pass 2 independent verification - method (2026-10-05)

Scope: the 16 records that were `partially_verified` after the D1 seed (Pass 1). No discovery searching; the web was used only to re-open each record's own URL and to look up that record's own ISBN/title in an independent catalogue.

## Independence

- Pass 1 actor: `claude:d1-seed-2026-10-05` (the main session).
- Pass 2 actors: five separate Claude CLI processes (`claude -p`), one per batch, each started in a fresh context: `claude:cli-pass2-{A..E}-2026-10-05`. They were **not shown** the Pass 1 values, the register or the leads; they were told to extract from the primary artefact only (blind extraction), quote evidence with page/URL, write "not stated" rather than infer, never normalise conflicting years, and never assert relationships between works.
- Same model family, separate runs, no shared context => **independence B** (valid Pass 2; every Pass-2 record carries a same-family warning). Nothing in this pass is independence C, except the SRC-0001 self-check, which is explicitly C and does not count.
- Pass 1 and Pass 2 values were then compared claim by claim (`sources/verification_claims.csv`): `confirmed`, `rejected` (Pass 1 value contradicted), `unresolved`, `not_stated` (both passes record absence). Original Pass 1 text is never overwritten: corrections are appended to `notes` as `[Pass 2 date] ...` and recorded as claims.

## Batches

A catalogue records (SPU OPAC + Open Library/Google Books by ISBN); B the 1984 holdings list PDF; C four full-text PDFs (label extraction by regex + monotone filter, amendment-Act extraction); D the LED amendment PDF and the ICJ scan; E a book review (+ independent catalogue) and the ThaiLawOnline site (raw HTML, not a model summary).

## Decision rules

- `verified` only if the **primary artefact** was inspected by Pass 2, every non-unknown recorded claim is confirmed (or a Pass 1 error was corrected with evidence), no claim is `unresolved`/open/awaiting adjudication, the independence is A or B, and - for high-impact records (`full_code` coverage or `official` authority) - a Conductor review is recorded (not yet; so none of the four `full_code` PDFs/sites is promoted).
- Books/records not seen (catalogue records, a holdings list, a review citation) stay `partially_verified` at best: bibliographic existence can be confirmed, content and coverage cannot.
- A second source that merely mentions a work, or an ISBN-only record, does not lift a claim to `confirmed` beyond what it actually states (e.g. year disagreements stay `unresolved`).
- Conflicts between sources or inside a source are kept, tracked in `resolution_status` (`open`, `conductor_pending`, `resolved_by_evidence`), and never resolved by choosing the "likely" value. `verification_outcome = disputed` marks cross-source disagreements needing adjudication.
- No translation family is inferred from text similarity or from shared names/publishers; only an explicit statement in an artefact counts, and none was found.

**Status semantics.** `verified` = source identity and recorded claims verified; it does not mean complete coverage. SRC-0006 and SRC-0012 are `verified` with `coverage = partial` and say so in their notes.

## Known limits

- Catalogue pages were read through a page-fetch tool that summarises HTML; role labels (author/reviser/translator) of some creators may be paraphrased. Independent catalogue coverage is thin (Open Library, Google Books feeds).
- Section-label counts are regex extractions (about 85-95% confidence; the verifier says so per record); OCR text of the ICJ scan is noisy.
- Same-family verification (B) shares model biases with Pass 1; the Conductor may require a different tool or a human for high-impact records.
