import { defineConfig } from 'drizzle-kit';

/**
 * No migration files: `drizzle-kit push` diffs the schema against the live
 * database and applies the difference directly.
 */
export default defineConfig({
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ?? 'postgres://editorial:editorial@localhost:5432/editorial_tracker',
  },
});
