// A small spinning circle and a text such as "Loading dashboard…".
// role="status" lets screen readers announce it without interrupting.
export default function LoadingMessage({ children = 'Loading…' }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-slate-500">
      {/* A circle with one colored side, turned by animate-spin; motion-reduce stops it */}
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 motion-reduce:animate-none"
      />
      {children}
    </p>
  );
}
