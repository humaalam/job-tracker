import { useQuery } from '@tanstack/react-query';
import { getApplication } from '../api/applications.js';

// One application for the detail page. The key starts with 'applications', so
// the edit mutation's invalidation refreshes this page too.
export function useApplication(id) {
  return useQuery({
    queryKey: ['applications', 'detail', id],
    queryFn: ({ signal }) => getApplication(id, { signal }),
  });
}
