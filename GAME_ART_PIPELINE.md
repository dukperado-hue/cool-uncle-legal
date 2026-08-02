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

## Progress log (batch 2, 2026-08-02)

**All 15 new generic-pool character turnaround sheets + 3 item props + 6 new background scenes generated and saved, same session.** Driven directly via browser automation into the Gem (same pattern as the courtroom-cast session). Files:
- `pics/game/character-sheets/{court_clerk,crime_boss,delinquent,rural_uncle,japanese_fighter,japanese_uncle_reviewer,monk_young,monk_elder,dog_golden,rabbit,dog_labrador,romantic_hero,romantic_heroine,plaintiff_lawyer,comedian_uncle}.png`
- `pics/game/items/{item_gun,item_knife,item_keys}.png` (new folder/convention, section 8)
- `pics/game/backgrounds/{house,car,boat,plane,restaurant,logging_truck_accident}.png`

All real-person/copyrighted-IP references (สีเทา, น้าค่อม, Ryu, Orange Road, Hokuto no Ken villain) were kept vibe/archetype-only per section 2e's policy — none named in the actual prompts sent to Gemini.

**Downloads land as `.tmp` files on this machine, not final-named files** — some corporate download-scanning/quarantine step holds them as randomly-named `.tmp` in the Downloads folder before (if ever) finalizing to the real filename. Workaround used throughout: note a timestamp immediately before clicking the download icon, then `find Downloads -newermt "<timestamp>" -iname "*.tmp"` to locate the just-downloaded file, verify its content matches the expected character (via the Read tool, image dimensions/content — don't trust file order alone), then `cp` it to the correct destination path with the right name and delete the `.tmp` original. A stale pre-existing `.tmp`/`.png` in Downloads from an unrelated earlier session caused one wrong-file mistake early in this session (a curly-haired man in a red shirt got saved as `court_clerk.png` at first) — always verify by viewing the actual image content, never assume the newest-by-`ls -t` file is the right one without checking its timestamp is genuinely fresh.

**Download button needs two clicks**: the first click on a hovered download icon only surfaces a "Download full size" tooltip; the actual click-through needs a second click at the same coordinates. Clicking directly on a generated image (not hover-hover-click) opens a full-screen image editor overlay instead, which also works fine — its own download icon (top toolbar, same two-click pattern) then triggers the save; close the overlay via the back arrow (top-left) afterward.

**One generation (`romantic_hero`) got stuck for 3+ minutes ("Formulating Character Design" never progressing)** after ~11 turns in the same Gem chat — matches this project's known "long chat thread reliability degrades" pattern (see section 4b). Clicking "Answer now" to force it did NOT help — it silently cancelled the response ("You stopped this response") rather than producing an answer. Fix: abandon the stuck chat, navigate to a fresh `gemini.google.com/gem/<id>` chat, resend the same prompt — resolved instantly. Reused the fresh chat for the remaining ~9 generations (romantic_heroine through the final background) without issue since it stayed short. **Lesson for future large batches: proactively start a new chat every ~8-10 generations rather than waiting for a stall.**

**Close-up expression pass (batch 2) — blocked mid-start (2026-08-02).** Started
the close-up pass using a text-only redescription approach (no image attachment
needed — the file-upload UI's hidden `<input type=file>` isn't reachable via
this harness' accessibility-tree-based `find`/`read_page`, so re-describing the
exact original brief text in a fresh chat was used instead, which worked
perfectly: `court_clerk_neutral` came back looking closely consistent with the
turnaround sheet). However, **downloading it failed** — after roughly 30
successful downloads earlier in the session, every download trigger (hover
icon, image-editor toolbar, "..." → Download image, right-click) stopped
producing any file at all. Confirmed via a real-time `FileSystemWatcher`
(PowerShell, not polling) watching Downloads/Desktop/Documents/home/Temp/
Pictures/Chrome-profile simultaneously — zero file-system events fired
anywhere for any of several retry attempts, even though Gemini's own UI showed
a "Downloading full size..." toast each time. Strong hypothesis: Chrome's
"site is trying to download multiple files" throttle silently kicked in after
this session's high download volume and is now blocking further downloads
pending a permission prompt — that prompt lives in the browser's native
chrome (omnibox area), which is outside what this automation harness can see
(screenshots only capture the tab's render surface) or click. `chrome://`
settings pages are also blocked from navigation by the harness, so this
couldn't be fixed from the automation side either.

**Needs the user's own action to unblock**: check the Chrome window for a
download-blocked prompt/icon in the address-bar area for gemini.google.com
and click Allow, or manually check
`chrome://settings/content/all` → gemini.google.com → Automatic downloads.
Once unblocked, the text-only close-up approach (no image upload needed) is
proven to work — just resume the same pattern: fresh chat per character,
redescribe the exact original visual brief, expression, and the anti-grid
reinforcement line, 5 expressions per human character
(neutral/shocked/angry/sad/confident) or 3 per animal
(neutral/shocked/angry), same `pics/game/portraits/<sprite_id>_<key>.png`
convention as batch 1.

**Close-up pass progress (2026-08-02, resumed after download throttle cleared):** `court_clerk` (neutral/shocked/angry/sad/confident) and `crime_boss` (neutral/shocked/angry/sad/confident) both fully done, 10/69 portraits saved in `pics/game/portraits/`. Text-only redescription (no image attachment) continues to work well for consistency. Remaining: `delinquent`, `rural_uncle`, `japanese_fighter`, `japanese_uncle_reviewer`, `monk_young`, `monk_elder`, `romantic_hero`, `romantic_heroine`, `plaintiff_lawyer`, `comedian_uncle` (5 expressions each) + `dog_golden`, `rabbit`, `dog_labrador` (3 expressions each: neutral/shocked/angry) — same pattern, one fresh Gem chat per character, exact original visual brief text + expression + anti-grid line, download via hover-icon (2 clicks) or "..." → Download image, verify via the `.tmp`-in-Downloads-folder pickup method.

**User decision (2026-08-02): stop generating more close-ups for now, start wiring into the actual game.** With 15 turnaround sheets + 2 characters' full 5-expression portrait sets already in hand, that's enough to start integration work rather than finishing all 69 portraits first.

**In-story names confirmed (2026-08-02)** — "เปลี่ยนชื่อ" meant: give each generic-pool sprite-id an in-story Thai display name, same pattern as `female_influencer`="นางดำ" in the zoo case:
- `court_clerk` → **คุณแสนดี** (เสมียนสาว)
- `crime_boss` → **นายเหี้ยม**
Remaining 13 characters (delinquent, rural_uncle, japanese_fighter, japanese_uncle_reviewer, monk_young, monk_elder, dog_golden, rabbit, dog_labrador, romantic_hero, romantic_heroine, plaintiff_lawyer, comedian_uncle) still need names assigned — ask the user for these too, likely per-scenario rather than all at once since they're meant to be reusable across different scenario casts.

**Not started yet, this is the real next task**: the AA-style engine change to actually render these assets in `game-crimlaw-scenario.html` — this was flagged as a separate follow-up back in section 6/7 and still hasn't been done. Needs: wiring `portraitPath()`-style lookups for the new sprite ids, deciding which of the 15 new characters get used in which upcoming scenario (the ทนายฝ่ายโจทก์/plaintiff_lawyer character in particular fills a real gap — civil cases have no lawyer character yet), and giving each generic character an in-story name per scenario. Recommend doing this in a fresh session with full context budget rather than continuing here — this session is already deep into context usage from the asset-generation batch.

**Still pending**: a 16th requested character, "ซ้อกาด" — user's clarification never resolved this session (the AskUserQuestion answer came back as just the raw option label with no free-text explanation). Ask again before generating. No close-up expression pass done for any of this batch's characters yet — turnaround sheets only, matching the original batch's phased approach (turnaround first, expressions later once the user picks which characters actually get used in a script).

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

## 2e. Generic character pool, batch 2 (added 2026-08-02) — 15 new archetypes

Per [[project_courtroom_game_character_pool_scaling]]'s "variable pool" idea: these
are reusable generic faces the engine can reassign to whatever defendant/victim/
witness/bystander role a future scenario's script needs, not one-off cast members
tied to a single case. Same Track B pipeline as section 2 (Gem model sheet first,
close-up expression pass later — this round is turnaround sheets only).

**Real-person / copyrighted-IP handling policy (confirmed with user 2026-08-02):**
several briefs below were pitched as "looks like [a real actor/comedian]" or "looks
like [a copyrighted anime/game character]". Per the same personality-rights/consent
reasoning as section 2's นางดำ note, and per explicit user confirmation this round —
**every one of these is vibe/archetype-only, never an exact likeness.** Prompts
below deliberately describe the *visual archetype* (build, hairstyle, era, outfit,
demeanor) and never name the real person or copyrighted character in the actual
Gemini prompt text.

| sprite id | Thai brief | real-person/IP note |
|---|---|---|
| `court_clerk` | เสมียนศาล เซ็กซี่ | vibe of early-90s American supermodel glamour (Cindy Crawford/Denise Richards era) — described generically, not named |
| `crime_boss` | คนร้ายหน้าตาดุ | vibe of a Hokuto no Ken (เทพเจ้าดาวเหนือ)-style manga villain — archetype only, not a copy of any specific character |
| `delinquent` | นักเลงหน้าตาคูนิโอะ | vibe of the Kunio-kun/River City Ransom delinquent-schoolboy archetype |
| `rural_uncle` | ลุงต่างจังหวัด | vibe of a Thai country-bumpkin character-actor archetype (the "สีเทา" reference) — **user explicitly confirmed vibe-only, do not name the real actor** |
| `japanese_fighter` | คนญี่ปุ่นหน้าตาริว | vibe of an iconic white-headband martial-artist archetype — not a copy of any specific game character |
| `japanese_uncle_reviewer` | ลุงญี่ปุ่นนักรีวิวเบียร์ช้าง | user confirmed this is a generic archetype, not a specific real YouTuber — casual, jovial, mid-review-video vibe |
| `monk_young` | พระเด็ก | generic, no real-person issue |
| `monk_elder` | พระผู้ใหญ่ | generic, no real-person issue |
| `dog_golden` | หมาโกลเด้น | animal, no real-person issue |
| `rabbit` | กระต่าย | animal, no real-person issue |
| `dog_labrador` | หมาลาบราดอร์ | animal, no real-person issue |
| `romantic_hero` | พระเอกวัยรุ่น (Orange Road vibe) | vibe of an 80s romantic-comedy anime male lead archetype — not a copy of any specific IP character |
| `romantic_heroine` | นางเอกวัยรุ่น (Orange Road vibe) | vibe of an 80s romantic-comedy anime cool/aloof female lead archetype |
| `plaintiff_lawyer` | ทนายฝ่ายโจทก์ (civil) | user confirmed generic lawyer archetype, not a specific real lawyer — also fills the "civil plaintiff's lawyer" gap flagged in the character-pool-scaling memory (existing `prosecutor`/`defense_lawyer` only cover criminal cases) |
| `comedian_uncle` | ลุงตลกหัวล้าน | vibe of a beloved bald Thai comedian archetype (the "น้าค่อม" reference) — **user explicitly confirmed vibe-only, do not name the real person** |

**"ซ้อกาด" clarified (2026-08-02): a petite, pretty young woman (หญิงสาวสวยร่างเล็ก).**
No further reference/archetype given beyond that — treat as a generic build description,
not tied to any named real person or IP. Not designed/prompted yet; queued as the 16th
turnaround sheet for the next art-generation session, same Track B pipeline as the rest
of section 2e (Gem model sheet first, close-ups later).

**Turnaround-sheet prompts** (send to the Gem, same fixed 4-view layout as
section 2/3 — front / 3-4 front / side / back, plain flat light-gray background):

```
Character brief: "เสมียนศาล" (a young female court clerk), adult, early-90s
American-supermodel-glamour vibe — sharp cheekbones, confident sultry
expression, glossy voluminous hair, fitted but professional court-clerk blazer
and blouse, holding a folder/stamp. Same fixed layout as other characters: four
views side by side (front, 3/4 front, side, back), same design/colors across
all four, plain flat light-gray background, no props besides the folder, no
text.
```
```
Character brief: "คนร้าย" (a menacing crime boss), adult male, exaggerated
1980s manga-villain archetype — broad muscular build, angular jaw, scars,
spiked or slicked-back dramatic hair, dark leather/bondage-influenced jacket,
intimidating scowl. Same fixed layout as other characters: four views side by
side (front, 3/4 front, side, back), same design/colors across all four, plain
flat light-gray background, no props, no text.
```
```
Character brief: "นักเลง" (a teenage delinquent thug), male teen, Japanese
delinquent-schoolboy archetype — tall pompadour hairstyle, long dark school
uniform jacket (gakuran-style) worn open, cocky sneer, hands in pockets. Same
fixed layout as other characters: four views side by side (front, 3/4 front,
side, back), same design/colors across all four, plain flat light-gray
background, no props, no text.
```
```
Character brief: "ลุงต่างจังหวัด" (a rural Thai uncle), older adult male,
country-bumpkin character-actor archetype — weathered tan face, big warm
comedic grin, simple rolled-up-sleeve shirt and old trousers, sandals, relaxed
provincial posture. Same fixed layout as other characters: four views side by
side (front, 3/4 front, side, back), same design/colors across all four, plain
flat light-gray background, no props, no text.
```
```
Character brief: "คนญี่ปุ่นนักสู้" (a Japanese martial artist), adult male,
iconic white headband, red fingerless gloves, sleeveless white martial-arts gi,
lean muscular build, determined focused expression. Same fixed layout as other
characters: four views side by side (front, 3/4 front, side, back), same
design/colors across all four, plain flat light-gray background, no props, no
text.
```
```
Character brief: "ลุงญี่ปุ่นนักรีวิว" (a jovial Japanese uncle reviewer),
middle-aged male, casual polo shirt, slightly flushed cheeks mid-review,
holding a beer can, big friendly laughing expression, relaxed slouched
posture. Same fixed layout as other characters: four views side by side
(front, 3/4 front, side, back), same design/colors across all four, plain flat
light-gray background, no props besides the beer can, no text.
```
```
Character brief: "พระเด็ก" (a young Buddhist novice monk), child/pre-teen,
saffron-orange robes worn traditionally, shaved head, gentle innocent
expression. Same fixed layout as other characters: four views side by side
(front, 3/4 front, side, back), same design/colors across all four, plain flat
light-gray background, no props, no text.
```
```
Character brief: "พระผู้ใหญ่" (a senior Buddhist monk), elderly male, deep
saffron/maroon robes, shaved head, serene wise expression, slight stoop. Same
fixed layout as other characters: four views side by side (front, 3/4 front,
side, back), same design/colors across all four, plain flat light-gray
background, no props, no text.
```
```
Character brief: "หมาโกลเด้น" (a golden retriever dog), friendly adult dog,
golden fluffy fur, tongue out, happy alert posture, Studio-Ghibli-inflected
soft linework matching the existing หมูเด้ง/โจนาห์ animal characters. Same
fixed layout: four views side by side (front, 3/4 front, side, back), same
design/colors across all four, plain flat light-gray background, no props, no
text.
```
```
Character brief: "กระต่าย" (a rabbit), small cute rabbit, soft white/brown fur,
long upright ears, same Studio-Ghibli-inflected soft linework as the other
animal characters. Same fixed layout: four views side by side (front, 3/4
front, side, back), same design/colors across all four, plain flat light-gray
background, no props, no text.
```
```
Character brief: "หมาลาบราดอร์" (a labrador dog), adult dog, short cream or
chocolate-brown coat, calm gentle expression, same Studio-Ghibli-inflected soft
linework as the other animal characters — visually distinct build/coat from
the golden retriever character (stockier, shorter coat) so the two read as
different dogs on screen. Same fixed layout: four views side by side (front,
3/4 front, side, back), same design/colors across all four, plain flat
light-gray background, no props, no text.
```
```
Character brief: "พระเอกวัยรุ่น" (a teen romantic male lead), male teen,
80s-retro casual school-uniform-adjacent look, floppy feathered hair, easygoing
warm smile, hands-in-pockets relaxed stance. Same fixed layout: four views side
by side (front, 3/4 front, side, back), same design/colors across all four,
plain flat light-gray background, no props, no text.
```
```
Character brief: "นางเอกวัยรุ่น" (a teen romantic female lead), female teen,
80s-retro cool/aloof archetype, long straight dark hair, sharp confident stare,
stylish casual outfit (skirt + blazer or fitted top), arms crossed. Same fixed
layout: four views side by side (front, 3/4 front, side, back), same
design/colors across all four, plain flat light-gray background, no props, no
text.
```
```
Character brief: "ทนายฝ่ายโจทก์" (a civil plaintiff's lawyer), adult, formal
business-formal suit distinct in color from the existing `defense_lawyer`
(navy) and `prosecutor` (dark navy/red-tie) characters — use a charcoal-gray
suit with a subtle patterned tie — holding a folder of documents, composed and
earnest demeanor arguing a civil claim. Same fixed layout: four views side by
side (front, 3/4 front, side, back), same design/colors across all four, plain
flat light-gray background, no props besides the folder, no text.
```
```
Character brief: "ลุงตลก" (a beloved comedic Thai uncle), older adult male,
bald head, warm exaggerated comedic grin, mustache, simple loud/colorful
casual shirt, animated comedic posture. Same fixed layout: four views side by
side (front, 3/4 front, side, back), same design/colors across all four, plain
flat light-gray background, no props, no text.
```

---

## 8. Item props (Track C — simple prop icons, added 2026-08-02)

Small reusable prop images for scenario beats (a weapon shown in a charge, a
key evidence item, etc.) — not character portraits, so a lighter style: a single
object rendered in the same clean anime/webtoon linework as the character
portraits, isolated on a plain background so it can be dropped into a dialogue
beat or evidence-display UI later.

Style tag to append to every item prompt:
```
single isolated object illustration, clean anime/webtoon linework, soft
painterly shading, plain flat light-gray background, no hands, no characters,
no text, no logo, centered composition
```

New folder/convention: `pics/game/items/<id>.png`

| id | Thai | note |
|---|---|---|
| `item_gun` | ปืน | stylized handgun silhouette, not graphic/realistic detail (all-ages educational site) |
| `item_knife` | มีด | stylized knife, not graphic/realistic detail |
| `item_keys` | กุญแจ | a simple keyring with 2-3 keys |

```
Object: a stylized handgun (pistol), simple clean silhouette-style rendering
appropriate for an all-ages educational game (not graphic/hyper-realistic),
[style tag above]
```
```
Object: a stylized knife, simple clean silhouette-style rendering appropriate
for an all-ages educational game (not graphic/hyper-realistic), [style tag
above]
```
```
Object: a simple keyring holding 2-3 keys, [style tag above]
```

(The 4th requested item, "รถขนซุงที่ตก" — a fallen/crashed log truck — is a full
scene, not a small prop; see section 9's `logging_truck_accident` background
instead.)

---

## 9. New background scenes, batch 2 (Track A, added 2026-08-02)

Same isometric Track A style as section 5 — style tag to append to every prompt:
```
isometric 3/4 top-down game-asset illustration, clean semi-realistic
anime-influenced cartoon style, soft cel shading, no heavy outlines, warm
cinematic lighting, highly detailed environment, single wide establishing
shot, no visible UI or text
```

| id | Thai | note |
|---|---|---|
| `house` | บ้าน | generic Thai home interior/exterior |
| `car` | รถ | car interior or roadside exterior |
| `boat` | เรือ | boat deck/interior |
| `plane` | เครื่องบิน | airplane cabin interior |
| `restaurant` | ร้านอาหาร | restaurant interior |
| `logging_truck_accident` | รถขนซุงที่ตก | the fallen-log-truck fact pattern from the example scenario — a truck off the road with logs scattered across it |

```
A cozy traditional Thai house, interior living area visible with some exterior
yard, isometric 3/4 top-down view, warm domestic lighting, [style tag from
section 5]
```
```
A car scene — roadside exterior view of a parked sedan at dusk with headlights
on, isometric 3/4 top-down view, [style tag from section 5]
```
```
The deck of a small wooden boat on calm water, isometric 3/4 top-down view,
[style tag from section 5]
```
```
The interior cabin of a commercial airplane, rows of seats and overhead bins,
isometric 3/4 top-down view, [style tag from section 5]
```
```
A cozy Thai restaurant interior, dining tables and a service counter,
isometric 3/4 top-down view, [style tag from section 5]
```
```
A large logging truck overturned/skidded off a rural road at dusk, several
large cut logs scattered across the roadway, damaged guardrail, dim headlight
glow, isometric 3/4 top-down view, [style tag from section 5]
```

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
