'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModal } from '@/components/ModalContext';
import { subscribeToNewsletter } from '@/lib/subscription';
import { useUserProgress } from '@/components/GamificationSystem';

export default function EmailSubscriptionModal() {
  const { language } = useLanguage();
  const { activeModal, closeModal } = useModal();
  const { addXP } = useUserProgress();
  const isOpen = activeModal === 'subscription';
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const onSubscribe = async (email: string) => {
    await subscribeToNewsletter(email);
    addXP(25);
  };

  const onClose = () => {
    closeModal('subscription');
  };

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
    if (!isSubscribed) {
      markSubscriptionSkipped();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-amber-100 dark:border-amber-900/50 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-5 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-2"
            >
              <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
            </motion.div>
            
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              {isSubscribed ? t.successTitle : t.title}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[250px] mx-auto">
              {isSubscribed ? t.successMessage : t.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="p-5 pt-4">
            {!isSubscribed ? (
              <>
                {/* Benefits - Simplified */}
                <div className="space-y-2 mb-4">
                  {t.benefits.slice(0, 2).map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {benefit}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.inputPlaceholder}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading || !email}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {isLoading ? t.loadingText : t.subscribeButton}
                  </motion.button>
                </form>

                <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                  {t.freeLabel}
                </p>

                {/* Skip Option */}
                <div className="text-center mt-3">
                  <button
                    onClick={handleContinue}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    {t.skipButton}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center py-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3"
                  >
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </motion.div>

                  <motion.button
                    onClick={handleContinue}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-all shadow-sm"
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
