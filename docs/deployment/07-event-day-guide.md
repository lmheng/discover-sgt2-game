# Event-day operating guide: {discover} Showcase 2026 (Fri 27 Nov)

## Timeline

| Time | Task | Who |
|---|---|---|
| 09:00 | Arrive; set up 2–3 desks; connect the monitor and power; place the tabletop card | Booth lead |
| 09:10 | Laptop on; `npm start`; launch kiosk Chrome (deployment guide step 6) | Tech lead |
| 09:20 | Booth readiness checklist (`event/booth-readiness-checklist.md`) | Tech lead |
| 09:40 | Play one full test game; Shift+S → Reset; check admin counts show the test, and note them so they can be excluded | Tech lead |
| 10:00 | **Booth opens** | All |
| 12:30 | Staff panel → Sync now; admin → export CSVs (backup) | Tech lead |
| 15:30 | **Booth closes**. Sync, export CSVs, copy `data/` to approved storage | Tech lead |
| 15:45 | Close kiosk (Alt+F4); stop the server (Ctrl+C); lock the laptop | Tech lead |

## Visitor journey (staff script in `event/staff-script.md`)

1. Visitor notices the banner or the attract loop.
2. Staff invite them: "Want to rescue wiTTy's translations? Two minutes."
3. Visitor plays about 90–120 s and gets a score and badge.
4. Research steps happen in-game. Visitors can skip them; **do not** coach answers.
5. Staff talk about the SGT 2.0 capability that matches the visitor's interest (their power-up pick is a good opener).
6. **After genuine engagement**, staff open Shift+S → *Show GovEntry stamp reminder* and scan the official GovEntry stamp using the event's own process. The game never generates a GovEntry QR.
7. Interested visitors use "See how SGT 2.0 fits your work" → FormSG QR.
8. Staff reset for the next visitor (see `event/reset-procedure.md`). The kiosk also resets itself after inactivity.

## Do and don't

- Do let visitors skip questions. Don't say "please answer everything".
- Don't present scores as anything about the visitor's job or the product's accuracy.
- Don't treat playing as product interest; only the FormSG step counts as a lead.
- Don't let visitors use the staff panel or admin.

## Quick troubleshooting

| Problem | Fix |
|---|---|
| Screen stuck | Shift+S → Reset for next visitor |
| Kiosk closed | Re-run the Chrome command |
| "Pending" count rising | Server stopped → `npm start` → Sync now |
| Drag not working | Use tap card → tap tool; keyboard 1/2/3 |
| Nothing works | Offline fallback plan (`deployment/05-offline-fallback.md`) |
