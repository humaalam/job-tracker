// Shown instead of an empty table or page: says why it's empty and, through
// `action` (e.g. a button), what to do next.
export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children && <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
