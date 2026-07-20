import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Register from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import Tests from './pages/Tests';
import PatientDashboard from './pages/patient/Dashboard';
import Checkout from './pages/patient/Checkout';
import WalletPage from './pages/patient/WalletPage';
import { MembershipPage } from './pages/patient/MembershipPage';
import AiAssistant from './pages/patient/AiAssistant';
import StaffDashboard from './pages/staff/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import ProtectedRoute from './components/ProtectedRoute';

export const App: React.FC = () => {
  const { checkAuth, isCheckingAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
          <div className="absolute inset-4 rounded-full bg-emerald-500/20 blur-sm animate-pulse"></div>
        </div>
        <p className="mt-4 text-zinc-400 font-medium tracking-wide animate-pulse">
          Initializing LabLink AI...
        </p>
      </div>
    );
  }

  // Root redirect helper based on roles
  const getDashboardRedirect = () => {
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/tests" element={<Tests />} />

        {/* Protected Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/wallet"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/membership"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <MembershipPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/reports/:reportId/ai-assistant"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AiAssistant />
            </ProtectedRoute>
          }
        />

        {/* Protected Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard defaultTab="my_assignments" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/queue"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard defaultTab="all_bookings" />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard defaultTab="overview" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard defaultTab="bookings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard defaultTab="tests" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard defaultTab="categories" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard defaultTab="subscriptions" />
            </ProtectedRoute>
          }
        />

        {/* Protected Shared Routes */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['patient', 'staff', 'admin']}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />

        {/* Default Routing */}
        <Route path="/" element={getDashboardRedirect()} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;