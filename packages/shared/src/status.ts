import type { ContentStatus } from './types.js';

/**
 * Which statuses each status may move to, so an item cannot jump from `idea`
 * straight to `review`.
 *
 * `status` is the single source of truth for whether an item is published.
 * `publishedAt` records when the move happened and is never read back to work
 * out the status — otherwise an item could sit on `review` while carrying a
 * publish timestamp, and the two answers would disagree.
 */
export const STATUS_TRANSITIONS: Record<ContentStatus, readonly ContentStatus[]> = {
  idea: ['draft'],
  draft: ['idea', 'review'],
  review: ['draft', 'published'],
  published: ['archived'],
  archived: [],
};

/**
 * Explains why a status move is not allowed, or returns `null` if it is.
 * Staying on the same status is always allowed.
 */
export function transitionError(from: ContentStatus, to: ContentStatus): string | null {
  if (from === to) return null;

  const allowed = STATUS_TRANSITIONS[from];
  if (allowed.includes(to)) return null;

  return allowed.length === 0
    ? `'${from}' is a terminal status; it cannot change to '${to}'.`
    : `Cannot go from '${from}' to '${to}'. Allowed: ${allowed.join(', ')}.`;
}
