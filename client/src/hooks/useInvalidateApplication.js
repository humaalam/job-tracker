import { useQueryClient } from '@tanstack/react-query';

// Interviews and contacts are shown from the application's detail query, so
// after a change to one of them that one query is refetched. The lists don't
// show them. Returning the promise keeps the mutation "pending" until that
// refetch is done.
export function useInvalidateApplication(applicationId) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
}
