'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Gift, Sparkles, Clock, MessageSquare, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmailSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (email: string) => Promise<void>;
}

export default function EmailSubscriptionModal({ isOpen, onClose, onSubscribe }: EmailSubscriptionModalProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const texts = {
    es: {
      title: '🎉 ¡Únete a la comunidad SantaPalabra!',
      subtitle: 'Recibe actualizaciones exclusivas y mantén tu progreso espiritual',
      benefits: [
        'Newsletter semanal con enseñanzas católicas',
        'Tracking de tu progreso y XP ganados',
        'Historial completo de tus conversaciones',
        'Notificaciones de nuevas funciones',
        'Contenido exclusivo del CELAM y místicos españoles'
      ],
      inputPlaceholder: 'tu.email@ejemplo.com',
      subscribeButton: 'Unirme gratis',
      loadingText: 'Procesando...',
      skipButton: 'Continuar sin suscribirse',
      successTitle: '¡Bienvenido a SantaPalabra!',
      successMessage: 'Te hemos enviado un email de confirmación. ¡Ya puedes empezar a chatear!',
      continueButton: 'Continuar al chat',
      freeLabel: '100% gratis - sin tarjeta de crédito'
    },
    pt: {
      title: '🎉 Junte-se à comunidade SantaPalabra!',
      subtitle: 'Receba atualizações exclusivas e mantenha seu progresso espiritual',
      benefits: [
        'Newsletter semanal com ensinamentos católicos',
        'Acompanhamento do seu progresso e XP ganho',
        'Histórico completo de suas conversas',
        'Notificações de novas funcionalidades',
        'Conteúdo exclusivo do CELAM e místicos espanhóis'
      ],
      inputPlaceholder: 'seu.email@exemplo.com',
      subscribeButton: 'Participar gratuitamente',
      loadingText: 'Processando...',
      skipButton: 'Continuar sem se inscrever',
      successTitle: 'Bem-vindo ao SantaPalabra!',
      successMessage: 'Enviamos um email de confirmação. Já pode começar a conversar!',
      continueButton: 'Continuar para o chat',
      freeLabel: '100% gratuito - sem cartão de crédito'
    },
    en: {
      title: '🎉 Join the SantaPalabra community!',
      subtitle: 'Receive exclusive updates and keep your spiritual progress',
      benefits: [
        'Weekly newsletter with Catholic teachings',
        'Track your progress and earned XP',
        'Complete history of your conversations',
        'New feature notifications',
        'Exclusive content from CELAM and Spanish mystics'
      ],
      inputPlaceholder: 'your.email@example.com',
      subscribeButton: 'Join for free',
      loadingText: 'Processing...',
      skipButton: 'Continue without subscribing',
      successTitle: 'Welcome to SantaPalabra!',
      successMessage: 'We\'ve sent you a confirmation email. You can start chatting now!',
      continueButton: 'Continue to chat',
      freeLabel: '100% free - no credit card required'
    }
  };

  const t = texts[language as keyof typeof texts] || texts.es;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;

    setIsLoading(true);
    try {
      await onSubscribe(email);
      setIsSubscribed(true);
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-700 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-6 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-2"
            >
              <Sparkles className="h-12 w-12 text-white mx-auto" />
            </motion.div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              {isSubscribed ? t.successTitle : t.title}
            </h2>
            <p className="text-amber-100 text-sm">
              {isSubscribed ? t.successMessage : t.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isSubscribed ? (
              <>
                {/* Benefits */}
                <div className="space-y-3 mb-6">
                  {t.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-3"
                    >
                      <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {benefit}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.inputPlaceholder}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !email}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {isLoading ? t.loadingText : t.subscribeButton}
                  </motion.button>
                </form>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
                  {t.freeLabel}
                </p>

                {/* Skip Option */}
                <div className="text-center mt-4">
                  <button
                    onClick={handleContinue}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors"
                  >
                    {t.skipButton}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
                  >
                    <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </motion.div>

                  <motion.button
                    onClick={handleContinue}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg"
                  >
                    {t.continueButton}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}