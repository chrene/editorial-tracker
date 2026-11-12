import type {
  AuditEntry,
  ContentItem,
  ContentStatus,
  ContentType,
  User,
} from '@editorial-tracker/shared';

/**
 * One wrapper around `fetch` for the whole app.
 *
 * Authentication is mocked: every request carries the signed-in user's id in an
 * `x-user-id` header, which is what the backend reads. The id is passed in
 * rather than read from storage here, so this file stays a plain HTTP client.
 */
async function request<T>(userId: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
      ...init.headers,
    },
  });

  if (!response.ok) {
    // The API reports failures as `{ error: "..." }`; show that to the user.
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export interface NewContentItem {
  title: string;
  type: ContentType;
  deadline: string | null;
}

export const api = {
  users: () => fetch('/api/users').then((r) => r.json() as Promise<User[]>),

  list: (userId: string) => request<ContentItem[]>(userId, '/content'),

  get: (userId: string, id: string) => request<ContentItem>(userId, `/content/${id}`),

  history: (userId: string, id: string) => request<AuditEntry[]>(userId, `/content/${id}/audit`),

  create: (userId: string, item: NewContentItem) =>
    request<ContentItem>(userId, '/content', { method: 'POST', body: JSON.stringify(item) }),

  update: (userId: string, id: string, fields: Partial<NewContentItem>) =>
    request<ContentItem>(userId, `/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }),

  setStatus: (userId: string, id: string, status: ContentStatus) =>
    request<ContentItem>(userId, `/content/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
