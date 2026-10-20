import Button from './Button.jsx';

// "Showing 21–40 of 45" with Previous / Next buttons. `pagination` is the
// object the list API returns: { page, limit, total, totalPages }.
export default function Pagination({ pagination, onPageChange, disabled }) {
  const { page, limit, total, totalPages } = pagination;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <p>
        Showing {first}–{last} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
