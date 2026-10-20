import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInterview, deleteInterview, updateInterview } from '../api/interviews.js';

// The interviews are shown from the application's detail query, so after a
// change that one query is refetched. The lists don't show interviews.
// Returning the promise keeps the mutation "pending" until that refetch is done.
function useInvalidateApplication(applicationId) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['applications', 'detail', applicationId] });
}

export function useCreateInterview(applicationId) {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: (data) => createInterview(applicationId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateInterview(applicationId) {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: ({ id, data }) => updateInterview(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteInterview(applicationId) {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({ mutationFn: deleteInterview, onSuccess: invalidate });
}
