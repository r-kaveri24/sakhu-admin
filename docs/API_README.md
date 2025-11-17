# Sakhu Admin API Reference

Base URL: `http://localhost:3000`

This document describes all available API endpoints, authentication, example requests/responses, and a recommended testing flow so a new contributor can quickly understand and verify the system.

## Prerequisites

- Environment variables in `.env`:
  - `DATABASE_URL=postgresql://postgres:1234@localhost:5432/sakhu?schema=public`
  - `AWS_REGION=ap-south-1`, `AWS_S3_BUCKET=sakhu-media`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Local PostgreSQL running and accessible via pgAdmin (host `localhost`, port `5432`, user `postgres`, password `1234`, database `sakhu`).
- Prisma setup:
  - `npx prisma generate`
  - `npx prisma migrate dev --name init`
  - `npm run seed` (creates admin and editor users)

## Authentication

The API uses JWT. Obtain a token via login and pass it as a Bearer token or via cookie `auth_token`.

- POST `/api/auth/login`
  - Body (JSON):
    ```json
    { "email": "admin@sakhu.org", "password": "admin123" }
    ```
  - Response:
    ```json
    {
      "success": true,
      "user": { "id": "...", "email": "admin@sakhu.org", "role": "ADMIN" },
      "token": "<JWT>"
    }
    ```
  - Curl:
    ```bash
    curl -X POST "http://localhost:3000/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@sakhu.org","password":"admin123"}'
    ```

- GET `/api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response:
    ```json
    { "user": { "id": "...", "email": "...", "role": "ADMIN" } }
    ```

## Uploads (AWS S3)

Use a presigned upload flow: first request a signed URL, then PUT the file to S3 with the `Content-Type` header.

- POST `/api/uploads/sign` (requires auth)
  - Body (JSON):
    ```json
    {
      "fileName": "image.jpg",
      "fileType": "image/jpeg",
      "fileSize": 123456,
      "feature": "hero", 
      "breakpoint": "desktop", 
      "resourceId": "t1",     
      "slug": "sample-news"    
    }
    ```
  - Response:
    ```json
    {
      "uploadUrl": "https://...",
      "key": "hero/desktop/2025-11-05/<uuid>-image.jpg",
      "expiresIn": 900,
      "bucket": "sakhu-media",
      "region": "ap-south-1",
      "publicUrl": "https://sakhu-media.s3.ap-south-1.amazonaws.com/hero/desktop/..."
    }
    ```
  - Then PUT your file to `uploadUrl` with header `Content-Type: image/jpeg`.

Key layout by feature:

- Hero: `hero/<breakpoint>/<date>/<uuid>-filename`
- Testimonials: `testimonials/<resourceId>/image/<date>/<uuid>-filename`
- News: `news/<slug>/<date>/<uuid>-filename`
- Gallery photos: `gallery/photos/<yyyy>/<mm>/<uuid>/<date>/<uuid>-filename`
- Gallery videos: `gallery/videos/<yyyy>/<mm>/<uuid>/<date>/<uuid>-filename`

## Testimonials

Backed by PostgreSQL. Asset upload handled via presigned S3, storing `avatarUrl`.

- GET `/api/testimonials`
  - Response: `{ "items": [ { "id","name","role","quote","avatar","order","isActive","createdAt","updatedAt" } ] }`

- POST `/api/testimonials` (requires `ADMIN` or `EDITOR`)
  - Body (JSON):
    ```json
    {
      "name": "Jane Doe",
      "role": "Alumni",
      "quote": "Great experience!",
      "avatarUrl": "https://sakhu-media.s3.ap-south-1.amazonaws.com/...",
      "isActive": true,
      "order": 0
    }
    ```

- DELETE `/api/testimonials?id=<uuid>&imageKey=<optional-s3-key>` (requires `ADMIN` or `EDITOR`)
  - Deletes DB record; if `imageKey` provided, attempts to delete the S3 object.

## News

Backed by PostgreSQL. Optional hero image via presigned S3, stored as `heroImage`.

- GET `/api/news`
  - Response: `{ "items": [ { "id","title","slug","summary","content","heroImage","isPublished","publishedAt","createdAt","updatedAt" } ] }`

- POST `/api/news` (requires `ADMIN` or `EDITOR`)
  - Body (JSON):
    ```json
    {
      "title": "Sample News",
      "slug": "sample-news",
      "summary": "A short summary",
      "content": "Full content here...",
      "heroImageUrl": "https://sakhu-media.s3.ap-south-1.amazonaws.com/...",
      "isPublished": true
    }
    ```

- PUT `/api/news` (requires `ADMIN` or `EDITOR`)
  - Body (JSON): must include `id` and any fields to update.

- DELETE `/api/news?id=<uuid>&heroImageKey=<optional-s3-key>` (requires `ADMIN` or `EDITOR`)
  - Deletes DB record; if `heroImageKey` provided, attempts to delete the S3 object.

## Admin Users

- GET `/api/admin/users` (requires `ADMIN`)
  - Lists users with basic fields.

## Profile

- GET `/api/profile?id=<uuid>`
  - Returns selected profile fields.

- PUT `/api/profile` (form-data)
  - Accepts fields like `firstName`, `lastName`, `email`, `mobile`, etc.
  - `profilePhoto` (File) is stored as a data URL in DB (legacy behavior).

- POST `/api/profile` (change password)
  - Body (JSON): `{ "userId": "...", "currentPassword": "...", "newPassword": "..." }`

## Hero (Legacy Local Storage)

Currently stored in local filesystem under `public/uploads/hero`. Will be migrated to S3 later for consistency.

- GET `/api/hero` → `{ items: [...] }`
- POST `/api/hero` (form-data with `image`) → saves to `/public/uploads/hero` and appends to `data/hero.json`.
- DELETE `/api/hero?id=<id>` → removes local file and entry.

## Testing Flow (Quick Start)

1. Login to get JWT token (`/api/auth/login`).
2. Call `/api/uploads/sign` with feature context to get `uploadUrl` and `publicUrl`.
3. PUT the file to `uploadUrl` with correct `Content-Type`.
4. Create a record in DB using `publicUrl`:
   - Testimonials → `POST /api/testimonials` with `avatarUrl=publicUrl`.
   - News → `POST /api/news` with `heroImageUrl=publicUrl`.
5. List data: `GET /api/testimonials`, `GET /api/news`.
6. Update or delete as needed (optional `imageKey` deletes S3 objects).

## Example Curl Commands

```bash
# Login
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sakhu.org","password":"admin123"}'

# Presign for hero desktop image
curl -X POST "http://localhost:3000/api/uploads/sign" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"hero.jpg","fileType":"image/jpeg","fileSize":123456,"feature":"hero","breakpoint":"desktop"}'

# Create testimonial
curl -X POST "http://localhost:3000/api/testimonials" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","quote":"Great!","avatarUrl":"<PUBLIC_URL>"}'

# Create news
curl -X POST "http://localhost:3000/api/news" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Sample","content":"Text","heroImageUrl":"<PUBLIC_URL>","isPublished":true}'
```

## Postman

A ready-to-use collection is available at `postman/sakhu-admin.postman_collection.json`. Set `{{baseUrl}}` and paste the `token` from login.

## Errors & Status Codes

- `400 Bad Request` – missing/invalid fields
- `401 Unauthorized` – missing/invalid token
- `403 Forbidden` – insufficient role (admin/editor only routes)
- `404 Not Found` – record not found
- `500 Internal Server Error` – unexpected error

## Data Models

See `prisma/schema.prisma` for model definitions. Key models used here: `User`, `News`, `Testimonial`, `MediaImage`, `MediaVideo`.

## Keepalive Monitoring & Scheduler Handoff

Endpoint
- URL (production): `https://<your-vercel-host>/internal/keepalive`
- URL (preview/local): `http://localhost:3000/internal/keepalive`

Required Header
- `Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>`
- Secret name: `KEEPALIVE_AUTH_TOKEN`
- Where to set:
  - GitHub Actions: Repository → Settings → Security → Secrets and variables → Actions → New secret `KEEPALIVE_AUTH_TOKEN`
  - GitLab CI: Settings → CI/CD → Variables → Add variable `KEEPALIVE_AUTH_TOKEN`
  - Vercel/Other Schedulers: use the scheduler’s secret store and reference as a header value

Expected Success Body (contract)
```json
{
  "status": "ok",
  "timestamp": "<ISO timestamp with timezone offset>",
  "supabaseStatus": 200,
  "details": "read success"
}
```
- Notes:
  - `supabaseStatus` is the final Supabase read status code (200 on success). If Supabase config is missing, `supabaseStatus` may be `0` with `details: "missing_config"`.
  - On transient 5xx failures, the endpoint performs one short retry with backoff and returns the final status.

Failure Body (contract)
```json
{
  "status": "error",
  "timestamp": "<ISO+offset>",
  "code": <http status>,
  "message": "<reason>"
}
```

Recommended Schedule
- Preferred: every 3 days at `03:00` Asia/Kolkata (IST)
  - UTC equivalent: `21:30` UTC (previous day)
  - Cron (UTC, typical): `30 21 */3 * *` (approx. every 3rd day of month)
- Minimal cadence: at least every 5 days at `03:00` Asia/Kolkata
  - UTC equivalent: `21:30` UTC
  - Cron (UTC): `30 21 */5 * *`
- If your scheduler cannot express “every N days” precisely, use daily at `03:00` Asia/Kolkata (UTC: `30 21 * * *`). The endpoint is rate-limited and lightweight.

Example Scheduler Call (curl)
```bash
curl -sS "https://<your-vercel-host>/internal/keepalive" \
  -H "Authorization: Bearer ${KEEPALIVE_AUTH_TOKEN}"
```

Acceptance Checklist
- Scheduler uses the exact header `Authorization: Bearer <KEEPALIVE_AUTH_TOKEN>`.
- Secret `KEEPALIVE_AUTH_TOKEN` is set in the scheduler’s secret store (not in code).
- Cron is configured to the agreed cadence (3 days at 03:00 IST, or ≥5 days).
- Optional: Set monitor threshold `KEEPALIVE_EXPECTED_INTERVAL_SECONDS` (default 300) if using `/internal/keepalive/monitor`.