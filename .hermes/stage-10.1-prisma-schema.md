# Stage 10.1 — Prisma Database Schema Design

## Schema Overview

Database dirancang untuk mendukung CMS portfolio dengan prinsip:
- Normalisasi untuk menghindari redundansi
- Foreign keys untuk referential integrity
- Timestamps untuk audit trail
- Order fields untuk manual sorting
- Published flags untuk content visibility control

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ADMIN & AUTHENTICATION
// ============================================================

model Admin {
  id             String   @id @default(cuid())
  username       String   @unique
  passwordHash   String
  email          String?  @unique // ✅ PostgreSQL allows multiple NULL; non-NULL values must be unique
  sessionVersion Int      @default(1) // ✅ Increment to invalidate all sessions
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("admins")
}

// ============================================================
// HERO SECTION
// ============================================================

model HeroProfile {
  id         String   @id @default("singleton") // ✅ Enforce singleton: only one record allowed
  name       String
  tagline    String   @db.Text
  bio        String   @db.Text
  country    String
  code       String
  timezone   String
  discipline String   @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("hero_profiles")
}

model Role {
  id        String   @id @default(cuid())
  title     String
  primary   Boolean  @default(false)
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("roles")
}

model EngineeringNode {
  id          String   @id @default(cuid())
  tag         String   // e.g., "01 / DECONSTRUCT"
  title       String
  description String   @db.Text
  stack       String?  @db.Text
  highlighted Boolean  @default(false)
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("engineering_nodes")
}

// ============================================================
// ABOUT SECTION
// ============================================================

model AboutProfile {
  id                 String   @id @default("singleton") // ✅ Enforce singleton
  heading            String
  quote              String   @db.Text
  primaryNarrative   String   @db.Text
  secondaryNarrative String   @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@map("about_profiles")
}

model Domain {
  id        String   @id @default(cuid())
  index     String   // e.g., "01"
  title     String
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("domains")
}

model Pillar {
  id          String   @id @default(cuid())
  index       String   // e.g., "01"
  title       String
  description String   @db.Text
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("pillars")
}

// ============================================================
// PROJECTS SECTION
// ============================================================

model Project {
  id           String    @id @default(cuid())
  title        String
  category     String
  description  String    @db.Text
  technologies Json
  thumbnailUrl String?
  projectUrl   String?
  githubUrl    String?
  published    Boolean   @default(false)
  publishedAt  DateTime? // ⚠️ Application-level: published=true → set publishedAt=now()
  order        Int
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("projects")
}

// ============================================================
// EXPERIENCE SECTION
// ============================================================

model Experience {
  id          String    @id @default(cuid())
  role        String
  institution String
  track       String
  description String?   @db.Text
  startDate   DateTime?
  endDate     DateTime?
  order       Int
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("experiences")
}

// ============================================================
// SKILLS SECTION
// ============================================================

model SkillCategory {
  id        String   @id @default(cuid())
  title     String
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  skills    Skill[]

  @@map("skill_categories")
}

model Skill {
  id         String        @id @default(cuid())
  name       String
  categoryId String
  category   SkillCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  order      Int
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@map("skills")
}

// ============================================================
// CONTACT SECTION
// ============================================================

model ContactProfile {
  id          String   @id @default("singleton") // ✅ Enforce singleton
  heading     String
  ctaLabel    String
  description String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("contact_profiles")
}

model ContactChannel {
  id        String   @id @default(cuid())
  label     String   // e.g., "EMAIL"
  value     String   @db.Text
  order     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("contact_channels")
}
```

## Schema Design Decisions

### 1. Singleton Tables (Profile tables)

Tables dengan suffix `Profile` adalah singleton — hanya 1 record aktif:
- `HeroProfile`
- `AboutProfile`
- `ContactProfile`

**Singleton Enforcement Strategy:**

`@default("singleton")` saja TIDAK cukup — ini hanya set default value, tidak mencegah multiple inserts.

**Enforcement Layers:**

**Layer 1: Database Constraint (PostgreSQL CHECK)**
```sql
-- Migration SQL (akan ditambahkan manual setelah Prisma migrate)
ALTER TABLE hero_profiles ADD CONSTRAINT hero_profiles_singleton_check 
  CHECK (id = 'singleton');

ALTER TABLE about_profiles ADD CONSTRAINT about_profiles_singleton_check 
  CHECK (id = 'singleton');

ALTER TABLE contact_profiles ADD CONSTRAINT contact_profiles_singleton_check 
  CHECK (id = 'singleton');
```

Constraint ini memastikan hanya ID `'singleton'` yang bisa exist. Insert dengan ID lain akan FAIL.

**Layer 2: Repository Pattern (Upsert)**
```typescript
// src/infrastructure/repositories/prisma-admin.repository.ts
async updateHeroProfile(data: UpdateHeroProfileDTO): Promise<HeroProfile> {
  const profile = await this.prisma.heroProfile.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  });
  return this.toDomainHeroProfile(profile);
}
```

Upsert pattern:
- Jika record exist → UPDATE
- Jika tidak exist → CREATE dengan id='singleton'
- Tidak ada operasi CREATE terpisah — hanya UPSERT

**Why This Works:**
1. Primary key `id='singleton'` → hanya 1 record dengan ID ini
2. CHECK constraint → reject ID lain
3. Upsert → safe operation, no duplicate risk
4. CMS hanya expose "Edit Profile" button (no "Create" button)

**Migration Implementation (Stage 10.2.1):**
```bash
# 1. Generate Prisma migration
npx prisma migrate dev --name init

# 2. Manually add CHECK constraints
psql $DATABASE_URL -c "
  ALTER TABLE hero_profiles ADD CONSTRAINT hero_profiles_singleton_check CHECK (id = 'singleton');
  ALTER TABLE about_profiles ADD CONSTRAINT about_profiles_singleton_check CHECK (id = 'singleton');
  ALTER TABLE contact_profiles ADD CONSTRAINT contact_profiles_singleton_check CHECK (id = 'singleton');
"

# 3. Seed singleton records
npx prisma db seed
```

CMS hanya expose **Update** operation untuk singleton tables.

### 2. Admin.email Unique Constraint

```prisma
email String? @unique
```

**PostgreSQL Behavior:**
- Multiple `NULL` values allowed dalam unique column (SQL standard)
- Non-NULL values MUST be unique
- Perfect untuk optional email field

**Use Case:**
- Admin bisa login dengan username (REQUIRED)
- Email optional untuk password reset (future feature)
- Jika 2 admin dibutuhkan: keduanya bisa punya email=NULL, atau email berbeda

**Validation:**
- Application layer validates email format jika provided
- Database enforces uniqueness untuk non-NULL emails

### 3. Order Fields
Semua list-type tables memiliki `order: Int` untuk manual sorting di CMS.
Query default: `ORDER BY order ASC`.

### 4. Published Status
`Project` table punya `published: Boolean` dan `publishedAt: DateTime?`.
Public site hanya query `WHERE published = true`.

### 5. JSON vs Relation
`Project.technologies` stored sebagai JSON array:
- Lebih sederhana untuk list string tanpa meta
- Alternatif: buat `Technology` table dengan M:N relation (overkill untuk use case ini)

### 6. Cascade Delete
`Skill` cascade delete on `SkillCategory`:
- Delete category = delete semua skills-nya
- Prevent orphaned skills

### 7. Timestamps
Semua tables punya `createdAt` dan `updatedAt`:
- Audit trail
- CMS bisa tampilkan "Last modified"

### 8. Text Fields
Fields dengan content panjang menggunakan `@db.Text` (PostgreSQL TEXT type):
- `bio`, `description`, `quote`, dll.
- Tidak ada size limit (vs VARCHAR(255))

## Table Relationships

```
SkillCategory 1:N Skill
```

No other foreign keys — most tables independent untuk flexibility.

## Indexes (Recommended)

```prisma
// Add to models if performance issues arise:
@@index([order])          // On tables with sorting
@@index([published])      // On Project
@@index([categoryId])     // On Skill (auto-created by FK)
```

Start tanpa indexes, add setelah performance audit.

## Database Size Estimation

Asumsi data portfolio Agun:
- HeroProfile: 1 row
- Roles: 4 rows
- EngineeringNodes: 3 rows
- AboutProfile: 1 row
- Domains: 4 rows
- Pillars: 3 rows
- Projects: 3-10 rows
- Experiences: 5 rows
- SkillCategories: 4 rows
- Skills: ~15 rows
- ContactProfile: 1 row
- ContactChannels: 3 rows
- Admin: 1 row

Total: ~50-60 rows.
Estimated DB size: < 1 MB.

PostgreSQL free tier (Vercel/Railway/Supabase) cukup.

## Migration Notes

Initial migration akan copy data dari `StaticPortfolioRepository` ke database.
Script migration perlu di Stage 10.2 (implementation phase).
