import type { Prisma } from '@prisma/client';
import type { AuditAction, Changes, ContentItem } from '@editorial-tracker/shared';

interface AuditEntryInput {
  contentItemId: string;
  actorId: string;
  action: AuditAction;
  changes?: Changes;
}

const FIELDS_A_PERSON_EDITS = ['title', 'type', 'status', 'authorIds', 'deadline'] as const;

function isSameValueEvenForArrays(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function asPrismaJson(changes: Changes | undefined): Prisma.InputJsonValue | undefined {
  return changes as Prisma.InputJsonValue | undefined;
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

export async function writeAuditEntry(
  tx: Prisma.TransactionClient,
  entry: AuditEntryInput,
): Promise<void> {
  await tx.auditLog.create({
    data: { ...entry, changes: asPrismaJson(entry.changes) },
  });
}
