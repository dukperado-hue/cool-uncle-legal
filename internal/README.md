# `internal/` — Case Knowledge pipeline (Phase 4D-1 foundation)

This tree is the **internal quarantine** for future case-law growth. It is
**not** part of the public website and **not** part of the Legal Atlas.

Phase 4D-1 delivers only the *foundation*: a candidate contract, a
validator, tests, and this boundary. It does **not** acquire cases, does
**not** integrate NotebookLM, and does **not** publish anything.

```
SOURCE (lecture / textbook / judgment / article)
   │      researcher reads it (optionally with NotebookLM as a workbench)
   ▼
internal/candidates/<cand-…>.json          ← structured candidate, this schema
   │      python internal/candidate-validate.py internal/candidates/
   ▼
VALIDATION  (schema + semantic rules; invalid ⇒ blocked here)
   │
   ▼
HUMAN REVIEW  (source → citation → mapping → content; see PROMOTION.md)
   │
   ▼
PROMOTION GATE  ── MANUAL ONLY, no tooling in this repo ──
   │      a human copies a finished candidate to
   ▼
prototype/assets/cases/<id>.json   +   golden-cases.json   (visibility.public flip)
   │      then, separately and manually:
   ▼
python build-article-case-index.py     (public association index rebuild)
```

There is **no code path** from `internal/` to `prototype/assets/cases/`.
Promotion is a deliberate human act, described in `PROMOTION.md`.

## Layout

| Path | Tracked in git? | Contents |
|---|---|---|
| `candidate.schema.json` | yes | machine-readable candidate contract + controlled enums (single source of truth) |
| `candidate-validate.py` | yes | validator — `python internal/candidate-validate.py <file-or-dir>` |
| `candidate-validate-test.py` | yes | validator tests (positive + negative) — `python internal/candidate-validate-test.py` |
| `PROMOTION.md` | yes | the manual promotion gate, step by step |
| `AGENT-BOUNDARY.md` | yes | what a future Case Agent MAY / MUST NOT do |
| `fixtures/*.json` | yes | **synthetic** candidates for the tests — clearly marked "FIXTURE ONLY", not real cases, not promotable |
| `candidates/*.json` | **no** (gitignored) | real working candidates — unverified case material, kept off the public web |
| `sources/*` | **no** (gitignored) | source notes, NotebookLM exports, extraction logs |
| `review/*` | **no** (gitignored) | review checklists and decisions |

`candidates/`, `sources/`, `review/` keep only a `.gitkeep` in git. Their
real payload is **untracked on purpose**: a candidate may contain an
unverified fact, a not-yet-deidentified name, or a source excerpt that is
not cleared for publication. Keeping it untracked means it can never be
served as a public asset from this static site, and never leaks through
`git` history.

> Defense in depth: `build-article-case-index.py` and
> `build-case-directory.py` both `glob` **only** `prototype/assets/cases/*.json`
> and honour each entry's `visibility.public`, so even a misfiled draft
> cannot reach the public index. The untracked `internal/` payload is a
> second wall, not the only one.

## Git policy — Option A (chosen)

**Commit the pipeline tooling; do not commit candidate / source / review
data.** Rationale:

- This repo is a **public static site** (`coolunclelab.com`). Anything
  committed under a path is fetchable by URL. Candidate/source/review
  material is *unverified working data* and must not be publishable.
- The repo's existing convention already gitignores superseded / draft
  content (`/draft/`, `/files/`, `codex-schema.json`).
- The *tooling* (schema, validator, tests, docs) is safe and useful to
  version; the *payload* is not.

See the `# Case Knowledge pipeline (Phase 4D-1)` block in `.gitignore`.

## What Phase 4D-1 explicitly does NOT do

- No case acquisition, no web scraping, no NotebookLM integration.
- No AI agent.
- No write to `prototype/assets/cases/`, `golden-cases.json`, or
  `article-case-index.json`.
- No `visibility.public` change. No automatic promotion.
- No change to the frozen Atlas (`atlas-*.js`, `atlas.html`, `atlas-core.js`,
  `codex-data.json`, `collections-registry.json`, route grammar,
  `nodeKey()`, `node.path`, `atlas:return`, Phase 4B/4C-1/4C-2 behaviour).
- Phase 4C-3 (parent structural rollups): **not implemented — "not yet
  justified"** per gate 4C-3-0.
