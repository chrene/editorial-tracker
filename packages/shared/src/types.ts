/**
 * The API's wire types — what the backend actually sends, and what the frontend
 * can rely on receiving.
 *
 * Dates are ISO strings, not `Date`, because that is what survives
 * `JSON.stringify`. The database row types are Prisma's, generated from
 * `packages/backend/prisma/schema.prisma`, and the backend maps between the two
 * in `serialize.ts`.
 *
 * The enums below are declared as `as const` arrays rather than TypeScript
 * unions so the frontend can iterate them — status filters and the type
 * dropdown are built from these exact lists. They are duplicated in
 * `schema.prisma`, because this package must stay free of `@prisma/client`
 * for the browser; `backend/src/enum-contract.ts` fails the build if the two
 * ever disagree.
 */

// --- Enums -----------------------------------------------------------------

export const CONTENT_TYPES = ['article', 'video'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ['idea', 'draft', 'review', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const ROLES = ['editor', 'contributor'] as const;
export type Role = (typeof ROLES)[number];

export const AUDIT_ACTIONS = [
  'created',
  'updated',
  'status_changed',
  'published',
  'archived',
  'deleted',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// --- Records ---------------------------------------------------------------

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

  /** Assigned authors. Being listed here grants the same access as creating it. */
  authorIds: string[];
  deadline: string | null;

  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;

  /** When the item *first* went live. A restore from the archive does not reset it. */
  publishedBy: string | null;
  publishedAt: string | null;

  /** Set while archived, cleared on restore — never contradicts `status`. */
  archivedBy: string | null;
  archivedAt: string | null;
}

// --- Audit -----------------------------------------------------------------

/** What one edit changed, as `{ field: { from, to } }`. */
export type Changes = Record<string, { from: unknown; to: unknown }>;

export interface AuditEntry {
  id: string;
  contentItemId: string;
  actorId: string;
  action: AuditAction;
  /** Changed fields only. Null for `created`, which has no previous version. */
  changes: Changes | null;
  at: string;
}
