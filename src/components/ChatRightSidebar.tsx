'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Book, Newspaper, Heart, FileText, Users, HelpCircle, Gift, Library, Facebook, Twitter, Instagram, Youtube, Map, PanelRightClose, PanelRightOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CC0License } from './CC0License';

export default function ChatRightSidebar() {
  const { language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    {
      href: '/principio-fundacional',
      icon: Book,
      label: {
        es: 'Principio Fundacional',
        pt: 'Princípio Fundacional',
        en: 'Foundational Principle'
      }
    },
    {
      href: '/trayectos',
      icon: Map,
      label: {
        es: 'Trayectos de estudio',
        pt: 'Trilhas de estudo',
        en: 'Study Tracks'
      }
    },
    {
      href: '/rosario',
      icon: Heart,
      label: {
        es: 'Rezar el Rosario',
        pt: 'Rezar o Terço',
        en: 'Pray the Rosary'
      }
    },
    {
      href: '/noticias',
      icon: Newspaper,
      label: {
        es: 'Noticias actuales',
        pt: 'Notícias atuais',
        en: 'Current News'
      }
    },
    {
      href: '/oraciones',
      icon: Heart,
      label: {
        es: 'Oraciones y devociones',
        pt: 'Orações e devoções',
        en: 'Prayers and Devotions'
      }
    },
    {
      href: '/resources',
      icon: Library,
      label: {
        es: 'Recursos',
        pt: 'Recursos',
        en: 'Resources'
      }
    },
    {
      href: '/liturgia',
      icon: Book,
      label: {
        es: 'Liturgia de las horas',
        pt: 'Liturgia das Horas',
        en: 'Liturgy of the Hours'
      }
    },
    {
      href: '/blog',
      icon: FileText,
      label: {
        es: 'Blog',
        pt: 'Blog',
        en: 'Blog'
      }
    },
    {
      href: '/sobre-nosotros',
      icon: Users,
      label: {
        es: 'Nosotros',
        pt: 'Nós',
        en: 'About Us'
      }
    },
    {
      href: '/support',
      icon: HelpCircle,
      label: {
        es: 'Ayuda',
        pt: 'Ajuda',
        en: 'Help'
      }
    },
    {
      href: '/por-que-gratis',
      icon: Gift,
      label: {
        es: '¿Por qué gratis?',
        pt: 'Por que grátis?',
        en: 'Why free?'
      }
    }
  ];

  return (
    <motion.aside 
      initial={{ width: isCollapsed ? '4rem' : '18rem' }}
      animate={{ width: isCollapsed ? '4rem' : '18rem' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col border-l border-amber-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm h-full overflow-hidden z-20 relative"
    >
      {/* Collapse Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-gray-400 hover:text-amber-600 dark:text-gray-500 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-amber-50 dark:hover:bg-gray-800"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <PanelRightOpen className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
        </button>
      </div>

      <div className={`p-4 flex flex-col h-full ${isCollapsed ? 'items-center' : ''}`}>
        {!isCollapsed && (
          <div className="mt-6 mb-2 px-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
            {language === 'es' ? 'Recursos' : language === 'pt' ? 'Recursos' : 'Resources'}
          </div>
        )}
        <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 dark:scrollbar-thumb-amber-800 scrollbar-track-transparent pr-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-800 rounded-xl transition-all group ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? (link.label[language as keyof typeof link.label] || link.label.es) : ''}
            >
              <link.icon className={`h-5 w-5 text-amber-500/70 group-hover:text-amber-600 transition-colors flex-shrink-0`} />
              {!isCollapsed && (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {link.label[language as keyof typeof link.label] || link.label.es}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-6 border-t border-amber-100 dark:border-gray-800 mt-auto flex-shrink-0"
          >
            <div className="flex justify-center gap-3">
               {/* Social Icons */}
               <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><Facebook className="h-4 w-4" /></a>
               <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-500 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><Twitter className="h-4 w-4" /></a>
               <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><Instagram className="h-4 w-4" /></a>
               <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><Youtube className="h-4 w-4" /></a>
            </div>
            <div className="mt-4 text-center">
              <div className="text-[10px] text-gray-400">
                <CC0License />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}
