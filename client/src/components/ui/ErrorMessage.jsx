// The red error box used everywhere. role="alert" makes screen readers read
// it out as soon as it appears. With `onRetry`, a "Try again" button is added
// (for failed page loads; forms don't need it, the user just submits again).
export default function ErrorMessage({ children, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
    >
      <p>{children}</p>
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className="font-medium text-red-800 underline hover:no-underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
