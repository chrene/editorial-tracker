import type { $Enums, Prisma } from '@prisma/client';
import type {
  AuditAction,
  AuditEntry,
  ContentItem,
  ContentStatus,
  ContentType,
  Role,
} from '@editorial-tracker/shared';

/**
 * Proof that the wire types in `shared` and the database schema agree.
 *
 * The values are declared twice on purpose. `shared` needs them as plain arrays
 * because the browser uses them to build filter chips and dropdowns, and it
 * must never import `@prisma/client` — that would pull a database driver into
 * the frontend bundle. Prisma needs them in its own schema language.
 *
 * Rather than hope the two stay in step, this fails the backend build the
 * moment they diverge. It is types only: nothing here survives compilation.
 */

/** `true` only when two unions have exactly the same members, in any order. */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

type EnumsMatch = [
  Exact<Role, $Enums.Role>,
  Exact<ContentType, $Enums.ContentType>,
  Exact<ContentStatus, $Enums.ContentStatus>,
  Exact<AuditAction, $Enums.AuditAction>,
];

// Adding a status to one file and not the other turns its slot into `never`,
// and this line stops compiling.
export const ENUMS_MATCH: EnumsMatch = [true, true, true, true];

/**
 * The wire types cannot simply *be* Prisma's: a row carries `Date` objects, and
 * what reaches the browser is an ISO string. `serialize.ts` converts them.
 *
 * The field *names*, though, must line up exactly — otherwise a new column is
 * added to the schema and quietly never reaches the frontend. These check the
 * names while leaving each side free to type its own values.
 */
type ScalarFields<T> = keyof T;

type FieldsMatch = [
  Exact<ScalarFields<ContentItem>, keyof typeof Prisma.ContentItemScalarFieldEnum>,
  Exact<ScalarFields<AuditEntry>, keyof typeof Prisma.AuditLogScalarFieldEnum>,
];

// Add a column to schema.prisma without adding it to the wire type (or the
// reverse) and this line stops compiling.
export const FIELDS_MATCH: FieldsMatch = [true, true];
