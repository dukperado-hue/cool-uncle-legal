# Proposed venue list for Conductor review

Derived from `sources/search_venues.csv`. Venues are **NOT frozen**. Verification = URL resolution/identity only; no source searching.

## Summary

| disposition | n |
|---|---|
| drop | 2 |
| include | 24 |
| include_conditional | 12 |
| merge | 2 |

| category | active venues |
|---|---|
| C1 | 5 |
| C2 | 1 |
| C3 | 6 |
| C4 | 5 |
| C5 | 3 |
| C6 | 2 |
| C7 | 7 |
| C8 | 3 |
| C9 | 2 |
| C10 | 2 |

## Venues

| id | cat | class | institution / platform | url | verification | disposition | note |
|---|---|---|---|---|---|---|---|
| VEN-001 | C1 | authoritative_government | Office of the Council of State / Official website | https://www.krisdika.go.th | tls_error | merge | Same host as VEN-007; merged into VEN-007 (one venue per host/role; do not inflate). |
| VEN-002 | C1 | authoritative_government | Ministry of Justice / Official website | https://www.moj.go.th | verified | include | Ministry of Justice homepage title matches institution. |
| VEN-003 | C1 | authoritative_government | Courts of Justice (Office of the Judiciary) / Official website | https://www.coj.go.th | verified | include | Courts of Justice homepage title matches institution. |
| VEN-004 | C1 | authoritative_government | Royal Gazette (Secretariat of the Cabinet) / Royal Gazette site | https://ratchakitcha.soc.go.th | tls_error | include_conditional | Royal Gazette host fails TLS validation in a normal browser. Not bypassed. Conductor decision needed: human-assisted access or accept a documented alternative copy of gazette notices. |
| VEN-005 | C1 | authoritative_government | Parliament of Thailand / Official website | https://www.parliament.go.th | verified | include | Parliament homepage title matches institution. |
| VEN-006 | C1 | authoritative_government | Office of the Attorney General / Official website | https://www.ago.go.th | verified | include | OAG homepage title matches institution. |
| VEN-007 | C2 | authoritative_government | Office of the Council of State (Krisdika) / Law database (Krisdika) | https://www.krisdika.go.th | tls_error | include_conditional | Principal official Thai law repository, but host fails TLS validation and root returns 404 to scripted client. Correct entry URL and access route must be established by a human before freeze. Also a candidate Thai authoritative corpus source (separate role; see thai-authoritative-corpus.md). |
| VEN-008 | C2 | authoritative_government | Supreme Court of Thailand / Deka judgments database | https://deka.supremecourt.or.th | unreachable | drop | Supreme Court Deka database: scripted GET timed out and TLS validation failed; content is Thai-language judgments, low relevance to English translations of the Codes. Proposed for removal. |
| VEN-009 | C3 | academic_library | OCLC / WorldCat | https://search.worldcat.org/ | verified_redirected | include | worldcat.org redirects to search.worldcat.org; URL updated. |
| VEN-010 | C3 | academic_library | Library of Congress / LC Catalog | https://catalog.loc.gov | identity_unconfirmed | include_conditional | Catalog host is behind a bot challenge; needs human-assisted or API access. Institution confirmed via www.loc.gov only. |
| VEN-011 | C3 | academic_library | Jisc / Library Hub Discover | https://discover.libraryhub.jisc.ac.uk | identity_unconfirmed | include_conditional | Behind bot challenge; needs human-assisted access. |
| VEN-012 | C3 | academic_library | National Library of Thailand / Catalog | https://www.nlt.go.th | tls_error | include_conditional | National Library of Thailand host has an incomplete certificate chain; identity probable from page title but TLS not valid. |
| VEN-013 | C3 | academic_library | Thammasat University Library / University OPAC | https://library.tu.ac.th | verified | include | Library site (not a specific OPAC) title 'THAMMASAT UNIVERSITY LIBRARY'; OPAC deep link to be fixed at freeze. |
| VEN-014 | C3 | academic_library | Chulalongkorn University Library / University OPAC | https://www.car.chula.ac.th | verified | include | Library site title matches Chulalongkorn University Central Library; OPAC deep link to be fixed at freeze. |
| VEN-015 | C4 | general_discovery | Google / Google Scholar | https://scholar.google.com | verified | include | Google Scholar is a general discovery layer over academic literature. |
| VEN-016 | C4 | academic_library | Social Science Electronic Publishing / SSRN | https://www.ssrn.com/ssrn/ | verified | include |  |
| VEN-017 | C4 | academic_library | ITHAKA / JSTOR | https://www.jstor.org | verified | include | Subscription access; institutional entitlement unknown. |
| VEN-018 | C4 | academic_library | William S. Hein and Co. / HeinOnline | https://heinonline.com/ | verified_redirected | include | home.heinonline.org -> heinonline.com; URL updated. Subscription access; entitlement unknown. |
| VEN-019 | C4 | academic_library | Thai Journals Online / ThaiJO | https://www.tci-thaijo.org/en | verified | include |  |
| VEN-020 | C5 | academic_library | ProQuest / PQDT Global | https://www.proquest.com | verified | include_conditional | Public homepage verified; PQDT content requires institutional login; entitlement unknown. |
| VEN-021 | C5 | academic_library | Thai Library Integrated System / ThaiLIS Thai Digital Collection | https://tdc.thailis.or.th | verified | include | Title 'ThaiLIS' at tdc.thailis.or.th (Thai Digital Collection host). |
| VEN-022 | C5 | academic_library | Open Access Theses and Dissertations / OATD | https://oatd.org | identity_unconfirmed | include_conditional | Behind bot challenge; needs human-assisted access. |
| VEN-023 | C6 | academic_library | CORE (Open University) / CORE | https://core.ac.uk | verified | include | CORE open-access aggregator. |
| VEN-024 | C6 | academic_library | Chulalongkorn University / Chula DigiVerse (successor host of CU Intellectual Repository) | https://digiverse.chula.ac.th/ | verified_redirected | include | Proposed cuir.car.chula.ac.th redirected to digiverse.chula.ac.th; URL updated. |
| VEN-025 | C6 | academic_library | Thammasat University / TU repository | https://repository.tu.ac.th | unreachable | drop | repository.tu.ac.th: DNS resolution failed; alternative hosts tried by DNS/TLS only (digital.library.tu.ac.th, dspace.library.tu.ac.th) did not resolve to a working site. Proposed for removal; TU holdings remain reachable via VEN-013. |
| VEN-026 | C7 | international_database | UNODC / SHERLOC | https://sherloc.unodc.org/cld/en/st/home.html | verified_redirected | include | URL updated to final landing page. |
| VEN-027 | C7 | international_database | WIPO / WIPO Lex | https://www.wipo.int/en/web/wipolex/index | verified_redirected | include | URL updated to final landing page. IP-focused; low prior yield for the four Codes. |
| VEN-028 | C7 | international_database | ILO / NATLEX | https://natlex.ilo.org/dyn/natlex2/r/natlex/fe/home | identity_unconfirmed | include_conditional | Behind bot challenge; labour-law focus, low prior yield. |
| VEN-029 | C7 | international_database | FAO / FAOLEX | https://www.fao.org/faolex/en/ | identity_unconfirmed | include_conditional | Behind bot challenge; agriculture/environment focus, low prior yield. |
| VEN-030 | C7 | commercial_legal | Thomson Reuters / Westlaw | https://legal.thomsonreuters.com/en/westlaw | verified_redirected | include_conditional | Product page only; platform content requires subscription; entitlement unknown. |
| VEN-031 | C7 | commercial_legal | LexisNexis / Lexis+ | https://www.lexisnexis.com/en-us/gateway.page | verified | include_conditional | Gateway page verified; platform content requires subscription; entitlement unknown. |
| VEN-032 | C7 | commercial_legal | vLex / vLex | https://vlex.com | verified | include_conditional | Subscription access; entitlement unknown. Platform name corrected (vLex, part of Clio). |
| VEN-033 | C8 | commercial_legal | Tilleke & Gibbins / Firm website | https://www.tilleke.com | verified | include |  |
| VEN-034 | C8 | commercial_legal | Chandler Mori Hamada / Firm website | https://chandler.morihamada.com/en | verified_redirected | include | chandlermhm.com redirects to chandler.morihamada.com (firm renamed); scripted default client got HTTP 403 but browser-like client got 200. |
| VEN-035 | C8 | commercial_legal | Thailand Law Online / Legal information site | https://www.thailawonline.com | verified | include | Law-firm marketing site rather than a legal database; low expected yield, retained for C8 coverage. |
| VEN-036 | C9 | general_discovery | Google / Google Books | https://books.google.com | verified | include |  |
| VEN-037 | C9 | general_discovery | Internet Archive / Internet Archive | https://archive.org | verified | include |  |
| VEN-038 | C10 | general_discovery | Google / Web search (English and Thai queries) | https://www.google.com | verified | include | Absorbs VEN-039. |
| VEN-039 | C10 | general_discovery | Google / Web search (Thai queries) | https://www.google.co.th | verified_redirected | merge | Same engine as VEN-038; Thai queries are query variants, not a separate venue. Merged into VEN-038. |
| VEN-040 | C10 | general_discovery | Microsoft / Bing | https://www.bing.com | verified | include | Second general engine. |

## Needing a human or Conductor decision before freeze

- **VEN-004** Royal Gazette (Secretariat of the Cabinet) — tls_error: [2026-10-05] browser (Chrome) navigation: certificate error page, no content; scripted GET HTTP 403
- **VEN-007** Office of the Council of State (Krisdika) — tls_error: [2026-10-05] browser (Chrome) navigation to https://www.krisdika.go.th: certificate error page, no content; scripted GET with TLS verification disabled (read-only) returned HTTP 404 at site root and at /web/guest/law-database
- **VEN-010** Library of Congress — identity_unconfirmed: [2026-10-05] browser (Chrome) navigation: bot-verification interstitial ('Just a moment...'), not bypassed; www.loc.gov homepage resolves (scripted GET HTTP 200, title 'Home | Library of Congress')
- **VEN-011** Jisc — identity_unconfirmed: [2026-10-05] browser (Chrome) navigation: bot-verification interstitial, not bypassed; scripted GET HTTP 403
- **VEN-012** National Library of Thailand — tls_error: [2026-10-05] scripted GET with TLS verification disabled (read-only) returned HTTP 200 title 'หอสมุดแห่งชาติ'; verified-TLS GET failed (unable to get local issuer certificate)
- **VEN-022** Open Access Theses and Dissertations — identity_unconfirmed: [2026-10-05] browser (Chrome) navigation: bot-verification interstitial, not bypassed; scripted GET HTTP 403
- **VEN-028** ILO — identity_unconfirmed: [2026-10-05] browser (Chrome) navigation: bot-verification interstitial, not bypassed; scripted GET HTTP 403
- **VEN-029** FAO — identity_unconfirmed: [2026-10-05] browser (Chrome) navigation: bot-verification interstitial, not bypassed; scripted GET HTTP 403
