// scripts/seed-sections.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export interface DefaultSectionSeed {
  key: string;
  label: string;
  order: number;
  enabled?: boolean;
}

export const DEFAULT_SECTIONS: DefaultSectionSeed[] = [
  { key: 'hero', label: 'Hero Section', order: 0, enabled: true },
  { key: 'about', label: 'About Section', order: 1, enabled: true },
  { key: 'projects', label: 'Projects Section', order: 2, enabled: true },
  { key: 'experience', label: 'Experience Section', order: 3, enabled: true },
  { key: 'skills', label: 'Skills Section', order: 4, enabled: true },
  { key: 'certificates', label: 'Certificates Section', order: 5, enabled: true },
  { key: 'contact', label: 'Contact Section', order: 6, enabled: true },
];

export async function seedSections(prismaClient?: PrismaClient) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[seedSections] DATABASE_URL is not set.');
  }

  const prisma =
    prismaClient ??
    new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });

  console.log('--- SEEDING SECTION CONFIGS ---');
  const results = [];

  for (const section of DEFAULT_SECTIONS) {
    const record = await prisma.sectionConfig.upsert({
      where: { key: section.key },
      update: {
        label: section.label,
        order: section.order,
      },
      create: {
        key: section.key,
        label: section.label,
        order: section.order,
        enabled: section.enabled ?? true,
      },
    });
    results.push(record);
    console.log(
      `✓ Section [${record.key}]: "${record.label}" (order: ${record.order}, enabled: ${record.enabled})`
    );
  }

  return results;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const seeded = await seedSections(prisma);
    console.log(`--- SEEDING COMPLETE: ${seeded.length} sections verified/seeded ---`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module || process.argv[1]?.includes('seed-sections')) {
  main().catch((error) => {
    console.error('Failed to seed section configs:', error);
    process.exit(1);
  });
}
