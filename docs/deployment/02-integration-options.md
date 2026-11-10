# Integration options

| | A. Offline kiosk + local export | B. Publicly hosted game + approved backend | C. Game + GovEngage / approved survey workflow |
|---|---|---|---|
| How | Run on the booth laptop; JSONL store; CSV export | Host on approved infra; DB adapter; mobile QR to the game | The game links to, or hands off to, a separate approved survey |
| Visitor phones | Only the FormSG QR (public) | Can play on their own phone | Survey on phone |
| Network dependency | None | Internet + hosting | Internet + GovEngage |
| Data location | Booth laptop disk | Approved hosting DB | GovEngage |
| Approvals needed | Device owner; data-handling sign-off | **Security review, hosting approval, DPO, possibly an ISO assessment** | GovEngage onboarding; survey approval |
| Effort remaining | None (ready) | DB adapter; SSO or IP allow-list for /admin; shared rate limiter; TLS; logging policy | Unknown until integration is verified |
| Advantages | Robust, private, no approvals beyond the device | Wider reach; QR → play anywhere | Uses an existing govt research channel |
| Limitations | One device; data merged manually if more kiosks are added | Approval lead time likely exceeds the 27 Nov timeline | Breaks the woven, in-game research design; answers are not linkable to game sessions (which is acceptable) |

## Option C: GovEngage

**Do not assume GovEngage provides a public API.** Before building anything, verify with the GovEngage team:

1. whether programmatic submission or an embed exists, and its auth model;
2. data residency and retention;
3. whether the question formats (multi-select, ordinal) are supported.

Until that is verified, the only supported path is **manual**: export `research.csv` from the dashboard and upload or merge it under GovEngage's approved process, if that is permitted.

## Recommendation

Use **A for {discover} 2026.** Start approvals for B only if a post-event roadshow needs phone play. The code is ready for B apart from the storage adapter and an admin SSO or allow-list.
