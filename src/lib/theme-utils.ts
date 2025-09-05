import { userStorage } from './user-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Get the current theme from user settings (client-side only)
 */
export function getCurrentTheme(): ThemeMode {
  // Return default during SSR
  if (typeof window === 'undefined') {
    return 'system';
  }
  
  try {
    const settings = userStorage.getSettings();
    return settings.theme;
  } catch {
    // Fallback to localStorage if user settings not available
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored as ThemeMode;
      }
    } catch {
      // Ignore localStorage errors during SSR
    }
    return 'system';
  }
}

/**
 * Set theme in both user settings and localStorage
 */
export function setTheme(theme: ThemeMode): void {
  try {
    // Update user settings
    userStorage.updateSettings({ theme });
  } catch (error) {
    console.warn('Failed to save theme to user settings:', error);
  }

  // Always update localStorage as backup
  localStorage.setItem('theme', theme);

  // Apply theme immediately
  applyTheme(theme);
}

/**
 * Determine if system prefers dark mode
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the actual theme to apply (light/dark) based on mode
 */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply theme to the document
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const resolvedTheme = resolveTheme(mode);
  const isDark = resolvedTheme === 'dark';

  // Apply or remove the dark class
  document.documentElement.classList.toggle('dark', isDark);

  // Update CSS custom properties for additional theme support
  if (isDark) {
    document.documentElement.style.setProperty('--background', '#111827');
    document.documentElement.style.setProperty('--foreground', '#f9fafb');
    document.documentElement.style.setProperty('--card-background', '#1f2937');
    document.documentElement.style.setProperty('--card-foreground', '#f9fafb');
    document.documentElement.style.setProperty('--text-primary', '#f9fafb');
    document.documentElement.style.setProperty('--text-secondary', '#e5e7eb');
    document.documentElement.style.setProperty('--text-muted', '#d1d5db');
    document.documentElement.style.setProperty('--text-light', '#9ca3af');
  } else {
    document.documentElement.style.setProperty('--background', '#f9fafb');
    document.documentElement.style.setProperty('--foreground', '#111827');
    document.documentElement.style.setProperty('--card-background', '#ffffff');
    document.documentElement.style.setProperty('--card-foreground', '#111827');
    document.documentElement.style.setProperty('--text-primary', '#111827');
    document.documentElement.style.setProperty('--text-secondary', '#374151');
    document.documentElement.style.setProperty('--text-muted', '#6b7280');
    document.documentElement.style.setProperty('--text-light', '#9ca3af');
  }
}

/**
 * Initialize theme on app startup
 */
export function initializeTheme(): ThemeMode {
  const theme = getCurrentTheme();
  applyTheme(theme);
  return theme;
}

/**
 * Listen for system theme changes when in system mode
 */
export function setupSystemThemeListener(onThemeChange: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    onThemeChange(e.matches ? 'dark' : 'light');
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } 
  // Legacy browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }

  return () => {};
}

/**
 * Get theme display name for UI
 */
export function getThemeDisplayName(theme: ThemeMode): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System';
    default:
      return 'System';
  }
}

/**
 * Get theme icon for UI
 */
export function getThemeIcon(theme: ThemeMode): string {
  const resolved = resolveTheme(theme);
  switch (resolved) {
    case 'light':
      return '☀️';
    case 'dark':
      return '🌙';
    default:
      return '🌙';
  }
}