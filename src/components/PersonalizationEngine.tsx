'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export interface UserProfile {
  id: string;
  role: string | null;
  experience_level: string | null;
  interests: string[] | null;
  preferred_language: string | null;
  subscription_tier: 'free' | 'plus' | 'expert';
}

type SmartNotification = {
  id: string;
  title: string;
  message: string;
  type: 'devotion' | 'reminder' | 'achievement';
  timestamp: Date;
};

// Helper to map DB interests to content keys
const mapInterestsToKeys = (interests: string[] | null) => {
  const keys = {
    devotion: [] as string[],
    interest: [] as string[],
    country: [] as string[]
  };

  if (!interests) return keys;

  // Map "Mariology" to guadalupana content
  if (interests.includes('Mariology') || interests.includes('Mariología')) keys.devotion.push('guadalupana');
  
  // Map "Saints & Spirituality" to mystic content
  if (interests.includes('Saints & Spirituality') || interests.includes('Santos y Espiritualidad')) {
    keys.devotion.push('teresiana');
    keys.devotion.push('juanista');
  }

  // Map "Sacred Scripture", "Biblical Exegesis" to bible content
  if (interests.includes('Sacred Scripture') || interests.includes('Biblical Exegesis') || 
      interests.includes('Sagradas Escrituras') || interests.includes('Exégesis Bíblica')) {
    keys.interest.push('biblia');
  }

  // Map "Church Fathers", "Church History" to history content
  if (interests.includes('Church Fathers') || interests.includes('Church History') ||
      interests.includes('Padres de la Iglesia') || interests.includes('Historia de la Iglesia')) {
    keys.interest.push('patristica');
  }

  // Map "Moral Theology", "Social Teaching" to moral content
  if (interests.includes('Moral Theology') || interests.includes('Social Teaching') ||
      interests.includes('Teología Moral') || interests.includes('Doctrina Social')) {
    keys.interest.push('moral');
  }

  // Map "Prayer & Spirituality" (topic) or implicit interest to oracion
  if (interests.includes('Saints & Spirituality') || interests.includes('Liturgy & Sacraments') ||
      interests.includes('Santos y Espiritualidad') || interests.includes('Liturgia y Sacramentos')) {
    keys.interest.push('oracion');
  }

  // Map doctrine related interests
  if (interests.includes('Catechism') || interests.includes('Dogmatic Theology') || interests.includes('Apologetics') ||
      interests.includes('Catecismo') || interests.includes('Teología Dogmática') || interests.includes('Apologética')) {
    keys.interest.push('doctrina');
  }
  
  // Default country content (can be improved with geolocation or user setting later)
  keys.country.push('mexico'); // Defaulting to Mexico content for now

  return keys;
};

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
    ],
    biblia: [
      {
        title: "Lectio Divina",
        content: "Un método antiguo para leer la Biblia: Lectura, Meditación, Oración y Contemplación...",
        tags: ['biblia', 'lectio', 'metodo'],
        relevanceScore: 0.9
      },
      {
        title: "Los Sentidos de la Escritura",
        content: "El sentido literal y el sentido espiritual (alegórico, moral y anagógico)...",
        tags: ['exegesis', 'escritura', 'interpretacion'],
        relevanceScore: 0.8
      }
    ],
    patristica: [
      {
        title: "San Agustín y el Tiempo",
        content: "¿Qué es el tiempo? Si nadie me lo pregunta, lo sé; pero si quiero explicárselo al que me lo pregunta, no lo sé...",
        tags: ['agustin', 'filosofia', 'padres'],
        relevanceScore: 0.9
      },
      {
        title: "Didaché: La Enseñanza de los Doce Apóstoles",
        content: "Uno de los documentos más antiguos de la Iglesia primitiva sobre moral y liturgia...",
        tags: ['historia', 'primitiva', 'documentos'],
        relevanceScore: 0.8
      }
    ],
    moral: [
      {
        title: "La Doctrina Social de la Iglesia",
        content: "Principios de reflexión, criterios de juicio y directrices de acción para la sociedad...",
        tags: ['social', 'justicia', 'moral'],
        relevanceScore: 0.9
      },
      {
        title: "Las Bienaventuranzas",
        content: "El corazón de la enseñanza moral de Jesús: Bienaventurados los pobres de espíritu...",
        tags: ['evangelio', 'moral', 'felicidad'],
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

const generatePersonalizedContent = (profile: UserProfile): PersonalizedContent[] => {
  const content: PersonalizedContent[] = [];
  const keys = mapInterestsToKeys(profile.interests);

  // Add devotion content
  keys.devotion.forEach(key => {
    if (contentDatabase.devotion[key as keyof typeof contentDatabase.devotion]) {
      const items = contentDatabase.devotion[key as keyof typeof contentDatabase.devotion];
      // Pick random or first
      const item = items[0];
      content.push({
        type: 'devotion',
        title: item.title,
        content: item.content,
        icon: <Heart className="h-5 w-5" />,
        tags: item.tags,
        relevanceScore: item.relevanceScore
      });
    }
  });

  // Add interest content
  keys.interest.forEach(key => {
    if (contentDatabase.interest[key as keyof typeof contentDatabase.interest]) {
      const items = contentDatabase.interest[key as keyof typeof contentDatabase.interest];
      const item = items[0];
      content.push({
        type: 'teaching',
        title: item.title,
        content: item.content,
        icon: <Book className="h-5 w-5" />,
        tags: item.tags,
        relevanceScore: item.relevanceScore
      });
    }
  });

  // Add country content
  keys.country.forEach(key => {
     if (contentDatabase.country[key as keyof typeof contentDatabase.country]) {
      const items = contentDatabase.country[key as keyof typeof contentDatabase.country];
      const item = items[0];
      content.push({
        type: 'reflection',
        title: item.title,
        content: item.content,
        icon: <Star className="h-5 w-5" />,
        tags: item.tags,
        relevanceScore: item.relevanceScore
      });
    }
  });

  content.push({
    type: 'gospel',
    title: 'Evangelio de Hoy',
    content: 'Reflexión personalizada sobre el Evangelio del día según tus intereses espirituales...',
    icon: <Calendar className="h-5 w-5" />,
    tags: ['evangelio', 'diario', 'reflexion'],
    relevanceScore: 1.0
  });

  // Remove duplicates by title
  const uniqueContent = Array.from(new Map(content.map(item => [item.title, item])).values());

  return uniqueContent.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

const getPersonalizedMorningMessage = (profile: UserProfile) => {
  const keys = mapInterestsToKeys(profile.interests);
  
  const messages = {
    guadalupana: 'Que la Virgen de Guadalupe te acompañe en este nuevo día',
    teresiana: 'Como dice Santa Teresa: "Que nada te turbe, que nada te espante"',
    juanista: 'Que encuentres a Dios en el silencio de tu corazón como San Juan',
    general: 'Que Dios bendiga tu jornada de hoy'
  };
  
  // Try to find a specific message based on devotion keys
  for (const key of keys.devotion) {
    if (messages[key as keyof typeof messages]) {
      return messages[key as keyof typeof messages];
    }
  }
  
  return messages.general;
};

const generateSmartNotifications = (profile: UserProfile): SmartNotification[] => {
  const notifications: SmartNotification[] = [];
  const now = new Date();

  if (now.getHours() >= 6 && now.getHours() <= 10) {
    notifications.push({
      id: 'morning',
      title: 'Buenos días 🌅',
      message: getPersonalizedMorningMessage(profile),
      type: 'devotion',
      timestamp: now
    });
  }

  if (now.getHours() === 12 || now.getHours() === 18) {
    notifications.push({
      id: 'angelus',
      title: 'Hora del Ángelus 🔔',
      message: 'Es momento de elevar tu corazón al cielo con la oración del Ángelus',
      type: 'reminder',
      timestamp: now
    });
  }

  return notifications;
};

export function PersonalizedRecommendations({ profile }: { profile: UserProfile | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const recommendations = profile ? generatePersonalizedContent(profile) : [];

  useEffect(() => {
    if (!profile) return;

    setTimeout(() => setIsVisible(true), 2000);
  }, [profile]);

  const handleRecommendationClick = (item: PersonalizedContent) => {
    if (item.type === 'gospel') {
      // Navegar a la página del evangelio si existiera, o al chat preguntando por él
      router.push('/catholic-chat?q=' + encodeURIComponent('¿Cuál es el evangelio de hoy y su reflexión?'));
    } else {
      // Para otros contenidos, iniciar una conversación sobre el tema
      router.push('/catholic-chat?q=' + encodeURIComponent(item.title));
    }
    setIsVisible(false);
  };

  const handleViewMore = () => {
    router.push('/catholic-chat');
    setIsVisible(false);
  };

  if (!isVisible || recommendations.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-amber-100 dark:border-gray-700 bottom-4 left-4 right-4 md:w-96 md:right-4 md:left-auto"
      >
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
                onClick={() => handleRecommendationClick(item)}
              >
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700 group-hover:bg-yellow-200 transition-colors dark:bg-amber-900/10 dark:text-yellow-300">
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

          <button 
            onClick={handleViewMore}
            className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-colors"
          >
            Ver más recomendaciones
          </button>
      </motion.div>
    </AnimatePresence>
  );
}

export function SmartNotifications({ profile }: { profile: UserProfile | null }) {
  const notifications = profile ? generateSmartNotifications(profile) : [];
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  return (
    <div className="fixed top-4 left-4 z-50 space-y-2">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-lg shadow-xl max-w-sm relative pr-10"
          >
            <button
              onClick={() => setDismissedIds(prev => [...prev, notification.id])}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
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
