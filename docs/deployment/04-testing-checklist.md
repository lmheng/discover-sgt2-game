# Testing checklist

## Automated (run before every release)

```bash
npm run typecheck && npm run lint && npm test     # 75 unit tests
npm run build && npm run test:e2e                 # 31 E2E tests × mobile-390 / laptop-1366 / kiosk-1920
```

| Area | Covered by |
|---|---|
| Deterministic scoring and combos | `scoring.test.ts` |
| Mission reducers (Rush, Detective, Launch) | `rush/detective/launch.test.ts` |
| Flow, replay, research not re-asked | `flow.test.ts`, `game.spec.ts` |
| Content invariants (one odd term, balanced Rush deck, opt-out options) | `content.test.ts` |
| Research validation and PII rejection | `research.test.ts` |
| Aggregation integrity (dedupe, denominators, filters, SGT dates, small-n) | `aggregate.test.ts` |
| Ingest, store, retention, CSV, auth, rate limit | `server.test.ts` |
| Full touch run with all research steps | `game.spec.ts` (all viewports) |
| Keyboard-only Rush | `game.spec.ts` |
| Reduced motion | `game.spec.ts` |
| axe WCAG A/AA (no serious or critical issues) on title, desk, intro | `game.spec.ts` |
| No horizontal overflow | `game.spec.ts` |
| Kiosk attract → idle warning → dismiss → reset (real time) | `game.spec.ts` (kiosk-1920) |
| Staff panel + text-only GovEntry reminder + reset | `game.spec.ts` |
| Admin protection, login, CSV, demo watermark | `admin.spec.ts` |

## Manual (on the actual booth hardware)

- [ ] Chrome kiosk launch; fullscreen; no browser chrome reachable by touch.
- [ ] Touch drag works on the monitor (if it is a touchscreen) and with a mouse.
- [ ] Animations are smooth (DevTools Performance, 4× CPU throttle: no long frames > 50 ms during Rush).
- [ ] Unplug the network: play a full game; staff panel shows 0 pending (local server).
- [ ] Stop the server mid-game: records queue; restart; "Sync now" clears the queue.
- [ ] Export the queue JSON → import in admin → counts update with no duplicates.
- [ ] Windows text scaling at 125% and 150%: no clipped buttons.
- [ ] High-contrast / forced-colours mode: feedback still readable (icons and text).
- [ ] Screen reader spot check (NVDA): mission feedback is announced.
- [ ] Sound toggle works; default is muted.

## Mobile usability test (human; required before "ready")

Run `docs/event/usability-test-script.md` with **at least 5 public officers** (2 on phone, 3 at the kiosk). Record task success, time and confusion points. Automated tests do **not** replace this.
