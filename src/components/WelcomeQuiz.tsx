'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Cross, Book, Globe, Star, ChevronRight, X } from 'lucide-react';

const questions = [
  {
    id: 'devotion',
    title: '¿Cuál es tu devoción católica favorita?',
    subtitle: 'Esto nos ayudará a personalizar tu experiencia',
    answers: [
      {
        id: 'guadalupe',
        text: 'Virgen de Guadalupe',
        icon: <Heart className="h-5 w-5" />,
        weight: { devotion: 'guadalupana', interest: 'latinoamerica' }
      },
      {
        id: 'teresa',
        text: 'Santa Teresa de Ávila',
        icon: <Book className="h-5 w-5" />,
        weight: { devotion: 'teresiana', interest: 'mistica' }
      },
      {
        id: 'juan',
        text: 'San Juan de la Cruz',
        icon: <Star className="h-5 w-5" />,
        weight: { devotion: 'juanista', interest: 'mistica' }
      },
      {
        id: 'general',
        text: 'Devoción general católica',
        icon: <Cross className="h-5 w-5" />,
        weight: { devotion: 'general', interest: 'doctrina' }
      }
    ]
  },
  {
    id: 'interest',
    title: '¿Qué te interesa más explorar?',
    subtitle: 'Podremos sugerirte contenido relevante',
    answers: [
      {
        id: 'prayer',
        text: 'Oración y vida espiritual',
        icon: <Heart className="h-5 w-5" />,
        weight: { devotion: '', interest: 'oracion' }
      },
      {
        id: 'doctrine',
        text: 'Doctrina y enseñanzas',
        icon: <Book className="h-5 w-5" />,
        weight: { devotion: '', interest: 'doctrina' }
      },
      {
        id: 'latin',
        text: 'Espiritualidad latinoamericana',
        icon: <Globe className="h-5 w-5" />,
        weight: { devotion: '', interest: 'latinoamerica' }
      },
      {
        id: 'mysticism',
        text: 'Misticismo español',
        icon: <Star className="h-5 w-5" />,
        weight: { devotion: '', interest: 'mistica' }
      }
    ]
  },
  {
    id: 'country',
    title: '¿De qué país nos visitas?',
    subtitle: 'Para ofrecerte contenido culturalmente relevante',
    answers: [
      {
        id: 'mexico',
        text: 'México 🇲🇽',
        icon: <Globe className="h-5 w-5" />,
        weight: { devotion: '', interest: '', country: 'mexico' }
      },
      {
        id: 'argentina',
        text: 'Argentina 🇦🇷',
        icon: <Globe className="h-5 w-5" />,
        weight: { devotion: '', interest: '', country: 'argentina' }
      },
      {
        id: 'colombia',
        text: 'Colombia 🇨🇴',
        icon: <Globe className="h-5 w-5" />,
        weight: { devotion: '', interest: '', country: 'colombia' }
      },
      {
        id: 'spain',
        text: 'España 🇪🇸',
        icon: <Globe className="h-5 w-5" />,
        weight: { devotion: '', interest: '', country: 'spain' }
      },
      {
        id: 'other',
        text: 'Otro país',
        icon: <Globe className="h-5 w-5" />,
        weight: { devotion: '', interest: '', country: 'other' }
      }
    ]
  }
];

interface UserProfile {
  devotion: string;
  interest: string;
  country: string;
  level: number;
  completedAt: Date;
}

export default function WelcomeQuiz({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(true);

  const handleAnswer = (questionId: string, answerId: string) => {
    const newAnswers = { ...answers, [questionId]: answerId };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 300);
    } else {
      // Quiz completado
      const profile: UserProfile = {
        devotion: getProfileValue('devotion', newAnswers),
        interest: getProfileValue('interest', newAnswers),
        country: getProfileValue('country', newAnswers),
        level: 1,
        completedAt: new Date()
      };
      
      // Guardar en localStorage
      localStorage.setItem('santapalabra_profile', JSON.stringify(profile));
      
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onComplete(profile), 500);
      }, 1000);
    }
  };

  const getProfileValue = (type: string, answers: Record<string, string>) => {
    for (const question of questions) {
      const answer = question.answers.find(a => a.id === answers[question.id]);
      if (answer && answer.weight[type as keyof typeof answer.weight]) {
        return answer.weight[type as keyof typeof answer.weight];
      }
    }
    return 'general';
  };

  const skipQuiz = () => {
    const profile: UserProfile = {
      devotion: 'general',
      interest: 'doctrina',
      country: 'other',
      level: 1,
      completedAt: new Date()
    };
    localStorage.setItem('santapalabra_profile', JSON.stringify(profile));
    setIsVisible(false);
    setTimeout(() => onComplete(profile), 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative mx-4 max-w-lg w-full bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl shadow-2xl p-8 border-2 border-yellow-200 dark:from-gray-800 dark:to-gray-700 dark:border-amber-600 dark:bg-gradient-to-br"
          >
            {/* Botón cerrar */}
            <button
              onClick={skipQuiz}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-yellow-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            {/* Progreso */}
            <div className="mb-8">
              <div className="flex justify-center gap-2 mb-4">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      idx <= currentQuestion ? 'bg-yellow-500' : 'bg-yellow-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-gray-600">
                Pregunta {currentQuestion + 1} de {questions.length}
              </p>
            </div>

            {/* Pregunta actual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {questions[currentQuestion].title}
                  </h2>
                  <p className="text-gray-600">
                    {questions[currentQuestion].subtitle}
                  </p>
                </div>

                <div className="space-y-3">
                  {questions[currentQuestion].answers.map((answer) => (
                    <motion.button
                      key={answer.id}
                      onClick={() => handleAnswer(questions[currentQuestion].id, answer.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-yellow-200 bg-white hover:bg-yellow-50 hover:border-yellow-400 transition-all duration-200 text-left group dark:bg-gray-800 dark:border-amber-700 dark:hover:bg-amber-900/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex-shrink-0 p-2 rounded-xl bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200 transition-colors">
                        {answer.icon}
                      </div>
                      <span className="flex-1 font-semibold text-gray-800">
                        {answer.text}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-yellow-600 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="mt-8 text-center">
              <button
                onClick={skipQuiz}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Omitir personalización
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
