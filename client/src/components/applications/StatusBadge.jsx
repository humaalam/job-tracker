import { STATUS_LABELS } from '../../lib/format.js';

// Written out in full (not built from pieces) so Tailwind can find the class names.
const STATUS_COLORS = {
  WISHLIST: 'bg-slate-100 text-slate-700',
  APPLIED: 'bg-blue-100 text-blue-800',
  INTERVIEWING: 'bg-amber-100 text-amber-800',
  OFFER: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-zinc-200 text-zinc-700',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
