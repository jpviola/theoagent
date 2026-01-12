'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <img 
              src="/theoagent-logo-horizontal.svg" 
              alt="SantaPalabra" 
              className="h-20 mx-auto mb-6"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            SantaPalabra
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Tu Catequista Digital Hispanoamericano
          </p>
          <p className="text-lg text-gray-500">
            Powered by Advanced AI & Catholic Tradition
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link 
            href="/catholic-chat"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Comenzar Chat Católico
          </Link>
          
          <Link 
            href="/test-rag"
            className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors shadow-lg hover:shadow-xl"
          >
            Probar Sistema RAG
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Tradición Católica</h3>
            <p className="text-gray-600">Fundamentado en la Sagrada Escritura, Tradición y Magisterio de la Iglesia</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Contexto Hispano</h3>
            <p className="text-gray-600">Especializado en la espiritualidad y teología latinoamericana</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">IA Avanzada</h3>
            <p className="text-gray-600">Potenciado por LangChain y modelos de lenguaje de última generación</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Desarrollado con amor para la comunidad católica hispanoamericana
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <span>🛡️ Ortodoxia Católica</span>
            <span>⚡ Respuestas Instantáneas</span>
            <span>📚 Fuentes Verificadas</span>
          </div>
        </div>
      </div>
    </div>
  );
}