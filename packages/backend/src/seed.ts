import { USERS } from '@editorial-tracker/shared';
import { users } from './schema.js';
import { db, pool } from './db.js';

/**
 * Pushes the hardcoded user list into the `users` table so author ids and audit
 * actor ids resolve to real foreign keys. Safe to re-run.
 */
async function seed(): Promise<void> {
  for (const user of USERS) {
    await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: { name: user.name, email: user.email, role: user.role },
      });
  }
  console.log(`Seeded ${USERS.length} users.`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
