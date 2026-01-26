'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';
import { ArrowRight, BookOpen, FlaskConical, Heart, Quote, Check, Facebook, Instagram, Twitter, ChevronDown, HelpCircle } from 'lucide-react';
import { BlessedButton, BreathingImage } from '@/components/SensorialEffects';
import { ProgressBar, AchievementNotification, useUserProgress } from '@/components/GamificationSystem';
import { SmartNotifications, type UserProfile as PersonalizationUserProfile } from '@/components/PersonalizationEngine';
import ShareSantaPalabra from '@/components/ShareSantaPalabra';

export default function HomePage() {
  const { language, toggleLanguage } = useLanguage();
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [startTypewriter, setStartTypewriter] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  const [userProfile, setUserProfile] = useState<PersonalizationUserProfile | null>(null);
  const { progress, newAchievement, setNewAchievement, addXP, unlockAchievement, updateStreak, trackReferral } = useUserProgress();
  const profileInitializedRef = useRef(false);

  // Definir traducciones y palabras antes de los efectos
  const translations = {
    es: {
      heroTitle: 'Conversa con tu catequista digital',
      heroCta: 'Una catequista digital hispanoamericana: Escritura, Tradición, Magisterio y espiritualidad latinoamericana en una experiencia nueva.',
      ctaChat: 'Entrar al chat',
      ctaAdmin: 'Panel',
      testimonialsTitle: 'Lo que dicen nuestros usuarios',
      principlesTitle: 'Nuestro Principio Fundacional',
      principlesText: 'Que tu tono sea caritativo pero firme en la verdad dogmática. Ante dudas complejas, prioriza siempre citas directas del Catecismo de la Iglesia Católica (CIC) y documentos conciliares. Evita alucinaciones teológicas y si no hay respuesta en el Magisterio indícalo con humildad.',
      faqTitle: 'Preguntas Frecuentes',
      faqSubtitle: '¿Tienes dudas? Aquí respondemos las consultas más comunes',
      footerText: 'Hecho con amor',
      footerCredits: 'Bits de filosofía',
      footerYear: 'Creando desde 2026',
    },
    en: {
      heroTitle: 'Talk to your digital catechist',
      heroCta: 'A Hispanic-American digital catechist: Scripture, Tradition, Magisterium, and Latin American spirituality in a new kind of experience.',
      ctaChat: 'Open chat',
      ctaAdmin: 'Dashboard',
      testimonialsTitle: 'What our users say',
      principlesTitle: 'Our Foundational Principle',
      principlesText: 'Let your tone be charitable but firm in dogmatic truth. When facing complex doubts, always prioritize direct citations from the Catechism of the Catholic Church (CCC) and conciliar documents. Avoid theological hallucinations and if there is no answer in the Magisterium indicate it with humility.',
      faqTitle: 'Frequently Asked Questions',
      faqSubtitle: 'Have questions? Here we answer the most common inquiries',
      footerText: 'Made with love',
      footerCredits: 'Bits of Philosophy',
      footerYear: 'Creating since 2026',
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
    const failSafe = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    const getUser = async () => {
      // Si Supabase no está configurado, no bloqueamos la carga
      if (!supabase) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user || null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    return () => {
      isMounted = false;
      clearTimeout(failSafe);
    };
  }, []);

  const fullText = t.principlesText;
  useEffect(() => {
    if (!startTypewriter) {
      setDisplayedText('');
      return;
    }
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 30);
    return () => clearInterval(intervalId);
  }, [fullText, startTypewriter]);

  useEffect(() => {
    if (profileInitializedRef.current) return;
    profileInitializedRef.current = true;

    try {
      const savedProfile = localStorage.getItem('santapalabra_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      }
      updateStreak();
    } catch (err) {
      console.error('Error initializing profile/gamification:', err);
    }
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
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>
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
      {newAchievement && (
        <AchievementNotification 
          achievement={newAchievement} 
          onClose={() => setNewAchievement(null)} 
        />
      )}
      

      {/* HERO SECTION */}
      <section className="hero-section relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:bg-none px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 2.5, ease: 'circOut' }}
            className="absolute -top-1/3 left-1/2 h-full w-full -translate-x-1/2 rounded-full bg-gradient-to-b from-gray-200/40 via-gray-100/30 to-transparent blur-3xl dark:from-gray-800/20 dark:via-gray-900/10 dark:to-transparent"
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
          className="relative z-10 max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white sm:text-6xl md:text-7xl"
          >
            {t.heroTitle}
          </motion.h1>

          <motion.div variants={itemVariants} className="mt-8 flex justify-center">
            <SantaPalabraLogo className="h-64 w-64 text-yellow-600 dark:text-yellow-500 md:h-96 md:w-96" />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg text-gray-700 dark:text-gray-300 md:text-xl max-w-3xl mx-auto"
          >
            {t.heroCta}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center gap-4 w-full max-w-3xl mx-auto"
          >
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
              <BlessedButton
                href="/catholic-chat"
                onClick={() => handleInteraction('question')}
                className="group w-full sm:w-[20rem] flex flex-row items-center justify-center gap-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-8 sm:px-12 py-3 text-base md:text-lg font-bold text-white shadow-2xl shadow-yellow-500/40 transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/60 whitespace-nowrap preserve-light-bg-yellow"
              >
                <BookOpen className="inline-block h-6 w-6 md:h-7 md:w-7" />
                <span className="inline-block">{t.ctaChat}</span>
                <ArrowRight className="inline-block h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-1" />
              </BlessedButton>

              <BlessedButton
                href="/support"
                onClick={() => handleInteraction('donation')}
                className="group w-full sm:w-[20rem] flex flex-row items-center justify-center gap-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 sm:px-12 py-3 text-base md:text-lg font-bold text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-105 hover:shadow-green-500/60 whitespace-nowrap preserve-light-bg-green"
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
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-yellow-100/50"
            >
              {language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* PROGRESS SECTION - Solo visible si el usuario ha completado el perfil */}
      {userProfile && progress.level > 1 && (
        <section className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
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
      <section className="bg-white dark:bg-gray-900 py-20 px-4 md:py-28">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="mb-16 text-center text-4xl font-black text-gray-900 md:text-5xl"
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
                className="rounded-2xl border border-yellow-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
              >
                <Quote className="mb-4 h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                <p className="mb-6 text-base text-gray-700 dark:text-gray-300 italic">“{testimonial.text}”</p>
                <div className="border-t border-yellow-200 dark:border-gray-600 pt-4">
                  <p className="font-bold text-gray-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
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
            <p className="mb-6 text-lg text-gray-700 font-medium">
              {language === 'es' 
                ? '¿Te ha sido útil SantaPalabra? Ayúdanos a seguir creciendo' 
                : 'Has SantaPalabra been helpful? Help us keep growing'}
            </p>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-green-500/40 transition-all duration-300 hover:scale-110 hover:shadow-green-500/60"
            >
              <Heart className="mr-3 h-6 w-6" />
              {language === 'es' ? '¡Sí, quiero apoyar este proyecto!' : '¡Yes, I want to support this project!'}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* PRINCIPLES SECTION */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:bg-none dark:bg-gray-900 py-20 px-4 md:py-28">
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onViewportEnter={() => setStartTypewriter(true)}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="mb-8 text-4xl font-black text-gray-900 md:text-5xl">
              {t.principlesTitle}
            </h2>

            <div className="rounded-2xl border-2 border-yellow-400 bg-black p-10 shadow-xl md:p-12">
              <div className="flex gap-4 md:gap-6">
                <Check className="h-8 w-8 flex-shrink-0 text-green-400 md:h-10 md:w-10" />
                <p className="font-mono text-lg leading-relaxed text-green-400 md:text-xl">
                  {displayedText}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: 'loop' as const }}
                    className="ml-1 inline-block h-6 w-2 bg-green-400 align-middle"
                  />
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-white dark:bg-gray-900 py-20 px-4 md:py-28">
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
              <HelpCircle className="h-10 w-10 text-yellow-600" />
              <h2 className="text-4xl font-black text-gray-900 md:text-5xl">
                {t.faqTitle}
              </h2>
            </div>
            <p className="text-lg text-gray-600 mt-4">
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
                className="border-2 border-yellow-200 rounded-2xl overflow-hidden bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-bold text-gray-900 dark:text-white text-lg pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-6 w-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
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
                      <div className="px-6 pb-5 pt-2 text-gray-700 dark:text-gray-300 leading-relaxed border-t border-yellow-100 dark:border-gray-700">
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

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-amber-900 to-yellow-800 dark:from-gray-900 dark:to-gray-800 px-4 py-8 text-center text-white">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Botón de donación prominente */}
            <BlessedButton
              onClick={() => window.location.href = '/support'}
              className="inline-flex items-center justify-center rounded-full preserve-light-bg-green bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 text-base font-bold text-white shadow-lg shadow-green-500/40 transition-all duration-300 hover:shadow-green-500/60"
            >
              <Heart className="mr-2 h-5 w-5" />
              {language === 'es' ? 'Apoyar proyecto' : 'Support project'}
            </BlessedButton>

            {/* Redes sociales - PROMINENTES */}
            <div className="flex gap-6 text-white">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-125 hover:text-yellow-300 dark:hover:text-yellow-300 text-white dark:text-gray-200"
              >
                <Facebook className="h-8 w-8" />
              </a>
              <a
                href="https://instagram.com/santapalabra_ok"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-all hover:scale-105 hover:text-yellow-300 dark:hover:text-yellow-300 text-white dark:text-gray-200"
              >
                <Instagram className="h-8 w-8" />
                <span className="font-semibold">@santapalabra_ok</span>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-all hover:scale-125 hover:text-yellow-300 dark:hover:text-yellow-300 text-white dark:text-gray-200"
              >
                <Twitter className="h-8 w-8" />
              </a>
            </div>

            {/* Créditos minimalistas */}
            <div className="border-t border-amber-700 dark:border-amber-600 pt-4 w-full max-w-xl text-xs text-white dark:text-gray-300">
              <p className="flex items-center justify-center gap-1">
                <span>© {new Date().getFullYear()}</span>
                <span>·</span>
                <span>{language === 'es' ? 'Powered con' : 'Powered by'}</span>
                <Heart className="h-3 w-3 text-red-300 fill-red-300" />
                <span>{language === 'es' ? 'por La prensa de Tales' : 'La prensa de Tales'}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
