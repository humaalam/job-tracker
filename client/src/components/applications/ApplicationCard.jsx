import { Link, useLocation } from 'react-router';
import { formatDate, formatSalary, WORK_MODE_LABELS } from '../../lib/format.js';

// One application on the Kanban board. The status isn't shown: the column says it.
// `handle` is the drag handle (shown top right); `className` adds styles while dragging.
export default function ApplicationCard({ application, handle, className = '' }) {
  const location = useLocation();
  const place = [application.location, WORK_MODE_LABELS[application.workMode]]
    .filter(Boolean)
    .join(' · ');
  const salary = formatSalary(application);

  return (
    <article
      className={`flex gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm ${className}`}
    >
      {/* min-w-0 lets long names wrap instead of pushing the handle out of the card */}
      <div className="min-w-0 flex-1">
        {/* Same back link trick as the table: the detail page returns to this board view */}
        <Link
          to={`/applications/${application.id}`}
          state={{ backTo: `${location.pathname}${location.search}` }}
          className="font-medium text-blue-600 hover:underline"
        >
          {application.company}
        </Link>
        <p className="mt-0.5 text-slate-700">{application.roleTitle}</p>
        {place && <p className="mt-1 text-xs text-slate-500">{place}</p>}
        {salary !== '—' && <p className="mt-1 text-xs text-slate-500">{salary}</p>}
        <p className="mt-2 text-xs text-slate-400">Updated {formatDate(application.updatedAt)}</p>
      </div>
      {handle}
    </article>
  );
}
