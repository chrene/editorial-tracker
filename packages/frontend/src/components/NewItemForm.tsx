import { useState, type FormEvent } from 'react';
import { CONTENT_TYPES, type ContentType } from '@editorial-tracker/shared';
import { useCreateItem } from '../lib/queries.js';

/**
 * Creates a content item. New items always start at `idea`, so this form has no
 * status field — the dashboard and item view are where status moves happen.
 */
export function NewItemForm() {
  const create = useCreateItem();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('article');
  const [deadline, setDeadline] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();

    create.mutate(
      { title, type, deadline: deadline ? new Date(deadline).toISOString() : null },
      {
        onSuccess: () => {
          setTitle('');
          setDeadline('');
        },
      },
    );
  }

  return (
    <form className="card new-item" onSubmit={submit}>
      <h2>New content item</h2>

      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is it about?"
          required
        />
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

      {create.isError && <p className="error">{create.error.message}</p>}

      <button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Creating…' : 'Create item'}
      </button>
    </form>
  );
}
