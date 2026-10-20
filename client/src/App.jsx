import { Route, Routes } from 'react-router';
import AppLayout from './components/layout/AppLayout.jsx';
import GuestLayout from './components/layout/GuestLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import ApplicationDetailPage from './pages/ApplicationDetailPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Logged-out only: a logged-in user is redirected into the app */}
      <Route element={<GuestLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Logged-in only: rendered inside AppLayout's <Outlet /> */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
