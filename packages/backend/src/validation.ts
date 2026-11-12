import { z } from 'zod';
import createError from 'http-errors';
import { CONTENT_STATUSES, CONTENT_TYPES, type ContentStatus } from '@editorial-tracker/shared';

/**
 * Request body schemas. The enums are built from the same `as const` arrays the
 * domain types and the Postgres enums come from, so all three can never
 * disagree about what a valid type or status is.
 */

const title = z.string('title is required.').trim().min(1, 'title must be a non-empty string.');
const type = z.enum(CONTENT_TYPES, `type must be one of: ${CONTENT_TYPES.join(', ')}.`);
const status = z.enum(CONTENT_STATUSES, `status must be one of: ${CONTENT_STATUSES.join(', ')}.`);
const authorIds = z.array(
  z.uuid('authorIds must be an array of user ids.'),
  'authorIds must be an array of user ids.',
);

/** Accepts an ISO string or null; hands the service a real `Date`. */
const deadline = z.coerce.date('deadline must be a valid date.').nullable();

const createSchema = z.object({
  title,
  type,
  authorIds: authorIds.default([]),
  deadline: deadline.default(null),
});

/**
 * Every field optional: a PATCH changes only what it names. `status` is absent
 * on purpose — a status move is a transition with its own rules, not a field
 * edit, so it has its own endpoint and schema.
 */
const updateSchema = z.object({
  title: title.optional(),
  type: type.optional(),
  authorIds: authorIds.optional(),
  deadline: deadline.optional(),
});

const statusSchema = z.object({ status });

export type CreateContentInput = z.infer<typeof createSchema>;
export type UpdateContentInput = z.infer<typeof updateSchema>;

/** Validates a body, or throws a 400 carrying the first problem found. */
function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (result.success) return result.data;

  const [issue] = result.error.issues;
  throw createError.BadRequest(issue.message);
}

export const parseCreate = (body: unknown): CreateContentInput => parse(createSchema, body);
export const parseUpdate = (body: unknown): UpdateContentInput => parse(updateSchema, body);
export const parseStatus = (body: unknown): ContentStatus => parse(statusSchema, body).status;
