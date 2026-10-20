import { Link } from 'react-router';
import { formatDate, formatSalary, WORK_MODE_LABELS } from '../../lib/format.js';
import StatusBadge from './StatusBadge.jsx';

const COLUMNS = ['Company', 'Role', 'Status', 'Location', 'Salary', 'Applied', 'Updated'];

export default function ApplicationsTable({ applications }) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((application) => (
            <tr key={application.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium">
                <Link to={`/applications/${application.id}`} className="text-blue-600 hover:underline">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
