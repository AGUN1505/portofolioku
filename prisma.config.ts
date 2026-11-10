// prisma.config.ts
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  migrations: {
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
