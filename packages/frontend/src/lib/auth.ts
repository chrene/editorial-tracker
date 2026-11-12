import { createContext, useContext } from 'react';
import type { User } from '@editorial-tracker/shared';

/**
 * Simulated sign-in. There is no password: picking a user on the login screen
 * stores them, and every API call is then made as that user.
 *
 * The choice is kept in `sessionStorage` so a refresh does not sign you out.
 * The provider component lives in `AuthProvider.tsx`; this file holds the
 * context and hooks so fast refresh keeps working.
 */
export const STORAGE_KEY = 'editorial-tracker:user';

export interface AuthValue {
  user: User | null;
  signIn: (user: User) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function readStoredUser(): User | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}

/** The signed-in user, for screens already behind `<RequireAuth>`. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('No signed-in user. Render this inside <RequireAuth>.');
  return user;
}
