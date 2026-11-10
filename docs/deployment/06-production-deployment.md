# Production deployment instructions (option A: booth kiosk)

> Do not deploy to any externally reachable host without security and hosting approval. These steps produce a **local** deployment only.

## Prerequisites

- Government-issued Windows laptop with Node.js 22 LTS (or the version in `package.json` engines) and Google Chrome.
- A copy of this repository (approved channel). Run `npm ci` once while connected; afterwards everything runs offline.

## Steps

1. **Install**
   ```powershell
   npm ci
   ```
2. **Configure** (create `.env.local` in the project folder)
   ```powershell
   npm run admin:hash -- "<a long passcode known only to the SGT team>"
   ```
   Copy the two output lines into `.env.local`, wrapping the hash in single quotes. Then set:
   ```
   NEXT_PUBLIC_EVENT_ID=discover-2026
   NEXT_PUBLIC_COLLECTION_MODE=server
   DATA_DIR=data
   RETENTION_DAYS=90
   ```
   In `src/config/events/discover-2026.json`, set `formsgUrl` to the official FormSG link and change `kiosk.staffPin`.
3. **Swap in brand assets** (see `public/brand/README.md`) and set their paths in `src/config/brand.ts`.
4. **Verify and build**
   ```powershell
   npm run typecheck; npm test; npm run build
   ```
5. **Start** (bound to localhost only)
   ```powershell
   npm start
   ```
6. **Launch the kiosk browser**
   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --app=http://127.0.0.1:3000/kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --user-data-dir="$env:LOCALAPPDATA\witty-kiosk"
   ```
   Exit Chrome kiosk with Alt+F4 (staff only).
7. **Admin** (staff, away from visitors): open `http://127.0.0.1:3000/admin` in a normal Chrome window.

## Reusing at another roadshow

1. Copy `src/config/events/roadshow-template.json` to `src/config/events/<new-id>.json` and edit it (date, hours, FormSG URL, reminder text, durations, `researchEnabled`).
2. Register it in `src/config/index.ts` (`rawEvents`).
3. Set `NEXT_PUBLIC_EVENT_ID=<new-id>` and rebuild. Records are tagged with the new event code, and the dashboard can filter by event.

## Hosted (option B), outline only and after approval

Replace `lib/server/store.ts` with an approved DB adapter; put `/admin` behind SSO or an IP allow-list; use a shared rate limiter; enforce HTTPS (cookies become `Secure` automatically); set up CSP nonces; review logging so request IPs are not retained.
