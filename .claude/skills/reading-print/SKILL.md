---
name: reading-print
description: "Add a print button (formatted for spiral/comb binding — margins 30mm left / 20mm right / 20mm top+bottom) to a subject page's reading section on coolunclelab.com. Use whenever a new subject page is created, or an existing page's reading section changes shape, to wire up or verify print support."
argument-hint: "[subject page filename, e.g. constproc.html]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

<objective>
Every subject page's "reading section" (the prose summary/lecture-notes content students read and study — as opposed to the flashcard/quiz/game modes) should be printable, formatted so the output can be spiral- or comb-bound ("กระดูกงู") without the punch holes eating into text: **left margin 30mm, right 20mm, top 20mm, bottom 20mm**. Screen CSS (button chrome) and print CSS (`@media print`) are kept strictly separate in the injected `<style>` block — never let print rules leak into normal browsing, or button/toolbar rules leak into the printout.

Requested 2026-09-15 (user: "ต่อไปนี้ทำให้หมวดอ่านของทุกวิชา print ออกมาได้... ทำเป็น skill เลย"). This skill exists so the rollout is finished consistently and any future subject page gets the same treatment automatically instead of being reinvented.
</objective>

<architecture>
Subject pages on this site use **two different markup patterns** for their reading section — detect which one a page uses before doing anything:

## Pattern A — `.lecture-list` (single shared script, fully rolled out)

Pages built around a flat, always-in-DOM list of collapsible rows:
`.lecture-list > .lecture-row > .lecture-head (.lecture-num, .lecture-title, .lecture-toggle) + .lecture-body`.
Every row's body is always present in the DOM (just CSS-hidden when collapsed), so a generic script can clone **all** rows at once — this pattern supports a real "print all" button, not just "print current".

Shared script: **`lecture-print.js`** (already wired into every page below — just confirm the tag is present, nothing else to do):
constcourt.html, constproc.html, contract-law.html, crimliab.html, crimpro.html, evidence.html, intlcommlaw.html, iplaw.html, legaleng.html, legalprofession.html, legalsystems.html, privateintl.html

To add a **new** Pattern-A page: build its reading section with that exact class structure, then add `<script src="lecture-print.js"></script>` right before `</body>` (after `legal-footer.js`, matching every existing page). No JS changes needed — the script finds `.lecture-list` generically off the DOM.

## Pattern B — `.study-panel` (per-page render, shared script + per-page quirks)

Pages that render only the **currently selected** topic/lecture into `#study-panel`/`.study-panel`, swapping its content (sometimes destroying/recreating the whole subtree — e.g. civpro.html's SPA-style single-root re-render on tab switch) on user interaction. Because content isn't all in the DOM simultaneously, there is **no generic "print all"** for this pattern — only "print what's on screen right now". Three known sub-variants exist (same script handles all three, verified 2026-09-15):

- **SPA tab** (civpro.html): whole app root re-rendered per `state.tab`; `.study-panel` doesn't exist in the DOM at all until the reading tab is active.
- **Topic-picker** (tort.html and siblings): a card grid (`#study-topiclist`) picks a topic, then `#study-panel` (containing `.study-toc` + `#study-body`) becomes visible and gets filled.
- **Side-nav** (legalhist.html): `.study-nav` list + `.study-panel` content pane, always both visible, content swapped per click.

Shared script: **`study-print.js`**, already wired into: civpro.html, legalhist.html, tort.html, property.html, inheritance.html, familylaw.html, debt.html, constlaw.html, commcontract.html, biz-org.html, adminlaw.html.

It works by:
1. Locating `#study-panel, .study-panel` generically (works across all three sub-variants).
2. Stripping known chrome before printing: `.study-toc`, `.study-nav`, `.tts-bar`, `.study-progress`, any `<button>`, `[id$="-sentinel"]`.
3. Inserting the print button as a **sibling immediately before** the panel (not inside it) — this is the key trick that survives the SPA-style innerHTML-replace pattern without needing per-page hooks into each page's own render functions.
4. Re-syncing (re-inserting the button, re-checking whether there's content to print) on every DOM mutation via a `MutationObserver` on `document.body` — this is what makes it resilient to civpro.html's whole-subtree replacement.

To add a **new** Pattern-B page: give the reading section a `#study-panel`/`.study-panel` container (any of the three sub-variant shapes works), then add `<script src="study-print.js"></script>` right before `</body>`. If the page introduces genuinely new chrome classes that shouldn't appear in print (a new kind of toolbar, say), add that selector to `STRIP_SELECTORS` in `study-print.js` — don't fork the file.

## Shared print CSS spec (duplicated intentionally, keep both in sync)

Both scripts inject an identical `@media print` block:
```css
@page{margin:20mm 20mm 20mm 30mm}   /* top right bottom left */
body *{visibility:hidden}
#printArea{display:block !important;visibility:visible;position:absolute;left:0;top:0;width:100%;padding:0}
#printArea, #printArea *{visibility:visible}
```
`@page` margin does all the spacing — `#printArea` itself has zero padding, so **the one place to change the binding-margin spec is the `@page` line, in both files**. They're kept as two independent self-contained files (not a shared third module) so that the 12 already-shipped Pattern-A pages don't need an extra `<script>` tag added just to pick up a margin tweak — editing `lecture-print.js` alone is enough for all of them.
</architecture>

<workflow>
When invoked for a specific page:

1. **Detect the pattern.** `grep -l 'class="lecture-list"\|class="study-panel"' <file>` — if neither matches, the page uses a third, unhandled structure; read its reading-section markup and propose which script to extend (or whether it needs a one-off), don't guess.
2. **Check the script tag exists**: `grep -c 'lecture-print.js\|study-print.js' <file>`. If missing, add it right before `</body>` (after `legal-footer.js` if present).
3. **Verify live**, don't just trust the wiring:
   - Serve the repo locally (`python -m http.server` from the repo root) and open the page in a browser — `file://` URLs are blocked by the browser-automation sandbox.
   - Navigate to the reading section (may require clicking a tab/topic first for Pattern B).
   - Confirm the print button/bar appears in the right place.
   - **Don't actually click print and let `window.print()` fire** — it opens a native OS dialog that blocks further browser automation and can't be dismissed programmatically. Instead override it first: run `window.print = function(){}` via the JS-execution tool, then call `window.printLectureRow(row)` / `window.printAllLectures(list)` (Pattern A) or `window.printStudyPanel()` (Pattern B) directly, then inspect `document.getElementById('printArea').innerHTML` for correctness (title present, no leftover `.study-toc`/`.study-nav`/`<button>`, reasonable content length).
4. **Report the rollout status** — update the file lists in `<architecture>` above when a page is added, so this skill stays accurate.
</workflow>

<known-gaps>
- No page currently has an *automated* test for this — verification is manual per the workflow above. If the site ever gains a test runner, this would be a good candidate to automate (assert `#printArea` populates with non-empty text and no stray interactive chrome).
- Pattern B has no "print all" by design (see architecture). If a future request wants the whole course's reading material as one printout for a Pattern-B subject, that needs bespoke work reading that page's own render function/data array — don't try to fake it generically.
</known-gaps>
