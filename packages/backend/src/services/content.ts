import createError from 'http-errors';
import type { Prisma } from '@prisma/client';
import {
  transitionError,
  type AuditAction,
  type AuditEntry,
  type ContentItem,
  type ContentStatus,
  type User,
} from '@editorial-tracker/shared';
import { db } from '../db.js';
import { toContentItem } from '../serialize.js';
import { diff, record } from '../audit.js';
import type { CreateContentInput, UpdateContentInput } from '../validation.js';

/**
 * Everything content items do: who may reach them, how their status may move,
 * and what lands in the audit log.
 *
 * This layer knows nothing about HTTP beyond the status codes it throws, so the
 * same functions would serve a CLI or a background job.
 */

type ContentPatch = Prisma.ContentItemUncheckedUpdateInput;

/**
 * Restricts a query to the rows a user may see. Editors get everything, which
 * is why this returns `{}` — Prisma reads that as "no filter".
 *
 * Contributors are filtered in SQL rather than after the fetch, so a future
 * `take` cannot quietly count rows the user is not allowed to see.
 */
function visibleTo(user: User): Prisma.ContentItemWhereInput {
  if (user.role === 'editor') return {};

  return {
    OR: [{ createdBy: user.id }, { authorIds: { has: user.id } }],
  };
}

export async function list(user: User): Promise<ContentItem[]> {
  const rows = await db.contentItem.findMany({
    where: visibleTo(user),
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map(toContentItem);
}

/**
 * Loads one item the user may reach. Used on its own and as the guard in front
 * of every write, so permission is checked in exactly one place.
 *
 * The filter is the same `visibleTo` the list uses, so the two can never
 * disagree about who may see what. A hidden item is reported as missing on
 * purpose: a contributor should not be able to tell "does not exist" from
 * "is not yours".
 */
export async function get(user: User, id: string): Promise<ContentItem> {
  const row = await db.contentItem.findFirst({ where: { id, ...visibleTo(user) } });
  if (!row) throw createError.NotFound();

  return toContentItem(row);
}

export async function history(user: User, id: string): Promise<AuditEntry[]> {
  await get(user, id);

  const entries = await db.auditLog.findMany({
    where: { contentItemId: id },
    orderBy: { at: 'desc' },
  });

  return entries.map((entry) => ({
    ...entry,
    changes: entry.changes as AuditEntry['changes'],
    at: entry.at.toISOString(),
  }));
}

export async function create(user: User, input: CreateContentInput): Promise<ContentItem> {
  // New items always start at `idea`. Status only ever moves through
  // `updateStatus`, the single place the state machine is enforced.
  const row = await db.contentItem.create({
    data: { ...input, createdBy: user.id, updatedBy: user.id },
  });

  await record(row.id, user.id, 'created');

  return toContentItem(row);
}

export async function update(
  user: User,
  id: string,
  input: UpdateContentInput,
): Promise<ContentItem> {
  const before = await get(user, id);
  return save(user, before, input);
}

/**
 * Moves an item to a new status. Separate from `update` because a transition is
 * not a field edit: it is checked against the state machine and it stamps who
 * published or archived the item.
 */
export async function updateStatus(
  user: User,
  id: string,
  next: ContentStatus,
): Promise<ContentItem> {
  const before = await get(user, id);

  // Asking for the status it already has is a no-op, not a rewrite. Without
  // this, re-sending `published` would stamp a fresh publish time and actor
  // while writing no history entry to explain the change.
  if (next === before.status) return before;

  return save(user, before, statusChange(user, before, next));
}

export async function remove(user: User, id: string): Promise<void> {
  await get(user, id);

  await db.contentItem.delete({ where: { id } });

  // The log keeps its rows: `audit_log.content_item_id` is not a relation
  // precisely so history survives the item it describes.
  await record(id, user.id, 'deleted');
}

/**
 * Writes a patch and records what changed. The only write path.
 *
 * Both happen in one transaction: an item must never end up changed with no
 * history entry explaining it, which is the whole point of keeping the log.
 */
async function save(user: User, before: ContentItem, patch: ContentPatch): Promise<ContentItem> {
  return db.$transaction(async (tx) => {
    const row = await tx.contentItem.update({
      where: { id: before.id },
      data: { ...patch, updatedBy: user.id, updatedAt: new Date() },
    });

    const after = toContentItem(row);

    const changes = diff(before, after);
    if (Object.keys(changes).length > 0) {
      await record(before.id, user.id, actionFor(before, after), changes, tx);
    }

    return after;
  });
}

/**
 * The new status, plus the timestamps that record the move.
 *
 * The two stamps mean different things, so they behave differently:
 *
 * - `publishedAt` is when the item *first* went live. Restoring it from the
 *   archive does not reset it — the audit log already records the restore.
 * - `archivedAt` is how long it has been on the shelf, so it is written on the
 *   way in and cleared on the way out. A restored item must not keep claiming
 *   it is archived.
 *
 * `status` stays the only thing read to decide where an item stands; the
 * stamps only say when and by whom.
 */
function statusChange(user: User, before: ContentItem, next: ContentStatus): ContentPatch {
  const problem = transitionError(before.status, next);
  if (problem) throw createError.Conflict(problem);

  const now = new Date();
  const patch: ContentPatch = { status: next };

  if (next === 'published' && before.publishedAt === null) {
    patch.publishedAt = now;
    patch.publishedBy = user.id;
  }

  if (next === 'archived') {
    patch.archivedAt = now;
    patch.archivedBy = user.id;
  } else if (before.status === 'archived') {
    patch.archivedAt = null;
    patch.archivedBy = null;
  }

  return patch;
}

/** Names what happened. Publishing and archiving outrank a plain status move. */
function actionFor(before: ContentItem, after: ContentItem): AuditAction {
  if (after.status === 'published' && before.status !== 'published') return 'published';
  if (after.status === 'archived' && before.status !== 'archived') return 'archived';
  if (after.status !== before.status) return 'status_changed';
  return 'updated';
}
