'use client';

import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { STUDY_TRACKS } from '@/data/study-tracks';
import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TrayectosPage() {
  const { language } = useLanguage();

  const getTitle = (track: any) => {
    return track.title[language as keyof typeof track.title] || track.title.es;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12 pt-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-amber-900 dark:text-amber-500 mb-6">
            {language === 'es' ? 'Trayectos de Estudio' : language === 'pt' ? 'Trilhas de Estudo' : 'Study Tracks'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {language === 'es' 
              ? 'Profundiza en tu fe con nuestros caminos de aprendizaje estructurados.'
              : language === 'pt'
              ? 'Aprofunde sua fé com nossos caminhos de aprendizado estruturados.'
              : 'Deepen your faith with our structured learning paths.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STUDY_TRACKS.map((track, idx) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 p-4">
                {track.price === 'Soon' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {language === 'es' ? 'Próximamente' : language === 'pt' ? 'Em breve' : 'Coming Soon'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <Unlock className="w-3 h-3" />
                    {language === 'es' ? 'Disponible' : language === 'pt' ? 'Disponível' : 'Available'}
                  </span>
                )}
              </div>

              <div className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <track.icon className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {getTitle(track)}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {language === 'es' 
                    ? 'Explora las profundidades de la teología y la tradición.'
                    : language === 'pt'
                    ? 'Explore as profundezas da teologia e da tradição.'
                    : 'Explore the depths of theology and tradition.'}
                </p>

                <Link 
                  href={`/catholic-chat?track=${track.id}`}
                  className={`inline-flex items-center gap-2 font-semibold ${
                    track.price === 'Soon' 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-amber-600 dark:text-amber-500 hover:gap-3 transition-all'
                  }`}
                  onClick={(e) => track.price === 'Soon' && e.preventDefault()}
                >
                  {language === 'es' ? 'Comenzar trayecto' : language === 'pt' ? 'Começar trilha' : 'Start track'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
