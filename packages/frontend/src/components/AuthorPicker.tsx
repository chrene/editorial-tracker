import type { User } from '@editorial-tracker/shared';
import { useUsers } from '../lib/queries.js';

export function AuthorPicker({
  selected,
  onChange,
  excludeUserId,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  excludeUserId?: string;
}) {
  const { data: users = [], isLoading } = useUsers();
  const assignable = users.filter((user: User) => user.id !== excludeUserId);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  if (isLoading) return <p className="muted small">Loading people…</p>;

  return (
    <fieldset className="authors">
      <legend>Authors</legend>
      <p className="muted small">
        Authors are credited on the item. Only its creator and editors can manage it.
      </p>

      {assignable.map((user: User) => (
        <label key={user.id} className="checkbox">
          <input
            type="checkbox"
            checked={selected.includes(user.id)}
            onChange={() => toggle(user.id)}
          />
          <span>{user.name}</span>
          <span className={`badge role-${user.role}`}>{user.role}</span>
        </label>
      ))}
    </fieldset>
  );
}
