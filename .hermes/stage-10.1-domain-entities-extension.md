# Stage 10.1 — Domain Entities Extension Analysis

## Current Domain Entities vs CMS Requirements

### Gap Analysis

#### 1. Project Entity

**Current:**
```typescript
export interface Project {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: ReadonlyArray<string>;
}
```

**CMS Requirements:**
- ✅ id, title, category, description, technologies
- ❌ thumbnailUrl: string | null
- ❌ projectUrl: string | null
- ❌ githubUrl: string | null
- ❌ published: boolean
- ❌ publishedAt: Date | null
- ❌ order: number
- ❌ createdAt: Date
- ❌ updatedAt: Date

**Decision:** Extend entity tanpa breaking changes existing code.

**Proposed Extension:**
```typescript
// src/domain/entities/project.ts
export interface Project {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly description: string;
  readonly technologies: ReadonlyArray<string>;
  
  // CMS fields (optional untuk backward compatibility)
  readonly thumbnailUrl?: string | null;
  readonly projectUrl?: string | null;
  readonly githubUrl?: string | null;
  readonly published?: boolean;
  readonly publishedAt?: Date | null;
  readonly order?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
```

**Backward Compatibility:**
- StaticPortfolioRepository tetap return minimal fields (id, title, category, description, technologies)
- PrismaPortfolioRepository return full fields
- Presentation components check optional fields: `project.thumbnailUrl ?? '/placeholder.png'`

---

#### 2. Experience Entity

**Current:**
```typescript
export interface Experience {
  readonly id: string;
  readonly role: string;
  readonly institution: string;
  readonly track: string;
}
```

**CMS Requirements:**
- ✅ id, role, institution, track
- ❌ description: string | null
- ❌ startDate: Date | null
- ❌ endDate: Date | null
- ❌ order: number
- ❌ createdAt: Date
- ❌ updatedAt: Date

**Proposed Extension:**
```typescript
// src/domain/entities/experience.ts
export interface Experience {
  readonly id: string;
  readonly role: string;
  readonly institution: string;
  readonly track: string;
  
  // CMS fields
  readonly description?: string | null;
  readonly startDate?: Date | null;
  readonly endDate?: Date | null;
  readonly order?: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
```

---

#### 3. HeroProfile Entity

**Current:**
```typescript
export interface HeroProfile {
  readonly name: string;
  readonly tagline: string;
  readonly bio: string;
  readonly location: {
    readonly country: string;
    readonly timezone: string;
    readonly code: string;
  };
  readonly roles: ReadonlyArray<{
    readonly title: string;
    readonly primary: boolean;
  }>;
  readonly engineeringNodes: ReadonlyArray<{
    readonly tag: string;
    readonly title: string;
    readonly description: string;
    readonly stack?: string;
    readonly highlighted: boolean;
  }>;
  readonly discipline: string;
}
```

**CMS Requirements:**
- ✅ All current fields
- ❌ roles need: id, order
- ❌ engineeringNodes need: id, order
- ❌ Profile timestamps

**Decision:** Split ke 3 entities untuk CMS normalization:
1. `HeroProfile` (singleton)
2. `Role` (separate entity)
3. `EngineeringNode` (separate entity)

**Proposed Extension:**
```typescript
// src/domain/entities/hero-profile.ts
export interface HeroProfile {
  readonly id?: string; // CMS only
  readonly name: string;
  readonly tagline: string;
  readonly bio: string;
  readonly location: {
    readonly country: string;
    readonly timezone: string;
    readonly code: string;
  };
  readonly discipline: string;
  
  // Nested arrays deprecated for CMS — use separate Role[] and EngineeringNode[]
  readonly roles?: ReadonlyArray<{
    readonly title: string;
    readonly primary: boolean;
  }>;
  readonly engineeringNodes?: ReadonlyArray<{
    readonly tag: string;
    readonly title: string;
    readonly description: string;
    readonly stack?: string;
    readonly highlighted: boolean;
  }>;
  
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// NEW: src/domain/entities/role.ts
export interface Role {
  readonly id: string;
  readonly title: string;
  readonly primary: boolean;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// NEW: src/domain/entities/engineering-node.ts
export interface EngineeringNode {
  readonly id: string;
  readonly tag: string;
  readonly title: string;
  readonly description: string;
  readonly stack?: string | null;
  readonly highlighted: boolean;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
```

**Backward Compatibility Strategy:**
- `Portfolio` aggregate tetap return `HeroProfile` dengan nested arrays
- PrismaPortfolioRepository compose dari separate queries:
  ```typescript
  const profile = await prisma.heroProfile.findFirst();
  const roles = await prisma.role.findMany({ orderBy: { order: 'asc' } });
  const nodes = await prisma.engineeringNode.findMany({ orderBy: { order: 'asc' } });
  
  return {
    ...profile,
    roles: roles.map(r => ({ title: r.title, primary: r.primary })),
    engineeringNodes: nodes.map(n => ({ tag: n.tag, title: n.title, ... })),
  };
  ```

---

#### 4. AboutProfile Entity

**Current:**
```typescript
export interface AboutProfile {
  readonly heading: string;
  readonly quote: string;
  readonly narratives: {
    readonly primary: string;
    readonly secondary: string;
  };
  readonly domains: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
  }>;
  readonly pillars: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
    readonly description: string;
  }>;
}
```

**CMS Requirements:**
- ✅ heading, quote, narratives
- ❌ domains need: id, order
- ❌ pillars need: id, order
- ❌ Profile timestamps

**Decision:** Split ke 3 entities:
1. `AboutProfile` (singleton)
2. `Domain` (separate entity)
3. `Pillar` (separate entity)

**Proposed Extension:**
```typescript
// src/domain/entities/about-profile.ts
export interface AboutProfile {
  readonly id?: string; // CMS only
  readonly heading: string;
  readonly quote: string;
  readonly narratives: {
    readonly primary: string;
    readonly secondary: string;
  };
  
  // Nested arrays deprecated for CMS
  readonly domains?: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
  }>;
  readonly pillars?: ReadonlyArray<{
    readonly index: string;
    readonly title: string;
    readonly description: string;
  }>;
  
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// NEW: src/domain/entities/domain.ts
export interface Domain {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// NEW: src/domain/entities/pillar.ts
export interface Pillar {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
```

---

#### 5. SkillTaxonomy Entity

**Current:**
```typescript
export interface SkillTaxonomy {
  readonly categories: ReadonlyArray<{
    readonly title: string;
    readonly skills: ReadonlyArray<string>;
  }>;
}
```

**CMS Requirements:**
- ❌ categories need: id, order
- ❌ skills need: id, order
- ❌ timestamps

**Decision:** Split ke 2 entities:
1. `SkillCategory`
2. `Skill`

**Proposed Extension:**
```typescript
// src/domain/entities/skill-taxonomy.ts (keep for backward compat)
export interface SkillTaxonomy {
  readonly categories: ReadonlyArray<{
    readonly title: string;
    readonly skills: ReadonlyArray<string>;
  }>;
}

// NEW: src/domain/entities/skill-category.ts
export interface SkillCategory {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// NEW: src/domain/entities/skill.ts
export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly categoryId: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
```

**Backward Compatibility:**
```typescript
// PrismaPortfolioRepository.getPortfolioData()
const categories = await prisma.skillCategory.findMany({
  include: { skills: { orderBy: { order: 'asc' } } },
  orderBy: { order: 'asc' },
});

const taxonomy: SkillTaxonomy = {
  categories: categories.map(cat => ({
    title: cat.title,
    skills: cat.skills.map(s => s.name),
  })),
};
```

---

#### 6. ContactProfile Entity

**Current:**
```typescript
export interface ContactProfile {
  readonly heading: string;
  readonly ctaLabel: string;
  readonly description: string;
  readonly channels: ReadonlyArray<{
    readonly label: string;
    readonly value: string;
  }>;
}
```

**CMS Requirements:**
- ✅ heading, ctaLabel, description
- ❌ channels need: id, order
- ❌ timestamps

**Proposed Extension:**
```typescript
// src/domain/entities/contact-profile.ts
export interface ContactProfile {
  readonly id?: string; // CMS only
  readonly heading: string;
  readonly ctaLabel: string;
  readonly description: string;
  
  // Nested array deprecated for CMS
  readonly channels?: ReadonlyArray<{
    readonly label: string;
    readonly value: string;
  }>;
  
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

// NEW: src/domain/entities/contact-channel.ts
export interface ContactChannel {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly order: number;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
```

---

## New Domain Entities (Admin)

### Admin Entity

```typescript
// NEW: src/domain/entities/admin.ts
export interface Admin {
  readonly id: string;
  readonly username: string;
  readonly email?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // passwordHash NOT exposed di domain entity (infrastructure only)
}
```

**Security Note:** `passwordHash` hanya ada di Prisma model dan infrastructure layer, TIDAK di domain entity.

---

## Entity Index File Update

```typescript
// src/domain/entities/index.ts
export type { HeroProfile } from "./hero-profile";
export type { Role } from "./role"; // NEW
export type { EngineeringNode } from "./engineering-node"; // NEW
export type { AboutProfile } from "./about-profile";
export type { Domain } from "./domain"; // NEW
export type { Pillar } from "./pillar"; // NEW
export type { Project } from "./project";
export type { Experience } from "./experience";
export type { SkillTaxonomy } from "./skill-taxonomy";
export type { SkillCategory } from "./skill-category"; // NEW
export type { Skill } from "./skill"; // NEW
export type { ContactProfile } from "./contact-profile";
export type { ContactChannel } from "./contact-channel"; // NEW
export type { Portfolio } from "./portfolio";
export type { Admin } from "./admin"; // NEW
```

---

## Portfolio Aggregate Extension

```typescript
// src/domain/entities/portfolio.ts
import type { HeroProfile } from "./hero-profile";
import type { AboutProfile } from "./about-profile";
import type { Project } from "./project";
import type { Experience } from "./experience";
import type { SkillTaxonomy } from "./skill-taxonomy";
import type { ContactProfile } from "./contact-profile";

export interface Portfolio {
  readonly hero: HeroProfile;
  readonly about: AboutProfile;
  readonly projects: ReadonlyArray<Project>;
  readonly experiences: ReadonlyArray<Experience>;
  readonly skills: SkillTaxonomy;
  readonly contact: ContactProfile;
}
```

**No changes needed** — Portfolio aggregate tetap compose dari existing interfaces.

---

## DTOs for CMS Operations

Domain entities READ-ONLY (readonly fields).
CMS mutations butuh DTOs (Data Transfer Objects).

```typescript
// NEW: src/application/dtos/project.dto.ts
export interface CreateProjectDTO {
  title: string;
  category: string;
  description: string;
  technologies: string[];
  thumbnailUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  published: boolean;
}

export interface UpdateProjectDTO {
  title?: string;
  category?: string;
  description?: string;
  technologies?: string[];
  thumbnailUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  published?: boolean;
}

// NEW: src/application/dtos/hero.dto.ts
export interface UpdateHeroProfileDTO {
  name?: string;
  tagline?: string;
  bio?: string;
  country?: string;
  code?: string;
  timezone?: string;
  discipline?: string;
}

export interface CreateRoleDTO {
  title: string;
  primary: boolean;
}

export interface UpdateRoleDTO {
  title?: string;
  primary?: boolean;
}

// ... dst untuk semua entities
```

---

## Migration Impact Summary

### Files to Create (New)
- `src/domain/entities/role.ts`
- `src/domain/entities/engineering-node.ts`
- `src/domain/entities/domain.ts`
- `src/domain/entities/pillar.ts`
- `src/domain/entities/skill-category.ts`
- `src/domain/entities/skill.ts`
- `src/domain/entities/contact-channel.ts`
- `src/domain/entities/admin.ts`
- `src/application/dtos/` (folder dengan 7+ DTO files)

### Files to Modify (Extend)
- `src/domain/entities/project.ts` (add optional CMS fields)
- `src/domain/entities/experience.ts` (add optional CMS fields)
- `src/domain/entities/hero-profile.ts` (add optional id, timestamps)
- `src/domain/entities/about-profile.ts` (add optional id, timestamps)
- `src/domain/entities/contact-profile.ts` (add optional id, timestamps)
- `src/domain/entities/index.ts` (export new entities)

### Files Unchanged (Zero Impact)
- `src/domain/entities/portfolio.ts` ✅
- `src/domain/entities/skill-taxonomy.ts` ✅
- `src/application/use-cases/get-portfolio.ts` ✅
- `src/infrastructure/repositories/static-portfolio.repository.ts` ✅
- All presentation components ✅
- `app/page.tsx` ✅

**Backward Compatibility Guarantee:**
Existing code tetap compile dan run tanpa perubahan.
Optional fields (`?:`) tidak break existing code yang tidak menggunakannya.

---

## Validation Rules (Domain Layer)

```typescript
// NEW: src/domain/validation/project.validation.ts
export class ProjectValidation {
  static validateTitle(title: string): void {
    if (!title.trim()) {
      throw new Error('Project title is required');
    }
    if (title.length > 200) {
      throw new Error('Project title must be under 200 characters');
    }
  }
  
  static validateTechnologies(technologies: string[]): void {
    if (technologies.length === 0) {
      throw new Error('At least one technology is required');
    }
    if (technologies.length > 20) {
      throw new Error('Maximum 20 technologies allowed');
    }
  }
  
  static validateUrl(url: string | null | undefined, fieldName: string): void {
    if (!url) return;
    try {
      new URL(url);
    } catch {
      throw new Error(`${fieldName} must be a valid URL`);
    }
  }
}
```

Use cases call validation before repository:
```typescript
// src/application/use-cases/admin/projects/create-project.ts
export class CreateProjectUseCase {
  async execute(data: CreateProjectDTO): Promise<Project> {
    ProjectValidation.validateTitle(data.title);
    ProjectValidation.validateTechnologies(data.technologies);
    ProjectValidation.validateUrl(data.projectUrl, 'Project URL');
    ProjectValidation.validateUrl(data.githubUrl, 'GitHub URL');
    
    return this.repository.createProject(data);
  }
}
```

**ponytail:** Start dengan simple validation. Upgrade ke Zod schema jika validation logic kompleks (>10 rules per entity).

---

## Summary

**New Entities:** 8 (Role, EngineeringNode, Domain, Pillar, SkillCategory, Skill, ContactChannel, Admin)

**Extended Entities:** 5 (Project, Experience, HeroProfile, AboutProfile, ContactProfile) — all optional fields, backward compatible

**DTOs:** 7+ files (per entity CRUD operations)

**Validation:** Domain-layer validation classes

**Zero Breaking Changes:** Existing public site code untouched

**Next Step (Stage 10.2):**
1. Create new entity files
2. Extend existing entities with optional fields
3. Create DTO types
4. Implement PrismaPortfolioRepository (compose aggregates from normalized tables)
5. Verify backward compatibility via tests
