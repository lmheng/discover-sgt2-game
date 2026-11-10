# Analytics event specification

Every record is validated in the client before queuing and again on the server. Unknown fields cause rejection. The envelope fields are listed in `04-data-model.md`.

| Stream | `type` | Fired when | Extra fields | Used for |
|---|---|---|---|---|
| gameplay | `session_started` | Start button, or Play again | `gameSessionId`, `attempt` | Sessions started; unique visitors |
| gameplay | `mission_completed` | A mission ends (timeout or success) | `mission`, `score`, `success`, `durationMs` | Mission difficulty tuning |
| gameplay | `session_completed` | Results screen first shown for an attempt | `totalScore`, `tier`, `durationMs`, `missionsSucceeded` | Completion rate; average duration |
| gameplay | `session_abandoned` | Kiosk idle reset or staff reset during a run | `reason` (`idle_reset`/`staff_reset`/`exit`), `stepKind` | Drop-off points |
| research | (snapshot) | After each research step (answered **or** skipped) | `answers` | Needs analysis (latest per visit) |
| interest | `interest_expressed` | "Yes, show me how" | none | Interest |
| interest | `interest_declined` | "Not now" | none | Context only |
| interest | `formsg_qr_shown` | QR rendered (kiosk or mobile) | none | QR exposure (scans can't be measured) |
| interest | `formsg_link_opened` | FormSG link tapped (mobile) | none | Visitors proceeding to FormSG |

## Rules

- Gameplay scores are **never** joined to research answers, in code or in reports.
- No event is fired on page view, hover or pointer movement. There is no behavioural tracking.
- Research is cumulative per visit. A replay never creates a new respondent, and research steps are not shown again on replay.
- `skipped` ≠ `none`. A skip is excluded from the denominator and counted separately.
- Server ingest: maximum 50 records and 64 KB per request; 30-request burst per client key, refilling at 60/min; same-origin only; event code must be configured; timestamps must fall within the retention window and no more than 5 minutes in the future.

## Delivery

`track()` → IndexedDB outbox → `POST /api/events` (batched) → JSONL. If the server is unreachable, records stay queued. Staff can export them as JSON from the staff panel, and an admin imports the file later. Duplicates are ignored.
