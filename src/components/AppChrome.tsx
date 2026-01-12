'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthFlowManager from '@/components/AuthFlowManager';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

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

function GlobalHeader() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-yellow-200 bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
          <Link href="/" className="flex items-center gap-3">
            <img src="/santapalabra-logo.svg" alt="SantaPalabra" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-wide text-gray-900">SantaPalabra</div>
              <div className="text-xs text-gray-600">Catequista digital hispanoamericano</div>
            </div>
          </Link>
        </motion.div>
        <LanguageToggle />
      </div>
    </motion.header>
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // These routes already render their own branded headers.
  const hideHeader = pathname === '/catholic-chat' || pathname === '/test-rag';

  return (
    <LanguageProvider>
      {!hideHeader && <GlobalHeader />}
      <AuthFlowManager>{children}</AuthFlowManager>
    </LanguageProvider>
  );
}
