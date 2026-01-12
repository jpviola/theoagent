'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';

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
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">✝</span>
          </div>
          <p className="text-amber-700 font-medium">Cargando SantaPalabra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-amber-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-yellow-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-amber-300 rounded-2xl flex items-center justify-center shadow-xl transform rotate-6 group-hover:rotate-12 transition-transform duration-300 border border-orange-300 p-1">
                  <SantaPalabraLogo size={40} className="transform -rotate-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-700 bg-clip-text text-transparent">
                  SantaPalabra
                </h1>
                <p className="text-xs text-yellow-700 font-semibold tracking-wider">
                  ✨ Catequista Digital IA
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-200">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-sm text-green-700 font-semibold">IA Disponible 24/7</span>
              </div>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                  <span className="text-amber-700 font-semibold">¡Bienvenido!</span>
                </div>
              ) : (
                <Link
                  href="/auth-test"
                  className="px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 border border-orange-300"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-40 h-40 bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-amber-200/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-orange-200/40 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-5 gap-16 items-center">
            <div className="lg:col-span-3 space-y-10">
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-100 to-amber-100 px-5 py-3 rounded-2xl border border-yellow-300 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-amber-800 text-sm font-bold tracking-wide">
                  ✨ Tradición Católica Hispanoamericana
                </span>
              </div>
              
              <div className="space-y-8 text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl xl:text-7xl font-black leading-none">
                  <div className="flex flex-col lg:flex-row items-center lg:items-end gap-4 lg:gap-6">
                    <div className="flex flex-col">
                      <span className="block text-gray-900">Conversa</span>
                      <span className="block text-gray-900">con</span>
                    </div>
                    <div className="relative group">
                      <SantaPalabraLogo size={200} className="animate-pulse hover:animate-none transition-all duration-300 transform hover:scale-105" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping shadow-lg"></div>
                    </div>
                  </div>
                </h1>
              </div>
              
              <p className="text-xl text-gray-700 leading-relaxed max-w-2xl">
                Descubre la riquísima espiritualidad de <span className="text-amber-600 font-bold">Santa Teresa de Ávila</span>, 
                <span className="text-orange-600 font-bold"> San Juan de la Cruz</span> y la teología del 
                <span className="text-yellow-700 font-bold"> CELAM</span>. Respuestas católicas auténticas, siempre disponibles.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <Link
                  href="/catholic-chat"
                  className="group relative inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-500 overflow-hidden border border-yellow-400"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="relative flex items-center">
                    💬 Comenzar Conversación
                    <svg className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                    </svg>
                  </span>
                </Link>
                
                <button className="group flex items-center justify-center space-x-4 px-8 py-5 bg-white/80 backdrop-blur border-2 border-yellow-400 text-yellow-700 font-bold text-lg rounded-3xl hover:bg-yellow-50 hover:border-amber-500 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span>🎬 Ver Demo</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-12 pt-10 border-t border-yellow-200">
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600 font-medium">Disponible</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">5K+</div>
                  <div className="text-sm text-gray-600 font-medium">Documentos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gray-900 mb-1">🇪🇸🌎</div>
                  <div className="text-sm text-gray-600 font-medium">Hispanoamérica</div>
                </div>
              </div>
            </div>

            {/* Chat Preview */}
            <div className="lg:col-span-2 relative lg:pl-8">
              <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-700 border border-yellow-100">
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-200 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg border border-orange-300 p-1">
                    <SantaPalabraLogo size={40} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">SantaPalabra IA</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Activo ahora</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5 py-6">
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-3xl rounded-tl-lg px-6 py-4 max-w-sm shadow-sm">
                      <p className="text-sm text-gray-800 font-medium">¡Hola! 🙏 Soy tu catequista digital. ¿En qué puedo ayudarte con tu fe hoy?</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-400 rounded-3xl rounded-tr-lg px-6 py-4 max-w-sm shadow-lg">
                      <p className="text-sm text-white font-medium">¿Podrías explicarme qué enseña Santa Teresa sobre la oración contemplativa?</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-3xl rounded-tl-lg px-6 py-4 max-w-sm shadow-sm">
                      <p className="text-sm text-gray-800 font-medium">Santa Teresa describe la oración como "un trato de amistad, estando muchas veces tratando a solas con quien sabemos nos ama"... ✨</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                  <div className="flex-1 bg-gray-50 rounded-full px-6 py-3 border border-gray-200">
                    <span className="text-sm text-gray-500 font-medium">Escribe tu pregunta aquí...</span>
                  </div>
                  <button className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-300 rounded-full mix-blend-multiply animate-bounce opacity-60 shadow-lg"></div>
              <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full mix-blend-multiply animate-pulse opacity-60 shadow-lg"></div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-100 to-amber-100 px-5 py-3 rounded-2xl border border-yellow-400 shadow-sm mb-8">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-800 font-bold tracking-wide">Espiritualidad Auténtica</span>
              </div>
              
              <h2 className="text-5xl font-black text-gray-900 mb-6">
                La Riquísima 
                <span className="block bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-700 bg-clip-text text-transparent mt-2">
                  Tradición Hispanoamericana
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Uniendo la mística española con la teología latinoamericana para servir a toda la comunidad católica hispanoamericana
              </p>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 rounded-3xl p-10 relative overflow-hidden border border-yellow-300 shadow-xl">
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
                        Mística Española
                        <span className="block text-2xl text-yellow-700 font-medium mt-2">
                          Los grandes santos de España
                        </span>
                      </h3>
                      <p className="text-lg text-gray-700 max-w-xl leading-relaxed">
                        La tradición contemplativa más profunda de la Iglesia católica, 
                        desde los místicos carmelitas hasta los grandes reformadores jesuitas.
                      </p>
                    </div>
                    <div className="hidden lg:block text-8xl opacity-20 transform rotate-12">🇪🇸</div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-yellow-300">
                        <span className="text-2xl">📿</span>
                      </div>
                      <h4 className="font-black text-gray-900 mb-3 text-lg">Santa Teresa de Ávila</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">Doctora de la Iglesia, las Moradas del alma, reformadora carmelita</p>
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-orange-300">
                        <span className="text-2xl">🌙</span>
                      </div>
                      <h4 className="font-black text-gray-900 mb-3 text-lg">San Juan de la Cruz</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">La noche oscura del alma, Cántico Espiritual, unión mística</p>
                    </div>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-blue-300">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <h4 className="font-black text-gray-900 mb-3 text-lg">San Ignacio de Loyola</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">Ejercicios Espirituales, discernimiento, espiritualidad jesuita</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-yellow-400 to-amber-400 rounded-full mix-blend-multiply opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
              </div>
              
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl p-8 relative overflow-hidden border border-green-200 shadow-xl">
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-gray-900 mb-4">5,000+</h3>
                    <p className="text-gray-700 mb-6 font-medium leading-relaxed">
                      Documentos católicos auténticos procesados por nuestra IA especializada
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                      <span className="text-sm text-green-700 font-bold">Actualizándose constantemente</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 text-9xl opacity-10 transform rotate-12">📚</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-8 relative overflow-hidden border border-blue-200 shadow-xl">
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-gray-900 mb-4">24/7</h3>
                    <p className="text-gray-700 mb-6 font-medium leading-relaxed">
                      Tu catequista personal siempre disponible para guiarte en la fe
                    </p>
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 bg-yellow-400 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold">🇪🇸</span>
                      </div>
                      <div className="w-10 h-10 bg-green-400 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold">🇲🇽</span>
                      </div>
                      <div className="w-10 h-10 bg-blue-400 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold">🇦🇷</span>
                      </div>
                      <div className="w-10 h-10 bg-red-400 rounded-full border-3 border-white flex items-center justify-center shadow-lg">
                        <span className="text-sm font-bold">+</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 -right-6 text-9xl opacity-10">⏰</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth CTA */}
        {!user && (
          <div className="relative py-32 bg-gradient-to-r from-amber-600 via-orange-600 to-red-500">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-4xl mx-auto px-6 text-center">
              <div className="bg-white/15 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
                <h2 className="text-4xl font-black text-white mb-6">
                  Únete a la Comunidad
                  <span className="block text-3xl font-light mt-2 text-amber-100">
                    Católica Hispanoamericana
                  </span>
                </h2>
                <p className="text-amber-100 text-xl mb-10 leading-relaxed">
                  Crea tu cuenta gratuita para guardar tus conversaciones espirituales y conectar con otros católicos de España y América Latina.
                </p>
                <Link 
                  href="/auth-test" 
                  className="inline-flex items-center px-10 py-5 bg-white text-amber-700 font-black text-lg rounded-2xl hover:bg-amber-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  <span className="mr-3 text-xl">🙏</span>
                  Crear Cuenta Gratuita
                  <span className="ml-3 text-xl">→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="flex justify-center items-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-amber-300 rounded-3xl flex items-center justify-center mr-6 shadow-xl border border-orange-300 p-2">
                  <SantaPalabraLogo size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                    SantaPalabra.app
                  </h3>
                  <p className="text-gray-400 font-semibold tracking-wide">✨ Catequista Digital Hispanoamericano</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-lg max-w-3xl mx-auto mb-12 leading-relaxed">
                Uniendo la riquísima tradición mística española con la teología latinoamericana 
                para servir a toda la comunidad católica hispanoamericana con la mejor tecnología de IA.
              </p>
              
              <div className="flex justify-center flex-wrap gap-6 text-gray-400 mb-12">
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full">
                  <span className="text-lg">🇪🇸</span>
                  <span className="font-medium">España</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full">
                  <span className="text-lg">🇲🇽</span>
                  <span className="font-medium">México</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full">
                  <span className="text-lg">🇦🇷</span>
                  <span className="font-medium">Argentina</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full">
                  <span className="text-lg">🇨🇴</span>
                  <span className="font-medium">Colombia</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-full">
                  <span className="text-lg">🇺🇸</span>
                  <span className="font-medium">USA Latinos</span>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-10 text-gray-400">
                <p className="text-lg font-medium mb-3">
                  © 2026 SantaPalabra.app - Hecho con ❤️ para la comunidad católica hispanoamericana.
                </p>
                <p className="text-amber-400 font-semibold text-lg italic">
                  "La palabra de Dios es viva y eficaz" - Hebreos 4:12
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}