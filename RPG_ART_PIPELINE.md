# Lee RPG Art Pipeline (game-rpg-lee.html)

Asset generation plan for "ลี นักสู้กฎหมาย" — the Shigeru Mizuki / Junji Ito–flavored
turn-based law-quiz RPG. Code ships today with emoji fallbacks (same graceful-degrade
trick as `game-crimlaw-scenario.html`'s `portraitPath`/`onerror`), so the game is fully
playable before any art exists — drop PNGs into the paths below and they replace the
emoji automatically, no code changes needed.

Sprite IDs already wired into `game-rpg-lee.html` / `games/rpg-data.json`:

| sprite id | subject | role |
|---|---|---|
| `lee_lv1` … `lee_lv7` | — | Lee evolution stages (see table below) |
| `monster_intent_negligence` | civil | ผีจงใจประมาท (ม.420) |
| `monster_compensation_giant` | civil | ยักษ์ค่าสินไหมทดแทน (ม.438) |
| `monster_prescription_demon` | civil | ปีศาจขาดอายุความ (ม.448) |
| `monster_heirless_ghost` | civil | ผีทายาทไร้สิทธิ (ม.1599) |
| `monster_simulated_act_golem` | civil | โกเลมนิติกรรมอำพราง (ม.155) |
| `monster_two_faced_intent` | criminal | ปีศาจสองหน้าเจตนา (ม.59) |
| `monster_reaper_288` | criminal | มัจจุราชมาตรา 288 |
| `monster_quick_hands` | criminal | ยักษ์มือไว (ม.334) |

Asset paths:
- Lee: `pics/game/rpg/lee/<sprite>.png`
- Monsters: `pics/game/rpg/monsters/<sprite>.png`
- Battle backgrounds (one per subject, reused across its quests): `pics/game/rpg/backgrounds/<subjectId>.jpg` — `civil.jpg`, `criminal.jpg`, ...
- Hub hero thumbnail (for `games.html`'s `ACE_GAMES.rpg.bg`): `pics/game/hero/rpg.jpg`

---

## 1. Two separate style tracks (don't mix them)

**Track A — LEE (the cute, warm counterweight).** Rounded, soft-shaded, storybook-cute
Siamese cat — the visual opposite of the monsters, on purpose. The contrast between
"adorable cat" and "grotesque yokai" IS the joke/hook of the whole game, so never let
Lee's rendering drift toward the horror track's grime, ink-wash, or asymmetry.

Style tag to append to every Lee prompt:
```
cute storybook-illustration style, rounded soft-shaded forms, clean thick
outlines, warm gentle lighting, plain neutral background, single full-body
character, no text, no logo, front-facing 3/4 view suitable for a game sprite
```

**Track B — YOKAI MONSTERS (Mizuki × Junji Ito horror).** Traditional Japanese yokai
woodblock/ink-wash sensibility (Shigeru Mizuki: folkloric, slightly comic-grotesque,
visible brushwork) fused with Junji Ito's body-horror unease (asymmetry, too many
eyes/limbs, unsettling spirals, dread in mundane details). Desaturated, eerie palette —
never cute, never cartoon-cuddly.

Style tag to append to every monster prompt:
```
yokai horror illustration, Shigeru Mizuki ink-wash folkloric style fused with
Junji Ito body-horror unease, desaturated eerie palette, visible brushwork
texture, unsettling asymmetry, single full-body creature, plain dark
background, no text, no logo, front-facing pose suitable for a game sprite
```

**Track C — BATTLE BACKGROUNDS.** Wide establishing shots of the "haunted legal
realm" — courtrooms, archives, graveyards of contracts — painted in the same
Mizuki/Ito-adjacent eerie mood as the monsters, but composed as empty environments
(no characters) so Lee and the monster sprites can be layered on top in-game.

Style tag to append to every background prompt:
```
eerie haunted environment illustration, Shigeru Mizuki / Junji Ito-adjacent
horror-folklore mood, desaturated palette with one eerie accent color, wide
game-background establishing shot, no characters, no UI, no text
```

---

## 2. Lee evolution stages (7 levels)

| level | sprite id | look |
|---|---|---|
| 1 | `lee_lv1` | Ordinary Siamese cat, walking on four legs, brown body / black face (ears, mask, paws, tail) |
| 5 | `lee_lv2` | Stands upright on two legs, holds a small wooden judge's gavel |
| 10 | `lee_lv3` | Adds a worn student's academic robe (open, slightly oversized) over the body |
| 16 | `lee_lv4` | Adds a junior lawyer's satchel + light chest armor plate over the robe |
| 23 | `lee_lv5` | Robe becomes a faintly glowing silver graduate gown |
| 31 | `lee_lv6` | Partial gold armor plating over the gown; carries the code-of-law book as a shield |
| 40 | `lee_lv7` | Full golden Thai lawyer's ceremonial gown (ชุดครุยทอง); wields a glowing Civil & Commercial Code book as a weapon |

---

## 3. Three ready-to-paste prompts

### Prompt 1 — Lee evolution reference sheet (Track A)
```
A reference sheet of a small Siamese cat character named Lee shown in one
continuous horizontal row at 3 stages of growth: (1) an ordinary Siamese cat
walking on all four legs, brown body with a black face mask, ears, paws and
tail; (2) the same cat standing upright on two legs, holding a small wooden
judge's gavel, wearing a slightly oversized open academic robe; (3) the same
cat in a full golden ceremonial Thai lawyer's gown (ชุดครุยทอง), standing
heroically, holding a glowing law book radiating soft gold light as a weapon.
Consistent character design and proportions across all 3, evenly spaced,
matching lighting. cute storybook-illustration style, rounded soft-shaded
forms, clean thick outlines, warm gentle lighting, plain neutral background,
no text, no logo, character-sheet reference layout.
```

### Prompt 2 — Yokai monster: "ปีศาจขาดอายุความ" / Statute-of-Limitations Demon (Track B)
```
A yokai spirit shaped like a tall, gaunt hooded figure whose body is fused
with a large cracked hourglass — sand made of tiny falling calendar pages and
kanji-like Thai script leaking out through cracks in its ribcage. Long thin
grey limbs, a face that is mostly shadow except for one wide unblinking eye
staring out from beneath the hood. Yokai horror illustration, Shigeru Mizuki
ink-wash folkloric style fused with Junji Ito body-horror unease, desaturated
eerie palette with a single sickly amber accent color, visible brushwork
texture, unsettling asymmetry, single full-body creature, plain dark
background, no text, no logo, front-facing pose suitable for a game sprite.
```

### Prompt 3 — Battle background: haunted courtroom archive (Track C)
```
A vast, decaying courtroom archive at night, endless rows of leaning shelves
stacked with crumbling case files and law books, cobwebs strung between them
like veils, a single shaft of cold moonlight cutting through a broken skylight
onto the empty judge's bench in the distance, faint mist pooling on the floor.
Eerie haunted environment illustration, Shigeru Mizuki / Junji Ito-adjacent
horror-folklore mood, desaturated palette with one eerie moonlight-blue accent
color, wide game-background establishing shot, no characters, no UI, no text.
```

---

## 4. Suggested generation order

1. `lee_lv1`, `lee_lv2`, `lee_lv7` first (Prompt 1 covers all three in one sheet —
   crop into 3 separate transparent PNGs afterward, same workflow as the courtroom
   game's portrait pipeline). Fill in lv3/4/5/6 once the silhouette language is locked.
2. The two boss monsters (`monster_prescription_demon`, `monster_reaper_288`) — they're
   the most-seen sprites early on and validate the horror style tag before batching the
   other 6.
3. `pics/game/rpg/backgrounds/civil.jpg` and `criminal.jpg` — only 2 needed for the
   current MVP quest list (all civil quests share one background, all criminal quests
   share the other).
4. `pics/game/hero/rpg.jpg` for the `games.html` hub thumbnail — reuse the Prompt-3
   style tag, framed as a poster composition instead of an empty establishing shot
   (Lee small in the mist, monster looming in the background, per the site's existing
   `.ace-hero` poster convention).
