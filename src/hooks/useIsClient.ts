'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to check if component is running on client-side
 * Prevents hydration errors by returning false during SSR
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}