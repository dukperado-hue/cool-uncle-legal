# Seed inventory - lead-verification log (2026-10-05)

**Status: NOT systematic protocol searching.** The search venues are not frozen, so none of the activity below is recorded in `sources/search_log.csv` (the validator forbids it) and **none of it counts as a negative finding**. It was targeted verification of the previously identified leads (Conductor brief 2026-10-05), plus follow-up on items that surfaced incidentally. Results live in `sources/leads.csv`, `sources/source_register.csv`, `sources/source_coverage.csv`, `sources/exclusions.csv`.

Tools: web search (standard unless noted), page fetch, Chrome (one HathiTrust attempt), local PDF reading (PyMuPDF). No logins, no paywall or bot-challenge bypass, no purchases.

## Targeted searches (exact intent; one per lead unless noted)

| lead | query (abbrev.) | result |
|---|---|---|
| LD-001 | Yale Law Library Siam CCC Book V English translation (standard + extended) | no Yale record found; HathiTrust record 007324494 surfaced |
| LD-003 | Pinai Nanakorn English Translation CCC Book I Book II Winyuchon 2021; Thai-script variant | nothing |
| LD-005 | Netayasupha Pisitpit Watcharavutthichai Penal Code translation 2008 | 2024 review confirms 3rd ed 2013; Nottingham CJAD 2008-named PDF surfaced |
| LD-006 | KLRI Thailand Penal Code English | nothing about Thai law |
| LD-008 | OAG English CPC Amendment No. 29 B.E. 2558 (standard); "Civil Procedure Code Amendment Act (No. 29)" (extended); OAG site query | LED PDF for Act No. 30 B.E. 2560 surfaced; no OAG item |
| LD-011 | CrPC Amendment No. 30 B.E. 2558 OAG (standard + extended) | nothing |
| LD-007/009 | ThaiLawOnline Penal Code disclaimer | site pages + library page read |
| LD-004 | Yongyut Wiriyayoothangkool Penal Code NHRC (English + Thai) | catalogue records naming him as CCC translator |
| LD-002 | NHRC library CCC Books 1-6 with English and glossary (Thai) | university-library records (SPU) for bilingual CCCs |
| LD-010 | Leeds research no official English translation CrPC | not found |

## Pages fetched / read

IALS node 686344; Nottingham CJAD PDF; Thai Legal Studies 2024 review; CUIR record (redirected, not followed); thailawonline.com (official-translation article, library page, Penal s.2, CPC s.1, CrPC s.13); HathiTrust record (HTTP 403; Chrome returned no text); ICJ page + PDF; Berkeley lawcat record (HTTP 403); NUS Malaya Law Review 1984 PDF; SPU library catalogue records bib/71017, 211663, 76005, 117613, 141659, 134439; LED PDF eng-civil-302517; antislaverylaw.ac.uk Penal Code PDF; FAOLEX PDFs tha200357, tha100210, tha208355.

## Local analysis performed on retrieved PDFs (reproducible from the raw copies)

Amending Acts cited in annotations were extracted by regular expression (counts approximate; OCR noise for the ICJ scan); section-label ranges and sampled-section text similarity (difflib) were computed between the Nottingham, ThaiLaws.com and samuiforsale texts. These are Pass-1 extractions only; Pass 2 (independent verification) is pending for every record.

## Raw evidence handling

Retrieved third-party PDFs are stored under `sources/raw/` with SHA-256 in `sources/raw_manifest.csv`. They are **not committed** (`research/.gitignore`): they are third-party works and the repository is published. The manifest pins them; the validator warns (does not fail) if a file is absent locally.

## Known limits

- Search-engine summaries are used only as pointers; no record rests on one.
- Library catalogue records (SPU) and a 1984 holdings list establish bibliographic existence only; no book was seen.
- Living web sources (ThaiLawOnline) change; no snapshot was stored.
