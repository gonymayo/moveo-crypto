import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Wraps routes that require authentication.
 *
 * Behaviour:
 * - Loading  → show nothing (avoids flash of redirect before token validation).
 * - No user  → redirect to /login.
 * - No prefs → redirect to /onboarding (quiz not yet completed).
 * - OK       → render the child route.
 */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Full-screen spinner while we validate the stored token.
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.preferencesSet) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/**
 * Wraps the onboarding route — requires auth but NOT completed preferences.
 * Prevents users from re-doing onboarding once it's done (redirects to dashboard).
 */
export function OnboardingRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-border border-t-brand" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.preferencesSet) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
