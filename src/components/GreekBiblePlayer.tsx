
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BIBLE_BOOKS } from '@/lib/bible-constants';
import { motion } from 'framer-motion';
import { Book, Play, Pause, ChevronRight } from 'lucide-react';

export default function GreekBiblePlayer() {
  const [selectedBook, setSelectedBook] = useState<string>('MAT'); // Default to Matthew
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [content, setContent] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current book details
  const currentBook = BIBLE_BOOKS.find(b => b.code === selectedBook);

  useEffect(() => {
    async function fetchChapter() {
      if (!selectedBook || !selectedChapter) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('greek_bible')
          .select('content_text, audio_url')
          .eq('book', selectedBook)
          .eq('chapter', selectedChapter)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
             // No rows found
             setContent(null);
             setAudioUrl(null);
             setError('Capítulo no disponible / Chapter not available');
          } else {
             throw error;
          }
        } else if (data) {
          setContent(data.content_text);
          setAudioUrl(data.audio_url);
        }
      } catch (err) {
        console.error('Error fetching Greek Bible:', err);
        setError('Error loading content');
      } finally {
        setLoading(false);
      }
    }
    
    fetchChapter();
  }, [selectedBook, selectedChapter]);

  // Handle Book Change
  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBook(e.target.value);
    setSelectedChapter(1); // Reset to chapter 1
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-amber-100 dark:border-amber-900 overflow-hidden">
      <div className="bg-amber-50 dark:bg-amber-900/30 p-4 border-b border-amber-100 dark:border-amber-800">
        <h3 className="text-lg font-serif font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2">
           <Book className="w-5 h-5" />
           Biblia en Griego (TGV)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Traducción en Griego Moderno con Audio
        </p>
      </div>
      
      <div className="p-4 md:p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Libro / Book</label>
            <select 
              value={selectedBook}
              onChange={handleBookChange}
              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              {BIBLE_BOOKS.map(book => (
                <option key={book.code} value={book.code}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-24">
             <label className="block text-xs font-medium text-gray-500 mb-1">Cap. / Ch.</label>
             <select 
               value={selectedChapter}
               onChange={(e) => setSelectedChapter(Number(e.target.value))}
               className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none"
             >
               {currentBook && Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(num => (
                 <option key={num} value={num}>{num}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
           <div className="py-12 flex justify-center text-amber-600">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-current"></div>
           </div>
        ) : error ? (
           <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
             {error}
           </div>
        ) : (
           <div className="space-y-4">
              {/* Audio Player */}
              {audioUrl && (
                <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg flex items-center justify-center">
                  <audio 
                    controls 
                    src={audioUrl} 
                    className="w-full h-10"
                    key={audioUrl} // Force reload on url change
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              
              {/* Text */}
              {content ? (
                <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 font-serif leading-relaxed max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-lg">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Selecciona un capítulo para leer y escuchar.
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
