'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  LogIn, 
  LogOut,
  Zap,
  Globe,
  ChevronDown,
  Menu
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';

interface NavUser {
  email?: string | null;
}

type ChatModelId = 'anthropic' | 'openai' | 'llama';

interface NavBarProps {
  user?: NavUser | null;
  onNewChat: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  selectedModel: ChatModelId;
  onModelChange: (model: ChatModelId) => void;
  userXP?: number;
  onToggleSidebar?: () => void;
}

export default function NavBar({ 
  user, 
  onNewChat, 
  onSignIn, 
  onSignOut, 
  selectedModel, 
  onModelChange,
  userXP = 0,
  onToggleSidebar
}: NavBarProps) {
  const { language, setLanguage } = useLanguage();
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const texts = {
    es: {
      newChat: 'Nuevo Chat',
      backHome: 'Volver al Inicio',
      signIn: 'Iniciar Sesión',
      signOut: 'Cerrar Sesión',
      signedAs: 'Conectado como',
      selectModel: 'Seleccionar Modelo IA',
      selectLanguage: 'Idioma',
      xpPoints: 'XP'
    },
    pt: {
      newChat: 'Novo Chat',
      backHome: 'Voltar ao Início',
      signIn: 'Entrar',
      signOut: 'Sair',
      signedAs: 'Conectado como',
      selectModel: 'Selecionar Modelo IA',
      selectLanguage: 'Idioma',
      xpPoints: 'XP'
    },
    en: {
      newChat: 'New Chat',
      backHome: 'Back Home',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      signedAs: 'Signed in as',
      selectModel: 'Select AI Model',
      selectLanguage: 'Language',
      xpPoints: 'XP'
    }
  };

  const t = texts[language as keyof typeof texts] || texts.es;

  const models: { id: ChatModelId; name: string; cost: string; description: string }[] = [
    { 
      id: 'anthropic' as const, 
      name: 'Claude (Anthropic)',
      cost: '5 XP',
      description: language === 'es' ? 'Modelo recomendado' : language === 'pt' ? 'Modelo recomendado' : 'Recommended model'
    },
    { 
      id: 'openai' as const, 
      name: 'GPT-4 (OpenAI)',
      cost: '8 XP',
      description: language === 'es' ? 'Modelo premium' : language === 'pt' ? 'Modelo premium' : 'Premium model'
    },
    { 
      id: 'llama' as const, 
      name: 'Kimi / Llama (Open Source)',
      cost: '3 XP',
      description: language === 'es' ? 'Modelo económico (Kimi via OpenRouter)' : language === 'pt' ? 'Modelo econômico (Kimi via OpenRouter)' : 'Economic model (Kimi via OpenRouter)'
    }
  ];

  const languages = [
    { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
    { code: 'pt' as const, name: 'Português', flag: '🇧🇷' },
    { code: 'en' as const, name: 'English', flag: '🇺🇸' }
  ];

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-amber-200/50 dark:border-amber-700/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo & Home */}
          <div className="flex items-center gap-6">
            {onToggleSidebar && (
              <motion.button
                onClick={onToggleSidebar}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </motion.button>
            )}

            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <SantaPalabraLogo className="h-8 w-8 text-amber-600" />
              <span className="font-bold text-gray-900 dark:text-white text-lg hidden sm:block">
                SantaPalabra
              </span>
            </Link>

            <motion.button
              onClick={onNewChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t.newChat}
            </motion.button>
          </div>

          {/* Center Section - Model Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setShowModelSelector(!showModelSelector)}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded-lg transition-colors border border-purple-200 dark:border-purple-700"
            >
              <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100 hidden sm:block">
                {selectedModelData?.name}
              </span>
              <span className="text-xs bg-purple-200 dark:bg-purple-700 px-2 py-1 rounded-full text-purple-800 dark:text-purple-200">
                {selectedModelData?.cost}
              </span>
              <ChevronDown className={`h-4 w-4 text-purple-600 dark:text-purple-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-purple-200 dark:border-purple-700 p-2 z-50"
                >
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t.selectModel}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {language === 'es' ? 'Cada consulta gastará XP según el modelo elegido' : 
                       language === 'pt' ? 'Cada consulta gastará XP conforme o modelo escolhido' :
                       'Each query will spend XP according to the chosen model'}
                    </p>
                  </div>
                  <div className="space-y-1 p-1">
                    {models.map((model) => (
                      <motion.button
                        key={model.id}
                        onClick={() => {
                          onModelChange(model.id);
                          setShowModelSelector(false);
                        }}
                        whileHover={{ backgroundColor: 'rgba(139, 69, 19, 0.05)' }}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedModel === model.id 
                            ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {model.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {model.description}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              model.id === 'anthropic' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              model.id === 'openai' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}>
                              {model.cost}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section - Language, XP, User */}
          <div className="flex items-center gap-4">
            {/* XP Display */}
            {userXP > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-bold text-yellow-800 dark:text-yellow-400">
                  {userXP} {t.xpPoints}
                </span>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative">
              <motion.button
                onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-2xl">
                  {languages.find(l => l.code === language)?.flag}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${showLanguageSelector ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showLanguageSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50"
                  >
                    {languages.map((lang) => (
                      <motion.button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageSelector(false);
                        }}
                        whileHover={{ backgroundColor: 'rgba(139, 69, 19, 0.05)' }}
                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                          language === lang.code 
                            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {lang.name}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Section */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t.signedAs}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                    {user.email}
                  </p>
                </div>
                <motion.button
                  onClick={onSignOut}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title={t.signOut}
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={onSignIn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors font-medium"
              >
                <LogIn className="h-4 w-4" />
                {t.signIn}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
