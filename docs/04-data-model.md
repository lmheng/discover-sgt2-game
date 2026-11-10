# Data model

The source of truth is the zod schemas: `src/lib/analytics/schema.ts` and `src/lib/research/schema.ts`. Field-level definitions are in `research/04-data-dictionary.md`.

## Identity

| Id | Scope | Generated | Persisted where | Purpose |
|---|---|---|---|---|
| `visitId` | One visitor. Kiosk: until reset or idle reset. Mobile: browser tab session (`sessionStorage`) | Random UUID v4 | Every record | De-duplicates research to one per visitor, and links interest to research for "interest by function" |
| `gameSessionId` | One play attempt | Random UUID v4 | Gameplay records | Counts sessions and replays |
| `recordId` | One record | Random UUID v4 | Every record | Idempotent ingest (retries never double-count) |

These IDs are random and carry no device or personal information. **Not collected:** names, emails, NRIC, IP addresses (used only transiently for rate limiting, in memory), user agent, device fingerprints, location, free text.

## Envelope (all streams)

`recordId, visitId, eventCode, source (kiosk|mobile), consentStatus ("implied_by_play"), schemaVersion (1), recordedAt (ISO 8601 UTC)`

## Streams

```
gameplay  ── type: session_started | mission_completed | session_completed | session_abandoned
            + gameSessionId, attempt, [mission, score, success, durationMs, totalScore, tier,
              missionsSucceeded, reason, stepKind]
research  ── answers: { workFunction?, frequency?, contentTypes?, challenges?, tools?, capability? }
            each answer = {status:"answered", value|values} | {status:"skipped"} | {status:"not_applicable"}
            records are cumulative snapshots; the latest per visitId wins
interest  ── type: interest_expressed | interest_declined | formsg_qr_shown | formsg_link_opened
leads     ── manual aggregate { eventCode, count, updatedAt } typed in by an admin from FormSG
```

Optional follow-up registration happens **only in FormSG** and is never stored by this app.

## Storage

| Layer | Technology | Notes |
|---|---|---|
| Client outbox | IndexedDB `witty-outbox/records` (in-memory fallback) | Survives refresh. Flushed every 30 s, on `online`, and after each record |
| Server (kiosk/local) | `DATA_DIR/{gameplay,research,interest}.jsonl` + `leads.json` | Append-only. De-duplicated by `recordId`. Retention purge |
| Server (hosted, option B) | Replace `lib/server/store.ts` with an approved DB adapter | Same function signatures |

## Configuration model

- `config/events/<id>.json`: event name, date, hours, FormSG URL, GovEntry reminder copy, `researchEnabled`, mission durations, kiosk timings and staff PIN.
- `config/content/*.json`: mission content and research options, including `reviewStatus` for non-English strings.
- `config/brand.ts`: asset slots.
