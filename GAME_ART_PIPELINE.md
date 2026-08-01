# Ace Attorney-style Game Art Pipeline (game-crimlaw-scenario.html v2)

Planning doc for the visual overhaul flagged in the v1 handoff — graphics were the
blocker ("กราฟฟิกไม่ไหว ไม่มีใครเล่นแน่"), not the game logic. This is the asset
generation plan using Gemini Pro image gen, to be executed across one or more
sessions before any engine code changes.

Scope this round: the existing "คดีที่สวนสัตว์" scenario's cast + its 2 locations.
Sprite IDs / names already wired into `game-crimlaw-scenario.html`:

| sprite id | name | role |
|---|---|---|
| `male_teen` | นายแดง | ม.334+ม.71 (ยกเว้นโทษ) |
| `female_teen` | นส.เหลือง | injured bystander |
| `female_influencer` | นางดำ | ม.300 ประมาท |
| `male_fan` | นายเขียว | ม.68 ป้องกันผู้อื่นโดยชอบ |
| `hippo_baby` | หมูเด้ง | the baby hippo |
| `hippo_mother` | โจนาห์ | the mother hippo |

Background IDs: `zoo_pool`, `courtroom`.

---

## 1. Two separate style tracks (don't mix them)

Real Ace Attorney itself mixes two different rendering techniques — a semi-realistic
establishing-shot background, and flat frontal character art standing in front of it.
We're doing the same:

**Track A — BACKGROUND style (isometric establishing shot).**
Locked from the reference image already in the repo
(`pics/cf39080b-944c-480b-a230-a4b1873fb0e9.jpg`, the courtroom concept art):
isometric ~3/4 top-down camera angle, clean semi-realistic cartoon/anime-influenced
game-asset style, soft cel shading with no heavy outlines, warm/naturalistic palette
per location, reads like polished mobile-game concept art.

Style tag to append to every background prompt:
```
isometric 3/4 top-down game-asset illustration, clean semi-realistic
anime-influenced cartoon style, soft cel shading, no heavy outlines,
warm cinematic lighting, highly detailed environment, single wide
establishing shot, no visible UI or text
```

**Track B — CHARACTER style (Ace Attorney dialogue portraits).**
Frontal / 3-4 view bust portrait, NOT isometric, painterly anime/webtoon shading,
expressive face, clean linework, plain or simple-gradient background (easy to
crop/key out later). This is what actually renders in the dialogue box.

Style tag to append to every character prompt:
```
front-facing 3/4 view character portrait, visual-novel / courtroom-drama
game art style (Ace Attorney-esque), clean anime linework, soft painterly
shading, expressive dramatic face, plain neutral background, no text, no logo
```

---

## 2. Character visual briefs (draft — confirmed 2026-08-01, tweak freely)

Two references used are **fictional movie characters** (แฟนฉัน, 2003) — treated as
loose vibe/aesthetic inspiration (era, hairstyle, general look), not a frame-accurate
copy of the film's character designs.

One reference is a **real, named public person** (นางดำ ~ คุณวีระพร นิติประภา) —
worth flagging: generating an AI likeness of a real, identifiable person and casting
them as a defendant in a (fictional, exam-based) negligence case is a personality-
rights/consent grey area even though the underlying legal scenario is educational
fiction. Recommend prompting for the **vibe** (mature, polished TV-personality
styling) rather than asking Gemini to reproduce her actual face — swap in a
different real-world reference or a purely invented look if this needs to be fully
safe for public sharing.

- **นายแดง** (`male_teen`) — Thai boy ~12–13, inspired by "แนค" from แฟนฉัน: 90s
  rural-Thai schoolboy vibe, short buzzed/bowl-ish haircut, tan skin, mischievous
  grin, plain round-neck t-shirt + shorts.
- **นส.เหลือง** (`female_teen`) — girl same age, inspired by "น้อยหน่า": two low
  pigtails, perpetual pouty/serious expression, 90s rural floral dress.
- **นายเขียว** (`male_fan`) — boy slightly older, inspired by "แจ๊ค": short buzzed
  hair, cocky ringleader posture, plain t-shirt.
- **นางดำ** (`female_influencer`) — polished, mature Thai TV-personality look:
  neatly styled hair, elegant business-casual outfit, holding a phone mid-livestream
  (see consent note above before using any specific real person as the anchor).
- **หมูเด้ง** (`hippo_baby`) — baby pygmy hippo, Studio-Ghibli-inflected linework:
  soft rounded shapes, pastel skin tone, big glossy eyes.
- **โจนาห์** (`hippo_mother`) — adult hippo, same Ghibli-inflected style, bigger and
  more protective/serious posture than หมูเด้ง.

### 2b. New characters for the courtroom trial scene (added 2026-08-01)

The "courtroom mode" so far is just a static MC quiz over the existing
`courtroom` background — no actual courtroom cast. To turn it into a real
dramatized trial scene (see `COURTROOM_SCRIPT.md`), 4 new characters are needed,
same Track B style/pipeline as section 3:

- **ผู้พิพากษา** (`judge`) — dignified older Thai judge, black judicial robe
  (ครุยตุลาการ) with a white collar/jabot, gavel in hand, stern but fair
  demeanor, seated/standing behind an elevated bench implied by framing.
- **อัยการ** (`prosecutor`) — Thai public prosecutor, formal dark
  business-formal attire, holding case documents/a folder, sharp and
  accusatory demeanor — the one arguing FOR conviction/the harsher charge.
- **ทนายจำเลย** (`defense_lawyer`) — Thai defense counsel, formal navy/black
  business suit, holding a briefcase or documents, earnest and composed
  demeanor — the one arguing the legal defense/exception theory.
- **แมวศาล** (`courtroom_cat`) — the recurring brown/dark-faced Thai cat mascot
  (same cat cameo already in `courtroom_alt.jpg`/`zoo_pool_alt.jpg`), now as its
  own proper Track B character for a comic-relief beat. **Don't crop it out of
  the existing background art** — that cat is rendered in the isometric
  background style (Track A) and would look flat/wrong pasted into the frontal
  AA-style dialogue box. Generate it fresh in Track B style instead, just 2-3
  simple reaction poses (it's comic relief, doesn't need the full 5-expression
  set): `neutral` (sitting primly), `startled` (mid-jump/puffed up), `sleepy`
  (unbothered, half-closed eyes).

**Turnaround-sheet prompts** (send to the same Gem, one per character):
```
Character brief: "ผู้พิพากษา", a dignified Thai criminal court judge, older
adult. Black judicial robe (ครุยตุลาการ) with a white collar, holding a small
gavel, stern but fair expression, neat gray-streaked hair.
```
```
Character brief: "อัยการ", a Thai public prosecutor, adult, formal dark
business-formal attire, holding a case folder/documents, sharp and serious
accusatory demeanor.
```
```
Character brief: "ทนายจำเลย", a Thai defense lawyer, adult, formal navy or
black business suit, holding a briefcase or documents, earnest and composed
demeanor.
```
```
Character brief: "แมวศาล", a small brown Thai cat with a dark/black face (the
same recurring background cat), simple and cute, sitting primly. This one only
needs a close-up-style single character turnaround, not a courtroom-professional
outfit obviously — just the cat itself, front/3-4/side/back views like the
other animal characters (หมูเด้ง/โจนาห์), same Studio-Ghibli-inflected linework
for family consistency with the hippos.
```

### 2c. อัยการ looks too much like ผู้พิพากษา — regen needed (2026-08-01)

Both came back as older Thai men with gray hair and similar facial
architecture — outfit (robe vs. suit) is the only real differentiator, which
doesn't read clearly enough at small dialogue-box size. Fix: keep `judge.jpg`
as-is (the elderly-distinguished look is thematically correct for a judge),
**regenerate `prosecutor` only** in a fresh Gem chat (don't reuse the old
turnaround as reference — we want it to *not* converge on the same face this
time) with explicit contrast traits baked into the brief:

```
Character brief: "อัยการ", a Thai public prosecutor. Make him CLEARLY visually
distinct from an elderly judge character: mid-40s, not elderly, full black hair
neatly combed back (no gray), clean-shaven, sharper/more angular jawline,
leaner build than an older man. Formal dark navy business suit with a dark red
tie, holding a case folder/documents, sharp and serious accusatory demeanor.
Same fixed layout as other characters: four views side by side (front, 3/4
front, side, back), same design/colors across all four, plain flat light-gray
background, no props, no text.
```

Redo the close-up expression pass for `prosecutor` off this new sheet once it
exists — the old `prosecutor.jpg` turnaround should be discarded/replaced, not
kept alongside. `judge`'s close-up pass can proceed as already planned in
section 4, no change needed there.

Then run the close-up pass (section 4) off each — 5 expressions for
`judge`/`prosecutor`/`defense_lawyer` (reuse the standard
neutral/shocked/angry/sad/confident set — "confident" doubles well as
"delivering an argument/objecting" for the lawyers), 3 simple ones for
`courtroom_cat` (`neutral`/`startled`/`sleepy`) using the section 4b anti-grid
reinforcement line every time, since a 3-4 character batch in one Gem chat is
exactly the length where it started drifting last time.

### 2d. คนร้าย / masked suspect — reusable future-scenario antagonist (added 2026-08-01)

None of the zoo case's charges involve an actual criminal antagonist (it's all
negligence/self-defense/exception theory among people who know each other).
The user flagged that future criminal scenarios need a real perpetrator figure
— someone holding a weapon (knife or gun) — and pointed out this character
doesn't need to be photoreal: Ace Attorney itself leans into exaggerated,
sometimes deliberately anonymous designs (e.g. a masked figure) rather than
strict realism.

Per [[project_courtroom_game_character_pool_scaling]], this should be a
**reusable generic archetype**, not a one-off drawn per scenario — the engine
reassigns it to whatever "the perpetrator" role a future scenario's script
needs, the same way `judge`/`prosecutor`/`defense_lawyer` are a fixed cast now.

- **sprite id**: `masked_suspect`
- **Design direction**: gender/age intentionally ambiguous, dark hoodie or
  trench coat, a plain featureless mask (simple domino or balaclava style —
  no text/symbols/real-world gang or organization imagery), broad exaggerated
  posture so the "threat read" is legible even at small dialogue-box size,
  holding a menacing weapon prop (knife OR gun — a stylized silhouette, not
  graphic detail, appropriate for an all-ages educational site). Same clean
  anime/webtoon Track B linework as the rest of the cast so it doesn't clash
  tonally with the other characters.
- **Expression set (only 3 — it's a single-scene antagonist, not a main
  character)**: `menacing` (default stance), `shocked` (caught/cornered),
  `smug` (taunting).

**Turnaround-sheet prompt** (send to the Gem, same as section 2b):
```
Character brief: "คนร้าย" (a masked suspect), gender/age intentionally
ambiguous, wearing a dark hoodie or trench coat and a plain featureless mask
(simple domino or balaclava style — no text, symbols, or real-world gang/
organization imagery), broad exaggerated posture, holding a menacing prop
weapon (a knife OR a gun — describe as a stylized silhouette prop, not
graphic detail) appropriate for an all-ages educational game. Same fixed
layout as other characters: four views side by side (front, 3/4 front, side,
back), same design/colors across all four, plain flat light-gray background,
no other characters, no text.
```

**Not started** — design brief only, no image generated yet. First real use
is whichever future scenario the user picks next (not the zoo case).

---

## 3. The "Gem" — custom Gemini persona for consistent turnarounds

Purpose: Gemini image gen drifts across separate chats/generations. A dedicated Gem
with a fixed system prompt + the courtroom reference image attached as a style
anchor keeps every character's design (face, proportions, outfit) locked, and its
output turnaround sheet becomes the reusable reference image you re-upload whenever
generating a new pose/expression/scene later.

**Steps to create it in the Gemini app:** Gems → Create a Gem → paste the
instructions below → attach `pics/cf39080b-944c-480b-a230-a4b1873fb0e9.jpg` as a
knowledge file for the background style anchor.

**Gem name:** `Cool Uncle Character Designer`

**Gem instructions (paste verbatim):**
```
You are a character design generator for a Thai legal-education visual-novel game
("Cool Uncle Legal Lab"). Every character you draw must follow this fixed rendering
style: front-facing 3/4 view, clean anime/webtoon linework, soft painterly cel
shading, expressive dramatic faces suitable for a courtroom-drama dialogue system
(Ace Attorney-esque), plain neutral background, no text or logos anywhere in the
image.

When given a character brief (name, age, role, key visual traits), always output a
single "character model sheet" image containing FOUR views of the same character
side by side, same outfit/proportions/colors in every view, evenly lit, neutral
idle pose:
1. Front view
2. 3/4 front view
3. Side (profile) view
4. Back view

Keep every view on a plain flat light-gray background so the character can be
cropped out cleanly later. Do not add props, other characters, or a background
scene. Keep the same face/hairstyle/outfit/color palette across all four views —
consistency is the entire point of this sheet.

If I later ask for a close-up portrait or a new expression/pose for a character you
already designed, use the character's existing model sheet (which I will re-attach)
as the visual reference and keep the design identical — only change what I
explicitly ask you to change (expression, pose, framing).
```

---

## 4. Close-up portrait pass (after each turnaround exists)

Once a character's 4-view model sheet exists, re-attach it to the Gem chat and ask
for individual close-up busts, one expression at a time. Suggested expression sets:

**Human characters (นายแดง / นส.เหลือง / นายเขียว / นางดำ)** — 5 expressions each:
`ปกติ (neutral/talking)`, `ตกใจ (shocked, wide eyes)`, `โกรธ (angry, gritted teeth)`,
`เศร้า/สงสาร (sad, downcast)`, `มั่นใจ (confident smirk / pointing accusingly)`.

**Hippos (หมูเด้ง / โจนาห์)** — 3 expressions each: `ปกติ`, `ตกใจ`, `โมโห`.

Prompt template per portrait (send with the model-sheet image attached):
```
Using this exact character's design (same face, hairstyle, outfit, colors) from
the attached model sheet, draw a close-up bust portrait (chest-up), expression:
<EXPRESSION>. Front-facing 3/4 view, Ace Attorney-style dramatic dialogue
portrait, clean anime linework, soft painterly shading, plain solid light-gray
background, no text, portrait aspect ratio (roughly 3:4).
```

**File naming for this pass:** `pics/game/portraits/<sprite_id>_<key>.png`, where
`<key>` is the English expression key below (matches a future `EXPRESSIONS`
lookup in the engine, not built yet):

| Thai | key |
|---|---|
| ปกติ | `neutral` |
| ตกใจ | `shocked` |
| โกรธ | `angry` |
| เศร้า/สงสาร | `sad` |
| มั่นใจ | `confident` |

(hippos only use `neutral` / `shocked` / `angry`)

### 4b. Gem drift found (2026-08-01) — long chats start ignoring "one image only"

After several close-up requests in the same Gem chat thread, it started silently
merging multiple expressions into one grid/comparison-sheet image again (same
failure mode as the model-sheet mode) instead of the single-portrait output the
instructions ask for — classic long-conversation instruction drift, not a one-off
fluke. Had to manually crop the resulting grids back into individual files (see
progress log). **Mitigation for future requests:** prepend this reinforcement line
to every close-up prompt from now on (works fine appended to the section 4
template above), and if the Gem keeps drifting anyway, start a **fresh chat** with
the Gem rather than continuing the long thread — a clean context follows the
original instructions much more reliably than one that's drifted 10+ turns deep.

```
IMPORTANT: output exactly ONE image containing ONE character in ONE pose/expression.
Do NOT create a grid, comparison sheet, multi-panel layout, or side-by-side
variants. Do NOT add any text, labels, or captions anywhere in the image.
```

### 4c. โจนาห์ scale/maturity fix needed

Comparing the generated `hippo_mother_*` portraits side by side with
`hippo_baby_*`, โจนาห์ reads as basically the same size/proportions as หมูเด้ง —
doesn't look like an adult at all, which defeats the point of being able to tell
mother and baby apart on screen. Root cause is likely the original turnaround
sheet (`hippo_mother.jpg`) itself never got pushed hard enough on adult anatomy
vs. the baby's chibi proportions. Fix in two steps:

**Step 1 — regenerate the turnaround sheet** (send in a fresh Gem chat, attach
both `hippo_mother.jpg` and `hippo_baby.jpg` for contrast if the Gem supports two
attachments, otherwise just `hippo_mother.jpg`):
```
Redraw this character, "โจนาห์", as a fully adult mother hippo — NOT a baby.
She must look noticeably larger and bulkier than a baby hippo: a longer, more
elongated snout, a thicker torso and legs, less round/soft "chibi" shape overall,
and some subtle adult texture (light wrinkles/folds on the skin). Keep the same
soft Studio-Ghibli-inflected linework and coloring style for family visual
consistency with the baby character, but the body proportions and scale must
read as clearly adult, not a bigger copy of the same baby shape. Default
expression: calm but watchful and protective, not cute. Same fixed layout as
before: four views side by side (front, 3/4 front, side, back), same
design/colors across all four, plain flat light-gray background, no props, no
text.
```

**Step 2 — redo the close-up expressions off the corrected sheet.** Re-run the
3 expression prompts from section 4 (`neutral`/`shocked`/`angry`) using the new
turnaround as the attached reference instead of the old one, with the section 4b
anti-grid reinforcement line included.

---

## 5. Background prompts (Track A style, 2 scenes this round)

Generate at a landscape-ish ratio (e.g. ~4:3 or wider) since the engine's `.stage`
box uses `object-fit:cover` — any sufficiently wide/tall shot crops in cleanly.

**`courtroom`** — the reference image already nails this; either reuse it directly
(crop/resize to taste) or regenerate a clean variant without visible people (since
AA-style dialogue puts flat character art in front of the background, a version of
this room with the tables slightly emptier reads better):
```
Thai criminal courtroom interior, isometric 3/4 top-down view, warm wood-paneled
walls, elevated judge's bench at back center under a golden Thai royal garuda
emblem, court stenographer desk to the side, prosecution and defense tables facing
each other in the mid-ground, a witness-stand podium with microphone in the center
aisle, gallery benches in the foreground, [style tag from Track A above]
```

**`zoo_pool`** — new, matching the same rendering technique for visual continuity:
```
Outdoor zoo hippo pool enclosure, isometric 3/4 top-down view, a shallow concrete
and rock-lined pool with clear blue-green water, a low safety railing separating
the pool from a visitor walkway, tropical trees and signage in the background,
bright midday lighting, [style tag from Track A above]
```

### 5b. Backup variants + cat cameo (added 2026-08-01, after first gen round)

User generated the two backgrounds above and wants one backup/alt candidate of
each (to pick the better one from), both featuring a small recurring mascot
cameo: a brown Thai cat with a dark/black face, tucked into the background as an
easter-egg detail (not blocking any gameplay-relevant area).

**`courtroom` backup:**
```
Thai criminal courtroom interior, isometric 3/4 top-down view, warm wood-paneled
walls, elevated judge's bench at back center under a golden Thai royal garuda
emblem, court stenographer desk to the side, prosecution and defense tables facing
each other in the mid-ground, a witness-stand podium with microphone in the center
aisle, gallery benches in the foreground, a small brown Thai cat with a dark
black face sitting quietly on a gallery bench or near a table leg as a subtle
background detail, isometric 3/4 top-down game-asset illustration, clean
semi-realistic anime-influenced cartoon style, soft cel shading, no heavy
outlines, warm cinematic lighting, highly detailed environment, single wide
establishing shot, no visible UI or text
```

**`zoo_pool` backup:**
```
Outdoor zoo hippo pool enclosure, isometric 3/4 top-down view, a shallow concrete
and rock-lined pool with clear blue-green water, a low safety railing separating
the pool from a visitor walkway, tropical trees and signage in the background,
bright midday lighting, a small brown Thai cat with a dark black face sitting on
the railing or nearby walkway as a subtle background detail, isometric 3/4
top-down game-asset illustration, clean semi-realistic anime-influenced cartoon
style, soft cel shading, no heavy outlines, warm cinematic lighting, highly
detailed environment, single wide establishing shot, no visible UI or text
```

Pick whichever of the two (with/without cat) reads better per scene — no need to
keep both long-term, this is just for comparison before committing one as
`courtroom.jpg` / `zoo_pool.jpg`.

### 5c. New scene — close-up of หมูเด้ง's pool (`zoo_pool_closeup`)

A tighter, zoomed-in shot of the pool itself, for a more intimate/dramatic beat
during the story (e.g. the moment the incident happens) rather than the wide
establishing shot. New background id: **`zoo_pool_closeup`**.
```
Close-up view at the water's edge of a zoo hippo pool, isometric 3/4 angled but
tightly framed on the pool surface and rocks, clear blue-green water with gentle
ripples and a few floating leaves, wet rocks along the edge, soft dappled
sunlight reflecting on the water, isometric 3/4 top-down game-asset illustration,
clean semi-realistic anime-influenced cartoon style, soft cel shading, no heavy
outlines, warm cinematic lighting, highly detailed environment, single close-up
shot, no visible UI or text, no characters in frame
```
Drop-in path: `pics/game/backgrounds/zoo_pool_closeup.jpg` — needs one line added
to the `BACKGROUNDS` object in `game-crimlaw-scenario.html` when wiring it into an
actual beat later (`zoo_pool_closeup: { emoji: '🌊', gradient: '...' }`), same
pattern as the existing two entries. Not wired yet — asset-generation only today.

---

## 6. File drop-in convention

Existing engine convention (`game-crimlaw-scenario.html`, no code change needed for
backgrounds or the old single-avatar sprite):
- `pics/game/backgrounds/<id>.jpg` → `zoo_pool.jpg`, `courtroom.jpg`
- `pics/game/sprites/<id>.png` → old single circular avatar per character (still
  works as a fallback, but the v2 UI below supersedes it for dialogue scenes)

**New for the AA-style dialogue system (needs an engine change later, not today):**
multiple expression images per character will need their own path convention, e.g.
`pics/game/portraits/<sprite_id>_<expression>.png` (`male_teen_neutral.png`,
`male_teen_shocked.png`, ...). That wiring is a *separate follow-up task* once the
art actually exists — today's scope is asset planning + generation only.

---

## Progress log

**2026-08-01 — first asset batch generated and organized.** All 6 character
turnaround sheets and all 5 scene images came back from Gemini in one pass.
Renamed away from the raw Gemini download names / Thai movie-reference names
into the engine's neutral sprite-id convention (avoids any filename tying back
to the แฟนฉัน characters or a real named person, per the copyright/consent note
in section 2) and organized into:
- `pics/game/backgrounds/courtroom.jpg` (primary) + `courtroom_alt.jpg` (backup,
  has the brown/black-face Thai cat cameo on the floor)
- `pics/game/backgrounds/zoo_pool.jpg` (primary) + `zoo_pool_alt.jpg` (backup,
  has the cat cameo on the railing)
- `pics/game/backgrounds/zoo_pool_closeup.jpg` (new close-up water shot, not yet
  wired into `BACKGROUNDS` in the engine — needs one object entry when a beat
  wants to use it)
- `pics/game/character-sheets/<sprite_id>.jpg` for all 6 characters (4-view
  turnaround sheets — reference material for the close-up expression pass, not
  directly game-loadable sprites yet)

`courtroom.jpg` and `zoo_pool.jpg` match the existing `BACKGROUNDS` ids exactly,
so they went live immediately with no code change — verified in a real browser
via local server (`python -m http.server`): the zoo scenario's stage now shows
the actual isometric artwork instead of the CSS gradient placeholder.

**Not yet done:** the close-up expression pass (section 4) off each character
sheet, and the engine change to actually render AA-style portraits + name/text
box in the dialogue UI (still using the old small circular sprite-avatar system
for characters — only backgrounds are live so far).

**2026-08-01 — close-up expression pass complete for all 6 characters.** All
`pics/game/portraits/<sprite_id>_<key>.png` files now exist:
`male_teen`, `male_fan`, `female_teen`, `female_influencer` each have
`neutral`/`shocked`/`angry`/`sad`/`confident`; `hippo_baby`/`hippo_mother` each
have `neutral`/`shocked`/`angry` (plus a bonus 4th unlabeled pose kept for
`hippo_baby` as `hippo_baby_bonus3.png`, and a bonus `female_influencer_worried`
from an oversized grid). Along the way:
- นางดำ, หมูเด้ง, and the first โจนาห์ pass all came back as combined multi-panel
  grids instead of separate files (see 4b) — hand-cropped with PIL into
  individual files rather than re-requesting, quicker than fighting the Gem.
- นายแดง/นายเขียว's original 5 files turned out to already cover all 5 target
  expressions, just needed relabeling: their "ตกใจ" file was actually a mild
  neutral/talking pose and their "ตะลึง"/"ตกใจมาก" file was the real shocked
  expression — verified visually before renaming, not assumed from filename.
- นส.เหลือง's 5-message pass with the section 4b anti-grid reinforcement line
  worked perfectly — came back as 5 clean separate files in the same
  neutral→shocked→angry→sad→confident order sent, zero cropping needed. This is
  the reference case for how the reinforcement line should behave going forward.
- โจนาห์'s corrected turnaround (section 4c step 1) came back combined with its
  3 close-ups all in one image (top row = 4-view turnaround, bottom row = 3
  expressions) — cropped both rows out; replaced the old
  `character-sheets/hippo_mother.jpg` with the corrected version. The size/
  maturity fix is a **real but modest** improvement (slightly longer snout, less
  spherical torso) — not a dramatic adult-vs-baby size difference. Acceptable
  for now; flag to the user if in-game testing shows players still can't tell
  หมูเด้ง and โจนาห์ apart, since another regen round may be worth it then.

**2026-08-01 — courtroom cast in progress.** All 4 new turnaround sheets
generated (`judge`, `prosecutor`, `defense_lawyer`, `courtroom_cat`). User caught
that `judge`/`prosecutor` looked like twins (both older gray-haired men, only the
outfit differed) — fixed per section 2c by regenerating `prosecutor` only with
explicit contrast traits (mid-40s, black hair, sharper jawline); did this
generation directly via browser automation into the user's own Gemini tab rather
than handing back a prompt to paste, since the user asked for that this round.
`judge`'s close-up pass is done (`neutral`/`sad`/`angry`/`shocked`/`confident`,
all 5 in `pics/game/portraits/`). `prosecutor`'s old close-ups were discarded
(still had the pre-fix gray-haired face) — needs a fresh close-up pass off the
corrected turnaround. `defense_lawyer` and `courtroom_cat` haven't had their
close-up pass yet either.

**2026-08-01 — session paused mid-way through defense_lawyer's close-up pass.**
Drove the Gem directly via browser automation for judge/prosecutor (both fully
clean, 5/5). For `defense_lawyer`, generation reliability degraded (viewport
resizing broke coordinate-based clicks, several sends got interrupted
mid-generation, one chat thread hit a spurious "this Gem has been deleted"
error requiring a fresh chat). Result as of pause:
- `neutral` — clean (navy blazer, scarf, glasses) ✓ keep
- `shocked` — two variants generated; first drifted to a teal/green blazer with
  no scarf, but the **second one is clean** (navy, scarf, glasses) ✓ keep the
  second one, discard the first
- `angry`/objecting pose — drifted to a **gray blazer with glasses missing** ✗
  needs a redo, explicitly reinforce "navy blazer, keep her glasses on" in the
  prompt next time
- `confident` — not attempted yet
- `sad` — attempted twice, both got interrupted before generating ✗ still
  needed

**Not started at all:** แมวศาล (`courtroom_cat`) close-up pass (3 expressions).

**Lesson for next session's automation attempts:** typing into a genuinely
fresh Gem-home-page input sometimes drops the text unless you wait ~2-3s after
clicking before typing (page seems to re-hydrate the input once). Continuing
an already-active chat's input (after the first message has been sent) is far
more reliable than repeatedly starting fresh chats — prefer that pattern, and
only start fresh when the anti-drift benefit is worth the reliability cost.

**Remaining work, not started:** the actual engine rewrite — replace the small
circular sprite-avatar system in `game-crimlaw-scenario.html` with a real
Ace-Attorney-style portrait (large, bottom-anchored) + name box + dialogue
textbox, wired to swap `pics/game/portraits/<id>_<expression>.png` per beat.

---

## 7. Suggested order for this session

1. Generate the 2 backgrounds (Track A prompts above) — no character-consistency
   dependency, fastest win.
2. Create the Gem (section 3).
3. Run all 6 character briefs (section 2) through the Gem to get 6 model sheets.
4. Run the close-up expression pass (section 4) off each model sheet.
5. Save everything into `pics/game/backgrounds/` and a new `pics/game/portraits/`
   folder using the naming convention above.
6. New session: wire the AA-style portrait+textbox UI into the engine to actually
   use these assets (replaces the current small circular sprite-avatar system).

**2026-08-01 — engine rewrite done, ahead of full art completion.** Built the
AA-style portrait + name box + textbox UI in `game-crimlaw-scenario.html`
(`renderTrial`/`renderTrialDialogue`/`renderTrialQuestion`, `trial:` array on
the zoo scenario transcribed from `COURTROOM_SCRIPT.md`, `portraitPath()` with
a `.png`→`.jpg` fallback chain since generated files came back in mixed
extensions per character). Verified end-to-end in a real browser: `judge`
(the only character with a complete close-up set) renders its actual
generated portrait; `prosecutor`/`defense_lawyer`/`courtroom_cat` — none of
which have portrait files yet — cleanly fall back to the small emoji-in-box
placeholder instead of breaking, so the trial is fully playable today and
each character's real art can drop in later with zero further code changes.
MC question scoring/interleaving inside the trial confirmed working.
**Still needed:** finish `prosecutor`'s close-up pass (5 expressions, off the
already-regenerated turnaround), `defense_lawyer`'s close-up pass (was
mid-way, see the "session paused" progress note above), and
`courtroom_cat`'s 3 poses — all via the Gem, not code work.
