// scripts/test-frontend-ui-audit.ts
// Stage 10.5.5.7 Automated Frontend UI & Accessibility Audit
// Pure static file inspection — ZERO database connection, ZERO .env.local load.

import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

interface AuditResult {
  passed: number;
  failed: number;
}

const results: AuditResult = {
  passed: 0,
  failed: 0,
};

function check(label: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    results.passed++;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ FAIL: ${label}\n    -> ${message}`);
    results.failed++;
  }
}

function readWorkspaceFile(relativePath: string): string {
  const fullPath = path.join(ROOT, relativePath);
  assert.ok(fs.existsSync(fullPath), `Missing file: ${relativePath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.ok(content.trim().length > 0, `Empty file: ${relativePath}`);
  return content;
}

function main(): void {
  console.log('=== [STAGE 10.5.5.7] FRONTEND UI & ACCESSIBILITY STATIC AUDIT ===\n');

  // -------------------------------------------------------------------------
  // 1. Admin Routes Completeness & Zero ModulePlaceholder Usage
  // -------------------------------------------------------------------------
  console.log('1. Admin Module Routes & Login Route (Zero ModulePlaceholder):');

  const adminRoutes: ReadonlyArray<{ route: string; file: string }> = [
    { route: '/admin', file: 'app/admin/(dashboard)/page.tsx' },
    { route: '/admin/hero', file: 'app/admin/(dashboard)/hero/page.tsx' },
    { route: '/admin/roles', file: 'app/admin/(dashboard)/roles/page.tsx' },
    { route: '/admin/engineering-nodes', file: 'app/admin/(dashboard)/engineering-nodes/page.tsx' },
    { route: '/admin/about', file: 'app/admin/(dashboard)/about/page.tsx' },
    { route: '/admin/domains', file: 'app/admin/(dashboard)/domains/page.tsx' },
    { route: '/admin/pillars', file: 'app/admin/(dashboard)/pillars/page.tsx' },
    { route: '/admin/projects', file: 'app/admin/(dashboard)/projects/page.tsx' },
    { route: '/admin/projects/new', file: 'app/admin/(dashboard)/projects/new/page.tsx' },
    { route: '/admin/projects/[id]', file: 'app/admin/(dashboard)/projects/[id]/page.tsx' },
    { route: '/admin/experiences', file: 'app/admin/(dashboard)/experiences/page.tsx' },
    { route: '/admin/experiences/new', file: 'app/admin/(dashboard)/experiences/new/page.tsx' },
    { route: '/admin/experiences/[id]', file: 'app/admin/(dashboard)/experiences/[id]/page.tsx' },
    { route: '/admin/skills', file: 'app/admin/(dashboard)/skills/page.tsx' },
    { route: '/admin/contact', file: 'app/admin/(dashboard)/contact/page.tsx' },
    { route: '/admin/contact-channels', file: 'app/admin/(dashboard)/contact-channels/page.tsx' },
    { route: '/admin/certificates', file: 'app/admin/(dashboard)/certificates/page.tsx' },
    { route: '/admin/sections', file: 'app/admin/(dashboard)/sections/page.tsx' },
    { route: '/admin/account', file: 'app/admin/(dashboard)/account/page.tsx' },
    { route: '/admin/login', file: 'app/admin/login/page.tsx' },
  ];

  for (const item of adminRoutes) {
    check(`Route ${item.route} (${item.file}) exists and does not use ModulePlaceholder`, () => {
      const content = readWorkspaceFile(item.file);
      assert.equal(
        content.includes('ModulePlaceholder'),
        false,
        `${item.file} still references ModulePlaceholder`
      );
    });
  }

  // -------------------------------------------------------------------------
  // 2. Collection Modal Accessibility (role="dialog", aria-modal="true", aria-labelledby)
  // -------------------------------------------------------------------------
  console.log('\n2. Collection Modal Dialog ARIA Compliance:');

  const modalComponents: ReadonlyArray<{ name: string; file: string; expectedModals: number }> = [
    {
      name: 'RoleListClient',
      file: 'app/admin/(dashboard)/roles/RoleListClient.tsx',
      expectedModals: 3,
    },
    {
      name: 'EngineeringNodeListClient',
      file: 'app/admin/(dashboard)/engineering-nodes/EngineeringNodeListClient.tsx',
      expectedModals: 3,
    },
    {
      name: 'DomainListClient',
      file: 'app/admin/(dashboard)/domains/DomainListClient.tsx',
      expectedModals: 3,
    },
    {
      name: 'PillarListClient',
      file: 'app/admin/(dashboard)/pillars/PillarListClient.tsx',
      expectedModals: 3,
    },
    {
      name: 'SkillCategoryListClient',
      file: 'app/admin/(dashboard)/skills/SkillCategoryListClient.tsx',
      expectedModals: 6,
    },
    {
      name: 'ContactChannelListClient',
      file: 'app/admin/(dashboard)/contact-channels/ContactChannelListClient.tsx',
      expectedModals: 3,
    },
    {
      name: 'CertificateListClient',
      file: 'app/admin/(dashboard)/certificates/CertificateListClient.tsx',
      expectedModals: 3,
    },
    {
      name: 'ProjectListClient',
      file: 'app/admin/(dashboard)/projects/ProjectListClient.tsx',
      expectedModals: 1,
    },
    {
      name: 'ExperienceListClient',
      file: 'app/admin/(dashboard)/experiences/ExperienceListClient.tsx',
      expectedModals: 1,
    },
  ];

  for (const comp of modalComponents) {
    check(
      `${comp.name} has ${comp.expectedModals} accessible dialog(s) with matching aria-labelledby -> h2 id`,
      () => {
        const content = readWorkspaceFile(comp.file);
        const roleMatches = content.match(/role="dialog"/g) ?? [];
        const modalMatches = content.match(/aria-modal="true"/g) ?? [];
        const labelledByMatches = [...content.matchAll(/aria-labelledby="([^"]+)"/g)];

        assert.equal(
          roleMatches.length,
          comp.expectedModals,
          `Expected ${comp.expectedModals} role="dialog" attributes, found ${roleMatches.length}`
        );
        assert.equal(
          modalMatches.length,
          comp.expectedModals,
          `Expected ${comp.expectedModals} aria-modal="true" attributes, found ${modalMatches.length}`
        );
        assert.equal(
          labelledByMatches.length,
          comp.expectedModals,
          `Expected ${comp.expectedModals} aria-labelledby attributes, found ${labelledByMatches.length}`
        );

        for (const match of labelledByMatches) {
          const targetId = match[1];
          const headingPattern = new RegExp(`<h2[^>]*\\bid="${targetId}"`);
          assert.ok(
            headingPattern.test(content),
            `Missing <h2 id="${targetId}"> matching aria-labelledby="${targetId}"`
          );
        }
      }
    );
  }

  // -------------------------------------------------------------------------
  // 3. Escape Keydown Dismissal Verification on Hardened Phase 5 Components
  // -------------------------------------------------------------------------
  console.log('\n3. Escape Key Dismissal Handlers (5 Hardened Components):');

  const escapeHardenedComponents: ReadonlyArray<{ name: string; file: string }> = [
    { name: 'RoleListClient', file: 'app/admin/(dashboard)/roles/RoleListClient.tsx' },
    {
      name: 'EngineeringNodeListClient',
      file: 'app/admin/(dashboard)/engineering-nodes/EngineeringNodeListClient.tsx',
    },
    { name: 'DomainListClient', file: 'app/admin/(dashboard)/domains/DomainListClient.tsx' },
    { name: 'PillarListClient', file: 'app/admin/(dashboard)/pillars/PillarListClient.tsx' },
    {
      name: 'SkillCategoryListClient',
      file: 'app/admin/(dashboard)/skills/SkillCategoryListClient.tsx',
    },
    {
      name: 'CertificateListClient',
      file: 'app/admin/(dashboard)/certificates/CertificateListClient.tsx',
    },
  ];

  for (const comp of escapeHardenedComponents) {
    check(`${comp.name} registers & cleans up window keydown Escape handler safely`, () => {
      const content = readWorkspaceFile(comp.file);
      assert.ok(content.includes('useEffect'), 'Must import and call useEffect');
      assert.ok(
        content.includes("window.addEventListener('keydown'"),
        "Must attach window.addEventListener('keydown', ...)"
      );
      assert.ok(
        content.includes("window.removeEventListener('keydown'"),
        "Must clean up window.removeEventListener('keydown', ...)"
      );
      assert.ok(
        content.includes("event.key === 'Escape'") || content.includes("e.key === 'Escape'"),
        "Must check event.key === 'Escape'"
      );
      assert.ok(content.includes('!isPending'), 'Must guard Escape dismissal with !isPending');
    });
  }

  // -------------------------------------------------------------------------
  // 4. Public Portfolio Components Anti-Placeholder Audit
  // -------------------------------------------------------------------------
  console.log('\n4. Public Portfolio Components (Existence & Zero Synthetic Placeholders):');

  const publicComponents: ReadonlyArray<{ exportName: string; file: string }> = [
    { exportName: 'HeroSection', file: 'src/presentation/components/portfolio/HeroSection.tsx' },
    { exportName: 'AboutSection', file: 'src/presentation/components/portfolio/AboutSection.tsx' },
    { exportName: 'ProjectsSection', file: 'src/presentation/components/portfolio/ProjectsSection.tsx' },
    { exportName: 'ExperienceSection', file: 'src/presentation/components/portfolio/ExperienceSection.tsx' },
    { exportName: 'SkillsSection', file: 'src/presentation/components/portfolio/SkillsSection.tsx' },
    { exportName: 'CertificatesSection', file: 'src/presentation/components/portfolio/CertificatesSection.tsx' },
    { exportName: 'ContactSection', file: 'src/presentation/components/portfolio/ContactSection.tsx' },
    { exportName: 'Navbar', file: 'src/presentation/components/portfolio/Navbar.tsx' },
    { exportName: 'Footer', file: 'src/presentation/components/portfolio/Footer.tsx' },
  ];

  const forbiddenPlaceholderPatterns: ReadonlyArray<{ label: string; pattern: RegExp }> = [
    { label: 'Bracketed Email Placeholder', pattern: /\[\s*Email Placeholder\s*\]/i },
    { label: 'Bracketed LinkedIn Placeholder', pattern: /\[\s*LinkedIn Placeholder\s*\]/i },
    { label: 'Ready for official text', pattern: /Ready for official/i },
    { label: 'Lorem ipsum text', pattern: /Lorem ipsum/i },
    { label: 'TODO marker', pattern: /\bTODO\b/ },
    { label: 'FIXME marker', pattern: /\bFIXME\b/ },
    { label: 'Synthetic example.com domain', pattern: /example\.com/i },
    { label: 'Synthetic placeholder word', pattern: /\bPlaceholder\b/i },
  ];

  for (const comp of publicComponents) {
    check(`${comp.exportName} (${comp.file}) exists with zero synthetic placeholders`, () => {
      const content = readWorkspaceFile(comp.file);
      assert.ok(
        content.includes(`export function ${comp.exportName}`),
        `Expected export function ${comp.exportName} in ${comp.file}`
      );

      for (const forbidden of forbiddenPlaceholderPatterns) {
        assert.equal(
          forbidden.pattern.test(content),
          false,
          `${comp.file} matched forbidden placeholder pattern: ${forbidden.label}`
        );
      }
    });
  }

  console.log(`\n=== AUDIT SUMMARY: ${results.passed} PASSED / ${results.failed} FAILED ===`);
  if (results.failed > 0) {
    process.exit(1);
  }
}

main();
