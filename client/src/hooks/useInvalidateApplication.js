import { useQueryClient } from '@tanstack/react-query';

// Interviews and contacts are shown from the application's detail query, so
// after a change to one of them that one query is refetched. The lists don't
// show them. The dashboard lists upcoming interviews, so it is marked out of
// date too (for a contact change that costs one extra request at most).
// Returning the promise keeps the mutation "pending" until the refetch is done.
export function useInvalidateApplication(applicationId) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
}
