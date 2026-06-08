import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

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

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin, isAdminLoading } = useAuth();

  if (loading || isAdminLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
