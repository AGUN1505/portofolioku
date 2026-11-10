# STAGE 10.4 PHASE 4.2 — DOMAIN & APPLICATION LAYER IMPLEMENTATION REPORT

**Project:** Personal Portfolio CMS — Agun Firmansyah  
**Project Path:** `D:\portoku\porto`  
**Stack:** Next.js 16.4.5, TypeScript 5.9.3, PostgreSQL 14.5, Prisma 7.10.1  
**Architecture:** Clean Architecture + SOLID + Repository Pattern  
**Date:** Sunday, November 08, 2026  
**Phase Status:** COMPLETE & VERIFIED (PASS)  

---

## 1. EXECUTIVE SUMMARY

Stage 10.4 Phase 4.2 has successfully implemented the **Domain and Application Layers** for the upcoming Projects and Experiences CMS management modules.

Strict scope boundaries were enforced throughout this phase:
- Zero mutations to `prisma/schema.prisma` or PostgreSQL database state.
- Zero mutations to Presentation layer, UI components, Server Actions, or `CompositionRoot`.
- Zero new third-party dependencies installed (validation is pure TypeScript).
- All 12 use cases (6 Projects, 6 Experiences) implemented following Single Responsibility Principle (SRP).
- Comprehensive automated in-memory unit tests (37 test cases) executed with 100% pass rate.
- Quality gates verified: ESLint (0 errors, 0 warnings), TypeScript strict checks (0 errors), and Next.js Turbopack build passed cleanly.
- Database baseline preserved at exactly 40 records across 13 tables (`admins = 0`, `contact_channels = 0`).

---

## 2. PRE-IMPLEMENTATION AUDIT

Prior to modifying or creating any code, a comprehensive read-only audit verified:
1. **Repository & Entities State:**
   - Public domain entities `Project` and `Experience` (`src/domain/entities/project.ts`, `src/domain/entities/experience.ts`) preserved without alteration to guarantee public portfolio isolation.
   - Separate CMS record entities designed to match database persistence models.
2. **Git Working Tree:**
   - Active branch: `master`.
   - Zero unexpected staged or unstaged modifications in production source code.
3. **Database Baseline Check:**
   - Connected DB: `porto_cms` on PostgreSQL 14.5.
   - Record counts: `projects`: 3, `experiences`: 5, `admins`: 0, `contact_channels`: 0, total: 40.
   - 8 Laragon external cluster databases verified untouched: `Owner`, `db_unm`, `fashiondb`, `padekinapp`, `pesantren`, `powerteam`, `powerteamm`, `tkunh_user_service`.

---

## 3. FILES CREATED AND MODIFIED

### Domain Layer (New Entities & Contracts)
- `src/domain/entities/project-record.ts` (New: strict entity for CMS Project)
- `src/domain/entities/experience-record.ts` (New: strict entity for CMS Experience)
- `src/domain/entities/index.ts` (Modified: re-export `ProjectRecord` and `ExperienceRecord`)
- `src/domain/repositories/project.repository.ts` (New: `IProjectRepository`, `CreateProjectData`, `UpdateProjectData`)
- `src/domain/repositories/experience.repository.ts` (New: `IExperienceRepository`, `CreateExperienceData`, `UpdateExperienceData`)

### Application Layer (DTOs & Validators)
- `src/application/dtos/project.dto.ts` (New: pure TS validator, URL security checks, whitelist sanitization)
- `src/application/dtos/experience.dto.ts` (New: pure TS validator, calendar date parser, date range validation)

### Application Layer (Projects Use Cases)
- `src/application/use-cases/projects/get-projects.use-case.ts`
- `src/application/use-cases/projects/get-project-by-id.use-case.ts`
- `src/application/use-cases/projects/create-project.use-case.ts`
- `src/application/use-cases/projects/update-project.use-case.ts`
- `src/application/use-cases/projects/delete-project.use-case.ts`
- `src/application/use-cases/projects/reorder-projects.use-case.ts`

### Application Layer (Experiences Use Cases)
- `src/application/use-cases/experiences/get-experiences.use-case.ts`
- `src/application/use-cases/experiences/get-experience-by-id.use-case.ts`
- `src/application/use-cases/experiences/create-experience.use-case.ts`
- `src/application/use-cases/experiences/update-experience.use-case.ts`
- `src/application/use-cases/experiences/delete-experience.use-case.ts`
- `src/application/use-cases/experiences/reorder-experiences.use-case.ts`

### Test Suite
- `scripts/test-phase4.2-unit.ts` (New: 37 automated unit tests covering DTOs and use cases using in-memory mock repositories)

---

## 4. DOMAIN ENTITY DESIGN

### 4.1 ProjectRecord (`src/domain/entities/project-record.ts`)
Strict representation of persisted database rows with no optional persisted fields:
```typescript
export interface ProjectRecord {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly thumbnailUrl: string | null;
  readonly projectUrl: string | null;
  readonly githubUrl: string | null;
  readonly published: boolean;
  readonly publishedAt: Date | null;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### 4.2 ExperienceRecord (`src/domain/entities/experience-record.ts`)
Strict representation of experience tenure where `endDate === null` denotes active/ongoing employment (avoiding fabricated `isCurrent` columns):
```typescript
export interface ExperienceRecord {
  readonly id: string;
  readonly role: string;
  readonly institution: string;
  readonly track: string;
  readonly description: string | null;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

---

## 5. REPOSITORY CONTRACT DESIGN

Contracts define operations without importing Application DTOs, keeping Domain purely independent:
- `IProjectRepository`:
  - `getAll(): Promise<ProjectRecord[]>`
  - `getById(id: string): Promise<ProjectRecord | null>`
  - `create(data: CreateProjectData): Promise<ProjectRecord>`
  - `update(id: string, data: UpdateProjectData): Promise<ProjectRecord>`
  - `delete(id: string): Promise<void>`
  - `reorder(orderedIds: string[]): Promise<void>`
- `IExperienceRepository`:
  - `getAll(): Promise<ExperienceRecord[]>`
  - `getById(id: string): Promise<ExperienceRecord | null>`
  - `create(data: CreateExperienceData): Promise<ExperienceRecord>`
  - `update(id: string, data: UpdateExperienceData): Promise<ExperienceRecord>`
  - `delete(id: string): Promise<void>`
  - `reorder(orderedIds: string[]): Promise<void>`

---

## 6. DTO VALIDATION RULES AND RESULTS

### 6.1 Project DTO (`src/application/dtos/project.dto.ts`)
- **Field Constraints:**
  - `title`: required, 2–150 characters, trimmed.
  - `category`: required, 2–100 characters, trimmed.
  - `description`: required, 10–3000 characters, trimmed.
  - `technologies`: required, 1–20 string entries, each trimmed 1–50 characters.
  - `thumbnailUrl`: nullable/optional, max 1000 characters. Allows valid HTTP(S) URLs and safe root-relative paths (`/images/...`). Rejects protocol-relative paths (`//evil.com`), `javascript:`, `data:`, and unsupported schemes.
  - `projectUrl` / `githubUrl`: nullable/optional, max 1000 characters, valid HTTP(S) URLs only.
  - `published`: boolean, defaults to `false` on create if omitted.
  - `order`: positive integer 1–10000.
  - Whitelist: System keys (`id`, `createdAt`, `updatedAt`, `publishedAt`) and unexpected keys are strictly rejected.

### 6.2 Experience DTO (`src/application/dtos/experience.dto.ts`)
- **Field Constraints:**
  - `role`: required, 2–150 characters, trimmed.
  - `institution`: required, 2–150 characters, trimmed.
  - `track`: required, 2–50 characters, trimmed.
  - `description`: nullable/optional, max 3000 characters.
  - `startDate` / `endDate`: nullable/optional ISO date strings.
  - `order`: positive integer 1–10000.
  - **Calendar Integrity:** `parseStrictIsoDate` checks month boundaries and leap years, strictly rejecting invalid calendar dates (e.g., `2026-02-31`, `2026-04-31`, non-leap `2026-02-29`).
  - **Chronological Rule:** Enforces `endDate >= startDate`. `endDate === null` valid for ongoing tenure.
  - Whitelist: System keys and unexpected properties rejected.

---

## 7. TWELVE USE-CASE IMPLEMENTATION DETAILS

All use cases follow Single Responsibility Principle and accept dependencies via constructor injection:
1. **Projects:**
   - `GetProjectsUseCase`: retrieves sorted projects (`order ASC`).
   - `GetProjectByIdUseCase`: retrieves single project or `null`.
   - `CreateProjectUseCase`: validates input, calculates `max(order) + 1` if order omitted, calculates `publishedAt`, persists record.
   - `UpdateProjectUseCase`: checks existence, validates input, manages `publishedAt` transition, persists partial update.
   - `DeleteProjectUseCase`: checks existence, deletes record.
   - `ReorderProjectsUseCase`: validates duplicate/missing/unknown IDs against repository collection, delegates atomic reorder.
2. **Experiences:**
   - `GetExperiencesUseCase`: retrieves sorted experiences (`order ASC`).
   - `GetExperienceByIdUseCase`: retrieves single experience or `null`.
   - `CreateExperienceUseCase`: validates input, calculates `max(order) + 1` if order omitted, persists record.
   - `UpdateExperienceUseCase`: checks existence, cross-validates dates against existing records, updates record.
   - `DeleteExperienceUseCase`: checks existence, deletes record.
   - `ReorderExperiencesUseCase`: validates complete collection, delegates atomic reorder.

---

## 8. PUBLICATION TIMESTAMP BEHAVIOR

Tested and verified in `CreateProjectUseCase` and `UpdateProjectUseCase` using an injectable `nowProvider: () => Date`:
1. **Create Published:** Sets `publishedAt` to current timestamp immediately.
2. **Create Unpublished:** Leaves `publishedAt` as `null`.
3. **Transition to Published:** When `existing.published === false` and `published === true`, updates `publishedAt` to current timestamp.
4. **Transition to Unpublished:** When unpublishing (`published === false`), preserves previous `publishedAt` to maintain publication history.
5. **Republishing:** When republished after being unpublished, updates `publishedAt` to the new current timestamp.
6. **Client Protection:** Direct client input of `publishedAt` is forbidden and rejected by the validator whitelist.

---

## 9. ORDERING AND REORDER VALIDATION

- Automatic Order Assignment: Uses `Math.max(...records.map(r => r.order), 0) + 1`. Works correctly for empty or populated tables.
- Reorder Validation:
  - Detects and rejects duplicate IDs in input array.
  - Detects and rejects count mismatches (missing IDs).
  - Detects and rejects foreign/unknown IDs not in repository.
  - Ensures atomic sequential reordering (1, 2, ... N).

---

## 10. UNIT TEST CASES AND RESULTS

Automated test harness: `scripts/test-phase4.2-unit.ts`
- Total Test Cases: **37**
- Total Passed: **37 (100%)**
- Execution Time: ~140ms
- Database Connection: ZERO (pure in-memory mock repositories)

### Breakdown:
- Projects DTO Tests: 12 tests (required fields, whitespace, boundaries, 20-item tech limit, empty tech item, URL safety, protocol-relative rejection, safe relative paths, whitelist unknown keys, default published, order bounds, update DTO partials).
- Experiences DTO Tests: 7 tests (required fields, whitespace, strict calendar leap year checks, endDate < startDate rejection, null ongoing date, whitelist, update cross-date validation).
- Projects Use Cases: 10 tests (auto order, publishedAt immediate, get all/by ID, transition publish, transition unpublish, republish, not-found update, reorder validation, reorder success, delete existence/success).
- Experiences Use Cases: 8 tests (auto order ongoing, bounded dates, get all/by ID, update cross-date validation, not-found update, reorder validation, reorder success, delete existence/success).

---

## 11. LINT, TYPESCRIPT, AND BUILD RESULTS

- **ESLint (`npm run lint`):** PASS (0 errors, 0 warnings).
- **TypeScript Strict Check (`npx tsc --noEmit`):** PASS (0 errors).
- **Next.js Turbopack Production Build (`npm run build`):** PASS (all 20 static/PPR routes generated successfully).
- **Guardrails Script (`npx tsx scripts/verify-guardrails.ts`):** PASS (zero violations).

---

## 12. DATABASE BASELINE BEFORE / AFTER

| Table | Before Phase 4.2 | After Phase 4.2 | Status |
| :--- | :--- | :--- | :--- |
| `hero_profiles` | 1 | 1 | Verified (Identical) |
| `roles` | 4 | 4 | Verified (Identical) |
| `engineering_nodes` | 3 | 3 | Verified (Identical) |
| `about_profiles` | 1 | 1 | Verified (Identical) |
| `domains` | 4 | 4 | Verified (Identical) |
| `pillars` | 3 | 3 | Verified (Identical) |
| `projects` | 3 | 3 | Verified (Identical) |
| `experiences` | 5 | 5 | Verified (Identical) |
| `skill_categories` | 4 | 4 | Verified (Identical) |
| `skills` | 11 | 11 | Verified (Identical) |
| `contact_profiles` | 1 | 1 | Verified (Identical) |
| `contact_channels` | 0 | 0 | Verified (Identical) |
| `admins` | 0 | 0 | Verified (Identical) |
| **Total Rows** | **40** | **40** | **100% UNCHANGED** |

All 8 Laragon external databases remain completely untouched.

---

## 13. GIT DIFF AND SCOPE COMPLIANCE

Only approved files were added or modified:
- Domain layer: `src/domain/entities/`, `src/domain/repositories/`
- Application layer: `src/application/dtos/`, `src/application/use-cases/projects/`, `src/application/use-cases/experiences/`
- Test suite: `scripts/test-phase4.2-unit.ts`
- Documentation: `.hermes/stage-10.4.4.2-domain-application-implementation.md`

Zero alterations made to:
- `prisma/schema.prisma`
- `prisma/migrations/`
- `.env.local`
- `src/infrastructure/composition-root.ts`
- `app/` (presentation, UI, Server Actions)
- `package.json` / `package-lock.json`

---

## 14. KNOWN LIMITATIONS AND PHASE 4.3 DEPENDENCIES

Phase 4.2 intentionally stops at Domain and Application layers.
The following items are deferred to **Phase 4.3 (Infrastructure & Persistence Integration)**:
1. `PrismaProjectRepository` implementing `IProjectRepository` using `@prisma/adapter-pg`.
2. `PrismaExperienceRepository` implementing `IExperienceRepository`.
3. Relational transaction mapping (`prisma.$transaction`) for atomic reordering and cascade handling for project technologies.
4. Registration of repositories and use cases in `CompositionRoot`.
5. Integration testing with live PostgreSQL database without altering baseline count.

---

## 15. FINAL VERDICT AND STOP CONDITION

**VERDICT: STAGE 10.4 PHASE 4.2 PASS — DOMAIN & APPLICATION LAYERS COMPLETE.**

STOP CONDITION SATISFIED:
- Domain and Application layer components implemented and verified.
- No infrastructure or presentation code written.
- Ready for Stage 10.4 Phase 4.3 upon explicit user authorization.
