<div align="center">

# 🛠️ Sakhu Admin Panel — Fullstack Next.js App

[![Next.js](https://img.shields.io/badge/Next.js-13.5-000000?logo=next.js)](https://nextjs.org/) 
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/) 
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/) 
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?logo=prisma)](https://www.prisma.io/) 
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)](https://www.postgresql.org/) 
[![AWS S3](https://img.shields.io/badge/AWS%20S3-v3-FF9900?logo=amazon-aws)](https://aws.amazon.com/s3/) 
[![Playwright](https://img.shields.io/badge/Playwright-1.56-2EAD33?logo=playwright)](https://playwright.dev/)

Builds a production‑ready admin panel with authentication, role‑based access, rich content management, S3 media uploads, and a PostgreSQL backend via Prisma. Designed as a hiring‑friendly fullstack showcase: clean architecture, typed code, migrations, seeds, and e2e tests.

</div>

## ✨ Highlights

- Fullstack architecture: Next.js App Router (server routes + UI), Prisma, PostgreSQL
- Role‑based auth (`ADMIN`, `EDITOR`, `USER`) with JWT and secure cookies
- Content management: News, Testimonials, Team, Volunteer, Gallery (photos/videos)
- Direct S3 uploads with presigned URLs, delete-on-record-removal safety
- Rich text editing, image/video handling, and media metadata
- Clean migrations, seeds, and environment-driven configuration
- E2E tests with Playwright and project scripts for CI readiness

## 🖼️ Screenshots
<p>
  <img src="src/assets/screenshot1.png" alt="Sign-in screen" width="70%" />
</p>
<p>
  <img src="src/assets/screenshot1.png" alt="Homepage screenshot" width="70%" />
</p>
<p>
  <img src="src/assets/screenshot3.png" alt="Homepage screenshot 2" width="70%" />
</p>


## 🧩 Tech Stack

- Next.js 13 App Router, React 18, TypeScript
- Tailwind CSS for styling
- Prisma ORM with PostgreSQL
- AWS SDK v3 (`@aws-sdk/*`) for S3
- Playwright for e2e tests
- `bcryptjs`, `cookie`, `jsonwebtoken` for auth

## 📦 Features

- Authentication: sign‑in/out, JWT in HTTP‑only cookies
- Authorization: `requireAdmin` / `requireEditor` wrappers on API routes
- News management: CRUD, hero images, publish scheduling metadata
- Testimonials: CRUD with optional avatars (S3), ordering, active state
- Gallery: photos and videos with S3 storage and metadata
- Team & Volunteer: CRUD, avatar handling, S3 cleanup
- Profile: fetch and change password
- Analytics: basic `SiteVisit` model for recording visits
- Admin users list (for admin role)

## 🏗️ Architecture

- Server routes under `src/app/api/*` with Next.js handlers
- Database layer via `src/lib/prisma.ts` and Prisma Client
- Auth helpers in `src/lib/auth.ts`, JWT in `src/lib/jwt.ts`
- S3 client in `src/lib/s3.ts`; upload helpers in `src/lib/uploadClient.ts`
- UI pages in `src/app/*` and components in `src/components/*`

## 📁 Project Structure

- `src/app/api/*` — REST‑like handlers for features (news, testimonials, gallery, team, volunteer, profile, admin)
- `src/lib/*` — shared libs (auth, JWT, Prisma client, S3)
- `prisma/schema.prisma` — data models and generator
- `prisma/migrations/*` — migration history
- `prisma/seed.ts` — seed users (admin/editor + sample editor)
- `tests/e2e/*` — Playwright tests

## 🚀 Getting Started

1) Install dependencies:

```bash
npm install
```

2) Configure environment (`.env`):

```bash
DATABASE_URL=postgresql://postgres:1234@localhost:5432/sakhu?schema=public
JWT_SECRET=replace_this_with_a_strong_secret
APP_URL=http://localhost:3000

# AWS S3 (required for uploads)
AWS_REGION=ap-south-1
S3_BUCKET=sakhu-media
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

3) Database migrate and seed:

```bash
npx prisma migrate dev --name init
npm run seed
```

4) Start dev server:

```bash
npm run dev
# Usually http://localhost:3000 (falls back to 3001 if 3000 is busy)
```


## 🧪 Testing

Run end‑to‑end tests (Playwright):

```bash
npm run test:e2e
```

View last run report: `playwright-report/index.html`

## 🔌 API Overview

- `GET /api/auth/me` — current user
- `POST /api/auth/logout` — logout (clears cookie)
- `GET/POST/PUT/DELETE /api/news` — manage news with hero images
- `GET/POST/DELETE /api/testimonials` — manage testimonials
- `GET/POST/PUT/DELETE /api/gallery/photo` — manage gallery photos
- `GET/POST/PUT/DELETE /api/gallery/video` — manage gallery videos
- `GET/POST/PUT/DELETE /api/team` — manage team members
- `GET/POST/PUT/DELETE /api/volunteer` — manage volunteer members
- `GET/POST /api/profile` — profile fetch + change password
- Admin only: `GET /api/admin/users`

Postman collection: `postman/sakhu-admin.postman_collection.json`

## 🧯 Notes & Tips

- Mutating endpoints require valid auth; role wrappers enforce access.
- When deleting records with S3 assets, handlers attempt to delete the S3 object.
- Upload flow: request presigned URL → PUT file to S3 → store public URL in DB.
