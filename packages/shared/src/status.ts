import type { ContentStatus } from './types.js';

export const STATUS_TRANSITIONS: Record<ContentStatus, readonly ContentStatus[]> = {
  idea: ['draft'],
  draft: ['idea', 'review'],
  review: ['draft', 'published'],
  published: ['archived'],

  archived: ['published', 'draft'],
};

export function transitionError(from: ContentStatus, to: ContentStatus): string | null {
  if (from === to) return null;

  const allowed = STATUS_TRANSITIONS[from];
  if (allowed.includes(to)) return null;

  return allowed.length === 0
    ? `'${from}' is a terminal status; it cannot change to '${to}'.`
    : `Cannot go from '${from}' to '${to}'. Allowed: ${allowed.join(', ')}.`;
}
