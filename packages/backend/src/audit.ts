import type { Prisma, PrismaClient } from '@prisma/client';
import type { AuditAction, Changes, ContentItem } from '@editorial-tracker/shared';
import { db } from './db.js';

type Db = PrismaClient | Prisma.TransactionClient;

const FIELDS_A_PERSON_EDITS = ['title', 'type', 'status', 'authorIds', 'deadline'] as const;

function isSameValueEvenForArrays(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function asPrismaJson(changes: Changes | null): Prisma.InputJsonValue | undefined {
  return (changes ?? undefined) as Prisma.InputJsonValue | undefined;
}

export function diff(before: ContentItem, after: ContentItem): Changes {
  const changes: Changes = {};

  for (const field of FIELDS_A_PERSON_EDITS) {
    const from = before[field];
    const to = after[field];

    if (!isSameValueEvenForArrays(from, to)) {
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
    data: { contentItemId, actorId, action, changes: asPrismaJson(changes) },
  });
}
