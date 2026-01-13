'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Home, LogIn, User, Sparkles, BookOpen, FlaskConical, AlertTriangle, X, Settings, Zap, BarChart2, Clock, Upload, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  responseTime?: number;
  implementation?: string;
}

export default function CatholicChatPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [implementation, setImplementation] = useState<'LangChain' | 'LlamaIndex'>('LangChain');
  const [showMetrics, setShowMetrics] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [isBowing, setIsBowing] = useState(false);
  const { language } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Activar animación de reverencia
    setIsBowing(true);
    setTimeout(() => setIsBowing(false), 4000); // Duración de la animación - 4 segundos para transición suave

    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();

    try {
      const apiEndpoint = advancedMode ? '/api/catholic-simple' : '/api/catholic-rag';
      const requestBody = advancedMode
        ? { query: userMessage.content, implementation, mode: 'standard', language }
        : { query: userMessage.content, implementation: 'Catholic Chat', language };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date(),
        responseTime: advancedMode ? responseTime : undefined,
        implementation: advancedMode ? implementation : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setError(language === 'es' ? 'Error de red' : 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setPdfFile(null);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError(language === 'es' ? 'Solo se permiten archivos PDF' : 'Only PDF files are allowed');
      return;
    }

    // Validar tamaño (15 MB = 15 * 1024 * 1024 bytes)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(language === 'es' ? 'El PDF no debe superar los 15 MB' : 'PDF must not exceed 15 MB');
      return;
    }

    setPdfFile(file);
    setError(null);
  };

  const removePdf = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Banco completo de preguntas para aleatorizar
  const allQuestions = {
    es: [
      "¿Qué enseña la Iglesia Católica sobre la Trinidad?",
      "¿Cómo deben los católicos abordar la oración?", 
      "¿Cuál es el significado de la Eucaristía?",
      "Cuéntame sobre la devoción al Sagrado Corazón",
      "¿Qué enseña la Iglesia sobre la Virgen María?",
      "¿Qué enseña Santa Teresa de Ávila sobre la oración?",
      "¿Cuál es la noche oscura según San Juan de la Cruz?",
      "¿Qué dice el CELAM sobre la evangelización en América Latina?",
      "¿Qué son los sacramentos de iniciación cristiana?",
      "¿Cuál es la importancia de la confesión?"
    ],
    en: [
      "What is the Catholic teaching on the Trinity?",
      "How should Catholics approach prayer?", 
      "What is the significance of the Eucharist?",
      "Tell me about devotion to the Sacred Heart",
      "What does the Church teach about Mary?",
      "How does the Catholic Church understand salvation?",
      "What are the sacraments of Christian initiation?",
      "What is the importance of confession?"
    ]
  };

  // Seleccionar 2 preguntas aleatorias + siempre evangelio del día
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);

  useEffect(() => {
    const gospelQuestion = language === 'es' 
      ? '¿Me explicas el evangelio del día?' 
      : 'Can you explain today\'s Gospel to me?';
    
    const questions = [...allQuestions[language]];
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);
    
    setSampleQuestions([...selected, gospelQuestion]);
  }, [language]);

  const texts = {
    es: {
      backHome: 'Volver al Inicio',
      title: 'Chat Católico',
      signedIn: 'Conectado como',
      signIn: 'Iniciar Sesión',
      clearChat: 'Limpiar Chat',
      welcomeTitle: 'Bienvenido al Chat Teológico Católico',
      welcomeDesc: 'Pregunta cualquier cosa sobre la fe católica, teología, espiritualidad, o enseñanzas de la Iglesia. Obtén respuestas basadas en el Catecismo, documentos papales, mística española y enseñanzas del CELAM.',
      sampleQuestionsTitle: 'Preguntas de Ejemplo',
      clickToUse: 'Haz clic en cualquier pregunta para usarla:',
      enterMessage: 'Escribe tu pregunta teológica...',
      send: 'Enviar',
      loading: 'Pensando...',
      errorOccurred: 'Ocurrió un error. Por favor intenta de nuevo.',
      advancedMode: 'Modo Avanzado',
      simpleMode: 'Modo Simple',
      implementation: 'Motor RAG',
      showMetrics: 'Mostrar métricas',
      responseTime: 'Tiempo de respuesta',
      uploadPdf: 'Subir PDF',
      pdfAttached: 'PDF adjunto',
      removePdf: 'Quitar PDF',
      pdfLimits: 'Máx. 15 MB, 20 páginas'
    },
    en: {
      backHome: 'Back to Home',
      title: 'Catholic Chat',
      signedIn: 'Signed in as',
      signIn: 'Sign In',
      clearChat: 'Clear Chat',
      welcomeTitle: 'Welcome to Catholic Theological Chat',
      welcomeDesc: 'Ask anything about Catholic faith, theology, spirituality, or Church teaching. Get answers based on the Catechism, papal documents, Spanish mysticism and CELAM teachings.',
      sampleQuestionsTitle: 'Sample Questions',
      clickToUse: 'Click any question to use it:',
      enterMessage: 'Enter your theological question...',
      send: 'Send',
      loading: 'Thinking...',
      errorOccurred: 'An error occurred. Please try again.',
      advancedMode: 'Advanced Mode',
      simpleMode: 'Simple Mode',
      implementation: 'RAG Engine',
      showMetrics: 'Show metrics',
      responseTime: 'Response time',
      uploadPdf: 'Upload PDF',
      pdfAttached: 'PDF attached',
      removePdf: 'Remove PDF',
      pdfLimits: 'Max 15 MB, 20 pages'
    }
  };

  const currentTexts = texts[language];

  const handleSampleQuestion = (question: string) => {
    setInput(question);
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col relative overflow-hidden">
      {/* Imágenes decorativas católicas de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.15, rotate: 12 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-[10%] left-[2%] h-32 w-32 md:h-40 md:w-40"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/SantaTeresa.svg" alt="" fill className="object-contain" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.15, rotate: -12 }}
          transition={{ duration: 2, delay: 0.7 }}
          className="absolute top-[30%] right-[2%] h-32 w-32 md:h-40 md:w-40"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/san juan.svg" alt="" fill className="object-contain" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 0.18, rotate: 0 }}
          transition={{ duration: 2, delay: 0.9 }}
          className="absolute bottom-[15%] left-[1%] h-28 w-28 md:h-36 md:w-36"
          style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
        >
          <Image src="/guadalupana.svg" alt="" fill className="object-contain" />
        </motion.div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-yellow-200 sticky top-0 z-20"
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src="/santapalabra-logo.svg" alt="SantaPalabra" className="h-9" />
                <div className="leading-tight">
                  <div className="text-sm font-extrabold tracking-wide text-gray-900">SantaPalabra</div>
                  <h1 className="text-xs text-gray-600">{currentTexts.title}</h1>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              
              {/* Advanced Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAdvancedMode(!advancedMode)}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-colors ${
                  advancedMode 
                    ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={advancedMode ? currentTexts.simpleMode : currentTexts.advancedMode}
              >
                <Settings className="h-4 w-4" />
                {advancedMode ? <FlaskConical className="h-3 w-3" /> : null}
              </motion.button>

              {user ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.email}</span>
                </div>
              ) : (
                <Link href="/auth-test" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden md:inline">{currentTexts.signIn}</span>
                </Link>
              )}
              <button
                onClick={clearChat}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline">{currentTexts.clearChat}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Advanced Mode Settings Panel */}
      <AnimatePresence>
        {advancedMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-purple-50/50 border-b border-purple-200"
          >
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">{currentTexts.advancedMode}</span>
                  </div>
                  <div className="h-4 w-px bg-purple-300"></div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-purple-700">{currentTexts.implementation}:</label>
                    <select
                      value={implementation}
                      onChange={(e) => setImplementation(e.target.value as 'LangChain' | 'LlamaIndex')}
                      className="text-xs border border-purple-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="LangChain">LangChain</option>
                      <option value="LlamaIndex">LlamaIndex</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setShowMetrics(!showMetrics)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                    showMetrics ? 'bg-purple-200 text-purple-900' : 'text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <BarChart2 className="h-3 w-3" />
                  {currentTexts.showMetrics}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-3xl">
          {/* Logo SantaPalabra - Estático con animación de reverencia */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0
            }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative">
              <AnimatePresence mode="wait">
                {isBowing ? (
                  <motion.div 
                    key="bowing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <Image 
                      src="/santapalabraBowing.gif" 
                      alt="SantaPalabra haciendo reverencia" 
                      width={128} 
                      height={128}
                      className="brightness-110 drop-shadow-lg rounded-full"
                      style={{ 
                        mixBlendMode: 'multiply',
                        backgroundColor: 'transparent'
                      }}
                      unoptimized
                    />
                    {/* Leyenda durante animación */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                    >
                      <span className="text-amber-600 text-sm font-semibold tracking-wide">
                        SantaPalabra
                      </span>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 0] }}
                      transition={{ duration: 2, repeat: 0 }}
                      className="absolute inset-0 rounded-full bg-amber-400/30 blur-xl -z-10"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="static"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image 
                      src="/santapalabra-logo.svg" 
                      alt="SantaPalabra" 
                      width={128} 
                      height={128}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Input Form - Centrado */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-lg p-4 mb-6"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              {/* Botón Upload PDF */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full transition-colors shadow-md ${
                  pdfFile 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={pdfFile ? currentTexts.pdfAttached : currentTexts.uploadPdf}
              >
                {pdfFile ? <FileText className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
              </motion.button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentTexts.enterMessage}
                className="flex-1 px-5 py-3 border border-amber-200 rounded-full focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white text-gray-800 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                title={isLoading ? currentTexts.loading : currentTexts.send}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </motion.button>
            </form>

            {/* PDF Info */}
            <AnimatePresence>
              {pdfFile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{pdfFile.name}</span>
                    <span className="text-xs text-green-600">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    onClick={removePdf}
                    className="text-green-700 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PDF Limits Info */}
            <div className="mt-2 text-center text-xs text-gray-400">
              {currentTexts.pdfLimits}
            </div>
          </motion.div>

          {/* Preguntas Sugeridas - Debajo de la barra */}
          <AnimatePresence>
            {messages.length === 0 && sampleQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-medium text-gray-500 text-center uppercase tracking-wide mb-3">
                  {language === 'es' ? 'Preguntas sugeridas' : 'Suggested questions'}
                </h3>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2"
                >
                  {sampleQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01, borderColor: 'rgb(251 191 36)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSampleQuestion(question)}
                      className="text-left px-4 py-2.5 bg-white hover:bg-amber-50 rounded-lg border border-amber-200 transition-all text-sm text-gray-700 shadow-sm"
                    >
                      {question}
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages - Renderizar cuando existan */}
          {messages.length > 0 && (
            <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, ease: 'backOut' }}
                        className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border-2 border-white"
                      >
                        <BookOpen className="h-5 w-5 text-white" />
                      </motion.div>
                    )}

                    <div className={`max-w-2xl ${
                      message.role === 'user' ? 'w-auto' : 'w-full'
                    }`}>
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900'
                            : 'bg-white border-2 border-amber-100 text-gray-900'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          {message.role === 'assistant' ? (
                            <div 
                              className="whitespace-pre-wrap leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: message.content.replace(/\n/g, '<br>') 
                              }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                          )}
                        </div>
                      </div>
                      
                      {advancedMode && showMetrics && message.role === 'assistant' && message.responseTime && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-2 ml-2 flex items-center gap-3 text-xs text-gray-500"
                        >
                          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            <span>{message.responseTime}ms</span>
                          </div>
                          <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full text-purple-700">
                            <Zap className="h-3 w-3" />
                            <span>{message.implementation}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <motion.div
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, ease: 'backOut' }}
                        className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg border-2 border-white"
                      >
                        <User className="h-5 w-5 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-3" />
                  <p>{language === 'es' ? 'Error:' : 'Error:'} {error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="p-1 rounded-full hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </main>
    </div>
  );
}