import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client.js';

export const queryClient = new QueryClient({
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
