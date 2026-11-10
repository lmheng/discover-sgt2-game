# Analytics dashboard specification

Route: `/admin`. Access: authorised admins only (scrypt passcode, signed HttpOnly cookie, 8 h session). It is implemented in `src/components/admin/` and `src/lib/admin/aggregate.ts`.

## Principles

- Only real collected records are used. Nothing is pre-populated.
- **Demo mode** (`/admin?demo=1`) uses an in-memory synthetic generator. It shows a persistent "SYNTHETIC DEMO DATA" banner, its exports are prefixed `SYNTHETIC-DEMO-`, it uses the event code `demo-synthetic`, and it is never written to the store.
- Every percentage shows `count of n`. Denominators are named.
- Every view is labelled as a self-selected sample of showcase participants.
- Needs are not summarised for fewer than 5 respondents (`MIN_REPORTABLE_N`).
- Kept distinct: unique visitors, sessions started, games completed, research respondents, interested participants, FormSG link opens, onboarding leads (manual).

## Layout

1. **Header**: title, mode, generated time, Executive summary toggle, Demo toggle, Log out.
2. **Sample note**.
3. **Filters** (one row): Event · From · To (SGT dates) · Work function · Frequency · Capability · Clear. Research filters apply to needs and interest metrics. Participation is filtered by event and date only, and the page says so.
4. **Executive summary**: generated sentences with n (participation, research rate, frequent translators, top challenge, "no challenges" share, top tool, top capability, interest, leads).
5. **KPI tiles**: unique visitors, sessions started, games completed (with completion rate), average play duration, research respondents, research participation, % no significant challenges, expressed interest.
6. **Funnel table**: visitors → completed → shared research → interested → opened FormSG → onboarding leads (manual), with notes.
7. **Translation needs**: one bar list per question, with answered / skipped / not-applicable counts and a multi-select note. The challenges chart carries a priming caveat.
8. **Comparisons**:
   - Stacked 100% bar: frequency by work function (ordinal blue ramp, legend, table toggle).
   - Cross-tab heat tables: challenges by frequency; capability by work function (row %).
9. **Engagement**: interest by work function (bar list); interest by event (table); FormSG link opens, QR displays and declines.
10. **Data management**: CSV export per stream (current filters); import a kiosk queue JSON; enter onboarding leads per event; delete all (typed confirmation). Retention days are shown.

## Visual rules

These follow the data-viz guidance: single-hue bars for single-series magnitude, an ordinal blue ramp validated in light and dark modes, 4 px rounded data ends, recessive grid, text in text tokens, a hover or focus tooltip on every mark, a table view for each chart, no dual axes, and dark mode supported through tokens.

## Executive summary view

The toggle hides the detailed charts and leaves the summary, KPIs and funnel for leadership updates.
