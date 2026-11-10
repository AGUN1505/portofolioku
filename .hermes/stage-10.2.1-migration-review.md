# STAGE 10.2.1 — MIGRATION SQL REVIEW GATE

**Date:** 2026-11-07  
**Database:** `porto_cms` (PostgreSQL 14.5 via Laragon)  
**Host:** `localhost:5432`  
**Migration Name:** `20261107055050_init`

---

## 1. MIGRATION SAFETY AUDIT

### Operations Summary
- **CREATE TABLE:** 12 tables
- **CREATE UNIQUE INDEX:** 2 indexes (`admins_username_key`, `admins_email_key`)
- **ADD CONSTRAINT (Foreign Key):** 1 constraint (`skills_categoryId_fkey` with CASCADE delete)
- **ADD CONSTRAINT (CHECK):** 3 singleton constraints (`hero_profiles`, `about_profiles`, `contact_profiles`)
- **DROP / TRUNCATE / ALTER (Destructive):** **ZERO (0)**

### Tables to be Created:
1. `admins` (id, username, passwordHash, email, sessionVersion, timestamps)
2. `hero_profiles` (id='singleton', name, tagline, bio, country, code, timezone, discipline, timestamps)
3. `roles` (id, title, primary, order, timestamps)
4. `engineering_nodes` (id, tag, title, description, stack, highlighted, order, timestamps)
5. `about_profiles` (id='singleton', heading, quote, primaryNarrative, secondaryNarrative, timestamps)
6. `domains` (id, index, title, order, timestamps)
7. `pillars` (id, index, title, description, order, timestamps)
8. `projects` (id, title, category, description, technologies Json, thumbnailUrl, projectUrl, githubUrl, published, publishedAt, order, timestamps)
9. `experiences` (id, role, institution, track, description, startDate, endDate, order, timestamps)
10. `skill_categories` (id, title, order, timestamps)
11. `skills` (id, name, categoryId, order, timestamps)
12. `contact_profiles` (id='singleton', heading, ctaLabel, description, timestamps)
13. `contact_channels` (id, label, value, order, timestamps)

---

## 2. SINGLETON CHECK CONSTRAINTS VERIFICATION

The following reproducible CHECK constraints are appended to the migration file:

```sql
ALTER TABLE "hero_profiles" ADD CONSTRAINT "hero_profiles_singleton_check" CHECK (id = 'singleton');
ALTER TABLE "about_profiles" ADD CONSTRAINT "about_profiles_singleton_check" CHECK (id = 'singleton');
ALTER TABLE "contact_profiles" ADD CONSTRAINT "contact_profiles_singleton_check" CHECK (id = 'singleton');
```

---

## 3. PRISMA 7.X ADAPTATION NOTE

Prisma 7.10.1 separates CLI migration configuration from schema definition:
- `prisma/schema.prisma`: purely declarative datasource (`provider = "postgresql"`)
- `prisma.config.ts`: provides `datasource.url` from `process.env.DATABASE_URL` via dotenv (`.env.local`)
- Schema validation status: `The schema at prisma\schema.prisma is valid 🚀`

---

## 4. ACTION REQUIRED FOR APPROVAL

To execute the migration against `porto_cms`:
```bash
npx prisma migrate dev
```

Do you approve executing this migration?
