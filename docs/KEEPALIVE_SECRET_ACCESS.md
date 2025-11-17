# Keepalive Secrets Access Policy & Audit

Purpose: Limit access to keepalive-related secrets to only required engineers and CI/CD systems; document and audit regularly.

## Secret Inventory
- `KEEPALIVE_AUTH_TOKEN` — scheduler auth header (scheduler secret store only)
- `SUPABASE_KEEPALIVE_KEY` — server read-only Supabase key (Vercel project env)
- `KEEPALIVE_TABLE` — target selection (non-sensitive; Vercel env)
- `ALERT_SLACK_WEBHOOK_URL` — Slack alerts (Vercel env)
- `RESEND_API_KEY` — email alerts (Vercel env)
- `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO` — alert addresses (Vercel env)

## Access List (who can read/update)
- Engineers:
  - On‑call SRE: Read/Write `SUPABASE_KEEPALIVE_KEY`, `ALERT_*`, `RESEND_API_KEY`; Read `KEEPALIVE_AUTH_TOKEN` (for monitor, not scheduler store)
  - Backend maintainer: Read/Write `SUPABASE_KEEPALIVE_KEY`, `ALERT_*`, `RESEND_API_KEY`
  - Frontend engineer: No access to keepalive secrets (unless rotating `NEXT_PUBLIC_SUPABASE_ANON_KEY` concurrently)
- CI/CD:
  - Scheduler (e.g., GitHub Actions, Cloud Scheduler): Read `KEEPALIVE_AUTH_TOKEN` only; no access to other secrets
  - Vercel deploy: Read server envs to run app; write access restricted to owners
- Disallowed:
  - External contributors, interns, non-on‑call engineers, preview reviewers

## Required Locations (no duplication)
- `KEEPALIVE_AUTH_TOKEN`: Scheduler secret store only; do not mirror in repo or shared vault
- Server envs: Vercel project → Environment Variables (Production/Preview) for `SUPABASE_KEEPALIVE_KEY`, `ALERT_*`, `RESEND_API_KEY`, `KEEPALIVE_TABLE`

## Audit Procedure
1) Repo audit
   - Verify no secrets are committed (`.gitignore` includes `.env*`) and no hardcoded values exist.
   - Search for secret names across repo (performed): only env references found.
2) Vercel access audit
   - Team → Members: limit roles with “Manage Environment Variables” to owners/on‑call.
   - Project → Settings → Environment Variables: review who has edit permissions.
   - Remove outdated members and rotate tokens per policy.
3) Scheduler audit (e.g., GitHub)
   - Repository → Settings → Secrets (Actions): scope `KEEPALIVE_AUTH_TOKEN` to environments with protection rules.
   - Require approvers for deployments; disable Actions on forks for secret access.
   - Confirm only scheduler workflow can read the secret.
4) Supabase audit
   - Project access: restrict to owners and on‑call.
   - RLS enabled on `keepalive_meta`; ensure `anon` has only `SELECT`.
   - Regenerate `anon` key if compromise suspected; follow `docs/KEEPALIVE_KEY_ROTATION.md`.
5) Slack/Resend audit
   - Slack webhook: verify channel membership; restrict app tokens and rotate webhook if leakage suspected.
   - Resend: restrict API key to required team; ensure sending domain configured and monitored.
6) Remove unnecessary access
   - Revoke access for non-required members from Vercel, Supabase, Slack, Resend.
   - Clean shared vault entries referencing these secrets; centralize in platform stores.

## Audit Record (fill on completion)
- Date: <YYYY‑MM‑DD>
- Auditors: <names>
- Repo audit: Completed (no hardcoded secrets)
- Vercel access: Reviewed; members with env manage: <names>; changes: <notes>
- Scheduler secrets: Reviewed; workflows with access: <names>; changes: <notes>
- Supabase access: Reviewed; members: <names>; RLS confirmed; changes: <notes>
- Slack/Resend keys: Reviewed; changes: <notes>
- Outcome: Unnecessary access removed; compliant with policy

## Ongoing Controls
- Quarterly reviews aligned with `KEEPALIVE_KEY_ROTATION.md`
- Require approvals for environment changes
- Alert on secret changes via platform notifications