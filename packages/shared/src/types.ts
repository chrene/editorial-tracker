export const CONTENT_TYPES = ['article', 'video'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ['idea', 'draft', 'review', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type Role = 'editor' | 'contributor';

export type AuditAction =
  'created' | 'updated' | 'status_changed' | 'published' | 'archived' | 'deleted';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: ContentStatus;

  authorIds: string[];
  deadline: string | null;

  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;

  publishedBy: string | null;
  publishedAt: string | null;

  archivedBy: string | null;
  archivedAt: string | null;
}

export type Changes = Record<string, { from: unknown; to: unknown }>;

export interface AuditEntry {
  id: string;
  contentItemId: string;
  actorId: string;
  action: AuditAction;

  changes: Changes | null;
  at: string;
}
