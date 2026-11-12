import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://editorial:editorial@localhost:5432/editorial_tracker';

export const pool = new pg.Pool({ connectionString });
export const db = drizzle(pool, { schema });
export { schema };
