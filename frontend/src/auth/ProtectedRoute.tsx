import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth.hooks';

export default function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-lifeos-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lifeos-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-lifeos-muted">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
