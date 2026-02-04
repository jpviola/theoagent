'use client';

import React, { useState, useEffect } from 'react';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { supabase } from '@/lib/supabase-client';
import { ChevronLeft, ChevronRight, Book, Loader2 } from 'lucide-react';
import { GREEK_BOOKS } from '@/lib/greek-bible-data';

type Word = {
  id: string;
  text: string;
  lemma: string;
  morphology: string;
  part_of_speech: string;
  normalized: string;
  word_order: number;
};

type Verse = {
  id: string;
  verse: number;
  text_content: string;
  words: Word[];
};

export default function GreekBibleReader() {
  const [selectedBook, setSelectedBook] = useQueryState('book', parseAsString.withDefault('Mt'));
  const [selectedChapter, setSelectedChapter] = useQueryState('chapter', parseAsInteger.withDefault(1));
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [definition, setDefinition] = useState<any | null>(null);

  // Fetch verses when book/chapter changes
  useEffect(() => {
    async function fetchChapter() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('greek_bible_verses')
          .select('verse, text_content')
          .eq('book_id', selectedBook)
          .eq('chapter', selectedChapter)
          .order('verse', { ascending: true });

        if (error) throw error;
        setVerses(data || []);
      } catch (err) {
        console.error('Error fetching chapter:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchChapter();
  }, [selectedBook, selectedChapter]);

  // Handle word click
  const handleWordClick = async (word: Word) => {
    setSelectedWord(word);
    setDefinition(null); // Reset definition
    
    // Fetch definition
    try {
      const { data, error } = await supabase
        .from('greek_definitions')
        .select('*')
        .eq('lemma', word.lemma)
        .single();
        
      if (data) {
        setDefinition(data);
      }
    } catch (err) {
      console.error('Error fetching definition:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-gray-700">
        <select 
          value={selectedBook}
          onChange={(e) => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
        >
          {GREEK_BOOKS.map(book => (
            <option key={book.id} value={book.id}>{book.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
            disabled={selectedChapter <= 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-bold min-w-[3ch] text-center">{selectedChapter}</span>
          
          <button 
            onClick={() => setSelectedChapter(selectedChapter + 1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-gray-700 p-6 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : verses.length > 0 ? (
            <div className="space-y-4">
              {verses.map((v) => (
                <div key={v.verse} className="flex gap-4">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 select-none min-w-6">
                    {v.verse}
                  </span>
                  <p className="font-serif text-xl leading-relaxed text-gray-800 dark:text-gray-200 flex flex-wrap gap-1">
                    {v.words && v.words.length > 0 ? (
                      v.words.map((word: any) => (
                        <span 
                          key={word.id}
                          onClick={() => handleWordClick(word)}
                          className={`cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded px-0.5 transition-colors ${selectedWord?.id === word.id ? 'bg-amber-200 dark:bg-amber-800' : ''}`}
                        >
                          {word.text}
                        </span>
                      ))
                    ) : (
                      v.text_content
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              No text available. Please run the migration script to populate the database.
            </div>
          )}
        </div>

        {/* Word Details Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-amber-50 dark:bg-gray-900 rounded-xl p-4 border border-amber-100 dark:border-gray-700">
            <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
              <Book className="size-4" />
              Análisis Morfológico
            </h3>
            
            {selectedWord ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Palabra</label>
                  <div className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                    {selectedWord.text}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Lema</label>
                    <div className="font-serif text-lg text-amber-700 dark:text-amber-300">
                      {selectedWord.lemma}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Normalizada</label>
                    <div className="font-serif text-lg text-gray-700 dark:text-gray-300">
                      {selectedWord.normalized}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Morfología</label>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-amber-100 dark:border-gray-700 text-sm font-mono">
                    <div className="mb-1"><span className="text-gray-500">POS:</span> {selectedWord.part_of_speech}</div>
                    <div><span className="text-gray-500">Parsing:</span> {selectedWord.morphology}</div>
                  </div>
                </div>
                
                {definition ? (
                  <div className="mt-4 pt-4 border-t border-amber-100 dark:border-gray-700">
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Definición (Laparola)</label>
                    
                    {definition.definition_short && (
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {definition.definition_short}
                      </div>
                    )}
                    
                    {definition.definition_full && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {definition.definition_full}
                      </div>
                    )}
                    
                    {definition.strong_code && (
                      <div className="mt-2 text-xs text-amber-600">
                        Strong: {definition.strong_code}
                      </div>
                    )}
                  </div>
                ) : (
                   <div className="text-xs text-gray-400 mt-4 italic">
                     Cargando definición o no disponible...
                   </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic text-center py-8">
                Selecciona una palabra del texto para ver su análisis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
