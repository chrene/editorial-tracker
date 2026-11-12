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

type ContentPatch = Prisma.ContentItemUncheckedUpdateInput;

const EVERY_ITEM: Prisma.ContentItemWhereInput = {};

function visibleTo(user: User): Prisma.ContentItemWhereInput {
  if (user.role === 'editor') return EVERY_ITEM;

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
  return db.$transaction(async (tx) => {
    const row = await tx.contentItem.create({
      data: { ...input, createdBy: user.id, updatedBy: user.id },
    });

    await record(row.id, user.id, 'created', null, tx);

    return toContentItem(row);
  });
}

export async function update(
  user: User,
  id: string,
  input: UpdateContentInput,
): Promise<ContentItem> {
  const before = await get(user, id);
  return save(user, before, input);
}

export async function updateStatus(
  user: User,
  id: string,
  next: ContentStatus,
): Promise<ContentItem> {
  const before = await get(user, id);

  const isAlreadyInRequestedStatus = next === before.status;
  if (isAlreadyInRequestedStatus) return before;

  return save(user, before, statusChange(user, before, next));
}

export async function remove(user: User, id: string): Promise<void> {
  await get(user, id);

  await db.$transaction(async (tx) => {
    await tx.contentItem.delete({ where: { id } });

    await record(id, user.id, 'deleted', null, tx);
  });
}

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

function statusChange(user: User, before: ContentItem, next: ContentStatus): ContentPatch {
  const problem = transitionError(before.status, next);
  if (problem) throw createError.Conflict(problem);

  const now = new Date();
  const patch: ContentPatch = { status: next };

  const isFirstTimePublished = next === 'published' && before.publishedAt === null;
  const isEnteringArchive = next === 'archived';
  const isLeavingArchive = before.status === 'archived';

  if (isFirstTimePublished) {
    patch.publishedAt = now;
    patch.publishedBy = user.id;
  }

  if (isEnteringArchive) {
    patch.archivedAt = now;
    patch.archivedBy = user.id;
  } else if (isLeavingArchive) {
    patch.archivedAt = null;
    patch.archivedBy = null;
  }

  return patch;
}

function actionFor(before: ContentItem, after: ContentItem): AuditAction {
  if (after.status === 'published' && before.status !== 'published') return 'published';
  if (after.status === 'archived' && before.status !== 'archived') return 'archived';
  if (after.status !== before.status) return 'status_changed';
  return 'updated';
}
