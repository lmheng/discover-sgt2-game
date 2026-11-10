# Research interaction: "Real missions"

The research questions are woven into the run as short interludes. Each one reuses the mechanic of the mission just played, so it feels like part of the game. It is still clearly framed as *not* gameplay:

- a distinct striped background and a dashed "REAL MISSION · NOT SCORED" chip (a pattern plus a label, not colour alone);
- no timer, score, combo or HUD;
- a Skip button on every step, recorded as `skipped`;
- answers never change score, difficulty or badges, which removes any incentive to "game" them.

| Order | Interlude | Question (captured as) | Mechanic | Options |
|---|---|---|---|---|
| Before Mission 1 | Set up your rescue desk | Work function (single) | Nameplate cards | Communications · Frontline / service delivery · Product / engineering / design · Operations / corporate · Something else · Prefer not to say |
| Same screen | (lamp dial) | Translation frequency (single, ordinal) | 5-stop dial; lamp glow is cosmetic | Daily · Weekly · Monthly · Rarely · Never |
| After Rush | What lands on your real desk? | Content types (multi) | Fling cards to "On my desk" / "Not me" (Rush mechanic) | Public notices & press releases · Letters & emails · Website pages · Forms & digital services · Social media · Posters/brochures/signage · App or chatbot text · Internal documents · Something else |
| After Detective | Which case files sound familiar? | Challenges (multi) | Tap-to-stamp (Detective mechanic) | Waiting too long · Cost · Getting government terms right · Keeping wording consistent · Checking quality · Coordinating people and approvals · Something else · None of these (exclusive) |
| After Launch | Who's on your real translation crew? | Current tools (multi) | Drag tokens to a crew board (Launch reviewer mechanic) | General AI chat tools · Online machine translation · Translation vendors · In-house translators · Bilingual colleagues · Something else · No usual crew (exclusive) |
| Before results | Pick wiTTy's next power-up | Most relevant capability (single) | Power-up orbs | Web portal · Website translation · API for apps & systems · Government glossary · None of these · Not sure yet |

**Content types are skipped automatically** (recorded as `not_applicable`) when frequency is "Never".

**Interest is not a research question.** It is a separate, explicit opt-in on the results screen ("See how SGT 2.0 fits your work"). Play is never treated as interest.

## Bias controls

- Option order is shuffled once per visit (seeded). "Something else", "None" and "Prefer not to say" stay last.
- Neutral wording: no product names in the challenge or tool options; capabilities are described generically.
- "None" and "not applicable" options are present, and skip is distinct from "none".
- Questions appear after play, but answers are never related to performance.
- Known caveat: challenges are asked straight after the terminology mission, which may prime "terminology" and "consistency". The dashboard flags this.

## Time budget

About 6–10 s per step, 30–45 s in total. The automated E2E run completes all six steps in under 20 s of interaction.
