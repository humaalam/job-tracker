import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listApplications } from '../api/applications.js';

export function useApplications(params) {
  return useQuery({
    // params are part of the key, so every page (and later every filter) is cached separately.
    queryKey: ['applications', 'list', params],
    queryFn: ({ signal }) => listApplications(params, { signal }),
    // While the next page loads, keep showing the current one instead of a blank table.
    placeholderData: keepPreviousData,
  });
}
