import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CONTENT_STATUSES,
  type ContentItem,
  type ContentStatus,
  type User,
} from '@editorial-tracker/shared';
import { useCurrentUser } from '../lib/auth.js';
import { useContentItems, useUsers } from '../lib/queries.js';
import { formatDate, isOverdue, userName } from '../lib/format.js';
import { NewItemForm } from '../components/NewItemForm.js';
import { StatusBadge } from '../components/StatusBadge.js';

type Filter = ContentStatus | 'all';

export function Dashboard() {
  const user = useCurrentUser();
  const { data: items, isLoading, error } = useContentItems();
  const [filter, setFilter] = useState<Filter>('all');

  const { data: users = [] } = useUsers();

  return (
    <div className="dashboard">
      <section>
        <header className="section-header">
          <h2>Content</h2>
          <p className="muted small">
            {user.role === 'editor'
              ? 'You can manage every item.'
              : 'You can manage the items you created.'}
          </p>
        </header>

        <StatusFilter items={items ?? []} active={filter} onChange={setFilter} />

        {isLoading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error.message}</p>}

        {items && <GroupedList items={items} filter={filter} users={users} />}
      </section>

      <aside>
        <NewItemForm />
      </aside>
    </div>
  );
}

function StatusFilter({
  items,
  active,
  onChange,
}: {
  items: ContentItem[];
  active: Filter;
  onChange: (next: Filter) => void;
}) {
  const options: Filter[] = ['all', ...CONTENT_STATUSES];

  const countOf = (filter: Filter) =>
    filter === 'all' ? items.length : items.filter((i) => i.status === filter).length;

  return (
    <div className="filters">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={option === active ? 'filter active' : 'filter'}
          onClick={() => onChange(option)}
        >
          {option} <span className="count">{countOf(option)}</span>
        </button>
      ))}
    </div>
  );
}

function GroupedList({
  items,
  filter,
  users,
}: {
  items: ContentItem[];
  filter: Filter;
  users: User[];
}) {
  const groups = CONTENT_STATUSES.filter((status) => filter === 'all' || status === filter).map(
    (status) => ({ status, items: items.filter((item) => item.status === status) }),
  );

  const visible = groups.filter((group) => group.items.length > 0);

  if (visible.length === 0) {
    return <p className="muted">No content items here yet.</p>;
  }

  return (
    <>
      {visible.map((group) => (
        <section key={group.status} className="status-group">
          <h3>
            <StatusBadge status={group.status} />
            <span className="count">{group.items.length}</span>
          </h3>

          <ul className="item-list">
            {group.items.map((item) => (
              <ItemRow key={item.id} item={item} users={users} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function ItemRow({ item, users }: { item: ContentItem; users: User[] }) {
  return (
    <li className="item-row">
      <Link to={`/content/${item.id}`} className="item-title">
        {item.title}
      </Link>

      <span className="badge type">{item.type}</span>

      <span className="muted small">Created by {userName(users, item.createdBy)}</span>

      <span className={isOverdue(item) ? 'deadline overdue' : 'deadline'}>
        {item.deadline ? `Due ${formatDate(item.deadline)}` : 'No deadline'}
      </span>
    </li>
  );
}
