# Security checklist

| # | Control | Implementation | Verify |
|---|---|---|---|
| 1 | Server-side input validation | Strict zod schemas; option allow-lists; event allow-list; timestamp window | `tests/unit/research.test.ts`, `server.test.ts` |
| 2 | Body size limits | 64 KB ingest, 2 KB login, 5 MB import | `server.test.ts` (413) |
| 3 | Rate limiting | Token bucket: ingest 30 burst / 60 per min; login 5 burst / 5 per min | `server.test.ts` |
| 4 | Same-origin check on POST | `Origin` must match `Host` | `server.test.ts` (403) |
| 5 | Admin auth | scrypt passcode hash in env; HMAC-signed HttpOnly SameSite=Strict cookie (Secure on HTTPS); 8 h expiry; timing-safe compares | `server.test.ts`; `admin.spec.ts` |
| 6 | Defence in depth | `proxy.ts` guard **and** a per-route `requireAdmin` | `admin.spec.ts` (401s) |
| 7 | No participant-level data on public routes | Public routes are ingest-only; the dashboard gets aggregates; CSV export is admin-only | Review routes |
| 8 | No personal identifiers stored | No IP, UA, names or free text in schemas; IP used in memory only | Schema review |
| 9 | Security headers | CSP (self only), X-Frame-Options DENY, nosniff, no-referrer, Permissions-Policy, `no-store` + noindex on admin | `curl -I` |
| 10 | Secrets management | `.env.local` only (git-ignored); `.env.example` has no values; the hash script generates both secrets | `git status` |
| 11 | CSV injection | Leading `= + - @` neutralised | `server.test.ts` |
| 12 | Retention and deletion | Automatic purge (`RETENTION_DAYS`); typed-confirmation delete-all | `server.test.ts` |
| 13 | Synthetic content only | No live SGT API; no production endpoints; content in repo | Code search |
| 14 | Dependency hygiene | `npm audit` before the event; pinned lockfile | Run `npm audit --omit=dev` |
| 15 | Kiosk hardening | Local bind 127.0.0.1; Chrome `--kiosk`; dedicated OS user; disk encryption; screen lock when unattended | Readiness checklist |
| 16 | No external deployment without approval | No deploy scripts or CI deploys included | — |

**Known limitations:** the kiosk staff PIN is a deterrent, not a control. The rate limiter is per process. CSP allows `'unsafe-inline'` scripts because Next.js requires it without a nonce setup; tighten this with nonces for hosted option B.
