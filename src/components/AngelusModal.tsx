'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AngelusModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Check if it's noon (12:00 PM - 1:00 PM window)
      // and if we haven't shown it today yet
      if (hours === 12) {
        const today = new Date().toDateString();
        const lastShownDate = localStorage.getItem('santapalabra_angelus_shown_date');
        
        if (lastShownDate !== today) {
          setIsOpen(true);
          localStorage.setItem('santapalabra_angelus_shown_date', today);
        }
      }
    };

    // Check immediately and then every minute
    checkTime();
    const interval = setInterval(checkTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const content = {
    es: {
      title: 'El Ángelus',
      subtitle: 'Es la hora del Señor',
      v1: 'El Ángel del Señor anunció a María.',
      r1: 'Y concibió por obra del Espíritu Santo.',
      v2: 'He aquí la esclava del Señor.',
      r2: 'Hágase en mí según tu palabra.',
      v3: 'Y el Verbo se hizo carne.',
      r3: 'Y habitó entre nosotros.',
      prayer: 'Dios te salve, María...',
      close: 'Continuar'
    },
    pt: {
      title: 'O Angelus',
      subtitle: 'É a hora do Senhor',
      v1: 'O Anjo do Senhor anunciou a Maria.',
      r1: 'E ela concebeu do Espírito Santo.',
      v2: 'Eis aqui a serva do Senhor.',
      r2: 'Faça-se em mim segundo a vossa palavra.',
      v3: 'E o Verbo se fez carne.',
      r3: 'E habitou entre nós.',
      prayer: 'Ave Maria...',
      close: 'Continuar'
    },
    en: {
      title: 'The Angelus',
      subtitle: 'It is the Lord\'s hour',
      v1: 'The Angel of the Lord declared to Mary.',
      r1: 'And she conceived of the Holy Spirit.',
      v2: 'Behold the handmaid of the Lord.',
      r2: 'Be it done unto me according to thy word.',
      v3: 'And the Word was made Flesh.',
      r3: 'And dwelt among us.',
      prayer: 'Hail Mary...',
      close: 'Continue'
    }
  };

  const t = content[language as keyof typeof content] || content.es;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-amber-100 dark:border-amber-900/50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 text-center relative">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-800/30 rounded-full">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-serif">
                {t.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.subtitle}
              </p>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600 w-4">V.</span>
                  <p>{t.v1}</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600 w-4">R.</span>
                  <p className="italic">{t.r1}</p>
                </div>
                
                <div className="w-full h-px bg-amber-50 dark:bg-amber-900/20 my-2" />
                
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600 w-4">V.</span>
                  <p>{t.v2}</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600 w-4">R.</span>
                  <p className="italic">{t.r2}</p>
                </div>

                <div className="w-full h-px bg-amber-50 dark:bg-amber-900/20 my-2" />

                <div className="flex gap-2">
                  <span className="font-bold text-amber-600 w-4">V.</span>
                  <p>{t.v3}</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-amber-600 w-4">R.</span>
                  <p className="italic">{t.r3}</p>
                </div>
              </div>

              <div className="pt-2 text-center">
                 <p className="text-xs text-amber-800 dark:text-amber-400 font-serif italic bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                   {t.prayer}
                 </p>
              </div>
              
              <button
                onClick={handleClose}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
