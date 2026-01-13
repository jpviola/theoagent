'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function IntroPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const { language } = useLanguage();

  const welcomeText = language === 'es' ? '¡Bienvenidos!' : 'Welcome!';

  useEffect(() => {
    // Permitir saltar después de 2 segundos
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 2000);

    // Redirección automática después de 5 segundos
    const autoRedirectTimer = setTimeout(() => {
      router.push('/catholic-chat');
    }, 5000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoRedirectTimer);
    };
  }, [router]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Redirigir automáticamente al chat después del video
    setTimeout(() => {
      router.push('/catholic-chat');
    }, 500);
  };

  const handleSkip = () => {
    if (canSkip) {
      router.push('/catholic-chat');
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 flex items-center justify-center overflow-hidden">
      {/* Video de fondo integrado - más pequeño y sutil */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.65, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="relative w-[60%] max-w-2xl aspect-video rounded-3xl overflow-hidden"
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="w-full h-full object-cover"
          >
            <source src="/santaPalabraBienvenidos.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay para integrar mejor al fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-yellow-100/20 to-amber-50/30 mix-blend-overlay" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />
        </motion.div>
      </div>

      {/* Texto de bienvenida animado - prominente */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={welcomeText}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ 
              duration: 1, 
              ease: [0.16, 1, 0.3, 1],
              delay: 0.5
            }}
            className="text-center"
          >
            <motion.h1 
              className="text-7xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
            >
              {welcomeText}
            </motion.h1>
            
            {/* Línea decorativa debajo */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="mt-6 h-1.5 w-48 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>



      {/* Logo SantaPalabra en la esquina superior izquierda */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute top-6 left-6 flex items-center gap-2"
      >
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#F59E0B" />
          <path d="M2 17L12 22L22 17" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-lg font-bold text-amber-800">SantaPalabra</span>
      </motion.div>

      {/* Partículas decorativas de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut'
            }}
            className="absolute rounded-full bg-yellow-300/20 blur-2xl"
            style={{
              width: `${100 + Math.random() * 200}px`,
              height: `${100 + Math.random() * 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
