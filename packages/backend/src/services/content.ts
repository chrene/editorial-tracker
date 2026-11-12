import { desc, eq, or, sql } from 'drizzle-orm';
import createError from 'http-errors';
import {
  canAccess,
  transitionError,
  type AuditAction,
  type AuditEntry,
  type ContentItem,
  type ContentStatus,
  type User,
} from '@editorial-tracker/shared';
import { auditLog, contentItems } from '../schema.js';
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

type ContentPatch = Partial<typeof contentItems.$inferInsert>;

/**
 * Restricts a query to the rows a user may see. Editors get everything, which
 * is why this returns `undefined` — Drizzle reads that as "no WHERE clause".
 *
 * Contributors are filtered in SQL rather than after the fetch, so a future
 * `LIMIT` cannot quietly count rows the user is not allowed to see.
 */
function visibleTo(user: User) {
  if (user.role === 'editor') return undefined;

  return or(
    eq(contentItems.createdBy, user.id),
    sql`${contentItems.authorIds} @> ARRAY[${user.id}]::uuid[]`,
  );
}

export async function list(user: User): Promise<ContentItem[]> {
  const rows = await db
    .select()
    .from(contentItems)
    .where(visibleTo(user))
    .orderBy(desc(contentItems.updatedAt));

  return rows.map(toContentItem);
}

/**
 * Loads one item the user may reach. Used on its own and as the guard in front
 * of every write, so permission is checked in exactly one place.
 */
export async function get(user: User, id: string): Promise<ContentItem> {
  const [row] = await db.select().from(contentItems).where(eq(contentItems.id, id));
  if (!row) throw createError.NotFound();

  const item = toContentItem(row);
  // A hidden item is reported as missing on purpose: a contributor should not
  // be able to tell "does not exist" from "is not yours".
  if (!canAccess(user, item)) throw createError.NotFound();

  return item;
}

export async function history(user: User, id: string): Promise<AuditEntry[]> {
  await get(user, id);

  const entries = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.contentItemId, id))
    .orderBy(desc(auditLog.at));

  return entries.map((entry) => ({ ...entry, at: entry.at.toISOString() }));
}

export async function create(user: User, input: CreateContentInput): Promise<ContentItem> {
  // New items always start at `idea`. Status only ever moves through `update`,
  // the single place the state machine is enforced.
  const [row] = await db
    .insert(contentItems)
    .values({ ...input, createdBy: user.id, updatedBy: user.id })
    .returning();

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
  return save(user, before, statusChange(user, before, next));
}

export async function remove(user: User, id: string): Promise<void> {
  await get(user, id);

  await db.delete(contentItems).where(eq(contentItems.id, id));

  // The log keeps its rows: `audit_log.content_item_id` has no foreign key
  // precisely so history survives the item it describes.
  await record(id, user.id, 'deleted');
}

/** Writes a patch and records what actually changed. The only write path. */
async function save(user: User, before: ContentItem, patch: ContentPatch): Promise<ContentItem> {
  const [row] = await db
    .update(contentItems)
    .set({ ...patch, updatedBy: user.id, updatedAt: new Date() })
    .where(eq(contentItems.id, before.id))
    .returning();

  const after = toContentItem(row);

  const changes = diff(before, after);
  if (Object.keys(changes).length > 0) {
    await record(before.id, user.id, actionFor(before, after), changes);
  }

  return after;
}

/**
 * The new status, plus the timestamps that record the move.
 *
 * A stamp is written when the item *enters* that status and cleared when it
 * leaves, so the stamps can never contradict the status — an unarchived item
 * does not keep claiming it was archived. `status` is still the only thing read
 * to decide where an item stands; the stamps only say when and by whom.
 */
function statusChange(user: User, before: ContentItem, next: ContentStatus): ContentPatch {
  const problem = transitionError(before.status, next);
  if (problem) throw createError.Conflict(problem);

  const now = new Date();
  const patch: ContentPatch = { status: next };

  if (next === 'published') {
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
