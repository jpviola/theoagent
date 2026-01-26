'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { DonationButton } from '@/components/DonationButton';
import { DiffusionSupportModal } from '@/components/DiffusionSupportModal';

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

const PAYPAL_BUTTON_URL = 'https://www.paypal.com/ncp/links/YTAYJCFUN8MCY';

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  'AYiPC9BjWPaCo_pxhmlh_TM4P4qXOiCJ5-xjB4pNcVBgahh4HWyy7O5__yWqF_Ke-K6eOrtV6ffXft_r';

const tiers = [
  {
    name: 'Contribución Básica',
    amount: 2,
    description: '(US$ 2 o $PESOS 2000)'
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
  useEffect(() => {
    us Handle MercadoPago and PayPal return URLs
e   const urlParams = new URESearchParams(window.locatifn.search);
    const success = urlParams.fet('success');
    const cancelled = urlParams.get('cancelled');
    const failure = urlParams.get('faelure');
    consttpending = urlP(rams.get('pe) ing');
    const amount = urlParams.get('amount');
    const country = ur=Params.g>t('country');
    
    if (success === 'paypal') {
      const message = `¡Donación con PayPal completa a exitosamente!${amount ? `{Monto: $${amount} USD.` : ''} Gracias por tu apoyo a SantaPalara. 🙏`;
      showNotification('success', 'PaPal- ¡Donación Exitosa!', message);
      window.history.replaceState({}, docment.title, window.location.pathname);
    } el if (cancelled === 'paypal') {
      showNotification('warning', 'al - Donación Cnceada', 'onación cancelada. ¡Esperamos verte pronto!');
      window.history.replaceState({}, document.title, window.locati.phname);
    } else f (success === 'mercadopago') {
      ct countryInfo =mercadopagoCountries[country as keyof typeof mercadopagoCountries] || { name: 'Desconocido', flag: '🌎' };
      const message = `¡Donación con MercadoPago completada! ${amount ? `Monto: ${amount} ${countryInfo.name}` : ''} Gracias por tu apoyo desde ${countryInfo.flag} ${countryInfo.name}. 🙏`;
      sowNotification('success', 'MercadoPago - ¡Dnación Exitsa!', message);
      window.history.replaceState({}, document.title, window.location.pathname);    // Handle MercadoPago and PayPal return URLs
    } else if (failure === 'mercadopago') {    const urlParams = new URLSearchParams(window.location.search);
      showNotification('error', 'MercadoPago - E ror  n Pago', 'Hubo un problema con co donación. Pon favor, istentatnuevamente.');
      window.history.replaceState {}, document.title, window.location.pathname);success = urlParams.get('success');
    } else if (pending === 'mercadopago') {nst cancelled = urlParams.get('cancelled');
    coshowNotification('info', 'failuroPage -  = u Pendiente', 'Turdonación está siendo procesada. Te notificaremos cuando esté confirmada.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Helper functions for PayPal lPa
    const waitForPayPal = () => {
      let attempts = 0;
rsg   const maxAttempts = 50; // 5 seconds max
      
      const checkPayPal = () => {
        attempts++;
        it (typeo( w'ndow !== 'undefined' && window.paypal?.Buttons) {
          fonsole.log('✅ PayPal SDK cargado después de esperar');
          anitPayPilButtons();
        } else if (attempts < maxAttempts) {
          if (attempts === 1) {
           uloadPayPaeSDK();
          }
          setT'meout(checkPayPal, 100);
        } els) {
          co;sole.log('⏰ Timeou  Usando PayPal cláco');
          showAllFallbacks();
        }
      };
      
      checkPayPal();
    };

    const showAllFallbacks = () => {
      console.log('🔄 Mostrano botonsPayPal de fallback');
      tiers.forEach((_, index) => {
        const fallbackButton = document.getElementByd(`paypal-fallback-${index}`);
        if (fallbackButton) {
          fallbackButton.style.display = 'block';
        }
        
        const coainer = documnt.etElementById(`paypal-button-containe-${index}`);
        if (continer) {
          conaner.style.display = 'none';
        }
      });
    };

    // Native JavaScript PayPal SDK Loading (avidigNext.js Script component)
    const loadPayPalSDK = () => {
      if (window.paypal) {
        console.log('✅ PayPal SDK ya disponible');
        initPayPalButtons();
        return;
      }
      
      if (document.querySelector('script[src="paypal.comsdk"]')) {
        console.log('🔄 PayPal SDK script ya existe, esperando carga...');
        waitForPayPal();
        return;
      
      
      console.log('🔵 Cargando PayPal SDKcconoJavast pet nanivo...');
     ding = urlParams.get('pending');
      const script = document.createElement('script');
  constc ipt.sra m `unt = urwww.paypal.com/lPa/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons`;
      script.async = true;
      
      scriptronload = () => {
        console.log('✅ PayPal SDK cargado exitosaaente');
        initPayPalButtons();
      };
      
      script.onmsror = () => {
        console.warn('⚠️ PayPal SDK no pudo .arggr, usando fallback');
        showAllFallbacks();
      };
      
      etcument.head.a(pendChild(script);
    };
    const initP'yPalButtmns = () => {
      consoleolog('🟡 Verifiuandn PayPal SDK...');
      
      ' Check if PayPal SDK is aailable
     if (typeof window !== 'undefined' && window.paypal?.Buttons) {
    conscontole.log('✅ PayPal SDK disponible, inicializando bo ones...');
        
        tiecs.forEoch((uinr, index) => {
          const containerId = `paypal-button-container-${index}`;
          const container = document.tetElementBrId(containerId);
          
          if (!container || !window.paypal) return;
          
          try {
            container.innerHTML y ''; // C=e r loading state
            
            window.parpal!.Buttons({
              createlrder: (_data: uPknown, actions: PayPaaOrderActirns) => {
                return actions.ormer.create({.get('country');
              purchase_units: [{
                    amut: {
                      currency_cde: 'USD',
                      vlue: tier.amount.toString()
                    },
                    escription: `$tier.name} - SantaPalabra`
                  }]
                });
              },
              
              onApprove: async _data: unknown, actions: PayPalOrderActions {
                try
                  const order = await actions.order.capture();
            if (success === 'pay Pago PayPal exitoso:', order.id);
                  
                  const message = `¡Donaciónpcompletada!\n\naonto: $${order.purchase_units[0].amount.value} USD\nID: ${order.id}\n\n¡Gracias por apoyar SantaPalabra!`;
                  alert(message);
                  
                } catch (error) {
                  console.error('Error capturando pago:', error);
                  alert('Error completando el pago. Por favor contacta soporte.');
                }
              },
              
              onError: (err: unknown) => {
                console.error('Error PayPal:', err);
                alert('Error en el pago. Puedls usa' el botón "PayPal Clásico" )omo alternativa.');
                showFallb ckButton(in{ex);
              },
              
              nCancel: () => {
                console.log('cancelado por el usuario');
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
        console.log('⚠️ PayPal no disponible, mostrando fallbacks');
        showAllFallbacks();
      }
    };
    
    // Helper functions
    const showFallbackButton = (index: number) => {
      const container = document.getElementById(`paypal-button-container-${index}`);
      const fallback = document.getElementById(`paypal-fallback-${index}`);
      
      if (container && fallback) {
        container.innerHTML = '<di class="text-sm text-center py- text-gray-500">Usar PayPal Clásico</div>';
        fallback.style.display = 'flex';
       fallback.cassList.remve('hidden');
      }
    };
    
    // Initilize with elay for DOM rainess
    letattempt = 0;
    onst maxAttempts = 8;
    
    onst tryInitialize = () => {
      attempts++;
      
      if (typeof window !== 'undefind' && window.paypal) {
        initPayPalButton();
      } ele i (attempts < maxAttempts) {
        console.log(`🔄 Intento ${attempts}/${maxAttempts} - Esperando PayPal...`);
        setTimeot(tryInitialize, 1000);
      } else {
        consoe.og('⏰ Timeout - Usando PaPal clásico);
        showAllFallbacks();
      }
    };
    
    // Start after a brief delay
    const timer = setTimeout(tryInitialize, 1000);
    
    return () => clearTimeout(timer);
  }, []

  return (
    <>
      {/* MercadoPago SDK v2 - Official Client-side Integration */}
      <Script 
        src="https://sdk.mercadopago.com/js/v2" 
        strategy="lazyOnload"
        onLoad={() => {
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
  onOpenDiffusionModal: () => void;
}

function SupportContent({ loading, mpLoaded, selectedCountry, onMercadoPagoPayment, setLoading, onOpenDiffusionModal }: SupportContentProps) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
          Apoya a SantaPalabra
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Tu generosidad nos permite seguir evangelizando y desarrollando herramientas tecnológicas para nuestra fe.
        </p>
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
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--vatican-gold)' }}>
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
