import { Route, Routes } from 'react-router';
import AppLayout from './components/layout/AppLayout.jsx';
import ApplicationDetailPage from './pages/ApplicationDetailPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public pages: no navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App pages: rendered inside AppLayout's <Outlet /> */}
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
