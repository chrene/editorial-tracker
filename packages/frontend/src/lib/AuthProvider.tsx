import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@editorial-tracker/shared';
import { AuthContext, readStoredUser, STORAGE_KEY } from './auth.js';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const queryClient = useQueryClient();

  function signIn(next: User) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }

  function signOut() {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);

    // Drop every cached response. The query keys are already scoped per user,
    // so this is not what makes the next sign-in correct — it stops one user's
    // content from sitting in memory after they have left.
    queryClient.clear();
  }

  return <AuthContext value={{ user, signIn, signOut }}>{children}</AuthContext>;
}
