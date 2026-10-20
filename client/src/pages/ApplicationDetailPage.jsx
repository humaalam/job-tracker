import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import ApplicationDetails from '../components/applications/ApplicationDetails.jsx';
import ApplicationFormModal from '../components/applications/ApplicationFormModal.jsx';
import DeleteApplicationDialog from '../components/applications/DeleteApplicationDialog.jsx';
import StatusBadge from '../components/applications/StatusBadge.jsx';
import StatusTimeline from '../components/applications/StatusTimeline.jsx';
import Button from '../components/ui/Button.jsx';
import { useApplication } from '../hooks/useApplication.js';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Back to the list as it was (filters, page), or the plain list when the
  // page was opened directly (e.g. from a bookmark).
  const backTo = location.state?.backTo ?? '/applications';

  const { data: application, isPending, isError, error } = useApplication(id);
  const [dialog, setDialog] = useState(null); // null, 'edit' or 'delete'

  const backLink = (
    <Link to={backTo} className="text-sm text-blue-600 hover:underline">
      &larr; Back to applications
    </Link>
  );

  if (isPending) {
    return <p className="text-slate-500">Loading application…</p>;
  }

  if (isError) {
    return (
      <section>
        {backLink}
        <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {/* e.g. 404 "Application not found": it doesn't exist, or it belongs to someone else */}
          {error.message}
        </p>
      </section>
    );
  }

  return (
    <section>
      {backLink}

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{application.company}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
            {application.roleTitle}
            <StatusBadge status={application.status} />
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setDialog('edit')}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDialog('delete')}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Details</h2>
          <ApplicationDetails application={application} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Status history</h2>
          <StatusTimeline statusChanges={application.statusChanges} />
        </div>
      </div>

      {dialog === 'edit' && (
        <ApplicationFormModal application={application} onClose={() => setDialog(null)} />
      )}
      {dialog === 'delete' && (
        <DeleteApplicationDialog
          application={application}
          onClose={() => setDialog(null)}
          // replace: Back must not return to the page of a deleted application.
          onDeleted={() => navigate(backTo, { replace: true })}
        />
      )}
    </section>
  );
}
