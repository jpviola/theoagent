'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'es' | 'en' | 'pt';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
};

const STORAGE_KEY = 'santapalabra_language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(value: unknown): AppLanguage | null {
  if (value === 'es' || value === 'en' || value === 'pt') return value;
  return null;
}

function getBrowserDefaultLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'es';
  
  const lang = navigator.language?.toLowerCase();
  const locale = lang?.split('-')[0];
  
  // Portugués (Brasil y Portugal)
  if (locale === 'pt') return 'pt';
  
  // Español (España, México, Argentina, etc.)
  if (locale === 'es') return 'es';
  
  // Intentar detectar por región si el idioma no es específico
  if (lang?.includes('br')) return 'pt'; // Brasil
  
  // Default a español para Latinoamérica
  return 'es';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('es');

  useEffect(() => {
    try {
      const stored = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
      setLanguageState(stored ?? getBrowserDefaultLanguage());
    } catch {
      setLanguageState('es');
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language,
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((prev) => {
        if (prev === 'es') return 'pt';
        if (prev === 'pt') return 'en';
        return 'es';
      }),
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
