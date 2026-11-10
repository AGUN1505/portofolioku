# STAGE 10.4 PHASE 4.1 — PROJECTS & EXPERIENCES AUDIT AND ARCHITECTURE DESIGN
**Project:** Personal Portfolio CMS — Agun Firmansyah  
**Project Path:** `D:\portoku\porto`  
**Stack:** Next.js 16.4.5, TypeScript 5.9.3, PostgreSQL 14.5, Prisma 7.10.1  
**Architecture:** Clean Architecture + SOLID + Repository Pattern  
**Phase:** Stage 10.4 Phase 4.1  
**Mode:** STRICT READ-ONLY AUDIT & ARCHITECTURE DESIGN  
**Date:** 2026-11-08  

---

## 1. Executive Summary

This document constitutes the comprehensive read-only audit and architectural blueprint for the implementation of the **Projects Module** and **Experiences Module** within the personal portfolio CMS.

In accordance with strict read-only constraints, **ZERO mutations** were performed on the application source code or the PostgreSQL database. The database baseline remains intact at exactly 40 records, with `admins = 0` and `contact_channels = 0`, and all 8 external Laragon databases are unmolested.

### Key Audit Findings:
1. **Schema Reality vs Assumptions**:
   - The Prisma schema and PostgreSQL database define `Project` and `Experience` models with basic primary keys (`id: TEXT / cuid()`), ordering (`order: Int`), and timestamps.
   - **Crucial Findings**: Neither `slug` nor `featured` exists in the database schema. `Project` utilizes `published: Boolean @default(false)` for visibility. `technologies` is stored as a PostgreSQL `JSONB` array of strings, not a relational foreign key to `Skill`. `Experience` models ongoing tenure via `endDate === null` rather than an explicit `isCurrent` boolean.
2. **Domain & Application Gaps**:
   - Generic domain entity interfaces exist in `src/domain/entities/project.ts` and `experience.ts`, but lack concrete repository interfaces (`IProjectRepository`, `IExperienceRepository`), input DTOs, pure TypeScript validators, and use cases.
3. **Infrastructure State**:
   - Existing `PrismaPortfolioMapper` strips ID prefixes (`project_01 -> 01`) for public presentation compatibility. A dedicated CMS repository layer must maintain exact, verbatim primary keys (`project_01`) for precise database record mutations.
4. **Presentation State**:
   - Admin routes `/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]`, and `/admin/experiences` currently render `ModulePlaceholder`. Collection-based management requires transitioning from singleton forms to lists, creation/editing workflows, deletion dialogs, and atomic transaction reordering.

---

## 2. Existing Project Architecture

The application adheres strictly to Clean Architecture, SOLID design principles, and the Repository Pattern, structured into four concentric layers:

```
[Presentation Layer]
  App Router: Server Components, Client Components (useActionState), Server Actions
       │
       ▼
[Application Layer]
  Use Cases (Single Responsibility), Input DTOs & Pure TS Validators
       │
       ▼
[Domain Layer]
  Domain Entities / Records, Repository Contracts (Zero external dependencies)
       ▲
       │
[Infrastructure Layer]
  Prisma Client Singleton, Prisma Repositories, Mappers, Iron-Session DAL, CompositionRoot
```

### Architectural Guardrails [ACTUALLY VERIFIED]:
- **Prisma Isolation**: The domain layer has zero imports of `@prisma/client` or Prisma runtime utilities.
- **Dependency Inversion**: Use cases depend exclusively on domain repository interfaces (`IHeroProfileRepository`, `IAboutProfileRepository`, `IContactProfileRepository`), wired at runtime via `CompositionRoot`.
- **Public Portfolio Isolation**: `app/page.tsx` continues to consume `StaticPortfolioRepository` via `CompositionRoot.getPortfolioUseCase('static')`. CMS development is completely decoupled from public site rendering.
- **Authorization Authority**: Iron-session cookie verification is enforced server-side via `verifySession()` in `src/infrastructure/auth/dal.ts`.

---

## 3. Prisma Schema and Database Findings

Inspection of `prisma/schema.prisma` and `prisma/migrations/20261107055050_init/migration.sql` reveals the exact database structures [ACTUALLY VERIFIED]:

### 3.1 `Project` Model Analysis

```prisma
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
  publishedAt  DateTime?
  order        Int
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@map("projects")
}
```

#### Detailed Attribute Breakdown:
| Field | DB Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|
| `id` | `TEXT` | No | `cuid()` | Primary Key (`projects_pkey`). Existing rows use `project_01`, `project_02`, `project_03`. |
| `title` | `TEXT` | No | None | Case study title (e.g., "Water Reminder App"). |
| `category` | `TEXT` | No | None | Taxonomy category (e.g., "Mobile & REST API System"). |
| `description` | `TEXT` | No | None | Narrative description. |
| `technologies` | `JSONB` | No | None | Raw JSON array of strings (e.g., `["Flutter", "Laravel", "REST API"]`). |
| `thumbnailUrl` | `TEXT` | Yes | `NULL` | Optional external image URL. |
| `projectUrl` | `TEXT` | Yes | `NULL` | Optional external live URL. |
| `githubUrl` | `TEXT` | Yes | `NULL` | Optional external source repository URL. |
| `published` | `BOOLEAN` | No | `false` | Visibility toggle. All 3 baseline rows have `published: true`. |
| `publishedAt` | `TIMESTAMP(3)`| Yes | `NULL` | Publication timestamp. Baseline rows set to `2026-01-01T00:00:00.000Z`. |
| `order` | `INTEGER` | No | None | Display sort order (1, 2, 3). |
| `createdAt` | `TIMESTAMP(3)`| No | `now()` | Record creation timestamp. |
| `updatedAt` | `TIMESTAMP(3)`| No | Trigger | Record update timestamp. |

#### Schema Invariants & Deviations:
- **Slug**: `slug` is NOT present in the database. Adding a slug field would require a database migration, which is forbidden under read-only mode and unnecessary since records are uniquely addressed by `id`.
- **Featured**: `featured` is NOT present in the database. Featured project logic should not be fabricated; visibility is controlled purely via `published`.
- **Foreign Keys**: `Project` has zero foreign key relationships. Technologies are self-contained in a JSONB array, requiring no join operations with `skills`.

### 3.2 `Experience` Model Analysis

```prisma
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
```

#### Detailed Attribute Breakdown:
| Field | DB Type | Nullable | Default | Constraints / Notes |
|---|---|---|---|---|
| `id` | `TEXT` | No | `cuid()` | Primary Key (`experiences_pkey`). Existing rows use `exp_01` to `exp_05`. |
| `role` | `TEXT` | No | None | Professional title (e.g., "Programming Teacher"). |
| `institution` | `TEXT` | No | None | Organization/Company (e.g., "Timedoor Academy"). |
| `track` | `TEXT` | No | None | Category track (e.g., "EDUCATION", "DATA & OPS", "IT SYSTEMS", "ENGINEERING"). |
| `description` | `TEXT` | Yes | `NULL` | Optional responsibilities/achievements narrative. All 5 baseline rows are currently `null`. |
| `startDate` | `TIMESTAMP(3)`| Yes | `NULL` | Optional period start date. Baseline rows are currently `null`. |
| `endDate` | `TIMESTAMP(3)`| Yes | `NULL` | Optional period end date. `null` indicates ongoing/current tenure. |
| `order` | `INTEGER` | No | None | Display sort order (1 through 5). |
| `createdAt` | `TIMESTAMP(3)`| No | `now()` | Record creation timestamp. |
| `updatedAt` | `TIMESTAMP(3)`| No | Trigger | Record update timestamp. |

#### Schema Invariants & Deviations:
- **Ongoing State**: Modeled implicitly when `endDate` is null. No separate boolean column is needed.
- **Foreign Keys**: `Experience` has zero foreign keys.

---

## 4. Domain Layer Findings

### 4.1 Existing Domain Artifacts [STATIC CODE INSPECTION]
- `src/domain/entities/project.ts`:
  Contains `Project` interface with `technologies: ReadonlyArray<string>`, but marks CMS fields (`order?`, `published?`, `publishedAt?`) as optional for backward compatibility with static portfolio mocks.
- `src/domain/entities/experience.ts`:
  Contains `Experience` interface, with `order?` and `description?` marked optional.

### 4.2 Missing Domain Artifacts [RECOMMENDATION]
To support clean CRUD operations without breaking existing interfaces:
1. `src/domain/entities/project-record.ts`:
   Concrete domain entity representing a persisted project record where `order: number` and `published: boolean` are strictly typed as non-optional.
2. `src/domain/entities/experience-record.ts`:
   Concrete domain entity representing a persisted experience record where `order: number` is strictly typed as non-optional.
3. `src/domain/repositories/project.repository.ts`:
   Contract interface defining:
   ```ts
   export interface IProjectRepository {
     getAll(): Promise<ProjectRecord[]>;
     getById(id: string): Promise<ProjectRecord | null>;
     create(data: CreateProjectData): Promise<ProjectRecord>;
     update(id: string, data: UpdateProjectData): Promise<ProjectRecord>;
     delete(id: string): Promise<void>;
     reorder(orderedIds: string[]): Promise<void>;
   }
   ```
4. `src/domain/repositories/experience.repository.ts`:
   Contract interface defining:
   ```ts
   export interface IExperienceRepository {
     getAll(): Promise<ExperienceRecord[]>;
     getById(id: string): Promise<ExperienceRecord | null>;
     create(data: CreateExperienceData): Promise<ExperienceRecord>;
     update(id: string, data: UpdateExperienceData): Promise<ExperienceRecord>;
     delete(id: string): Promise<void>;
     reorder(orderedIds: string[]): Promise<void>;
   }
   ```

---

## 5. Application Layer Findings

### 5.1 Existing State [STATIC CODE INSPECTION]
The application layer contains auth use cases (`login-admin`, `logout-admin`, `bootstrap-admin`), portfolio getter (`get-portfolio`), and singleton use cases for `hero`, `about`, and `contact`.
**No use cases or DTO validators exist for Projects or Experiences.**

### 5.2 Proposed Use Case Architecture [RECOMMENDATION]

Following the Single Responsibility Principle:

#### Projects Operations:
1. `GetProjectsUseCase`:
   - Responsibility: Fetch all projects ordered by `order asc`.
   - Input: None.
   - Output: `ProjectRecord[]`.
2. `GetProjectByIdUseCase`:
   - Responsibility: Fetch a single project by primary key.
   - Input: `{ id: string }`.
   - Output: `ProjectRecord | null`.
3. `CreateProjectUseCase`:
   - Responsibility: Validate input DTO, compute sequential order (`max(order) + 1` if not provided), persist new record.
   - Input: `rawInput: Record<string, unknown>`.
   - Output: `{ success: boolean; data?: ProjectRecord; errors?: Record<string, string> }`.
4. `UpdateProjectUseCase`:
   - Responsibility: Validate input DTO, verify existence, update record.
   - Input: `{ id: string; rawInput: Record<string, unknown> }`.
   - Output: `{ success: boolean; data?: ProjectRecord; errors?: Record<string, string> }`.
5. `DeleteProjectUseCase`:
   - Responsibility: Verify existence, delete record.
   - Input: `{ id: string }`.
   - Output: `{ success: boolean; error?: string }`.
6. `ReorderProjectsUseCase`:
   - Responsibility: Validate array of IDs, atomically update sequential `order` index in database transaction.
   - Input: `{ orderedIds: string[] }`.
   - Output: `{ success: boolean; error?: string }`.

#### Experiences Operations:
1. `GetExperiencesUseCase`:
   - Responsibility: Fetch all experiences ordered by `order asc`.
   - Output: `ExperienceRecord[]`.
2. `GetExperienceByIdUseCase`:
   - Responsibility: Fetch a single experience by primary key.
   - Output: `ExperienceRecord | null`.
3. `CreateExperienceUseCase`:
   - Responsibility: Validate input DTO, compute sequential order, persist new record.
   - Output: `{ success: boolean; data?: ExperienceRecord; errors?: Record<string, string> }`.
4. `UpdateExperienceUseCase`:
   - Responsibility: Validate input DTO, verify existence, update record.
   - Output: `{ success: boolean; data?: ExperienceRecord; errors?: Record<string, string> }`.
5. `DeleteExperienceUseCase`:
   - Responsibility: Verify existence, delete record.
   - Output: `{ success: boolean; error?: string }`.
6. `ReorderExperiencesUseCase`:
   - Responsibility: Validate array of IDs, atomically update sequential `order` index in database transaction.
   - Output: `{ success: boolean; error?: string }`.

### 5.3 Recommended DTO Validation Boundaries [RECOMMENDATION]

All validators must be pure TypeScript (no third-party schema library required):

#### `Project` Validation Rules (`src/application/dtos/project.dto.ts`):
- `title`: String, trimmed, min 2, max 150 characters. Required.
- `category`: String, trimmed, min 2, max 100 characters. Required.
- `description`: String, trimmed, min 10, max 3000 characters. Required.
- `technologies`: Array of strings (or comma-delimited string parsed into trimmed array). At least 1 item, max 20 items. Each item min 1, max 50 characters. Required.
- `thumbnailUrl`: String or null. If provided, must match `^(https?:\/\/|\/)[^\s]+$` and max 1000 characters.
- `projectUrl`: String or null. If provided, must match `^https?:\/\/[^\s]+$` and max 1000 characters.
- `githubUrl`: String or null. If provided, must match `^https?:\/\/[^\s]+$` and max 1000 characters.
- `published`: Boolean. Default `false`.
- `order`: Positive integer `>= 1`, max 10000. Optional on create (auto-assigned).

#### `Experience` Validation Rules (`src/application/dtos/experience.dto.ts`):
- `role`: String, trimmed, min 2, max 150 characters. Required.
- `institution`: String, trimmed, min 2, max 150 characters. Required.
- `track`: String, trimmed, min 2, max 50 characters. Required. (Recommended convention: uppercase taxonomy).
- `description`: String or null. If provided, trimmed, max 3000 characters.
- `startDate`: ISO Date string or null. If provided, must parse to valid Date.
- `endDate`: ISO Date string or null. If provided, must parse to valid Date. Invariant: If both `startDate` and `endDate` are provided, `endDate >= startDate` must hold. If `null`, represents active/current tenure.
- `order`: Positive integer `>= 1`, max 10000. Optional on create (auto-assigned).

---

## 6. Infrastructure Layer Findings

### 6.1 Existing Mappers & Repositories [STATIC CODE INSPECTION]
- `src/infrastructure/mappers/prisma-portfolio.mapper.ts`:
  Contains `toProject` (lines 109-137) and `toExperience` (lines 139-157).
  **Important Note**: These mapper methods normalize IDs (`project_01 -> 01`, `exp_01 -> 01`) specifically to match static mockup configs.
- `src/infrastructure/repositories/prisma-portfolio.repository.ts`:
  Read-only query combining all portfolio sections for public consumption.

### 6.2 Proposed CMS Repositories [RECOMMENDATION]
1. `src/infrastructure/repositories/prisma-project.repository.ts`:
   - Implements `IProjectRepository`.
   - Uses `prisma.project.findMany({ orderBy: { order: 'asc' } })`.
   - Preserves exact primary key IDs (never trims prefixes).
   - `reorder`: Implemented using `prisma.$transaction(...)` executing batch `prisma.project.update({ where: { id }, data: { order } })`.
2. `src/infrastructure/repositories/prisma-experience.repository.ts`:
   - Implements `IExperienceRepository`.
   - Uses `prisma.experience.findMany({ orderBy: { order: 'asc' } })`.
   - Preserves exact primary key IDs.
   - `reorder`: Implemented using atomic `prisma.$transaction(...)`.
3. `src/infrastructure/composition-root.ts`:
   - Register singleton instances of `PrismaProjectRepository` and `PrismaExperienceRepository`.
   - Register factory methods for all 12 use cases.

---

## 7. Presentation Layer Findings

### 7.1 Existing Admin Routes [ACTUALLY VERIFIED]
- `app/admin/(dashboard)/projects/page.tsx`: Renders `<ModulePlaceholder />`.
- `app/admin/(dashboard)/projects/new/page.tsx`: Renders `<ModulePlaceholder />`.
- `app/admin/(dashboard)/projects/[id]/page.tsx`: Renders `<ModulePlaceholder />`.
- `app/admin/(dashboard)/experiences/page.tsx`: Renders `<ModulePlaceholder />`.

### 7.2 UI Architecture Design: Collection vs Singleton [RECOMMENDATION]

| Aspect | Singleton Modules (Hero, About, Contact) | Collection Modules (Projects, Experiences) |
|---|---|---|
| Record Cardinality | Always 1 row (`id: 'singleton'`) | 0 to N rows (Dynamic collection) |
| Route Structure | Single route (`/admin/hero`) | Multi-route (`/admin/projects`, `/new`, `/[id]`) |
| Primary View | Direct form editor | Data table / card list with management actions |
| Mutation Types | UPDATE only | CREATE, READ, UPDATE, DELETE, REORDER |
| Reordering | Not applicable | Sequential integer resequencing / up-down controls |
| Deletion Safety | Prohibited | Requires explicit confirmation dialog / verification |
| Field Parsing | 1:1 scalar strings | JSON array parsing (technologies), Date nullability |

### 7.3 Projects Management UI Workflow [RECOMMENDATION]:
1. **List View (`/admin/projects`)**:
   - Swiss editorial table layout with headers: `Order`, `Title`, `Category`, `Technologies`, `Published`, `Actions`.
   - Action buttons: "Edit" (navigates to `/admin/projects/[id]`), "Delete" (triggers modal/action), and "Up / Down" reordering.
   - Header button: "+ Add New Project" (navigates to `/admin/projects/new`).
   - Empty state: Clean Swiss container informing zero projects exist with a call-to-action button.
2. **Create View (`/admin/projects/new`)**:
   - Form using `useActionState(createProjectAction)`.
   - Inputs: Title, Category, Description, Technologies (comma-separated text input), Thumbnail URL, Project URL, GitHub URL, Published (checkbox).
   - Success behavior: Redirects to `/admin/projects` or displays banner with "Return to Projects" link.
3. **Edit View (`/admin/projects/[id]`)**:
   - Server Component retrieves project via `CompositionRoot.getGetProjectByIdUseCase().execute(id)`.
   - Returns 404 / error banner if record does not exist.
   - Form pre-populated with initial values, using `useActionState(updateProjectAction)`.

### 7.4 Experiences Management UI Workflow [RECOMMENDATION]:
1. **List View (`/admin/experiences`)**:
   - Chronological table layout: `Order`, `Role`, `Institution`, `Track`, `Period`, `Actions`.
   - Header action: "+ Add Experience" (can link to `/admin/experiences/new` or toggle dedicated form).
2. **Form Controls**:
   - Role, Institution, Track, Description.
   - Period: Start Date (`<input type="date">` or month/year), End Date, and "Currently Active / Ongoing" checkbox (disables End Date input and submits `null`).

---

## 8. Security and Data Integrity Assessment

### 8.1 Authentication Authority [ACTUALLY VERIFIED]
- Every Server Action for Projects and Experiences MUST call `verifySession()` from `src/infrastructure/auth/dal.ts` at the very first line of execution.
- If `!session.isAuth`, immediately return `{ success: false, error: 'Unauthorized. Session is invalid or expired.' }`.
- `proxy.ts` is only a client-facing redirect guard; `verifySession()` is the cryptographic enforcement boundary.

### 8.2 Input Whitelisting & Injection Prevention [RECOMMENDATION]
- Server Actions must strictly construct typed objects from `formData.get(...)` without accepting unchecked dictionary objects.
- All URL inputs (`thumbnailUrl`, `projectUrl`, `githubUrl`) must be validated against `http://` or `https://` schemas to prevent `javascript:` XSS vectors.
- System properties (`id`, `createdAt`, `updatedAt`) must never be client-writable.

### 8.3 Foreign Key Cascades & Deletions [ACTUALLY VERIFIED]
- In `prisma/schema.prisma`, neither `Project` nor `Experience` is referenced by foreign keys.
- Deleting a project or experience will NOT cause foreign key cascade deletion or orphaned child records in other tables.
- Deletions are safe and isolated to their respective tables.

### 8.4 Rate Limiting Evaluation [RECOMMENDATION]
- `MemoryRateLimiter` is currently attached to `/admin/login`.
- For CMS mutation actions, users are already authenticated with Iron Session. Client-side double submission is prevented by `isPending` state disabling submit buttons.
- Applying rate limiting to CMS mutations is optional; recommendation is to keep standard authenticated session verification to avoid blocking rapid editorial saves.

---

## 9. Testing Strategy

Comprehensive verification plan for Phase 4 implementation [RECOMMENDATION]:

### 9.1 Unit Tests (Domain & Application)
- **DTO Validation Tests**:
  - Test required string fields (rejection of empty strings, whitespace-only strings).
  - Test boundary lengths (min and max limits).
  - Test technology array parsing (empty array, excessive items, whitespace trimming).
  - Test URL formats (valid `https://`, invalid protocols like `javascript:`).
  - Test date consistency in Experiences (`endDate < startDate` must fail; null `endDate` must succeed).
- **Use Case Tests**:
  - Test execute with mock repositories for all 12 use cases.
  - Test not-found error handling for invalid IDs in update/delete.

### 9.2 Infrastructure Tests
- **Repository Integration Tests**:
  - Verify `PrismaProjectRepository` queries correctly map domain entities with exact IDs.
  - Verify `reorder` executes atomically in transaction.
  - Verify error handling on duplicate or missing records.

### 9.3 Security Tests
- Verify all Server Actions reject requests when unauthenticated (null session).
- Verify parameter tampering (attempting to override `id` or `createdAt` via form submission) is prevented.

### 9.4 UI & Interaction Tests
- Form pending state verification (`disabled={isPending}`).
- Form error state rendering (`role="alert"`).
- Accessible form associations (`id` matching `htmlFor`).

---

## 10. Recommended Implementation Architecture

The recommended implementation pattern maintains exact architectural symmetry with Phase 3 while supporting collection operations:

```
src/
├── domain/
│   ├── entities/
│   │   ├── project-record.ts         # Concrete CMS project entity
│   │   └── experience-record.ts      # Concrete CMS experience entity
│   └── repositories/
│       ├── project.repository.ts     # IProjectRepository contract
│       └── experience.repository.ts  # IExperienceRepository contract
├── application/
│   ├── dtos/
│   │   ├── project.dto.ts            # DTOs & pure TS validators
│   │   └── experience.dto.ts         # DTOs & pure TS validators
│   └── use-cases/
│       ├── projects/                 # 6 SRP use cases
│       └── experiences/              # 6 SRP use cases
└── infrastructure/
    ├── repositories/
    │   ├── prisma-project.repository.ts
    │   └── prisma-experience.repository.ts
    └── composition-root.ts           # Factory wiring
```

---

## 11. Proposed Phase 4 Roadmap

To ensure zero downtime, minimal diffs, and manageable verification steps, the following 6-phase breakdown is recommended:

### **Phase 4.1 — Audit & Architecture Design** (CURRENT)
- Scope: Read-only audit of schema, domain, application, infrastructure, UI, security, and baseline.
- Approval Gate: User review and explicit approval of architectural blueprint.

### **Phase 4.2 — Domain & Application Layer**
- Scope: Create domain entities (`ProjectRecord`, `ExperienceRecord`), repository contracts (`IProjectRepository`, `IExperienceRepository`), DTOs with pure TS validation, and all 12 use cases.
- Tests: Automated unit test suite verifying DTO validation boundaries and mock use case execution.
- DB Risk: ZERO (pure in-memory logic).

### **Phase 4.3 — Infrastructure Integration**
- Scope: Implement `PrismaProjectRepository`, `PrismaExperienceRepository`, wire into `CompositionRoot`, add testing reset methods.
- Tests: Automated integration tests verifying query mapping and transaction reordering.
- DB Risk: Low (read-only verification of existing 3 projects and 5 experiences).

### **Phase 4.4 — Projects CMS UI**
- Scope: Implement `/admin/projects` (list), `/admin/projects/new` (creation), `/admin/projects/[id]` (editor), Server Actions (`actions.ts`), deletion dialog, and Swiss UI styling.
- Tests: Build, lint, and unauthenticated redirection verification.
- DB Risk: Low.

### **Phase 4.5 — Experiences CMS UI**
- Scope: Implement `/admin/experiences` (list and editor), Server Actions (`actions.ts`), ongoing date toggles, deletion dialog, and Swiss UI styling.
- Tests: Build, lint, and unauthenticated redirection verification.
- DB Risk: Low.

### **Phase 4.6 — Integration & Security Audit**
- Scope: Full regression verification, guardrails audit, database baseline check, documentation report.
- DB Risk: Strict read-only.

---

## 12. Risks and Unresolved Decisions

The following architectural decisions require explicit user direction before Phase 4.2:

1. **Thumbnail & Image Storage**:
   - Schema defines `thumbnailUrl String?`.
   - Current architecture relies exclusively on external image URLs (e.g., hosted on GitHub, Cloudinary, or Imgur).
   - *Recommendation*: Maintain external text URL inputs. Exclude binary file upload / storage middleware to prevent server bloat and maintain zero external cloud dependencies.
2. **Reordering UX**:
   - Reordering can be handled via simple numeric order inputs / Up-Down buttons, or complex drag-and-drop libraries.
   - *Recommendation*: Use simple Up/Down action buttons or editable order inputs. Avoid heavy client-side drag-and-drop libraries (dnd-kit / react-beautiful-dnd) to maintain minimal dependencies and rock-solid Swiss accessibility.
3. **Dedicated New Page vs Inline Modal for Experiences**:
   - For Projects: Separate routes (`/admin/projects/new` and `/admin/projects/[id]`) are already mapped in the folder structure.
   - For Experiences: Should experiences use a dedicated `/admin/experiences/new` route or a toggleable drawer/accordion on `/admin/experiences`?
   - *Recommendation*: Use dedicated routes (`/admin/experiences/new` and `/admin/experiences/[id]`) for consistency with the user's explicit preference ("admin/CMS dashboard designs to be separated into dedicated per-section pages").

---

## 13. Database Baseline Verification

Read-only verification was executed before and after the audit [ACTUALLY VERIFIED]:

```
┌───────────────────┬────────┐
│ Table             │ Rows   │
├───────────────────┼────────┤
│ hero_profiles     │ 1      │
│ roles             │ 4      │
│ engineering_nodes │ 3      │
│ about_profiles    │ 1      │
│ domains           │ 4      │
│ pillars           │ 3      │
│ projects          │ 3      │
│ experiences       │ 5      │
│ skill_categories  │ 4      │
│ skills            │ 11     │
│ contact_profiles  │ 1      │
│ contact_channels  │ 0      │
│ admins            │ 0      │
└───────────────────┴────────┘
TOTAL RECORDS: 40 (Expected: 40)
```

- Target database: `porto_cms` (40 records intact, 0 mutations).
- `admins`: Exactly 0.
- `contact_channels`: Exactly 0.
- 8 External Laragon databases on cluster (`Owner`, `db_unm`, `fashiondb`, `padekinapp`, `pesantren`, `powerteam`, `powerteamm`, `tkunh_user_service`): Verified 100% untouched.

---

## 14. Git and File Integrity Verification

Inspection of Git status [ACTUALLY VERIFIED]:
- Working tree remains clean with respect to the audit.
- Zero source code files (`src/`, `app/`, `prisma/`, `package.json`) modified during this phase.
- Only this documentation file (`.hermes/stage-10.4.4.1-projects-experiences-architecture-design.md`) was created.

---

## 15. Final Verdict and Approval Gate

### Verdict: **AUDIT AND ARCHITECTURE DESIGN COMPLETE (PASS)**

The existing database schema and application architecture fully support the implementation of the Projects and Experiences CMS modules without requiring database migrations, schema alterations, or third-party dependencies.

**STOP CONDITION IS ACTIVE.**  
No source code has been altered. No database mutations have been performed. Phase 4.2 has NOT been initiated. Awaiting user evaluation and explicit approval to proceed.
