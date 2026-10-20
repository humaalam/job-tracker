const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

// The button look as class names, also for links that should look like a
// button (e.g. the CSV download, which must be an <a> to download a file).
export function buttonClass(variant = 'primary', className = '') {
  return `inline-block rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`;
}

export default function Button({ className = '', type = 'button', variant = 'primary', ...props }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
