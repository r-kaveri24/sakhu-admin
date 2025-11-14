"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'ADMIN' | 'EDITOR' | 'USER';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/sign-in');
      } else if (requireRole) {
        // Check role hierarchy: ADMIN > EDITOR > USER
        const roleHierarchy = { ADMIN: 3, EDITOR: 2, USER: 1 };
        const userLevel = roleHierarchy[user.role];
        const requiredLevel = roleHierarchy[requireRole];

        if (userLevel < requiredLevel) {
          router.replace('/admin/hero'); // Redirect to hero page if insufficient permissions
        }
      }
    }
  }, [user, loading, requireRole, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#804499] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!user) {
    return null;
  }

  // Check role requirements
  if (requireRole) {
    const roleHierarchy = { ADMIN: 3, EDITOR: 2, USER: 1 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requireRole];

    if (userLevel < requiredLevel) {
      return null;
    }
  }

  return <>{children}</>;
}
