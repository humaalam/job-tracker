import { Link } from 'react-router';
import { STATUSES } from '../../lib/applicationFilters.js';
import StatusBadge from '../applications/StatusBadge.jsx';

// How many applications are in each status. Every row links to the
// applications list filtered by that status.
export default function StatusCounts({ countsByStatus }) {
  return (
    <ul className="divide-y divide-slate-200">
      {STATUSES.map((status) => (
        <li key={status}>
          <Link
            to={`/applications?status=${status}`}
            className="-mx-2 flex items-center justify-between rounded-md px-2 py-2 hover:bg-slate-50"
          >
            <StatusBadge status={status} />
            <span className="text-sm font-semibold text-slate-900">{countsByStatus[status]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
