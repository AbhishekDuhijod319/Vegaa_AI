import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute: Wraps routes that require authentication.
 * - Shows loader during initial auth check
 * - Redirects to /auth with return URL if not authenticated
 * - Renders children if authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Encode the current path so we can redirect back after login
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  return children;
}
