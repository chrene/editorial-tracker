import type { ContentItem, User } from './types.js';

/**
 * Editors reach every content item. Contributors reach only the ones they
 * created or are listed as an author on.
 *
 * Viewing and managing are deliberately the same rule: a contributor who can
 * see an item can always change it. One function, so the two cannot drift.
 */
export function canAccess(user: User, item: Pick<ContentItem, 'createdBy' | 'authorIds'>): boolean {
  if (user.role === 'editor') return true;
  return item.createdBy === user.id || item.authorIds.includes(user.id);
}
