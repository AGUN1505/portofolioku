# Stage 10.1 — Implementation Roadmap

## Overview

CMS implementation dibagi menjadi incremental phases untuk minimize risk dan maintain portfolio availability.

## Phase Breakdown

### PHASE 0: Prerequisites (Stage 10.1 ✅ COMPLETED)
**Duration:** 1 session
**Status:** DONE

- [x] Project audit
- [x] CMS requirements analysis
- [x] Database schema design
- [x] Architecture design
- [x] Domain entities extension analysis
- [x] Implementation roadmap

**Deliverables:**
- `.hermes/stage-10.1-prisma-schema.md`
- `.hermes/stage-10.1-cms-architecture.md`
- `.hermes/stage-10.1-domain-entities-extension.md`
- `.hermes/stage-10.1-implementation-roadmap.md` (this document)

---

### PHASE 1: Database Foundation (Stage 10.2.1)
**Duration:** ~1 hour
**Dependencies:** None
**Risk:** LOW

**Database Safety Requirements:**

**CRITICAL: Dedicated Database**
- Database name: `porto_cms` (dedicated, isolated)
- **NEVER** use production databases
- **NEVER** use shared databases
- **NEVER** automatically drop/recreate databases
- Verify database target before ANY operation

**Migration Safety Rules:**
1. **Verify Target Database**
   ```sql
   -- Check current database
   SELECT current_database();
   
   -- Verify it's porto_cms before proceeding
   ```

2. **No Destructive Commands**
   - ❌ `prisma migrate reset` (drops database)
   - ❌ `prisma db push --force-reset` (drops tables)
   - ❌ `DROP DATABASE` commands
   - ❌ `TRUNCATE` without explicit approval
   - ✅ `prisma migrate dev` (additive migrations only)

3. **Migration Failure Protocol**
   - Migration fails → STOP immediately
   - Report error, do NOT retry automatically
   - Do NOT drop database as rollback
   - Preserve migration history
   - Investigate cause before retry

4. **Rollback Strategy**
   - Development: document migration state, investigate
   - Production: use `prisma migrate resolve` for failed migrations
   - **NEVER** automatic database deletion

5. **Data Preservation**
   - Existing data retained across migrations
   - Seed operations idempotent (upsert, not insert)
   - No overwriting user-managed content

**Tasks:**
1. **Verify PostgreSQL Installation**
   ```bash
   psql --version
   # Verify service status (Windows)
   Get-Service *postgres*
   ```

2. Install dependencies
   ```bash
   npm install @prisma/client bcryptjs iron-session
   npm install -D prisma @types/bcryptjs
   # Optional for production:
   npm install @upstash/redis
   ```

3. Setup Prisma
   - Extract Prisma schema from `.hermes/stage-10.1-prisma-schema.md`
   - Create `prisma/schema.prisma` dengan struktur:
     ```
     generator client + datasource db
     12 models: Admin, HeroProfile, Role, EngineeringNode, AboutProfile, 
                Domain, Pillar, Project, Experience, SkillCategory, Skill,
                ContactProfile, ContactChannel
     ```
   - **CRITICAL:** Admin includes `sessionVersion Int @default(1)`
   - **CRITICAL:** Singletons use `@id @default("singleton")`
   - **CRITICAL:** LoginAttempt model (optional, untuk PostgreSQL rate limiting)
   - Database URL points to dedicated `porto_cms` database
   - Run: `npx prisma generate` untuk verify schema valid

4. Create Prisma client singleton
   - `src/infrastructure/prisma/client.ts`

5. **Create Dedicated Database (Manual)**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Verify current databases
   \l
   
   # Create dedicated database ONLY if not exists
   CREATE DATABASE porto_cms;
   
   # Exit
   \q
   ```
   
   **Safety Checklist Before Database Creation:**
   - [ ] Verified PostgreSQL connection
   - [ ] Listed existing databases
   - [ ] Confirmed `porto_cms` does NOT exist
   - [ ] Confirmed no name conflict
   - [ ] User has explicit approval

6. **Configure Database Connection**
   ```bash
   # .env.local
   DATABASE_URL="postgresql://postgres:***@localhost:5432/porto_cms"
   SESSION_SECRET="<GENERATE_SECURE_32_CHAR_SECRET>"
   TRUSTED_PROXIES=""  # Empty for development
   
   # Verify connection target
   npx prisma db execute --stdin <<< "SELECT current_database();"
   # Must output: porto_cms
   ```
   
   **SESSION_SECRET Security:**
   
   **Generation (Secure Random):**
   ```bash
   # Option 1: OpenSSL (recommended)
   openssl rand -base64 32
   
   # Option 2: Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # Option 3: PowerShell (Windows)
   [Convert]::ToBase64String((1..32|%{Get-Random -Minimum 0 -Maximum 256}))
   ```
   
   **Requirements:**
   - Minimum 32 characters (Iron Session requirement)
   - Cryptographically secure random generation
   - NEVER use predictable values (password, username, "secret")
   - NEVER commit to Git
   - NEVER print in logs or reports
   
   **Storage:**
   - **Development:** `.env.local` (Git-ignored)
   - **Production:** Environment variables (Vercel, AWS, etc.)
   - **NEVER:** Hardcoded in source code
   - **NEVER:** `.env` (committed to Git)
   
   **Verification:**
   ```bash
   # Verify .gitignore includes .env.local
   grep -q "^\.env\.local$" .gitignore && echo "✅ Safe" || echo "⚠️ Add .env.local to .gitignore"
   
   # Verify secret length
   node -e "console.log(process.env.SESSION_SECRET.length >= 32 ? '✅' : '❌')"
   ```
   
   **Production Checklist:**
   - [ ] SESSION_SECRET generated with cryptographically secure method
   - [ ] Secret stored in environment variables (not committed)
   - [ ] Secret length ≥ 32 characters
   - [ ] Different secret for each environment (dev/staging/prod)
   - [ ] Secret rotation strategy documented
   - [ ] No secrets in logs, reports, or error messages

7. **First Migration (Additive Only)**
   ```bash
   # Generate migration (review SQL first)
   npx prisma migrate dev --name init --create-only
   
   # Review generated SQL in prisma/migrations/
   # Verify no DROP, TRUNCATE, or destructive commands
   
   # Apply migration
   npx prisma migrate dev
   ```

8. **CRITICAL: Add singleton CHECK constraints**
   ```bash
   psql $DATABASE_URL -c "
     ALTER TABLE \"HeroProfile\" ADD CONSTRAINT hero_profile_singleton_check CHECK (id = 'singleton');
     ALTER TABLE \"AboutProfile\" ADD CONSTRAINT about_profile_singleton_check CHECK (id = 'singleton');
     ALTER TABLE \"ContactProfile\" ADD CONSTRAINT contact_profile_singleton_check CHECK (id = 'singleton');
   "
   ```
   
   **Why Manual SQL:**
   - Prisma doesn't support CHECK constraints in schema
   - Must be added after migration
   - Ensures database-level singleton enforcement
   - Must be reproducible (document in migration notes)

9. Seed script
   - `prisma/seed.ts` — copy data from `StaticPortfolioRepository`
   - **CRITICAL:** Use upsert for singletons (idempotent)
   - **CRITICAL:** Seed singleton tables with `id: 'singleton'`
   - **CRITICAL:** Create 1 admin account with `sessionVersion: 1`
   - **CRITICAL:** Hash password with bcrypt (10 rounds minimum)
   - Run: `npx prisma db seed`

10. Verify data
   ```bash
   # Check migration status
   npx prisma migrate status
   
   # Verify singleton constraints
   psql $DATABASE_URL -c "\d+ \"HeroProfile\""
   # Should show: hero_profile_singleton_check CHECK (id = 'singleton'::text)
   
   # Verify data via Prisma Studio
   npx prisma studio
   
   # Verify record counts
   psql $DATABASE_URL -c "
     SELECT 
       'HeroProfile' as table, COUNT(*) as count FROM \"HeroProfile\"
       UNION ALL
       SELECT 'Admin', COUNT(*) FROM \"Admin\"
       UNION ALL
       SELECT 'Project', COUNT(*) FROM \"Project\";
   "
   ```

**Validation:**
- [ ] PostgreSQL service running
- [ ] Database `porto_cms` exists and verified
- [ ] Prisma Studio shows all tables
- [ ] Singleton tables have CHECK constraints
- [ ] Singleton tables have exactly 1 record with id='singleton'
- [ ] Admin.sessionVersion=1
- [ ] Seed data visible in all tables
- [ ] Row counts match static repository data
- [ ] No migration errors
- [ ] Migration history preserved

**Rollback:** 
- **Development:** Document state, investigate, fix migration, retry
- **NOT:** Automatic database drop

---

### PHASE 2: Domain Layer Extension (Stage 10.2.2)
**Duration:** ~30 minutes
**Dependencies:** Phase 1
**Risk:** LOW

**Tasks:**
1. Create new entity files
   - `src/domain/entities/role.ts`
   - `src/domain/entities/engineering-node.ts`
   - `src/domain/entities/domain.ts`
   - `src/domain/entities/pillar.ts`
   - `src/domain/entities/skill-category.ts`
   - `src/domain/entities/skill.ts`
   - `src/domain/entities/contact-channel.ts`
   - `src/domain/entities/admin.ts`

2. Extend existing entities (optional fields)
   - `src/domain/entities/project.ts`
   - `src/domain/entities/experience.ts`
   - `src/domain/entities/hero-profile.ts`
   - `src/domain/entities/about-profile.ts`
   - `src/domain/entities/contact-profile.ts`

3. Update entity index
   - `src/domain/entities/index.ts`

4. Create DTO types
   - `src/application/dtos/project.dto.ts`
   - `src/application/dtos/hero.dto.ts`
   - `src/application/dtos/about.dto.ts`
   - `src/application/dtos/skill.dto.ts`
   - `src/application/dtos/experience.dto.ts`
   - `src/application/dtos/contact.dto.ts`

**Validation:**
- [ ] TypeScript compiles (0 errors)
- [ ] Existing code unchanged (no import errors)
- [ ] `npm run build` succeeds

**Rollback:** Git revert entity files

---

### PHASE 3: Read-Only Repository (Stage 10.2.3)
**Duration:** ~1 hour
**Dependencies:** Phase 2
**Risk:** LOW

**Tasks:**
1. Create `PrismaPortfolioRepository`
   - `src/infrastructure/repositories/prisma-portfolio.repository.ts`
   - Implement `IPortfolioRepository.getPortfolioData()`
   - Query all tables
   - Compose `Portfolio` aggregate
   - Map to domain entities

2. Test repository
   - Create test script: `scripts/test-prisma-repo.ts`
   - Compare output vs `StaticPortfolioRepository`

3. Swap repository in `app/page.tsx`
   ```diff
   - const repository = new StaticPortfolioRepository();
   + const repository = new PrismaPortfolioRepository(prisma);
   ```

4. Verify public site
   - `npm run dev`
   - Check all sections render correctly
   - Compare visual dengan static version

**Validation:**
- [ ] Public site loads without errors
- [ ] All content matches static version
- [ ] No console errors
- [ ] Lighthouse score unchanged

**Rollback:** Revert `app/page.tsx`, switch back to `StaticPortfolioRepository`

**CRITICAL:** Jangan lanjut ke Phase 4 sebelum Phase 3 verified. Public site harus tetap working.

---

### PHASE 4: Admin Repository Contract (Stage 10.2.4)
**Duration:** ~45 minutes
**Dependencies:** Phase 3
**Risk:** LOW

**Tasks:**
1. Create admin repository contract
   - `src/domain/repositories/admin.repository.ts`
   - Define interfaces untuk all CRUD operations

2. Create `PrismaAdminRepository`
   - `src/infrastructure/repositories/prisma-admin.repository.ts`
   - Implement all CRUD methods
   - Start dengan Projects (simplest)

3. Test admin repository
   - Create test script: `scripts/test-admin-repo.ts`
   - Test create, read, update, delete operations

**Validation:**
- [ ] Test script creates project successfully
- [ ] Prisma Studio shows new project
- [ ] Update/delete operations work
- [ ] TypeScript compiles

**Rollback:** Delete test data via Prisma Studio

---

### PHASE 5: Authentication System (Stage 10.2.5)
**Duration:** ~1.5 hours
**Dependencies:** Phase 4
**Risk:** MEDIUM

**Tasks:**
1. Create session encryption/decryption
   - `src/infrastructure/auth/session.ts`
   - Implement encrypt/decrypt with iron-session
   - Session payload: { userId, username, sessionVersion, expiresAt }
   - **CRITICAL:** Include sessionVersion in payload

2. Create AuthService
   - `src/infrastructure/auth/auth-service.ts`
   - Implement login with bcrypt
   - Hash password comparison
   - **CRITICAL:** Fetch sessionVersion from Admin table on login

3. Create Data Access Layer (DAL)
   - `src/infrastructure/auth/dal.ts`
   - Implement `verifySession()` with React.cache()
   - **CRITICAL:** Verify sessionVersion matches DB (1 query per request)
   - Throws error if unauthorized or version mismatch

4. Create Proxy (optimistic checks)
   - `proxy.ts` (root) ✅ Next.js 16 convention (NOT middleware.ts)
   - Protect `/admin/*` routes
   - Redirect to `/admin/login` if no session cookie
   - Optimistic check only — decrypt cookie, no DB query

5. Create rate limiter
   - `src/infrastructure/auth/rate-limiter.ts`
   - **Option A (Dev):** PostgreSQL-backed (create LoginAttempt table)
   - **Option B (Prod):** Redis-backed (@upstash/redis)
   - Fail open on storage error
   - Check BEFORE bcrypt to prevent CPU exhaustion

6. Create login page
   - `app/admin/login/page.tsx`
   - `app/admin/login/actions.ts` (Server Action)
   - Simple form: username + password
   - Call checkLoginRateLimit() first
   - Call authService.login()
   - Create session with current sessionVersion
   - Set cookie (httpOnly, secure, sameSite)

7. Create logout action
   - `app/admin/logout/actions.ts`
   - Verify session first
   - **CRITICAL:** Increment sessionVersion in DB (invalidates all sessions)
   - Delete cookie
   - Redirect to login

8. Create admin layout
   - `app/admin/layout.tsx`
   - Minimal UI: sidebar navigation + logout button

9. Test auth flow
   - Login dengan seeded admin account
   - Verify session cookie set (HTTP-only, Secure, SameSite)
   - Access `/admin/dashboard`
   - Verify Proxy blocks unauthenticated requests
   - Test DAL throws on invalid session
   - Test DAL throws on version mismatch
   - Test logout invalidates session (increment version)
   - Test rate limiter blocks after 5 attempts

**Validation:**
- [ ] Login form works
- [ ] Correct credentials → redirect to dashboard
- [ ] Incorrect credentials → error message
- [ ] Rate limiter blocks after 5 attempts in 15 minutes
- [ ] Proxy redirects `/admin/*` without session cookie
- [ ] DAL verifySession() throws on invalid session
- [ ] DAL verifySession() checks sessionVersion (1 DB query)
- [ ] Logout increments sessionVersion in DB
- [ ] Old sessions rejected after logout (version mismatch)
- [ ] Cookie has httpOnly=true, secure=true (prod), sameSite=lax

**Rollback:** Delete `app/admin/` folder, remove `proxy.ts`

**CRITICAL:** Test extensively. Auth bugs = security vulnerability.

**Security Checklist:**
- [ ] Passwords hashed with bcrypt (salt rounds ≥10)
- [ ] Session encrypted with iron-session
- [ ] HTTP-only cookies (XSS protection)
- [ ] Secure flag in production (HTTPS only)
- [ ] SameSite=lax (CSRF mitigation)
- [ ] Session expiration (7 days)
- [ ] verifySession() called in EVERY Server Action
- [ ] sessionVersion validated on every request
- [ ] Logout invalidates all sessions (increment version)
- [ ] Rate limiting BEFORE bcrypt (CPU exhaustion prevention)
- [ ] Rate limiter fails open (availability over rate limiting)

---

### PHASE 6: Admin Use Cases (Stage 10.2.6)
**Duration:** ~1.5 hours
**Dependencies:** Phase 5
**Risk:** LOW

**Tasks:**
1. Create use case folder structure
   ```
   src/application/use-cases/admin/
   ├── projects/
   │   ├── create-project.ts
   │   ├── update-project.ts
   │   ├── delete-project.ts
   │   └── reorder-projects.ts
   ├── hero/
   │   ├── update-hero-profile.ts
   │   ├── create-role.ts
   │   └── update-engineering-node.ts
   ├── about/
   │   └── update-about-profile.ts
   ├── skills/
   │   └── create-skill-category.ts
   ├── experience/
   │   └── create-experience.ts
   └── contact/
       └── update-contact-profile.ts
   ```

2. Implement use cases
   - Start dengan Projects (full CRUD)
   - Add validation logic
   - Handle business rules (e.g., published=true → set publishedAt)

3. Create Server Actions dengan DAL guards
   - `app/admin/projects/actions.ts`
   - Every action MUST call `await verifySession()` first
   - Extract formData
   - Call use case
   - Return result or error

4. Test use cases
   - Create test script per entity
   - Verify validation errors thrown
   - Verify successful operations
   - Verify unauthorized access blocked

**Example Server Action Pattern:**
```typescript
'use server';
import { verifySession } from '@/src/infrastructure/auth/dal';

export async function createProjectAction(formData: FormData) {
  // ✅ MANDATORY: Auth check
  await verifySession();
  
  // Extract data
  const data = { /* ... */ };
  
  // Call use case
  const useCase = new CreateProjectUseCase(repository);
  return useCase.execute(data);
}
```

**Validation:**
- [ ] All use cases compile
- [ ] Validation logic works
- [ ] Repository methods called correctly
- [ ] Unauthorized requests blocked by DAL
- [ ] published=true auto-sets publishedAt

**Rollback:** Delete use cases folder

---

### PHASE 7: Admin UI — Projects Section (Stage 10.2.7)
**Duration:** ~2 hours
**Dependencies:** Phase 6
**Risk:** MEDIUM

**Tasks:**
1. Create admin components
   - `src/presentation/components/admin/Sidebar.tsx`
   - `src/presentation/components/admin/forms/ProjectForm.tsx`
   - `src/presentation/components/admin/tables/ProjectsTable.tsx`

2. Create projects pages
   - `app/admin/dashboard/page.tsx` (summary)
   - `app/admin/projects/page.tsx` (list)
   - `app/admin/projects/new/page.tsx` (create)
   - `app/admin/projects/[id]/edit/page.tsx` (edit)

3. Create Server Actions
   - `app/admin/projects/actions.ts`
   - `createProjectAction`
   - `updateProjectAction`
   - `deleteProjectAction`
   - `publishProjectAction`

4. Test CRUD flow
   - Create new project via form
   - Edit existing project
   - Delete project
   - Toggle publish status
   - Verify public site reflects changes

**Validation:**
- [ ] Projects list loads
- [ ] Create form submits successfully
- [ ] Edit form pre-fills data
- [ ] Delete confirms and removes record
- [ ] Published projects visible on public site
- [ ] Unpublished projects hidden

**Rollback:** Delete `app/admin/projects/` folder

**MILESTONE:** Jika Projects CRUD works, pattern terbukti. Replicate untuk entities lain.

---

### PHASE 8: Admin UI — Other Sections (Stage 10.2.8)
**Duration:** ~3 hours
**Dependencies:** Phase 7
**Risk:** LOW (pattern established)

**Tasks:**
Replicate Projects pattern untuk:

1. **Hero Section**
   - `app/admin/hero/page.tsx`
   - Edit HeroProfile (singleton)
   - Manage Roles (list + CRUD)
   - Manage EngineeringNodes (list + CRUD)

2. **About Section**
   - `app/admin/about/page.tsx`
   - Edit AboutProfile (singleton)
   - Manage Domains (list + CRUD)
   - Manage Pillars (list + CRUD)

3. **Experience Section**
   - `app/admin/experience/page.tsx`
   - List + CRUD
   - Date picker untuk startDate/endDate

4. **Skills Section**
   - `app/admin/skills/page.tsx`
   - Manage Categories + nested Skills
   - Two-level hierarchy UI

5. **Contact Section**
   - `app/admin/contact/page.tsx`
   - Edit ContactProfile (singleton)
   - Manage ContactChannels (list + CRUD)

**Validation per section:**
- [ ] List loads
- [ ] CRUD operations work
- [ ] Public site reflects changes
- [ ] No TypeScript errors

**Rollback:** Delete section folder

---

### PHASE 9: Polish & UX (Stage 10.2.9)
**Duration:** ~2 hours
**Dependencies:** Phase 8
**Risk:** LOW

**Tasks:**
1. Reorder functionality
   - Drag-drop atau up/down buttons
   - Update `order` field
   - Server Action: `reorderAction`

2. Bulk operations
   - Bulk delete (checkbox + delete button)
   - Bulk publish/unpublish

3. Form validation
   - Client-side validation (HTML5 + React)
   - Server-side validation (use cases)
   - Error messages

4. Loading states
   - Skeleton loaders
   - Disabled buttons during submit
   - Toast notifications

5. Confirm dialogs
   - Delete confirmation
   - Unsaved changes warning

6. Rate limiting (Security Enhancement)
   - `src/infrastructure/auth/rate-limiter.ts`
   - Track login attempts per IP
   - Max 5 attempts per 15 minutes
   - Return 429 Too Many Requests after limit

**Rate Limiter Implementation:**
```typescript
// src/infrastructure/auth/rate-limiter.ts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (!attempt || now > attempt.resetAt) {
    loginAttempts.set(ip, { 
      count: 1, 
      resetAt: now + 15 * 60 * 1000 // 15 minutes
    });
    return true;
  }
  
  if (attempt.count >= 5) {
    return false; // Rate limited
  }
  
  attempt.count++;
  return true;
}
```

**Validation:**
- [ ] Reorder works smoothly
- [ ] Bulk operations work
- [ ] Validation prevents bad data
- [ ] Loading states visible
- [ ] Confirm dialogs prevent accidents
- [ ] Rate limiter blocks after 5 failed login attempts

**Rollback:** Revert polish commits (non-critical features)

---

### PHASE 10: Production Deployment (Stage 10.3)
**Duration:** ~1 hour
**Dependencies:** Phase 9
**Risk:** HIGH

**Tasks:**
1. Setup production database
   - PostgreSQL instance (Vercel/Railway/Supabase)
   - Copy `DATABASE_URL` to production env

2. Run migrations
   ```bash
   npx prisma migrate deploy
   ```

3. Seed production data
   ```bash
   npx prisma db seed
   ```

4. Create admin account
   - Via seed script or manual SQL
   - Strong password

5. Deploy to Vercel
   - Push to main branch
   - Verify environment variables set
   - Monitor deployment logs

6. Post-deployment checks
   - Public site loads
   - Admin login works
   - Test CRUD operations
   - Check Vercel logs for errors

7. Setup monitoring
   - Vercel Analytics
   - Error tracking (Sentry optional)

**Validation:**
- [ ] Production URL loads public site
- [ ] Admin login works
- [ ] CRUD operations work
- [ ] No console errors
- [ ] Database migrations applied
- [ ] Environment variables set

**Rollback:** Revert deployment, restore previous version

---

## Risk Mitigation Strategies

### Database Corruption
**Prevention:**
- Test migrations on local copy first
- Backup production database before migrations
- Use `prisma migrate deploy` (production-safe)

**Recovery:**
- Restore from backup
- Re-run seed script

### Auth Bypass
**Prevention:**
- Test middleware extensively
- Use strong session secrets
- HTTPS in production

**Recovery:**
- Force logout all sessions (change SESSION_SECRET)
- Reset admin password

### Data Loss
**Prevention:**
- Soft delete (add `deletedAt` field) — ponytail: add in Phase 9+
- Confirm dialogs on delete
- Audit logs (add in future)

**Recovery:**
- Restore from backup
- Re-seed from static repository

### Public Site Downtime
**Prevention:**
- Phase 3 must pass 100% before continuing
- Keep `StaticPortfolioRepository` as fallback
- Feature flag: `USE_PRISMA=true/false`

**Recovery:**
- Revert `app/page.tsx` to `StaticPortfolioRepository`
- Public site back online instantly

---

## Testing Checklist

### Unit Tests (Optional — Future)
- [ ] Use cases with mock repository
- [ ] Validation logic

### Integration Tests (Manual — Required)
- [ ] Prisma repository queries return correct data
- [ ] Admin repository CRUD operations work
- [ ] Auth flow (login/logout)

### E2E Tests (Manual — Required)
- [ ] Public site loads all sections
- [ ] Admin CRUD flow per entity
- [ ] Publish/unpublish flow
- [ ] Reorder flow

### Performance Tests (Future)
- [ ] Page load time < 3s
- [ ] Admin form submit < 1s
- [ ] Database query time < 100ms

---

## Success Criteria

**Phase 1-3 (Foundation):**
- ✅ Public site works with Prisma backend
- ✅ No performance degradation
- ✅ Zero downtime during migration

**Phase 4-8 (CMS):**
- ✅ All entities manageable via admin
- ✅ CRUD operations work correctly
- ✅ Changes reflect on public site
- ✅ No data loss

**Phase 9-10 (Production):**
- ✅ CMS deployed and accessible
- ✅ Auth system secure
- ✅ Production data migrated
- ✅ Monitoring setup

---

## Time Estimates

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0. Design (✅ DONE) | 2h | 2h |
| 1. Database | 1h | 3h |
| 2. Domain Layer | 0.5h | 3.5h |
| 3. Read Repository | 1h | 4.5h |
| 4. Admin Repository | 0.75h | 5.25h |
| 5. Authentication | 1h | 6.25h |
| 6. Use Cases | 1.5h | 7.75h |
| 7. Projects UI | 2h | 9.75h |
| 8. Other Sections | 3h | 12.75h |
| 9. Polish | 2h | 14.75h |
| 10. Deployment | 1h | 15.75h |

**Total: ~16 hours (2-3 work days)**

---

## Dependencies Installation Summary

```bash
# Phase 1
npm install @prisma/client bcryptjs iron-session
npm install -D prisma @types/bcryptjs

# Phase 9 (Optional polish)
npm install @dnd-kit/core @dnd-kit/sortable  # Drag-drop reorder
npm install react-hot-toast  # Notifications
npm install zod  # Schema validation (if needed)
```

---

## Environment Variables Required

```env
# .env (local)
DATABASE_URL="postgresql://user:password@localhost:5432/portfolio_dev"
SESSION_SECRET="generate-with-openssl-rand-base64-32"
NODE_ENV="development"

# .env.production (Vercel)
DATABASE_URL="postgresql://user:password@production-host:5432/portfolio_prod"
SESSION_SECRET="different-production-secret"
NODE_ENV="production"
```

---

## Next Steps

**Immediate (Stage 10.2.1):**
1. User approval untuk design docs
2. Install dependencies
3. Setup Prisma
4. Create first migration
5. Run seed script
6. Verify data in Prisma Studio

**Status:** AWAITING USER APPROVAL TO PROCEED WITH IMPLEMENTATION

---

## Notes

- Setiap phase independen — bisa pause/resume kapan saja
- Public site tetap available sepanjang development
- Rollback strategy tersedia di setiap phase
- Incremental approach = low risk
- CMS bisa di-deploy incrementally (Projects first, others later)

**Prinsip:** Ship fast, test often, rollback easy.
