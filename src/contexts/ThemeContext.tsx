'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = window.localStorage.getItem('santapalabra_dark_mode');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return saved === null ? systemPrefersDark : saved === 'true';
    } catch {
      return false;
    }
  });

  const applyTheme = (dark: boolean) => {
    if (typeof document === 'undefined') return;
    const method = dark ? 'add' : 'remove';
    document.documentElement.classList[method]('dark');
    document.body.classList[method]('dark');
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', dark ? '#1f2937' : '#eab308');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    console.log('ThemeProvider: Toggling dark mode:', newDarkMode);
    setIsDarkMode(newDarkMode);
    try {
      window.localStorage.setItem('santapalabra_dark_mode', newDarkMode.toString());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
