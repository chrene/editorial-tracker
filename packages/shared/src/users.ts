import type { User } from './types.js';

/**
 * Mock authentication: the whole user base, hardcoded. There is no signup,
 * password or session — a request names its user with the `x-user-id` header
 * and the backend looks it up here. Seeded into the `users` table so audit
 * rows and author lists can carry real foreign keys.
 */
export const USERS: readonly User[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Edith Ortega',
    email: 'edith@example.com',
    role: 'editor',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Carl Nguyen',
    email: 'carl@example.com',
    role: 'contributor',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Priya Raman',
    email: 'priya@example.com',
    role: 'contributor',
  },
];

export function findUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}
