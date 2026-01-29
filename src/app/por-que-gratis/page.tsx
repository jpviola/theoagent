'use client';

import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PorQueGratisPage() {
  const { language } = useLanguage();
  
  const titles = {
    es: '¿Por qué gratis?',
    pt: 'Por que grátis?',
    en: 'Why free?'
  };

  const content = {
    es: 'Santa Palabra es una herramienta de evangelización gratuita para llevar la luz del Evangelio y la riqueza del Magisterio a todos los rincones del mundo hispanohablante. Creemos que la verdad de la fe no debe tener barreras económicas.',
    pt: 'Santa Palavra é uma ferramenta de evangelização gratuita para levar a luz do Evangelho e a riqueza do Magistério a todos os cantos do mundo hispânico. Acreditamos que a verdade da fé não deve ter barreiras econômicas.',
    en: 'Santa Palabra is a free evangelization tool to bring the light of the Gospel and the richness of the Magisterium to all corners of the Spanish-speaking world. We believe that the truth of faith should have no economic barriers.'
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {titles[language as keyof typeof titles] || titles.es}
        </h1>
        <div className="prose dark:prose-invert">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {content[language as keyof typeof content] || content.es}
          </p>
        </div>
      </main>
    </div>
  );
}
