# StatVision Context — Jul 17 2026

## Completed
1. **Certainty levels feature** — playerCertainty + eventTypeCertainty across 10 files + DB migration (applied)
2. **Worker fix** — MockEventBus when USE_MOCK_EVENT_BUS=true (no GCP ADC needed)
3. **Commit & Push to test** — ea482ba pushed, Vercel preview deployed
4. **Auth fix (user-provider.tsx)** — mock only when `NEXT_PUBLIC_USE_MOCK_AUTH=true`, throws clean error otherwise. Committed as a1d1c43 on `fix/usage-tracking-pricing`, 989b29e on `test`

## Current Task
- Setting Auth0 env vars on Vercel Preview via CLI
- `vercel env add` is interactive (prompts for git branch) — stuck on stdin piping

## Pending
- Set `NEXT_PUBLIC_AUTH0_DOMAIN` on Vercel Preview
- Set `NEXT_PUBLIC_AUTH0_CLIENT_ID` on Vercel Preview
- Handle `NEXT_PUBLIC_BASE_URL` dynamically (preview URL changes per deploy) — likely via next.config.ts + VERCEL_URL

## Branch State
- `fix/usage-tracking-pricing`: a1d1c43 (clean auth error)
- `test`: 989b29e (same content, ahead)
- Both pushed to origin

## Key Files
- `frontend/src/app/user-provider.tsx` — mock auth logic (line 53: shouldUseMock = isMock)
- `frontend/.vercel/project.json` — Vercel project ID
- `frontend/.env.local` — local env vars (Auth0 creds)
