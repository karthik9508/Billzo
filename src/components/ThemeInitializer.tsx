'use client';

/**
 * ThemeInitializer - Prevents theme flashing by applying theme before hydration
 * This component runs a script in the document head to set the theme immediately
 * Uses suppressHydrationWarning to prevent hydration mismatches
 */
export default function ThemeInitializer() {
  const themeScript = `
    (function() {
      try {
        // Only run on client-side
        if (typeof window === 'undefined') return;
        
        // Get theme from user settings first
        let theme = 'system';
        try {
          const userSettings = localStorage.getItem('user_settings');
          if (userSettings) {
            const parsed = JSON.parse(userSettings);
            theme = parsed.theme || 'system';
          }
        } catch (e) {
          // Fallback to direct theme storage
          try {
            const stored = localStorage.getItem('theme');
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
              theme = stored;
            }
          } catch (e) {
            // Ignore localStorage errors
          }
        }

        // Resolve theme
        let resolvedTheme = theme;
        if (theme === 'system') {
          try {
            resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          } catch (e) {
            resolvedTheme = 'light';
          }
        }

        // Apply theme
        const isDark = resolvedTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);

        // Set CSS variables
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
        
        // Mark as initialized
        document.documentElement.setAttribute('data-theme-initialized', 'true');
      } catch (e) {
        console.warn('Theme initialization failed:', e);
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />;
}