'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';
import { ArrowRight, BookOpen, FlaskConical, Heart, Quote, Check, Facebook, Instagram, Twitter, ChevronDown, HelpCircle, Mail } from 'lucide-react';
import { BlessedButton, BreathingImage } from '@/components/SensorialEffects';
import { ProgressBar, AchievementNotification, useUserProgress } from '@/components/GamificationSystem';
import { SmartNotifications, PersonalizedRecommendations, type UserProfile as PersonalizationUserProfile } from '@/components/PersonalizationEngine';
import ShareSantaPalabra from '@/components/ShareSantaPalabra';
import { CC0License } from '@/components/CC0License';
import { subscribeToNewsletter } from '@/lib/subscription';

export default function HomePage() {
  const { language, toggleLanguage } = useLanguage();
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  const [userProfile, setUserProfile] = useState<PersonalizationUserProfile | null>(null);
  const { progress, newAchievement, setNewAchievement, addXP, unlockAchievement, updateStreak, trackReferral } = useUserProgress();
  const profileInitializedRef = useRef(false);

  // Newsletter state
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setNewsletterStatus('loading');
    try {
      await subscribeToNewsletter(email, language);
      setNewsletterStatus('success');
      setEmail('');
      addXP(20); // Bonus XP for subscription
    } catch (error) {
      console.error('Newsletter error:', error);
      setNewsletterStatus('error');
    }
  };

  // Definir traducciones y palabras antes de los efectos
  const translations = {
    es: {
      heroTitle: 'Conversa con tu catequista digital',
      heroCta: 'Una catequista digital hispanoamericana: Sagrada Escritura, Tradición, Magisterio y espiritualidad en una experiencia nueva.',
      ctaChat: 'Entrar al chat',
      ctaAdmin: 'Panel',
      testimonialsTitle: 'Lo que dicen nuestros usuarios',
      faqTitle: 'Preguntas Frecuentes',
      faqSubtitle: '¿Tienes dudas? Aquí respondemos las consultas más comunes',
      footerText: 'Hecho con amor',
      footerCredits: 'Bits de filosofía',
      footerYear: 'Creando desde 2026',
      newsletterTitle: 'Recibe inspiración diaria',
      newsletterSubtitle: 'Suscríbete para recibir reflexiones, novedades y contenido exclusivo.',
      newsletterPlaceholder: 'Tu correo electrónico',
      newsletterButton: 'Suscribirse',
      newsletterSuccess: '¡Gracias por suscribirte! Revisa tu correo.',
      newsletterError: 'Hubo un error. Intenta nuevamente.',
    },
    en: {
      heroTitle: 'Talk to your digital catechist',
      heroCta: 'A Hispanic-American digital catechist: Sacred Scripture, Tradition, Magisterium, and spirituality in a new kind of experience.',
      ctaChat: 'Open chat',
      ctaAdmin: 'Dashboard',
      testimonialsTitle: 'What our users say',
      faqTitle: 'Frequently Asked Questions',
      faqSubtitle: 'Have questions? Here we answer the most common inquiries',
      footerText: 'Made with love',
      footerCredits: 'Bits of Philosophy',
      footerYear: 'Creating since 2026',
      newsletterTitle: 'Get daily inspiration',
      newsletterSubtitle: 'Subscribe to receive reflections, news, and exclusive content.',
      newsletterPlaceholder: 'Your email address',
      newsletterButton: 'Subscribe',
      newsletterSuccess: 'Thanks for subscribing! Check your email.',
      newsletterError: 'An error occurred. Please try again.',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.es;

  const testimonials = [
    {
      text: language === 'es' 
        ? 'SantaPalabra me ayudó a entender mejor los documentos de la Biblia. Las respuestas son precisas y están siempre respaldadas en el Magisterio.'
        : 'SantaPalabra helped me understand biblical documents better. The answers are precise and always backed by the Magisterium.',
      author: language === 'es' ? 'María González' : 'Maria Gonzalez',
      role: language === 'es' ? 'Estudiante de Teología' : 'Theology Student',
    },
    {
      text: language === 'es'
        ? 'Como catequista, necesitaba una herramienta confiable. SantaPalabra ofrece respuestas auténticas basadas en la Tradición y no improvisa.'
        : 'As a catechist, I needed a reliable tool. SantaPalabra offers authentic answers based on Tradition and does not improvise.',
      author: language === 'es' ? 'Padre Juan' : 'Father Juan',
      role: language === 'es' ? 'Sacerdote' : 'Priest',
    },
    {
      text: language === 'es'
        ? 'La experiencia de conversar con SantaPalabra es como hablar con un maestro espiritual que siempre te guía hacia la verdad católica.'
        : 'The experience of talking with SantaPalabra is like speaking with a spiritual teacher who always guides you toward Catholic truth.',
      author: language === 'es' ? 'Carlos Mendez' : 'Carlos Mendez',
      role: language === 'es' ? 'Laico comprometido' : 'Committed Layperson',
    },
  ];

  const faqs = [
    {
      question: language === 'es' ? '¿Qué es SantaPalabra?' : 'What is SantaPalabra?',
      answer: language === 'es' 
        ? 'SantaPalabra es una catequista digital católica especializada en la espiritualidad hispanoamericana. Combina la sabiduría de la Iglesia universal con las enseñanzas del CELAM, Santa Teresa de Ávila, San Juan de la Cruz y toda la rica tradición católica latinoamericana.'
        : 'SantaPalabra is a Catholic digital catechist specialized in Hispanic-American spirituality. It combines the wisdom of the universal Church with the teachings of CELAM, Saint Teresa of Ávila, Saint John of the Cross, and the entire rich Latin American Catholic tradition.'
    },
    {
      question: language === 'es' ? '¿Es gratis?' : 'Is it free?',
      answer: language === 'es'
        ? 'Actualmente SantaPalabra está en fase de desarrollo y acceso abierto. Nuestro objetivo es hacer la catequesis católica accesible para todos, especialmente para la comunidad hispanoamericana.'
        : 'Currently, SantaPalabra is in development phase with open access. Our goal is to make Catholic catechesis accessible to all, especially for the Hispanic-American community.'
    },
    {
      question: language === 'es' ? '¿Las respuestas son confiables?' : 'Are the answers reliable?',
      answer: language === 'es'
        ? 'Sí. Todas las respuestas están basadas en el Catecismo de la Iglesia Católica, documentos papales, conciliares y magisteriales. Priorizamos citas directas y evitamos especulaciones teológicas. Si no hay respuesta clara en el Magisterio, lo indicamos con humildad.'
        : 'Yes. All answers are based on the Catechism of the Catholic Church, papal, conciliar, and magisterial documents. We prioritize direct citations and avoid theological speculation. If there is no clear answer in the Magisterium, we indicate it with humility.'
    },
    {
      question: language === 'es' ? '¿Qué hace especial a SantaPalabra?' : 'What makes SantaPalabra special?',
      answer: language === 'es'
        ? 'Nuestra especialización en la espiritualidad hispanoamericana. Integramos documentos del CELAM, la mística española (Teresa de Ávila, Juan de la Cruz), devoción guadalupana y la riqueza teológica latinoamericana, algo único que no encontrarás en otros chatbots católicos.'
        : 'Our specialization in Hispanic-American spirituality. We integrate CELAM documents, Spanish mysticism (Teresa of Ávila, John of the Cross), Guadalupan devotion, and Latin American theological richness—something unique that you won\'t find in other Catholic chatbots.'
    },
    {
      question: language === 'es' ? '¿Qué es el modo gamificación?' : 'What is gamification mode?',
      answer: language === 'es'
        ? 'El modo gamificación recompensa tu participación con puntos XP, logros y seguimiento de progreso en tus estudios teológicos. Puedes desbloquear contenido exclusivo y seguir tu camino de aprendizaje.'
        : 'Gamification mode rewards your participation with XP points, achievements, and progress tracking in your theological studies. You can unlock exclusive content and follow your learning journey.'
    },
    {
      question: language === 'es' ? '¿Puedo usar SantaPalabra para catequesis parroquial?' : 'Can I use SantaPalabra for parish catechesis?',

      answer: language === 'es'
        ? 'Absolutamente. SantaPalabra es una herramienta complementaria ideal para catequistas, sacerdotes y agentes de pastoral. Puede ayudar a preparar clases, resolver dudas doctrinales y profundizar en temas específicos de fe católica.'
        : 'Absolutely. SantaPalabra is an ideal complementary tool for catechists, priests, and pastoral agents. It can help prepare classes, resolve doctrinal questions, and deepen specific topics of Catholic faith.'
    },
    {
      question: language === 'es' ? '¿Qué temas puedo consultar?' : 'What topics can I consult?',
      answer: language === 'es'
        ? 'Puedes preguntar sobre: doctrina católica, Sagrada Escritura, sacramentos, moral católica, espiritualidad, oración, santos, historia de la Iglesia, documentos del Magisterio, teología latinoamericana, misticismo español y mucho más.'
        : 'You can ask about: Catholic doctrine, Sacred Scripture, sacraments, Catholic morality, spirituality, prayer, saints, Church history, Magisterium documents, Latin American theology, Spanish mysticism, and much more.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  useEffect(() => {
    let isMounted = true;
    
    // Simulate loading delay for smooth transition
    const initTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
    };
  }, []);

  useEffect(() => {
    if (profileInitializedRef.current) return;
    profileInitializedRef.current = true;

    const loadProfile = async () => {
      try {
        // Pure Guest Mode: Load from localStorage only
        // No Supabase Auth check required
        const savedProfile = localStorage.getItem('santapalabra_profile');
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
        }
        
        updateStreak();
      } catch (err) {
        console.error('Error initializing profile/gamification:', err);
      }
    };

    loadProfile();
  }, [updateStreak]);


  const handleInteraction = (type: 'question' | 'donation' | 'navigation') => {
    addXP(10);
    
    // Desbloquear logros según el tipo de interacción
    if (type === 'question') {
      unlockAchievement('first_question');
    }
  };

  const handleReferralShare = () => {
    trackReferral();
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-gradient-to-b from-gray-50 via-gray-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-700">
              {language === 'es' ? 'SantaPalabra cargando…' : 'SantaPalabra loading…'}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Notificaciones y elementos personalizados */}
      <SmartNotifications profile={userProfile} />
      <PersonalizedRecommendations profile={userProfile} />
      {newAchievement && (
        <AchievementNotification 
          achievement={newAchievement} 
          onClose={() => setNewAchievement(null)} 
        />
      )}
      

      {/* HERO SECTION */}
      <section className="hero-section relative flex h-screen max-h-screen items-center justify-center overflow-hidden px-4 py-16 text-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/landingPageBackground.mp4" type="video/mp4" />
          </video>
          {/* Overlay oscuro para mejorar legibilidad */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70"></div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 2.5, ease: 'circOut' }}
            className="absolute -top-1/3 left-1/2 h-full w-full -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-200/20 via-amber-100/10 to-transparent blur-3xl dark:from-amber-800/20 dark:via-amber-900/10 dark:to-transparent"
          />
          {/* Imágenes decorativas católicas vectorializadas - distribución simétrica */}
          {/* Esquina superior izquierda - Guadalupana con efecto respiración */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.45, rotate: 8 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-[6%] left-[3%] h-40 w-40 md:h-56 md:w-56 lg:h-64 lg:w-64 pointer-events-none"
            style={{ filter: 'sepia(65%) brightness(0.60) contrast(118%) saturate(1.20)' }}
          >
            <BreathingImage src="/guadalupana.svg" alt="" className="object-contain" />
          </motion.div>
          {/* Esquina superior derecha - San Juan de la Cruz con efecto respiración */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.45, rotate: -8 }}
            transition={{ duration: 2, delay: 0.7 }}
            className="absolute top-[6%] right-[3%] h-40 w-40 md:h-56 md:w-56 lg:h-64 lg:w-64 pointer-events-none"
            style={{ filter: 'sepia(65%) brightness(0.60) contrast(118%) saturate(1.20)' }}
          >
            <BreathingImage src="/san juan.svg" alt="" className="object-contain" />
          </motion.div>
          {/* Esquina inferior izquierda - Santa Teresa PROMINENTE con respiración sagrada */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.55, rotate: 0 }}
            transition={{ duration: 2, delay: 0.9 }}
            className="absolute bottom-[6%] left-[2%] h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 pointer-events-none"
            style={{ filter: 'sepia(60%) brightness(0.65) contrast(120%) saturate(1.25)' }}
          >
            <BreathingImage src="/SantaTeresa.svg" alt="" className="object-contain" />
          </motion.div>
          {/* Esquina inferior derecha - Iglesia AGRANDADA con respiración */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.45, rotate: 0 }}
            transition={{ duration: 2, delay: 1.1 }}
            className="absolute bottom-[16%] right-[3%] h-56 w-56 md:h-72 md:w-72 lg:h-80 lg:w-80 pointer-events-none"
            style={{ filter: 'sepia(65%) brightness(0.60) contrast(118%) saturate(1.20)' }}
          >
            <BreathingImage src="/iglesia_transparente.svg" alt="" className="object-contain" />
          </motion.div>
        </div>

        <motion.div
          className="relative z-20 max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <SantaPalabraLogo className="h-48 w-48 md:h-72 md:w-72 drop-shadow-2xl" />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-2 text-lg text-gray-100 md:text-xl max-w-3xl mx-auto drop-shadow-md font-medium mb-12"
          >
            {t.heroCta}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto"
          >
            <div className="w-full flex flex-col items-center justify-center gap-6">
              <BlessedButton
                href="/catholic-chat"
                onClick={() => handleInteraction('question')}
                className="group w-full sm:w-auto min-w-[300px] flex flex-row items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-5 text-xl md:text-2xl font-bold text-white shadow-2xl shadow-amber-500/40 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/60 whitespace-normal text-center preserve-light-bg-amber"
              >
                <BookOpen className="inline-block h-8 w-8 flex-shrink-0" />
                <span className="inline-block">{t.heroTitle}</span>
                <ArrowRight className="inline-block h-6 w-6 flex-shrink-0 transition-transform group-hover:translate-x-1" />
              </BlessedButton>

              <BlessedButton
                href="/support"
                onClick={() => handleInteraction('donation')}
                className="group w-full sm:w-auto min-w-[200px] flex flex-row items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-8 py-3 text-base md:text-lg font-bold text-white shadow-2xl shadow-amber-400/40 transition-all duration-300 hover:scale-105 hover:shadow-amber-400/60 whitespace-nowrap preserve-light-bg-green"
              >
                <Heart className="inline-block h-6 w-6 md:h-7 md:w-7" />
                <span className="inline-block">{language === 'es' ? '¡Quiero donar!' : '¡I want to donate!'}</span>
              </BlessedButton>
            </div>

            <div className="w-full flex justify-center mt-2">
              <ShareSantaPalabra
                onShare={() => handleInteraction('navigation')}
                onReferralTracked={handleReferralShare}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              {language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* PROGRESS SECTION - Solo visible si el usuario ha completado el perfil */}
      {userProfile && progress.level > 1 && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 border-b border-amber-100/50">
          <motion.div
            className="mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <ProgressBar progress={progress} />
          </motion.div>
        </section>
      )}

      {/* TESTIMONIALS SECTION */}
      <section className="bg-amber-50/30 dark:bg-gray-900 py-20 px-4 md:py-28">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="mb-16 text-center text-4xl font-black text-amber-900 dark:text-amber-500 md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {t.testimonialsTitle}
          </motion.h2>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                className="rounded-2xl border border-amber-100 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-amber-100/20 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
              >
                <Quote className="mb-4 h-8 w-8 text-amber-500 dark:text-amber-500" />
                <p className="mb-6 text-base text-gray-700 dark:text-gray-300 italic leading-relaxed">“{testimonial.text}”</p>
                <div className="border-t border-amber-100 dark:border-gray-600 pt-4">
                  <p className="font-bold text-amber-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-amber-600/80 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="mb-6 text-lg text-amber-800 dark:text-gray-300 font-medium">
              {language === 'es' 
                ? '¿Te ha sido útil SantaPalabra? Ayúdanos a seguir creciendo' 
                : 'Has SantaPalabra been helpful? Help us keep growing'}
            </p>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-amber-400/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-400/50"
            >
              <Heart className="mr-3 h-6 w-6" />
              {language === 'es' ? '¡Sí, quiero apoyar este proyecto!' : '¡Yes, I want to support this project!'}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-amber-50/30 dark:bg-gray-900 py-20 px-4 md:py-28">
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="h-10 w-10 text-amber-600" />
              <h2 className="text-4xl font-black text-amber-900 dark:text-amber-500 md:text-5xl">
                {t.faqTitle}
              </h2>
            </div>
            <p className="text-lg text-amber-700/80 dark:text-gray-400 mt-4">
              {t.faqSubtitle}
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="border border-amber-200 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-amber-50/50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-bold text-amber-900 dark:text-white text-lg pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-6 w-6 text-amber-500 dark:text-amber-500 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-2 text-gray-700 dark:text-gray-300 leading-relaxed border-t border-amber-100 dark:border-gray-700">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* NEWSLETTER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-gray-900 py-20 px-4 text-amber-900 dark:text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-orange-200 blur-3xl"></div>
        </div>

        <motion.div
          className="relative z-10 mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Mail className="mx-auto h-12 w-12 mb-6 text-amber-500" />
          <h2 className="mb-4 text-3xl md:text-4xl font-black tracking-tight text-amber-900 dark:text-amber-100">
            {t.newsletterTitle}
          </h2>
          <p className="mb-8 text-lg text-amber-700 dark:text-amber-200 max-w-2xl mx-auto">
            {t.newsletterSubtitle}
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.newsletterPlaceholder}
              required
              disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
              className="flex-grow px-6 py-3 rounded-full border border-amber-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-70 shadow-sm"
            />
            <button
              type="submit"
              disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-105 disabled:opacity-70 shadow-lg shadow-amber-500/20"
            >
              {newsletterStatus === 'loading' ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
              ) : newsletterStatus === 'success' ? (
                <Check className="h-5 w-5 mx-auto" />
              ) : (
                t.newsletterButton
              )}
            </button>
          </form>

          {newsletterStatus === 'success' && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-green-600 font-medium"
            >
              {t.newsletterSuccess}
            </motion.p>
          )}

          {newsletterStatus === 'error' && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-red-500 font-medium"
            >
              {t.newsletterError}
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-amber-500 to-orange-600 dark:from-gray-900 dark:to-gray-800 px-4 py-12 text-center text-white">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center justify-center gap-8">
            {/* Botón de donación prominente */}
            <BlessedButton
              onClick={() => window.location.href = '/support'}
              className="inline-flex items-center justify-center rounded-full preserve-light-bg-green bg-white/10 backdrop-blur-md border border-white/30 px-6 py-3 text-base font-bold text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105"
            >
              <Heart className="mr-2 h-5 w-5 text-amber-200 fill-amber-200" />
              {language === 'es' ? 'Apoyar proyecto' : 'Support project'}
            </BlessedButton>

            {/* Redes sociales - PROMINENTES */}
            <div className="flex gap-6 text-white">
              <a
                href="https://www.facebook.com/profile.php?id=61586393920926"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-125 hover:text-amber-100 dark:hover:text-amber-300 text-white dark:text-gray-200"
              >
                <Facebook className="h-8 w-8 drop-shadow-md" />
              </a>
              <a
                href="https://instagram.com/santapalabra_ok"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-125 hover:text-amber-100 dark:hover:text-amber-300 text-white dark:text-gray-200"
              >
                <Instagram className="h-8 w-8 drop-shadow-md" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-125 hover:text-amber-100 dark:hover:text-amber-300 text-white dark:text-gray-200"
              >
                <Twitter className="h-8 w-8 drop-shadow-md" />
              </a>
            </div>

            {/* Créditos minimalistas */}
            <div className="border-t border-amber-400 dark:border-amber-600 pt-4 w-full max-w-xl text-xs text-white dark:text-gray-300 font-medium drop-shadow-sm">
              <div className="flex flex-col items-center gap-2">
                <CC0License />
                <p className="flex items-center justify-center gap-1">
                  <span>{language === 'es' ? 'Powered con' : 'Powered by'}</span>
                  <Heart className="h-3 w-3 text-red-100 fill-red-100 drop-shadow-sm" />
                  <a 
                    href="https://www.laprensadetales.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-amber-200 transition-colors"
                  >
                    {language === 'es' ? 'por La prensa de Tales' : 'La prensa de Tales'}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
