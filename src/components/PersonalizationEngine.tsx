'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, Heart, Book, Star, Sparkles, Calendar } from 'lucide-react';

interface PersonalizedContent {
  type: 'devotion' | 'gospel' | 'teaching' | 'reflection';
  title: string;
  content: string;
  icon: React.ReactNode;
  tags: string[];
  relevanceScore: number;
}

interface UserProfile {
  devotion: string;
  interest: string;
  country: string;
  level: number;
  completedAt: Date;
}

const contentDatabase = {
  devotion: {
    guadalupana: [
      {
        title: "Oración Matutina a la Guadalupana",
        content: "Virgen Morena de Tepeyac, Madre del Verdadero Dios, acompáñanos en este nuevo día...",
        tags: ['mañana', 'guadalupe', 'tepeyac'],
        relevanceScore: 0.9
      },
      {
        title: "Las Rosas de Juan Diego",
        content: "En el mensaje de las rosas, encontramos la ternura maternal de María hacia los pobres...",
        tags: ['milagro', 'juan diego', 'rosas'],
        relevanceScore: 0.8
      }
    ],
    teresiana: [
      {
        title: "Los Grados de Oración según Santa Teresa",
        content: "Santa Teresa describe cuatro grados de oración: vocal, mental, contemplativa y unitiva...",
        tags: ['oracion', 'contemplacion', 'mistica'],
        relevanceScore: 0.9
      },
      {
        title: "El Castillo Interior",
        content: "El alma es como un castillo de diamante donde Su Majestad tiene su morada...",
        tags: ['castillo', 'moradas', 'alma'],
        relevanceScore: 0.8
      }
    ],
    juanista: [
      {
        title: "La Noche Oscura del Alma",
        content: "En la noche oscura, Dios purifica el alma de sus imperfecciones...",
        tags: ['purificacion', 'noche', 'alma'],
        relevanceScore: 0.9
      },
      {
        title: "Subida del Monte Carmelo",
        content: "Para llegar a la unión con Dios, el alma debe despojarse de todo lo que no es Dios...",
        tags: ['union', 'despojo', 'carmelo'],
        relevanceScore: 0.8
      }
    ]
  },
  interest: {
    oracion: [
      {
        title: "Cómo Hacer Oración Mental",
        content: "La oración mental es tratar de amistad, estando muchas veces tratando a solas con quien sabemos que nos ama...",
        tags: ['oracion', 'mental', 'amistad'],
        relevanceScore: 0.9
      },
      {
        title: "El Poder del Rosario",
        content: "El Rosario es el compendio de todo el Evangelio, meditación de los misterios de Cristo...",
        tags: ['rosario', 'misterios', 'meditacion'],
        relevanceScore: 0.8
      }
    ],
    doctrina: [
      {
        title: "Los Cuatro Pilares del Catecismo",
        content: "El Credo, los Sacramentos, los Mandamientos y la Oración forman la estructura de la fe católica...",
        tags: ['catecismo', 'fe', 'doctrina'],
        relevanceScore: 0.9
      },
      {
        title: "La Transubstanciación Eucarística",
        content: "En la Eucaristía, el pan y el vino se convierten verdaderamente en el Cuerpo y Sangre de Cristo...",
        tags: ['eucaristia', 'sacramento', 'cristo'],
        relevanceScore: 0.8
      }
    ]
  },
  country: {
    mexico: [
      {
        title: "Santuarios de México",
        content: "El Tepeyac, Chalma, San Juan de los Lagos... lugares donde el cielo toca la tierra mexicana...",
        tags: ['santuarios', 'mexico', 'peregrinacion'],
        relevanceScore: 0.9
      }
    ],
    spain: [
      {
        title: "El Camino de Santiago",
        content: "Desde hace mil años, peregrinos de todo el mundo caminan hacia Santiago de Compostela...",
        tags: ['camino', 'santiago', 'peregrinacion'],
        relevanceScore: 0.9
      }
    ]
  }
};

export function PersonalizedRecommendations({ profile }: { profile: UserProfile | null }) {
  const [recommendations, setRecommendations] = useState<PersonalizedContent[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const content = generatePersonalizedContent(profile);
    setRecommendations(content);
    
    // Mostrar recomendaciones después de un momento
    setTimeout(() => setIsVisible(true), 2000);
  }, [profile]);

  const generatePersonalizedContent = (profile: UserProfile): PersonalizedContent[] => {
    const content: PersonalizedContent[] = [];

    // Contenido basado en devoción
    if (contentDatabase.devotion[profile.devotion as keyof typeof contentDatabase.devotion]) {
      const devotionContent = contentDatabase.devotion[profile.devotion as keyof typeof contentDatabase.devotion];
      content.push({
        type: 'devotion',
        title: devotionContent[0].title,
        content: devotionContent[0].content,
        icon: <Heart className="h-5 w-5" />,
        tags: devotionContent[0].tags,
        relevanceScore: devotionContent[0].relevanceScore
      });
    }

    // Contenido basado en interés
    if (contentDatabase.interest[profile.interest as keyof typeof contentDatabase.interest]) {
      const interestContent = contentDatabase.interest[profile.interest as keyof typeof contentDatabase.interest];
      content.push({
        type: 'teaching',
        title: interestContent[0].title,
        content: interestContent[0].content,
        icon: <Book className="h-5 w-5" />,
        tags: interestContent[0].tags,
        relevanceScore: interestContent[0].relevanceScore
      });
    }

    // Contenido basado en país
    if (contentDatabase.country[profile.country as keyof typeof contentDatabase.country]) {
      const countryContent = contentDatabase.country[profile.country as keyof typeof contentDatabase.country];
      content.push({
        type: 'reflection',
        title: countryContent[0].title,
        content: countryContent[0].content,
        icon: <Star className="h-5 w-5" />,
        tags: countryContent[0].tags,
        relevanceScore: countryContent[0].relevanceScore
      });
    }

    // Evangelio del día (siempre relevante)
    content.push({
      type: 'gospel',
      title: 'Evangelio de Hoy',
      content: 'Reflexión personalizada sobre el Evangelio del día según tus intereses espirituales...',
      icon: <Calendar className="h-5 w-5" />,
      tags: ['evangelio', 'diario', 'reflexion'],
      relevanceScore: 1.0
    });

    return content.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  if (!isVisible || recommendations.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 max-w-sm z-40"
      >
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-2xl border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-600" />
              <h3 className="font-bold text-gray-900">Para Ti</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-yellow-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 2).map((item, index) => (
              <motion.div
                key={index}
                className="p-4 bg-white rounded-xl border border-yellow-200 hover:border-yellow-400 transition-colors cursor-pointer group"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700 group-hover:bg-yellow-200 transition-colors">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {item.content.slice(0, 80)}...
                    </p>
                    <div className="flex gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-colors">
            Ver más recomendaciones
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function SmartNotifications({ profile }: { profile: UserProfile | null }) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'devotion' | 'reminder' | 'achievement';
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (!profile) return;

    // Generar notificaciones inteligentes basadas en el perfil
    const smartNotifications = generateSmartNotifications(profile);
    setNotifications(smartNotifications);
  }, [profile]);

  const generateSmartNotifications = (profile: UserProfile) => {
    const notifications = [];
    const now = new Date();

    // Notificación matutina personalizada
    if (now.getHours() >= 6 && now.getHours() <= 10) {
      notifications.push({
        id: 'morning',
        title: 'Buenos días 🌅',
        message: getPersonalizedMorningMessage(profile),
        type: 'devotion' as const,
        timestamp: now
      });
    }

    // Recordatorio de oración angelus
    if (now.getHours() === 12 || now.getHours() === 18) {
      notifications.push({
        id: 'angelus',
        title: 'Hora del Ángelus 🔔',
        message: 'Es momento de elevar tu corazón al cielo con la oración del Ángelus',
        type: 'reminder' as const,
        timestamp: now
      });
    }

    return notifications;
  };

  const getPersonalizedMorningMessage = (profile: UserProfile) => {
    const messages = {
      guadalupana: 'Que la Virgen de Guadalupe te acompañe en este nuevo día',
      teresiana: 'Como dice Santa Teresa: "Que nada te turbe, que nada te espante"',
      juanista: 'Que encuentres a Dios en el silencio de tu corazón como San Juan',
      general: 'Que Dios bendiga tu jornada de hoy'
    };
    
    return messages[profile.devotion as keyof typeof messages] || messages.general;
  };

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl shadow-2xl max-w-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <BellRing className="h-4 w-4" />
              <h4 className="font-semibold text-sm">{notification.title}</h4>
            </div>
            <p className="text-sm opacity-90">{notification.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}