# Image and asset request

The game ships with **neutral labelled placeholders**. It never draws a substitute mascot. Please supply the approved files below. Drop them in `public/brand/` and set their paths in `src/config/brand.ts`.

| # | Asset | File name | Format and size | Used on |
|---|---|---|---|---|
| 1 | wiTTy – idle (neutral, friendly) | `witty/idle.png` | Transparent PNG, ≥ 1024×1024, character centred, ~5% padding | Title, mission scenes |
| 2 | wiTTy – celebrate (happy, arms up) | `witty/celebrate.png` | same | Correct answers, mission success |
| 3 | wiTTy – oops (surprised or sheepish, not sad) | `witty/oops.png` | same | Mistakes, timeouts |
| 4 | wiTTy – thinking (curious, hand on chin) | `witty/thinking.png` | same | Research steps, tips |
| 5 | wiTTy – wave (greeting) | `witty/wave.png` | same | Attract, interest, thanks |
| 6 | wiTTy – cheer (big celebration) | `witty/cheer.png` | same | Final results |
| 7 | SG Translate 2.0 logo for dark backgrounds | `sgt2-logo-on-dark.svg` | SVG (or PNG ≥ 600 px wide) | Attract, title |
| 8 | SG Translate 2.0 logo for light backgrounds | `sgt2-logo-on-light.svg` | SVG | Print card, admin |
| 9 | Product icons: SG Translate Together, Polyglot, SGT 2.0 API | `icon-together.svg`, `icon-polyglot.svg`, `icon-api.svg` | SVG, square, single colour or brand colours | Rush docks |
| 10 | {discover} Showcase 2026 lockup (if use is approved) | `discover-2026-lockup.svg` | SVG | Attract footer |
| 11 | (Optional) Booth-monitor background art | `attract-bg.webp` | 1920×1080 WebP < 400 KB | Attract |

Notes:

- All six wiTTy poses should share the same canvas size and baseline, so swapping poses doesn't make the character jump.
- The game only moves, rotates or uniformly scales the images. It never recolours, crops or distorts them.
- If fewer poses are approved, any missing pose can fall back to `idle` (set its value to the idle path).
- No AI-generated replacement artwork, please.
