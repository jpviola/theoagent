'use client';

import AuthFlowManager from '@/components/AuthFlowManager';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import Header from '@/components/Header';
import { AuthProvider } from '@/lib/auth-context';
import { ModalProvider } from '@/components/ModalContext';
import GlobalModalManager from '@/components/GlobalModalManager';
import CookieConsentModal from '@/components/CookieConsentModal';

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-3 py-2 shadow-lg border border-amber-200">
        <Globe className="h-4 w-4 text-gray-500" />
        <div className="relative flex items-center rounded-md bg-amber-50 p-1">
          <motion.div
            className="absolute left-1 top-1 bottom-1 w-[32px] rounded bg-amber-500 shadow-sm"
            animate={{ x: language === 'es' ? 0 : 34 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
          <button
            type="button"
            onClick={() => setLanguage('es')}
            className="relative z-10 px-2 py-1 rounded text-xs font-semibold transition-colors"
          >
            <span className={language === 'es' ? 'text-gray-900' : 'text-gray-700'}>ES</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className="relative z-10 px-2 py-1 rounded text-xs font-semibold transition-colors"
          >
            <span className={language === 'en' ? 'text-gray-900' : 'text-gray-700'}>EN</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  // Páginas que necesitan selector de idioma flotante (removido ya que está en Header)
  const showLanguageToggle = false;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ModalProvider>
            <Header />
            {showLanguageToggle && <LanguageToggle />}
            <AuthFlowManager>{children}</AuthFlowManager>
            <GlobalModalManager />
            <CookieConsentModal />
          </ModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
