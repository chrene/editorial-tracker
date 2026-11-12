import type { AuditAction, ContentItem } from '@editorial-tracker/shared';
import { db } from './db.js';

/** What changed, as `{ field: { from, to } }`. */
export type Changes = Record<string, { from: unknown; to: unknown }>;

/**
 * Fields worth a before/after entry. `updatedAt` and `updatedBy` are left out:
 * they change on every single write, so logging them would bury the edits a
 * person actually made.
 */
const TRACKED_FIELDS = ['title', 'type', 'status', 'authorIds', 'deadline'] as const;

/** Compares two versions of an item and returns only the fields that moved. */
export function diff(before: ContentItem, after: ContentItem): Changes {
  const changes: Changes = {};

  for (const field of TRACKED_FIELDS) {
    const from = before[field];
    const to = after[field];

    // Compared as JSON so `authorIds` (an array) is checked by value, not by
    // reference — two equal arrays must not look like a change.
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes[field] = { from, to };
    }
  }

  return changes;
}

/** Appends one entry to the log. The log is append-only; nothing updates it. */
export async function record(
  contentItemId: string,
  actorId: string,
  action: AuditAction,
  changes: Changes | null = null,
): Promise<void> {
  await db.auditLog.create({
    data: { contentItemId, actorId, action, changes: changes ?? undefined },
  });
}
