# Search Protocol (v0.3-draft, NOT FROZEN)

Applies **identically** to all four Codes. No code may receive extra query templates, extra venues, or a different stopping rule. Any deviation is a protocol amendment (see §9) and must be logged.

## 1. Target Codes

| code key | Thai title | English working title |
|---|---|---|
| `CCC` | ประมวลกฎหมายแพ่งและพาณิชย์ | Civil and Commercial Code |
| `PENAL` | ประมวลกฎหมายอาญา | Criminal Code (Penal Code) |
| `CIVPRO` | ประมวลกฎหมายวิธีพิจารณาความแพ่ง | Civil Procedure Code |
| `CRIMPRO` | ประมวลกฎหมายวิธีพิจารณาความอาญา | Criminal Procedure Code |

English title variants (all searched for every code): "Code", "Penal Code"/"Criminal Code", "Civil and Commercial Code"/"Civil & Commercial Code", "Code of Civil Procedure"/"Civil Procedure Code", "Code of Criminal Procedure"/"Criminal Procedure Code", "Thai", "Thailand", "Siam", "B.E.", "translation", "English version", "unofficial translation".

## 2. Search categories (all mandatory, per code)

| id | category | example venues (to be enumerated and frozen before executing) |
|---|---|---|
| C1 | Thai government sources | Office of the Council of State, Ministry of Justice, Courts of Justice, Royal Gazette, Parliament, OAG |
| C2 | Official legal repositories | Council of State legal database, Court of Justice portals, Constitutional/Administrative Court sites |
| C3 | University / library catalogs | WorldCat, Thai university OPACs, TU/Chula/NIDA libraries, national library, major foreign law libraries |
| C4 | Academic literature | Google Scholar, SSRN, JSTOR, HeinOnline, ThaiJO, Scopus/Web of Science |
| C5 | Theses / dissertations | ProQuest, ThaiLIS/TDC, university repositories |
| C6 | Institutional repositories | university/NGO/IO repositories (e.g. UN, ILO, WIPO Lex, UNODC SHERLOC, ICJ) |
| C7 | International legal databases | WIPO Lex, FAOLEX, ECOLEX, ILO NATLEX, LexisNexis/Westlaw/vLex, CLDR-type compendia |
| C8 | Legal information websites | law-firm sites, legal portals, bar associations, chambers publications |
| C9 | Publisher / catalog records | commercial publishers, bookseller catalogs, ISBN registries |
| C10 | Web search | general web search engines, in English **and** Thai queries |

The concrete venue list per category is recorded in `sources/search_venues.csv` and is the same for all four Codes. It is **frozen before any systematic searching** (`protocol_state.json: venues_frozen = true`, every venue `date_checked` and `frozen`). The validator rejects any `search_log` row while the list is unfrozen. After freeze, an important venue discovered later is **never silently added**: it is recorded as a protocol deviation (`protocol_deviations.csv`, type `venue_added`, with reason and Conductor approval), carries its `deviation_id`, and is then searched for all four Codes. Venues are withdrawn (status `withdrawn`), never deleted.

Venue verification precedes freeze: each venue's URL is checked to resolve to the intended institution/platform, with evidence recorded in `search_venues.csv` (`verification_status`, `verification_evidence`, `verified_date`). Verification is resolution/identity only and involves no source searching. Blocks (bot challenges, certificate errors) are recorded, not bypassed.

The venue freeze is **independent** of the Thai authoritative corpus (see `thai-authoritative-corpus.md`).

## 3. Query templates

Every venue is queried with the same templates, substituting `{TH}` (Thai title), `{EN}` (each English title variant):

1. `"{EN}" English translation Thailand`
2. `"{EN}" "unofficial translation"`
3. `"{EN}" Thai "B.E." translation`
4. `{TH} ฉบับภาษาอังกฤษ`
5. `{TH} คำแปลภาษาอังกฤษ`
6. `{TH} แปลเป็นภาษาอังกฤษ`
7. `"{EN}" Thailand amendment English` (amendment-only materials)
8. Venue-native advanced search (title/subject fields: Thailand + code subject heading)

Limits: first 50 hits (or all if fewer) per venue-query; for web search categories first 5 result pages. Deviations recorded in `notes`.

## 4. Snowballing (applied equally)

For every included source: (a) read its bibliography/preface for other translations; (b) forward-cite via Scholar where available; (c) record any cited-but-unobtained translation as a source with `provenance_status = unverified`.

## 5. Recording rules

- Every executed search → one row in `sources/search_log.csv` (date, `venue_id`, exact query string, result count, outcome).
- `outcome` ∈ `hit | negative | inconclusive | not_accessible`.
- A **negative finding is meaningful** only if venue, query string, date and search scope are recorded. Unlogged searches do not exist for the study.
- Reporting language: "not systematically identified under protocol vX in venue set Y as of date Z". Never "does not exist".
- Paywalled/inaccessible venues → `not_accessible`, never `negative`.

## 6. Source registration

Each distinct publication gets one row in `sources/source_register.csv` (see `source-schema.md`). A publication covering several Codes is still one source (`code = MULTI`); coverage by Code/Book/section goes in `sources/source_coverage.csv`, never by duplicating sources. An identical reprint is the same source; a substantively revised translation is a new source linked by `source_family_id` with an incremented `source_version`. No minimum coverage is required for registration.

## 7. Verification (two-pass)

1. **Pass 1 = primary extraction** - the extractor locates the item and records `evidence_location` (URL + archive copy hash, or bibliographic record + shelf-mark / page) and the bibliographic/coverage fields.
2. **Pass 2 = independent verification** - a different actor re-checks authorship, publisher, year, version fields and coverage against the underlying document. The same Claude run is never independent verification; a different tool (e.g. Gemini CLI, or Claude CLI verifying another tool's extraction) or a human may serve. `provenance_status = verified` requires distinct, recorded Pass-1/Pass-2 actors and outcome `agreed`/`adjudicated`.
Independence is graded in `verification_independence`: **A** = different model/tool (or human/Conductor); **B** = same model/tool family, independent run (allowed, but always carries a validator warning); **C** = same run/self-check (a valid recorded value, but never counts as independent Pass 2: using it to reach `verified` or an `agreed` outcome is a validator error).
3. **Dispute = Conductor adjudication** - any disagreement sets `verification_outcome = disputed` and blocks `verified` until the Conductor adjudicates (recorded in `conductor_review`). Human/Conductor review is also required for high-impact records (`official` authority claims, `full_code` coverage).

NotebookLM answers alone never satisfy Pass 1 or 2; the underlying document must be opened.

## 8. Freeze gate

The venue list is frozen first (see section 2). The protocol and source landscape are **frozen** only when: (a) all frozen venues have been queried for all four codes with all templates, and `protocol_state.search_completed[code]` is set by Conductor sign-off per Code (only then may article rows become `NONE_IDENTIFIED`); (b) snowballing is exhausted (no new source from last full round); (c) every registered source is at least `partially_verified`; (d) the Conductor signs off. Large-scale original translation (Atlas) may not begin before freeze. Atlas translations are never evidence about the pre-existing landscape (they are registered, if at all, in a separate `atlas_output` namespace and excluded from all landscape analysis).

## 9. Amendments

Changes after first execution: bump version, record in the change log below, and re-run affected searches for **all four** codes.

### Change log
- v0.1-draft (2026-10-05): initial D0 draft; no searches executed.
- v0.3-draft (2026-10-05): venue verification fields + proposed verified list; verification_independence A/B/C; Thai authoritative corpus separated from venues; grid_status PROXY/RECONCILED. No searches executed.
- v0.2-draft (2026-10-05): Conductor review fixes - venue freeze + deviation log, search_log uses `venue_id`, Pass 1/Pass 2/dispute model, MULTI/version model, no coverage threshold. No searches executed.
