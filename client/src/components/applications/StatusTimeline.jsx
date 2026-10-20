import { formatDateTime, STATUS_LABELS } from '../../lib/format.js';
import StatusBadge from './StatusBadge.jsx';

// The status history as a vertical timeline, oldest first (the API's order).
export default function StatusTimeline({ statusChanges }) {
  if (statusChanges.length === 0) {
    return <p className="text-sm text-slate-500">No status history yet.</p>;
  }

  return (
    // <ol>: an ordered list, because the order of the steps matters.
    // The left border is the line; each item's dot sits on top of it.
    <ol className="ml-2 border-l-2 border-slate-200">
      {statusChanges.map((change) => (
        <li key={change.id} className="relative pb-6 pl-6 last:pb-0">
          <span
            aria-hidden="true"
            className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-400"
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={change.toStatus} />
            <span className="text-sm text-slate-600">
              {change.fromStatus
                ? `from ${STATUS_LABELS[change.fromStatus]}`
                : 'when the application was added'}
            </span>
          </div>
          <time dateTime={change.changedAt} className="mt-1 block text-xs text-slate-500">
            {formatDateTime(change.changedAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}
