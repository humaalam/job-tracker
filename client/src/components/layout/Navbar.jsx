import { Link, NavLink } from 'react-router';

function navLinkClass({ isActive }) {
  const base = 'rounded-md px-3 py-2 text-sm font-medium';
  return isActive
    ? `${base} bg-slate-900 text-white`
    : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
}

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 text-lg font-bold">
          Job Tracker
        </Link>
        <NavLink to="/" end className={navLinkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/applications" className={navLinkClass}>
          Applications
        </NavLink>
        {/* Replaced by the user's name and a logout button in Step 4 */}
        <Link to="/login" className="ml-auto text-sm text-slate-600 hover:text-slate-900">
          Log in
        </Link>
      </nav>
    </header>
  );
}
