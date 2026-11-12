import type { ContentStatus } from '@editorial-tracker/shared';

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`badge status-${status}`}>{status}</span>;
}
