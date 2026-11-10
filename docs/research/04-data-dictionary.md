# Data dictionary

## Common fields (all CSVs)

| Field | Type | Description |
|---|---|---|
| recordId | UUID | Unique per record; used for de-duplication |
| visitId | UUID | Random per visitor (kiosk: until reset; mobile: per tab session). Not linked to any person |
| eventCode | string | Event config ID, e.g. `discover-2026` |
| source | `kiosk` \| `mobile` | Where the record came from |
| consentStatus | `implied_by_play` | Basis for research collection |
| schemaVersion | integer | 1 |
| recordedAt | ISO 8601 UTC | Client time when the record was created. The dashboard converts it to Singapore time |

## gameplay.csv (one row per event)

| Field | Present for | Description |
|---|---|---|
| gameSessionId | all | Random per play attempt |
| attempt | all | 1 = first play in this visit; 2+ = replays |
| type | all | `session_started`, `mission_completed`, `session_completed`, `session_abandoned` |
| mission | mission_completed | `rush`, `detective`, `launch` |
| score | mission_completed | Integer mission score |
| success | mission_completed | Rush: ≥6 correct; Detective: ≥2 of 3 solved; Launch: all 3 languages published |
| durationMs | mission_completed, session_completed | Time used (ms) |
| totalScore, tier, missionsSucceeded | session_completed | Tier: rookie < 2,500 ≤ specialist < 5,000 ≤ master |
| reason, stepKind | session_abandoned | `idle_reset` / `staff_reset` / `exit`; the step at abandonment |

## research.csv (one row per respondent = latest snapshot per visitId)

For each question `q` in workFunction, frequency, contentTypes, challenges, tools and capability:

| Column | Values |
|---|---|
| `q_status` | `answered`, `skipped`, `not_applicable`, `not_reached` |
| `q` | Option ID, or a `;`-separated list of option IDs for multi-select |

Option IDs:

- **workFunction**: communications, frontline, product_engineering, operations, other, prefer_not_to_say
- **frequency**: daily, weekly, monthly, rarely, never
- **contentTypes**: public_notices, letters_emails, website_pages, forms_services, social_media, print_signage, app_chatbot, internal_docs, other
- **challenges**: turnaround, cost, terminology, consistency, quality_review, coordination, other, none
- **tools**: generic_ai, machine_translation, vendors, internal_translators, bilingual_colleagues, other, none
- **capability**: web_portal, website_translation, api_integration, glossary, none, unsure

## interest.csv (one row per event)

| type | Meaning |
|---|---|
| interest_expressed | Tapped "Yes, show me how" |
| interest_declined | Tapped "Not now" |
| formsg_qr_shown | FormSG QR displayed. Scans are not measurable |
| formsg_link_opened | FormSG link tapped (mobile) |

## Derived metrics

| Metric | Numerator | Denominator |
|---|---|---|
| Completion rate | distinct gameSessionId with session_completed | distinct gameSessionId with session_started |
| Research participation | respondents | unique visitors (distinct visitId with session_started) |
| Option share (multi) | respondents selecting the option | respondents who **answered** that question |
| No significant challenges | challenges = [none] | respondents who answered challenges |
| Interest rate | distinct visitId with interest_expressed | unique visitors |

CSV cells that start with `= + - @` are prefixed with `'` to prevent spreadsheet formula injection.
