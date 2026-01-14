'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('santapalabra_dark_mode');
    const dark = savedDarkMode === 'true';
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    console.log('ThemeProvider: Toggling dark mode:', newDarkMode);
    setIsDarkMode(newDarkMode);
    localStorage.setItem('santapalabra_dark_mode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('ThemeProvider: Added dark class');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('ThemeProvider: Removed dark class');
    }
  };

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