# Keepalive Monitoring Runbook (One‑Pager)

Purpose: Ensure `/internal/keepalive` is called on schedule and alerts fire on failures.

## Endpoint & Sample Call
- Path: `/internal/keepalive`
- Production URL: `https://<your-vercel-host>/internal/keepalive`
- Header: `Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>`
- Sample (no secrets):
```bash
curl -sS "https://<your-vercel-host>/internal/keepalive" \
  -H "Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>"
```

## Response Contract (Summary)
- Success:
```json
{ "status":"ok", "timestamp":"<ISO+offset>", "supabaseStatus":200, "details":"read success" }
```
- Failure:
```json
{ "status":"error", "timestamp":"<ISO+offset>", "code":<http status>, "message":"<reason>" }
```
- Transients: endpoint performs one short retry on 5xx; logs retries.

## Secrets & Storage
- `KEEPALIVE_AUTH_TOKEN` — scheduler auth header secret.
  - Store in scheduler’s secret store (e.g., GitHub Actions/GitLab/Vercel Cron). Do not commit.
- Optional alert channels:
  - `ALERT_SLACK_WEBHOOK_URL` — Slack channel webhook (server env).
  - `RESEND_API_KEY`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO` — email alerts via Resend (server env).
- Optional Supabase:
  - `SUPABASE_KEEPALIVE_KEY` — least‑privilege read key for health check.
  - `KEEPALIVE_TABLE` — `keepalive_meta` or `rpc:health`.

## Schedule
- Timezone: Asia/Kolkata (IST)
- Preferred cadence: every 3 days at 03:00 IST
  - UTC: 21:30 the previous day
  - Cron (UTC): `30 21 */3 * *`
- Minimal cadence: every 5 days at 03:00 IST
  - Cron (UTC): `30 21 */5 * *`
- If cadence limitations exist: daily at 03:00 IST → UTC cron `30 21 * * *`.

## Owners & On‑Call
- Service owner(s): <fill with names/emails>
- On‑call rotation: <fill with rotation policy>
- Key rotation cadence: 90 days recommended for `KEEPALIVE_AUTH_TOKEN`.
  - Store new secret in scheduler; update Vercel `KEEPALIVE_AUTH_TOKEN` if used for monitor.
  - Notify scheduler team of effective date/time.

## Recovery Steps
1. Check recent logs (search `route=/internal/keepalive statusCode!=200`).
2. Verify scheduler delivered the request:
   - Confirm header `Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>` present.
   - Reproduce with curl (above) to isolate.
3. Confirm server env:
   - `KEEPALIVE_AUTH_TOKEN` set and matches scheduler.
   - Optional: `SUPABASE_KEEPALIVE_KEY`, `KEEPALIVE_TABLE` configured.
4. Supabase health:
   - Verify DB connectivity; retry logic handles transients; persistent 5xx needs DB/network fix.
5. Alerts:
   - Ensure `ALERT_SLACK_WEBHOOK_URL` / `RESEND_API_KEY` configured.
6. Rotate `KEEPALIVE_AUTH_TOKEN` if suspected compromise:
   - Update scheduler secret and server env; redeploy.
7. Validate:
   - Call endpoint; expect `status: ok`, `supabaseStatus: 200`, `details: read success`.
   - Monitor: `GET /internal/keepalive/monitor` should return `details: recent`.

## Contact & Escalation
- Primary: <name/email>
- Secondary: <name/email>
- Escalation: <team/channel>