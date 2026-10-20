import {
  formatDateTime,
  INTERVIEW_OUTCOME_LABELS,
  INTERVIEW_TYPE_LABELS,
  isWebUrl,
} from '../../lib/format.js';
import LinkButton from '../ui/LinkButton.jsx';

// Written out in full (not built from pieces) so Tailwind can find the class names.
const OUTCOME_COLORS = {
  PENDING: 'bg-slate-100 text-slate-700',
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-zinc-200 text-zinc-700',
};

function OutcomeBadge({ outcome }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${OUTCOME_COLORS[outcome]}`}
    >
      {INTERVIEW_OUTCOME_LABELS[outcome]}
    </span>
  );
}

// The application's interviews, soonest first (the API's order).
export default function InterviewList({ interviews, onEdit, onDelete }) {
  if (interviews.length === 0) {
    return <p className="text-sm text-slate-500">No interviews yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200">
      {interviews.map((interview) => (
        <li key={interview.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                {INTERVIEW_TYPE_LABELS[interview.type]}
                <OutcomeBadge outcome={interview.outcome} />
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <time dateTime={interview.scheduledAt}>
                  {formatDateTime(interview.scheduledAt)}
                </time>
                {interview.durationMinutes != null && ` · ${interview.durationMinutes} min`}
              </p>
            </div>
            <div className="flex gap-3">
              <LinkButton className="text-blue-600" onClick={() => onEdit(interview)}>
                Edit
              </LinkButton>
              <LinkButton className="text-red-600" onClick={() => onDelete(interview)}>
                Delete
              </LinkButton>
            </div>
          </div>

          {interview.locationOrLink && (
            <p className="mt-2 break-words text-sm text-slate-700">
              {/* Same rule as the job URL: only http(s) becomes a link. */}
              {isWebUrl(interview.locationOrLink) ? (
                <a
                  href={interview.locationOrLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {interview.locationOrLink}
                </a>
              ) : (
                interview.locationOrLink
              )}
            </p>
          )}
          {interview.interviewers && (
            <p className="mt-1 text-sm text-slate-700">With {interview.interviewers}</p>
          )}
          {interview.notes && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{interview.notes}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
