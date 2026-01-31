
// Simple keyword extraction for interest tagging
// In a production environment, this could call an LLM or use a more sophisticated NLP library

const INTEREST_KEYWORDS: Record<string, string[]> = {
  'Mariology': ['maria', 'maría', 'virgen', 'guadalupe', 'rosario', 'fatima', 'fátima', 'lourdes', 'inmaculada', 'asunción'],
  'Saints & Spirituality': ['santo', 'santa', 'teresa', 'juan de la cruz', 'agustin', 'agustín', 'benito', 'francisco', 'espiritualidad', 'oración', 'mística'],
  'Sacred Scripture': ['biblia', 'evangelio', 'salmo', 'pablo', 'pedro', 'jesus', 'jesús', 'cristo', 'antiguo testamento', 'nuevo testamento'],
  'Dogmatic Theology': ['trinidad', 'dios', 'espíritu santo', 'dogma', 'credo', 'fe', 'salvación', 'gracia', 'sacramento', 'eucaristía', 'misa'],
  'Moral Theology': ['pecado', 'virtud', 'moral', 'ética', 'conciencia', 'mandamientos', 'ley natural', 'vida', 'familia', 'matrimonio'],
  'Church History': ['historia', 'concilio', 'reforma', 'cruzadas', 'inquisición', 'edad media', 'padres de la iglesia', 'patrística'],
  'Apologetics': ['ateísmo', 'protestante', 'secta', 'verdad', 'razón', 'ciencia', 'evolución', 'existencia de dios', 'prueba'],
  'Liturgy': ['liturgia', 'misa', 'rito', 'tiempo ordinario', 'cuaresma', 'adviento', 'navidad', 'pascua', 'semana santa'],
};

export function analyzeMessageInterests(message: string): string[] {
  const normalizedMessage = message.toLowerCase();
  const foundInterests: Set<string> = new Set();

  Object.entries(INTEREST_KEYWORDS).forEach(([interest, keywords]) => {
    if (keywords.some(keyword => normalizedMessage.includes(keyword))) {
      foundInterests.add(interest);
    }
  });

  return Array.from(foundInterests);
}

export interface LearnerProfile {
  interests: Record<string, number>; // Interest name -> Score (count)
  lastActive: string;
  queryCount: number;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
}

export const INITIAL_PROFILE: LearnerProfile = {
  interests: {},
  lastActive: new Date().toISOString(),
  queryCount: 0,
  complexityLevel: 'beginner'
};
