import type { $Enums } from '@prisma/client';
import type { AuditAction, ContentStatus, ContentType, Role } from '@editorial-tracker/shared';

/**
 * Proof that `shared` and `schema.prisma` agree about every enum.
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
