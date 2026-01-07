export type Language = 'en' | 'es' | 'it' | 'fr';

export interface Translations {
  welcome: {
    title: string;
    subtitle: string;
    description: string;
  };
  input: {
    placeholder: string;
    placeholderFollowUp: string;
  };
  actions: {
    newChat: string;
    copy: string;
    edit: string;
    retry: string;
    save: string;
    cancel: string;
  };
  modes: {
    title: string;
    standard: {
      name: string;
      description: string;
    };
    deepResearch: {
      name: string;
      description: string;
    };
    priest: {
      name: string;
      description: string;
    };
    pope: {
      name: string;
      description: string;
    };
    currentMode: string;
  };
  suggestions: {
    title: string;
    dailyGospel: string;
    bibleReading: string;
    popeTeachings: string;
  };
  subscription: {
    free: string;
    plus: string;
    expert: string;
    upgrade: string;
    messagesLeft: string;
    dailyLimit: string;
    upgradePrompt: string;
  };
  loading: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    welcome: {
      title: 'TheoAgent',
      subtitle: 'Catholic Theology Assistant',
      description: 'Ask about Scripture, doctrine, or the saints',
    },
    input: {
      placeholder: 'Ask about Scripture, doctrine, or the saints...',
      placeholderFollowUp: 'Ask a follow-up question...',
    },
    actions: {
      newChat: 'New Chat',
      copy: 'Copy',
      edit: 'Edit',
      retry: 'Retry',
      save: 'Save & Resend',
      cancel: 'Cancel',
    },
    modes: {
      title: 'Mode',
      standard: {
        name: 'Standard',
        description: 'Balanced theology',
      },
      deepResearch: {
        name: 'Deep Research',
        description: 'Scholarly analysis',
      },
      priest: {
        name: 'Priest Mode',
        description: 'Pastoral guidance',
      },
      pope: {
        name: 'Pope Mode',
        description: 'Magisterial teaching',
      },
      currentMode: 'Current Mode:',
    },
    suggestions: {
      title: 'Suggested Questions',
      dailyGospel: '📖 Display the daily Gospel and explain it',
      bibleReading: '📅 Customize a plan for an annual Bible reading',
      popeTeachings: '⛪ What are the recent papal encyclicals and teachings?',
    },
    subscription: {
      free: 'Free',
      plus: 'Plus',
      expert: 'Expert',
      upgrade: 'Upgrade',
      messagesLeft: 'messages left today',
      dailyLimit: 'Daily limit reached',
      upgradePrompt: 'Upgrade for unlimited access',
    },
    loading: 'Thinking...',
  },
  es: {
    welcome: {
      title: 'TheoAgent',
      subtitle: 'Asistente de Teología Católica',
      description: 'Pregunta sobre las Escrituras, doctrina o los santos',
    },
    input: {
      placeholder: 'Pregunta sobre las Escrituras, doctrina o los santos...',
      placeholderFollowUp: 'Haz una pregunta de seguimiento...',
    },
    actions: {
      newChat: 'Nueva Conversación',
      copy: 'Copiar',
      edit: 'Editar',
      retry: 'Reintentar',
      save: 'Guardar y Reenviar',
      cancel: 'Cancelar',
    },
    modes: {
      title: 'Modo',
      standard: {
        name: 'Estándar',
        description: 'Teología equilibrada',
      },
      deepResearch: {
        name: 'Investigación Profunda',
        description: 'Análisis académico',
      },
      priest: {
        name: 'Modo Sacerdote',
        description: 'Orientación pastoral',
      },
      pope: {
        name: 'Modo Papa',
        description: 'Enseñanza magisterial',
      },
      currentMode: 'Modo Actual:',
    },
    suggestions: {
      title: 'Preguntas Sugeridas',
      dailyGospel: '📖 Muestra el Evangelio del día y explícalo',
      bibleReading: '📅 Personaliza un plan de lectura bíblica anual',
      popeTeachings: '⛪ ¿Cuáles son las encíclicas y enseñanzas papales recientes?',
    },
    subscription: {
      free: 'Gratuito',
      plus: 'Plus',
      expert: 'Experto',
      upgrade: 'Actualizar',
      messagesLeft: 'mensajes restantes hoy',
      dailyLimit: 'Límite diario alcanzado',
      upgradePrompt: 'Actualiza para acceso ilimitado',
    },
    loading: 'Pensando...',
  },
  it: {
    welcome: {
      title: 'TheoAgent',
      subtitle: 'Assistente di Teologia Cattolica',
      description: 'Chiedi delle Scritture, dottrina o dei santi',
    },
    input: {
      placeholder: 'Chiedi delle Scritture, dottrina o dei santi...',
      placeholderFollowUp: 'Fai una domanda di follow-up...',
    },
    actions: {
      newChat: 'Nuova Chat',
      copy: 'Copia',
      edit: 'Modifica',
      retry: 'Riprova',
      save: 'Salva e Reinvia',
      cancel: 'Annulla',
    },
    modes: {
      title: 'Modalità',
      standard: {
        name: 'Standard',
        description: 'Teologia equilibrata',
      },
      deepResearch: {
        name: 'Ricerca Approfondita',
        description: 'Analisi accademica',
      },
      priest: {
        name: 'Modalità Sacerdote',
        description: 'Guida pastorale',
      },
      pope: {
        name: 'Modalità Papa',
        description: 'Insegnamento magisteriale',
      },
      currentMode: 'Modalità Corrente:',
    },
    suggestions: {
      title: 'Domande Suggerite',
      dailyGospel: '📖 Mostra il Vangelo del giorno e spiegalo',
      bibleReading: '📅 Personalizza un piano di lettura biblica annuale',
      popeTeachings: '⛪ Quali sono le recenti encicliche e insegnamenti papali?',
    },
    subscription: {
      free: 'Gratuito',
      plus: 'Plus',
      expert: 'Esperto',
      upgrade: 'Aggiorna',
      messagesLeft: 'messaggi rimasti oggi',
      dailyLimit: 'Limite giornaliero raggiunto',
      upgradePrompt: 'Aggiorna per accesso illimitato',
    },
    loading: 'Pensando...',
  },
  fr: {
    welcome: {
      title: 'TheoAgent',
      subtitle: 'Assistant de Théologie Catholique',
      description: 'Posez des questions sur les Écritures, la doctrine ou les saints',
    },
    input: {
      placeholder: 'Posez des questions sur les Écritures, la doctrine ou les saints...',
      placeholderFollowUp: 'Posez une question de suivi...',
    },
    actions: {
      newChat: 'Nouvelle Discussion',
      copy: 'Copier',
      edit: 'Modifier',
      retry: 'Réessayer',
      save: 'Enregistrer et Renvoyer',
      cancel: 'Annuler',
    },
    modes: {
      title: 'Mode',
      standard: {
        name: 'Standard',
        description: 'Théologie équilibrée',
      },
      deepResearch: {
        name: 'Recherche Approfondie',
        description: 'Analyse académique',
      },
      priest: {
        name: 'Mode Prêtre',
        description: 'Guidance pastorale',
      },
      pope: {
        name: 'Mode Pape',
        description: 'Enseignement magistériel',
      },
      currentMode: 'Mode Actuel:',
    },
    suggestions: {
      title: 'Questions Suggérées',
      dailyGospel: '📖 Afficher l\'Évangile du jour et l\'expliquer',
      bibleReading: '📅 Personnaliser un plan de lecture biblique annuel',
      popeTeachings: '⛪ Quelles sont les récentes encycliques et enseignements papaux?',
    },
    subscription: {
      free: 'Gratuit',
      plus: 'Plus',
      expert: 'Expert',
      upgrade: 'Mettre à niveau',
      messagesLeft: 'messages restants aujourd\'hui',
      dailyLimit: 'Limite quotidienne atteinte',
      upgradePrompt: 'Mettez à niveau pour un accès illimité',
    },
    loading: 'Réflexion...',
  },
};

// Detect language based on country code
export function detectLanguageFromCountry(countryCode: string): Language {
  const countryCode2 = countryCode.toUpperCase();
  
  // Spanish-speaking countries
  const spanishCountries = ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'GQ'];
  if (spanishCountries.includes(countryCode2)) {
    return 'es';
  }
  
  // Italy
  if (countryCode2 === 'IT') {
    return 'it';
  }
  
  // France and French-speaking countries
  const frenchCountries = ['FR', 'BE', 'CH', 'LU', 'MC', 'CD', 'CI', 'CM', 'SN', 'ML', 'NE', 'BF', 'TG', 'BJ', 'RW', 'BI', 'DJ', 'GN', 'TD', 'CF', 'CG', 'GA', 'GQ', 'KM', 'MG', 'MU', 'SC', 'YT', 'RE', 'GP', 'MQ', 'GF', 'PF', 'NC', 'WF'];
  if (frenchCountries.includes(countryCode2)) {
    return 'fr';
  }
  
  // Default to English for all other countries (US, UK, Asian countries, etc.)
  return 'en';
}

// Get user's country using IP-based geolocation
export async function detectUserCountry(): Promise<string> {
  try {
    // Try using ipapi.co (free, no API key needed)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'US';
  } catch (error) {
    console.error('Geolocation detection failed:', error);
    // Fallback to browser language
    const browserLang = navigator.language || 'en-US';
    const langCode = browserLang.split('-')[1] || 'US';
    return langCode;
  }
}

// Initialize language based on geolocation
export async function initializeLanguage(): Promise<Language> {
  // Check if user has manually set a language preference
  const savedLanguage = localStorage.getItem('theoagent_language') as Language | null;
  if (savedLanguage && ['en', 'es', 'it', 'fr'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Detect based on geolocation
  const countryCode = await detectUserCountry();
  const detectedLanguage = detectLanguageFromCountry(countryCode);
  
  // Save detected language
  localStorage.setItem('theoagent_language', detectedLanguage);
  
  return detectedLanguage;
}
