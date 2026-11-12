import type { Prisma, PrismaClient } from '@prisma/client';
import type { AuditAction, Changes, ContentItem } from '@editorial-tracker/shared';
import { db } from './db.js';

type Db = PrismaClient | Prisma.TransactionClient;

const TRACKED_FIELDS = ['title', 'type', 'status', 'authorIds', 'deadline'] as const;

export function diff(before: ContentItem, after: ContentItem): Changes {
  const changes: Changes = {};

  for (const field of TRACKED_FIELDS) {
    const from = before[field];
    const to = after[field];

    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[field] = { from, to };
    }
  }

  return changes;
}

export async function record(
  contentItemId: string,
  actorId: string,
  action: AuditAction,
  changes: Changes | null = null,
  client: Db = db,
): Promise<void> {
  await client.auditLog.create({
    data: {
      contentItemId,
      actorId,
      action,

      changes: (changes ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
