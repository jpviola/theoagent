'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply theme class to <html>
  const applyTheme = (dark: boolean) => {
    const method = dark ? 'add' : 'remove';
    document.documentElement.classList[method]('dark');
    document.body.classList[method]('dark');
  };

  useEffect(() => {
    const saved = localStorage.getItem('santapalabra_dark_mode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === null ? systemPrefersDark : saved === 'true';
    setIsDarkMode(dark);
    applyTheme(dark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    console.log('ThemeProvider: Toggling dark mode:', newDarkMode);
    setIsDarkMode(newDarkMode);
    localStorage.setItem('santapalabra_dark_mode', newDarkMode.toString());
    applyTheme(newDarkMode);
  };

  // Sync class when state changes from any source
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