import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createApplication,
  deleteApplication,
  updateApplication,
} from '../api/applications.js';

// After any change, mark every cached applications query (all pages and
// filters) as out of date, so what's on screen is refetched.
// Returning the promise keeps the mutation "pending" until that refetch is done.
function useInvalidateApplications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['applications'] });
}

export function useCreateApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({ mutationFn: createApplication, onSuccess: invalidate });
}

export function useUpdateApplication() {
  const invalidate = useInvalidateApplications();
  return useMutation({
    mutationFn: ({ id, data }) => updateApplication(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApplication,
    // Only the lists: refetching the deleted application's detail page would
    // just fail with a 404 while that page is still on screen.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications', 'list'] }),
  });
}
