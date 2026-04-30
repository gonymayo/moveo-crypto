import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, OnboardingRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';

/**
 * Root routing tree.
 *
 * /              → redirect to /dashboard
 * /login         → public — Login/Signup page
 * /onboarding    → auth-required, no-prefs-required
 * /dashboard     → auth-required + prefs-required
 */
export default function App() {
  return (
    <Routes>
      {/* Redirect root to dashboard — ProtectedRoute handles auth checks */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Onboarding — logged in but quiz not yet done */}
      <Route element={<OnboardingRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Protected routes — logged in + quiz done */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
