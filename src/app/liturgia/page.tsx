'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, Calendar, ChevronRight, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface LiturgyItem {
  date: string;
  url: string;
  title: string;
  hours?: Record<string, string>;
  scrapedAt: string;
}

export default function LiturgyPage() {
  const { language } = useLanguage();
  const [liturgyData, setLiturgyData] = useState<LiturgyItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LiturgyItem | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/liturgy');
        if (response.ok) {
          const data = await response.json();
          // Sort by date descending (newest first) or ascending? Usually people want today.
          // Let's sort to ensure today is easily visible.
          setLiturgyData(data);
        }
      } catch (e) {
        console.error("Failed to load liturgy data", e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Reset selected hour when item changes
  useEffect(() => {
    setSelectedHour(null);
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <Link href="/catholic-chat" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2">
              <Book className="w-8 h-8" />
              {language === 'es' ? 'Liturgia de las Horas' : language === 'pt' ? 'Liturgia das Horas' : 'Liturgy of the Hours'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {language === 'es' ? 'Oración oficial de la Iglesia' : language === 'pt' ? 'Oração oficial da Igreja' : 'Official prayer of the Church'}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        ) : selectedHour && selectedItem && selectedItem.hours ? (
          // View: Specific Hour Content
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-10 border border-amber-100 dark:border-amber-900/30"
          >
            <button 
              onClick={() => setSelectedHour(null)}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'es' ? 'Volver a las horas' : 'Back to hours'}
            </button>
            
            <h2 className="text-2xl font-serif font-bold mb-2 capitalize text-amber-800 dark:text-amber-500">
              {selectedHour}
            </h2>
            <p className="text-sm text-gray-500 mb-6">{selectedItem.title} - {selectedItem.date}</p>
            
            <div 
              className="prose dark:prose-invert max-w-none prose-amber prose-headings:font-serif prose-p:font-serif"
              dangerouslySetInnerHTML={{ __html: selectedItem.hours[selectedHour] }}
            />
          </motion.div>
        ) : selectedItem ? (
          // View: List of Hours for a Day
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'es' ? 'Volver a los días' : 'Back to days'}
            </button>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/30">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {selectedItem.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {selectedItem.date}
              </p>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              {selectedItem.hours && Object.keys(selectedItem.hours).length > 0 ? (
                Object.keys(selectedItem.hours).map((hourKey, idx) => (
                  <motion.button
                    key={hourKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedHour(hourKey)}
                    className="text-left bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-lg capitalize text-gray-700 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        {hourKey}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500" />
                  </motion.button>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  {language === 'es' ? 'No hay horas disponibles para este día.' : 'No hours available for this day.'}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // View: List of Days
          <div className="grid gap-4">
            {liturgyData.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <Book className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {language === 'es' ? 'No hay datos de liturgia disponibles.' : 'No liturgy data available.'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                   Run `npm run scrape:liturgy` to populate.
                </p>
              </div>
            ) : (
              liturgyData.map((item, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedItem(item)}
                  className="w-full text-left bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 transition-colors" />
                </motion.button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
