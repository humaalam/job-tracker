import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client.js';

// Cache key of the logged-in user (null = logged out). Used by AuthContext.
export const meQueryKey = ['auth', 'me'];

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // A 401 from any other query means the session expired: mark the user as
    // logged out, and ProtectedRoute sends them to the login page.
    onError: (error, query) => {
      if (error instanceof ApiError && error.status === 401 && query.queryKey[0] !== meQueryKey[0]) {
        queryClient.setQueryData(meQueryKey, null);
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Treat fetched data as fresh for 30 seconds: no refetch when a page remounts.
      staleTime: 30_000,
      // Retry network and server errors (up to 2 more tries), but not 4xx:
      // a 401 or 404 won't fix itself by asking again.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
