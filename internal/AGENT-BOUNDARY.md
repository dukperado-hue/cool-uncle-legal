# Case Agent — boundary

For a **future** agent that helps grow the Case Stock. No such agent exists
in Phase 4D-1; this document fixes its limits in advance.

## MAY

- Read `internal/candidates/`, `internal/sources/`, `internal/review/`.
- Read the public corpus (`prototype/assets/cases/*.json`,
  `article-case-index.json`, `golden-cases.json`) — read only.
- Query NotebookLM **in its own session** as a research workbench (the
  repository itself never calls NotebookLM; see `README.md`).
- Extract candidate case leads from a source and write them as
  `internal/candidates/<cand-…>.json` in `candidate.schema.json` form.
- Normalise a candidate's `source.type`, `evidence`, `status`,
  `extraction_confidence` to the **controlled enums** in the schema.
- Propose `cited_provisions[]` with an honest `evidence` tag
  (`source_explicit` / `source_cites` / `agent_inferred`).
- Derive `candidate_structural_path` from an already-verified provision via
  the **public** `AtlasCore` API (`getBreadcrumb`, `describePath`) — never
  by hand, never from an array index.
- Propose `possible_duplicate_of` by matching title / party / year against
  the existing public case ids.
- Run `internal/candidate-validate.py` and emit a review checklist for a
  human.
- Write **only** under `internal/`.

## MUST NOT (ever, automatically)

- Write to `prototype/assets/cases/` — the public case corpus.
- Modify `golden-cases.json`.
- Set or flip `visibility.public`.
- Run or commit output of `build-article-case-index.py` /
  `build-case-directory.py`.
- Set `promoted_case_id`, or move a candidate to `status: "promoted"`.
- Invent a ฎีกา / case number, a court, a date, or any fact.
- Assert a legal proposition that is not stated in a cited source.
- Downgrade `evidence` dishonestly, or invent an `evidence` value.
- Overwrite or edit a case already marked `VERIFIED_S` / `s_verified: true`.
- Touch the frozen Atlas: `atlas-core.js`, `atlas-ui.js`, `atlas-cases.js`,
  `atlas.html`, `atlas-cases-smoke.js`, `atlas-validate.js`,
  `atlas-ui-smoke.js`, `codex-article-viewer.html`,
  `collections-registry.json`, `codex-data.json`, `article-case-index.json`.
- Change `node.path`, `nodeKey()`, `atlas:return`, the route grammar, or
  any Phase 4B / 4C-1 / 4C-2 behaviour.
- `git push`, or `git commit` anything that changes public case coverage.

## The one rule behind all of the above

> The agent produces **evidence for a human to review**. It never produces
> a published fact. Every transition from "candidate" toward "public" is a
> human decision, recorded in `reviewers[]`.
