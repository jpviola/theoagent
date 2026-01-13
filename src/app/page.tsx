'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import SantaPalabraLogo from '@/components/SantaPalabraLogo';
import { ArrowRight, BookOpen, FlaskConical, UserCircle, Heart, Quote, Check, Facebook, Instagram, Twitter, ChevronDown, HelpCircle } from 'lucide-react';

export default function HomePage() {
  const { language, toggleLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTypewriter, setStartTypewriter] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Definir traducciones y palabras antes de los efectos
  const t = {
    es: {
      heroTitle: 'Conversa con tu catequista digital',
      heroCta: 'Una catequista digital hispanoamericana: Escritura, Tradición, Magisterio y espiritualidad latinoamericana en una experiencia nueva.',
      ctaChat: 'Entrar al chat',
      ctaRag: 'Laboratorio RAG',
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
      ctaRag: 'RAG lab',
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
  }[language];

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
      question: language === 'es' ? '¿Es gratis?' : 'Is it free?',
      answer: language === 'es'
        ? 'Actualmente SantaPalabra está en fase de desarrollo y acceso abierto. Nuestro objetivo es hacer la catequesis católica accesible para todos, especialmente para la comunidad hispanoamericana.'
        : 'Currently, SantaPalabra is in development phase with open access. Our goal is to make Catholic catechesis accessible to all, especially for the Hispanic-American community.'
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

  // Carrusel de palabras para el subtítulo
  const words = language === 'es' 
    ? ['Escritura', 'Tradición', 'Magisterio', 'Espiritualidad']
    : ['Scripture', 'Tradition', 'Magisterium', 'Spirituality'];

  // Efectos
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Typewriter effect para principio fundacional
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

  // Carrusel de palabras
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(intervalId);
  }, [words.length]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
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
    <div className="flex min-h-screen flex-col bg-white">
      {/* HERO SECTION */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-white px-4 py-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            transition={{ duration: 2.5, ease: 'circOut' }}
            className="absolute -top-1/3 left-1/2 h-full w-full -translate-x-1/2 rounded-full bg-gradient-to-b from-yellow-200/50 via-amber-100/40 to-transparent blur-3xl"
          />
          {/* Imágenes decorativas católicas - muy atenuadas */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.40, rotate: 12 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-[15%] left-[2%] h-40 w-40 md:h-56 md:w-56 pointer-events-none"
            style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
          >
            <Image src="/SantaTeresa.svg" alt="" fill className="object-contain" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.40, rotate: -12 }}
            transition={{ duration: 2, delay: 0.7 }}
            className="absolute top-[35%] right-[2%] h-40 w-40 md:h-56 md:w-56 pointer-events-none"
            style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
          >
            <Image src="/san juan.svg" alt="" fill className="object-contain" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.45, rotate: 0 }}
            transition={{ duration: 2, delay: 0.9 }}
            className="absolute top-[45%] left-[1%] h-36 w-36 md:h-52 md:w-52 pointer-events-none"
            style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
          >
            <Image src="/guadalupana.svg" alt="" fill className="object-contain" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.45, rotate: 0 }}
            transition={{ duration: 2, delay: 1.1 }}
            className="absolute top-[25%] right-[9%] h-36 w-36 md:h-52 md:w-52 pointer-events-none"
            style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
          >
            <Image src="/iglesia_transparente.svg" alt="" fill className="object-contain" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.35, rotate: 8 }}
            transition={{ duration: 2, delay: 1.3 }}
            className="absolute top-[70%] left-[3%] h-32 w-32 md:h-48 md:w-48 pointer-events-none"
            style={{ filter: 'sepia(80%) brightness(0.5) contrast(120%) saturate(1.2)' }}
          >
            <Image src="/CELAM.svg" alt="" fill className="object-contain" />
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
            className="text-5xl font-black tracking-tighter text-gray-900 sm:text-6xl md:text-7xl"
          >
            {t.heroTitle}
          </motion.h1>

          <motion.div variants={itemVariants} className="mt-8 flex justify-center">
            <SantaPalabraLogo className="h-64 w-64 text-yellow-600 md:h-96 md:w-96" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-wrap items-center justify-center gap-2 text-lg text-gray-700 md:text-xl"
          >
            <span>{language === 'es' ? 'Una catequista digital hispanoamericana:' : 'A Hispanic-American digital catechist:'}</span>
            <motion.span
              key={currentWordIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="font-bold text-yellow-700"
            >
              {words[currentWordIndex]}
            </motion.span>
            <span>{language === 'es' ? 'en una experiencia nueva.' : 'in a new kind of experience.'}</span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/catholic-chat"
              className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-10 py-5 text-xl font-bold text-white shadow-2xl shadow-yellow-500/40 transition-all duration-300 hover:scale-110 hover:shadow-yellow-500/60"
            >
              <BookOpen className="mr-3 h-7 w-7" />
              {t.ctaChat}
              <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
            <AnimatePresence>
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 bg-white/80 px-6 py-3 text-base font-bold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:border-gray-400"
                  >
                    <UserCircle className="mr-2 h-5 w-5" />
                    {t.ctaAdmin}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* TESTIMONIALS SECTION */}
      <section className="bg-white py-20 px-4 md:py-28">
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
                className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-8 shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
              >
                <Quote className="mb-4 h-8 w-8 text-yellow-600" />
                <p className="mb-6 text-base text-gray-700 italic">"{testimonial.text}"</p>
                <div className="border-t border-yellow-200 pt-4">
                  <p className="font-bold text-gray-900">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* PRINCIPLES SECTION */}
      <section className="bg-gradient-to-br from-amber-50 to-yellow-50 py-20 px-4 md:py-28">
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
      <section className="bg-white py-20 px-4 md:py-28">
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
                className="border-2 border-yellow-200 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-yellow-50/30"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-yellow-50/50 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-lg pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-6 w-6 text-yellow-600 flex-shrink-0" />
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
                      <div className="px-6 pb-5 pt-2 text-gray-700 leading-relaxed border-t border-yellow-100">
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
      <footer className="bg-gray-900 px-4 py-12 text-center text-gray-300 md:py-16">
        <motion.div
          className="mx-auto max-w-6xl"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center justify-center gap-6">
            <p className="flex items-center justify-center gap-2 text-base md:text-lg">
              <span>© {new Date().getFullYear()} - {t.footerText}</span>
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              <span>por {t.footerCredits}</span>
            </p>
            <p className="text-sm text-gray-400">
              {t.footerYear}
            </p>

            <div className="flex gap-6 pt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-yellow-400"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-yellow-400"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-yellow-400"
              >
                <Twitter className="h-6 w-6" />
              </a>
            </div>

            {/* Advanced users link */}
            <div className="pt-4 border-t border-gray-700 mt-4 w-full max-w-md">
              <Link
                href="/test-rag"
                className="text-xs text-gray-500 hover:text-gray-400 flex items-center justify-center gap-1 transition-colors"
              >
                <FlaskConical className="h-3 w-3" />
                <span>{language === 'es' ? 'Laboratorio RAG (modo desarrollador)' : 'RAG Lab (developer mode)'}</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}