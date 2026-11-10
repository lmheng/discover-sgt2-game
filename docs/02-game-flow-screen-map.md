# Game flow and screen map

```
                 ┌──────────── kiosk only ────────────┐
                 │  ATTRACT  (tap anywhere / Enter)    │
                 └──────────────┬──────────────────────┘
                                ▼
TITLE  ── Start ──►  DESK SET-UP*  (nameplate = work function, lamp dial = frequency)
                                ▼
       ┌──► MISSION INTRO 1 ─► TRANSLATION RUSH (30 s) ─► MISSION RESULT ─► CONTENT SORT*
       │    MISSION INTRO 2 ─► TERMINOLOGY DETECTIVE (28 s) ─► MISSION RESULT ─► CASE FILES*
       │    MISSION INTRO 3 ─► SAVE THE LAUNCH (30 s) ─► MISSION RESULT ─► CREW BOARD*
       │                                                              ▼
       │                                                     POWER-UP PICK*
       │                                                              ▼
       │                                    RESULTS + TIER BADGE + MISSION BADGES
       │                                   │                 │                 │
       └──────── Play again ───────────────┘   See how SGT fits your work     Finish
                (research not re-asked)                      ▼                 │
                                          INTEREST (Yes → FormSG QR/link · Not now)
                                                             ▼                 ▼
                                                           THANKS ◄────────────┘
                                                             │ (kiosk: auto-return after 10 s)
                                                             ▼
                                                          ATTRACT
```
`*` marks "Real mission" research steps. They are unscored, skippable, and have a distinct striped frame.

## Screens

| Screen | Component | Purpose | Inputs |
|---|---|---|---|
| Attract | `AttractScreen` | Booth-monitor loop with drifting multilingual greetings | Tap, Enter |
| Title | `TitleScreen` | Three-mission preview, privacy line, sound toggle | Start button, Enter |
| Desk set-up | `DeskSetup` | Work function and frequency (cosmetic only) | Tap; Tab/Space |
| Mission intro | `MissionIntro` | Goal plus controls; one per mission | Go, Enter/Space |
| Translation Rush | `RushScene` | Route cards to Together, Polyglot or API | Drag; tap card then dock; keys 1/2/3 |
| Terminology Detective | `DetectiveScene` | Tap the term that differs from the glossary | Tap; Tab/Enter |
| Save the Launch | `LaunchScene` | Run SGT, assign reviewers, fix, publish | Tap; drag reviewer onto lane |
| Mission result | `MissionResultCard` | Score, stats, takeaway; auto-advances after 9 s in kiosk mode | Continue, Enter |
| Content sort | `ContentSort` | Content types (multi), using the Rush mechanic | Drag; tap; keys 1/2 |
| Case files | `CaseFiles` | Challenges (multi), using the Detective tap-to-stamp mechanic | Tap |
| Crew board | `CrewBoard` | Tools (multi), using the Launch drag-a-token mechanic | Drag; tap |
| Power-up pick | `PowerUpPick` | Most relevant capability (single) | Tap |
| Results | `ResultsScreen` | Animated total, tier medal, badges, learning recap | Interest / Play again / Finish |
| Interest | `InterestScreen` | Explicit opt-in; FormSG QR (kiosk) or link (mobile) | Yes / Not now |
| Thanks | `ThanksScreen` | Close-out; staff talk follows | Play again / Done |

## Kiosk overlays

| Overlay | Trigger | Behaviour |
|---|---|---|
| Idle warning | No input for 40 s during a run, or 30 s on title, results or thanks | "Still playing?" with a 10 s countdown, then reset to Attract. Any tap dismisses it |
| Staff panel | Shift+S, or long-press the top-left corner for 1.5 s | GovEntry reminder, reset visitor, sound, fullscreen, sync or export the queue, exit kiosk (PIN) |
| GovEntry reminder | From the staff panel only | Full-screen text reminder. **No QR** |

## Timing budget (default config)

| Segment | Time |
|---|---|
| Title + desk | 10–15 s |
| 3 intros + 3 result cards | 15–20 s |
| Missions | 30 + ≤28 + ≤30 s |
| 4 interludes | 20–30 s |
| **Total** | **about 2 minutes** (about 90 s if research is skipped) |
