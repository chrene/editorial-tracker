/**
 * The API's wire types — what the backend actually sends, and what the frontend
 * can rely on receiving.
 *
 * Dates are ISO strings, not `Date`, because that is what survives
 * `JSON.stringify`. The database row types are Prisma's, generated from
 * `packages/backend/prisma/schema.prisma`, and the backend maps between the two
 * in `serialize.ts`.
 *
 * `CONTENT_TYPES` and `CONTENT_STATUSES` are `as const` arrays because the
 * frontend iterates them to build the status filters and the type dropdown.
 * `Role` and `AuditAction` are plain unions — nothing lists those. All four are
 * duplicated in
 * `schema.prisma`, because this package must stay free of `@prisma/client`
 * for the browser; `backend/src/schema-contract.ts` fails the build if the two
 * ever disagree — it checks the enum members and the field names, while
 * leaving each side to type its own values.
 */

// --- Enums -----------------------------------------------------------------

export const CONTENT_TYPES = ['article', 'video'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ['idea', 'draft', 'review', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type Role = 'editor' | 'contributor';

export type AuditAction =
  'created' | 'updated' | 'status_changed' | 'published' | 'archived' | 'deleted';

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
