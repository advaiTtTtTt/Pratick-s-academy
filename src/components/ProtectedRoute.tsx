'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (requiredRole === 'admin') {
        router.replace('/admin/login');
      } else {
        router.replace('/login');
      }
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, loading, requiredRole, router]);

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    return <LoadingSpinner message="Redirecting to login..." />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  return <>{children}</>;
}
