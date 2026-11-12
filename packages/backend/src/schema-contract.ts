import type { $Enums, Prisma } from './generated/prisma/client.js';
import type {
  AuditAction,
  AuditEntry,
  ContentItem,
  ContentStatus,
  ContentType,
  Role,
} from '@editorial-tracker/shared';

type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

type EnumsMatch = [
  Exact<Role, $Enums.Role>,
  Exact<ContentType, $Enums.ContentType>,
  Exact<ContentStatus, $Enums.ContentStatus>,
  Exact<AuditAction, $Enums.AuditAction>,
];

export const ENUMS_MATCH: EnumsMatch = [true, true, true, true];

type ScalarFields<T> = keyof T;

type FieldsMatch = [
  Exact<ScalarFields<ContentItem>, keyof typeof Prisma.ContentItemScalarFieldEnum>,
  Exact<ScalarFields<AuditEntry>, keyof typeof Prisma.AuditLogScalarFieldEnum>,
];

export const FIELDS_MATCH: FieldsMatch = [true, true];
