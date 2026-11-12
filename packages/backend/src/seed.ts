import { USERS } from '@editorial-tracker/shared';
import { db } from './db.js';

async function seed(): Promise<void> {
  for (const user of USERS) {
    await db.user.upsert({ where: { id: user.id }, create: user, update: user });
  }

  console.log(`Seeded ${USERS.length} users.`);
  await db.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
