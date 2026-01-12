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
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SantaPalabra.app</h1>
              <span className="ml-2 text-sm text-gray-500">IA Católica para Hispanoamérica</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">Bienvenido, {user.email || 'Usuario'}</span>
                  <button
                    onClick={async () => await supabase.auth.signOut()}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/auth-test"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="text-blue-600">SantaPalabra.app</span>
            <span className="block text-3xl md:text-4xl mt-2">Catequista Digital Hispanoamericano</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Accede a la auténtica enseñanza católica del Catecismo, documentos papales, CELAM, mística española y Sagrada Escritura. 
            Obtén respuestas teológicamente sólidas con la riqueza de la tradición hispanoamericana.
          </p>
          
          {/* Quick Start Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catholic-chat"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Iniciar Conversación Católica
            </Link>
            <Link
              href="/test-rag"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Interfaz de Pruebas
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enseñanza Multi-Fuente</h3>
              <p className="text-gray-600">
                Accede a enseñanzas del Catecismo, documentos papales, CELAM, mística española, Vaticano II y reflexiones del Evangelio diario.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Doctrinalmente Sólido</h3>
              <p className="text-gray-600">
                Todas las respuestas se basan en la enseñanza oficial de la Iglesia y fuentes católicas autorizadas.
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pregunta Cualquier Cosa</h3>
              <p className="text-gray-600">
                Preguntas sobre teología, espiritualidad, sacramentos, moral y vida católica hispanoamericana.
              </p>
            </div>
          </div>
        </div>

        {/* Example Questions */}
        <div className="mt-20 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Preguntas de Ejemplo</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Teología y Doctrina</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• ¿Qué enseña la Iglesia Católica sobre la Trinidad?</li>
                <li>• ¿Cómo entiende la Iglesia la salvación?</li>
                <li>• ¿Cuál es el significado de la Eucaristía?</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Espiritualidad Hispanoamericana</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• ¿Qué enseña Santa Teresa de Ávila sobre la oración?</li>
                <li>• ¿Cuál es la importancia de la Virgen de Guadalupe?</li>
                <li>• ¿Qué es la noche oscura según San Juan de la Cruz?</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Authentication Status */}
        {!user && (
          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800">
                <Link href="/auth-test" className="font-semibold hover:underline">
                  Inicia sesión o crea una cuenta
                </Link>
                {" "}para acceder a funciones adicionales y guardar tu historial de conversaciones.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}