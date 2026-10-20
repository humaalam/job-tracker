import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import FullPageMessage from '../ui/FullPageMessage.jsx';
import LoadingMessage from '../ui/LoadingMessage.jsx';

// Wraps the login and register pages: a centred card, only for logged-out users.
export default function GuestLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <FullPageMessage>
        <LoadingMessage />
      </FullPageMessage>
    );
  }
  // Logged in (already, or just now): go to the page ProtectedRoute sent them
  // away from, or to the dashboard.
  if (user) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Outlet />
      </div>
    </main>
  );
}
