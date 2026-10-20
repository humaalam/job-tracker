import { useMutation } from '@tanstack/react-query';
import { createInterview, deleteInterview, updateInterview } from '../api/interviews.js';
import { useInvalidateApplication } from './useInvalidateApplication.js';

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
