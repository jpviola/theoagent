'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProgress, GamificationModal } from '@/components/GamificationSystem';
import EmailSubscriptionModal from '@/components/EmailSubscriptionModal';
import { isUserSubscribed, subscribeToNewsletter } from '@/lib/subscription';
import { useState, useEffect } from 'react';
import { Trophy, Mail, User, LogIn, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { progress } = useUserProgress();
  const { user, profile } = useAuth();

  useEffect(() => {
    setIsSubscribed(isUserSubscribed());
  }, []);

  const handleSubscribe = async (email: string) => {
    await subscribeToNewsletter(email, language);
    setIsSubscribed(true);
    setShowSubscriptionModal(false);
  };

  const isChatPage =
    (pathname || '').startsWith('/catholic-chat') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/catholic-chat'));

  if (isChatPage) {
    // Header especial para la página de chat: solo logo grande + leyenda, con donación/café destacados
    return (
      <>
        <header className={`relative sticky top-0 z-50 w-full ${isDarkMode ? 'border-b border-transparent' : 'border-b border-amber-200'} bg-white/95 backdrop-blur-xl shadow-sm ${isDarkMode ? 'dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:bg-opacity-95' : ''}`}>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-black/10 dark:from-black/10 dark:to-black/20" />
            <div className="mx-auto max-w-7xl px-4 py-3 relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="flex w-full items-center justify-center gap-4 sm:w-auto sm:justify-start">
                <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-2 shadow-md dark:from-gray-700 dark:to-gray-600">
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
                <Link
                  href="/admin"
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors dark:text-purple-400 dark:border-purple-900 dark:hover:bg-purple-900/30"
                  aria-label="Administración"
                >
                  <Shield className="h-4 w-4" />
                </Link>
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
                  {isDarkMode ? '☀️' : '🌙'}
                </button>
                <Link
                  href="/support"
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:text-gray-100 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-600 dark:hover:to-amber-700"
                >
                  <span className="group-hover:animate-pulse text-xl">❤️</span>
                  <span>¡Quiero donar!</span>
                </Link>
                {/* Subscription Control for Chat Page */}
                {!isSubscribed && (
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50 text-sm font-semibold"
                  >
                    <Mail className="h-4 w-4" />
                    Suscribirse
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
        <EmailSubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscribe={handleSubscribe}
        />
        <GamificationModal
          isOpen={showGamificationModal}
          onClose={() => setShowGamificationModal(false)}
          progress={progress}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={user ? 'signin' : 'signin'} 
        />
      </>
    );
  }

  // Header normal para otras páginas
  return (
    <>
      <header className={`relative sticky top-0 z-50 w-full ${isDarkMode ? 'border-b border-transparent' : 'border-b border-amber-100'} bg-white/85 backdrop-blur-xl shadow-sm ${isDarkMode ? 'dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:bg-opacity-85' : ''}`}>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-black/8 dark:from-black/8 dark:to-black/18" />
        <div className="mx-auto max-w-7xl px-4 py-2.5 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo y título principal */}
            <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.01]">
              <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-2 shadow-sm group-hover:shadow-md transition-shadow dark:from-gray-700 dark:to-gray-600">
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
                  onClick={() => setShowSubscriptionModal(true)}
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
                  onClick={() => setShowSubscriptionModal(true)}
                  className="p-2 rounded-lg hover:bg-amber-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700"
                  aria-label="Suscribirse"
                >
                  <Mail className="h-5 w-5 dark:text-white" />
                </button>
              )}
              <Link href="/blog" style={{ color: 'var(--foreground)' }} className="p-2 rounded-lg hover:bg-amber-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700">
                <span className="text-lg dark:text-white">📖</span>
              </Link>
              <Link href="/sobre-nosotros" style={{ color: 'var(--foreground)' }} className="p-2 rounded-lg hover:bg-amber-50 transition-colors dark:bg-transparent dark:hover:bg-gray-700">
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
                onClick={() => user ? router.push('/admin') : setShowAuthModal(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-amber-200 text-base text-gray-600 hover:bg-amber-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                aria-label={user ? "Perfil" : "Iniciar sesión"}
              >
                {user ? (
                  <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <LogIn className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              <button
                onClick={toggleDarkMode}
                className="h-9 w-9 rounded-full border border-amber-200 text-base text-gray-600 hover:bg-amber-50 transition-colors dark:text-gray-100 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-700"
                aria-label="Alternar tema"
              >
                {isDarkMode ? '☀️' : '🌙'}
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
      <EmailSubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscribe={handleSubscribe}
      />
      <GamificationModal
        isOpen={showGamificationModal}
        onClose={() => setShowGamificationModal(false)}
        progress={progress}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={user ? 'signin' : 'signin'}
        redirectTo="/admin"
      />
    </>
  );
}
