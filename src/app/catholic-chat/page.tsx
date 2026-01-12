'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CatholicChatPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'es' | 'en'>('es'); // Español por defecto
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    try {
      const response = await fetch('/api/catholic-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          implementation: 'Catholic Chat'
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.response || 'No response received',
        timestamp: new Date()
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
  };

  const sampleQuestions = {
    es: [
      "¿Qué enseña la Iglesia Católica sobre la Trinidad?",
      "¿Cómo deben los católicos abordar la oración?", 
      "¿Cuál es el significado de la Eucaristía?",
      "Cuéntame sobre la devoción al Sagrado Corazón",
      "¿Qué enseña la Iglesia sobre la Virgen María?",
      "¿Qué enseña Santa Teresa de Ávila sobre la oración?",
      "¿Cuál es la noche oscura según San Juan de la Cruz?",
      "¿Qué dice el CELAM sobre la evangelización en América Latina?"
    ],
    en: [
      "What is the Catholic teaching on the Trinity?",
      "How should Catholics approach prayer?", 
      "What is the significance of the Eucharist?",
      "Tell me about devotion to the Sacred Heart",
      "What does the Church teach about Mary?",
      "How does the Catholic Church understand salvation?"
    ]
  };

  const texts = {
    es: {
      backHome: '← Volver al Inicio',
      title: 'SantaPalabra.app - Chat Católico',
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
      errorOccurred: 'Ocurrió un error. Por favor intenta de nuevo.'
    },
    en: {
      backHome: '← Back to Home',
      title: 'SantaPalabra.app - Catholic Chat',
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
      errorOccurred: 'An error occurred. Please try again.'
    }
  };

  const currentTexts = texts[language];

  const handleSampleQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 mr-4">
                {currentTexts.backHome}
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">{currentTexts.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    language === 'es' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🇪🇸 ES
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    language === 'en' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🇺🇸 EN
                </button>
              </div>
              {user ? (
                <span className="text-sm text-gray-600">{currentTexts.signedIn} {user.email}</span>
              ) : (
                <Link href="/auth-test" className="text-sm text-blue-600 hover:text-blue-800">
                  {currentTexts.signIn}
                </Link>
              )}
              <button
                onClick={clearChat}
                className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                {currentTexts.clearChat}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="text-center mb-8">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentTexts.welcomeTitle}
              </h2>
              <p className="text-gray-600 mb-6">
                {currentTexts.welcomeDesc}
              </p>
              
              {/* Sample Questions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{currentTexts.sampleQuestionsTitle}</h3>
                <p className="text-sm text-gray-600 mb-4">{currentTexts.clickToUse}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {sampleQuestions[language].map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuestion(question)}
                      className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {message.role === 'assistant' ? (
                    <div 
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: message.content.replace(/\n/g, '<br>') 
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p>{language === 'es' ? 'Error:' : 'Error:'} {error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              {language === 'es' ? 'Cerrar' : 'Dismiss'}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input Form */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentTexts.enterMessage}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? currentTexts.loading : currentTexts.send}
            </button>
          </form>
          <div className="mt-2 text-center text-xs text-gray-500">
            {language === 'es' 
              ? 'Respuestas basadas en la enseñanza de la Iglesia Católica • Mejorado con documentos hispanoamericanos'
              : 'Responses based on Catholic Church teaching • Enhanced with Hispanic-American documents'
            }
          </div>
        </div>
      </div>
    </div>
  );
}