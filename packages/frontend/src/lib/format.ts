import {
  STATUS_TRANSITIONS,
  type ContentItem,
  type ContentStatus,
  type User,
} from '@editorial-tracker/shared';

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

export function isOverdue(item: ContentItem): boolean {
  if (!item.deadline) return false;
  if (item.status === 'published' || item.status === 'archived') return false;
  return new Date(item.deadline) < new Date();
}

export function allowedNextStatuses(status: ContentStatus): readonly ContentStatus[] {
  return STATUS_TRANSITIONS[status];
}
