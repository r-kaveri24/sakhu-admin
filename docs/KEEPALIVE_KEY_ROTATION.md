# SUPABASE_KEEPALIVE_KEY Rotation Procedure

Goal: Rotate the Supabase key used by the keepalive endpoint every 3 months (or per policy) without breaking clients.

## Background
- The keepalive endpoint uses `SUPABASE_KEEPALIVE_KEY` (server-only) for a minimal read. In most setups this equals the project’s `anon` key. Ensure RLS + grants restrict `anon` to `SELECT` on `keepalive_meta` or a read-only RPC.
- Frontend may also use `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If you regenerate the `anon` key, update both places.

## Pre‑Checks
- Confirm least privilege is enforced:
  - RLS enabled on `keepalive_meta`.
  - `anon` granted `SELECT` only (see `scripts/supabase-bootstrap.sql`).
- Identify environments affected: Production, Preview, Staging.
- Coordinate with frontend if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is in use (`src/lib/supabase.ts`).

## Rotation Steps (Production)
1) Supabase Console → Project Settings → API
   - Regenerate the `anon` key (or the key you use for keepalive).
   - Copy the new value.
2) Update server secrets (Vercel):
   - Set `SUPABASE_KEEPALIVE_KEY` to the new value
   - If frontend uses Supabase directly, also update `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3) Redeploy the application (Vercel → Deploy).
4) Validation:
   - Call keepalive:
     ```bash
     curl -sS "https://<vercel-host>/internal/keepalive" \
       -H "Authorization: Bearer ${KEEPALIVE_AUTH_TOKEN}"
     ```
   - Expect success body with `supabaseStatus: 200` and `details: "read success"`.
   - Check logs for structured entries and absence of 5xx.
   - Monitor endpoint:
     ```bash
     curl -sS "https://<vercel-host>/internal/keepalive/monitor" \
       -H "Authorization: Bearer ${KEEPALIVE_AUTH_TOKEN}"
     ```
     Expect `details: "recent"`.
5) Decommission old references:
   - Ensure old key isn’t present in any env or CI secrets.
   - Record rotation time and key owner in runbook.

## Staging Dry‑Run (Recommended)
- Repeat the steps on staging first. Use staging Supabase with `keepalive_meta` seeded.
- Ensure both keepalive and monitor respond correctly after rotation.

## Rollback Plan
- If validation fails, revert `SUPABASE_KEEPALIVE_KEY` to the previous value and redeploy.
- Investigate Supabase connectivity, RLS policies, and network.

## Cadence & Ownership
- Cadence: every 3 months (align to company policy).
- Owner(s): <name/email>.
- On‑call: <name/email>.
- Record rotations in `docs/KEEPALIVE_RUNBOOK.md` → Owners & On‑Call.

## Notes
- Service role keys bypass RLS; avoid using `service_role` for keepalive.
- Prefer read‑only RPC (`rpc:health`) as an alternative to direct table SELECT if desired.
- Endpoint already retries once on transient 5xx and logs retry attempts.