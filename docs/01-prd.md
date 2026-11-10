# Product requirements: wiTTy's Translation Rescue

| | |
|---|---|
| Product | wiTTy's Translation Rescue, a booth mini-game for SG Translate 2.0 (SGT 2.0) |
| Owner | SGT 2.0 product team, MDDI |
| First event | {discover} Showcase 2026, 27 November 2026 (booth 10:00–15:30, setup 09:00–10:00) |
| Audience | GovTech staff and other public officers: PMs, engineers, designers, communications officers, digital service owners |
| Status | Playable build; content pending native-speaker review |

## 1. Problem

Public officers translate letters, notices, web pages and app text into Chinese, Malay and Tamil. That work is often slow, inconsistent in its terminology, and hard to coordinate across reviewers. SGT 2.0 covers different jobs with different tools: SG Translate Together (web portal), Polyglot (website translation) and the SGT 2.0 API (integration). Many officers don't know which tool fits which job. The team also has little evidence about how often officers translate, what they translate, and where it hurts.

## 2. Goals

1. **Attract**: draw visitors to a small booth (2–3 desks and a monitor) with a game that looks fun from a few metres away.
2. **Delight**: give a genuinely enjoyable arcade experience of 90–120 seconds.
3. **Educate**: introduce three real translation challenges: picking the right tool, consistent terminology, and timely publishing with human review.
4. **Raise awareness** of SGT 2.0 and what each product is for, without making accuracy claims.
5. **Learn**: collect useful, low-bias, anonymous evidence about translation needs.
6. **Convert honestly**: let relevant visitors register interest through the existing FormSG, as a separate and explicit choice.

## 3. Non-goals

- No live translation and no calls to production SGT 2.0 APIs.
- No accounts, logins or personal data during play.
- Not a survey disguised as a game. Research steps are labelled "Real mission · not scored" and never affect the score.
- No claims about translation quality or accuracy.
- Not a substitute for GovEntry. The game never shows a GovEntry stamp QR.

## 4. Users and context

| Persona | Context | Need |
|---|---|---|
| Walk-up visitor | Has 2–3 minutes between booths, standing, may not speak Chinese, Malay or Tamil | Instant understanding, large targets, quick win |
| Comms officer | Translates notices weekly | Sees terminology and turnaround problems reflected |
| Digital service owner or engineer | Builds forms and chatbots | Learns the API exists for in-app translation |
| Booth staff | Runs the booth for 5.5 hours | Reset, reminders and an offline fallback without a keyboard or devtools |
| SGT team analyst | After the event | Honest, de-duplicated aggregates with denominators |

## 5. Experience requirements

| ID | Requirement | Status |
|---|---|---|
| G1 | Three missions: Translation Rush, Terminology Detective, Save the Launch | Done |
| G2 | Total session 90–120 s (missions 30 s / 28 s / 30 s, plus about 35–45 s of research steps) | Done (configurable) |
| G3 | Countdown, score, combo multiplier, progress dots, success and failure states, replay | Done |
| G4 | wiTTy reactions: idle, celebrate, oops, thinking, wave, cheer | Done (placeholder art) |
| G5 | Drag-and-drop plus tap-to-select plus keyboard for every action | Done |
| G6 | No penalty for not knowing another language: Detective is visual matching; Rush cards are in English | Done |
| G7 | Deterministic, integer scoring with unit tests | Done |
| G8 | Respect reduced motion, colour-independent feedback, at least 48 px targets | Done |
| K1 | Kiosk mode: attract loop, idle warning then reset, staff panel, no browser navigation needed | Done |
| K2 | Staff-controlled GovEntry reminder (text only) | Done |
| R1 | Research woven into gameplay as skippable, unscored "Real missions" | Done |
| R2 | Separate streams: gameplay, research and interest (FormSG registration stays in FormSG) | Done |
| A1 | Admin dashboard with KPIs, distributions, cross-tabs, funnel, CSV, demo mode | Done |
| C1 | Reuse at another roadshow through config only | Done |

## 6. Success metrics (for the event report)

All of these are reported with n and denominators, as a self-selected sample.

- Unique visitors who started a game, and the game completion rate.
- Research participation rate (respondents ÷ unique visitors).
- The share of respondents who skip each research step, used to check data quality.
- Expressed interest ÷ unique visitors, and FormSG link opens. Onboarding leads are entered manually from FormSG.
- Qualitative: staff observations of confusion points (see `event/usability-test-script.md`).

There is deliberately **no target** that rewards pushing visitors toward "interest". Play is not taken as interest.

## 7. Constraints

Mobile-first but playable on laptops and booth monitors. Next.js App Router, strict TypeScript, Tailwind, Motion. No external AI calls. Synthetic, pre-approved content only. Works offline on the booth laptop. Must not be deployed externally without security and hosting approval.

## 8. Open items

- Native-speaker or SGT team review of all Chinese, Malay and Tamil strings (`reviewStatus` in content files).
- The approved wiTTy PNGs and the SGT 2.0 logo (see `event/asset-request.md`).
- The official FormSG URL (`formsgUrl` in the event config).
- Hosting approval, if the QR or mobile mode is wanted (see `deployment/02-integration-options.md`).
