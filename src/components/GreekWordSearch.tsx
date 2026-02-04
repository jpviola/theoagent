'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Search, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { GREEK_BOOKS } from '@/lib/greek-bible-data';

type SearchResult = {
  book_id: string;
  chapter: number;
  verse: number;
  text_content: string;
  matching_word: string;
};

export default function GreekWordSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'lemma' | 'form'>('lemma');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      // We search in greek_bible_words and join with greek_bible_verses
      // Supabase join syntax: 
      // select('*, greek_bible_verses(*)')
      
      const column = searchType === 'lemma' ? 'lemma' : 'text';
      
      const { data, error } = await supabase
        .from('greek_bible_words')
        .select(`
          text,
          lemma,
          greek_bible_verses (
            book_id,
            chapter,
            verse,
            text_content
          )
        `)
        .ilike(column, query) // Case insensitive match
        .limit(20);

      if (error) throw error;

      if (data) {
        const formattedResults: SearchResult[] = data.map((item: any) => ({
          book_id: item.greek_bible_verses.book_id,
          chapter: item.greek_bible_verses.chapter,
          verse: item.greek_bible_verses.verse,
          text_content: item.greek_bible_verses.text_content,
          matching_word: item.text
        }));
        
        // Deduplicate by verse
        const uniqueResults = formattedResults.filter((v, i, a) => 
          a.findIndex(t => t.book_id === v.book_id && t.chapter === v.chapter && t.verse === v.verse) === i
        );
        
        setResults(uniqueResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-amber-50 dark:bg-gray-900/50 border-b border-amber-100 dark:border-gray-700">
        <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Buscador de Términos Griegos
        </h3>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative grow">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'lemma' ? "Buscar por lema (ej. λόγος)" : "Buscar por forma exacta"}
              className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'lemma' | 'form')}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="lemma">Lema</option>
            <option value="form">Forma</option>
          </select>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
          </button>
        </form>
      </div>

      <div className="max-h-64 overflow-y-auto p-2">
        {results.length > 0 ? (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div key={idx} className="p-3 hover:bg-amber-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-transparent hover:border-amber-100 dark:hover:border-gray-600">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-amber-800 dark:text-amber-200">
                    {GREEK_BOOKS.find(b => b.id === result.book_id)?.name || result.book_id} {result.chapter}:{result.verse}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {result.matching_word}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-serif text-lg leading-relaxed">
                  {result.text_content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {loading ? 'Buscando...' : 'Ingresa una palabra griega para buscar en el Nuevo Testamento'}
          </div>
        )}
      </div>
    </div>
  );
}
