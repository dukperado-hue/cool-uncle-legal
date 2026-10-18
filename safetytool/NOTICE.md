# NOTICE — Uncle Safetytool

Uncle Safetytool — Created by Anusorn Sintusaichol
Copy from Anusorn Sintusaichol

## Which terms apply (read this first)

| Material | Terms that apply today |
|---|---|
| Source code of the current release | MIT — [`LICENSE`](LICENSE) |
| Content written for the project (example models, help/guide text, docs, schemas) | CC BY 4.0 — [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md) |
| Third-party material (table below) | Its own licence, or unresolved. Not covered by the two rows above |
| [`USAGE-TERMS.md`](USAGE-TERMS.md) | **Draft for a possible future release. Not adopted. It governs nothing in the current repository and does not revoke or restrict MIT / CC BY 4.0 grants.** |

This notice makes no statement about who owns the copyright; that is a question for legal review (see `docs/RIGHTS-REVIEW.md`).

## Attribution convention

- **Full** (`CREDIT_LINE` in `js/brand.js`): "Uncle Safetytool · Created by Anusorn Sintusaichol · Copy from Anusorn Sintusaichol". Used in the footer, Help > About, README and the usage-terms documents.
- **Compact** (`CREDIT_SHORT`): "Uncle Safetytool · Created by Anusorn Sintusaichol". Used where space is limited: report, print caption, SVG and PNG exports.

## Source-header convention

Rather than editing every file, first-party files are marked in two ways:

1. **This notice** describes the licensing position of the repository as a whole (table above). Most source files begin with a line `// Safetytool — <purpose>`; that line is a historical description, not a claim about third parties.
2. **Four-line header** (product, "Created by", "Copy from", licence pointer: MIT now, draft terms not adopted, NOTICE for third parties) is placed at the top of the entry points: `js/brand.js` (the single source of the attribution text), `js/app.js`, `sw.js`, `cli/safetytool.js`, `cli/serve.js`. New source files need not repeat it.

Generated data (`data/*.json` examples, saved models, packages) has no comment header — JSON cannot carry comments. Examples carry `meta.illustrative: true`.

Internal identifiers keep the old short name `safetytool` on purpose (storage keys `safetytool.*`, schema ids `safetytool.<model>/1`, the engine name in packages, the service-worker cache, file names) so saved models and browser storage keep working.

## First-party material (written for this project; ownership not asserted here)

`js/*.js`, `cli/*.js`, `css/app.css`, `index.html`, `sw.js`, `test/*.js`, `schema/*.json`, `docs/*.md` (except quoted third-party facts, which are cited), `README.md`, `AGENTS.md`, `CLAUDE.md`, and the example models `data/example-*.json` (illustrative, not real operator or regulator data).
Much of it was drafted with AI assistance (Claude). Who holds the copyright, and whether AI-assisted material is protectable, are open questions for legal review; this notice does not decide them.

## Third-party or unverified (NOT claimed by the Rights Holder)

| Item | Where | Owner / status |
|---|---|---|
| Sarabun typeface (woff) | `fonts/sarabun-*.woff`, `fonts/OFL.txt` | © The Sarabun Project Authors, SIL OFL 1.1. OFL text is shipped. Reserved Font Name and the "no sale by itself" condition apply; embedded in SVG/report output by `js/fonts.js`. Keep as is. |
| IBM Plex Sans / Sans Thai / Mono | loaded from Google Fonts by `index.html` | © IBM, SIL OFL 1.1 per the Google Fonts listing — **not re-checked in this review**. Remote load sends visitors' IP to Google; consider self-hosting or dropping (README claims "no tracking"). |
| ICAO ADREP taxonomy ids, codes, names | `data/adrep-taxonomy.json` | © ICAO. Page states no licence. **Unverified redistribution right** — recommend excluding from the public repo or obtaining ICAO permission. |
| ERC matrix | `data/erc-matrix.json` | Transcribed from slides (R. Taylor, ATSB, 2013) and from an image whose publisher is unknown. **Unverified** — recommend removing the image-derived preset from public distribution until its owner is identified. |
| UK CAA bowtie material | not shipped; cited in `docs/SOURCES.md` | © UK CAA. Reference content only until reuse and redistribution rights are verified. Our wording and 1–4 scales are our own. |
| CASA, BowTieXP/Enablon, SKYbrary, IATA | not shipped | Reference only; names and marks belong to their owners. |
| HFACS category names | `js/hfacs.js`, `data/example-hfacs*.json` | Names from Shappell & Wiegmann (2000), FAA DOT/FAA/AM-00/7; definitions are our wording. Cite the report. |
| Method names (Swiss cheese, SHELL, STAMP/STPA, FRAM, Heinrich) | models | Concepts of Reason, Edwards/Hawkins, Leveson, Hollnagel, Heinrich; implementations and wording are ours. Cite the primary works. |
| Node.js | runtime for tests/CLI | Not bundled. The project has no npm dependencies. |

See `docs/RIGHTS-REVIEW.md` for the review that produced this table and its recommendations.
