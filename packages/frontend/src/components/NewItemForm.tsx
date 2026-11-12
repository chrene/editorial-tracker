import { useState, type FormEvent } from 'react';
import { CONTENT_TYPES, type ContentType } from '@editorial-tracker/shared';
import { useCurrentUser } from '../lib/auth.js';
import { useCreateItem } from '../lib/queries.js';
import { AuthorPicker } from './AuthorPicker.js';

export function NewItemForm() {
  const user = useCurrentUser();
  const create = useCreateItem();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('article');
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();

    create.mutate(
      { title, type, authorIds, deadline: deadline ? new Date(deadline).toISOString() : null },
      {
        onSuccess: () => {
          setTitle('');
          setDeadline('');
          setAuthorIds([]);
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

      <AuthorPicker selected={authorIds} onChange={setAuthorIds} excludeUserId={user.id} />

      {create.isError && <p className="error">{create.error.message}</p>}

      <button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Creating…' : 'Create item'}
      </button>
    </form>
  );
}
