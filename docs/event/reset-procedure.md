# Reset procedure between visitors

**Normal case (automatic):** after the Thanks screen, the kiosk returns to the attract screen within 10 s. Each new visitor gets a new anonymous `visitId`.

**Visitor walked away mid-game:** do nothing. After 40 s idle a "Still playing?" countdown appears, then the kiosk resets (logged as `idle_reset`).

**Manual reset (when the next visitor is waiting):**

1. Press **Shift+S**, or long-press the **top-left corner** for 1.5 s.
2. Tap **Reset for next visitor**.
3. Confirm the attract screen ("Tap to play") is showing.

**Why reset matters:** each reset starts a fresh anonymous visit, so two people's research answers are never merged and replays by the same person are not counted twice.

**Never:** refresh the browser with a visitor's answers on screen, or open the admin dashboard on the kiosk display.
