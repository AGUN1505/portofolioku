# STAGE 10.4 PHASE 5.1 — AUDIT & ARCHITECTURE DESIGN REPORT
## SKILLS, ROLES, ENGINEERING NODES, DOMAINS & PILLARS

**Project:** Personal Portfolio CMS — Agun Firmansyah  
**Project Path:** `D:\portoku\porto`  
**Date:** 2026-11-09  
**Architecture:** Clean Architecture + SOLID + Repository Pattern  
**Phase:** Stage 10.4 Phase 5.1 (Audit & Architecture Design)  
**Execution Mode:** STRICT READ-ONLY AUDIT & DESIGN  
**Status:** COMPLETE — DESIGN SPECIFIED & APPROVED FOR REVIEW  

---

## 1. EXECUTIVE SUMMARY

Stage 10.4 Phase 5.1 establishes the foundational architectural audit and detailed design specification for five core collection modules of the Personal Portfolio CMS:

1. **Skills & Taxonomy** (`SkillCategory` & `Skill`) — 4 categories, 11 skills.
2. **Roles** (`Role`) — 4 hero identity roles.
3. **Engineering Nodes** (`EngineeringNode`) — 3 methodology triad nodes.
4. **Domains** (`Domain`) — 4 technical competence domains.
5. **Pillars** (`Pillar`) — 3 engineering philosophy pillars.

Together, these five modules govern **25 of the 40 records** currently seeded in the PostgreSQL `porto_cms` database.

### Core Audit Outcomes:
- **Zero-Modification Adherence:** The entire audit and design phase was executed in pure read-only mode. No application source code, Prisma schemas, database tables, or environment configurations were altered.
- **Relational vs. Flat Structures:**
  - `SkillCategory` and `Skill` form the only relational parent-child hierarchy with a cascading foreign key constraint (`skills_categoryId_fkey`).
  - `Roles`, `EngineeringNodes`, `Domains`, and `Pillars` are flat, ordered collections with independent primary keys.
- **Public Portfolio Decoupling:** The public portfolio (`app/page.tsx`) strictly uses `StaticPortfolioRepository` and remains 100% unaffected by CMS changes until a future migration phase.
- **Database & Cluster Safety:** The 40-record baseline in `porto_cms` is 100% preserved (`admins = 0`), and all 8 external Laragon databases remain untouched.

---

## 2. DATABASE SCHEMA AUDIT

*Facts obtained directly from `prisma/schema.prisma` and PostgreSQL `information_schema` / `pg_constraint`:*

### 2.1 Model Specifications Summary

| Model / Table | Primary Key | Total Records | Key Fields & Types | Nullable Fields | Constraints & Defaults | Order Field |
|---|---|---:|---|---|---|---|
| `Role` (`roles`) | `id` (Text) | 4 | `title` (Text), `primary` (Boolean), `order` (Int) | None | PK `roles_pkey`, `primary` default `false` | `order` (1..4) |
| `EngineeringNode` (`engineering_nodes`) | `id` (Text) | 3 | `tag` (Text), `title` (Text), `description` (Text), `stack` (Text), `highlighted` (Boolean), `order` (Int) | `stack` | PK `engineering_nodes_pkey`, `highlighted` default `false` | `order` (1..3) |
| `Domain` (`domains`) | `id` (Text) | 4 | `index` (Text), `title` (Text), `order` (Int) | None | PK `domains_pkey` | `order` (1..4) |
| `Pillar` (`pillars`) | `id` (Text) | 3 | `index` (Text), `title` (Text), `description` (Text), `order` (Int) | None | PK `pillars_pkey` | `order` (1..3) |
| `SkillCategory` (`skill_categories`) | `id` (Text) | 4 | `title` (Text), `order` (Int) | None | PK `skill_categories_pkey` | `order` (1..4) |
| `Skill` (`skills`) | `id` (Text) | 11 | `name` (Text), `categoryId` (Text), `order` (Int) | None | PK `skills_pkey`, FK `skills_categoryId_fkey` ON DELETE CASCADE | `order` (1..4 per cat) |

### 2.2 Live Database Content Audit (PostgreSQL `porto_cms`)

#### 1. Roles (`roles`):
- `role_01`: "Software Developer", `primary: true`, `order: 1`
- `role_02`: "Backend Engineer", `primary: true`, `order: 2`
- `role_03`: "Informatics Engineering Student", `primary: false`, `order: 3`
- `role_04`: "Programming Instructor", `primary: false`, `order: 4`

#### 2. Engineering Nodes (`engineering_nodes`):
- `enode_01`: `tag: "01 / DECONSTRUCT"`, `title: "Understand How Systems Work"`, `description: "Analyze domain requirements, data relationships, and core problem constraints."`, `stack: null`, `highlighted: false`, `order: 1`
- `enode_02`: `tag: "02 / ARCHITECT & BUILD"`, `title: "Backend & Practical Solutions"`, `description: "Design clean REST APIs, relational schemas, and reliable application logic."`, `stack: "GO • LARAVEL • EXPRESS • POSTGRESQL"`, `highlighted: true`, `order: 2`
- `enode_03`: `tag: "03 / SHARE & EDUCATE"`, `title: "Programming Instruction"`, `description: "Distill complex technical systems into clear, structured learning for students."`, `stack: null`, `highlighted: false`, `order: 3`

#### 3. Domains (`domains`):
- `domain_01`: `index: "01"`, `title: "Software Engineering"`, `order: 1`
- `domain_02`: `index: "02"`, `title: "Backend Development"`, `order: 2`
- `domain_03`: `index: "03"`, `title: "Problem Solving"`, `order: 3`
- `domain_04`: `index: "04"`, `title: "Educational Technology"`, `order: 4`

#### 4. Pillars (`pillars`):
- `pillar_01`: `index: "01"`, `title: "Backend Systems"`, `description: "Building structured REST APIs, relational data models, and dependable server-side logic with Go, Laravel, and Node.js."`, `order: 1`
- `pillar_02`: `index: "02"`, `title: "Practical Solutions"`, `description: "Translating real-world operational needs into clean, functional web and mobile applications without unnecessary bloat."`, `order: 2`
- `pillar_03`: `index: "03"`, `title: "Knowledge Sharing"`, `description: "Guiding students to grasp computational logic, structured programming, and engineering fundamentals through teaching."`, `order: 3`

#### 5. Skill Categories & Skills (`skill_categories` & `skills`):
- `skill_cat_01`: "Backend Engineering" (`order: 1`):
  - `skill_01`: "Go" (`order: 1`)
  - `skill_02`: "Laravel" (`order: 2`)
  - `skill_03`: "Express.js" (`order: 3`)
  - `skill_04`: "Node.js" (`order: 4`)
- `skill_cat_02`: "Frontend & Mobile" (`order: 2`):
  - `skill_05`: "React" (`order: 1`)
  - `skill_06`: "Flutter" (`order: 2`)
- `skill_cat_03`: "Relational Data" (`order: 3`):
  - `skill_07`: "PostgreSQL" (`order: 1`)
- `skill_cat_04`: "DevOps & Tooling" (`order: 4`):
  - `skill_08`: "Git" (`order: 1`)
  - `skill_09`: "GitHub" (`order: 2`)
  - `skill_10`: "Postman" (`order: 3`)
  - `skill_11`: "Docker" (`order: 4`)

---

## 3. EXISTING DOMAIN & APPLICATION AUDIT

*Facts obtained from inspection of `src/domain/`, `src/application/`, and `src/infrastructure/`:*

1. **Domain Entities Currently Defined:**
   - `src/domain/entities/role.ts`: defines `Role` (`id`, `title`, `primary`, `order`).
   - `src/domain/entities/engineering-node.ts`: defines `EngineeringNode` (`id`, `tag`, `title`, `description`, `stack`, `highlighted`, `order`).
   - `src/domain/entities/domain.ts`: defines `Domain` (`id`, `index`, `title`, `order`).
   - `src/domain/entities/pillar.ts`: defines `Pillar` (`id`, `index`, `title`, `description`, `order`).
   - `src/domain/entities/skill.ts`: defines `Skill` (`id`, `name`, `categoryId`, `order`).
   - `src/domain/entities/skill-category.ts`: defines `SkillCategory` (`id`, `title`, `order`).
   - `src/domain/entities/skill-taxonomy.ts`: defines `SkillTaxonomy` aggregate (`categories: { title, skills: string[] }[]`).
2. **Missing Architectural Components:**
   - **Domain Records:** Specialized record types (e.g. `RoleRecord`, `EngineeringNodeRecord`, `DomainRecord`, `PillarRecord`, `SkillRecord`, `SkillCategoryRecord`) with non-optional metadata are not yet isolated.
   - **Repository Contracts:** `src/domain/repositories/` currently only has contracts for `hero-profile`, `about-profile`, `contact-profile`, `project`, `experience`, `admin`, `rate-limiter`, and `portfolio`. No repository interfaces exist yet for these 5 collections.
   - **Application DTOs & Use Cases:** Zero DTOs, Zod validators, or use cases exist in `src/application/` for these 5 modules.
   - **Infrastructure Repositories:** No Prisma repositories or mappers exist for these 5 modules (except aggregated read-only queries in `PrismaPortfolioRepository`).
   - **Presentation Routes:** Currently contain temporary `ModulePlaceholder` components created during initial scaffolding.

---

## 4. MODULE-SPECIFIC ARCHITECTURE ANALYSIS

### A. SKILLS & TAXONOMY
- **Data Model:** Relational parent-child structure (`SkillCategory` $\rightarrow$ `Skill`).
- **Cascade Deletion Semantics:** Database enforces `ON DELETE CASCADE`. In the CMS application, deleting a category will cascade to delete its child skills. UI must provide a high-visibility warning indicating how many child skills will be deleted.
- **Ordering Hierarchy:**
  - Categories are ordered globally ($1..N$).
  - Skills are ordered locally within their parent `categoryId` ($1..M$).
- **Use Cases Planned:**
  - Categories: `GetSkillCategoriesUseCase`, `CreateSkillCategoryUseCase`, `UpdateSkillCategoryUseCase`, `DeleteSkillCategoryUseCase`, `ReorderSkillCategoriesUseCase`.
  - Skills: `CreateSkillUseCase`, `UpdateSkillUseCase`, `DeleteSkillUseCase`, `ReorderSkillsUseCase` (scoped to category).

### B. ROLES
- **Data Model:** Multi-record collection representing Agun's professional titles in the Hero rotating title.
- **Primary Flag Semantics:** `primary: true` designates the primary titles shown in badges or static summaries ("Software Developer", "Backend Engineer"). Multiple roles can be marked primary.
- **Ordering Semantics:** 1-based sequential integer determining the cycle order.
- **Use Cases Planned:** `GetRolesUseCase`, `GetRoleByIdUseCase`, `CreateRoleUseCase`, `UpdateRoleUseCase`, `DeleteRoleUseCase`, `ReorderRolesUseCase`.

### C. ENGINEERING NODES
- **Data Model:** Flat collection of 3 engineering principles.
- **Tag & Stack:** `tag` provides the numbered editorial prefix (e.g., `01 / DECONSTRUCT`). `stack` is an optional uppercase bulleted tech summary.
- **Highlight Flag:** `highlighted: true` provides visual accent to the central node (currently Node 02).
- **Use Cases Planned:** `GetEngineeringNodesUseCase`, `GetEngineeringNodeByIdUseCase`, `CreateEngineeringNodeUseCase`, `UpdateEngineeringNodeUseCase`, `DeleteEngineeringNodeUseCase`, `ReorderEngineeringNodesUseCase`.

### D. DOMAINS
- **Data Model:** Flat collection of 4 technical focus domains in the About section.
- **Index Field:** Formatted as a 2-character string (`"01"`, `"02"`, `"03"`, `"04"`).
- **Use Cases Planned:** `GetDomainsUseCase`, `GetDomainByIdUseCase`, `CreateDomainUseCase`, `UpdateDomainUseCase`, `DeleteDomainUseCase`, `ReorderDomainsUseCase`.

### E. PILLARS
- **Data Model:** Flat collection of 3 foundational philosophy pillars in the About section.
- **Index Field:** Formatted as `"01"`, `"02"`, `"03"`.
- **Description:** Long-form narrative of engineering values.
- **Use Cases Planned:** `GetPillarsUseCase`, `GetPillarByIdUseCase`, `CreatePillarUseCase`, `UpdatePillarUseCase`, `DeletePillarUseCase`, `ReorderPillarsUseCase`.

---

## 5. CLEAN ARCHITECTURE DESIGN SPECIFICATION

```
                           PRESENTATION LAYER
  ┌─────────────────────────────────────────────────────────────────┐
  │  app/admin/(dashboard)/roles/              (Server + Actions)   │
  │  app/admin/(dashboard)/engineering-nodes/  (Server + Actions)   │
  │  app/admin/(dashboard)/domains/            (Server + Actions)   │
  │  app/admin/(dashboard)/pillars/            (Server + Actions)   │
  │  app/admin/(dashboard)/skills/             (Server + Actions)   │
  └────────────────────────────────┬────────────────────────────────┘
                                   │ calls via CompositionRoot
                                   ▼
                           APPLICATION LAYER
  ┌─────────────────────────────────────────────────────────────────┐
  │  Use Cases (23 Total):                                          │
  │  - Roles (6 use cases)                                          │
  │  - Engineering Nodes (6 use cases)                              │
  │  - Domains (6 use cases)                                        │
  │  - Pillars (6 use cases)                                        │
  │  - Skills & Categories (9 use cases)                            │
  │  DTOs & Zod Validators (Strict Field Whitelisting)              │
  └────────────────────────────────┬────────────────────────────────┘
                                   │ implements / invokes
                                   ▼
                             DOMAIN LAYER
  ┌─────────────────────────────────────────────────────────────────┐
  │  Records: RoleRecord, EngineeringNodeRecord, DomainRecord,      │
  │           PillarRecord, SkillRecord, SkillCategoryRecord        │
  │  Repository Contracts:                                          │
  │  - IRoleRepository                                              │
  │  - IEngineeringNodeRepository                                   │
  │  - IDomainRepository                                            │
  │  - IPillarRepository                                            │
  │  - ISkillRepository                                             │
  └────────────────────────────────▲────────────────────────────────┘
                                   │ implements
                                   │
                         INFRASTRUCTURE LAYER
  ┌────────────────────────────────┴────────────────────────────────┐
  │  Prisma Repositories & Mappers:                                 │
  │  - PrismaRoleRepository & Mapper                                │
  │  - PrismaEngineeringNodeRepository & Mapper                     │
  │  - PrismaDomainRepository & Mapper                              │
  │  - PrismaPillarRepository & Mapper                              │
  │  - PrismaSkillRepository & Mapper                               │
  │  CompositionRoot DI Registrations                               │
  └────────────────────────────────┬────────────────────────────────┘
                                   │ queries via Prisma Adapter
                                   ▼
                         POSTGRESQL (porto_cms)
```

---

## 6. SECURITY DESIGN SPECIFICATION

All planned Server Actions must follow the strict security blueprint proven in Phase 4.4:

1. **Authentication Gate First:**
   Every Server Action must execute `await verifySession()` on line 1 before any DTO processing or database access. Unauthenticated invocations immediately terminate with `{ success: false, error: 'Unauthorized: Admin session required' }`.
2. **Strict Field Whitelisting:**
   DTO schemas strictly parse only permitted editable fields. Client-controlled system fields (`id`, `createdAt`, `updatedAt`) are stripped or rejected.
3. **No Direct Prisma Exposure:**
   All mutations and reads occur exclusively through use cases provided by `CompositionRoot`. Server Components and Actions do not import Prisma.
4. **Atomic Reordering:**
   Reorder actions validate the entire set of IDs, reject duplicates or missing IDs, and execute in atomic PostgreSQL transactions.
5. **Safe Error Handling:**
   Exceptions from repositories or constraints are caught and sanitized. Internal database schemas or stack traces are never exposed to the client.

---

## 7. UI/UX DESIGN SPECIFICATION

Following Agun's explicit design requirements:
- **Palette (Swiss / International Typographic Style):**
  - Background: Warm off-white `#F7F6F2`
  - Text: Near-black `#171717`
  - Secondary: Muted gray `#777777`
  - Accent: Cobalt blue `#2449D8`
  - Borders: Subtle 1px `#DCDAD4`
- **Navigation Hierarchy:**
  - Dedicated per-section pages (1 page = 1 section/task):
    - `/admin/roles` — Hero Section
    - `/admin/engineering-nodes` — Hero Section
    - `/admin/domains` — About Section
    - `/admin/pillars` — About Section
    - `/admin/skills` — Capabilities Section
- **Component Patterns:**
  - Accessible dialog modals (`role="dialog"`, `aria-modal="true"`) for Delete confirmations.
  - Up/Down reorder controls with boundary disabling (first item disables Up, last item disables Down).
  - Clean inline form validation with field-specific error messages.
  - Pending states via `useActionState` and `useFormStatus`.

---

## 8. PUBLIC PORTFOLIO COMPATIBILITY

- **Absolute Decoupling:** `app/page.tsx` continues to instantiate `StaticPortfolioRepository` and invoke `GetPortfolioUseCase`.
- **Zero Schema Bleed:** Adding Prisma repositories, domain records, and use cases for the 5 modules introduces zero breaking changes to public portfolio types (`Portfolio`, `HeroProfile`, `AboutProfile`, `SkillTaxonomy`).
- **Deferred Migration:** The switch from static data to live database data for the public portfolio remains deferred until all CMS modules have been fully implemented, verified, and approved.

---

## 9. DATABASE BASELINE VERIFICATION

*Actual live query execution against PostgreSQL:*

```
porto_cms counts: {
  hero: 1,
  roles: 4,
  nodes: 3,
  about: 1,
  domains: 4,
  pillars: 3,
  projects: 3,
  experiences: 5,
  skillCats: 4,
  skills: 11,
  contact: 1,
  channels: 0,
  admins: 0,
  total: 40
}
```

- **Target DB:** `porto_cms` — precisely 40 records.
- **External Databases:** `Owner`, `db_unm`, `fashiondb`, `padekinapp`, `pesantren`, `powerteam`, `powerteamm`, `tkunh_user_service` are completely intact and untouched.

---

## 10. GIT STATUS & SCOPE AUDIT

- **Modified Files:** Only pre-existing root config and baseline files.
- **Untracked Additions:** Strictly confined to Phase 4 implementation and documentation.
- **Zero Unintended Mutations:** No changes made to `prisma/`, `.env.local`, or public portfolio code.
- **Git State:** 0 commits, 0 pushes.

---

## 11. IMPLEMENTATION ROADMAP FOR PHASE 5

The implementation across the five modules will proceed through structured, gated sub-phases:

1. **Phase 5.2 — Domain & Application Implementation:**
   - Define records and repository contracts in `src/domain/`.
   - Implement DTOs with Zod validation in `src/application/dtos/`.
   - Implement all 23 application use cases in `src/application/use-cases/`.
   - Unit test suite: `scripts/test-phase5.2-unit.ts`.
2. **Phase 5.3 — Infrastructure Integration:**
   - Implement 5 Prisma repositories in `src/infrastructure/repositories/`.
   - Implement 5 persistence mappers in `src/infrastructure/mappers/`.
   - Wire all repositories and use cases into `src/infrastructure/composition-root.ts`.
   - Integration test suite: `scripts/test-phase5.3-infra.ts`.
3. **Phase 5.4 — Presentation Layer Implementation:**
   - Implement Server Components, Server Actions, Client Forms, List Views, and UI boundaries across:
     - `/admin/roles`
     - `/admin/engineering-nodes`
     - `/admin/domains`
     - `/admin/pillars`
     - `/admin/skills`
   - Presentation test suite: `scripts/test-phase5.4-presentation.ts`.
4. **Phase 5.5 — Final Integration Audit & Quality Gates:**
   - Execute all quality gates (`lint`, `tsc`, `build`, all test suites).
   - Verify 40-record database baseline.
   - Deliver Stage 10.4 Phase 5 final audit report.

---

## 12. RISKS & RECOMMENDATIONS

| ID | Module / Area | Risk Description | Severity | Recommended Mitigation |
|---|---|---|---|---|
| R-01 | Skills | Deleting a `SkillCategory` cascades and silently destroys all child `Skill` records in PostgreSQL. | **High** | UI must display the number of affected skills in the confirmation dialog, requiring explicit confirmation. |
| R-02 | Roles | User could uncheck `primary` on all roles, leaving no primary role for the hero badge. | **Medium** | DTO or use case can permit 0 primary roles or enforce at least one primary role depending on display fallback rules. |
| R-03 | Engineering Nodes | Deleting a node could leave gaps in the 3-node methodology layout on the frontend. | **Low** | Layout gracefully handles variable node counts; reorder normalizes order to sequential 1..N. |
| R-04 | Concurrency | Creating items uses `max(order) + 1` without table locks. | **Low** | Single-admin portfolio eliminates concurrent write races in practice. |

---

## 13. FINAL VERDICT

$$\mathbf{VERDICT: \quad PASS \ (ARCHITECTURAL \ DESIGN \ COMPLETE)}$$

### Justification:
1. Complete database schema and row-level baseline verified for all 5 modules across 25 records.
2. Clean Architecture boundaries strictly preserved with inward dependencies and zero infrastructure leaks.
3. 23 use cases and repository contracts fully mapped and specified.
4. Security and authorization protocols defined identically to audited Phase 4 standards.
5. Public portfolio compatibility guaranteed via static repository isolation.
6. Database baseline strictly maintained at 40 records with zero mutations.

---

## 14. STOP CONDITION

Stage 10.4 Phase 5.1 is strictly concluded.

- **No source code was modified.**
- **No database mutations were executed.**
- **Phase 5.2 implementation has NOT begun.**
- **Awaiting explicit user review and approval before proceeding.**
