'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  // This component cannot be used on pages that are not wrapped in LanguageProvider
  if (!setLanguage) {
    // Fallback for pages without context provider
    console.warn('LanguageToggle used outside of LanguageProvider.');
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-5 w-5 text-gray-500" />
      <div className="relative flex items-center rounded-md bg-yellow-50 p-1 border border-yellow-200">
        <motion.div
          className="absolute left-1 top-1 bottom-1 w-[41px] rounded bg-yellow-500 shadow-sm"
          animate={{ x: language === 'es' ? 0 : 44 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <button
          type="button"
          onClick={() => setLanguage('es')}
          className="relative z-10 px-3 py-1 rounded text-sm font-semibold transition-colors"
        >
          <span className={language === 'es' ? 'text-gray-900' : 'text-gray-700'}>ES</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className="relative z-10 px-3 py-1 rounded text-sm font-semibold transition-colors"
        >
          <span className={language === 'en' ? 'text-gray-900' : 'text-gray-700'}>EN</span>
        </button>
      </div>
    </div>
  );
}
