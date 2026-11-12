import type { ContentItem } from '@editorial-tracker/shared';
import type { ContentItem as ContentItemRow } from '@prisma/client';

/**
 * Database rows to wire format.
 *
 * Prisma hands back `Date` objects, but the API contract in
 * `@editorial-tracker/shared` promises ISO strings — which is what the frontend
 * actually receives once the response is serialized. Converting here, in one
 * place, keeps that promise true.
 */
function isoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

export function toContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    authorIds: row.authorIds,
    deadline: isoOrNull(row.deadline),

    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),

    publishedBy: row.publishedBy,
    publishedAt: isoOrNull(row.publishedAt),
    archivedBy: row.archivedBy,
    archivedAt: isoOrNull(row.archivedAt),
  };
}
