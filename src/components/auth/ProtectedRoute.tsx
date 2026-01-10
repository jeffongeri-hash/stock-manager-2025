import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean; // If true, requires full auth (not guest mode)
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-8 safe-area-top">
    <div className="space-y-4">
      <Skeleton className="h-8 w-32 sm:w-48" />
      <Skeleton className="h-4 w-full max-w-96" />
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
        <Skeleton className="h-24 sm:h-32" />
        <Skeleton className="h-24 sm:h-32" />
        <Skeleton className="h-24 sm:h-32 hidden sm:block" />
        <Skeleton className="h-24 sm:h-32 hidden lg:block" />
      </div>
      <Skeleton className="h-48 sm:h-64 mt-6" />
    </div>
  </div>
);

export const ProtectedRoute = ({ children, requiresAuth = false }: ProtectedRouteProps) => {
  const { user, loading, isGuestMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  // If route requires full authentication (not guest mode)
  if (requiresAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If route allows guest mode, check if user is authenticated OR in guest mode
  if (!requiresAuth && !user && !isGuestMode) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
