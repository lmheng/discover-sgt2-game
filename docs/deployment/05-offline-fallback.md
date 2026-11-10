# Offline fallback plan

The default kiosk set-up is already offline: the server and the browser are on the same laptop. These fallbacks cover failures.

| Failure | Symptom | Fallback |
|---|---|---|
| Venue Wi-Fi down | None. Nothing depends on it | Continue |
| Local Next server crashed | Game still runs (already loaded); staff panel shows "pending" climbing | Restart with `npm start`; then staff panel → **Sync now** |
| Server won't start | Page doesn't load | Run the prebuilt app from a backup folder (USB copy of the repo with `.next` already built); or switch to browser-only mode (below) |
| Browser storage problems | Pending count stays at "…" | Records fall back to memory; export JSON before closing the tab |
| Laptop failure | — | Spare laptop with the same build (readiness checklist); paper instruction card + staff demo of SG Translate Together on a phone |
| Monitor failure | — | Play on the laptop screen directly |

## Browser-only mode

Build with `NEXT_PUBLIC_COLLECTION_MODE=browser` to keep all records in IndexedDB. At lunch and at close, use staff panel → **Export queue (JSON)**. Afterwards, an admin imports each file in `/admin` → Data management. Duplicates are ignored.

## End-of-day data safety

1. Staff panel → **Sync now**; confirm "All records synced."
2. `/admin` → export the three CSVs to the team's approved storage.
3. Copy `data/` to approved storage. Do not use personal drives or messaging apps.
4. Apply retention: delete local data once the analysis is complete.
