'use client';

import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ThemeInitializer from '@/components/ThemeInitializer';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  // Determine if current route requires authentication
  const isAuthPage = pathname?.startsWith('/auth/');
  const isPublicPage = pathname === '/' || isAuthPage;
  const requireAuth = !isPublicPage;

  return (
    <>
      <ThemeInitializer />
      <AuthProvider>
        <ThemeProvider>
          <AuthGuard requireAuth={requireAuth}>
            {children}
          </AuthGuard>
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}