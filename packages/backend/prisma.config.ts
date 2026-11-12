import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://editorial:editorial@localhost:5432/editorial_tracker';

/** Prisma 7 reads the connection from here rather than from schema.prisma. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  // The CLI (`db push`) reads `datasource.url`; the client uses the adapter.
  // Both need the same connection string, stated twice.
  datasource: { url: connectionString },
  adapter: async () => new PrismaPg({ connectionString }),
});
