'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, getCurrentTheme, setTheme, resolveTheme, applyTheme, setupSystemThemeListener } from '@/lib/theme-utils';
import { useIsClient } from '@/hooks/useIsClient';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const isClient = useIsClient();

  // Initialize theme on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    const currentTheme = getCurrentTheme();
    setThemeState(currentTheme);
    const resolved = resolveTheme(currentTheme);
    setResolvedTheme(resolved);
    applyTheme(currentTheme);
  }, [isClient]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const cleanup = setupSystemThemeListener((systemTheme) => {
      setResolvedTheme(systemTheme);
      applyTheme('system'); // Re-apply system theme
    });

    return cleanup;
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme); // This updates both localStorage and user settings
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark (not including system)
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    handleSetTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value} suppressHydrationWarning>
      {children}
    </ThemeContext.Provider>
  );
}