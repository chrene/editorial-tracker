/**
 * Domain types as they cross the wire. Dates are ISO strings here, not `Date`:
 * these are what the API actually sends after JSON.stringify, so the frontend
 * gets types it can trust. The database row types live in `./schema`.
 */

export const CONTENT_TYPES = ['article', 'video'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ['idea', 'draft', 'review', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ROLES = ['editor', 'contributor'] as const;
export type Role = (typeof ROLES)[number];

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

export const AUDIT_ACTIONS = [
  'created',
  'updated',
  'status_changed',
  'published',
  'archived',
  'deleted',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  id: string;
  contentItemId: string;
  actorId: string;
  action: AuditAction;
  /** Changed fields only, as `{ field: { from, to } }`. Null for `created`. */
  changes: Record<string, { from: unknown; to: unknown }> | null;
  at: string;
}
