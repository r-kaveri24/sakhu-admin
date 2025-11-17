# Keepalive Deployment & Verification (Staging → Production)

This document covers deploying the keepalive endpoint to staging, scheduling tests, promoting to production, and verifying Supabase activity logs.

## Prerequisites
- Staging and Production deployments are live (e.g., Vercel) with required env vars set:
  - `KEEPALIVE_AUTH_TOKEN` (server): matches scheduler’s header
  - `SUPABASE_KEEPALIVE_KEY` (server): least-privilege read key
  - Optional alerts: `ALERT_SLACK_WEBHOOK_URL`, `RESEND_API_KEY`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO`
  - Optional: `KEEPALIVE_TABLE` if using RPC instead of `keepalive_meta`
- GitHub repository with Actions enabled
- Secrets configured:
  - `STAGING_BASE_URL` (example: `https://staging.example.com`)
  - `PRODUCTION_BASE_URL` (example: `https://example.com`)
  - `KEEPALIVE_AUTH_TOKEN` (same name; scoped via environments if needed)

## Staging: Schedule & Test
1) Configure repository secrets:
   - `STAGING_BASE_URL` and `KEEPALIVE_AUTH_TOKEN`
2) Workflow: `.github/workflows/keepalive-staging.yml`
   - Runs daily at `03:00 Asia/Kolkata` (`21:30 UTC`)
   - Calls:
     - `GET {BASE_URL}/internal/keepalive` with header `Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>`
     - `GET {BASE_URL}/internal/keepalive/monitor` (optional)
3) Manual run:
   - GitHub → Actions → “Keepalive (Staging)” → Run workflow
4) Acceptance: staging passes when workflow status is green and endpoint returns `{"status":"ok"}` consistently for 24 hours.

## Promote to Production
1) Configure repository secrets:
   - `PRODUCTION_BASE_URL` and production `KEEPALIVE_AUTH_TOKEN`
2) Ensure production server envs are set (same as staging, with production keys).
3) Workflow: `.github/workflows/keepalive-production.yml`
   - Environment: `production` (protected)
   - Schedule: daily `03:00 Asia/Kolkata` (`21:30 UTC`)
4) Manual run for first validation:
   - GitHub → Actions → “Keepalive (Production)” → Run workflow
5) Acceptance: Production run visible in Supabase activity within 24 hours and no alerts fired.

## Supabase Verification (Production)
- Supabase → Project → Logs → Activity
- Expect to see:
  - Recent `SELECT` activity on `keepalive_meta` (or RPC if configured)
  - Timestamps corresponding to production workflow runs
- If not visible:
  - Confirm `SUPABASE_KEEPALIVE_KEY` and `KEEPALIVE_TABLE` values
  - Re-run production workflow and inspect server logs

## Alerting Expectations
- No alerts should fire under normal conditions.
- Alerts fire only after two consecutive failures or monitor detects missed runs.
- If alerts fire:
  - Check auth header correctness and endpoint availability
  - Re-run workflow after fixing configuration

## Rollback / Mitigation
- Temporarily disable production workflow schedule
- Fix server envs or secret values, re-run manually
- If Supabase key caused issues, follow `docs/KEEPALIVE_KEY_ROTATION.md` rollback plan

## References
- Runbook: `docs/KEEPALIVE_RUNBOOK.md`
- API & handoff: `docs/API_README.md`
- Secrets access & audit: `docs/KEEPALIVE_SECRET_ACCESS.md`
- Key rotation: `docs/KEEPALIVE_KEY_ROTATION.md`