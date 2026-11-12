import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://editorial:editorial@localhost:5432/editorial_tracker';

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({ adapter });
