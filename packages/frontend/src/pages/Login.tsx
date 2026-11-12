import { useNavigate } from 'react-router-dom';
import type { User } from '@editorial-tracker/shared';
import { useAuth } from '../lib/auth.js';
import { useUsers } from '../lib/queries.js';

/**
 * Simulated login. There are no passwords — the backend's user list is
 * hardcoded, so signing in means picking who you are. Each card shows the
 * role, because the role is the only thing that changes what you can do.
 */
export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const { data: users = [], isError } = useUsers();

  function choose(user: User) {
    signIn(user);
    navigate('/');
  }

  return (
    <main className="centered">
      <div className="card login">
        <h1>Editorial Tracker</h1>
        <p className="muted">Sign in as one of the demo users. No password needed.</p>

        {isError && <p className="error">Could not reach the API.</p>}

        <ul className="user-list">
          {users.map((user) => (
            <li key={user.id}>
              <button type="button" className="user-button" onClick={() => choose(user)}>
                <span className="user-name">{user.name}</span>
                <span className={`badge role-${user.role}`}>{user.role}</span>
                <span className="muted small">
                  {user.role === 'editor'
                    ? 'Manages every content item'
                    : 'Manages only their own items'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
