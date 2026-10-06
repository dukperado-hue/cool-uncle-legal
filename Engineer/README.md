# Engineer — Aviation Engineering & Safety knowledge world

ONE ENGINE, MULTIPLE KNOWLEDGE WORLDS. Engineer is a sibling of the Legal world, not a fork.
It uses the shared engine in [`../engine/`](../engine/README.md) and keeps only its own **data** and a thin world adapter here.

```
site root (coolunclelab.com)
├── engine/                 SHARED: theme.css · core.js (icons, theme, data, URN) · shell.js · reader.js · worlds.json
├── index.html, atlas.html, concept.html, dictionary.html ...   LEGAL world (unchanged)
├── dictionary-aviation-*.json, aviation/sources/av-sources.json   existing aviation material (owned there, referenced here)
└── Engineer/               ENGINEER world
    ├── index.html subject.html entry.html dictionary.html sources.html    thin pages: no CSS, no colours
    ├── engineer.js         world adapter: data access, page controllers, 3 data-reading reader blocks
    ├── data/               registry.json · subjects.json · entities/<shard>.json     (the only content)
    ├── schema/             entity.schema.json · subject.schema.json
    └── tools/validate.js   node Engineer/tools/validate.js
```

## What is shared, what is Engineer's
| Concern | Where | Notes |
|---|---|---|
| Colours, type, spacing, radius, shadow, topbar, tabs, cards, chips, reader layout, responsive | `engine/theme.css` | token values copied from `index.html` (:root + dark). Pages contain no colour values (validator enforces). |
| Theme preference | `engine/core.js` | same localStorage key `codex-theme` as the main site (light/dark; the Legal-only "horror" mode is not carried over). |
| Icons | `engine/core.js` registry | the site's existing mechanism: glyph text in `<span class="icon">`. Engineer registers its names (`engineer.js`) on top; no second library. |
| Topbar / world switcher / nav / search box / footer | `engine/shell.js` + `engine/worlds.json` | worlds are data; the switcher lists every world in `worlds.json`. |
| Reader | `engine/reader.js` | **new**, domain-neutral (see "Reader" below). |
| URN → link (cross-world references) | `engine/worlds.json` templates | `eng:`, `atlas:` (concept, provision). |
| Subjects, entities, sources, vocabulary | `Engineer/data/` | Engineer-only. |
| Dictionary UI | `../atlas-dictionary-view.js` | reused as-is; reads the same JSON files as the Atlas dictionary page. |

## Data model (no schema invented beyond what the content needs)
* **Subject** (`data/subjects.json`): a card on the home page. `status`: `planned` (named, empty) · `seeded` (entries built only from material already in the repo) · `referenced` (content lives in another world and is linked) · `published`. `declaredSources` are names given by the owner (brief of 2026-10-06) with `verifiedInRepo:false` — nothing has been imported or verified for them.
* **Entity** (`data/entities/*.json`): one envelope for every mode — `concept | lecture | document | source | reference | provision | topic` — with `body` blocks, `sources`, `related` (URNs, may point into other worlds) and `provenance.origin` (`source-text | derived | ai-assisted | editorial`). `ai-assisted` shows a visible warning banner.
* **Lecture per session**: `kind:"lecture"` + `lecture:{series,no}`. Tested end-to-end with a throw-away shard (removed). No aviation lecture content exists in the repo, so none is shipped.
* **URNs**: `<ns>:<kind>/<slug>` — `eng:concept/sms`, `atlas:concept/<slug>`, `av:source/…` (reserved for the aviation raw layer; not linked yet).
* **Pointers, not copies**: `registry.json › external` points at `../dictionary-aviation-abbr.json`, `../dictionary-aviation-terms.json`, `../aviation/sources/av-sources.json` (paths relative to `Engineer/`). Rows are read live. Cross-world `labelSnapshot` values are drift-checked against Atlas by the validator.
* **Publication rule respected**: the source-registry block shows only entries whose `redistribution.status` is `public-source`; `review` entries are counted, never named.

## Add things without touching engine code
* **Subject**: add an object to `data/subjects.json` (`icon` must exist in the icon registry). Verified: card appears, no code change.
* **Entity / lecture**: add to an existing shard, or create `data/entities/<name>.json` and list it in `registry.json › shards`. Verified with a lecture shard.
* **Domain** (e.g. a new group on the home page): add to `domains` in `subjects.json`.
* **Icon**: `Engine.icons.register('engineer', {name:'🙂'})` in `engineer.js`.
* **New content shape** (e.g. a chart or a checklist): `Engine.reader.registerBlock('checklist', fn)` — in `engine/reader.js` if every world will want it, in `engineer.js` if only Engineer does. Unknown block types render a visible notice, never silently disappear.
* **Another world** (law/safety split, a third domain): add it to `engine/worlds.json`, give it a folder with its own `data/` and adapter.

Cache-busting: bump `V` in `engineer.js` and the `?v=` on the script/CSS tags when content changes (browsers cache `data/*.json?v=…`).

## Checks
`node Engineer/tools/validate.js` — schemas, subject/entity/URN references, Atlas label drift, external pointers, block renderers, **no hard-coded colour in Engineer/engine code, no `<style>` in pages, no subject id hard-coded in code, no Legal-Atlas dependency, no duplicated data file, no large data file**.

## Reader: why a new one
The Atlas concept reader (`atlas-concepts.js`) is bound to `AtlasCore` + `codex-data.json` (provisions, `lectureRefs`, Thai-law schema) and cannot render an entity that has none of those. `engine/reader.js` keeps the same page anatomy (kind chips → title TH/EN → status banner → summary → body → sources → related → tags → id) and is the intended common reader. The Legal side is **not** migrated in this phase.

## Hosting note
Pages link `../engine/…`, so Engineer must be served from the same site (it is: `coolunclelab.com/Engineer/`). If Engineer is later published from `github.com/dukperado-hue/Engineering` (empty at the time of writing), make `engine/` a subtree/submodule or publish both folders together; no other path changes are needed except the `external` pointers.

## Known limits (Phase 1)
* The Legal pages still carry their own copies of the theme tokens (`index.html` inline, `shared.css`, and the Atlas pages' second vocabulary). "Change once → both worlds update" is true for everything that links `engine/theme.css`; to extend it to Legal, replace each page's `:root` token block by `<link rel="stylesheet" href="engine/theme.css">` (the values already match). Not done here to avoid touching production Legal pages.
* Entity lookup loads every shard (fine for tens of files). When the corpus grows, add a generated `id → shard` index to `registry.json`.
* Fonts come from Google Fonts via `@import` in `theme.css`, as on the main site.
* Mobile/desktop/dark were verified in Chrome; no other browsers tested.
