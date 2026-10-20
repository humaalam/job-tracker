import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import ApplicationDetails from '../components/applications/ApplicationDetails.jsx';
import ApplicationFormModal from '../components/applications/ApplicationFormModal.jsx';
import DeleteApplicationDialog from '../components/applications/DeleteApplicationDialog.jsx';
import StatusBadge from '../components/applications/StatusBadge.jsx';
import StatusTimeline from '../components/applications/StatusTimeline.jsx';
import ContactsSection from '../components/contacts/ContactsSection.jsx';
import InterviewsSection from '../components/interviews/InterviewsSection.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ui/ErrorMessage.jsx';
import LoadingMessage from '../components/ui/LoadingMessage.jsx';
import { useApplication } from '../hooks/useApplication.js';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Back to the list as it was (filters, page), or the plain list when the
  // page was opened directly (e.g. from a bookmark).
  const backTo = location.state?.backTo ?? '/applications';

  const { data: application, isPending, isError, error, refetch } = useApplication(id);
  const [dialog, setDialog] = useState(null); // null, 'edit' or 'delete'

  const backLink = (
    <Link to={backTo} className="text-sm text-blue-600 hover:underline">
      &larr; Back to applications
    </Link>
  );

  if (isPending) {
    return (
      <section className="space-y-4">
        {backLink}
        <LoadingMessage>Loading application…</LoadingMessage>
      </section>
    );
  }

  if (isError && !application) {
    return (
      <section className="space-y-4">
        {backLink}
        {/* 404: it doesn't exist, or it belongs to someone else. Asking again won't help. */}
        {error.status === 404 ? (
          <EmptyState title="Application not found">
            It may have been deleted, or the link is wrong.
          </EmptyState>
        ) : (
          <ErrorMessage onRetry={refetch}>{error.message}</ErrorMessage>
        )}
      </section>
    );
  }

  return (
    <section>
      {backLink}

      {/* A later refresh failed: keep showing what we have, with the error above it. */}
      {isError && (
        <ErrorMessage onRetry={refetch} className="mt-4">
          Couldn&apos;t refresh this application: {error.message}
        </ErrorMessage>
      )}

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

      {/* items-start: each column is only as tall as its own cards */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Details</h2>
            <ApplicationDetails application={application} />
          </div>
          <InterviewsSection application={application} />
        </div>
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">Status history</h2>
            <StatusTimeline statusChanges={application.statusChanges} />
          </div>
          <ContactsSection application={application} />
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
