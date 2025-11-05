This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AWS + Postgres Setup

- Environment: set variables in `.env` (already present)
  - `DATABASE_URL=postgresql://postgres:1234@localhost:5432/sakhu?schema=public`
  - `AWS_REGION=ap-south-1`, `AWS_S3_BUCKET=sakhu-media`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- PostgreSQL (local) via pgAdmin:
  - Open pgAdmin → Register Server → Name `Local Postgres`
  - Connection: `Host=localhost`, `Port=5432`, `User=postgres`, `Password=1234`
  - Create database `sakhu` if not present
- Prisma (generate/migrate/seed):
  - `npx prisma generate`
  - `npx prisma migrate dev --name init`
  - `npm run seed` (creates admin/editor users)

## API Endpoints (Postman)

- Collection: `postman/sakhu-admin.postman_collection.json`
- Flow:
  - Auth: Login → capture `token`
  - Uploads: Sign → get `uploadUrl` and `publicUrl`
  - Upload: PUT the file to `uploadUrl` with `Content-Type`
  - Testimonials: Create → send JSON with `avatarUrl=publicUrl`
  - News: Create → send JSON with `heroImageUrl=publicUrl`
  - List/Update/Delete endpoints available for both

## Notes

- S3 keys are organized by feature (hero/testimonials/news/gallery) via `/api/uploads/sign`
- Mutating endpoints require Bearer `token` from `/api/auth/login`
- If deleting items with S3 assets, you can pass the object `key` to delete the S3 file as well
