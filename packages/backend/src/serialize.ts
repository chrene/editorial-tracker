import type { ContentItem } from '@editorial-tracker/shared';
import type { ContentItem as ContentItemRow } from '@prisma/client';

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
