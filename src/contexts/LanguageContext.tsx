'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'es' | 'en';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
};

const STORAGE_KEY = 'santapalabra_language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function normalizeLanguage(value: unknown): AppLanguage | null {
  if (value === 'es' || value === 'en') return value;
  return null;
}

function getBrowserDefaultLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'es';
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'es';
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
      toggleLanguage: () => setLanguageState((prev) => (prev === 'es' ? 'en' : 'es')),
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
