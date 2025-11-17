-- Supabase Bootstrap: apply Prisma migrations and seed users
-- Run this entire script in Supabase Dashboard → SQL editor.
-- It creates required tables and inserts admin/editor/test users.

BEGIN;

-- =========================
-- Migrations (chronological)
-- =========================

-- 20251105134452_init
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'USER');
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "heroImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "quote" TEXT NOT NULL,
    "avatar" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaImage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "caption" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "galleryId" TEXT,
    CONSTRAINT "MediaImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaVideo" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "posterKey" TEXT,
    "durationSec" INTEGER,
    "resolution" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADED',
    CONSTRAINT "MediaVideo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetType" TEXT,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");

ALTER TABLE "News" ADD CONSTRAINT "News_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 20251110114832_add_published_parts
ALTER TABLE "News" ADD COLUMN "publishedDay" INTEGER;
ALTER TABLE "News" ADD COLUMN "publishedMonth" INTEGER;
ALTER TABLE "News" ADD COLUMN "publishedYear" INTEGER;

-- 20251110144341_add_team_volunteer
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VolunteerMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VolunteerMember_pkey" PRIMARY KEY ("id")
);

-- 20251110151937_add_user_profile_fields
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "cityState" TEXT;
ALTER TABLE "User" ADD COLUMN "country" TEXT;
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "location" TEXT;
ALTER TABLE "User" ADD COLUMN "mobile" TEXT;
ALTER TABLE "User" ADD COLUMN "pinCode" TEXT;
ALTER TABLE "User" ADD COLUMN "position" TEXT;
ALTER TABLE "User" ADD COLUMN "profilePhoto" TEXT;

-- 20251110153621_add_form_submissions
CREATE TABLE "DonationSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "state" TEXT,
    "address" TEXT,
    "adharCardNo" TEXT,
    "panCardNo" TEXT,
    "adharFileUrl" TEXT,
    "panFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DonationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "address" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VolunteerSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "address" TEXT,
    "occupation" TEXT,
    "areasOfWork" JSONB,
    "availability" JSONB,
    "fromTime" TEXT,
    "toTime" TEXT,
    "hoursPerDay" INTEGER,
    "preferredCity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VolunteerSubmission_pkey" PRIMARY KEY ("id")
);

-- 20251110155010_add_analytics_models
ALTER TABLE "DonationSubmission" ADD COLUMN "amount" INTEGER;
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "page" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- 20251111095521_add_reset_tokens
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 20251111105616_remove_reset_tokens
ALTER TABLE "public"."PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";
DROP TABLE "public"."PasswordResetToken";

-- 20251111132347_add_testimonial_rating
ALTER TABLE "Testimonial" ADD COLUMN "rating" INTEGER NOT NULL DEFAULT 5;

-- =====================
-- Keepalive meta table
-- =====================
-- Tiny table used only for authenticated read checks
CREATE TABLE IF NOT EXISTS "keepalive_meta" (
    "id" INTEGER PRIMARY KEY,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "keepalive_meta" ("id", "label")
VALUES (1, 'health')
ON CONFLICT ("id") DO NOTHING;

-- Enforce least privilege for REST access
-- 1) Revoke all default privileges from role `anon` across public schema
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM anon;

-- 2) Enable RLS on keepalive_meta and allow only SELECT to `anon`
ALTER TABLE "keepalive_meta" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'keepalive_meta' AND policyname = 'allow_anon_select_keepalive_meta'
  ) THEN
    CREATE POLICY "allow_anon_select_keepalive_meta" ON "keepalive_meta"
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

-- 3) Grant explicit SELECT privilege on keepalive_meta to `anon`
GRANT SELECT ON TABLE "keepalive_meta" TO anon;

-- ==========
-- Seed users
-- ==========

INSERT INTO "User" ("id", "email", "name", "role", "password", "updatedAt")
VALUES (gen_random_uuid()::text, 'admin@sakhu.org', 'Admin User', 'ADMIN', '$2b$10$FMbZHPsdcrYapsD8JSX7TO2gslJVoWMoR2kLGAAunV/dtZLXuGV6u', CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "User" ("id", "email", "name", "role", "password", "updatedAt")
VALUES (gen_random_uuid()::text, 'editor@sakhu.org', 'Editor User', 'EDITOR', '$2b$10$HJ7qCkNksc8UJIx2H7qm4OLwmdmZhOdbjLcjlG3sf2j/vIYAGTKCW', CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "User" ("id", "email", "name", "role", "password", "updatedAt")
VALUES (gen_random_uuid()::text, 'rautkaveri88@gmail.com', 'Kaveri Raut', 'USER', '$2b$10$OJl9LSzLtGBeN0ELKzBgt.9cUOgadvpx.Wq12ftimOOh6ZdMPJqk6', CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;

COMMIT;