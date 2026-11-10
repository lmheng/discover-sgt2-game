# Risks and assumptions

## Assumptions

1. People who choose to play are willing to answer anonymous research steps. Consent is recorded as `implied_by_play`, every step is skippable, and the title screen states what is collected. *This was the product owner's decision; review it with your DPO if needed.*
2. The kiosk runs the app locally (`npm start` on `127.0.0.1`), so no venue Wi-Fi is needed.
3. Visitors' phones **cannot** reach the intranet-only SGT 2.0 microsite. Mobile mode therefore needs separately approved hosting, or it is not used.
4. The FormSG form already exists and is public.
5. GovEntry stamping is an official event process handled by staff. The game only reminds staff.
6. The event briefing was not available; requirements come from the request text.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Illustrative zh/ms/ta strings contain errors | Medium | High (credibility) | `reviewStatus: illustrative-pending-review`; on-screen "Illustrative example" label; review milestone M8 |
| Visitors read gameplay as accuracy claims | Low | High | No accuracy language; "AI translations may need human review" shown in Launch and results |
| Research answers primed by the preceding mission (e.g. terminology) | Medium | Medium | Options shuffled per visit; caveat shown on the dashboard; challenges asked after Detective is documented |
| Self-selection bias | High | Medium | Every view labelled "self-selected sample"; no extrapolation; small-n suppression (n < 5) |
| Interest inflated by game enthusiasm | Medium | Medium | Interest is a separate, explicit step after results; play ≠ interest; FormSG is the only lead source |
| Booth laptop data loss | Low | Medium | Browser outbox plus server JSONL; export at lunch and at close (event-day guide) |
| Unauthorised dashboard access on a shared laptop | Medium | Medium | scrypt passcode, signed HttpOnly cookie, 8 h expiry; physical control of the laptop; separate OS account recommended |
| In-memory rate limit resets on restart or per instance | — | Low | Acceptable for a single kiosk; use a shared limiter for hosted option B |
| Kiosk PIN is visible in client config | — | Low | It is a deterrent only, not a security control. Admin data is protected separately |
| Low frame rate on older laptops | Low | Medium | Transform/opacity-only animation, CSS confetti, no canvas; reduced-motion support; check with a 4× CPU throttle |
| Playwright's fake clock does not drive Motion animations | — | Test only | The kiosk idle E2E test runs in real time (~75 s) |
| wiTTy art not delivered in time | Medium | Medium | Neutral placeholders; swap-in requires only `config/brand.ts` |
