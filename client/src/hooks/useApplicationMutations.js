import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  changeApplicationStatus,
  createApplication,
  deleteApplication,
  updateApplication,
} from '../api/applications.js';

const CHANGE_STATUS_KEY = ['applications', 'changeStatus'];

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

// Optimistic update: the card moves to its new column at once, before the
// server answers. If the request fails, the lists go back to how they were.
export function useChangeApplicationStatus() {
  const queryClient = useQueryClient();
  const lists = { queryKey: ['applications', 'list'] };

  return useMutation({
    mutationKey: CHANGE_STATUS_KEY,
    mutationFn: ({ id, status }) => changeApplicationStatus(id, status),

    onMutate: async ({ id, status }) => {
      // Stop list requests that are still running, so their (older) answer
      // can't overwrite the change we are about to make.
      await queryClient.cancelQueries(lists);
      // Snapshot of every cached list, to roll back on error.
      const previousLists = queryClient.getQueriesData(lists);
      queryClient.setQueriesData(lists, (old) =>
        old && {
          ...old,
          applications: old.applications.map((application) =>
            application.id === id ? { ...application, status } : application,
          ),
        },
      );
      // Whatever we return here is passed to onError as `context`.
      return { previousLists };
    },

    onError: (_error, _variables, context) => {
      for (const [queryKey, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
    },

    // Success or not, fetch the real data (new sort order, the detail page's
    // timeline). Skip it while another move is still on its way: that refetch
    // could bring back the old status of that card and make it jump back.
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: CHANGE_STATUS_KEY }) === 1) {
        return queryClient.invalidateQueries({ queryKey: ['applications'] });
      }
    },
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
