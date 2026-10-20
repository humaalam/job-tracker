import { useMutation } from '@tanstack/react-query';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';

function navLinkClass({ isActive }) {
  const base = 'rounded-md px-3 py-2 text-sm font-medium';
  return isActive
    ? `${base} bg-slate-900 text-white`
    : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  // No navigate() here: once the user is null, ProtectedRoute redirects to /login.
  const logoutMutation = useMutation({ mutationFn: logout });

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

        <div className="ml-auto flex items-center gap-3 text-sm">
          {logoutMutation.isError && <span className="text-red-600">Logout failed</span>}
          <span className="text-slate-600">{user.name}</span>
          <button
            type="button"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
}
