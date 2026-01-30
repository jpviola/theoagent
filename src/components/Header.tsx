'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProgress, GamificationModal } from '@/components/GamificationSystem';
import { isUserSubscribed } from '@/lib/subscription';
import { useState, useEffect } from 'react';
import { Trophy, Mail, Shield } from 'lucide-react';
import { useModal } from '@/components/ModalContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { openModal } = useModal();
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { progress } = useUserProgress();

  useEffect(() => {
    setIsSubscribed(isUserSubscribed());
    setMounted(true);
  }, []);

  const isChatPage =
    (pathname || '').startsWith('/catholic-chat') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/catholic-chat'));

  if (isChatPage) {
    return null;
  }

  // Header normal para otras páginas
  return (
    <>
      <header className="relative sticky top-0 z-50 w-full border-b border-amber-100 dark:border-transparent bg-white/85 backdrop-blur-xl shadow-sm dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:bg-opacity-85">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-black/8 dark:from-black/8 dark:to-black/18" />
        <div className="mx-auto max-w-7xl px-4 py-2 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo y título principal */}
            <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.01]">
              <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 p-1.5 shadow-sm group-hover:shadow-md transition-shadow dark:from-gray-700 dark:to-gray-600">
                <Image
                  src="/santapalabra-logo.svg"
                  alt="SantaPalabra"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain dark:brightness-125 dark:contrast-125"
                  priority
                />
              </div>
              <div className="leading-tight">
                <div className="text-base sm:text-lg font-black text-gray-900 tracking-tight dark:text-white/90 flex items-center gap-1.5">
                  SantaPalabra
                  <span className="px-1 py-0.5 rounded bg-blue-600 text-[9px] font-bold text-white shadow-sm leading-none align-middle hidden sm:inline-block">
                    BETA
                  </span>
                </div>
              </div>
            </Link>

            {/* Navegación principal minimalista */}
            <nav className="hidden lg:flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
              <Link
                href="/admin"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors dark:text-purple-400 dark:border-purple-900 dark:hover:bg-purple-900/30"
                aria-label="Administración"
              >
                <Shield className="h-4 w-4" />
              </Link>
              <Link href="/blog" style={{ color: 'var(--foreground)' }} className="px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-gray-900 transition-colors dark:text-white dark:hover:bg-gray-700 dark:hover:text-white">
                Blog
              </Link>
              <Link href="/sobre-nosotros" style={{ color: 'var(--foreground)' }} className="px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-gray-900 transition-colors dark:text-white dark:hover:bg-gray-700 dark:hover:text-white">
                Sobre nosotros
              </Link>
              
              <div className="h-6 w-px bg-gray-200 mx-2 dark:bg-gray-700" />
              
              {!isSubscribed && (
                <button
                  onClick={() => openModal('subscription')}
                  className="px-4 py-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
                >
                  Suscribirse
                </button>
              )}
            </nav>

            {/* Navegación móvil */}
            <nav className="flex lg:hidden items-center gap-1.5">
              <Link
                href="/admin"
                className="h-9 w-9 flex items-center justify-center rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors dark:text-purple-400 dark:border-purple-900 dark:hover:bg-purple-900/30"
                aria-label="Administración"
              >
                <Shield className="h-4 w-4" />
              </Link>
              {!isSubscribed && (
                <button
                  onClick={() => openModal('subscription')}
                  className="p-2 rounded-lg hover:bg-amber-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700"
                  aria-label="Suscribirse"
                >
                  <Mail className="h-5 w-5 dark:text-white" />
                </button>
              )}
              <Link href="/blog" style={{ color: 'var(--foreground)' }} className="p-2 rounded-lg hover:bg-amber-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700 hidden sm:block">
                <span className="text-lg dark:text-white">📖</span>
              </Link>
              <Link href="/sobre-nosotros" style={{ color: 'var(--foreground)' }} className="p-2 rounded-lg hover:bg-amber-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700 hidden sm:block">
                <span className="text-lg dark:text-white">ℹ️</span>
              </Link>
            </nav>

            {/* Controles rápidos */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGamificationModal(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-amber-200 text-base text-gray-600 hover:bg-amber-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700 relative"
                aria-label="Ver progreso"
              >
                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                {progress.level > 1 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {progress.level}
                  </span>
                )}
              </button>
              <button
                onClick={toggleDarkMode}
                className="h-9 w-9 rounded-full border border-amber-200 text-base text-gray-600 hover:bg-amber-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                aria-label="Alternar tema"
              >
                {mounted && isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={toggleLanguage}
                style={{ color: 'var(--foreground)' }}
                className="h-9 px-3 rounded-full border border-amber-200 text-sm font-semibold text-gray-700 hover:bg-amber-50 transition-colors dark:text-white dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                aria-label="Cambiar idioma"
              >
                {language === 'es' ? 'EN' : 'ES'}
              </button>
            </div>
          </div>
        </div>
      </header>
      <GamificationModal
        isOpen={showGamificationModal}
        onClose={() => setShowGamificationModal(false)}
        progress={progress}
      />
    </>
  );
}
