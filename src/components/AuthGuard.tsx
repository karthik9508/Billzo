'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Add timeout protection
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, 8000); // Show warning after 8 seconds

      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutWarning(false);
    }
  }, [loading]);

  useEffect(() => {
    // Don't do anything while still loading
    if (loading) return;

    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      // Don't redirect if already on auth pages
      if (!pathname.startsWith('/auth/')) {
        router.push('/auth/login');
      }
      return;
    }
    
    // If user is logged in but on auth pages, redirect to dashboard
    if (user && pathname.startsWith('/auth/')) {
      router.push('/dashboard');
      return;
    }
  }, [user, loading, requireAuth, router, pathname]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Billzo
          </h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
          
          {showTimeoutWarning && (
            <div className="mt-6 max-w-md mx-auto">
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-3">
                Loading is taking longer than expected...
              </p>
              <Button 
                onClick={() => window.location.reload()}
                size="sm"
              >
                Refresh Page
              </Button>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href="/auth/login">
                    Go to Login
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}