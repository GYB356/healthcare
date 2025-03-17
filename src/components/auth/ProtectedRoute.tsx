import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const router = useRouter();
  const { currentUser, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    // If authentication is still loading, wait
    if (loading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace({
        pathname: '/login',
        query: { returnUrl: router.asPath }
      });
      return;
    }

    // If roles are specified and user's role is not allowed, redirect to dashboard
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser?.role)) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, currentUser, router, allowedRoles]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If no roles are required, or user has the required role, render children
  if (!allowedRoles.length || (currentUser && allowedRoles.includes(currentUser.role))) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
};

export default ProtectedRoute; 