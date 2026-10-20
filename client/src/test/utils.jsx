import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// A fresh QueryClient per test, so no cached data leaks from one test into
// the next. No retries: a failing request should fail the test at once.
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// render() with the providers the app's components expect: TanStack Query
// and a router (MemoryRouter keeps the URL in memory instead of the address bar).
export function renderWithProviders(ui, { queryClient = createTestQueryClient() } = {}) {
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}
