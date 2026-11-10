# Stage 10.1 — CMS Architecture Design

## Architecture Overview

CMS mengikuti Clean Architecture yang sudah ada dengan layer tambahan:

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Public Site    │              │   Admin CMS     │       │
│  │  (app/)         │              │   (app/admin/)  │       │
│  │                 │              │                 │       │
│  │  - Portfolio    │              │  - Dashboard    │       │
│  │  - Components   │              │  - CRUD Forms   │       │
│  │  - View Models  │              │  - Auth Pages   │       │
│  └────────┬────────┘              └────────┬────────┘       │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
┌───────────┼──────────────────────────────────┼──────────────┐
│           │       APPLICATION LAYER          │              │
│  ┌────────▼──────────┐            ┌─────────▼─────────┐    │
│  │  Portfolio        │            │  Admin            │    │
│  │  Use Cases        │            │  Use Cases        │    │
│  │                   │            │                   │    │
│  │  - GetPortfolio   │            │  - CreateProject  │    │
│  │                   │            │  - UpdateAbout    │    │
│  │                   │            │  - DeleteSkill    │    │
│  │                   │            │  - ReorderRoles   │    │
│  │                   │            │  - LoginAdmin     │    │
│  └────────┬──────────┘            └─────────┬─────────┘    │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
┌───────────┼──────────────────────────────────┼──────────────┐
│           │         DOMAIN LAYER             │              │
│  ┌────────▼──────────────────────────────────▼─────────┐   │
│  │              Domain Entities                        │   │
│  │  - Portfolio, Project, Experience, etc.             │   │
│  │  - Repository Contracts (interfaces)                │   │
│  │  - Business Rules & Validation                      │   │
│  └─────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼───────────────────────────────┘
                             │
┌────────────────────────────┼───────────────────────────────┐
│                            │  INFRASTRUCTURE LAYER         │
│  ┌─────────────────────────▼──────────────────────────┐   │
│  │              Repository Implementations             │   │
│  │                                                     │   │
│  │  - StaticPortfolioRepository (existing)            │   │
│  │  - PrismaPortfolioRepository (read portfolio)      │   │
│  │  - PrismaAdminRepository (CMS mutations)           │   │
│  │  - AuthService (login, session)                    │   │
│  └─────────────────────────┬──────────────────────────┘   │
└────────────────────────────┼───────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   via Prisma    │
                    └─────────────────┘
```

## Directory Structure (Proposed)

```
D:\portoku\porto
├── app/
│   ├── page.tsx                    # Public homepage (existing)
│   ├── layout.tsx                  # Public layout (existing)
│   ├── globals.css
│   └── admin/                      # NEW: Admin CMS routes
│       ├── layout.tsx              # Admin layout (auth guard)
│       ├── login/
│       │   └── page.tsx            # Login form
│       ├── dashboard/
│       │   └── page.tsx            # Admin dashboard
│       ├── hero/
│       │   └── page.tsx            # Edit Hero Profile
│       ├── about/
│       │   └── page.tsx            # Edit About Profile
│       ├── projects/
│       │   ├── page.tsx            # List projects
│       │   ├── new/page.tsx        # Create project
│       │   └── [id]/edit/page.tsx  # Edit project
│       ├── experience/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/edit/page.tsx
│       ├── skills/
│       │   └── page.tsx            # Manage categories + skills
│       └── contact/
│           └── page.tsx            # Edit contact profile
├── src/
│   ├── domain/
│   │   ├── entities/              # Existing entities (reuse)
│   │   └── repositories/
│   │       ├── portfolio.repository.ts  # Existing
│   │       └── admin.repository.ts      # NEW: Admin operations contract
│   ├── application/
│   │   └── use-cases/
│   │       ├── get-portfolio.ts   # Existing
│   │       └── admin/             # NEW: Admin use cases
│   │           ├── projects/
│   │           │   ├── create-project.ts
│   │           │   ├── update-project.ts
│   │           │   ├── delete-project.ts
│   │           │   └── reorder-projects.ts
│   │           ├── about/
│   │           │   └── update-about-profile.ts
│   │           ├── hero/
│   │           │   ├── update-hero-profile.ts
│   │           │   ├── create-role.ts
│   │           │   └── update-engineering-node.ts
│   │           ├── skills/
│   │           │   ├── create-skill-category.ts
│   │           │   └── create-skill.ts
│   │           ├── experience/
│   │           │   ├── create-experience.ts
│   │           │   └── update-experience.ts
│   │           ├── contact/
│   │           │   └── update-contact-profile.ts
│   │           └── auth/
│   │               └── login-admin.ts
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── static-portfolio.repository.ts  # Existing
│   │   │   ├── prisma-portfolio.repository.ts  # NEW: Read from DB
│   │   │   └── prisma-admin.repository.ts      # NEW: CMS mutations
│   │   ├── auth/
│   │   │   └── auth-service.ts    # NEW: Login, session, bcrypt
│   │   └── prisma/
│   │       └── client.ts          # NEW: Prisma client singleton
│   └── presentation/
│       ├── components/
│       │   ├── portfolio/         # Existing public components
│       │   └── admin/             # NEW: Admin CMS components
│       │       ├── Sidebar.tsx
│       │       ├── forms/
│       │       │   ├── ProjectForm.tsx
│       │       │   ├── AboutForm.tsx
│       │       │   └── HeroForm.tsx
│       │       └── tables/
│       │           ├── ProjectsTable.tsx
│       │           └── ExperienceTable.tsx
│       ├── mappers/               # Existing
│       └── view-models/           # Existing
├── prisma/
│   ├── schema.prisma              # NEW: Database schema
│   ├── migrations/                # NEW: Auto-generated
│   └── seed.ts                    # NEW: Initial data from static repo
├── .env                           # NEW: DATABASE_URL, SESSION_SECRET
└── .hermes/
    ├── stage-10.1-prisma-schema.md       # This doc
    └── stage-10.1-cms-architecture.md    # Current doc
```

## Repository Pattern Extension

### Existing (Public Site)

```typescript
// src/domain/repositories/portfolio.repository.ts
interface IPortfolioRepository {
  getPortfolioData(): Portfolio;
}

// src/infrastructure/repositories/static-portfolio.repository.ts
class StaticPortfolioRepository implements IPortfolioRepository {
  getPortfolioData(): Portfolio { /* hardcoded data */ }
}

// src/infrastructure/repositories/prisma-portfolio.repository.ts (NEW)
class PrismaPortfolioRepository implements IPortfolioRepository {
  async getPortfolioData(): Promise<Portfolio> {
    // Query Prisma, compose Portfolio aggregate
  }
}
```

**Migration Strategy:**
- Public site tetap pakai `StaticPortfolioRepository` sampai DB siap
- Setelah migration: swap ke `PrismaPortfolioRepository` di `app/page.tsx`

### New (Admin CMS)

```typescript
// src/domain/repositories/admin.repository.ts (NEW)
interface IAdminRepository {
  // Projects
  createProject(data: CreateProjectDTO): Promise<Project>;
  updateProject(id: string, data: UpdateProjectDTO): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  reorderProjects(ids: string[]): Promise<void>;
  
  // Hero
  updateHeroProfile(data: UpdateHeroProfileDTO): Promise<HeroProfile>;
  createRole(data: CreateRoleDTO): Promise<Role>;
  updateRole(id: string, data: UpdateRoleDTO): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  
  // About
  updateAboutProfile(data: UpdateAboutProfileDTO): Promise<AboutProfile>;
  createDomain(data: CreateDomainDTO): Promise<Domain>;
  // ... etc for all entities
  
  // Skills
  createSkillCategory(data: CreateCategoryDTO): Promise<SkillCategory>;
  createSkill(data: CreateSkillDTO): Promise<Skill>;
  // ... etc
  
  // Experience
  createExperience(data: CreateExperienceDTO): Promise<Experience>;
  // ... etc
  
  // Contact
  updateContactProfile(data: UpdateContactDTO): Promise<ContactProfile>;
  // ... etc
}

// src/infrastructure/repositories/prisma-admin.repository.ts (NEW)
class PrismaAdminRepository implements IAdminRepository {
  constructor(private prisma: PrismaClient) {}
  
  async createProject(data: CreateProjectDTO): Promise<Project> {
    const project = await this.prisma.project.create({ data });
    return this.toDomainProject(project);
  }
  
  // ... implement all methods
}
```

## Authentication Strategy

### Iron Session (Recommended for Single-Admin CMS)

**Why Iron Session over Auth.js:**
- Lightweight (~5KB vs ~30KB)
- Full control untuk custom session logic
- Suitable untuk single-admin CMS
- No multi-provider OAuth overhead (not needed)

**Note:** Auth.js (NextAuth.js v5) DOES support Next.js 16, tapi overkill untuk single-admin portfolio CMS. Upgrade ke Auth.js jika membutuhkan OAuth providers atau multi-role management.

**Iron Session Implementation:**
```typescript
// src/infrastructure/auth/auth-service.ts
import { sealData, unsealData } from 'iron-session';
import bcrypt from 'bcryptjs';

export class AuthService {
  async login(username: string, password: string): Promise<Session | null> {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return null;
    
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return null;
    
    return { userId: admin.id, username: admin.username };
  }
  
  async createSession(session: Session): Promise<string> {
    return sealData(session, { password: process.env.SESSION_SECRET! });
  }
  
  async getSession(sealed: string): Promise<Session | null> {
    try {
      return await unsealData(sealed, { password: process.env.SESSION_SECRET! });
    } catch {
      return null;
    }
  }
}
```

**Session Storage: HTTP-only Cookie**
```typescript
// app/admin/login/actions.ts (Server Action)
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthService } from '@/src/infrastructure/auth/auth-service';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  const authService = new AuthService();
  const session = await authService.login(username, password);
  
  if (!session) {
    return { error: 'Invalid credentials' };
  }
  
  const sealed = await authService.createSession(session);
  const cookieStore = await cookies(); // ✅ Next.js 16 requires await
  cookieStore.set('session', sealed, {
    httpOnly: true,                              // ✅ XSS protection
    secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
    sameSite: 'lax',                             // ✅ CSRF mitigation
    maxAge: 60 * 60 * 24 * 7,                    // 7 days
    path: '/',                                   // Available sitewide
  });
  
  redirect('/admin/dashboard');
}
```

**Proxy (Optimistic Auth Check)**

**IMPORTANT:** Next.js 16 renamed `middleware.ts` → `proxy.ts`. Proxy is for **optimistic checks ONLY** (redirects). Security enforcement happens at Data Access Layer.

```typescript
// proxy.ts (root) ✅ Next.js 16 convention
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/src/infrastructure/auth/session';

// Specify protected and public routes
const protectedRoutes = ['/admin/dashboard', '/admin/projects', '/admin/hero', '/admin/about', '/admin/skills', '/admin/experience', '/admin/contact'];
const publicRoutes = ['/admin/login', '/'];

export async function proxy(request: NextRequest) { // ✅ Function name: proxy
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);
  
  // Optimistic check: decrypt session from cookie
  const sessionCookie = request.cookies.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  // Redirect to dashboard if already logged in and accessing login page
  if (path === '/admin/login' && session?.userId) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Exclude static files, API routes, images
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
```

**Data Access Layer (Security Enforcement)**

Proxy = optimistic redirect. **Real authorization** happens at Data Access Layer:

```typescript
// src/infrastructure/auth/dal.ts
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { decrypt } from './session';

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (!sessionCookie) {
    throw new Error('Unauthorized');
  }
  
  const session = await decrypt(sessionCookie);
  
  if (!session?.userId) {
    throw new Error('Unauthorized');
  }
  
  return { userId: session.userId };
});
```

**Server Actions MUST call verifySession:**

```typescript
// app/admin/projects/actions.ts
'use server';
import { verifySession } from '@/src/infrastructure/auth/dal';
import { CreateProjectUseCase } from '@/src/application/use-cases/admin/projects/create-project';

export async function createProjectAction(formData: FormData) {
  // ✅ MANDATORY: Verify session before any operation
  await verifySession();
  
  const data = {
    title: formData.get('title') as string,
    // ... extract form data
  };
  
  const useCase = new CreateProjectUseCase(repository);
  return useCase.execute(data);
}

export async function deleteProjectAction(id: string) {
  // ✅ MANDATORY: Verify session
  await verifySession();
  
  const useCase = new DeleteProjectUseCase(repository);
  return useCase.execute(id);
}
```

**Why Two Layers:**
1. **Proxy:** Fast redirect (runs on edge, no DB query) — user experience
2. **DAL:** Security enforcement (runs on server, closest to data) — actual protection

**Never rely on Proxy alone for security.**

### Alternative: Lucia Auth (Modern, Lightweight)

Jika iron-session terlalu low-level, gunakan Lucia v3:
- Lebih structured session management
- Built-in CSRF protection
- TypeScript first
- ~10KB bundle

**ponytail:** Iron session cukup untuk portfolio CMS single-admin. Upgrade ke Lucia jika perlu multi-role/permissions.

## Session Invalidation & Revocation

### Problem

Iron Session default: session tersimpan di encrypted cookie, tidak ada server-side tracking.
Implikasi: tidak bisa invalidate session sebelum expiry (e.g., logout dari device lain, force logout).

### Solution: Session Versioning

**Session Payload dengan Version:**
```typescript
// src/infrastructure/auth/session.ts
export type SessionPayload = {
  userId: string;
  username: string;
  sessionVersion: number; // ✅ Track session version
  expiresAt: Date;
};
```

**Admin Table tambah sessionVersion:**
```prisma
model Admin {
  id             String   @id @default(cuid())
  username       String   @unique
  passwordHash   String
  email          String?  @unique
  sessionVersion Int      @default(1) // ✅ Increment on logout/password change
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Validate Session dengan Version Check:**
```typescript
// src/infrastructure/auth/dal.ts
import { cache } from 'react';
import { cookies } from 'next/headers';
import { decrypt } from './session';
import { prisma } from '../prisma/client';

export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get('session')?.value;
  
  if (!cookie) {
    throw new Error('Unauthorized');
  }
  
  const session = await decrypt(cookie);
  
  if (!session?.userId || !session?.sessionVersion) {
    throw new Error('Unauthorized');
  }
  
  // ✅ Validate session not expired
  if (new Date(session.expiresAt) < new Date()) {
    throw new Error('Session expired');
  }
  
  // ✅ CRITICAL: Check session version matches DB
  const admin = await prisma.admin.findUnique({
    where: { id: session.userId },
    select: { 
      sessionVersion: true,
      username: true, // Include for audit logging
    },
  });
  
  if (!admin) {
    throw new Error('User not found');
  }
  
  if (admin.sessionVersion !== session.sessionVersion) {
    throw new Error('Session invalidated'); // ✅ Force re-login
  }
  
  return { 
    userId: session.userId,
    username: admin.username,
  };
});
```

**Iron Session decrypt() Implementation:**
```typescript
// src/infrastructure/auth/session.ts
import { sealData, unsealData } from 'iron-session';

export type SessionPayload = {
  userId: string;
  username: string;
  sessionVersion: number;
  expiresAt: Date;
};

const SESSION_SECRET = process.env.SESSION_SECRET!;
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters');
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return sealData(payload, {
    password: SESSION_SECRET,
    ttl: SESSION_TTL,
  });
}

export async function decrypt(cookie: string): Promise<SessionPayload | null> {
  try {
    const payload = await unsealData<SessionPayload>(cookie, {
      password: SESSION_SECRET,
      ttl: SESSION_TTL,
    });
    
    return payload;
  } catch (error) {
    // Invalid/expired cookie
    console.error('Session decrypt error:', error);
    return null;
  }
}
```

**Session Creation on Login:**
```typescript
// src/infrastructure/auth/auth-service.ts
import bcrypt from 'bcryptjs';
import { encrypt, SessionPayload } from './session';

export class AuthService {
  async login(username: string, password: string): Promise<string | null> {
    const admin = await prisma.admin.findUnique({
      where: { username: username.toLowerCase().trim() },
    });
    
    if (!admin) return null;
    
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return null;
    
    // ✅ Create session dengan current sessionVersion
    const payload: SessionPayload = {
      userId: admin.id,
      username: admin.username,
      sessionVersion: admin.sessionVersion, // ✅ Include version
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    
    const sealed = await encrypt(payload);
    return sealed;
  }
}
```

**Logout Action (Invalidate All Sessions):**
```typescript
// app/admin/logout/actions.ts
'use server';
export async function logoutAction() {
  const { userId } = await verifySession();
  
  // ✅ Increment version = invalidate ALL sessions for this user
  await prisma.admin.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
  
  const cookieStore = await cookies();
  cookieStore.delete('session');
  
  redirect('/admin/login');
}
```

**How It Works:**
1. Login → create session dengan current sessionVersion dari DB
2. Every request → DAL checks cookie sessionVersion vs DB sessionVersion
3. Logout/password change → increment DB sessionVersion
4. Old sessions → version mismatch → throw error → force re-login

**Cost:**
- 1 DB query per request (cached via React.cache() **dalam single request**)
- **Cache Scope:** React.cache() memoizes untuk request lifecycle saja, NOT across requests
- Multiple Server Actions dalam 1 request reuse same DB query result
- Acceptable untuk admin CMS (low traffic, typically 1-2 admin requests/sec)

**React.cache() Behavior:**
```typescript
// First call in request: DB query executed
await verifySession(); // → DB query

// Second call in SAME request: cached result reused
await verifySession(); // → cache hit, no DB query

// Next request: cache cleared, new DB query
await verifySession(); // → DB query
```

**Performance:**
- Single admin session check: ~10-20ms (PostgreSQL local)
- Cached calls: <1ms
- Typical admin page: 1-3 Server Actions → 1 DB query total per request

**Alternative (Zero DB Query per Request):**
Store active session IDs di Redis → check existence on verify.
**Trade-off:** Extra Redis dependency + complexity.
**Decision:** NOT worth it untuk single-admin portfolio CMS.

## Distributed Rate Limiting

### Problem

In-memory rate limiter (Map) dari roadmap Phase 9:
- ❌ Lost on server restart
- ❌ Tidak work di multi-instance deployment (Vercel serverless)
- ❌ Attacker bisa bypass dengan rotate IP

### Solution: Database-Backed Rate Limiting

**Option 1: Redis (Recommended untuk Production)**

**Atomic Rate Limiting dengan Lua Script:**

```typescript
// src/infrastructure/auth/rate-limiter.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.RATE_LIMIT_REDIS_URL!,
  token: process.env.RATE_LIMIT_REDIS_TOKEN!,
});

// ✅ Lua script ensures atomicity (INCR + EXPIRE in one operation)
const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local max_attempts = tonumber(ARGV[2])

local current = redis.call('INCR', key)

if current == 1 then
  redis.call('EXPIRE', key, window)
end

return current
`;

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  const normalizedIdentifier = identifier.toLowerCase().trim(); // ✅ Normalize
  const key = `login_attempts:${normalizedIdentifier}`;
  const window = 15 * 60; // 15 minutes in seconds
  const maxAttempts = 5;
  
  try {
    // ✅ Atomic operation via Lua script
    const current = await redis.eval(
      RATE_LIMIT_SCRIPT,
      [key],
      [window.toString(), maxAttempts.toString()]
    ) as number;
    
    return current <= maxAttempts;
  } catch (error) {
    console.error('[SECURITY] Rate limiter error:', error);
    // ⚠️ FAIL-CLOSED for admin CMS security
    // Login page shows "Service temporarily unavailable"
    return false;
  }
}

export async function resetLoginRateLimit(identifier: string): Promise<void> {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const key = `login_attempts:${normalizedIdentifier}`;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('[SECURITY] Failed to reset rate limit:', error);
    // Non-critical: user can still login after timeout
  }
}

export async function getRateLimitStatus(identifier: string): Promise<{ attempts: number; resetAt: number | null }> {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const key = `login_attempts:${normalizedIdentifier}`;
  
  try {
    const [attempts, ttl] = await Promise.all([
      redis.get<number>(key),
      redis.ttl(key)
    ]);
    
    return {
      attempts: attempts || 0,
      resetAt: ttl > 0 ? Date.now() + (ttl * 1000) : null
    };
  } catch {
    return { attempts: 0, resetAt: null };
  }
}
```

**Why Lua Script:**
- ✅ Atomic INCR + EXPIRE (no race condition)
- ✅ Single round-trip to Redis
- ✅ Consistent behavior under concurrent requests

**Fail-Closed Rationale:**
- Admin CMS = high-value target
- Rate limiter unavailable = potential attack
- Temporary inconvenience < security breach
- Public site unaffected (only admin login blocked)

**Usage dalam Login Action:**
```typescript
// app/admin/login/actions.ts
'use server';
import { headers } from 'next/headers';

// ✅ Get client IP from trusted proxy headers
async function getClientIP(): Promise<string | undefined> {
  const headersList = await headers();
  
  // X-Forwarded-For: set by reverse proxies (Vercel, Cloudflare, nginx)
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    // First IP in chain = original client
    return forwarded.split(',')[0].trim();
  }
  
  // X-Real-IP: alternative header
  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp.trim();
  
  return undefined;
}

// ✅ Hybrid identifier: username + IP for stronger protection
function getRateLimitIdentifier(username: string, ip?: string): string {
  const normalized = username.toLowerCase().trim();
  
  // With IP: stronger limit (prevents distributed attack from same user)
  if (ip) return `${normalized}:${ip}`;
  
  // Without IP: username-only (fallback)
  return normalized;
}

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  
  if (!username || !password) {
    return { error: 'Username and password required' };
  }
  
  // ✅ Get IP for rate limiting
  const clientIP = await getClientIP();
  const identifier = getRateLimitIdentifier(username, clientIP);
  
  // ✅ Check rate limit BEFORE bcrypt (prevent CPU exhaustion)
  const allowed = await checkLoginRateLimit(identifier);
  if (!allowed) {
    // Show remaining time if available
    const status = await getRateLimitStatus(identifier);
    const resetIn = status.resetAt 
      ? Math.ceil((status.resetAt - Date.now()) / 60000) 
      : 15;
    
    return { 
      error: `Too many login attempts. Try again in ${resetIn} minutes.` 
    };
  }
  
  const authService = new AuthService();
  const session = await authService.login(username, password);
  
  if (!session) {
    return { error: 'Invalid credentials' };
  }
  
  // ✅ Success → reset counter
  await resetLoginRateLimit(identifier);
  
  // ... set cookie, redirect
}
```

**Rate Limiting Strategy: Three Independent Dimensions**

Implement three independent rate limiters for defense-in-depth:

**Dimension 1: Normalized Username**
```typescript
const usernameKey = `login:username:${username.toLowerCase().trim()}`;
// Limit: 5 attempts / 15 min per username
```

**Dimension 2: Client IP Address**
```typescript
const ipKey = `login:ip:${clientIP}`;
// Limit: 10 attempts / 15 min per IP (allows multiple valid users behind NAT)
```

**Dimension 3: Username + IP Combination**
```typescript
const hybridKey = `login:hybrid:${username.toLowerCase().trim()}:${clientIP}`;
// Limit: 5 attempts / 15 min per username-IP pair (strictest)
```

**Why Three Dimensions:**
- Username-only: prevents credential stuffing (attacker tries many IPs)
- IP-only: prevents distributed brute force (attacker rotates usernames from same IP)
- Hybrid: strongest protection, but allows legitimate login from different location

**Check All Three:**
```typescript
export async function checkLoginRateLimit(username: string, clientIP?: string): Promise<{ allowed: boolean; reason?: string }> {
  const normalizedUsername = username.toLowerCase().trim();
  
  // Check dimension 1: username
  const usernameAllowed = await checkDimension(`login:username:${normalizedUsername}`, 5);
  if (!usernameAllowed) {
    return { allowed: false, reason: 'Too many attempts for this username' };
  }
  
  // Check dimension 2: IP (if available)
  if (clientIP) {
    const ipAllowed = await checkDimension(`login:ip:${clientIP}`, 10);
    if (!ipAllowed) {
      return { allowed: false, reason: 'Too many attempts from this IP address' };
    }
    
    // Check dimension 3: hybrid
    const hybridAllowed = await checkDimension(`login:hybrid:${normalizedUsername}:${clientIP}`, 5);
    if (!hybridAllowed) {
      return { allowed: false, reason: 'Too many attempts for this account from this location' };
    }
  }
  
  return { allowed: true };
}

async function checkDimension(key: string, maxAttempts: number): Promise<boolean> {
  const window = 15 * 60; // 15 minutes
  
  const current = await redis.eval(
    RATE_LIMIT_SCRIPT,
    [key],
    [window.toString(), maxAttempts.toString()]
  ) as number;
  
  return current <= maxAttempts;
}
```

**Reset Strategy:**
On successful login, reset all three dimensions:
```typescript
export async function resetLoginRateLimit(username: string, clientIP?: string): Promise<void> {
  const normalizedUsername = username.toLowerCase().trim();
  const keys = [`login:username:${normalizedUsername}`];
  
  if (clientIP) {
    keys.push(`login:ip:${clientIP}`);
    keys.push(`login:hybrid:${normalizedUsername}:${clientIP}`);
  }
  
  await Promise.all(keys.map(key => redis.del(key)));
}
```

**IP Security Considerations:**

### 1. Trusted Proxy Configuration

**Environment Variable:**
```bash
# .env.local (development)
TRUSTED_PROXIES=""  # Empty = no proxy, ignore forwarded headers

# .env (production - Vercel)
TRUSTED_PROXIES="vercel"  # Built-in Vercel detection

# .env (production - Cloudflare)
TRUSTED_PROXIES="cloudflare"  # Trust Cloudflare IP ranges

# .env (production - custom)
TRUSTED_PROXIES="10.0.0.0/8,172.16.0.0/12"  # CIDR ranges
```

**IP Extraction Logic:**
```typescript
// src/infrastructure/auth/ip-extractor.ts
import { headers } from 'next/headers';

const TRUSTED_PROXIES = process.env.TRUSTED_PROXIES || '';

// Vercel detection: check x-vercel-id header
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1' || TRUSTED_PROXIES === 'vercel';
}

// Cloudflare detection: check CF-Connecting-IP header
function isCloudflareEnvironment(): boolean {
  return TRUSTED_PROXIES === 'cloudflare';
}

export async function getClientIP(): Promise<string | undefined> {
  const headersList = await headers();
  
  // Case 1: Vercel environment
  if (isVercelEnvironment()) {
    // Vercel sanitizes X-Forwarded-For automatically
    const forwarded = headersList.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
  }
  
  // Case 2: Cloudflare environment
  if (isCloudflareEnvironment()) {
    // Cloudflare-specific header (most reliable)
    const cfIP = headersList.get('cf-connecting-ip');
    if (cfIP) return cfIP.trim();
    
    // Fallback to X-Forwarded-For
    const forwarded = headersList.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
  }
  
  // Case 3: Custom trusted proxy (CIDR validation required)
  if (TRUSTED_PROXIES && TRUSTED_PROXIES !== 'vercel' && TRUSTED_PROXIES !== 'cloudflare') {
    // TODO: Implement CIDR validation for custom proxies
    // Only trust X-Forwarded-For if request comes from trusted proxy IP
    // Requires checking socket remote address against CIDR ranges
    console.warn('[SECURITY] Custom proxy configuration requires CIDR validation implementation');
  }
  
  // Case 4: No trusted proxy configured
  // DO NOT read forwarded headers - they can be spoofed
  if (!TRUSTED_PROXIES) {
    // Direct connection: no reliable client IP available in Next.js
    // (Node.js socket IP not exposed to application layer)
    return undefined;
  }
  
  return undefined;
}
```

**Security Rules:**
1. **Never trust forwarded headers without validation**
   - Attacker controls headers on direct connection
   - Spoofed `X-Forwarded-For: 127.0.0.1` bypasses IP-based rate limiting

2. **Fail-safe behavior**
   - No proxy configured → `getClientIP()` returns `undefined`
   - Rate limiting falls back to username-only (still effective)
   - IP rate limiting disabled when IP source untrustworthy

3. **Production deployment checklist**
   - [ ] Set `TRUSTED_PROXIES` environment variable
   - [ ] Verify proxy strips/sanitizes client headers
   - [ ] Test rate limiting with and without IP
   - [ ] Confirm attacker cannot bypass via header injection

### 2. IPv4 vs IPv6 Handling

**IPv6 Considerations:**
- IPv6 addresses easily rotated (privacy extensions)
- /64 subnet often shared by single device
- Rate limiting per full IPv6 address less effective

**Strategy:**
```typescript
function normalizeIP(ip: string): string {
  // IPv4: use as-is
  if (ip.includes('.')) return ip;
  
  // IPv6: consider /64 prefix (optional, trade-off between privacy and security)
  // Option A: Full address (current implementation)
  return ip;
  
  // Option B: /64 prefix (more aggressive, may affect shared networks)
  // const ipv6 = parseIPv6(ip);
  // return ipv6.slice(0, 4).join(':') + '::/64';
}
```

**Trade-off:**
- Full IPv6 address: attacker rotates easily, less effective
- /64 prefix: may affect legitimate users on shared subnet
- **Decision:** Use full address, rely on username rate limit as primary defense

### 3. Deployment-Specific Configuration

**Vercel (Recommended):**
```bash
TRUSTED_PROXIES="vercel"
# Vercel automatically sanitizes X-Forwarded-For
# No additional configuration needed
```

**Cloudflare:**
```bash
TRUSTED_PROXIES="cloudflare"
# Use CF-Connecting-IP header (most reliable)
# Cloudflare strips client-supplied X-Forwarded-For
```

**Custom Nginx/Apache:**
```bash
TRUSTED_PROXIES="10.0.0.0/8"
# Requires CIDR validation implementation
# Only trust headers from known proxy IPs
```

**Development (Local):**
```bash
TRUSTED_PROXIES=""
# No proxy, ignore all forwarded headers
# Rate limiting username-only
```

**Why BEFORE bcrypt:**
- bcrypt intentionally slow (10 rounds ≈ 100ms)
- 100 concurrent requests = 10 seconds CPU
- Rate limit check: <10ms (Redis) or <50ms (PostgreSQL)
- Reject BEFORE expensive operation

**Why Redis:**
- Atomic operations (INCR + EXPIRE)
- TTL built-in
- Shared across all instances (Vercel serverless)
- Fast (< 5ms latency with Upstash)

**Option 2: PostgreSQL (Development Fallback)**

**Atomic Rate Limiting dengan Transaction + Advisory Lock:**

```prisma
model LoginAttempt {
  id         String   @id @default(cuid())
  identifier String   // normalized username or username:ip
  timestamp  DateTime @default(now())
  
  @@index([identifier, timestamp])
  @@map("login_attempts")
}
```

```typescript
// src/infrastructure/auth/rate-limiter-pg.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  const normalizedIdentifier = identifier.toLowerCase().trim(); // ✅ Normalize
  const window = 15 * 60 * 1000; // 15 minutes in ms
  const maxAttempts = 5;
  const cutoff = new Date(Date.now() - window);
  
  try {
    // ✅ Use transaction + advisory lock for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Acquire lock specific to this identifier (prevents concurrent checks)
      const lockId = hashIdentifier(normalizedIdentifier); // BigInt dari hash
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockId})`;
      
      // Count recent attempts
      const count = await tx.loginAttempt.count({
        where: {
          identifier: normalizedIdentifier,
          timestamp: { gte: cutoff },
        },
      });
      
      // Create attempt record
      await tx.loginAttempt.create({
        data: { identifier: normalizedIdentifier },
      });
      
      return count < maxAttempts; // Return BEFORE increment
    });
    
    return result;
  } catch (error) {
    console.error('[SECURITY] Rate limiter error:', error);
    // ⚠️ FAIL-CLOSED for admin CMS
    return false;
  }
}

export async function resetLoginRateLimit(identifier: string): Promise<void> {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  
  try {
    await prisma.loginAttempt.deleteMany({
      where: { identifier: normalizedIdentifier },
    });
  } catch (error) {
    console.error('[SECURITY] Failed to reset rate limit:', error);
  }
}

// Cleanup old attempts (run via cron job)
export async function cleanupOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
  
  await prisma.loginAttempt.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
}

// Hash identifier to BigInt for PostgreSQL advisory lock
function hashIdentifier(identifier: string): bigint {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return BigInt(Math.abs(hash));
}
```

**Why Transaction + Advisory Lock:**
- ✅ Prevents race condition pada concurrent login attempts
- ✅ Advisory lock scoped to identifier (parallel processing berbeda user)
- ✅ Lock released automatically at transaction end
- ✅ Atomic count + insert

**Race Condition Without Lock:**
```
Request A: count=4 → pass
Request B: count=4 → pass (both see 4, both allowed)
Result: 6 attempts, bypass 5-attempt limit
```

**With Advisory Lock:**
```
Request A: lock → count=4 → insert → unlock → pass
Request B: wait → lock → count=5 → insert → unlock → blocked
Result: 5 attempts max enforced
```

**Cleanup Strategy:**
```bash
# Cron job (daily at 3 AM)
0 3 * * * node -e "require('./dist/infrastructure/auth/rate-limiter-pg').cleanupOldAttempts()"
```

**Trade-offs:**
| Aspect | Redis | PostgreSQL |
|--------|-------|------------|
| Speed | ✅ < 5ms | ⚠️ 10-50ms |
| Setup | External service | ✅ Existing DB |
| Cleanup | ✅ Automatic (TTL) | ❌ Manual (cron job) |
| Cost | $0-10/month | ✅ Free |

**Recommendation:**
- **Development:** PostgreSQL (simple, no extra service)
- **Production:** Upstash Redis (fast, auto-cleanup, Vercel-optimized)

**Rate Limit Identifier Strategy:**

```typescript
// Hybrid: username + IP
function getRateLimitIdentifier(username: string, ip?: string): string {
  if (ip) {
    return `${username}:${ip}`; // More strict
  }
  return username; // Fallback
}
```

**Getting IP Address:**
```typescript
import { headers } from 'next/headers';

export async function getClientIP(): Promise<string | undefined> {
  const headersList = await headers();
  
  // Check forwarded IP (behind proxy/CDN)
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback
  return headersList.get('x-real-ip') || undefined;
}
```

**Graceful Degradation:**

Jika Redis/DB unavailable → **FAIL OPEN** (allow request).

Why?
- Login page tetap functional
- Rate limiting = defense-in-depth, bukan primary security
- Primary security = strong password + account lockout (after N failed attempts)

**Account Lockout (Additional Layer):**
```prisma
model Admin {
  // ...
  lockedUntil DateTime? // ✅ Lock account after 10 failed attempts
}
```

Permanent lockout requires manual unlock (via CLI script atau superadmin).

**Summary:**
- ✅ Redis for production (fast, distributed, auto-cleanup)
- ✅ PostgreSQL for development (simple, no extra service)
- ✅ Fail open on storage error (availability > rate limiting)
- ✅ Hybrid identifier (username + IP)
- ✅ Account lockout as fallback (permanent until manual unlock)

## Use Case Examples

### Create Project Use Case

```typescript
// src/application/use-cases/admin/projects/create-project.ts
import type { IAdminRepository } from '@/src/domain/repositories/admin.repository';
import type { Project } from '@/src/domain/entities';

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

export class CreateProjectUseCase {
  constructor(private readonly repository: IAdminRepository) {}
  
  async execute(data: CreateProjectDTO): Promise<Project> {
    // Business validation
    if (!data.title.trim()) {
      throw new Error('Project title is required');
    }
    
    if (data.technologies.length === 0) {
      throw new Error('At least one technology is required');
    }
    
    // Get current max order
    const maxOrder = await this.repository.getMaxProjectOrder();
    
    return this.repository.createProject({
      ...data,
      order: maxOrder + 1,
      publishedAt: data.published ? new Date() : null,
    });
  }
}
```

### Update About Profile Use Case

```typescript
// src/application/use-cases/admin/about/update-about-profile.ts
export interface UpdateAboutProfileDTO {
  heading?: string;
  quote?: string;
  primaryNarrative?: string;
  secondaryNarrative?: string;
}

export class UpdateAboutProfileUseCase {
  constructor(private readonly repository: IAdminRepository) {}
  
  async execute(data: UpdateAboutProfileDTO): Promise<AboutProfile> {
    // Validation
    if (data.quote && data.quote.length > 500) {
      throw new Error('Quote must be under 500 characters');
    }
    
    return this.repository.updateAboutProfile(data);
  }
}
```

## Admin UI Components (Minimal)

### Project Form Component

```typescript
// src/presentation/components/admin/forms/ProjectForm.tsx
'use client';

import { useState } from 'react';

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (data: CreateProjectDTO) => Promise<void>;
}

export function ProjectForm({ initialData, onSubmit }: ProjectFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [technologies, setTechnologies] = useState<string[]>(initialData?.technologies ?? []);
  const [published, setPublished] = useState(initialData?.published ?? false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, category, description, technologies, published });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium">Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
          rows={4}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium">Technologies (comma-separated)</label>
        <input
          type="text"
          value={technologies.join(', ')}
          onChange={(e) => setTechnologies(e.target.value.split(',').map(s => s.trim()))}
          className="mt-1 block w-full rounded border p-2"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm font-medium">Published</label>
      </div>
      
      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Save Project
      </button>
    </form>
  );
}
```

**ponytail:** Admin UI bare minimum — native HTML forms + Tailwind. Upgrade ke Shadcn/ui atau Radix jika perlu rich components (modals, dropdowns, drag-drop reorder).

## Server Actions Pattern (Next.js 16)

```typescript
// app/admin/projects/new/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { PrismaAdminRepository } from '@/src/infrastructure/repositories/prisma-admin.repository';
import { CreateProjectUseCase } from '@/src/application/use-cases/admin/projects/create-project';
import { prisma } from '@/src/infrastructure/prisma/client';

export async function createProjectAction(formData: FormData) {
  const repository = new PrismaAdminRepository(prisma);
  const useCase = new CreateProjectUseCase(repository);
  
  const data = {
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    technologies: (formData.get('technologies') as string).split(',').map(s => s.trim()),
    published: formData.get('published') === 'on',
  };
  
  try {
    await useCase.execute(data);
    redirect('/admin/projects');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to create project' };
  }
}
```

**Usage di page:**
```typescript
// app/admin/projects/new/page.tsx
import { createProjectAction } from './actions';
import { ProjectForm } from '@/src/presentation/components/admin/forms/ProjectForm';

export default function NewProjectPage() {
  return (
    <div>
      <h1>Create New Project</h1>
      <ProjectForm onSubmit={async (data) => {
        'use server';
        await createProjectAction(data);
      }} />
    </div>
  );
}
```

## Data Flow Summary

### Public Site (Read-Only)
```
Browser Request
  → app/page.tsx (Server Component)
  → GetPortfolioUseCase
  → PrismaPortfolioRepository.getPortfolioData()
  → Prisma Client → PostgreSQL
  → Return Portfolio aggregate
  → PortfolioViewMapper
  → Render Components
  → HTML Response
```

### Admin CMS (CRUD)
```
Browser Form Submit
  → Server Action (e.g., createProjectAction)
  → CreateProjectUseCase.execute(DTO)
  → PrismaAdminRepository.createProject()
  → Prisma Client → PostgreSQL INSERT
  → Return created entity
  → redirect('/admin/projects')
  → Revalidate cache
  → Show updated list
```

## Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/portfolio_db"
SESSION_SECRET="generate-with-openssl-rand-base64-32"
NODE_ENV="development"
```

## Security Considerations

1. **Password Hashing:** bcrypt dengan salt rounds 12
2. **Session Secret:** 32+ byte random string, environment variable
3. **CSRF Protection:** Next.js Server Actions handle automatically
4. **SQL Injection:** Prisma handles (parameterized queries)
5. **XSS:** React escapes by default
6. **Auth Guard:** Middleware blocks `/admin/*` routes jika tidak authenticated
7. **Rate Limiting:** Optional — tambah jika deployment public (ponytail: add setelah production monitoring)

## Deployment Checklist

- [ ] PostgreSQL instance (Vercel Postgres / Railway / Supabase)
- [ ] Environment variables set
- [ ] Prisma migrate deploy
- [ ] Seed initial data
- [ ] Create admin account (via seed or manual SQL)
- [ ] Test login flow
- [ ] Test CRUD operations
- [ ] Swap `StaticPortfolioRepository` → `PrismaPortfolioRepository`
- [ ] Verify public site still works
- [ ] Deploy

## Performance Optimization (Future)

**ponytail:** Start without optimization, add jika bottleneck:
- Cache `getPortfolioData()` hasil (Redis / Next.js cache)
- ISR (Incremental Static Regeneration) untuk public pages
- Connection pooling (Prisma built-in)
- Database indexes on frequently queried fields

## Testing Strategy (Future)

**ponytail:** Manual testing cukup untuk MVP. Add automated tests setelah CMS stable:
- Unit tests: Use cases dengan mock repository
- Integration tests: Repository dengan test database
- E2E tests: Playwright untuk admin flow

## Rollback Strategy

Jika CMS implementation gagal atau blocking:
1. Public site tetap pakai `StaticPortfolioRepository` — zero downtime
2. Admin routes bisa di-disable via middleware flag
3. Database migrations reversible via Prisma
4. Feature flag environment variable: `ENABLE_CMS=false`

## Dependencies to Add

```json
// package.json additions
{
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "iron-session": "^8.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

## Migration Path

**Stage 10.2 (Implementation):**
1. Install dependencies
2. Setup Prisma schema
3. Create migration
4. Seed data dari StaticPortfolioRepository
5. Implement PrismaPortfolioRepository
6. Test read operations
7. Implement PrismaAdminRepository
8. Build auth flow
9. Build admin pages
10. Test CMS CRUD
11. Deploy

**Stage 10.3 (Polish):**
- Image upload
- Rich text editor
- Drag-drop reorder
- Bulk operations
- Activity logs
