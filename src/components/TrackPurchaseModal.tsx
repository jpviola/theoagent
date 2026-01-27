import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Lock, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DonationButton } from './DonationButton';
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

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export function TrackPurchaseModal({ isOpen, onClose, track, onPurchase }: TrackPurchaseModalProps) {
  const { language } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('mla');

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

  const handlePayPalPurchase = () => {
    window.open(PAYPAL_BUTTON_URL, '_blank');
    // We simulate "success" after opening the link for now, 
    // or we could wait for a webhook/return URL.
    // For the MVP, we might want to "unlock" it optimistically or require manual confirmation.
    // The user asked to "activate tracks", implying functional access.
    // Since we don't have the full webhook loop for tracks yet, 
    // we will rely on the user manually confirming or we just open the link.
    // BUT the previous implementation called `onPurchase` which unlocked the track.
    // We should probably keep that behavior for "testing" or make it clear.
    // Let's assume for now we just open the link. 
    // To truly "unlock", we need the webhook.
    // I'll leave the `onPurchase` call commented out or triggered by a debug action?
    // No, the user wants "payment integration".
    // I'll open the link and NOT unlock automatically. The user needs to wait for the system (webhook).
    // HOWEVER, for this "demo/MVP" stage, maybe we want to unlock it to show it works?
    // I'll add a "Simulate Success" button for dev mode, or just rely on the existing onPurchase for now?
    // No, the instruction is "connect buttons to real URLs".
    // I will open the link. 
  };

  const handleStripePurchase = async () => {
    setIsProcessing(true);
    try {
      const amount = getPriceAmount(track.price);
      
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          track_title: getTitle(track),
          metadata: {
            track_id: track.id,
            track_title: getTitle(track),
            source: 'track_purchase_modal'
          }
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Error: ${data.error || 'Stripe initialization failed'}`);
      }
    } catch (error) {
      console.error('Stripe purchase failed', error);
      alert('Error initiating Stripe payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMercadoPagoPurchase = async () => {
    if (!mpLoaded || !window.MercadoPago) {
      alert('MercadoPago SDK loading...');
      return;
    }

    setIsProcessing(true);
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
      selectCountry: 'País para MercadoPago:'
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
      selectCountry: 'País para MercadoPago:'
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
      selectCountry: 'Country for MercadoPago:'
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
    selectCountry: 'Country for MercadoPago:'
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
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-md">
                <Icon className="w-12 h-12 text-white" />
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
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-lg">
                  {track.price}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t.includes}
                </p>
                <ul className="space-y-2">
                  {t.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <DonationButton
                  provider="paypal"
                  label={`${t.pay} via PayPal`}
                  onClick={handlePayPalPurchase}
                  disabled={isProcessing}
                  className="w-full"
                />
                
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2 justify-center">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <label className="text-xs text-gray-500 dark:text-gray-400">{t.selectCountry}</label>
                    <select 
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="text-xs border rounded p-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {Object.entries(mercadopagoCountries).map(([code, country]) => (
                        <option key={code} value={code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <DonationButton
                    provider="mercadopago"
                    label={`${t.pay} via MercadoPago`}
                    onClick={handleMercadoPagoPurchase}
                    disabled={isProcessing || !mpLoaded}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Dev Mode Only: Simulate Success Button */}
              {process.env.NODE_ENV === 'development' && (
                <button 
                  onClick={() => onPurchase(track.id).then(onClose)}
                  className="mt-4 w-full py-2 text-xs text-gray-400 hover:text-indigo-500 border border-dashed border-gray-300 rounded"
                >
                  [DEV] Simular Compra Exitosa
                </button>
              )}
              
              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                {t.secure}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
