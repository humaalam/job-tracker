import { Link } from 'react-router';
import { formatDateTime, INTERVIEW_TYPE_LABELS } from '../../lib/format.js';

// Interviews in the next 7 days, soonest first (the API's order), each with
// a link to its application. Cancelled ones are already left out by the API.
export default function UpcomingInterviews({ interviews }) {
  if (interviews.length === 0) {
    return <p className="text-sm text-slate-500">No interviews in the next 7 days.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200">
      {interviews.map((interview) => (
        <li key={interview.id} className="py-3 first:pt-0 last:pb-0">
          <time dateTime={interview.scheduledAt} className="text-sm font-medium text-slate-900">
            {formatDateTime(interview.scheduledAt)}
          </time>
          <p className="mt-0.5 text-sm text-slate-600">
            {INTERVIEW_TYPE_LABELS[interview.type]} ·{' '}
            <Link
              to={`/applications/${interview.application.id}`}
              className="text-blue-600 hover:underline"
            >
              {interview.application.company}: {interview.application.roleTitle}
            </Link>
          </p>
        </li>
      ))}
    </ul>
  );
}
