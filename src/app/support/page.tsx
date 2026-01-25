'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { DonationButton } from '@/components/DonationButton';

interface MercadoPagoCheckoutOptions {
  preference: {
    id: string;
  };
  render: {
    container: string;
    label: string;
  };
}

interface MercadoPagoInstance {
  checkout: (options: MercadoPagoCheckoutOptions) => Promise<void>;
  bricks: () => {
    create: (type: string, containerId: string, options: unknown) => Promise<unknown>;
  };
}

interface PayPalOrder {
  purchase_units: {
    amount: {
      value: string;
    };
  }[];
  id: string;
}

interface PayPalOrderActions {
  order: {
    create: (input: {
      purchase_units: {
        amount: {
          currency_code: string;
          value: string;
        };
        description: string;
      }[];
    }) => Promise<string | void>;
    capture: () => Promise<PayPalOrder>;
  };
}

interface PayPalButtonsConfig {
  createOrder: (data: unknown, actions: PayPalOrderActions) => Promise<string | void>;
  onApprove: (data: unknown, actions: PayPalOrderActions) => Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
  style?: {
    color?: string;
    shape?: string;
    height?: number;
  };
}

const PAYPAL_BUTTON_URL = process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID
  ? `https://www.paypal.com/donate?hosted_button_id=${process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID}`
  : 'https://www.paypal.com/donate';

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  'AYiPC9BjWPaCo_pxhmlh_TM4P4qXOiCJ5-xjB4pNcVBgahh4HWyy7O5__yWqF_Ke-K6eOrtV6ffXft_r';

const tiers = [
  {
    name: 'Contribución Básica',
    amount: 2,
    description: '(US$ 2 o $ PESOS 2000)'
  },
  {
    name: 'Apoyo Pastoral',
    amount: 10,
    description: '(US$ 10 o $PESOS 15)'
  },
  {
    name: 'Apoyo Institucional',
    amount: 100,
    description: '(US$ 100 o $PESOS 150.000)'
  }
];

// MercadoPago Client-side SDK v2 - Promise-based with fraud prevention
declare global {
  interface Window {
    MercadoPago?: {
      new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance;
    };
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
}

const mercadopagoCountries = {
  mla: { name: 'Argentina', currency: 'ARS', flag: '🇦🇷', rate: 100 },
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
                console.log('Pago cancelado por el usuario');
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

  // Show notification helper
  const showNotification = (type: NotificationType, title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 7000); // Auto-hide after 7 seconds
  };

  usePayPalDonations(tiers, showNotification);

  // PayPal SDK - Native JavaScript Implementation (No Next.js Script conflicts)
  useEffect(() => {
    // Handle MercadoPago and PayPal return URLs
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

    // Helper functions for PayPal SDK
    const waitForPayPal = () => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      const checkPayPal = () => {
        attempts++;
        if (typeof window !== 'undefined' && window.paypal?.Buttons) {
          console.log('✅ PayPal SDK cargado después de esperar');
          initPayPalButtons();
        } else if (attempts < maxAttempts) {
          if (attempts === 1) {
            loadPayPalSDK();
          }
          setTimeout(checkPayPal, 100);
        } else {
          console.log('⏰ Timeout - Usando PayPal clásico');
          showAllFallbacks();
        }
      };
      
      checkPayPal();
    };

    const showAllFallbacks = () => {
      console.log('🔄 Mostrando botones PayPal de fallback');
      tiers.forEach((_, index) => {
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

    // Native JavaScript PayPal SDK Loading (avoiding Next.js Script component)
    const loadPayPalSDK = () => {
      if (window.paypal) {
        console.log('✅ PayPal SDK ya disponible');
        initPayPalButtons();
        return;
      }
      
      if (document.querySelector('script[src*="paypal.com/sdk"]')) {
        console.log('🔄 PayPal SDK script ya existe, esperando carga...');
        waitForPayPal();
        return;
      }
      
      console.log('🔵 Cargando PayPal SDK con JavaScript nativo...');
      
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons`;
      script.async = true;
      
      script.onload = () => {
        console.log('✅ PayPal SDK cargado exitosamente');
        initPayPalButtons();
      };
      
      script.onerror = () => {
        console.warn('⚠️ PayPal SDK no pudo cargar, usando fallback');
        showAllFallbacks();
      };
      
      document.head.appendChild(script);
    };
    const initPayPalButtons = () => {
      console.log('🟡 Verificando PayPal SDK...');
      
      // Check if PayPal SDK is available
      if (typeof window !== 'undefined' && window.paypal?.Buttons) {
        console.log('✅ PayPal SDK disponible, inicializando botones...');
        
        tiers.forEach((tier, index) => {
          const containerId = `paypal-button-container-${index}`;
          const container = document.getElementById(containerId);
          
          if (!container || !window.paypal) return;
          
          try {
            container.innerHTML = ''; // Clear loading state
            
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
                  console.log('✅ Pago PayPal exitoso:', order.id);
                  
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
                console.log('Pago cancelado por el usuario');
              },
              
              style: {
                color: 'gold',
                shape: 'pill',
                height: 50
              }
              
            }).render(`#${containerId}`);
            
            console.log(`✅ Botón PayPal ${index} creado`);
            
          } catch (error) {
            console.error(`Error creando botón ${index}:`, error);
            showFallbackButton(index);
          }
        });
      } else {
        console.log('⚠️ PayPal SDK no disponible, mostrando fallbacks');
        showAllFallbacks();
      }
    };
    
    // Helper functions
    const showFallbackButton = (index: number) => {
      const container = document.getElementById(`paypal-button-container-${index}`);
      const fallback = document.getElementById(`paypal-fallback-${index}`);
      
      if (container && fallback) {
        container.innerHTML = '<div class="text-sm text-center py-2 text-gray-500">Usar PayPal Clásico</div>';
        fallback.style.display = 'flex';
        fallback.classList.remove('hidden');
      }
    };
    
    // Initialize with delay for DOM readiness
    let attempts = 0;
    const maxAttempts = 8;
    
    const tryInitialize = () => {
      attempts++;
      
      if (typeof window !== 'undefined' && window.paypal) {
        initPayPalButtons();
      } else if (attempts < maxAttempts) {
        console.log(`🔄 Intento ${attempts}/${maxAttempts} - Esperando PayPal...`);
        setTimeout(tryInitialize, 1000);
      } else {
        console.log('⏰ Timeout - Usando PayPal clásico');
        showAllFallbacks();
      }
    };
    
    // Start after a brief delay
    const timer = setTimeout(tryInitialize, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* MercadoPago SDK v2 - Official Client-side Integration */}
      <Script 
        src="https://sdk.mercadopago.com/js/v2" 
        strategy="lazyOnload"
        onLoad={() => {
          console.log('✅ MercadoPago SDK v2 loaded successfully');
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
        />
      </div>
      
      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
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
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
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
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-4 py-2 rounded-full shadow hover:scale-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <span>🅿️</span>
              <span>Donar con PayPal</span>
            </a>
            <a
              href="https://www.buymeacoffee.com/santapalabra"
              target="_blank"
              rel="noreferrer"
              aria-label="Donar con Buy Me a Coffee — abre en una nueva pestaña"
              className="inline-flex items-center gap-2 bg-yellow-400 text-black font-semibold px-4 py-2 rounded-full shadow hover:scale-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <span>☕</span>
              <span>Buy Me a Coffee</span>
            </a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png"
              alt="Android (Google Play)"
              className="h-10"
            />
            <span className="text-sm text-white/90">Pronto en Android Store</span>
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
}

function SupportContent({
  loading,
  mpLoaded,
  selectedCountry,
  onMercadoPagoPayment,
  setLoading,
}: SupportContentProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <a 
          href="https://www.buymeacoffee.com/santapalabra" 
          target="_blank" 
          rel="noreferrer"
          style={{ background: 'var(--vatican-gold)', color: 'black' }}
          className="inline-block px-8 py-4 rounded-lg font-bold text-xl hover:opacity-90 transition-opacity"
        >
          ☕ Donación Rápida con BuyMeACoffee
        </a>
      </div>

      <DonationTiersSection
        loading={loading}
        mpLoaded={mpLoaded}
        selectedCountry={selectedCountry}
        onMercadoPagoPayment={onMercadoPagoPayment}
        setLoading={setLoading}
      />

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">¿En qué se usan las donaciones?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <h3 className="font-semibold">Operación</h3>
            <p className="text-sm mt-1">Servidores, costos de la API y mantenimiento diario para que la app esté disponible 24/7.</p>
          </div>
          <div className="rounded-2xl p-4 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <h3 className="font-semibold">Desarrollo</h3>
            <p className="text-sm mt-1">Mejoras en la calidad de respuestas, nuevas funciones y soporte móvil.</p>
          </div>
          <div className="rounded-2xl p-4 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <h3 className="font-semibold">Contenido</h3>
            <p className="text-sm mt-1">Validación por expertos, traducciones y materiales para catequistas.</p>
          </div>
          <div className="rounded-2xl p-4 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <h3 className="font-semibold">Accesibilidad</h3>
            <p className="text-sm mt-1">Planes para dar acceso gratuito a parroquias y comunidades en riesgo.</p>
          </div>
        </div>
      </section>

      <section id="tiers" className="mb-8 rounded-2xl p-6 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
        <h2 className="text-2xl font-semibold mb-3">Niveles de apoyo (sugeridos)</h2>
        <ul className="space-y-3">
          <li><strong>Amigo — $2</strong> · Gracias pública en la web.</li>
          <li><strong>Sostenedor — $10</strong> · Reporte trimestral y acceso anticipado a novedades.</li>
          <li><strong>Patrono — $250</strong> · Mención destacada y sesión virtual con el equipo.</li>
          <li><strong>Parroquia / Escuela — $500</strong> · Acceso multiusuario y soporte para integración.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Testimonios</h2>
        <div className="space-y-4">
          <blockquote className="rounded-2xl p-4 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <p className="italic">“SantaPalabra nos ayudó a preparar la clase de confirmación cuando no había material disponible. Una herramienta que acompaña.”</p>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">— María, catequista (Parroquia San José)</div>
          </blockquote>

          <blockquote className="rounded-2xl p-4 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
            <p className="italic">“Mi grupo juvenil usa la app para preparar las reuniones y los jóvenes la encuentran cercana y respetuosa.”</p>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">— Pedro, líder juvenil</div>
          </blockquote>
        </div>
      </section>

      <section className="mb-8 rounded-2xl p-6 shadow-md border border-yellow-100 bg-white text-gray-800 dark:bg-gray-800 dark:border-amber-700 dark:text-gray-100">
        <h2 className="text-2xl font-semibold mb-3">Preguntas frecuentes</h2>
        <div className="space-y-3">
          <div>
            <strong>¿La app sustituye al sacerdote?</strong>
            <p className="text-sm">No. Es una herramienta complementaria para ayudar a entender la fe.</p>
          </div>
          <div>
            <strong>¿Quién valida el contenido?</strong>
            <p className="text-sm">Trabajamos con asesores católicos y usamos documentos oficiales como base.</p>
          </div>
        </div>
      </section>

      <div className="text-center mb-12">
        <DonationButton
          provider="buymeacoffee"
          href="https://www.buymeacoffee.com/santapalabra"
          label="Donar ahora y apoyar la evangelización digital"
          className="px-8 py-4"
        />
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        ¿Quieres que preparemos materiales personalizados para tu parroquia?{" "}
        <Link href="/blog" className="underline">
          Contáctanos
        </Link>
        .
      </div>
    </div>
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
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--vatican-gold)' }}>
                ${tier.amount}
              </div>
              <p className="text-sm text-gray-600">{tier.description}</p>
            </div>
            <div className="space-y-3">
              <DonationButton
                provider="mercadopago"
                onClick={() => {
                  const localAmount = calculateLocalAmount(tier.amount, selectedCountry);
                  onMercadoPagoPayment(localAmount, selectedCountry);
                }}
                disabled={loading || !mpLoaded}
                className="w-full"
                title={!mpLoaded ? 'Cargando SDK de MercadoPago...' : ''}
              >
                <span>{mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries].flag}</span>
                <span>
                  {loading ? 'Procesando...' : 
                   !mpLoaded ? 'Cargando MercadoPago...' :
                   `${calculateLocalAmount(tier.amount, selectedCountry)} ${mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries].currency} - MercadoPago`}
                </span>
              </DonationButton>

              <div 
                id={`paypal-button-container-${index}`}
                className="w-full"
                style={{ minHeight: '50px' }}
              >
                <div className="w-full bg-[#003087] hover:bg-[#00256b] text-white font-semibold py-3 px-6 rounded-full text-center animate-pulse flex items-center justify-center gap-2 shadow-md">
                  <span className="text-lg">🅿️</span>
                  <span>Cargando PayPal...</span>
                </div>
              </div>

              <DonationButton
                provider="paypal"
                id={`paypal-fallback-${index}`}
                onClick={async () => {
                  setLoading(true);
                  try {
                    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?` +
                      `cmd=_donations&` +
                      `business=santapalabra@outlook.com&` +
                      `item_name=Donación ${tier.name} - SantaPalabra&` +
                      `amount=${tier.amount}&` +
                      `currency_code=USD&` +
                      `return=${window.location.origin}/support?success=paypal&amount=${tier.amount}&` +
                      `cancel_return=${window.location.origin}/support?cancelled=paypal&` +
                      `notify_url=${window.location.origin}/api/payments/paypal/webhook`;
                    window.location.href = paypalUrl;
                  } catch (error) {
                    console.error('PayPal fallback error:', error);
                    alert('Error procesando el pago con PayPal');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="hidden w-full"
              >
                <span>🅿️</span>
                <span>{loading ? 'Procesando...' : 'Pagar con PayPal (Clásico)'}</span>
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

  return (
    <div
      className={`fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg border-l-4 z-50 animate-slide-in ${
        notification.type === 'success'
          ? 'bg-green-50 border-green-500 text-green-800'
          : notification.type === 'error'
          ? 'bg-red-50 border-red-500 text-red-800'
          : notification.type === 'warning'
          ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
          : 'bg-blue-50 border-blue-500 text-blue-800'
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {notification.type === 'success'
            ? '✅'
            : notification.type === 'error'
            ? '❌'
            : notification.type === 'warning'
            ? '⚠️'
            : 'ℹ️'}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{notification.title}</h4>
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-lg hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}
