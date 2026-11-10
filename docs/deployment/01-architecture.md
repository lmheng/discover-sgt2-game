# Deployment architecture

## Logical components

| Component | Code | Runs | Exposure |
|---|---|---|---|
| Public game frontend | `/`, `/kiosk`, `components/game,missions,research,kiosk` | Browser (static shell + client JS) | Public pages, no secrets |
| Anonymous collection backend (optional) | `POST /api/events`, `lib/server/store.ts` | Node (Next server) | Same-origin, rate-limited, validated |
| Admin analytics | `/admin`, `/api/admin/*`, `proxy.ts` | Node | Passcode + signed cookie; aggregates only |
| Configuration and content | `src/config/**` | Build time | Validated at build (bad config fails the build) |

## Default topology: kiosk (option A, recommended for 27 Nov)

```
┌──────────────── Booth laptop (government-issued) ────────────────┐
│ Chrome --kiosk http://127.0.0.1:3000/kiosk ──► Next server (npm start, bound to 127.0.0.1)
│      │ IndexedDB outbox                          │
│      └────────── POST /api/events ───────────────┘──► data/*.jsonl (encrypted disk)
│ Admin (staff, after hours): http://127.0.0.1:3000/admin
└──────────────────────────────────────────────────────────────────┘
          ▲ HDMI to booth monitor (extended/duplicated display)
```

- No internet or venue Wi-Fi required.
- No external calls: no AI API, no CDN, no web fonts, no analytics SaaS.
- The FormSG QR is generated locally from the configured URL; visitors scan it with their own phone.

## Optional topology: hosted (option B, requires approval)

```
Phone ──HTTPS──► Approved hosting (e.g. GCC / agency-approved platform)
                   ├─ Next server (game + /api/events + /admin behind SSO/IP allow-list)
                   └─ Approved database (replace lib/server/store.ts adapter)
```
See `02-integration-options.md` for prerequisites.
