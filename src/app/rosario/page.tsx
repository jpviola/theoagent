'use client';

import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RosarioPage() {
  const { language } = useLanguage();
  
  const titles = {
    es: 'Rezar el Rosario',
    pt: 'Rezar o Terço',
    en: 'Pray the Rosary'
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {titles[language as keyof typeof titles] || titles.es}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'es' ? 'Próximamente...' : language === 'pt' ? 'Em breve...' : 'Coming soon...'}
        </p>
      </main>
    </div>
  );
}
