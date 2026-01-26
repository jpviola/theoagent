'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CookieConsentModal() {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('santapalabra_cookie_consent');
    if (!consent) {
      // Show after a small delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('santapalabra_cookie_consent', 'true');
    setIsVisible(false);
  };

  const texts = {
    es: {
      title: '🍪 Política de Cookies',
      message: 'Utilizamos cookies para guardar tu progreso espiritual (gamificación), tus preferencias y mejorar tu experiencia. Al continuar navegando, aceptas nuestro uso de cookies.',
      accept: 'Aceptar y Continuar',
      learnMore: 'Leer más'
    },
    en: {
      title: '🍪 Cookie Policy',
      message: 'We use cookies to save your spiritual progress (gamification), preferences, and improve your experience. By continuing to browse, you accept our use of cookies.',
      accept: 'Accept and Continue',
      learnMore: 'Learn more'
    },
    pt: {
      title: '🍪 Política de Cookies',
      message: 'Utilizamos cookies para salvar seu progresso espiritual (gamificação), preferências e melhorar sua experiência. Ao continuar navegando, você aceita nosso uso de cookies.',
      accept: 'Aceitar e Continuar',
      learnMore: 'Ler mais'
    }
  };

  const t = texts[language as keyof typeof texts] || texts.es;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-amber-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 md:flex md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4 mb-4 md:mb-0">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full flex-shrink-0">
                <Cookie className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {t.message}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
