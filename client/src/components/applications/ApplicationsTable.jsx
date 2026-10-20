import { Link, useLocation } from 'react-router';
import { formatDate, formatSalary, WORK_MODE_LABELS } from '../../lib/format.js';
import StatusBadge from './StatusBadge.jsx';

const COLUMNS = ['Company', 'Role', 'Status', 'Location', 'Salary', 'Applied', 'Updated'];

// onEdit / onDelete are called with the application of the clicked row.
export default function ApplicationsTable({ applications, onEdit, onDelete }) {
  const location = useLocation();

  return (
    // On narrow screens the table scrolls sideways instead of squashing the columns.
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700"
              >
                {column}
              </th>
            ))}
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((application) => (
            <tr key={application.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium">
                {/* state: remember the filtered list URL, so the detail page can link back to it */}
                <Link
                  to={`/applications/${application.id}`}
                  state={{ backTo: `${location.pathname}${location.search}` }}
                  className="text-blue-600 hover:underline"
                >
                  {application.company}
                </Link>
              </td>
              <td className="px-4 py-3">{application.roleTitle}</td>
              <td className="px-4 py-3">
                <StatusBadge status={application.status} />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {[application.location, WORK_MODE_LABELS[application.workMode]]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatSalary(application)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(application.appliedAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDate(application.updatedAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {/* aria-label says which row, since every row has the same button text */}
                <button
                  type="button"
                  onClick={() => onEdit(application)}
                  aria-label={`Edit ${application.company}`}
                  className="font-medium text-slate-600 hover:text-slate-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(application)}
                  aria-label={`Delete ${application.company}`}
                  className="ml-3 font-medium text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
