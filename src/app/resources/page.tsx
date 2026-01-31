'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Film, Music, User, ExternalLink, Star, BookOpen } from 'lucide-react';
import GreekBibleReader from '@/components/GreekBibleReader';
import GreekWordSearch from '@/components/GreekWordSearch';

export default function ResourcesPage() {
  const { language } = useLanguage();

  const sections = [
    {
      id: 'influencers',
      title: {
        es: 'Influencers Católicos',
        pt: 'Influenciadores Católicos',
        en: 'Catholic Influencers'
      },
      icon: User,
      items: [
        {
          name: 'Bishop Robert Barron',
          description: {
            es: 'Obispo auxiliar de Los Ángeles, fundador de Word on Fire.',
            pt: 'Bispo auxiliar de Los Angeles, fundador da Word on Fire.',
            en: 'Auxiliary Bishop of Los Angeles, founder of Word on Fire.'
          },
          link: 'https://www.wordonfire.org',
          tags: ['Teología', 'Cultura']
        },
        {
          name: 'Padre Mike Schmitz',
          description: {
            es: 'Conocido por "La Biblia en un año" y videos de Ascension Presents.',
            pt: 'Conhecido por "A Bíblia em um ano" e vídeos da Ascension Presents.',
            en: 'Known for "The Bible in a Year" and Ascension Presents videos.'
          },
          link: 'https://media.ascensionpress.com/category/ascension-presents/fr-mike-schmitz/',
          tags: ['Biblia', 'Juventud']
        },
        {
            name: 'Fray Nelson Medina',
            description: {
                es: 'Predicador dominico, conocido por su claridad doctrinal.',
                pt: 'Pregador dominicano, conhecido por sua clareza doutrinária.',
                en: 'Dominican preacher, known for doctrinal clarity.'
            },
            link: 'https://fraynelson.com/',
            tags: ['Predicación', 'Doctrina']
        }
      ]
    },
    {
      id: 'music',
      title: {
        es: 'Música Católica',
        pt: 'Música Católica',
        en: 'Catholic Music'
      },
      icon: Music,
      items: [
        {
          name: 'Matt Maher',
          description: {
            es: 'Cantante y compositor de música cristiana contemporánea.',
            pt: 'Cantor e compositor de música cristã contemporânea.',
            en: 'Contemporary Christian music singer and songwriter.'
          },
          link: 'https://www.mattmahermusic.com',
          tags: ['Worship', 'Rock']
        },
        {
          name: 'Athenas',
          description: {
            es: 'Cantante argentina de música católica adorativa.',
            pt: 'Cantora argentina de música católica adorativa.',
            en: 'Argentine singer of Catholic worship music.'
          },
          link: 'https://athenasmusica.com',
          tags: ['Adoración', 'Español']
        },
        {
            name: 'Hana',
            description: {
              es: 'Grupo musical católico con enfoque moderno.',
              pt: 'Grupo musical católico com abordagem moderna.',
              en: 'Catholic music group with a modern approach.'
            },
            link: 'https://www.youtube.com/@HanaMusica',
            tags: ['Pop', 'Español']
          }
      ]
    },
    {
      id: 'bible-greek',
      title: {
        es: 'Biblia en Griego',
        pt: 'Bíblia em Grego',
        en: 'Greek Bible'
      },
      icon: BookOpen,
      component: (
        <div className="space-y-6">
          <GreekWordSearch />
          <GreekBibleReader />
        </div>
      )
    },
    {
      id: 'movies',
      title: {
        es: 'Películas y Series',
        pt: 'Filmes e Séries',
        en: 'Movies & Series'
      },
      icon: Film,
      items: [
        {
          name: 'The Chosen',
          description: {
            es: 'Serie sobre la vida de Jesús y sus discípulos.',
            pt: 'Série sobre a vida de Jesus e seus discípulos.',
            en: 'Series about the life of Jesus and his disciples.'
          },
          link: 'https://watch.thechosen.tv',
          tags: ['Serie', 'Biblia']
        },
        {
          name: 'La Pasión de Cristo',
          description: {
            es: 'Película dirigida por Mel Gibson sobre las últimas horas de Jesús.',
            pt: 'Filme dirigido por Mel Gibson sobre as últimas horas de Jesus.',
            en: 'Film directed by Mel Gibson about the last hours of Jesus.'
          },
          link: 'https://www.imdb.com/title/tt0335345/',
          tags: ['Película', 'Drama']
        },
        {
            name: 'Fátima (2020)',
            description: {
              es: 'La historia de las apariciones de Nuestra Señora en Fátima.',
              pt: 'A história das aparições de Nossa Senhora em Fátima.',
              en: 'The story of the apparitions of Our Lady in Fatima.'
            },
            link: 'https://www.fatimathemovie.com',
            tags: ['Película', 'Historia']
          }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100"
      >
        {language === 'es' ? 'Recursos Recomendados' : language === 'pt' ? 'Recursos Recomendados' : 'Recommended Resources'}
      </motion.h1>

      <div className="space-y-12">
        {sections.map((section, sectionIndex) => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
              <section.icon className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                {language === 'es' ? section.title.es : language === 'pt' ? section.title.pt : section.title.en}
              </h2>
            </div>

            {/* Custom Component or List of Items */}
            {section.component ? (
              <div className="w-full">
                {section.component}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items?.map((item, itemIndex) => (
                  <motion.a
                    key={itemIndex}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 flex flex-col h-full group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                        {item.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-yellow-500" />
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                      {language === 'es' ? item.description.es : language === 'pt' ? item.description.pt : item.description.en}
                    </p>
  
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
