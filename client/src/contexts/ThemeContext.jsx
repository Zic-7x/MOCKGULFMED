import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('mockgulfmed-theme') || localStorage.getItem('mockgulfmed-index-theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    /* ignore localStorage errors */
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  const applyThemeToDom = useCallback((currentTheme) => {
    if (typeof document === 'undefined') return;
    const isDark = currentTheme === 'dark';

    // Apply data-theme and classes on root and body elements
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);

    if (document.body) {
      document.body.setAttribute('data-theme', currentTheme);
      document.body.classList.toggle('dark-theme', isDark);
      document.body.classList.toggle('light-theme', !isDark);
    }
  }, []);

  const setTheme = useCallback(
    (newTheme) => {
      const validTheme = newTheme === 'dark' ? 'dark' : 'light';
      setThemeState(validTheme);
      try {
        localStorage.setItem('mockgulfmed-theme', validTheme);
        localStorage.setItem('mockgulfmed-index-theme', validTheme);
      } catch {
        /* ignore */
      }
      applyThemeToDom(validTheme);
    },
    [applyThemeToDom]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // Apply theme immediately on mount and when theme changes
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme, applyThemeToDom]);

  // Listen to system preference changes if user hasn't explicitly set a preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      try {
        const stored = localStorage.getItem('mockgulfmed-theme') || localStorage.getItem('mockgulfmed-index-theme');
        if (!stored) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      } catch {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }
  }, [setTheme]);

  // Listen for storage events across other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e) => {
      if ((e.key === 'mockgulfmed-theme' || e.key === 'mockgulfmed-index-theme') && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
        applyThemeToDom(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [applyThemeToDom]);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
