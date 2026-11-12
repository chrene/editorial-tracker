import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CONTENT_TYPES,
  type ContentItem,
  type ContentStatus,
  type ContentType,
  type User,
} from '@editorial-tracker/shared';
import { api } from '../lib/api.js';
import { useContentItem, useHistory, useSetStatus, useUpdateItem } from '../lib/queries.js';
import { allowedNextStatuses, formatDate, isOverdue, userName } from '../lib/format.js';
import { StatusBadge } from '../components/StatusBadge.js';

/**
 * One content item: its details, the actions it currently allows, and its
 * history.
 *
 * Which actions appear comes from the backend's state machine, so the buttons
 * can never offer a move the API would reject.
 */
export function ContentView() {
  const { id = '' } = useParams();
  const { data: item, isLoading, error } = useContentItem(id);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api
      .users()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  if (isLoading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error.message}</p>;
  if (!item) return null;

  return (
    <div className="content-view">
      <Link to="/" className="back">
        ← Back to dashboard
      </Link>

      <article className="card">
        <header className="item-header">
          <h1>{item.title}</h1>
          <StatusBadge status={item.status} />
        </header>

        <Details item={item} users={users} />
        <Actions item={item} />
        <EditForm item={item} />
      </article>

      <History id={id} users={users} />
    </div>
  );
}

function Details({ item, users }: { item: ContentItem; users: User[] }) {
  return (
    <dl className="details">
      <div>
        <dt>Type</dt>
        <dd>{item.type}</dd>
      </div>
      <div>
        <dt>Deadline</dt>
        <dd className={isOverdue(item) ? 'overdue' : undefined}>{formatDate(item.deadline)}</dd>
      </div>
      <div>
        <dt>Created by</dt>
        <dd>
          {userName(users, item.createdBy)} on {formatDate(item.createdAt)}
        </dd>
      </div>
      <div>
        <dt>Last updated by</dt>
        <dd>
          {userName(users, item.updatedBy)} on {formatDate(item.updatedAt)}
        </dd>
      </div>
      {item.publishedAt && (
        <div>
          <dt>Published by</dt>
          <dd>
            {userName(users, item.publishedBy)} on {formatDate(item.publishedAt)}
          </dd>
        </div>
      )}
      {item.archivedAt && (
        <div>
          <dt>Archived by</dt>
          <dd>
            {userName(users, item.archivedBy)} on {formatDate(item.archivedAt)}
          </dd>
        </div>
      )}
    </dl>
  );
}

/** Publish, archive and every other status move the item currently allows. */
function Actions({ item }: { item: ContentItem }) {
  const setStatus = useSetStatus(item.id);
  const next = allowedNextStatuses(item.status);

  // No status is terminal today, but the table in `status.ts` is meant to be
  // edited, so a status with nowhere to go still renders sensibly.
  if (next.length === 0) return null;

  return (
    <section className="actions">
      <h2>Move to</h2>

      <div className="row">
        {next.map((status) => (
          <button
            key={status}
            type="button"
            className={status === 'published' ? 'primary' : undefined}
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate(status)}
          >
            {label(item.status, status)}
          </button>
        ))}
      </div>

      {setStatus.isError && <p className="error">{setStatus.error.message}</p>}
    </section>
  );
}

/** Button wording. Restoring an archived item is not the same act as publishing. */
function label(from: ContentStatus, to: ContentStatus): string {
  if (from === 'archived') return to === 'published' ? 'Restore' : 'Send back to draft';
  if (to === 'published') return 'Publish';
  if (to === 'archived') return 'Archive';
  return `Move to ${to}`;
}

function EditForm({ item }: { item: ContentItem }) {
  const update = useUpdateItem(item.id);

  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState<ContentType>(item.type);
  const [deadline, setDeadline] = useState(item.deadline?.slice(0, 10) ?? '');

  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      title,
      type,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
  }

  return (
    <form className="edit" onSubmit={submit}>
      <h2>Edit</h2>

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <div className="row">
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as ContentType)}>
            {CONTENT_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Deadline
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
      </div>

      {update.isError && <p className="error">{update.error.message}</p>}
      {update.isSuccess && <p className="success">Saved.</p>}

      <button type="submit" disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function History({ id, users }: { id: string; users: User[] }) {
  const { data: entries } = useHistory(id);
  if (!entries?.length) return null;

  return (
    <section className="card history">
      <h2>History</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <span className="badge action">{entry.action.replace('_', ' ')}</span>
            <span>{userName(users, entry.actorId)}</span>
            <span className="muted small">{formatDate(entry.at)}</span>
            {entry.changes && (
              <span className="muted small changes">
                {Object.entries(entry.changes)
                  .map(([field, { from, to }]) => `${field}: ${from} → ${to}`)
                  .join(', ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
