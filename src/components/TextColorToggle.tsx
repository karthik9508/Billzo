'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { getThemeIcon, getThemeDisplayName } from '@/lib/theme-utils';
import NoSSR from './NoSSR';

export default function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <NoSSR fallback={
      <div className="flex items-center space-x-2 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <span className="text-sm">☀️ Light</span>
      </div>
    }>
      <button
        onClick={toggleTheme}
        className="flex items-center space-x-2 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
      >
        <span className="text-sm">
          {getThemeIcon(resolvedTheme)} {getThemeDisplayName(resolvedTheme)}
        </span>
      </button>
    </NoSSR>
  );
}