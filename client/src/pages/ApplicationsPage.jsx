import { useSearchParams } from 'react-router';
import ApplicationsTable from '../components/applications/ApplicationsTable.jsx';
import FilterBar from '../components/applications/FilterBar.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useApplications } from '../hooks/useApplications.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import {
  applyFilterChanges,
  filtersFromSearchParams,
  hasActiveFilters,
} from '../lib/applicationFilters.js';

export default function ApplicationsPage() {
  // Page and filters live in the URL (?page=2&status=APPLIED), so refresh,
  // shared links and the Back button keep them.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const filters = filtersFromSearchParams(searchParams);

  // The search box updates the URL on every keystroke, but we ask the API
  // only once typing pauses for 300 ms.
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  const { data, isPending, isError, error, isPlaceholderData } = useApplications({
    page,
    status: filters.status.join(','),
    workMode: filters.workMode.join(','),
    search: debouncedSearch,
    sort: filters.sort,
    order: filters.order,
  });

  function goToPage(nextPage) {
    // Change only `page` and keep the filters.
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', nextPage);
      return next;
    });
  }

  function changeFilters(changes) {
    // Typing replaces the current history entry, so Back doesn't step through
    // every letter. Clicking a filter adds an entry, so Back can undo it.
    const isTyping = Object.keys(changes).length === 1 && 'search' in changes;
    setSearchParams((previous) => applyFilterChanges(previous, changes), { replace: isTyping });
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Applications</h1>

      <div className="mt-6">
        <FilterBar filters={filters} onChange={changeFilters} />
      </div>

      <div className="mt-6">
        {isPending && <p className="text-slate-500">Loading applications…</p>}

        {isError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}

        {data && data.applications.length === 0 && (
          <p className="text-slate-600">
            {data.pagination.total > 0
              ? 'There is nothing on this page.'
              : hasActiveFilters(filters)
                ? 'No applications match these filters.'
                : 'No applications yet.'}
          </p>
        )}

        {data && data.applications.length > 0 && (
          // Faded while new results load (the previous ones stay visible meanwhile).
          <div className={isPlaceholderData ? 'opacity-60' : undefined}>
            <ApplicationsTable applications={data.applications} />
            <Pagination
              pagination={data.pagination}
              onPageChange={goToPage}
              disabled={isPlaceholderData}
            />
          </div>
        )}
      </div>
    </section>
  );
}
