const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

// The button look as class names, also for links that should look like a
// button (e.g. the CSV download, which must be an <a> to download a file).
// Its own file (not Button.jsx), because Vite's fast refresh only works for
// files that export components and nothing else.
export function buttonClass(variant = 'primary', className = '') {
  return `inline-block rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`;
}
