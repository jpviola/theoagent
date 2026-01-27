'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { DonationButton } from '@/components/DonationButton';
import { DiffusionSupportModal } from '@/components/DiffusionSupportModal';

const PAYPAL_BUTTON_URL = 'https://www.paypal.com/ncp/links/YTAYJCFUN8MCY';

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  'AYiPC9BjWPaCo_pxhmlh_TM4P4qXOiCJ5-xjB4pNcVBgahh4HWyy7O5__yWqF_Ke-K6eOrtV6ffXft_r';

const tiers = [
  {
    name: 'Contribución Básica',
    amount: 2,
    description: '(US$ 2 o $PESOS 3000)'
  },
  {
    name: 'Apoyo Pastoral',
    amount: 10,
    description: '(US$ 10 o $PESOS 15000)'
  },
  {
    name: 'Apoyo Institucional',
    amount: 100,
    description: '(US$ 100 o $PESOS 150000)'
  }
];

// MercadoPago Client-side SDK v2 - Promise-based with fraud prevention
// Types defined in src/types/global.d.ts

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
}

const mercadopagoCountries = {
  mla: { name: 'Argentina', currency: 'ARS', flag: '🇦🇷', rate: 1000 },
  mlb: { name: 'Brasil', currency: 'BRL', flag: '🇧🇷', rate: 6 },
  mlm: { name: 'México', currency: 'MXN', flag: '🇲🇽', rate: 17 },
  mco: { name: 'Colombia', currency: 'COP', flag: '🇨🇴', rate: 800 },
  mpe: { name: 'Perú', currency: 'PEN', flag: '🇵🇪', rate: 3.8 },
  mlu: { name: 'Uruguay', currency: 'UYU', flag: '🇺🇾', rate: 39 },
  mlc: { name: 'Chile', currency: 'CLP', flag: '🇨🇱', rate: 900 }
};

function calculateLocalAmount(usdAmount: number, country: string): number {
  const countryInfo = mercadopagoCountries[country as keyof typeof mercadopagoCountries];
  return Math.round(usdAmount * countryInfo.rate);
}

function useMercadoPagoDonations() {
  const [mpLoaded, setMpLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('mla');

  const handlePayment = async (amount: number, country: string = 'mla') => {
    if (!mpLoaded || !window.MercadoPago) {
      alert('MercadoPago SDK no está cargado. Por favor, recarga la página.');
      return;
    }

    setLoading(true);
    try {
      const countryInfo = mercadopagoCountries[country as keyof typeof mercadopagoCountries];

      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: countryInfo.currency,
          country: country,
          donor_email: 'supporter@santapalabra.app',
          donor_name: `Donante ${countryInfo.name}`,
          metadata: {
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            source: 'santapalabra_support_page'
          }
        })
      });

      const data = await response.json();
      if (data.success && data.preference) {
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '', {
          locale: 'es'
        });

        await mp.checkout({
          preference: {
            id: data.preference.id
          },
          render: {
            container: '.cho-container',
            label: 'Donar'
          }
        });

        if (data.init_point) {
          window.location.href = data.init_point;
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('MercadoPago payment error:', error);
      alert('Error procesando el pago con MercadoPago');
    }
    setLoading(false);
  };

  return {
    mpLoaded,
    setMpLoaded,
    loading,
    setLoading,
    selectedCountry,
    setSelectedCountry,
    handlePayment
  };
}

function usePayPalDonations(
  tiersConfig: typeof tiers,
  showNotification: (type: NotificationType, title: string, message: string) => void
) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const cancelled = urlParams.get('cancelled');
    const failure = urlParams.get('failure');
    const pending = urlParams.get('pending');
    const amount = urlParams.get('amount');
    const country = urlParams.get('country');

    if (success === 'paypal') {
      const message = `¡Donación con PayPal completada exitosamente!${amount ? ` Monto: $${amount} USD.` : ''} Gracias por tu apoyo a SantaPalabra. 🙏`;
      showNotification('success', 'PayPal - ¡Donación Exitosa!', message);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (cancelled === 'paypal') {
      showNotification('warning', 'PayPal - Donación Cancelada', 'Donación cancelada. ¡Esperamos verte pronto!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'mercadopago') {
      const countryInfo = mercadopagoCountries[country as keyof typeof mercadopagoCountries] || { name: 'Desconocido', flag: '🌎' };
      const message = `¡Donación con MercadoPago completada! ${amount ? `Monto: ${amount} ${countryInfo.name}` : ''} Gracias por tu apoyo desde ${countryInfo.flag} ${countryInfo.name}. 🙏`;
      showNotification('success', 'MercadoPago - ¡Donación Exitosa!', message);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (failure === 'mercadopago') {
      showNotification('error', 'MercadoPago - Error en Pago', 'Hubo un problema con tu donación. Por favor, intenta nuevamente.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (pending === 'mercadopago') {
      showNotification('info', 'MercadoPago - Pago Pendiente', 'Tu donación está siendo procesada. Te notificaremos cuando esté confirmada.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const showAllFallbacks = () => {
      tiersConfig.forEach((_, index) => {
        const fallbackButton = document.getElementById(`paypal-fallback-${index}`);
        if (fallbackButton) {
          fallbackButton.style.display = 'block';
        }

        const container = document.getElementById(`paypal-button-container-${index}`);
        if (container) {
          container.style.display = 'none';
        }
      });
    };

    const showFallbackButton = (index: number) => {
      const container = document.getElementById(`paypal-button-container-${index}`);
      const fallback = document.getElementById(`paypal-fallback-${index}`);

      if (container && fallback) {
        container.innerHTML = '<div class="text-sm text-center py-2 text-gray-500">Usar PayPal Clásico</div>';
        fallback.style.display = 'flex';
        fallback.classList.remove('hidden');
      }
    };

    const initPayPalButtons = () => {
      if (typeof window !== 'undefined' && window.paypal?.Buttons) {
        tiersConfig.forEach((tier, index) => {
          const containerId = `paypal-button-container-${index}`;
          const container = document.getElementById(containerId);

          if (!container || !window.paypal) return;

          try {
            container.innerHTML = '';

            window.paypal!.Buttons({
              createOrder: (_data: unknown, actions: PayPalOrderActions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      currency_code: 'USD',
                      value: tier.amount.toString()
                    },
                    description: `${tier.name} - SantaPalabra`
                  }]
                });
              },

              onApprove: async (_data: unknown, actions: PayPalOrderActions) => {
                try {
                  const order = await actions.order.capture();

                  const message = `¡Donación completada!\n\nMonto: $${order.purchase_units[0].amount.value} USD\nID: ${order.id}\n\n¡Gracias por apoyar SantaPalabra!`;
                  alert(message);
                } catch (error) {
                  console.error('Error capturando pago:', error);
                  alert('Error completando el pago. Por favor contacta soporte.');
                }
              },

              onError: (err: unknown) => {
                console.error('Error PayPal:', err);
                alert('Error en el pago. Puedes usar el botón "PayPal Clásico" como alternativa.');
                showFallbackButton(index);
              },

              onCancel: () => {
                // Payment cancelled by user
              },

              style: {
                color: 'gold',
                shape: 'pill',
                height: 50
              }

            }).render(`#${containerId}`);

          } catch (error) {
            console.error(`Error creando botón ${index}:`, error);
            showFallbackButton(index);
          }
        });
      } else {
        showAllFallbacks();
      }
    };

    const waitForPayPal = () => {
      let attempts = 0;
      const maxAttempts = 50;

      const checkPayPal = () => {
        attempts++;
        if (typeof window !== 'undefined' && window.paypal?.Buttons) {
          initPayPalButtons();
        } else if (attempts < maxAttempts) {
          setTimeout(checkPayPal, 100);
        } else {
          showAllFallbacks();
        }
      };

      checkPayPal();
    };

    const loadPayPalSDK = () => {
      if (window.paypal) {
        initPayPalButtons();
        return;
      }

      if (document.querySelector('script[src*="paypal.com/sdk"]')) {
        waitForPayPal();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons`;
      script.async = true;

      script.onload = () => {
        initPayPalButtons();
      };

      script.onerror = () => {
        showAllFallbacks();
      };

      document.head.appendChild(script);
    };

    let attempts = 0;
    const maxAttempts = 8;

    const tryInitialize = () => {
      attempts++;

      if (typeof window !== 'undefined' && window.paypal) {
        initPayPalButtons();
      } else if (attempts < maxAttempts) {
        setTimeout(tryInitialize, 1000);
      } else {
        showAllFallbacks();
        loadPayPalSDK();
      }
    };

    const timer = setTimeout(tryInitialize, 1000);

    return () => clearTimeout(timer);
  }, [tiersConfig, showNotification]);
}

export default function SupportPage() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const {
    mpLoaded,
    setMpLoaded,
    loading,
    setLoading,
    selectedCountry,
    setSelectedCountry,
    handlePayment: handleMercadoPagoPayment
  } = useMercadoPagoDonations();

  const [showDiffusionModal, setShowDiffusionModal] = useState(false);

  // Show notification helper
  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 7000); // Auto-hide after 7 seconds
  };

  usePayPalDonations(tiers, showNotification);

  // PayPal SDK - Native JavaScript Implementation (No Next.js Script conflicts)
  // Logic handled by usePayPalDonations hook

  return (
    <>
      {/* MercadoPago SDK v2 - Official Client-side Integration */}
      <Script 
        src="https://sdk.mercadopago.com/js/v2" 
        strategy="lazyOnload"
        onLoad={() => {
          setMpLoaded(true);
        }}
        onError={() => {
          console.warn('⚠️ MercadoPago SDK failed to load');
        }}
      />
      
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <SupportHeader
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />
        <SupportContent
          loading={loading}
          mpLoaded={mpLoaded}
          selectedCountry={selectedCountry}
          onMercadoPagoPayment={handleMercadoPagoPayment}
          setLoading={setLoading}
          onOpenDiffusionModal={() => setShowDiffusionModal(true)}
        />
      </div>
      
      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
      />

      <DiffusionSupportModal 
        isOpen={showDiffusionModal} 
        onClose={() => setShowDiffusionModal(false)} 
      />

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

interface SupportHeaderProps {
  selectedCountry: string;
  onCountryChange: (value: string) => void;
}

function SupportHeader({ selectedCountry, onCountryChange }: SupportHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16 relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Link 
          href="/catholic-chat" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-sm font-medium border border-white/20 hover:scale-105 shadow-sm"
        >
          <span className="text-lg">←</span>
          <span>Volver al chat</span>
        </Link>
      </div>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          🕊️ Apoya SantaPalabra
        </h1>
        <p className="text-xl md:text-2xl mb-6">
          Tu Catequista Digital Hispanoamericano
        </p>
        <div className="mt-4 mb-6 text-center">
          <p className="text-sm text-gray-100/90 max-w-2xl mx-auto">
            Somos un equipo pequeño (2–5 personas). Necesitamos apoyo económico
            para lanzar la app móvil y mantener el servicio. Tu donación marca la diferencia.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <a
              href={PAYPAL_BUTTON_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Donar con PayPal — abre en una nueva pestaña"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-4 py-2 rounded-full shadow hover:scale-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>🅿️</span>
              <span>Donar con PayPal</span>
            </a>
            <a
              href="https://www.buymeacoffee.com/santapalabra"
              target="_blank"
              rel="noreferrer"
              aria-label="Donar con Buy Me a Coffee — abre en una nueva pestaña"
              className="inline-flex items-center gap-2 bg-amber-400 text-black font-semibold px-4 py-2 rounded-full shadow hover:scale-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span>☕</span>
              <span>BuyMeaCoffee</span>
            </a>
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-medium uppercase tracking-wide opacity-80">Pronto en</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/google-play-badge-es.png"
              alt="Disponible en Google Play"
              className="h-10 opacity-90"
            />
          </div>
        </div>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">
          Apoya con PayPal (internacional) o MercadoPago (América Latina). 
          Ayuda a mantener viva la evangelización digital y el acceso gratuito 
          a la sabiduría católica para toda Hispanoamérica. 🌎
        </p>
        <div className="mt-8 flex flex-col items-center space-y-4">
          <p className="text-sm opacity-75">Selecciona tu país para precios locales:</p>
          <select 
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(mercadopagoCountries).map(([code, info]) => (
              <option key={code} value={code}>
                {info.flag} {info.name} ({info.currency})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

interface SupportContentProps {
  loading: boolean;
  mpLoaded: boolean;
  selectedCountry: string;
  onMercadoPagoPayment: (amount: number, country: string) => void;
  setLoading: (loading: boolean) => void;
  onOpenDiffusionModal: () => void;
}

function SupportContent({ loading, mpLoaded, selectedCountry, onMercadoPagoPayment, setLoading, onOpenDiffusionModal }: SupportContentProps) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
          Apoya a SantaPalabra
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Tu generosidad nos permite seguir evangelizando y desarrollando herramientas tecnológicas para nuestra fe.
        </p>

        <div className="mx-auto max-w-3xl rounded-xl bg-amber-50/50 p-6 border border-amber-100 shadow-sm mb-12">
          <p className="text-lg font-serif italic text-amber-800">
            &ldquo;Cada uno debe dar según lo que haya decidido en su corazón, no de mala gana ni por obligación, porque Dios ama al que da con alegría.&rdquo;
          </p>
          <p className="mt-2 font-bold text-amber-700 text-sm tracking-wide uppercase">
            — 2 Corintios 9:7a
          </p>
        </div>
      </div>

      {/* Donation Tiers */}
      <DonationTiersSection
        loading={loading}
        mpLoaded={mpLoaded}
        selectedCountry={selectedCountry}
        onMercadoPagoPayment={onMercadoPagoPayment}
        setLoading={setLoading}
      />

      {/* Diffusion Support Button */}
      <div className="mt-12 text-center">
        <button
          onClick={onOpenDiffusionModal}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full font-medium transition-colors border border-indigo-200"
        >
          <span className="text-xl">📣</span>
          <span>No puedo aportar dinero, pero quiero ayudar difundiendo</span>
        </button>
      </div>



      {/* FAQ or Additional Info could go here */}
    </main>
  );
}

interface DonationTiersSectionProps {
  loading: boolean;
  mpLoaded: boolean;
  selectedCountry: string;
  onMercadoPagoPayment: (amount: number, country: string) => void;
  setLoading: (loading: boolean) => void;
}

function DonationTiersSection({
  loading,
  mpLoaded,
  selectedCountry,
  onMercadoPagoPayment,
  setLoading,
}: DonationTiersSectionProps) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--vatican-dark)' }}>
        Elige tu Nivel de Apoyo
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier, index) => (
          <div 
            key={index}
            className="rounded-lg p-6 shadow-lg border-2 border-transparent transition-all duration-200"
            style={{ 
              background: 'var(--vatican-white)',
              color: 'var(--vatican-dark)'
            }}
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="text-3xl font-bold mb-2 text-amber-500">
                ${tier.amount}
              </div>
              <p className="text-sm text-gray-600">{tier.description}</p>
            </div>
            <div className="space-y-3">
              <DonationButton
                provider="mercadopago"
                onClick={() => {
                  if (!mpLoaded) return;
                  const localAmount = calculateLocalAmount(tier.amount, selectedCountry);
                  onMercadoPagoPayment(localAmount, selectedCountry);
                }}
                disabled={loading}
                className="w-full"
              >
                <span>{mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries].flag}</span>
                <span>Pagar con MercadoPago</span>
              </DonationButton>

              <div 
                id={`paypal-button-container-${index}`}
                className="w-full hidden" // Hidden by default, prioritizing the hosted link
                style={{ minHeight: '50px' }}
              >
                <div className="w-full bg-[#003087] hover:bg-[#00256b] text-white font-semibold py-3 px-6 rounded-full text-center flex items-center justify-center gap-2 shadow-md h-[50px]">
                  <span className="text-lg">🅿️</span>
                  <span>Cargando PayPal...</span>
                </div>
              </div>

              <DonationButton
                provider="paypal"
                id={`paypal-fallback-${index}`}
                onClick={() => {
                   window.open(PAYPAL_BUTTON_URL, '_blank', 'noopener,noreferrer');
                }}
                disabled={false}
                className="w-full flex" // Always visible now
              >
                <span>🅿️</span>
                <span>Pagar con PayPal</span>
              </DonationButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface NotificationBannerProps {
  notification: NotificationState | null;
  onClose: () => void;
}

function NotificationBanner({ notification, onClose }: NotificationBannerProps) {
  if (!notification) return null;

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden animate-slide-in z-50 ${bgColors[notification.type]}`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-white">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-white opacity-90">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-md inline-flex text-white hover:text-gray-200 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
