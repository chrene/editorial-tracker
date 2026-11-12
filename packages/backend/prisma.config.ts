import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://editorial:editorial@localhost:5432/editorial_tracker';

export default defineConfig({
  schema: 'prisma/schema.prisma',

  datasource: { url: connectionString },
  adapter: async () => new PrismaPg({ connectionString }),
});
