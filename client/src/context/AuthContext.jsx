import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth.js';
import { meQueryKey } from '../lib/queryClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  // Ask the server who is logged in (the cookie is sent automatically).
  // We update this cache entry ourselves on login/logout, so it never goes stale.
  const meQuery = useQuery({
    queryKey: meQueryKey,
    queryFn: ({ signal }) => authApi.getMe({ signal }),
    staleTime: Infinity,
  });

  // Switch to a new user (or to nobody): drop everything cached for the
  // previous user, so their data can never show up for the next one.
  function setSession(user) {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== meQueryKey[0] });
    queryClient.setQueryData(meQueryKey, user);
  }

  const value = {
    user: meQuery.data ?? null,
    isLoading: meQuery.isPending,
    error: meQuery.error,
    retry: meQuery.refetch,
    login: async (credentials) => setSession(await authApi.login(credentials)),
    register: async (details) => setSession(await authApi.register(details)),
    logout: async () => {
      await authApi.logout();
      setSession(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook lives next to its provider on purpose (the usual React pattern).
// The only cost: editing this file reloads the page instead of fast-refreshing it.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
