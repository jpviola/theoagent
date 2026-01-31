'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'normal' | 'large' | 'xl';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  toggleFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>('normal');

  useEffect(() => {
    // Load from localStorage on mount
    const savedSize = localStorage.getItem('santapalabra_font_size') as FontSize;
    if (savedSize && ['normal', 'large', 'xl'].includes(savedSize)) {
      setFontSize(savedSize);
    }
  }, []);

  useEffect(() => {
    // Apply font size to html element
    const html = document.documentElement;
    html.classList.remove('text-base', 'text-lg', 'text-xl');
    
    switch (fontSize) {
      case 'normal':
        html.classList.add('text-base');
        break;
      case 'large':
        html.classList.add('text-lg');
        break;
      case 'xl':
        html.classList.add('text-xl');
        break;
    }
    
    localStorage.setItem('santapalabra_font_size', fontSize);
  }, [fontSize]);

  const toggleFontSize = () => {
    setFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xl';
      return 'normal';
    });
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, toggleFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
