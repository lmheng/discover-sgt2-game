# wiTTy's Translation Rescue

A 2-minute arcade mini-game for **SG Translate 2.0** (MDDI), built for the {discover} Showcase 2026 booth (27 Nov 2026). Players clear three missions:

1. **Translation Rush**: route requests to SG Translate Together, Polyglot or the SGT 2.0 API.
2. **Terminology Detective**: spot the term that breaks the glossary. No other language needed.
3. **Save the Launch**: run SGT, schedule human reviewers, fix issues and publish before the countdown ends.

Between missions, short "Real mission" steps (anonymous, unscored, skippable) gather evidence about how public officers translate today. These steps reuse each mission's mechanic.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000 (mobile mode) · /kiosk (booth mode) · /admin
npm test               # unit tests
npm run build && npm run test:e2e   # Playwright: mobile, laptop, kiosk
```

To enable the admin dashboard, run `npm run admin:hash -- "<passcode>"` and put the output in `.env.local` (see `.env.example`). `/admin?demo=1` shows clearly labelled synthetic data.

## Routes

| Route | Purpose |
|---|---|
| `/` | Mobile / personal-device mode |
| `/kiosk` | Booth mode: attract loop, idle reset, staff panel (Shift+S or long-press the top-left corner) |
| `/admin` | Insights dashboard (passcode) |
| `/print/instruction-card` | Printable A5 tabletop card |

## Configuration

- Event settings: `src/config/events/*.json` (choose one with `NEXT_PUBLIC_EVENT_ID`). Reuse at another roadshow by adding a file; no code change is needed.
- Mission and research content: `src/config/content/*.json` (validated at build).
- Brand assets: `public/brand/` + `src/config/brand.ts` (placeholders until the approved art arrives).

## Documentation

| | |
|---|---|
| Planning | [PRD](docs/01-prd.md) · [Flow & screens](docs/02-game-flow-screen-map.md) · [Architecture](docs/03-component-architecture.md) · [Data model](docs/04-data-model.md) · [Analytics events](docs/05-analytics-event-spec.md) · [Milestones](docs/06-milestones.md) · [Risks](docs/07-risks-assumptions.md) |
| Research | [Interaction](docs/research/01-research-interaction.md) · [Schema & validation](docs/research/02-response-schema-and-validation.md) · [Consent & privacy](docs/research/03-consent-and-privacy.md) · [Data dictionary](docs/research/04-data-dictionary.md) · [Dashboard spec](docs/research/05-dashboard-spec.md) |
| Deployment | [Architecture](docs/deployment/01-architecture.md) · [Options A/B/C](docs/deployment/02-integration-options.md) · [Security](docs/deployment/03-security-checklist.md) · [Testing](docs/deployment/04-testing-checklist.md) · [Offline fallback](docs/deployment/05-offline-fallback.md) · [Deploy steps](docs/deployment/06-production-deployment.md) · [Event-day guide](docs/deployment/07-event-day-guide.md) |
| Event | [Staff script](docs/event/staff-script.md) · [Readiness checklist](docs/event/booth-readiness-checklist.md) · [Reset procedure](docs/event/reset-procedure.md) · [Report template](docs/event/analytics-report-template.md) · [Usability test](docs/event/usability-test-script.md) · [Asset request](docs/event/asset-request.md) |

## Principles

No personal data · no live translation API · synthetic, illustrative content (pending native-speaker review) · no accuracy claims · playing ≠ product interest · nothing is deployed externally without approval.
