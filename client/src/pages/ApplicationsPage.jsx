import { useSearchParams } from 'react-router';
import ApplicationsTable from '../components/applications/ApplicationsTable.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useApplications } from '../hooks/useApplications.js';

export default function ApplicationsPage() {
  // The page number lives in the URL (?page=2), so refresh and the Back button keep it.
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);

  const { data, isPending, isError, error, isPlaceholderData } = useApplications({ page });

  function goToPage(nextPage) {
    // Change only `page` and keep any other parameters (the filters, in the next step).
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('page', nextPage);
      return next;
    });
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Applications</h1>

      <div className="mt-6">
        {isPending && <p className="text-slate-500">Loading applications…</p>}

        {isError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}

        {data && data.applications.length === 0 && (
          <p className="text-slate-600">
            {data.pagination.total === 0
              ? 'No applications yet.'
              : 'There is nothing on this page.'}
          </p>
        )}

        {data && data.applications.length > 0 && (
          // Faded while the next page loads (the previous page stays visible meanwhile).
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
