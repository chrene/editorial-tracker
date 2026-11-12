import {
  STATUS_TRANSITIONS,
  type ContentItem,
  type ContentStatus,
  type User,
} from '@editorial-tracker/shared';

/** Turns the API's ISO strings and ids into something a person can read. */

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function userName(users: User[], id: string | null): string {
  if (!id) return '—';
  return users.find((u) => u.id === id)?.name ?? 'Unknown user';
}

/** A deadline in the past matters, but only while the item is still in flight. */
export function isOverdue(item: ContentItem): boolean {
  if (!item.deadline) return false;
  if (item.status === 'published' || item.status === 'archived') return false;
  return new Date(item.deadline) < new Date();
}

/** The statuses this item can move to right now, straight from the state machine. */
export function allowedNextStatuses(status: ContentStatus): readonly ContentStatus[] {
  return STATUS_TRANSITIONS[status];
}
