import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSubscription = false 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // SECURITY: Always verify auth server-side, never trust client cache alone
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // SECURITY: Role checks MUST be enforced server-side
  // Client-side checks are for UX only, not security
  if (requireAdmin && user?.role !== 'admin' && !user?.is_owner) {
    // Server will reject the request anyway if not admin
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !user?.has_active_subscription) {
    // Server will reject protected operations anyway
    return <Navigate to="/pricing" state={{ expired: true }} replace />;
  }

  return <>{children}</>;
}
