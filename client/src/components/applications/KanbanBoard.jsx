import { STATUS_LABELS } from '../../lib/format.js';
import ApplicationCard from './ApplicationCard.jsx';

// One column per status, e.g. "Applied (3)" with its cards underneath.
function KanbanColumn({ status, applications }) {
  const headingId = `kanban-column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-64 shrink-0 flex-col rounded-lg bg-slate-100 p-2"
    >
      <h2 id={headingId} className="px-1 pb-2 text-sm font-semibold text-slate-700">
        {STATUS_LABELS[status]}{' '}
        <span className="font-normal text-slate-500">({applications.length})</span>
      </h2>
      <ul className="flex flex-1 flex-col gap-2">
        {applications.map((application) => (
          <li key={application.id}>
            <ApplicationCard application={application} />
          </li>
        ))}
      </ul>
      {applications.length === 0 && (
        <p className="px-1 py-4 text-center text-xs text-slate-400">No applications</p>
      )}
    </section>
  );
}

// `statuses` = which columns to show, in order. `applications` arrive already
// sorted by the API; grouping keeps that order inside each column.
export default function KanbanBoard({ statuses, applications }) {
  const byStatus = Object.groupBy(applications, (application) => application.status);

  return (
    // Six columns don't fit on small screens, so the board scrolls sideways.
    <div className="flex gap-3 overflow-x-auto pb-2">
      {statuses.map((status) => (
        <KanbanColumn key={status} status={status} applications={byStatus[status] ?? []} />
      ))}
    </div>
  );
}
