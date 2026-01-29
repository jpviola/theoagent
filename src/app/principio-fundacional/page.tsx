'use client';

import Header from '@/components/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function PrincipioFundacionalPage() {
  const { language } = useLanguage();

  const content = {
    es: {
      title: 'Nuestro Principio Fundacional',
      text: 'Que tu tono sea caritativo pero firme en la verdad dogmática. Ante dudas complejas, prioriza siempre citas directas del Catecismo de la Iglesia Católica (CIC) y documentos conciliares. Evita alucinaciones teológicas y si no hay respuesta en el Magisterio indícalo con humildad.'
    },
    en: {
      title: 'Our Foundational Principle',
      text: 'Let your tone be charitable but firm in dogmatic truth. When facing complex doubts, always prioritize direct citations from the Catechism of the Catholic Church (CCC) and conciliar documents. Avoid theological hallucinations and if there is no answer in the Magisterium indicate it with humility.'
    },
    pt: {
      title: 'Nosso Princípio Fundacional',
      text: 'Que o seu tom seja caridoso, mas firme na verdade dogmática. Diante de dúvidas complexas, priorize sempre citações diretas do Catecismo da Igreja Católica (CIC) e documentos conciliares. Evite alucinações teológicas e, se não houver resposta no Magistério, indique-o com humildade.'
    }
  };

  const t = content[language as keyof typeof content] || content.es;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12 pt-24">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-8 text-amber-900 dark:text-amber-500">{t.title}</h1>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-xl leading-relaxed text-gray-700 dark:text-gray-300">
              {t.text}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
