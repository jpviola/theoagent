'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Header() {
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [selectedModel, setSelectedModel] = useState<'anthropic' | 'openai' | 'gemini' | 'llama'>('anthropic');
  const isChatPage =
    (pathname || '').startsWith('/catholic-chat') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/catholic-chat'));

  // Sincronizar el modelo seleccionado con localStorage para que esté disponible en la página de chat
  useEffect(() => {
    const savedModel = localStorage.getItem('santapalabra_selected_model');
    if (savedModel) {
      setSelectedModel(savedModel as typeof selectedModel);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('santapalabra_selected_model', selectedModel);
  }, [selectedModel]);

  if (isChatPage) {
    // Header especial para la página de chat: solo logo grande + leyenda, con donación/café destacados
    return (
      <header className="sticky top-0 z-50 w-full border-b border-yellow-200 bg-white/95 backdrop-blur-xl shadow-sm dark:bg-gray-900/95 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Logo x2 y leyenda en dos líneas */}
            <div className="flex w-full items-center justify-center gap-4 sm:w-auto sm:justify-start">
              <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 p-2 shadow-md dark:from-gray-800 dark:to-gray-700">
                <img src="/santapalabra-logo.svg" alt="SantaPalabra" className="h-full w-full object-contain" />
              </div>
              <div className="leading-tight">
                <div className="text-xl md:text-2xl font-black text-gray-900 tracking-tight dark:text-white">
                  SantaPalabra,
                </div>
                <div className="text-sm md:text-base text-gray-700 font-semibold dark:text-gray-200">
                  ¡Ruega por nosotros!
                </div>
              </div>
            </div>

            {/* Botones de donación y café más protagonistas */}
            <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end md:gap-4">
              <Link
                href="/support"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:text-black"
              >
                <span className="group-hover:animate-pulse text-xl">❤️</span>
                <span>¡Quiero donar!</span>
              </Link>
              <a
                href="https://www.buymeacoffee.com/santapalabra"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:text-white"
              >
                <span className="group-hover:animate-bounce text-xl">☕</span>
                <span>¡Quiero un café!</span>
              </a>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Header normal para otras páginas
  return (
    <header className="sticky top-0 z-50 w-full border-b border-yellow-200 bg-white/90 backdrop-blur-xl shadow-sm dark:bg-gray-900/90 dark:border-gray-700">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y título principal - más grande y prominente */}
          <Link href="/" className="flex items-center gap-4 group transition-transform hover:scale-[1.02]">
            <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 p-2 shadow-md group-hover:shadow-lg transition-shadow dark:from-gray-800 dark:to-gray-700">
              <img src="/santapalabra-logo.svg" alt="SantaPalabra" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-black text-gray-900 tracking-tight dark:text-white">SantaPalabra</div>
              <div className="text-sm text-gray-600 font-medium dark:text-gray-300">Catequista digital hispanoamericano</div>
            </div>
          </Link>

          {/* Navegación principal - más atractiva */}
          <nav className="hidden lg:flex items-center gap-1 bg-yellow-50 rounded-full p-2 border border-yellow-200 dark:bg-gray-800 dark:border-gray-600">
            <Link href="/catholic-chat" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
              <span className="text-lg">💬</span>
              Chat Católico
            </Link>
            <Link href="/blog" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
              <span className="text-lg">📖</span>
              Blog
            </Link>
            <Link href="/support" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all duration-200 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700">
              <span className="text-lg">🙏</span>
              Apoyar
            </Link>
            <Link href="/admin" className="flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 hover:shadow-sm transition-all duration-200 border border-amber-200 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-gray-700 dark:border-amber-600">
              <span className="text-sm">⚙️</span>
              Panel
            </Link>
          </nav>

          {/* Navegación móvil */}
          <nav className="flex lg:hidden items-center gap-2">
            <Link href="/catholic-chat" className="p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:hover:bg-gray-800">
              <span className="text-xl">💬</span>
            </Link>
            <Link href="/blog" className="p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:hover:bg-gray-800">
              <span className="text-xl">📖</span>
            </Link>
            <Link href="/support" className="p-2 rounded-lg hover:bg-yellow-50 transition-colors dark:hover:bg-gray-800">
              <span className="text-xl">🙏</span>
            </Link>
            <Link href="/admin" className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors border border-amber-200 dark:hover:bg-gray-800 dark:border-amber-600">
              <span className="text-sm">⚙️</span>
            </Link>
          </nav>

          {/* Botones de acción - más dinámicos */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-yellow-100/50 transition-colors border border-yellow-200 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={toggleLanguage}
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-yellow-100/50 transition-colors border border-yellow-200 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              {language === 'es' ? 'EN' : 'ES'}
            </button>
            <Link href="/support" className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:text-black">
              <span className="group-hover:animate-pulse">❤️</span>
              <span className="hidden sm:inline">¡Quiero donar!</span>
            </Link>
            <a href="https://www.buymeacoffee.com/santapalabra" target="_blank" rel="noreferrer" className="group relative hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 dark:text-white">
              <span className="group-hover:animate-bounce">☕</span>
              <span>¡Quiero un café!</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}