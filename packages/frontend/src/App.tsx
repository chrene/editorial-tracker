import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { ContentView } from './pages/ContentView.js';
import type { ReactNode } from 'react';

/**
 * Two routes behind a sign-in, one in front of it. `RequireAuth` is the only
 * gate, so no screen has to check for a missing user.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Shell>
              <Dashboard />
            </Shell>
          </RequireAuth>
        }
      />
      <Route
        path="/content/:id"
        element={
          <RequireAuth>
            <Shell>
              <ContentView />
            </Shell>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

/** The signed-in frame: who you are, and a way out. */
function Shell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="topbar">
        <strong>Editorial Tracker</strong>
        <div className="who">
          <span>{user?.name}</span>
          <span className={`badge role-${user?.role}`}>{user?.role}</span>
          <button type="button" className="link" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="page">{children}</main>
    </>
  );
}
