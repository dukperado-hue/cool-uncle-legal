# engine/ — shared engine for every Cool Uncle knowledge world

Additive folder at the site root (nothing existing was edited to create it). Any world (Legal, Engineer, a future one) links these files and supplies only data + a thin adapter.

| File | Role |
|---|---|
| `theme.css` | all design tokens (light + dark), compat aliases for the Atlas vocabulary (`--bg --panel --muted --chip`), base components, reader layout, responsive rules |
| `core.js` | `Engine.icons` (registry), `Engine.theme` (`codex-theme`), `Engine.data.fetchJSON`, `Engine.worlds` (URN → link), DOM helpers |
| `shell.js` | `Engine.shell.mount({world, nav, current, search, footer})` — topbar, world switcher, theme toggle, tabs, search box |
| `reader.js` | `Engine.reader.render(host, entity, ctx)` + `registerBlock(type, fn)` |
| `worlds.json` | registry of worlds and URN → URL templates (site-root-relative) |

Rules: no domain knowledge in here; no colour values outside `theme.css` token definitions; all text inserted via `textContent`. See `Engineer/README.md` for the full architecture and how to add subjects, entities, icons and blocks.
