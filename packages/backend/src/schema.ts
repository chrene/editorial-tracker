import { sql } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { AUDIT_ACTIONS, CONTENT_STATUSES, CONTENT_TYPES, ROLES } from '@editorial-tracker/shared';

/**
 * The database schema. It lives in the backend, not in `shared`: the browser
 * talks to the API, never to Postgres, so `shared` stays free of any driver.
 *
 * There are no migration files. `pnpm --filter @editorial-tracker/backend db:push`
 * diffs this file against the live database and applies the difference.
 *
 * The enum values come from the same `as const` arrays the domain types are built
 * from, so a Postgres enum and its TypeScript union can never disagree.
 */
export const roleEnum = pgEnum('role', ROLES);
export const contentTypeEnum = pgEnum('content_type', CONTENT_TYPES);
export const contentStatusEnum = pgEnum('content_status', CONTENT_STATUSES);
export const auditActionEnum = pgEnum('audit_action', AUDIT_ACTIONS);

/** Seeded from the hardcoded `USERS` list so author and actor ids are real FKs. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: roleEnum('role').notNull(),
});

/** A column pointing at `users.id`. Used for every "who did this" field below. */
const userRef = (column: string) => uuid(column).references(() => users.id);

export const contentItems = pgTable(
  'content_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    type: contentTypeEnum('type').notNull(),
    status: contentStatusEnum('status').notNull().default('idea'),

    /** Authors beyond the creator. `createdBy` is not repeated in here. */
    authorIds: uuid('author_ids')
      .array()
      .notNull()
      .$type<string[]>()
      .default(sql`'{}'::uuid[]`),

    deadline: timestamp('deadline', { withTimezone: true }),

    createdBy: userRef('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: userRef('updated_by').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

    /** Set when `status` becomes `published`. Never read back to infer status. */
    publishedBy: userRef('published_by'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedBy: userRef('archived_by'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [
    index('content_items_status_idx').on(t.status),
    index('content_items_created_by_idx').on(t.createdBy),
  ],
);

/**
 * Append-only history. The `content_items` columns above answer "what is true
 * now" in one read; this table answers "what happened, and who did it".
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentItemId: uuid('content_item_id').notNull(),
    actorId: userRef('actor_id').notNull(),
    action: auditActionEnum('action').notNull(),
    /** Changed fields only: `{ field: { from, to } }`. Null for `created`. */
    changes: jsonb('changes').$type<Record<string, { from: unknown; to: unknown }> | null>(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_log_content_item_idx').on(t.contentItemId, t.at)],
);

/** `contentItemId` deliberately has no FK: the log outlives the row it describes. */

export type UserRow = typeof users.$inferSelect;
export type ContentItemRow = typeof contentItems.$inferSelect;
export type NewContentItemRow = typeof contentItems.$inferInsert;
export type AuditLogRow = typeof auditLog.$inferSelect;
export type NewAuditLogRow = typeof auditLog.$inferInsert;
