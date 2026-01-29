import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Lock, Globe, Mail, User as UserIcon, ArrowRight, Loader2, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DonationButton } from './DonationButton';
import { useAuth } from '@/lib/auth-context';
import Script from 'next/script';

interface StudyTrack {
  id: string;
  title: { es: string; pt: string; en: string };
  price: string;
  icon: React.ElementType;
}

interface TrackPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: StudyTrack | null;
  onPurchase: (trackId: string) => Promise<void>;
}

// MercadoPago Countries
const mercadopagoCountries = {
  mla: { name: 'Argentina', currency: 'ARS', flag: '🇦🇷', rate: 1000 },
  mlb: { name: 'Brasil', currency: 'BRL', flag: '🇧🇷', rate: 6 },
  mlm: { name: 'México', currency: 'MXN', flag: '🇲🇽', rate: 17 },
  mco: { name: 'Colombia', currency: 'COP', flag: '🇨🇴', rate: 800 },
  mpe: { name: 'Perú', currency: 'PEN', flag: '🇵🇪', rate: 3.8 },
  mlu: { name: 'Uruguay', currency: 'UYU', flag: '🇺🇾', rate: 39 },
  mlc: { name: 'Chile', currency: 'CLP', flag: '🇨🇱', rate: 900 }
};

const PAYPAL_BUTTON_URL = 'https://www.paypal.com/ncp/links/YTAYJCFUN8MCY';

export function TrackPurchaseModal({ isOpen, onClose, track, onPurchase }: TrackPurchaseModalProps) {
  const { language } = useLanguage();
  const { user, signIn, signUp } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('mla');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authError, setAuthError] = useState<string | null>(null);

  // Auto-select country based on language
  useEffect(() => {
    if (language === 'pt') setSelectedCountry('mlb');
    else if (language === 'es') setSelectedCountry('mla'); // Default to Argentina for Spanish
    else setSelectedCountry('mla');
  }, [language]);

  if (!track) return null;

  const getTitle = (t: StudyTrack) => {
    return t.title[language as keyof typeof t.title] || t.title.es;
  };

  const getPriceAmount = (priceString: string): number => {
    const match = priceString.match(/[\d\.]+/);
    return match ? parseFloat(match[0]) : 10;
  };

  const handleAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (user) return true;
    
    setIsProcessing(true);
    setAuthError(null);
    if (!email || !password) {
      setAuthError(language === 'es' ? 'Por favor completa todos los campos' : 'Please complete all fields');
      setIsProcessing(false);
      return false;
    }

    try {
      if (authMode === 'signup') {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        if (!data.session && !data.user) {
             setAuthError(language === 'es' ? 'Error al crear cuenta' : 'Error creating account');
             setIsProcessing(false);
             return false;
        }
        if (data.user && !data.session) {
             setAuthError(language === 'es' ? 'Cuenta creada. Por favor verifica tu email antes de continuar.' : 'Account created. Please verify your email before continuing.');
             setIsProcessing(false);
             return false;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      setIsProcessing(false);
      return true;
    } catch (e: any) {
      console.error('Auth error:', e);
      setAuthError(e.message || 'Authentication failed');
      setIsProcessing(false);
      return false;
    }
  };

  const handlePayPalPurchase = async () => {
    if (!user) {
      setIsProcessing(true);
      const success = await handleAuth();
      setIsProcessing(false);
      if (!success) return;
    }
    window.open(PAYPAL_BUTTON_URL, '_blank');
  };

  const handleMercadoPagoPurchase = async () => {
    if (!mpLoaded || !window.MercadoPago) {
      alert('MercadoPago SDK loading...');
      return;
    }

    setIsProcessing(true);

    if (!user) {
      const success = await handleAuth();
      if (!success) {
        setIsProcessing(false);
        return;
      }
    }

    try {
      const amount = getPriceAmount(track.price);
      const countryInfo = mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries];

      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: countryInfo.currency,
          country: selectedCountry,
          donor_name: 'Estudiante SantaPalabra', // Could be dynamic
          metadata: {
            track_id: track.id,
            track_title: getTitle(track),
            source: 'track_purchase_modal'
          }
        })
      });

      const data = await response.json();
      
      if (data.success && data.preference) {
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '', {
          locale: language === 'pt' ? 'pt-BR' : 'es-AR'
        });

        await mp.checkout({
          preference: {
            id: data.preference.id
          },
          autoOpen: true // Open in popup/redirect
        });
      } else {
        alert(`Error: ${data.error || 'Payment initialization failed'}`);
      }
    } catch (error) {
      console.error('Purchase failed', error);
      alert('Error initiating payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const t = {
    es: {
      unlock: 'Desbloquear Trayecto',
      access: 'Obtén acceso completo a:',
      includes: 'Este trayecto incluye:',
      features: [
        'Chat especializado con contexto profundo',
        'Material de estudio estructurado',
        'Preguntas y respuestas guiadas',
        'Certificado de finalización (próximamente)'
      ],
      pay: 'Pagar',
      processing: 'Procesando...',
      secure: 'Pago seguro vía Stripe/MercadoPago',
      selectCountry: 'País para MercadoPago:',
      loginTitle: 'Crear Cuenta',
      loginDesc: 'Crea una cuenta gratuita para guardar tu compra para siempre.',
      emailPlaceholder: 'Correo electrónico',
      passwordPlaceholder: 'Contraseña',
      haveAccount: '¿Ya tienes cuenta?',
      noAccount: '¿No tienes cuenta?',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      continue: 'Continuar al Pago',
      comingSoon: 'Próximamente',
      comingSoonDesc: 'Estamos preparando este trayecto con contenido exclusivo y modelos especializados. ¡Estará disponible muy pronto!',
      notifyMe: 'Notificarme cuando esté disponible'
    },
    pt: {
      unlock: 'Desbloquear Trilha',
      access: 'Obtenha acesso completo a:',
      includes: 'Esta trilha inclui:',
      features: [
        'Chat especializado com contexto profundo',
        'Material de estudo estruturado',
        'Perguntas e respostas guiadas',
        'Certificado de conclusão (em breve)'
      ],
      pay: 'Pagar',
      processing: 'Processando...',
      secure: 'Pagamento seguro via Stripe/MercadoPago',
      selectCountry: 'País para MercadoPago:',
      loginTitle: 'Criar Conta',
      loginDesc: 'Crie uma conta gratuita para salvar sua compra para sempre.',
      emailPlaceholder: 'E-mail',
      passwordPlaceholder: 'Senha',
      haveAccount: 'Já tem uma conta?',
      noAccount: 'Não tem uma conta?',
      signIn: 'Entrar',
      signUp: 'Inscrever-se',
      continue: 'Continuar para Pagamento',
      comingSoon: 'Em Breve',
      comingSoonDesc: 'Estamos preparando esta trilha com conteúdo exclusivo e modelos especializados. Estará disponível em breve!',
      notifyMe: 'Notifique-me quando estiver disponível'
    },
    en: {
      unlock: 'Unlock Track',
      access: 'Get full access to:',
      includes: 'This track includes:',
      features: [
        'Specialized chat with deep context',
        'Structured study material',
        'Guided Q&A',
        'Completion certificate (coming soon)'
      ],
      pay: 'Pay',
      processing: 'Processing...',
      secure: 'Secure payment via Stripe/MercadoPago',
      selectCountry: 'Country for MercadoPago:',
      comingSoon: 'Coming Soon',
      comingSoonDesc: 'We are preparing this track with exclusive content and specialized models. It will be available very soon!',
      notifyMe: 'Notify me when available'
    }
  }[language as 'es' | 'pt' | 'en'] || {
    // Fallback to English
    unlock: 'Unlock Track',
    access: 'Get full access to:',
    includes: 'This track includes:',
    features: [
      'Specialized chat with deep context',
      'Structured study material',
      'Guided Q&A',
      'Completion certificate (coming soon)'
    ],
    pay: 'Pay',
    processing: 'Processing...',
    secure: 'Secure payment via Stripe/MercadoPago',
    selectCountry: 'Country for MercadoPago:',
    comingSoon: 'Coming Soon',
    comingSoonDesc: 'We are preparing this track with exclusive content and specialized models. It will be available very soon!',
    notifyMe: 'Notify me when available'
  };

  const Icon = track.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <Script 
            src="https://sdk.mercadopago.com/js/v2" 
            strategy="lazyOnload"
            onLoad={() => setMpLoaded(true)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative h-24 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-md relative">
                <Icon className="w-12 h-12 text-white" />
                <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-amber-200">
                  {t.comingSoon}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                  {t.unlock}
                </h2>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {getTitle(track)}
                </h3>
                {/* 
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-lg">
                  {track.price}
                </div>
                */}
              </div>

              <div className="text-center space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50">
                  <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t.comingSoonDesc}
                  </p>
                </div>

                <div className="space-y-4 mb-8 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.includes}
                    </p>
                    <ul className="space-y-2">
                      {t.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Check className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                <button
                  onClick={onClose}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  {language === 'es' ? 'Entendido' : 'Got it'}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
