# Response schema and validation rules

Source: `src/lib/research/schema.ts` and `src/lib/analytics/schema.ts`. Option IDs come from `src/config/content/research.json`.

```ts
type Single = { status: "answered"; value: OptionId } | { status: "skipped" };
type Multi  = { status: "answered"; values: OptionId[] } | { status: "skipped" } | { status: "not_applicable" /* contentTypes only */ };

interface ResearchRecord {
  stream: "research";
  recordId: uuid; visitId: uuid; eventCode: string;
  source: "kiosk" | "mobile";
  consentStatus: "implied_by_play";
  schemaVersion: 1;
  recordedAt: ISO-8601;
  answers: {
    workFunction?: Single; frequency?: Single; contentTypes?: Multi;
    challenges?: Multi; tools?: Multi; capability?: Single;
  };
}
```

## Validation rules (enforced on client and server)

1. Objects are **strict**: unknown keys are rejected, at both the record and the answer level. This blocks free text and personal-data fields.
2. Every `value` and `values[i]` must be a configured option ID for that question.
3. Multi-select values must be unique, and there can be no more of them than the number of options.
4. Exclusive options (`none` for challenges and tools) cannot be combined with others.
5. `contentTypes: not_applicable` is valid only when `frequency` is answered `never`.
6. `visitId` and `recordId` must be UUIDs, and `eventCode` must be a configured event.
7. `recordedAt` must be within the retention window and no more than 5 minutes in the future.
8. A respondent is a visit whose latest record has **at least one answered** question. Skips alone don't count.
9. Duplicates (same `recordId`) are ignored. Multiple snapshots per visit are reduced to the latest.

## UI rules

- Challenges and tools: "Done" is disabled until at least one option is chosen. Choose "None" or press Skip otherwise.
- Content sort: unsorted cards when "Done sorting" is pressed are treated as not selected. Finishing with nothing on the desk is recorded as `answered` with `values: []` and reported as "selected none of the listed".
