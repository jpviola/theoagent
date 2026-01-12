'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      quote: "SantaPalabra me ha ayudado a profundizar mi oración contemplativa",
      author: "María Elena",
      location: "México",
      icon: "🙏"
    },
    {
      quote: "Increíble conocimiento sobre la tradición carmelita",
      author: "Fr. José Luis",
      location: "Colombia",
      icon: "📿"
    },
    {
      quote: "Respuestas claras sobre la teología latinoamericana",
      author: "Ana Sofía",
      location: "Argentina",
      icon: "✨"
    }
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      subscription.unsubscribe();
      clearInterval(testimonialInterval);
      observer.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-stars animate-twinkle opacity-30"></div>
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-gold-400 to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-2xl transform animate-pulse border-4 border-white/20">
              <span className="text-white font-bold text-2xl drop-shadow-lg">✝</span>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-gold-300 to-amber-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
          </div>
          <p className="text-white font-medium text-lg tracking-wide">Cargando SantaPalabra...</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-stars animate-twinkle opacity-20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-gold-500/20 to-amber-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20 p-1">
                  <SantaPalabraLogo size={44} className="drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse shadow-lg border-2 border-white"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gold-400 to-amber-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-gold-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent drop-shadow-sm">
                  SantaPalabra
                </h1>
                <p className="text-xs text-gold-200/80 font-semibold tracking-wider flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Catequista Digital IA
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl px-5 py-3 rounded-2xl border border-green-400/30 shadow-lg">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-green-100 font-semibold">IA Disponible 24/7</span>
              </div>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/20">
                    <span className="text-white text-sm font-bold drop-shadow">U</span>
                  </div>
                  <span className="text-gold-200 font-semibold">¡Bienvenido!</span>
                </div>
              ) : (
                <Link
                  href="/auth-test"
                  className="group relative px-8 py-3 bg-gradient-to-r from-gold-500 to-amber-500 text-white font-bold rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gold-400/50 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-gold-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    <span className="mr-2">✨</span>
                    Iniciar Sesión
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10" ref={heroRef}>
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            {/* Left Column - Content */}
            <div className={`space-y-10 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
              <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-gold-500/20 to-amber-500/20 backdrop-blur-xl px-6 py-4 rounded-2xl border border-gold-400/30 shadow-xl">
                <div className="relative">
                  <div className="w-3 h-3 bg-gold-400 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-gold-500 rounded-full"></div>
                </div>
                <span className="text-gold-200 text-sm font-bold tracking-wide">
                  ✨ Tradición Católica Hispanoamericana
                </span>
              </div>
              
              <div className="space-y-8">
                <h1 className="text-5xl lg:text-7xl font-black leading-none">
                  <div className="flex flex-col space-y-2">
                    <span className="text-white drop-shadow-2xl">Tu</span>
                    <span className="bg-gradient-to-r from-gold-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent drop-shadow-lg">
                      Catequista
                    </span>
                    <span className="text-white drop-shadow-2xl">Digital</span>
                  </div>
                </h1>
                
                <p className="text-xl text-blue-100/90 leading-relaxed max-w-2xl font-light">
                  Descubre la riquísima espiritualidad de <span className="text-gold-300 font-semibold">Santa Teresa de Ávila</span>, 
                  <span className="text-amber-300 font-semibold"> San Juan de la Cruz</span> y la teología del 
                  <span className="text-yellow-300 font-semibold"> CELAM</span>. Respuestas católicas auténticas, siempre disponibles.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                  <Link
                    href="/catholic-chat"
                    className="group relative inline-flex items-center justify-center px-12 py-5 bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 text-white font-bold text-xl rounded-3xl shadow-2xl hover:shadow-gold-500/25 transform hover:scale-105 transition-all duration-500 overflow-hidden border-2 border-gold-400/50"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="relative flex items-center">
                      <span className="mr-3 text-2xl">🙏</span>
                      Comenzar Conversación
                      <svg className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                      </svg>
                    </span>
                  </Link>
                  
                  <button className="group flex items-center justify-center space-x-4 px-8 py-5 bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white font-bold text-lg rounded-3xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-xl">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    <span>🎬 Ver Demo</span>
                  </button>
                </div>
                
                {/* Stats */}
                <div className="flex items-center space-x-12 pt-10 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1">24/7</div>
                    <div className="text-sm text-blue-200 font-medium">Disponible</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1">5K+</div>
                    <div className="text-sm text-blue-200 font-medium">Documentos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1">🌎</div>
                    <div className="text-sm text-blue-200 font-medium">Hispanoamérica</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Interactive Chat Preview */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl p-8 max-w-lg mx-auto border border-white/20 hover:bg-white/15 transition-all duration-700">
                {/* Chat Header */}
                <div className="flex items-center space-x-4 pb-6 border-b border-white/20">
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/20 p-1">
                      <SantaPalabraLogo size={44} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg drop-shadow">SantaPalabra IA</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-300 font-medium">Activo ahora</span>
                    </div>
                  </div>
                </div>
                
                {/* Chat Messages */}
                <div className="space-y-6 py-6">
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-3xl rounded-tl-lg px-6 py-4 max-w-sm shadow-xl">
                      <p className="text-sm text-white font-medium">¡Hola! 🙏 Soy tu catequista digital. ¿En qué puedo ayudarte con tu fe hoy?</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-br from-gold-500 to-amber-500 rounded-3xl rounded-tr-lg px-6 py-4 max-w-sm shadow-2xl border border-gold-400/50">
                      <p className="text-sm text-white font-medium drop-shadow">¿Podrías explicarme qué enseña Santa Teresa sobre la oración contemplativa?</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 rounded-3xl rounded-tl-lg px-6 py-4 max-w-sm shadow-xl">
                      <p className="text-sm text-white font-medium">Santa Teresa describe la oración como un trato de amistad, estando muchas veces tratando a solas con quien sabemos nos ama... ✨</p>
                    </div>
                  </div>
                </div>
                
                {/* Input Area */}
                <div className="flex items-center space-x-3 pt-4 border-t border-white/20">
                  <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20">
                    <span className="text-sm text-white/60 font-medium">Escribe tu pregunta aquí...</span>
                  </div>
                  <button className="w-12 h-12 bg-gradient-to-br from-gold-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl hover:shadow-gold-500/25 transition-all duration-300 hover:scale-110 border-2 border-gold-400/50">
                    <svg className="w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Floating Decorations */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-gold-400/30 to-amber-400/30 rounded-full backdrop-blur-xl animate-float opacity-80 shadow-2xl"></div>
              <div className="absolute -bottom-12 -left-12 w-20 h-20 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full backdrop-blur-xl animate-float-delayed opacity-80 shadow-2xl"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative py-20 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-gold-500/20 to-amber-500/20 backdrop-blur-xl px-6 py-3 rounded-2xl border border-gold-400/30 shadow-xl mb-8">
              <div className="w-3 h-3 bg-gold-400 rounded-full animate-pulse"></div>
              <span className="text-gold-200 font-bold tracking-wide">Espiritualidad Auténtica</span>
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-black text-center mb-6">
              <span className="text-white drop-shadow-2xl">La Riquísima</span>
              <span className="block bg-gradient-to-r from-gold-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent mt-2 drop-shadow-lg">
                Tradición Hispanoamericana
              </span>
            </h2>
            
            <p className="text-xl text-blue-100/80 max-w-3xl mx-auto leading-relaxed font-light">
              Uniendo la mística española con la teología latinoamericana para servir a toda la comunidad católica hispanoamericana
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Mística Española */}
            <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:border-gold-400/50 transition-all duration-500 hover:bg-white/15 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gold-500 to-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-3xl">🇪🇸</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Mística Española</h3>
                <p className="text-blue-200/80">Los grandes santos de España</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gold-400 rounded-full"></div>
                  <span className="text-white font-medium">Santa Teresa de Ávila</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <span className="text-white font-medium">San Juan de la Cruz</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-white font-medium">San Ignacio de Loyola</span>
                </div>
              </div>
            </div>

            {/* Teología Latinoamericana */}
            <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:border-emerald-400/50 transition-all duration-500 hover:bg-white/15 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-3xl">🌎</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">CELAM</h3>
                <p className="text-blue-200/80">Teología Latinoamericana</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  <span className="text-white font-medium">Evangelización</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white font-medium">Justicia Social</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-lime-400 rounded-full"></div>
                  <span className="text-white font-medium">Inculturación</span>
                </div>
              </div>
            </div>

            {/* Tecnología IA */}
            <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-500 hover:bg-white/15 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Tecnología IA</h3>
                <p className="text-blue-200/80">Inteligencia Artificial Avanzada</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-white font-medium">RAG Especializado</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                  <span className="text-white font-medium">5K+ Documentos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-white font-medium">Disponible 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Carousel */}
          <div className="relative bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-8">Lo que dicen nuestros usuarios</h3>
              
              <div className="relative h-32 overflow-hidden">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ${
                      index === currentTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                  >
                    <div className="text-center space-y-4">
                      <div className="text-4xl">{testimonial.icon}</div>
                      <blockquote className="text-lg text-blue-100 font-medium italic max-w-2xl mx-auto">
                        "{testimonial.quote}"
                      </blockquote>
                      <div className="text-gold-300">
                        <div className="font-bold">{testimonial.author}</div>
                        <div className="text-sm text-blue-200">{testimonial.location}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Testimonial Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      index === currentTestimonial ? 'bg-gold-400' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black">
              <span className="text-white drop-shadow-2xl">¿Listo para</span>
              <span className="block bg-gradient-to-r from-gold-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent mt-2 drop-shadow-lg">
                Profundizar tu Fe?
              </span>
            </h2>
            
            <p className="text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed font-light">
              Únete a miles de católicos que ya están explorando la riqueza de nuestra tradición con SantaPalabra
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Link
                href="/catholic-chat"
                className="group relative inline-flex items-center justify-center px-12 py-6 bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 text-white font-bold text-2xl rounded-3xl shadow-2xl hover:shadow-gold-500/25 transform hover:scale-105 transition-all duration-500 overflow-hidden border-2 border-gold-400/50"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-gold-400 via-amber-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                <span className="relative flex items-center">
                  <span className="mr-4 text-3xl">🙏</span>
                  Comenzar mi Jornada Espiritual
                  <svg className="ml-4 w-8 h-8 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}