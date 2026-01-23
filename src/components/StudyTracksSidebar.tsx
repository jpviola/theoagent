import React from 'react';
import { Book, Scroll, History, Calendar, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudyTrack {
  id: string;
  title: { es: string; pt: string; en: string };
  price: string;
  icon: React.ElementType;
}

export const STUDY_TRACKS: StudyTrack[] = [
  {
    id: 'dogmatic-theology',
    title: { es: 'Teología Dogmática', pt: 'Teologia Dogmática', en: 'Dogmatic Theology' },
    price: '$29.00',
    icon: Book
  },
  {
    id: 'biblical-theology',
    title: { es: 'Teología Bíblica', pt: 'Teologia Bíblica', en: 'Biblical Theology' },
    price: '$29.00',
    icon: Scroll
  },
  {
    id: 'church-history',
    title: { es: 'Historia de la Iglesia', pt: 'História da Igreja', en: 'Church History' },
    price: '$24.00',
    icon: History
  },
  {
    id: 'bible-study-plan',
    title: { es: 'Plan de Estudio Bíblico', pt: 'Plano de Estudo Bíblico', en: 'Bible Study Plan' },
    price: '$49.00/yr',
    icon: Calendar
  },
  {
    id: 'biblical-greek',
    title: { es: 'Griego Bíblico', pt: 'Grego Bíblico', en: 'Biblical Greek' },
    price: '$35.00',
    icon: Scroll
  },
  {
    id: 'ecclesiastical-latin',
    title: { es: 'Latín Eclesiástico', pt: 'Latim Eclesiástico', en: 'Ecclesiastical Latin' },
    price: '$35.00',
    icon: Book
  }
];

interface StudyTracksSidebarProps {
  onSelectTrack: (trackId: string) => void;
  selectedTrackId: string | null;
}

export function StudyTracksSidebar({ onSelectTrack, selectedTrackId }: StudyTracksSidebarProps) {
  const { language } = useLanguage();
  
  // Helper to safely get title
  const getTitle = (track: StudyTrack) => {
    return track.title[language as keyof typeof track.title] || track.title.es;
  };

  return (
    <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {language === 'es' ? 'Trayectos de Estudio' : 
           language === 'pt' ? 'Trilhas de Estudo' : 'Study Tracks'}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <div className="space-y-0.5 px-2">
          {STUDY_TRACKS.map((track) => {
            const Icon = track.icon;
            const isSelected = selectedTrackId === track.id;
            
            return (
              <button
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-md transition-colors group ${
                  isSelected 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center min-w-0 flex-1 mr-2">
                  <Icon className={`mr-2.5 h-4 w-4 flex-shrink-0 ${
                    isSelected ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  <span className="truncate text-left">{getTitle(track)}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                   <Lock className="h-2.5 w-2.5 text-gray-400 mr-1" />
                   <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                     {track.price}
                   </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-xs text-gray-500 text-center">
          {language === 'es' ? 'Chat Gratuito Limitado' : 
           language === 'pt' ? 'Chat Gratuito Limitado' : 'Limited Free Chat'}
        </div>
      </div>
    </div>
  );
}
