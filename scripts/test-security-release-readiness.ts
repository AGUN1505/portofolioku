// scripts/test-security-release-readiness.ts
// Automated Phase 5.5.7 Security & Release Readiness Verification Suite.
// Runs in pure zero-DB mode: never loads .env.local, never initializes Prisma,
// and never opens a PostgreSQL connection.

import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import nextConfig from '../next.config';
import { SESSION_COOKIE_OPTIONS, SESSION_TTL_SECONDS } from '../src/infrastructure/auth/session';
import { PasswordService } from '../src/infrastructure/auth/password.service';
import {
  ResilientPortfolioRepository,
  isDatabaseConnectivityError,
} from '../src/infrastructure/repositories/resilient-portfolio.repository';
import { StaticPortfolioRepository } from '../src/infrastructure/repositories/static-portfolio.repository';
import type { IPortfolioRepository } from '../src/domain/repositories/portfolio.repository';
import type { Portfolio } from '../src/domain/entities';

import { validateHeroProfileInput } from '../src/application/dtos/hero-profile.dto';
import { validateAboutProfileInput } from '../src/application/dtos/about-profile.dto';
import { validateContactProfileInput } from '../src/application/dtos/contact-profile.dto';
import {
  validateCreateProjectInput,
  validateUpdateProjectInput,
} from '../src/application/dtos/project.dto';
import {
  validateCreateExperienceInput,
  validateUpdateExperienceInput,
} from '../src/application/dtos/experience.dto';
import {
  validateCreateRoleInput,
  validateUpdateRoleInput,
} from '../src/application/dtos/role.dto';
import {
  validateCreateEngineeringNodeInput,
  validateUpdateEngineeringNodeInput,
} from '../src/application/dtos/engineering-node.dto';
import {
  validateCreateDomainInput,
  validateUpdateDomainInput,
} from '../src/application/dtos/domain.dto';
import {
  validateCreatePillarInput,
  validateUpdatePillarInput,
} from '../src/application/dtos/pillar.dto';
import {
  validateCreateSkillCategoryInput,
  validateUpdateSkillCategoryInput,
} from '../src/application/dtos/skill-category.dto';
import {
  validateCreateSkillInput,
  validateUpdateSkillInput,
} from '../src/application/dtos/skill.dto';
import {
  validateCreateContactChannelInput,
  validateUpdateContactChannelInput,
} from '../src/application/dtos/contact-channel.dto';
import {
  validateCreateCertificate,
  validateUpdateCertificate,
} from '../src/application/dtos/certificate.dto';
import {
  validateUpdateAdminProfileInput,
  validateChangeAdminPasswordInput,
} from '../src/application/dtos/admin-account.dto';
import {
  validateCreateSectionConfigInput,
  validateUpdateSectionConfigInput,
} from '../src/application/dtos/section-config.dto';

type DtoValidationOutcome =
  | { readonly success: true; readonly data: unknown }
  | { readonly success: false; readonly errors: Record<string, string> };

interface DtoCheckCase {
  readonly file: string;
  readonly name: string;
  readonly validate: (raw: Record<string, unknown>) => DtoValidationOutcome;
  readonly validPayload: Record<string, unknown>;
}

function collectFilesRecursively(dirPath: string, targetFileName: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFilesRecursively(fullPath, targetFileName));
    } else if (entry.isFile() && entry.name === targetFileName) {
      results.push(fullPath);
    }
  }
  return results.sort();
}

function extractExportedAsyncFunctions(
  source: string
): Array<{ name: string; body: string }> {
  const regex = /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(/g;
  const results: Array<{ name: string; body: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(source)) !== null) {
    const name = match[1];
    let i = match.index + match[0].length - 1; // points at '('

    // Skip balanced parameter list (...)
    let parenDepth = 0;
    while (i < source.length) {
      const ch = source[i];
      if (ch === '(') parenDepth++;
      else if (ch === ')') {
        parenDepth--;
        if (parenDepth === 0) {
          i++;
          break;
        }
      }
      i++;
    }

    // Advance to the opening '{' of the function body
    const openBraceIndex = source.indexOf('{', i);
    assert.ok(openBraceIndex !== -1, `Opening brace not found for function ${name}`);

    let braceDepth = 0;
    let endIndex = -1;
    for (let j = openBraceIndex; j < source.length; j++) {
      const ch = source[j];
      if (ch === "'" || ch === '"' || ch === '`') {
        const quote = ch;
        j++;
        while (j < source.length) {
          if (source[j] === '\\') {
            j += 2;
            continue;
          }
          if (source[j] === quote) {
            break;
          }
          j++;
        }
        continue;
      }
      if (ch === '/' && source[j + 1] === '/') {
        const newline = source.indexOf('\n', j);
        j = newline === -1 ? source.length : newline;
        continue;
      }
      if (ch === '/' && source[j + 1] === '*') {
        const closeComment = source.indexOf('*/', j + 2);
        j = closeComment === -1 ? source.length : closeComment + 1;
        continue;
      }
      if (ch === '{') braceDepth++;
      else if (ch === '}') {
        braceDepth--;
        if (braceDepth === 0) {
          endIndex = j;
          break;
        }
      }
    }

    assert.ok(endIndex !== -1, `Closing brace not found for function ${name}`);
    results.push({
      name,
      body: source.slice(openBraceIndex, endIndex + 1),
    });
  }

  return results;
}

async function verifyHttpSecurityHeaders(): Promise<void> {
  console.log('[Check 1/7] HTTP Security Headers & Next.js Configuration (next.config.ts)');

  assert.strictEqual(nextConfig.experimental?.agentFeedback, true, 'experimental.agentFeedback must remain true');
  assert.strictEqual(nextConfig.cacheComponents, true, 'cacheComponents must remain true');
  assert.strictEqual(nextConfig.partialPrefetching, true, 'partialPrefetching must remain true');
  assert.ok(nextConfig.turbopack?.rules?.['*.css'], 'turbopack.rules["*.css"] must remain configured');
  assert.strictEqual(typeof nextConfig.headers, 'function', 'nextConfig.headers must be defined');

  const headerRules = await nextConfig.headers!();
  const rootRule = headerRules.find((rule) => rule.source === '/:path*');
  assert.ok(rootRule, "headers() must include a rule with source '/:path*'");

  const headerMap = new Map<string, string>();
  for (const h of rootRule.headers) {
    headerMap.set(h.key, h.value);
  }

  const expectedHeaders: ReadonlyArray<readonly [string, string]> = [
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', 'DENY'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['X-DNS-Prefetch-Control', 'on'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ];

  for (const [key, expectedValue] of expectedHeaders) {
    assert.strictEqual(
      headerMap.get(key),
      expectedValue,
      `Security header '${key}' must equal '${expectedValue}'`
    );
    console.log(`  PASS: ${key}: ${expectedValue}`);
  }
}

function verifySessionCookieConfiguration(): void {
  console.log('\n[Check 2/7] Iron Session Cookie Security Options');

  assert.strictEqual(SESSION_TTL_SECONDS, 7 * 24 * 60 * 60, 'SESSION_TTL_SECONDS must be 7 days (604800s)');
  assert.strictEqual(SESSION_COOKIE_OPTIONS.httpOnly, true, 'httpOnly must be true');
  assert.strictEqual(SESSION_COOKIE_OPTIONS.sameSite, 'lax', "sameSite must be 'lax'");
  assert.strictEqual(SESSION_COOKIE_OPTIONS.path, '/', "path must be '/'");
  assert.strictEqual(SESSION_COOKIE_OPTIONS.maxAge, 7 * 24 * 60 * 60, 'maxAge must be 7 * 24 * 60 * 60');

  console.log(
    `  PASS: SESSION_COOKIE_OPTIONS enforces httpOnly=${SESSION_COOKIE_OPTIONS.httpOnly}, sameSite=${SESSION_COOKIE_OPTIONS.sameSite}, path=${SESSION_COOKIE_OPTIONS.path}, maxAge=${SESSION_COOKIE_OPTIONS.maxAge}`
  );
}

async function verifyPasswordService(): Promise<void> {
  console.log('\n[Check 3/7] Bcrypt Work Factor & Timing-Attack Mitigation');

  assert.strictEqual(PasswordService.SALT_ROUNDS, 12, 'PasswordService.SALT_ROUNDS must be 12');

  const passwordService = new PasswordService();
  const dummyCompareResult = await passwordService.performDummyCompare('probe');
  assert.strictEqual(dummyCompareResult, false, "performDummyCompare('probe') must return false");

  console.log(
    `  PASS: PasswordService.SALT_ROUNDS === ${PasswordService.SALT_ROUNDS} and performDummyCompare('probe') === false`
  );
}

function verifyAdminServerActions(): void {
  console.log('\n[Check 4/7] Admin Server Actions DAL Authorization Coverage');

  const adminDir = path.resolve(process.cwd(), 'app', 'admin');
  const actionFiles = collectFilesRecursively(adminDir, 'actions.ts');
  assert.strictEqual(
    actionFiles.length,
    15,
    `Expected 15 actions.ts files under app/admin (14 dashboard modules + 1 login), found ${actionFiles.length}`
  );

  const loginActionsPath = path.resolve(adminDir, 'login', 'actions.ts');
  assert.ok(actionFiles.includes(loginActionsPath), 'app/admin/login/actions.ts must exist');

  const loginSource = fs.readFileSync(loginActionsPath, 'utf-8');
  const loginFunctions = extractExportedAsyncFunctions(loginSource).map((f) => f.name);
  assert.ok(loginFunctions.includes('loginAction'), 'loginAction must be exported in app/admin/login/actions.ts');
  assert.ok(loginFunctions.includes('logoutAction'), 'logoutAction must be exported in app/admin/login/actions.ts');

  let dashboardFileCount = 0;
  let dashboardActionCount = 0;

  for (const filePath of actionFiles) {
    if (filePath === loginActionsPath) {
      continue;
    }
    dashboardFileCount++;
    const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const source = fs.readFileSync(filePath, 'utf-8');
    assert.ok(
      source.includes("'use server'") || source.includes('"use server"'),
      `${relPath} must declare 'use server'`
    );

    const fns = extractExportedAsyncFunctions(source);
    assert.ok(fns.length > 0, `${relPath} must export at least one Server Action`);

    for (const fn of fns) {
      dashboardActionCount++;
      const verifyIdx = fn.body.indexOf('await verifySession()');
      assert.ok(
        verifyIdx !== -1,
        `Server Action ${fn.name} in ${relPath} does NOT call await verifySession()`
      );

      const useCaseIdx = fn.body.indexOf('CompositionRoot.');
      if (useCaseIdx !== -1) {
        assert.ok(
          verifyIdx < useCaseIdx,
          `Server Action ${fn.name} in ${relPath} calls CompositionRoot before verifySession()`
        );
      }
    }
  }

  const totalActions = dashboardActionCount + loginFunctions.length;
  assert.strictEqual(dashboardFileCount, 14, `Expected 14 dashboard actions.ts files, got ${dashboardFileCount}`);
  assert.strictEqual(dashboardActionCount, 46, `Expected 46 authenticated dashboard actions, got ${dashboardActionCount}`);
  assert.strictEqual(totalActions, 48, `Expected 48 total exported Server Actions, got ${totalActions}`);

  console.log(
    `  PASS: Verified ${actionFiles.length} actions.ts files (${dashboardFileCount} dashboard modules with ${dashboardActionCount}/45 DAL-guarded verifySession() actions + loginAction/logoutAction = ${totalActions} total actions)`
  );
}

function verifyDtoSystemKeyRejection(): void {
  console.log('\n[Check 5/7] DTO Field Whitelisting & System-Controlled Key Rejection');

  const dtoCases: DtoCheckCase[] = [
    {
      file: 'hero-profile.dto.ts',
      name: 'validateHeroProfileInput',
      validate: (raw) => validateHeroProfileInput(raw),
      validPayload: {
        name: 'Agun Firmansyah',
        tagline: 'Building systems.',
        bio: 'Software developer focused on backend engineering.',
        country: 'Indonesia',
        code: 'ID',
        timezone: 'GMT+7',
        discipline: 'BACKEND ARCHITECTURE',
      },
    },
    {
      file: 'about-profile.dto.ts',
      name: 'validateAboutProfileInput',
      validate: (raw) => validateAboutProfileInput(raw),
      validPayload: {
        heading: 'About & Philosophy',
        quote: 'Systems matter in engineering.',
        primaryNarrative: 'Primary narrative text.',
        secondaryNarrative: 'Secondary narrative text.',
      },
    },
    {
      file: 'contact-profile.dto.ts',
      name: 'validateContactProfileInput',
      validate: (raw) => validateContactProfileInput(raw),
      validPayload: {
        heading: 'Contact',
        ctaLabel: 'Get in Touch',
        description: 'Open to project collaboration.',
      },
    },
    {
      file: 'project.dto.ts',
      name: 'validateCreateProjectInput',
      validate: (raw) => validateCreateProjectInput(raw),
      validPayload: {
        title: 'Portfolio CMS',
        category: 'Backend Systems',
        description: 'Clean architecture CMS platform.',
        technologies: ['TypeScript', 'PostgreSQL'],
      },
    },
    {
      file: 'project.dto.ts',
      name: 'validateUpdateProjectInput',
      validate: (raw) => validateUpdateProjectInput(raw),
      validPayload: { title: 'Portfolio CMS v2' },
    },
    {
      file: 'experience.dto.ts',
      name: 'validateCreateExperienceInput',
      validate: (raw) => validateCreateExperienceInput(raw),
      validPayload: {
        role: 'Backend Engineer',
        institution: 'Engineering Lab',
        track: 'ENGINEERING',
      },
    },
    {
      file: 'experience.dto.ts',
      name: 'validateUpdateExperienceInput',
      validate: (raw) => validateUpdateExperienceInput(raw),
      validPayload: { role: 'Senior Backend Engineer' },
    },
    {
      file: 'role.dto.ts',
      name: 'validateCreateRoleInput',
      validate: (raw) => validateCreateRoleInput(raw),
      validPayload: { title: 'Backend Engineer', primary: true },
    },
    {
      file: 'role.dto.ts',
      name: 'validateUpdateRoleInput',
      validate: (raw) => validateUpdateRoleInput(raw),
      validPayload: { title: 'Systems Architect' },
    },
    {
      file: 'engineering-node.dto.ts',
      name: 'validateCreateEngineeringNodeInput',
      validate: (raw) => validateCreateEngineeringNodeInput(raw),
      validPayload: {
        tag: '01 / DECONSTRUCT',
        title: 'Understand Systems',
        description: 'Analyze domain constraints.',
      },
    },
    {
      file: 'engineering-node.dto.ts',
      name: 'validateUpdateEngineeringNodeInput',
      validate: (raw) => validateUpdateEngineeringNodeInput(raw),
      validPayload: { title: 'Architect & Build' },
    },
    {
      file: 'domain.dto.ts',
      name: 'validateCreateDomainInput',
      validate: (raw) => validateCreateDomainInput(raw),
      validPayload: { index: '01', title: 'Backend Development' },
    },
    {
      file: 'domain.dto.ts',
      name: 'validateUpdateDomainInput',
      validate: (raw) => validateUpdateDomainInput(raw),
      validPayload: { title: 'Software Engineering' },
    },
    {
      file: 'pillar.dto.ts',
      name: 'validateCreatePillarInput',
      validate: (raw) => validateCreatePillarInput(raw),
      validPayload: {
        index: '01',
        title: 'Backend Systems',
        description: 'Reliable server-side logic.',
      },
    },
    {
      file: 'pillar.dto.ts',
      name: 'validateUpdatePillarInput',
      validate: (raw) => validateUpdatePillarInput(raw),
      validPayload: { title: 'Practical Solutions' },
    },
    {
      file: 'skill-category.dto.ts',
      name: 'validateCreateSkillCategoryInput',
      validate: (raw) => validateCreateSkillCategoryInput(raw),
      validPayload: { title: 'Backend Engineering' },
    },
    {
      file: 'skill-category.dto.ts',
      name: 'validateUpdateSkillCategoryInput',
      validate: (raw) => validateUpdateSkillCategoryInput(raw),
      validPayload: { title: 'Relational Data' },
    },
    {
      file: 'skill.dto.ts',
      name: 'validateCreateSkillInput',
      validate: (raw) => validateCreateSkillInput(raw),
      validPayload: { name: 'PostgreSQL', categoryId: 'cat_01' },
    },
    {
      file: 'skill.dto.ts',
      name: 'validateUpdateSkillInput',
      validate: (raw) => validateUpdateSkillInput(raw),
      validPayload: { name: 'TypeScript' },
    },
    {
      file: 'contact-channel.dto.ts',
      name: 'validateCreateContactChannelInput',
      validate: (raw) => validateCreateContactChannelInput(raw),
      validPayload: { label: 'EMAIL', value: 'contact@example.com' },
    },
    {
      file: 'contact-channel.dto.ts',
      name: 'validateUpdateContactChannelInput',
      validate: (raw) => validateUpdateContactChannelInput(raw),
      validPayload: { label: 'GITHUB', value: 'https://github.com/example' },
    },
    {
      file: 'certificate.dto.ts',
      name: 'validateCreateCertificate',
      validate: (raw) => validateCreateCertificate(raw),
      validPayload: {
        title: 'Cloud Architecture',
        issuer: 'CNCF',
        fileUrl: '/uploads/certificates/sample.pdf',
      },
    },
    {
      file: 'certificate.dto.ts',
      name: 'validateUpdateCertificate',
      validate: (raw) => validateUpdateCertificate(raw),
      validPayload: { title: 'Updated Cloud Architecture' },
    },
    {
      file: 'admin-account.dto.ts',
      name: 'validateUpdateAdminProfileInput',
      validate: (raw) => validateUpdateAdminProfileInput(raw),
      validPayload: {
        username: 'adminuser',
        email: 'admin@example.com',
        currentPassword: 'Valid#Password2026',
      },
    },
    {
      file: 'admin-account.dto.ts',
      name: 'validateChangeAdminPasswordInput',
      validate: (raw) => validateChangeAdminPasswordInput(raw, 'adminuser'),
      validPayload: {
        currentPassword: 'Valid#Password2026',
        newPassword: 'Updated#Password2026',
        confirmPassword: 'Updated#Password2026',
      },
    },
    {
      file: 'section-config.dto.ts',
      name: 'validateCreateSectionConfigInput',
      validate: (raw) => validateCreateSectionConfigInput(raw),
      validPayload: {
        key: 'hero',
        label: 'Hero Section',
        order: 1,
        enabled: true,
      },
    },
    {
      file: 'section-config.dto.ts',
      name: 'validateUpdateSectionConfigInput',
      validate: (raw) => validateUpdateSectionConfigInput(raw),
      validPayload: {
        label: 'Updated Section Label',
        enabled: false,
      },
    },
  ];

  const dtoDir = path.resolve(process.cwd(), 'src', 'application', 'dtos');
  const dtoFilesOnDisk = fs
    .readdirSync(dtoDir)
    .filter((f) => f.endsWith('.dto.ts'))
    .sort();
  const coveredFiles = Array.from(new Set(dtoCases.map((c) => c.file))).sort();

  assert.deepStrictEqual(
    coveredFiles,
    dtoFilesOnDisk,
    'Every DTO file in src/application/dtos must be covered by system-key tampering tests'
  );

  for (const dtoCase of dtoCases) {
    const tamperedPayload: Record<string, unknown> = {
      ...dtoCase.validPayload,
      id: 'injected_system_id',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const result = dtoCase.validate(tamperedPayload);
    assert.strictEqual(
      result.success,
      false,
      `${dtoCase.file}:${dtoCase.name} must reject system-controlled keys`
    );
    if (!result.success) {
      assert.ok(result.errors.id, `${dtoCase.file}:${dtoCase.name} must reject 'id'`);
      assert.ok(result.errors.createdAt, `${dtoCase.file}:${dtoCase.name} must reject 'createdAt'`);
      assert.ok(result.errors.updatedAt, `${dtoCase.file}:${dtoCase.name} must reject 'updatedAt'`);
    }
  }

  console.log(
    `  PASS: All ${dtoFilesOnDisk.length} DTO files (${dtoCases.length} validator functions) strictly reject 'id', 'createdAt', and 'updatedAt'`
  );
}

function verifyGitignoreProtectsEnv(): void {
  console.log('\n[Check 6/7] Environment Secret Hygiene (.gitignore)');

  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');

  const lines = fs
    .readFileSync(gitignorePath, 'utf-8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  assert.ok(lines.includes('.env*'), '.gitignore must include .env* rule');
  const envNegations = lines.filter((line) => line.startsWith('!.env'));
  assert.strictEqual(
    envNegations.length,
    0,
    `.gitignore must not negate .env protection (found: ${envNegations.join(', ')})`
  );

  console.log('  PASS: .gitignore protects .env* files from being committed without negation exceptions');
}

async function verifyResilientPortfolioRepository(): Promise<void> {
  console.log('\n[Check 7/7] Database Resilience & Connectivity Error Classifier');

  const connError = Object.assign(new Error('Database connection refused'), { code: 'P1001' });
  const econnRefused = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
  const authError = Object.assign(new Error('Authentication failed'), { code: 'P1000' });
  const missingDbError = Object.assign(new Error('Database does not exist'), { code: 'P1003' });
  const typeError = new TypeError('Cannot read properties of undefined');

  assert.strictEqual(isDatabaseConnectivityError(connError), true, 'P1001 must trigger connectivity fallback');
  assert.strictEqual(isDatabaseConnectivityError(econnRefused), true, 'ECONNREFUSED must trigger connectivity fallback');
  assert.strictEqual(isDatabaseConnectivityError(authError), false, 'P1000 auth error must NOT trigger fallback');
  assert.strictEqual(isDatabaseConnectivityError(missingDbError), false, 'P1003 missing DB must NOT trigger fallback');
  assert.strictEqual(isDatabaseConnectivityError(typeError), false, 'TypeError must NOT be masked by fallback');

  const staticRepo = new StaticPortfolioRepository();
  const offlinePrimary: IPortfolioRepository<Promise<Portfolio>> = {
    async getPortfolioData(): Promise<Portfolio> {
      throw connError;
    },
  };
  const resilientWithOffline = new ResilientPortfolioRepository(offlinePrimary, staticRepo);
  const originalWarn = console.warn;
  let warnLogged = false;
  console.warn = () => {
    warnLogged = true;
  };
  try {
    const fallbackData = await resilientWithOffline.getPortfolioData();
    assert.ok(fallbackData.hero.name.length > 0, 'Static fallback must return valid portfolio hero data');
    assert.strictEqual(warnLogged, true, 'ResilientPortfolioRepository must emit sanitized warning on fallback');
  } finally {
    console.warn = originalWarn;
  }

  const buggyPrimary: IPortfolioRepository<Promise<Portfolio>> = {
    async getPortfolioData(): Promise<Portfolio> {
      throw typeError;
    },
  };
  const resilientWithBug = new ResilientPortfolioRepository(buggyPrimary, staticRepo);
  await assert.rejects(
    async () => resilientWithBug.getPortfolioData(),
    TypeError,
    'ResilientPortfolioRepository must re-throw programming errors without masking'
  );

  console.log(
    '  PASS: ResilientPortfolioRepository falls back safely on connectivity failures (P1001/ECONNREFUSED) and re-throws config/programming errors (P1000/P1003/TypeError)'
  );
}

async function main(): Promise<void> {
  console.log('=== PHASE 5.5.7 SECURITY & RELEASE READINESS VERIFICATION ===');
  console.log(`Zero-DB Guard: DATABASE_URL=${process.env.DATABASE_URL ? 'SET (UNEXPECTED)' : 'UNSET (ISOLATED)'}\n`);
  assert.strictEqual(
    process.env.DATABASE_URL,
    undefined,
    'DATABASE_URL must remain unset during zero-DB readiness verification'
  );

  await verifyHttpSecurityHeaders();
  verifySessionCookieConfiguration();
  await verifyPasswordService();
  verifyAdminServerActions();
  verifyDtoSystemKeyRejection();
  verifyGitignoreProtectsEnv();
  await verifyResilientPortfolioRepository();

  console.log('\n=== ALL 7 SECURITY & RELEASE READINESS CHECKS PASSED (100%) ===');
}

main().catch((err) => {
  console.error('\n[RELEASE READINESS VERIFICATION FAILED]', err);
  process.exit(1);
});
