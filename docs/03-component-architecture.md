# Component architecture

```
src/
├─ app/                         Next.js App Router (Next 16, cacheComponents on)
│  ├─ page.tsx                  Mobile mode → <GameEntry mode="mobile">
│  ├─ kiosk/page.tsx            Kiosk mode  → <GameEntry mode="kiosk">
│  ├─ admin/page.tsx            Dashboard (guarded by proxy.ts + route checks)
│  ├─ admin/login/              Passcode sign-in
│  ├─ print/instruction-card/   Printable A5 tabletop card
│  └─ api/
│     ├─ events/route.ts        Anonymous ingest (validate → rate-limit → JSONL)
│     └─ admin/{login,logout,summary,export,import,leads,delete}/route.ts
├─ proxy.ts                     Admin guard (Next 16's renamed middleware)
├─ config/                      All content and event settings (JSON + zod schemas)
│  ├─ events/*.json             One file per event/roadshow
│  ├─ content/{rush,detective,launch,research}.json
│  ├─ brand.ts                  wiTTy PNG and logo slots (null = placeholder)
│  └─ index.ts                  Loader + validation (fails fast at build)
├─ lib/
│  ├─ game/                     PURE logic, no React
│  │  ├─ rng.ts                 Seeded mulberry32 + shuffles
│  │  ├─ scoring.ts             Integer scoring rules, combo, tiers
│  │  ├─ missions/{rush,detective,launch}.ts   (state, action) → state reducers
│  │  ├─ flow.ts                Run plan + flow state machine
│  │  └─ badges.ts              Badges and run summary
│  ├─ research/schema.ts        Answer schema + validation + toggle rules
│  ├─ analytics/{schema,records,client}.ts     Record streams, builders, IndexedDB outbox
│  ├─ admin/{aggregate,demoData}.ts            Pure aggregation, synthetic demo generator
│  ├─ server/{store,auth,rateLimit,csv,http}.ts Server-only helpers
│  └─ sound.ts                  WebAudio blips (muted by default)
└─ components/
   ├─ game/        GameEntry (client-only), GameApp (orchestrator), Screens, Hud, hooks, Confetti
   ├─ missions/    MissionShell, RushScene, DetectiveScene, LaunchScene
   ├─ research/    InterludeFrame, DeskSetup, ContentSort, MultiPick (CaseFiles, CrewBoard), PowerUpPick
   ├─ kiosk/       KioskLayer (idle guard, staff panel, GovEntry reminder)
   ├─ admin/       AdminDashboard, Charts (BarList, StackedOrdinal, CrossTabTable, KpiTile)
   ├─ mascot/      Witty (approved PNG or neutral placeholder)
   └─ ui/          Button, Icon
```

## Key design decisions

1. **The game logic is pure and deterministic.** Each mission is a reducer driven by `tick(dtMs)` and input actions. Randomness is used only at initialisation, through a seed, and deltas are clamped to 100 ms. This makes every mission unit-testable and replayable, and stops a backgrounded tab from skipping the game.
2. **One orchestrator.** `GameApp` owns the flow reducer, visit and attempt identity, research answers and analytics emission. Scenes receive `durationMs`, `seed` and `onComplete` only.
3. **Client-only game.** `GameEntry` loads `GameApp` with `ssr: false`, because the game needs random seeds, IndexedDB and timers. Pages still prerender a static loading shell.
4. **Content is configuration.** Missions read validated JSON. Content tests enforce invariants (for example, exactly one odd term per Detective round).
5. **Separation of data streams** is enforced in the schema (`stream` discriminator, strict objects) and in storage (one file per stream).
6. **Admin is server-aggregated.** The dashboard receives aggregates only. Participant-level rows are available only through authenticated CSV export.
7. **Mascot integrity.** `Witty` never draws a character. Animations are limited to translate, rotate and uniform scale.

## Input model

| Mission | Pointer | Touch | Keyboard |
|---|---|---|---|
| Rush | Drag card onto dock (Motion `drag` + `elementsFromPoint`) | Tap card → tap dock | `1` `2` `3` route the selected or front card |
| Detective | Click segment | Tap segment | Tab to segment, Enter |
| Launch | Drag reviewer onto lane | Tap reviewer → "Assign", or "Send for review" | Tab, Enter |
| Interludes | Drag / click | Tap | Tab, Enter/Space; Content sort `1`/`2` |
