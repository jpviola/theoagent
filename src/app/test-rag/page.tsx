'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, BookCopy, ChevronRight, Home, LogIn, Zap, BarChart2, AlertTriangle, CheckCircle, Loader, Settings, Languages, MessageSquare, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TestResult {
  query: string;
  implementation: string;
  response: string;
  responseTime: number;
  timestamp: string;
}

interface ComparisonResult {
  performance: {
    langchain: { avgTime: number; successRate: number };
    llamaindex: { avgTime: number; successRate: number };
  };
  summary: {
    winner: string;
    langchainAvgTime: number;
    llamaindexAvgTime: number;
  };
}

export default function RAGTestingInterface() {
  const [user, setUser] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [implementation, setImplementation] = useState<'LangChain' | 'LlamaIndex'>('LangChain');
  const [mode, setMode] = useState<'standard' | 'advanced'>('standard');
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single');

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user || null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const sampleQueries = {
    es: [
      '¿Qué enseña la Iglesia sobre la oración?',
      'Explica la transubstanciación en la Eucaristía.',
      '¿Cuál es el rol de la Virgen María en la salvación?',
      '¿Qué dice el CELAM sobre la opción por los pobres?',
    ],
    en: [
      'What is the Catholic teaching on the Trinity?',
      'How should Catholics approach prayer?',
      'What is the significance of the Eucharist?',
      'Can you explain Catholic teaching on salvation?',
    ]
  };

  const testSingleQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/catholic-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          implementation,
          mode,
          language
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          query: data.query,
          implementation: data.implementation,
          response: data.response,
          responseTime: data.responseTime,
          timestamp: data.timestamp
        });
      } else {
        setError(data.message || 'Test failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    setComparing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const response = await fetch('/api/compare-rag?test=full');
      const data = await response.json();

      if (data.success) {
        setComparisonResult(data.report);
      } else {
        setError(data.message || 'Comparison failed');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Comparison error:', err);
    } finally {
      setComparing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -top-48 -left-48"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-amber-400/20 rounded-full blur-3xl -bottom-48 -right-48"
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* Floating Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-50 px-6 py-4"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-yellow-200 shadow-lg px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <img src="/santapalabra-logo.svg" alt="SantaPalabra" className="h-10" />
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Beaker className="text-yellow-600" />Laboratorio RAG</h1>
              </div>
              <div className="flex items-center space-x-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all border border-gray-200"
                  >
                    <Home className="h-4 w-4" />
                    Inicio
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/catholic-chat"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 rounded-xl font-medium transition-all shadow-md"
                  >
                    <BookCopy className="h-4 w-4" />
                    Iniciar Chat
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm px-6 py-2 rounded-full border border-yellow-300 mb-6">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-gray-700 text-sm font-medium">Sistema en Línea</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Laboratorio de Pruebas RAG
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experimenta con sistemas de recuperación avanzados para teología católica
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-yellow-200 inline-flex shadow-lg">
            <motion.div
              className="absolute top-2 bottom-2 left-2 w-[164px] bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl shadow-lg"
              animate={{ x: activeTab === 'single' ? 0 : 168 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setActiveTab('single')}
              className="relative z-10 px-8 py-3 rounded-xl font-semibold transition-colors text-gray-900"
            >
              Prueba Individual
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className="relative z-10 px-8 py-3 rounded-xl font-semibold transition-colors text-gray-900"
            >
              Comparar
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Single Query Testing */}
          {activeTab === 'single' && (
            <motion.div
              key="single"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Configuration Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-yellow-200 p-8 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label className="flex items-center gap-2 text-gray-800 text-sm font-semibold mb-3"><Settings className="h-4 w-4" />Implementación</label>
                    <select
                      value={implementation}
                      onChange={(e) => setImplementation(e.target.value as 'LangChain' | 'LlamaIndex')}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="LangChain">🔗 LangChain</option>
                      <option value="LlamaIndex">🦙 LlamaIndex</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-gray-800 text-sm font-semibold mb-3"><Zap className="h-4 w-4" />Modo</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as 'standard' | 'advanced')}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="standard">📄 Standard</option>
                      <option value="advanced">⚡ Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-gray-800 text-sm font-semibold mb-3"><Languages className="h-4 w-4" />Idioma</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="en">🇺🇸 English</option>
                      <option value="es">🇪🇸 Español</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 text-gray-800 text-sm font-semibold mb-3"><MessageSquare className="h-4 w-4" />Tu Pregunta</label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Pregunta cualquier cosa sobre teología católica..."
                    className="w-full px-6 py-4 bg-white border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-400 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-800 text-sm font-semibold mb-3">Ejemplos Rápidos</label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {sampleQueries[language].map((sample, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setQuery(sample)}
                        whileHover={{ scale: 1.02, borderColor: 'rgb(234 179 8)' }}
                        whileTap={{ scale: 0.98 }}
                        className="text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl transition-all text-sm text-gray-700 hover:text-gray-900"
                      >
                        {sample}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  onClick={testSingleQuery}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-3" />
                      Procesando Consulta...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Play className="mr-2" />
                      Ejecutar Prueba
                    </span>
                  )}
                </motion.button>
              </div>

              {/* Results Card */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl border border-yellow-200 p-8 shadow-xl"
                  >
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mr-4">
                        <CheckCircle className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Prueba Completada</h3>
                        <p className="text-gray-600">Consulta ejecutada exitosamente</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
                        <div className="text-yellow-800 text-sm font-medium mb-1">Implementación</div>
                        <div className="text-2xl font-bold text-gray-900">{result.implementation}</div>
                      </div>
                      <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
                        <div className="text-yellow-800 text-sm font-medium mb-1">Tiempo de Respuesta</div>
                        <div className="text-2xl font-bold text-gray-900">{result.responseTime}ms</div>
                      </div>
                      <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-200">
                        <div className="text-yellow-800 text-sm font-medium mb-1">Timestamp</div>
                        <div className="text-2xl font-bold text-gray-900">{new Date(result.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-gray-800 font-semibold mb-2">Pregunta</div>
                        <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-yellow-500 text-gray-800">{result.query}</div>
                      </div>
                      
                      <div>
                        <div className="text-gray-800 font-semibold mb-2">Respuesta</div>
                        <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-yellow-500 text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">{result.response}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Comparison Testing */}
          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-yellow-200 p-8 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mr-4">
                    <BarChart2 className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Comparación de Rendimiento</h3>
                    <p className="text-gray-600">Prueba de batalla de ambas implementaciones</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    Esta prueba exhaustiva ejecutará múltiples consultas a través de las implementaciones de LangChain y LlamaIndex, 
                    proporcionando métricas de rendimiento detalladas y análisis de calidad.
                  </p>
                </div>
                
                <motion.button
                  onClick={runComparison}
                  disabled={comparing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {comparing ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-3" />
                      Ejecutando Pruebas de Comparación...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Play className="mr-2" />
                      Lanzar Comparación
                    </span>
                  )}
                </motion.button>
              </div>

              {/* Comparison Results */}
              <AnimatePresence>
                {comparisonResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl border border-yellow-200 p-8 shadow-xl"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-200">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-yellow-500/30 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-2xl">🔗</span>
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900">LangChain</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-800">Tiempo Promedio</span>
                            <span className="text-3xl font-bold text-gray-900">{comparisonResult.performance.langchain.avgTime.toFixed(0)}ms</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-800">Tasa de Éxito</span>
                            <span className="text-3xl font-bold text-gray-900">{comparisonResult.performance.langchain.successRate.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-200">
                        <div className="flex items-center mb-6">
                          <div className="w-10 h-10 bg-yellow-500/30 rounded-xl flex items-center justify-center mr-3">
                            <span className="text-2xl">🦙</span>
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900">LlamaIndex</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-800">Tiempo Promedio</span>
                            <span className="text-3xl font-bold text-gray-900">{comparisonResult.performance.llamaindex.avgTime.toFixed(0)}ms</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-800">Tasa de Éxito</span>
                            <span className="text-3xl font-bold text-gray-900">{comparisonResult.performance.llamaindex.successRate.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-8 rounded-3xl shadow-lg">
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mr-6">
                          <span className="text-4xl">🏆</span>
                        </div>
                        <div>
                          <div className="text-yellow-900 text-sm font-medium mb-1">Ganador</div>
                          <div className="text-3xl font-bold text-gray-900">{comparisonResult.summary.winner}</div>
                          <div className="text-yellow-900/80 text-sm mt-1">Basado en métricas de rendimiento</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mt-6"
              role="alert"
            >
              <strong className="font-bold flex items-center"><AlertTriangle className="mr-2" />Error: </strong>
              <span className="block sm:inline">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
