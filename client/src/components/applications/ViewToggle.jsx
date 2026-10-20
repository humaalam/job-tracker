const VIEWS = [
  { value: 'table', label: 'Table' },
  { value: 'board', label: 'Board' },
];

// Two buttons that work like one switch. aria-pressed marks the active view.
export default function ViewToggle({ view, onChange }) {
  return (
    <div
      role="group"
      aria-label="View"
      className="inline-flex rounded-md border border-slate-300 bg-white p-0.5"
    >
      {VIEWS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            view === value ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
