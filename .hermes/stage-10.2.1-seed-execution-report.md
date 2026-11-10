# STAGE 10.2.1 — SEED EXECUTION REPORT (PHASE 3.5)

**Date:** 2026-11-07  
**Project:** Personal Portfolio CMS — Agun Firmansyah  
**Database Target:** `porto_cms` on `localhost:5432` (PostgreSQL 14.5 via Laragon)  
**Execution Status:** ✅ SUCCESSFUL & FULLY IDEMPOTENT  

---

## 1. TARGET DATABASE AUDIT & VERIFICATION

- **PostgreSQL Version:** 14.5 (Laragon)
- **Host / Port:** `localhost:5432`
- **Active Database:** `porto_cms` (verified via `SELECT current_database()`)
- **Active User:** `postgres`
- **Isolation Check:** The other 8 databases on the Laragon PostgreSQL instance (`db_unm`, `fashiondb`, `padekinapp`, `pesantren`, `postgres`, `powerteam`, `powerteamm`, `tkunh_user_service`) were verified completely untouched.
- **Credentials:** Redacted per security guidelines.

---

## 2. MODELS AUDITED & SEEDED

### Models Audited (13 Application Models)
1. `Admin`
2. `HeroProfile` (Singleton)
3. `Role`
4. `EngineeringNode`
5. `AboutProfile` (Singleton)
6. `Domain`
7. `Pillar`
8. `Project`
9. `Experience`
10. `SkillCategory`
11. `Skill`
12. `ContactProfile` (Singleton)
13. `ContactChannel`

### Models Seeded (11 Models)
Source data strictly aligned with authenticated portfolio data from `StaticPortfolioRepository`:

1. **`HeroProfile`** (Singleton): 1 record (`id: "singleton"`, Agun Firmansyah, tagline, bio, ID/Indonesia, GMT+7, discipline)
2. **`Role`**: 4 records (`role_01`..`role_04`: Software Developer, Backend Engineer, Informatics Engineering Student, Programming Instructor)
3. **`EngineeringNode`**: 3 records (`enode_01`..`enode_03`: Deconstruct, Architect & Build, Share & Educate)
4. **`AboutProfile`** (Singleton): 1 record (`id: "singleton"`, heading, quote, primary & secondary narratives)
5. **`Domain`**: 4 records (`domain_01`..`domain_04`: Software Engineering, Backend Development, Problem Solving, Educational Technology)
6. **`Pillar`**: 3 records (`pillar_01`..`pillar_03`: Backend Systems, Practical Solutions, Knowledge Sharing)
7. **`Project`**: 3 records (`project_01`..`project_03`: Water Reminder App, Urkins, Pesantren Management System)
8. **`Experience`**: 5 records (`exp_01`..`exp_05`: Timedoor Academy, SMK Negeri 2 Kota Jambi, PT Angkasa Pura 2, Technical Systems & Support, Independent Web Engineering)
9. **`SkillCategory`**: 4 records (`skill_cat_01`..`skill_cat_04`: Backend Engineering, Frontend & Mobile, Relational Data, DevOps & Tooling)
10. **`Skill`**: 11 records (Go, Laravel, Express.js, Node.js, React, Flutter, PostgreSQL, Git, GitHub, Postman, Docker)
11. **`ContactProfile`** (Singleton): 1 record (`id: "singleton"`, heading, ctaLabel, description)

---

## 3. MODELS WITHHELD (NOT SEEDED) & REASONS

1. **`Admin`** (0 records)
   - **Reason:** Explicitly prohibited by Stage 10.2.1 / Phase 3.5 rules (*"Jangan membuat akun admin atau mengisi kredensial admin"*). Admin account creation is deferred to its dedicated auth setup phase with explicit user-provided credentials.
2. **`ContactChannel`** (0 records)
   - **Reason:** The static repository contains placeholder values (`[ Email Placeholder — Ready for Official Address ]`, `GitHub — [ Profile URL Placeholder ]`, `LinkedIn — [ Profile URL Placeholder ]`). Seeding these would violate the core requirement: *"Jangan mengisi konten publik menggunakan data placeholder yang terlihat oleh pengunjung"* and *"Jika ada field wajib yang membutuhkan informasi atau keputusan dari user, jangan mengarang nilainya. Hentikan bagian tersebut dan laporkan kebutuhan informasinya"*.
   - **Action Needed:** User should supply the final public email address, GitHub profile URL, and LinkedIn profile URL before `contact_channels` are populated.

---

## 4. RECORD COUNTS (BEFORE VS AFTER VS IDEMPOTENCY RUN)

| Table | Count Before Seed | Count After 1st Seed | Count After 2nd Seed (Idempotency Test) |
|---|:---:|:---:|:---:|
| `admins` | 0 | 0 | 0 |
| `hero_profiles` | 0 | 1 | 1 |
| `roles` | 0 | 4 | 4 |
| `engineering_nodes` | 0 | 3 | 3 |
| `about_profiles` | 0 | 1 | 1 |
| `domains` | 0 | 4 | 4 |
| `pillars` | 0 | 3 | 3 |
| `projects` | 0 | 3 | 3 |
| `experiences` | 0 | 5 | 5 |
| `skill_categories` | 0 | 4 | 4 |
| `skills` | 0 | 11 | 11 |
| `contact_profiles` | 0 | 1 | 1 |
| `contact_channels` | 0 | 0 | 0 |
| **TOTAL APPLICATION RECORDS** | **0** | **40** | **40** |

---

## 5. TECHNICAL IMPLEMENTATION & OPERATIONS

### Script Details
- File: `prisma/seed.ts`
- Configuration: `prisma.config.ts` (`migrations.seed: 'node prisma/seed.ts'`)
- Driver: `@prisma/adapter-pg` (Prisma 7.x compliant PostgreSQL driver adapter)
- Operations: Pure `upsert` queries on primary keys; zero `DELETE`, zero `TRUNCATE`, zero `DROP`.
- Invocation: `npx prisma db seed`

### Idempotency Verification
- Seed script was executed twice consecutively.
- Record count remained strictly identical (40 rows).
- Zero duplicate records created; all updates performed in-place.

### Singleton CHECK Constraints Verification
- Verified all three singletons have `id = 'singleton'`.
- Negative test executed: Attempted `INSERT INTO hero_profiles (id, ...)` with `id = 'invalid_id'`.
- PostgreSQL engine rejected the insert with: `ERROR: new row for relation "hero_profiles" violates check constraint "hero_profiles_singleton_check"`.
- Enforcement verified 100% active.

### Build & Lint Verification
- `npm run lint`: Passed (exit 0)
- `npx tsc --noEmit`: Passed (exit 0, zero type errors)
- `npm run build`: Passed (exit 0, static pages successfully rendered)

---

## 6. ISSUES & RESOLUTIONS DURING PHASE 3.5

1. **Prisma 7 Driver Adapter Requirement:**
   - *Issue:* Prisma Client 7.10.1 threw `PrismaClientInitializationError: A driver adapter is required to connect to your database`.
   - *Resolution:* Installed official `@prisma/adapter-pg` (v7.10.1) and wired `PrismaPg` adapter into `src/infrastructure/prisma/client.ts` and `prisma/seed.ts`.
2. **Prisma 7 Seed Configuration Location:**
   - *Issue:* Prisma 7 ignores `package.json` `"prisma": { "seed": ... }` and requires config in `prisma.config.ts`.
   - *Resolution:* Added `migrations: { seed: 'node prisma/seed.ts' }` to `prisma.config.ts`.

---

## 7. NEXT GATES & BOUNDARIES

- **Admin Account:** Not created (0 records).
- **Contact Channels:** Not seeded (awaiting user decision on official addresses/URLs).
- **Public Design / Content:** Unaltered.
- **Stage 10.2.2:** NOT STARTED.
- **Git Commit / Push:** NOT PERFORMED.

**STOP. Phase 3.5 complete. Awaiting user direction.**
