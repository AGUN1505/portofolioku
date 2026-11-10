# STAGE 10.3 — PHASE 2: CORE AUTH INFRASTRUCTURE & SERVICES REPORT

**Document Path**: `.hermes/stage-10.3.2-core-auth-infrastructure.md`  
**Execution Date**: 2026-11-07  
**Scope**: Core Auth Infrastructure, Services, Repository Pattern, Rate Limiter, DAL Guard, and Test Suite  
**Target Database**: PostgreSQL 14.5 (`porto_cms`)  
**Security Status**: All Guardrails Maintained (0 admin records, 0 contact channel records, 8 external DBs untouched)

---

## 1. Executive Summary

Stage 10.3 Phase 2 implements the foundational infrastructure and application services for authentication and authorization in accordance with Clean Architecture and SOLID principles.

All components were created without mutating the database state or schema. The database audit confirms that `admins` table retains 0 records and no migration was executed. All test suites pass with 100% success rate, TypeScript typechecks with 0 errors, ESLint passes with 0 warnings/errors, and `next build` passes cleanly.

---

## 2. Inventory of Created and Modified Files

### 2.1 Domain Layer (Contracts & Entities)
- `src/domain/repositories/admin.repository.ts` (NEW): Domain repository interface `IAdminRepository` and internal auth carrier `AdminAuthRecord`.
- `src/domain/repositories/rate-limiter.interface.ts` (NEW): Domain contract `IRateLimiter` and `RateLimitCheckResult`.

### 2.2 Infrastructure Layer (Implementations)
- `src/infrastructure/auth/password.service.ts` (NEW): Bcrypt service with cost factor 12 and dynamic dummy hash for timing attack mitigation.
- `src/infrastructure/auth/session.ts` (NEW): Iron Session helper (`sealSession`, `unsealSession`, `createSessionCookie`, `readSessionCookie`, `clearSessionCookie`) with 7-day TTL and HTTP-only cookie options.
- `src/infrastructure/auth/dal.ts` (NEW): Data Access Layer authoritative session guard (`verifySession`, `validateSessionPayload`) comparing session version against database.
- `src/infrastructure/auth/memory-rate-limiter.ts` (NEW): Sliding-window rate limiter (5 failures / 15 minutes) across `username`, `ip`, and composite `username:ip` dimensions.
- `src/infrastructure/auth/ip-extractor.ts` (NEW): Client IP extraction respecting `TRUSTED_PROXIES` configuration to mitigate header spoofing.
- `src/infrastructure/repositories/prisma-admin.repository.ts` (NEW): Read-only Prisma implementation of `IAdminRepository` with normalized username search and leak prevention.
- `src/infrastructure/composition-root.ts` (MODIFIED): Dependency injection provider for `IAdminRepository`, `IPasswordService`, and `IRateLimiter` while maintaining `StaticPortfolioRepository` as public default.

### 2.3 Verification & Testing
- `scripts/test-phase2-auth.ts` (NEW): Automated test suite covering password, session, rate limiter, repository, IP extraction, and Clean Architecture purity.
- `.hermes/stage-10.3.2-core-auth-infrastructure.md` (NEW): Architectural report and production roadmap.

---

## 3. Component Architecture & Detailed Design

### 3.1 `IAdminRepository` & `PrismaAdminRepository`
- **Domain Purity**: Domain entity `Admin` in `src/domain/entities/admin.ts` does NOT contain `passwordHash`.
- **Auth Record Isolation**: Authentication lookup returns `AdminAuthRecord` containing `{ admin: Admin, passwordHash: string, sessionVersion: number }`.
- **Normalization**: Usernames are trimmed and lowercased prior to query (`normalizedUsername.toLowerCase().trim()`).
- **Read-Only Scope**: Phase 2 implementation performs no `create`, `update`, or `delete` operations on the `Admin` table.
- **Leak Prevention**: Entity mapping explicitly strips `passwordHash` when returning public Domain entities.

### 3.2 `PasswordService` & Timing Attack Mitigation
- **Algorithm**: `bcryptjs` with cost factor 12 (approx. 430-460ms per comparison).
- **Valid Dynamic Dummy Hash**: To prevent salt format errors from invalid mock strings, `PasswordService` generates a valid dynamic bcrypt hash during initialization (`bcrypt.hash('__timing_safe_dummy_password_protection__', 12)`).
- **Constant-Time Fallback**: When an admin username is not found in the database, `PasswordService.performDummyCompare()` executes a full bcrypt comparison against the dummy hash to prevent username enumeration via timing analysis.

### 3.3 Session Management & Iron Session Helper
- **Payload Shape**:
  ```typescript
  interface SessionPayload {
    readonly userId: string;
    readonly username: string;
    readonly sessionVersion: number;
    readonly expiresAt: string;
  }
  ```
- **Cookie Security Options**:
  - `httpOnly: true` (inaccessible to JavaScript)
  - `secure: process.env.NODE_ENV === 'production'`
  - `sameSite: "lax"` (mitigates CSRF)
  - `path: "/"`
  - `maxAge: 604800` (7 days)
- **Encryption**: AES-256 via `iron-session` v9.0.1 using `SESSION_SECRET` (validated >= 32 characters).
- **Resilience**: Corrupted, tampered, or expired seals safely return `null` without throwing unhandled exceptions.

### 3.4 Data Access Layer (DAL) `verifySession()`
- **Authoritative Enforcement**: `verifySession()` reads the encrypted cookie, decrypts the payload, queries `Admin` table in PostgreSQL, and verifies `admin.sessionVersion === session.sessionVersion`.
- **Server-Only Boundary**: Guarded against client-side execution via `typeof window !== 'undefined'`.
- **Request Memoization**: Wrapped in `React.cache()` to share database verification within a single render/request cycle.
- **Revocation Safety**: Changing `sessionVersion` in the database immediately invalidates existing active sessions across all devices.

### 3.5 `MemoryRateLimiter` & Multi-Dimension Key Design
- **Algorithm**: Sliding window keeping failure timestamps (`number[]`) per bucket.
- **Threshold**: Maximum 5 failures within a 15-minute window (`15 * 60 * 1000 ms`).
- **Dimensions**:
  - `user:<normalized_username>`
  - `ip:<normalized_ip>`
  - `comp:<normalized_username>#<normalized_ip>`
- **Composite Checking**: `isLoginAllowed(username, ip)` checks all three dimensions; if any dimension exceeds 5 failures, login is blocked and `retryAfterMs` is computed from the oldest timestamp in the active window.
- **Memory Safety**: Periodic sweep purges expired keys to prevent memory leaks during extended uptime.

### 3.6 Client IP Extractor & Trusted Proxy Configuration
- **Spoofing Defense**: Directly trusting `X-Forwarded-For` on direct connections allows malicious actors to forge client IPs and bypass rate limits.
- **`TRUSTED_PROXIES` Modes**:
  - Not set / empty: Return `undefined`. Direct connections do not trust header forwarding.
  - `vercel`: Trusts Vercel proxy headers.
  - `cloudflare`: Trusts `cf-connecting-ip`.
  - IP list: Matches remote proxy IP against trusted list before accepting forwarding headers.
- **IPv6 Normalization**: Cleans IPv4-mapped IPv6 strings (e.g., `::ffff:127.0.0.1` -> `127.0.0.1`).

---

## 4. Security Guardrails Verification

Independent verification executed via `scripts/verify-guardrails.ts`:
```
admins row count: 0
contact_channels row count: 0
connected database: porto_cms
databases present on cluster: [
  'Owner',
  'db_unm',
  'fashiondb',
  'padekinapp',
  'pesantren',
  'porto_cms',
  'powerteam',
  'powerteamm',
  'tkunh_user_service'
]
ALL GUARDRAILS VERIFIED (ZERO VIOLATIONS)
```

- Zero admin accounts exist.
- Zero contact channels exist.
- 8 external databases on the local Laragon PostgreSQL cluster remain untouched.
- Connection string and session secret remain redacted.

---

## 5. Verification & Test Results

### 5.1 Test Suite (`scripts/test-phase2-auth.ts`)
- **Suite 1: Password Service**:
  - Hash generation with bcrypt cost 12: PASSED
  - Correct password verification: PASSED
  - Incorrect password rejection: PASSED
  - Valid dynamic dummy hash generation: PASSED
  - Timing mitigation dummy comparison: PASSED
- **Suite 2: Session & DAL**:
  - Session sealing and unsealing: PASSED
  - Modified/tampered seal rejection: PASSED
  - Expired session rejection: PASSED
  - DAL session version mismatch rejection (`SessionRevokedException`): PASSED
  - DAL non-existent admin rejection (`UnauthorizedException`): PASSED
  - DAL matching session version authorization: PASSED
- **Suite 3: Rate Limiter**:
  - Attempts 1 to 5 recorded: PASSED
  - Attempt 6 blocked (`allowed: false`): PASSED
  - Sliding window expiration: PASSED
  - Dimension isolation (`username` vs `ip` vs composite): PASSED
- **Suite 4: Prisma Admin Repository**:
  - Lookup by normalized username: PASSED
  - Non-existent admin lookup returning `null`: PASSED
  - Domain Entity `Admin` isolation (zero `passwordHash` field): PASSED
- **Suite 5: IP Extraction & Trusted Proxy**:
  - Header spoofing rejection on untrusted proxy: PASSED
  - Vercel proxy header extraction: PASSED
  - Cloudflare `cf-connecting-ip` extraction: PASSED
  - IPv6 normalization: PASSED
- **Suite 6: Architecture & Purity**:
  - Domain layer repository interfaces have zero Prisma/infrastructure imports: PASSED
  - Composition Root dependency injection: PASSED
  - Public portfolio data source unchanged (`StaticPortfolioRepository`): PASSED

### 5.2 Quality Checks
- `npm run lint`: PASSED (0 errors, 0 warnings)
- `npx tsc --noEmit`: PASSED (0 errors)
- `npm run build`: PASSED (Next.js 16 App Router optimized production build generated)

---

## 6. MemoryRateLimiter Limitations & Production Roadmap

### 6.1 Limitations of In-Memory Storage
1. **Process Isolation**: In serverless runtimes (Vercel, AWS Lambda) or multi-container clusters, each instance has its own memory space. An attacker targeting multiple instances could execute more attempts than the configured limit.
2. **Process Lifecycle**: Deployments, restarts, or container scaling flush the in-memory failure logs, resetting rate limits.

### 6.2 Production Roadmap Recommendation
- **Target Architecture**: Redis / Upstash Redis with token-bucket or sliding-log keys.
- **Phase Transition**: Introduce `RedisRateLimiter` implementing the same domain contract `IRateLimiter` without altering application logic or use cases.

---

## 7. Absolute Constraints Audit Checklist

| Item | Constraint | Status | Evidence |
|------|------------|--------|----------|
| 1 | Create Admin account | NOT DONE | `admins` count = 0 |
| 2 | Populate Admin table | NOT DONE | `admins` count = 0 |
| 3 | Populate ContactChannel table | NOT DONE | `contact_channels` count = 0 |
| 4 | Run bootstrap-admin | NOT DONE | Not executed |
| 5 | Create login/logout Server Actions | NOT DONE | Reserved for Phase 3 |
| 6 | Create login page or dashboard UI | NOT DONE | Reserved for Phase 3 & 4 |
| 7 | Modify `proxy.ts` | NOT DONE | `proxy.ts` untouched |
| 8 | Schema change or migration | NOT DONE | Zero schema changes |
| 9 | Modify seed data | NOT DONE | `prisma/seed.ts` untouched |
| 10 | Modify public portfolio content | NOT DONE | Public portfolio unchanged |
| 11 | Install Redis / external service | NOT DONE | Zero new services |
| 12 | Git commit or push | NOT DONE | Git history untouched |
| 13 | Expose `.env.local` credentials | NOT DONE | Redacted |

---

## 8. Readiness for Phase 3

Phase 2 foundation is complete and tested. The project is fully ready for:
- **Stage 10.3 Phase 3**: Login & Logout Implementation (Server Actions, UI Form, Admin Bootstrap CLI, Session Revocation).
