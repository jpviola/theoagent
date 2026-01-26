'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DonationButton } from '@/components/DonationButton';
import AuthModal from '@/components/AuthModal';
import { useUserProgress, GamificationModal } from '@/components/GamificationSystem';
import { useState } from 'react';
import { Trophy } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { progress } = useUserProgress();

  const isAdmin = !!profile && profile.subscription_tier === 'expert';
  const isChatPage =
    (pathname || '').startsWith('/catholic-chat') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/catholic-chat'));

  const handleAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isChatPage) {
    // Header especial para la página de chat: solo logo grande + leyenda, con donación/café destacados
    return (
      <>
        <header className={`relative sticky top-0 z-50 w-full ${isDarkMode ? 'border-b border-transparent' : 'border-b border-yellow-200'} bg-white/95 backdrop-blur-xl shadow-sm ${isDarkMode ? 'dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:bg-opacity-95' : ''}`}>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-black/10 dark:from-black/10 dark:to-black/20" />
            <div className="mx-auto max-w-7xl px-4 py-3 relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="flex w-full items-center justify-center gap-4 sm:w-auto sm:justify-start">
                <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 p-2 shadow-md dark:from-gray-700 dark:to-gray-600">
                  <Image
                    src="/santapalabra-logo.svg"
                    alt="SantaPalabra"
                    width={64}
                    height={64}
                    className="h-full w-full object-contain dark:brightness-125 dark:contrast-125"
                    priority
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-xl md:text-2xl font-black text-gray-900 tracking-tight dark:text-white/90">
                    SantaPalabra,
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-semibold dark:text-white/70">
                    ¡Ruega por nosotros!
                  </div>
                </div>
              </Link>
  
              <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end md:gap-4">
                <button
                  onClick={() => setShowGamificationModal(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-yellow-200 text-base text-gray-600 hover:bg-yellow-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700 relative"
                  aria-label="Ver progreso"
                >
                  <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  {progress.level > 1 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {progress.level}
                    </span>
                  )}
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="h-9 w-9 rounded-full border border-yellow-200 text-base text-gray-600 hover:bg-yellow-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                  aria-label="Alternar tema"
                >
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <Link
                  href="/support"
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:text-gray-100 dark:from-yellow-500 dark:to-amber-600 dark:hover:from-yellow-600 dark:hover:to-amber-700"
                >
                  <span className="group-hover:animate-pulse text-xl">❤️</span>
                  <span>¡Quiero donar!</span>
                </Link>
                {/* Auth Controls for Chat Page */}
                {!profile ? (
                  <button
                    onClick={() => handleAuth('signin')}
                    className="text-sm font-semibold text-gray-700 hover:text-amber-600 transition-colors dark:text-gray-200 dark:hover:text-amber-400"
                  >
                    Ingresar
                  </button>
                ) : (
                  <button
                    onClick={handleSignOut}
                    className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors dark:text-gray-200 dark:hover:text-red-400"
                  >
                    Salir
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
        <GamificationModal
          isOpen={showGamificationModal}
          onClose={() => setShowGamificationModal(false)}
          progress={progress}
        />
      </>
    );
  }

  // Header normal para otras páginas
  return (
    <>
      <header className={`relative sticky top-0 z-50 w-full ${isDarkMode ? 'border-b border-transparent' : 'border-b border-yellow-100'} bg-white/85 backdrop-blur-xl shadow-sm ${isDarkMode ? 'dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:bg-opacity-85' : ''}`}>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-black/8 dark:from-black/8 dark:to-black/18" />
        <div className="mx-auto max-w-7xl px-4 py-2.5 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo y título principal */}
            <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.01]">
              <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-100 p-2 shadow-sm group-hover:shadow-md transition-shadow dark:from-gray-700 dark:to-gray-600">
                <Image
                  src="/santapalabra-logo.svg"
                  alt="SantaPalabra"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain dark:brightness-125 dark:contrast-125"
                  priority
                />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-black text-gray-900 tracking-tight dark:text-white/90">SantaPalabra</div>
                <div className="text-xs text-gray-600 font-medium dark:text-white/70">Catequista digital hispanoamericano</div>
              </div>
            </Link>

            {/* Navegación principal minimalista */}
            <nav className="hidden lg:flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
              <Link href="/blog" style={{ color: 'var(--foreground)' }} className="px-3 py-2 rounded-lg hover:bg-yellow-50 hover:text-gray-900 transition-colors dark:text-white dark:hover:bg-gray-700 dark:hover:text-white">
                Blog
              </Link>
              <Link href="/sobre-nosotros" style={{ color: 'var(--foreground)' }} className="px-3 py-2 rounded-lg hover:bg-yellow-50 hover:text-gray-900 transition-colors dark:text-white dark:hover:bg-gray-700 dark:hover:text-white">
                Sobre nosotros
              </Link>
              {isAdmin && (
                <Link href="/admin" className="ml-2 flex items-center gap-1 px-3 py-2 rounded-lg border border-yellow-200 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors dark:border-amber-600 dark:text-amber-300 dark:bg-transparent dark:hover:bg-gray-700 dark:hover:text-amber-200">
                  <span className="text-sm">⚙️</span>
                  Panel
                </Link>
              )}
              
              <div className="h-6 w-px bg-gray-200 mx-2 dark:bg-gray-700" />
              
              {!profile ? (
                <button
                  onClick={() => handleAuth('signin')}
                  className="px-4 py-2 rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
                >
                  Ingresar
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {profile.full_name?.split(' ')[0] || 'Hola'}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-red-600 transition-colors dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-red-400"
                  >
                    Salir
                  </button>
                </div>
              )}
            </nav>

            {/* Navegación móvil */}
            <nav className="flex lg:hidden items-center gap-1.5">
              {!profile ? (
                <button
                  onClick={() => handleAuth('signin')}
                  className="p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700"
                  aria-label="Ingresar"
                >
                  <span className="text-lg dark:text-white">👤</span>
                </button>
              ) : (
                 <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700"
                  aria-label="Salir"
                >
                  <span className="text-lg text-red-500">🚪</span>
                </button>
              )}
              <Link href="/blog" style={{ color: 'var(--foreground)' }} className="p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700">
                <span className="text-lg dark:text-white">📖</span>
              </Link>
              <Link href="/sobre-nosotros" style={{ color: 'var(--foreground)' }} className="p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700">
                <span className="text-lg dark:text-white">ℹ️</span>
              </Link>
              {isAdmin && (
                <Link href="/admin" style={{ color: 'var(--foreground)' }} className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors dark:border-amber-600 dark:bg-transparent dark:hover:bg-gray-700">
                  <span className="text-sm dark:text-white">⚙️</span>
                </Link>
              )}
            </nav>

            {/* Controles rápidos */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGamificationModal(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-yellow-200 text-base text-gray-600 hover:bg-yellow-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700 relative"
                aria-label="Ver progreso"
              >
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                {progress.level > 1 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {progress.level}
                  </span>
                )}
              </button>
              <button
                onClick={toggleDarkMode}
                className="h-9 w-9 rounded-full border border-yellow-200 text-base text-gray-600 hover:bg-yellow-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                aria-label="Alternar tema"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={toggleLanguage}
                style={{ color: 'var(--foreground)' }}
                className="h-9 px-3 rounded-full border border-yellow-200 text-sm font-semibold text-gray-700 hover:bg-yellow-50 transition-colors dark:text-white dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                aria-label="Cambiar idioma"
              >
                {language === 'es' ? 'EN' : 'ES'}
              </button>
            </div>
          </div>
        </div>
      </header>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      <GamificationModal
        isOpen={showGamificationModal}
        onClose={() => setShowGamificationModal(false)}
        progress={progress}
      />
    </>
  );
}
