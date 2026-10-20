import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../ui/Button.jsx';
import FullPageMessage from '../ui/FullPageMessage.jsx';

// Wraps the app's pages: only logged-in users get through.
export default function ProtectedRoute() {
  const { user, isLoading, error, retry } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageMessage>Loading…</FullPageMessage>;
  }
  if (user) {
    return <Outlet />;
  }
  // Couldn't ask the server (e.g. it's down): don't pretend the user is logged out.
  if (error) {
    return (
      <FullPageMessage>
        <p>{error.message}</p>
        <Button onClick={() => retry()}>Try again</Button>
      </FullPageMessage>
    );
  }
  // Remember where they were going, so login can send them back there.
  return <Navigate to="/login" replace state={{ from: location }} />;
}
