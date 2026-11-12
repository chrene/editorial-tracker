import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ContentStatus } from '@editorial-tracker/shared';
import { useCurrentUser } from './auth.js';
import { api, type NewContentItem } from './api.js';

/**
 * Every content query and mutation. Mutations invalidate the queries they
 * affect, so publishing an item refreshes the dashboard and the item view on
 * their own — no screen has to remember to refetch.
 *
 * Every key starts with the user id. Two users never see the same cache entry,
 * because the API returns a different list to each of them: an editor sees all
 * items, a contributor only their own. Without the id, signing in as someone
 * else would show the previous user's list until something forced a refetch.
 */
/**
 * The demo user roster. Public, unchanging for the life of the session, and
 * needed by all three screens — so it is fetched once and shared rather than
 * re-fetched in each one.
 */
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: api.users,
    staleTime: Infinity,
  });
}

const keys = {
  all: (userId: string) => ['content', userId] as const,
  item: (userId: string, id: string) => ['content', userId, id] as const,
  history: (userId: string, id: string) => ['content', userId, id, 'audit'] as const,
};

export function useContentItems() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: keys.all(user.id),
    queryFn: () => api.list(user.id),
  });
}

export function useContentItem(id: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: keys.item(user.id, id),
    queryFn: () => api.get(user.id, id),
  });
}

export function useHistory(id: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: keys.history(user.id, id),
    queryFn: () => api.history(user.id, id),
  });
}

export function useCreateItem() {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (item: NewContentItem) => api.create(user.id, item),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.all(user.id) }),
  });
}

export function useUpdateItem(id: string) {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (fields: Partial<NewContentItem>) => api.update(user.id, id, fields),
    onSuccess: () => invalidateItem(client, user.id, id),
  });
}

export function useSetStatus(id: string) {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: (status: ContentStatus) => api.setStatus(user.id, id, status),
    onSuccess: () => invalidateItem(client, user.id, id),
  });
}

/** After a write: the item, its history, and the dashboard list are all stale. */
function invalidateItem(client: QueryClient, userId: string, id: string) {
  client.invalidateQueries({ queryKey: keys.item(userId, id) });
  client.invalidateQueries({ queryKey: keys.history(userId, id) });
  client.invalidateQueries({ queryKey: keys.all(userId) });
}
