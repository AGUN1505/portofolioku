// scripts/e2e/cleanup-helper.ts
// Strict cleanup and baseline snapshot/restoration helper for porto_cms_e2e.
// Guaranteed ID tracking, baseline preservation, and fail-fast safety checks.

import { strict as assert } from 'node:assert';
import type { PrismaClient, HeroProfile, AboutProfile, ContactProfile } from '@prisma/client';
import { assertE2EDatabase } from './e2e-guard';

export interface TrackedE2EResources {
  readonly projectIds?: string[];
  readonly experienceIds?: string[];
  readonly contactChannelIds?: string[];
  readonly adminId?: string;
}

export interface BaselineSingletonsSnapshot {
  readonly hero: HeroProfile;
  readonly about: AboutProfile;
  readonly contact: ContactProfile;
}

export interface BaselineOrderSnapshot {
  readonly projectIds: string[];
  readonly experienceIds: string[];
  readonly contactChannelIds?: string[];
}

/**
 * Creates an in-memory snapshot of baseline singleton records before any mutation.
 */
export async function takeBaselineSingletonsSnapshot(
  prisma: PrismaClient
): Promise<BaselineSingletonsSnapshot> {
  assertE2EDatabase();

  const hero = await prisma.heroProfile.findUnique({ where: { id: 'singleton' } });
  const about = await prisma.aboutProfile.findUnique({ where: { id: 'singleton' } });
  const contact = await prisma.contactProfile.findUnique({ where: { id: 'singleton' } });

  if (!hero || !about || !contact) {
    throw new Error('[E2E-BASELINE-FATAL] Missing baseline singleton records in porto_cms_e2e');
  }

  return { hero, about, contact };
}

/**
 * Restores baseline singleton records from snapshot and verifies restoration.
 */
export async function restoreBaselineSingletons(
  prisma: PrismaClient,
  snapshot: BaselineSingletonsSnapshot
): Promise<void> {
  assertE2EDatabase();

  // Restore Hero
  await prisma.heroProfile.update({
    where: { id: 'singleton' },
    data: {
      name: snapshot.hero.name,
      tagline: snapshot.hero.tagline,
      bio: snapshot.hero.bio,
      country: snapshot.hero.country,
      code: snapshot.hero.code,
      timezone: snapshot.hero.timezone,
      discipline: snapshot.hero.discipline,
    },
  });

  // Restore About
  await prisma.aboutProfile.update({
    where: { id: 'singleton' },
    data: {
      heading: snapshot.about.heading,
      quote: snapshot.about.quote,
      primaryNarrative: snapshot.about.primaryNarrative,
      secondaryNarrative: snapshot.about.secondaryNarrative,
    },
  });

  // Restore Contact
  await prisma.contactProfile.update({
    where: { id: 'singleton' },
    data: {
      heading: snapshot.contact.heading,
      ctaLabel: snapshot.contact.ctaLabel,
      description: snapshot.contact.description,
    },
  });

  // Verification step
  const restoredHero = await prisma.heroProfile.findUnique({ where: { id: 'singleton' } });
  const restoredAbout = await prisma.aboutProfile.findUnique({ where: { id: 'singleton' } });
  const restoredContact = await prisma.contactProfile.findUnique({ where: { id: 'singleton' } });

  assert.strictEqual(restoredHero?.name, snapshot.hero.name, 'Hero restoration check failed');
  assert.strictEqual(restoredAbout?.heading, snapshot.about.heading, 'About restoration check failed');
  assert.strictEqual(restoredContact?.heading, snapshot.contact.heading, 'Contact restoration check failed');
}

/**
 * Snapshots baseline display orders for projects, experiences, and contact channels.
 */
export async function takeBaselineOrderSnapshot(
  prisma: PrismaClient
): Promise<BaselineOrderSnapshot> {
  assertE2EDatabase();

  const projects = await prisma.project.findMany({
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  const experiences = await prisma.experience.findMany({
    orderBy: { order: 'asc' },
    select: { id: true },
  });
  const contactChannels = await prisma.contactChannel.findMany({
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  return {
    projectIds: projects.map((p) => p.id),
    experienceIds: experiences.map((e) => e.id),
    contactChannelIds: contactChannels.map((c) => c.id),
  };
}

/**
 * Restores baseline display orders for projects and experiences.
 * Authoritatively verifies post-restoration order against the initial snapshot.
 * Throws a fatal error if restored order sequence or values do not match exactly.
 */
export async function restoreBaselineOrder(
  prisma: PrismaClient,
  snapshot: BaselineOrderSnapshot
): Promise<void> {
  assertE2EDatabase();

  // 1. Restore Project order
  for (let i = 0; i < snapshot.projectIds.length; i++) {
    await prisma.project.update({
      where: { id: snapshot.projectIds[i] },
      data: { order: i },
    });
  }

  // 2. Read back all project IDs and order from database
  const restoredProjects = await prisma.project.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, order: true },
  });

  // 3. Compare project results with initial snapshot
  if (snapshot.projectIds.length === 0) {
    if (restoredProjects.length !== 0) {
      throw new Error(
        `[E2E-BASELINE-FATAL] Project order restoration mismatch: expected 0 projects, database has ${restoredProjects.length}`
      );
    }
  } else {
    if (restoredProjects.length !== snapshot.projectIds.length) {
      throw new Error(
        `[E2E-BASELINE-FATAL] Project count mismatch after restoration: expected ${snapshot.projectIds.length}, got ${restoredProjects.length}`
      );
    }
    for (let i = 0; i < snapshot.projectIds.length; i++) {
      const expectedId = snapshot.projectIds[i];
      const actualId = restoredProjects[i].id;
      const actualOrder = restoredProjects[i].order;

      if (actualId !== expectedId) {
        throw new Error(
          `[E2E-BASELINE-FATAL] Project order ID mismatch at index ${i}: expected ID '${expectedId}', got '${actualId}'`
        );
      }
      if (actualOrder !== i) {
        throw new Error(
          `[E2E-BASELINE-FATAL] Project order index mismatch for ID '${actualId}': expected order ${i}, got ${actualOrder}`
        );
      }
    }
  }

  // 4. Restore Experience order
  for (let i = 0; i < snapshot.experienceIds.length; i++) {
    await prisma.experience.update({
      where: { id: snapshot.experienceIds[i] },
      data: { order: i },
    });
  }

  // 5. Read back all experience IDs and order from database
  const restoredExperiences = await prisma.experience.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, order: true },
  });

  // 6. Compare experience results with initial snapshot
  if (snapshot.experienceIds.length === 0) {
    if (restoredExperiences.length !== 0) {
      throw new Error(
        `[E2E-BASELINE-FATAL] Experience order restoration mismatch: expected 0 experiences, database has ${restoredExperiences.length}`
      );
    }
  } else {
    if (restoredExperiences.length !== snapshot.experienceIds.length) {
      throw new Error(
        `[E2E-BASELINE-FATAL] Experience count mismatch after restoration: expected ${snapshot.experienceIds.length}, got ${restoredExperiences.length}`
      );
    }
    for (let i = 0; i < snapshot.experienceIds.length; i++) {
      const expectedId = snapshot.experienceIds[i];
      const actualId = restoredExperiences[i].id;
      const actualOrder = restoredExperiences[i].order;

      if (actualId !== expectedId) {
        throw new Error(
          `[E2E-BASELINE-FATAL] Experience order ID mismatch at index ${i}: expected ID '${expectedId}', got '${actualId}'`
        );
      }
      if (actualOrder !== i) {
        throw new Error(
          `[E2E-BASELINE-FATAL] Experience order index mismatch for ID '${actualId}': expected order ${i}, got ${actualOrder}`
        );
      }
    }
  }

  // 7. Restore ContactChannel order (when included in snapshot)
  if (snapshot.contactChannelIds !== undefined) {
    for (let i = 0; i < snapshot.contactChannelIds.length; i++) {
      await prisma.contactChannel.update({
        where: { id: snapshot.contactChannelIds[i] },
        data: { order: i },
      });
    }

    const restoredContactChannels = await prisma.contactChannel.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    if (snapshot.contactChannelIds.length === 0) {
      if (restoredContactChannels.length !== 0) {
        throw new Error(
          `[E2E-BASELINE-FATAL] ContactChannel order restoration mismatch: expected 0 contact channels, database has ${restoredContactChannels.length}`
        );
      }
    } else {
      if (restoredContactChannels.length !== snapshot.contactChannelIds.length) {
        throw new Error(
          `[E2E-BASELINE-FATAL] ContactChannel count mismatch after restoration: expected ${snapshot.contactChannelIds.length}, got ${restoredContactChannels.length}`
        );
      }
      for (let i = 0; i < snapshot.contactChannelIds.length; i++) {
        const expectedId = snapshot.contactChannelIds[i];
        const actualId = restoredContactChannels[i].id;
        const actualOrder = restoredContactChannels[i].order;

        if (actualId !== expectedId) {
          throw new Error(
            `[E2E-BASELINE-FATAL] ContactChannel order ID mismatch at index ${i}: expected ID '${expectedId}', got '${actualId}'`
          );
        }
        if (actualOrder !== i) {
          throw new Error(
            `[E2E-BASELINE-FATAL] ContactChannel order index mismatch for ID '${actualId}': expected order ${i}, got ${actualOrder}`
          );
        }
      }
    }
  }
}

/**
 * Deletes ONLY tracked test items created during the test run using explicit IDs.
 * Combines explicit ID array matching with the E2E_TEST_ prefix as defense-in-depth.
 */
export async function cleanupTestData(
  prisma: PrismaClient,
  tracked: TrackedE2EResources
): Promise<void> {
  assertE2EDatabase();

  // 1. Delete tracked test projects by explicit IDs
  if (tracked.projectIds && tracked.projectIds.length > 0) {
    await prisma.project.deleteMany({
      where: {
        id: { in: tracked.projectIds },
        title: { startsWith: 'E2E_TEST_' },
      },
    });
  }

  // 2. Delete tracked test experiences by explicit IDs
  if (tracked.experienceIds && tracked.experienceIds.length > 0) {
    await prisma.experience.deleteMany({
      where: {
        id: { in: tracked.experienceIds },
        role: { startsWith: 'E2E_TEST_' },
      },
    });
  }

  // 3. Delete tracked test contact channels by explicit IDs
  if (tracked.contactChannelIds && tracked.contactChannelIds.length > 0) {
    await prisma.contactChannel.deleteMany({
      where: {
        id: { in: tracked.contactChannelIds },
        label: { startsWith: 'E2E_TEST_' },
      },
    });
  }

  // 4. Delete tracked test admin by explicit ID
  if (tracked.adminId) {
    await prisma.admin.deleteMany({
      where: {
        id: tracked.adminId,
      },
    });
  }
}
