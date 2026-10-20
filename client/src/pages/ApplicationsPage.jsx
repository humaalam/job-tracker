import { useState } from 'react';
import { useSearchParams } from 'react-router';
import ApplicationFormModal from '../components/applications/ApplicationFormModal.jsx';
import ApplicationsTable from '../components/applications/ApplicationsTable.jsx';
import DeleteApplicationDialog from '../components/applications/DeleteApplicationDialog.jsx';
import FilterBar from '../components/applications/FilterBar.jsx';
import KanbanBoard from '../components/applications/KanbanBoard.jsx';
import ViewToggle from '../components/applications/ViewToggle.jsx';
import { exportCsvUrl } from '../api/applications.js';
import Button from '../components/ui/Button.jsx';
import { buttonClass } from '../components/ui/buttonClass.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ui/ErrorMessage.jsx';
import LoadingMessage from '../components/ui/LoadingMessage.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useApplications } from '../hooks/useApplications.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import {
  applyFilterChanges,
  filtersFromSearchParams,
  hasActiveFilters,
  STATUSES,
  viewFromSearchParams,
} from '../lib/applicationFilters.js';

// The board has no pages, so it asks for as many cards as the API allows at once.
const BOARD_LIMIT = 100;

export default function ApplicationsPage() {
  // Page and filters live in the URL (?page=2&status=APPLIED), so refresh,
  // shared links and the Back button keep them.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
  const filters = filtersFromSearchParams(searchParams);
  const view = viewFromSearchParams(searchParams);

  // Which dialog is open: `editing` is 'new' or the application being edited,
  // `deleting` is the application to delete. null = closed.
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // The search box updates the URL on every keystroke, but we ask the API
  // only once typing pauses for 300 ms.
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);

  // Shared by the list and the CSV export, so the file has exactly what's shown.
  const filterParams = {
    status: filters.status.join(','),
    workMode: filters.workMode.join(','),
    search: debouncedSearch,
    sort: filters.sort,
    order: filters.order,
  };

  const { data, isPending, isError, error, isPlaceholderData, refetch } = useApplications({
    ...(view === 'board' ? { limit: BOARD_LIMIT } : { page }),
    ...filterParams,
  });

  function goToPage(nextPage) {
    // Change only `page` and keep the filters.
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', nextPage);
      return next;
    });
  }

  function changeView(nextView) {
    // Keep the filters, drop `page` (the board has none) and the default view.
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('page');
      if (nextView === 'board') next.set('view', 'board');
      else next.delete('view');
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
      {/* flex-wrap: on narrow screens the buttons move below the title instead of overflowing */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Applications</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle view={view} onChange={changeView} />
          {/* A plain link: the server sends the file as a download (Content-Disposition),
              so the browser saves it instead of leaving the page. */}
          <a href={exportCsvUrl(filterParams)} download className={buttonClass('secondary')}>
            Export CSV
          </a>
          <Button onClick={() => setEditing('new')}>New application</Button>
        </div>
      </div>

      {/* Rendered only while open; a fresh mount also means a fresh, empty form */}
      {editing && (
        <ApplicationFormModal
          application={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteApplicationDialog application={deleting} onClose={() => setDeleting(null)} />
      )}

      <div className="mt-6">
        <FilterBar filters={filters} onChange={changeFilters} />
      </div>

      <div className="mt-6 space-y-4">
        {isPending && <LoadingMessage>Loading applications…</LoadingMessage>}

        {/* If a refresh fails, the results we already have stay visible below it. */}
        {isError && <ErrorMessage onRetry={refetch}>{error.message}</ErrorMessage>}

        {/* Nothing at all (either view): explain why, and offer the next step. */}
        {data &&
          data.pagination.total === 0 &&
          (hasActiveFilters(filters) ? (
            <EmptyState
              title="No applications match these filters"
              action={
                <Button
                  variant="secondary"
                  onClick={() => changeFilters({ status: [], workMode: [], search: '' })}
                >
                  Clear filters
                </Button>
              }
            >
              Try another search, or fewer status and work mode filters.
            </EmptyState>
          ) : (
            <EmptyState
              title="No applications yet"
              action={<Button onClick={() => setEditing('new')}>Add your first application</Button>}
            >
              Add the jobs you are interested in or have applied to, then follow each one from
              wishlist to offer.
            </EmptyState>
          ))}

        {view === 'board' && data && data.pagination.total > 0 && (
          <div className={isPlaceholderData ? 'opacity-60' : undefined}>
            {data.pagination.total > data.applications.length && (
              <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Showing {data.applications.length} of {data.pagination.total} applications. Use the
                filters to narrow the board down.
              </p>
            )}
            {/* A status filter shows only those columns (still in pipeline order); no filter shows all */}
            <KanbanBoard
              statuses={
                filters.status.length > 0
                  ? STATUSES.filter((status) => filters.status.includes(status))
                  : STATUSES
              }
              applications={data.applications}
            />
          </div>
        )}

        {/* E.g. ?page=9 from an old link, or the last item on the last page was deleted */}
        {view === 'table' &&
          data &&
          data.pagination.total > 0 &&
          data.applications.length === 0 && (
            <EmptyState
              title="There is nothing on this page"
              action={
                <Button variant="secondary" onClick={() => goToPage(1)}>
                  Go to page 1
                </Button>
              }
            />
          )}

        {view === 'table' && data && data.applications.length > 0 && (
          // Faded while new results load (the previous ones stay visible meanwhile).
          <div className={isPlaceholderData ? 'opacity-60' : undefined}>
            <ApplicationsTable
              applications={data.applications}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
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
