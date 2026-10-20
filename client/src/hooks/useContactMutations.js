import { useMutation } from '@tanstack/react-query';
import { createContact, deleteContact, updateContact } from '../api/contacts.js';
import { useInvalidateApplication } from './useInvalidateApplication.js';

export function useCreateContact(applicationId) {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: (data) => createContact(applicationId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateContact(applicationId) {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({
    mutationFn: ({ id, data }) => updateContact(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteContact(applicationId) {
  const invalidate = useInvalidateApplication(applicationId);
  return useMutation({ mutationFn: deleteContact, onSuccess: invalidate });
}
