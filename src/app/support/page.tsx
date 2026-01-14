'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const tiers = [
  {
    name: 'Contribución Básica',
    amount: 5,
    description: 'Ayuda a mantener el servidor funcionando'
  },
  {
    name: 'Apoyo Pastoral',
    amount: 15,
    description: 'Contribuye al desarrollo de contenido teológico'
  },
  {
    name: 'Patrocinio Completo',
    amount: 50,
    description: 'Financia mejoras significativas y nuevas funciones'
  }
];

// MercadoPago Client-side SDK v2 - Promise-based with fraud prevention
declare global {
  interface Window {
    MercadoPago?: {
      new (publicKey: string, options?: { locale?: string }): {
        checkout: (preference: any) => Promise<void>;
        bricks: () => {
          create: (type: string, containerId: string, options: any) => Promise<any>;
        };
      };
    };
    paypal?: {
      Buttons: (config: any) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('mla'); // Default Argentina
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Show notification helper
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ type, title, message });
    setTimeout(() => setNotification(null), 7000); // Auto-hide after 7 seconds
  };

  // MercadoPago countries and currencies support
  const mercadopagoCountries = {
    'mla': { name: 'Argentina', currency: 'ARS', flag: '🇦🇷', rate: 100 }, // $5 USD = 500 ARS
    'mlb': { name: 'Brasil', currency: 'BRL', flag: '🇧🇷', rate: 6 }, // $5 USD = 30 BRL
    'mlm': { name: 'México', currency: 'MXN', flag: '🇲🇽', rate: 17 }, // $5 USD = 85 MXN
    'mco': { name: 'Colombia', currency: 'COP', flag: '🇨🇴', rate: 800 }, // $5 USD = 4000 COP
    'mpe': { name: 'Perú', currency: 'PEN', flag: '🇵🇪', rate: 3.8 }, // $5 USD = 19 PEN
    'mlu': { name: 'Uruguay', currency: 'UYU', flag: '🇺🇾', rate: 39 }, // $5 USD = 195 UYU
    'mlc': { name: 'Chile', currency: 'CLP', flag: '🇨🇱', rate: 900 } // $5 USD = 4500 CLP
  };

  // Calculate local amount based on approximate exchange rates
  const calculateLocalAmount = (usdAmount: number, country: string): number => {
    const countryInfo = mercadopagoCountries[country as keyof typeof mercadopagoCountries];
    return Math.round(usdAmount * countryInfo.rate);
  };

  // Enhanced MercadoPago payment with SDK v2 and fraud prevention
  const handleMercadoPagoPayment = async (amount: number, country: string = 'mla') => {
    if (!mpLoaded || !window.MercadoPago) {
      alert('MercadoPago SDK no está cargado. Por favor, recarga la página.');
      return;
    }

    setLoading(true);
    try {
      const countryInfo = mercadopagoCountries[country as keyof typeof mercadopagoCountries];
      
      // Create server-side preference with enhanced metadata
      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount,
          currency: countryInfo.currency,
          country: country,
          donor_email: 'supporter@santapalabra.app',
          donor_name: `Donante ${countryInfo.name}`,
          // Enhanced fraud prevention metadata
          metadata: {
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            source: 'santapalabra_support_page'
          }
        })
      });
      
      const data = await response.json();
      if (data.success && data.preference) {
        // Use SDK v2 client-side with fraud prevention
        const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '', {
          locale: 'es'
        });
        
        // Redirect to checkout with enhanced security
        await mp.checkout({
          preference: {
            id: data.preference.id
          },
          render: {
            container: '.cho-container',
            label: 'Donar'
          }
        });
        
        // Fallback to direct redirect if SDK checkout fails
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

  // Temporarily disabled - Stripe not available in Argentina
  const handleStripePayment = async (amount: number) => {
    alert('🚧 Stripe no disponible en Argentina. \n\n✅ Usa PayPal o espera MercadoPago pronto.');
    return;
    /*
    setLoading(true);
    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount * 100 }) // Convert to cents
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Stripe payment error:', error);
      alert('Error procesando el pago con Stripe');
    }
    setLoading(false);
    */
  };

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
      // Check if PayPal script already loaded
      if (window.paypal) {
        console.log('✅ PayPal SDK ya disponible');
        initPayPalButtons();
        return;
      }
      
      // Check if script already exists in DOM
      if (document.querySelector('script[src*="paypal.com/sdk"]')) {
        console.log('🔄 PayPal SDK script ya existe, esperando carga...');
        waitForPayPal();
        return;
      }
      
      console.log('🔵 Cargando PayPal SDK con JavaScript nativo...');
      
      // Create script element manually
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AYiPC9BjWPaCo_pxhmlh_TM4P4qXOiCJ5-xjB4pNcVBgahh4HWyy7O5__yWqF_Ke-K6eOrtV6ffXft_r&currency=USD&components=buttons';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ PayPal SDK cargado exitosamente');
        initPayPalButtons();
      };
      
      script.onerror = () => {
        console.warn('⚠️ PayPal SDK no pudo cargar, usando fallback');
        showAllFallbacks();
      };
      
      // Append to head
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
              createOrder: (data: any, actions: any) => {
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
              
              onApprove: async (data: any, actions: any) => {
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
              
              onError: (err: any) => {
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
      
      <div className="min-h-screen" style={{
        background: 'var(--vatican-cream)',
        color: 'var(--foreground)'
      }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              🕊️ Apoya SantaPalabra
            </h1>
            <p className="text-xl md:text-2xl mb-6">
              Tu Catequista Digital Hispanoamericano
            </p>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Apoya con PayPal (internacional) o MercadoPago (América Latina). 
              Ayuda a mantener viva la evangelización digital y el acceso gratuito 
              a la sabiduría católica para toda Hispanoamérica. 🌎
            </p>
            
            {/* Country Selector for MercadoPago */}
            <div className="mt-8 flex flex-col items-center space-y-4">
              <p className="text-sm opacity-75">Selecciona tu país para precios locales:</p>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
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

        {/* Quick Support */}
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

          {/* Donation Tiers */}
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
                    {/* Enhanced MercadoPago Button with Country Selection */}
                    <button
                      onClick={() => {
                        const countryInfo = mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries];
                        const localAmount = calculateLocalAmount(tier.amount, selectedCountry);
                        handleMercadoPagoPayment(localAmount, selectedCountry);
                      }}
                      disabled={loading || !mpLoaded}
                      className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                        loading || !mpLoaded 
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      title={!mpLoaded ? 'Cargando SDK de MercadoPago...' : ''}
                    >
                      <span>{mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries].flag}</span>
                      <span>
                        {loading ? 'Procesando...' : 
                         !mpLoaded ? 'Cargando MercadoPago...' :
                         `${calculateLocalAmount(tier.amount, selectedCountry)} ${mercadopagoCountries[selectedCountry as keyof typeof mercadopagoCountries].currency} - MercadoPago`}
                      </span>
                    </button>
                    
                    {/* Stripe Button (Disabled for Argentina) */}
                    <button
                      onClick={() => handleStripePayment(tier.amount)}
                      disabled={true}
                      className="w-full bg-gray-400 text-gray-600 font-semibold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                      title="Stripe no disponible en Argentina"
                    >
                      <span>🚫</span>
                      <span>Stripe (No disponible)</span>
                    </button>
                    
                    {/* PayPal SDK v2 Button Container */}
                    <div 
                      id={`paypal-button-container-${index}`}
                      className="w-full"
                      style={{ minHeight: '50px' }}
                    >
                      <div className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg text-center animate-pulse">
                        Cargando PayPal...
                      </div>
                    </div>
                    
                    {/* Fallback PayPal Button (shown if SDK fails) */}
                    <button
                      id={`paypal-fallback-${index}`}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          // Enhanced PayPal redirection with better parameters
                          const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?` +
                            `cmd=_donations&` +
                            `business=santapalabra@outlook.com&` +
                            `item_name=Donación ${tier.name} - SantaPalabra&` +
                            `amount=${tier.amount}&` +
                            `currency_code=USD&` +
                            `return=${window.location.origin}/support?success=paypal&amount=${tier.amount}&` +
                            `cancel_return=${window.location.origin}/support?cancelled=paypal&` +
                            `notify_url=${window.location.origin}/api/webhooks/paypal`;
                          window.location.href = paypalUrl;
                        } catch (error) {
                          console.error('PayPal fallback error:', error);
                          alert('Error procesando el pago con PayPal');
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="hidden w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>🅿️</span>
                      <span>{loading ? 'Procesando...' : 'Pagar con PayPal (Clásico)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--vatican-dark)' }}>¿En qué se usan las donaciones?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div style={{ background: 'var(--vatican-white)', color: 'var(--vatican-dark)' }} className="rounded p-4 shadow-sm">
            <h3 className="font-semibold">Operación</h3>
            <p className="text-sm mt-1">Servidores, costos de la API y mantenimiento diario para que la app esté disponible 24/7.</p>
          </div>
          <div style={{ background: 'var(--vatican-white)', color: 'var(--vatican-dark)' }} className="rounded p-4 shadow-sm">
            <h3 className="font-semibold">Desarrollo</h3>
            <p className="text-sm mt-1">Mejoras en la calidad de respuestas, nuevas funciones y soporte móvil.</p>
          </div>
          <div style={{ background: 'var(--vatican-white)', color: 'var(--vatican-dark)' }} className="rounded p-4 shadow-sm">
            <h3 className="font-semibold">Contenido</h3>
            <p className="text-sm mt-1">Validación por expertos, traducciones y materiales para catequistas.</p>
          </div>
          <div style={{ background: 'var(--vatican-white)', color: 'var(--vatican-dark)' }} className="rounded p-4 shadow-sm">
            <h3 className="font-semibold">Accesibilidad</h3>
            <p className="text-sm mt-1">Planes para dar acceso gratuito a parroquias y comunidades en riesgo.</p>
          </div>
        </div>
      </section>

      <section id="tiers" className="mb-8 rounded p-6 shadow-sm" style={{ background: 'var(--vatican-cream)', color: 'var(--vatican-dark)' }}>
        <h2 className="text-2xl font-semibold mb-3">Niveles de apoyo (sugeridos)</h2>
        <ul className="space-y-3">
          <li><strong>Amigo — $5</strong> · Gracias pública en la web.</li>
          <li><strong>Sostenedor — $20</strong> · Reporte trimestral y acceso anticipado a novedades.</li>
          <li><strong>Patrono — $100</strong> · Mención destacada y sesión virtual con el equipo.</li>
          <li><strong>Parroquia / Escuela — $200</strong> · Acceso multiusuario y soporte para integración.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--vatican-dark)' }}>Testimonios</h2>
        <div className="space-y-4">
          <blockquote style={{ background: 'var(--vatican-white)', color: 'var(--vatican-dark)' }} className="rounded p-4 shadow-sm">
            <p className="italic">“SantaPalabra nos ayudó a preparar la clase de confirmación cuando no había material disponible. Una herramienta que acompaña.”</p>
            <div className="mt-2 text-sm" style={{ color: 'var(--vatican-dark)' }}>— María, catequista (Parroquia San José)</div>
          </blockquote>

          <blockquote style={{ background: 'var(--vatican-white)', color: 'var(--vatican-dark)' }} className="rounded p-4 shadow-sm">
            <p className="italic">“Mi grupo juvenil usa la app para preparar las reuniones y los jóvenes la encuentran cercana y respetuosa.”</p>
            <div className="mt-2 text-sm" style={{ color: 'var(--vatican-dark)' }}>— Pedro, líder juvenil</div>
          </blockquote>
        </div>
      </section>

      <section className="mb-8 rounded p-6 shadow-sm" style={{ background: 'var(--vatican-cream)', color: 'var(--vatican-dark)' }}>
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
        <a href="https://www.buymeacoffee.com/santapalabra" target="_blank" rel="noreferrer" style={{ background: 'var(--vatican-gold)', color: 'black' }} className="inline-block px-8 py-4 rounded-lg font-bold">Donar ahora y apoyar la evangelización digital</a>
      </div>

      <div className="text-center text-sm text-gray-500">¿Quieres que preparemos materiales personalizados para tu parroquia? <Link href="/blog" className="underline">Contáctanos</Link>.</div>

      {/* Development Testing Panel - Only shown in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <section className="mt-12 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">🧪 Panel de Pruebas (Solo Desarrollo)</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Probar Stripe API:</h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      console.log('🧪 Probando Stripe API...');
                      const response = await fetch('/api/payments/stripe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          amount: 500, 
                          donor_name: 'Test User',
                          donor_email: 'test@example.com',
                          message: 'Test donation from dev panel'
                        })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        alert(`✅ Stripe session created!\n\nURL: ${data.url.substring(0, 50)}...`);
                      } else {
                        alert(`❌ Error: ${data.error}`);
                      }
                    } catch (error: any) {
                      alert(`❌ Error: ${error.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Test $5 Stripe
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      console.log('📊 Obteniendo estadísticas...');
                      const response = await fetch('/api/donations?type=stats');
                      const data = await response.json();
                      if (response.ok) {
                        alert(`📊 Donation Stats:\n\nTotal: ${data.data.total_donations}\nCompleted: ${data.data.completed_donations}\nStripe: ${data.data.stripe_donations}\nPayPal: ${data.data.paypal_donations}`);
                      } else {
                        alert(`❌ Error: ${data.error}`);
                      }
                    } catch (error: any) {
                      alert(`❌ Error: ${error.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Ver Estadísticas
                </button>

                <button
                  onClick={() => {
                    window.open('/admin/donations', '_blank');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Panel Admin
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Test MercadoPago (Argentina):</h4>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    placeholder="Monto (ARS)" 
                    id="mercadopago-test-amount"
                    defaultValue={1000}
                    className="px-3 py-1 border rounded text-black text-sm w-24"
                  />
                  <button
                    onClick={async () => {
                      try {
                        const amountInput = document.getElementById('mercadopago-test-amount') as HTMLInputElement;
                        const amount = parseInt(amountInput.value) || 1000;
                        
                        // Test MercadoPago API
                        const response = await fetch('/api/payments/mercadopago', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            amount: amount,
                            currency: 'ARS',
                            donor_email: 'test@example.com',
                            donor_name: 'Usuario Test Argentina'
                          })
                        });

                        const data = await response.json();
                        if (response.ok && data.success) {
                          const checkoutUrl = data.preference.sandbox_init_point || data.preference.init_point;
                          alert(`✅ MercadoPago preference created!\n\nID: ${data.preference.id}\nAmount: $${amount} ARS\n\n🚀 Opening checkout...`);
                          console.log('MercadoPago Data:', data);
                          
                          // Open MercadoPago checkout in new tab
                          if (checkoutUrl) {
                            window.open(checkoutUrl, '_blank');
                          }
                        } else {
                          alert(`❌ Error: ${data.error}\n\n${data.details || ''}`);
                        }
                      } catch (error: any) {
                        alert(`❌ Error: ${error.message}`);
                      }
                    }}
                    className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Test MercadoPago
                  </button>
                </div>
                <p className="text-xs text-gray-600">MercadoPago para usuarios argentinos (próximamente)</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Crear Donación de Prueba:</h4>
              <button
                onClick={async () => {
                  try {
                    const testData = {
                      action: 'test_donation',
                      payment_provider: 'stripe',
                      amount_cents: 1000, // $10
                      donor_name: `Dev Test ${Math.floor(Math.random() * 1000)}`,
                      donor_email: `test${Math.floor(Math.random() * 1000)}@example.com`,
                      message: 'Test donation from development panel'
                    };

                    const response = await fetch('/api/donations', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testData)
                    });

                    const data = await response.json();
                    if (response.ok) {
                      alert(`✅ Test donation created!\n\nID: ${data.data.id}\nAmount: $${data.data.amount_cents / 100}`);
                    } else {
                      alert(`❌ Error: ${data.error}`);
                    }
                  } catch (error: any) {
                    alert(`❌ Error: ${error.message}`);
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
              >
                Create Test Donation
              </button>
            </div>
          </div>
        </section>
      )}
        </div>
      </div>
      
      {/* Enhanced Notification System */}
      {notification && (
        <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg border-l-4 z-50 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
          notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
          'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {notification.type === 'success' ? '✅' :
               notification.type === 'error' ? '❌' :
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-sm mt-1 opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 ml-2 text-lg hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

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
