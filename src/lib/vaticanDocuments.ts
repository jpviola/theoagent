// Vatican II Documents Auto-Linking and Reference System
// Focus on biblical documents like Dei Verbum

export interface VaticanDocumentReference {
  abbreviation: string;
  fullName: string;
  latinName: string;
  paragraph?: number;
  url: string;
}

// Vatican II Documents with their abbreviations and URLs
export const VATICAN_II_DOCUMENTS: Record<string, { 
  fullName: string; 
  latinName: string; 
  url: string;
  type: 'constitution' | 'decree' | 'declaration';
}> = {
  // Four Major Constitutions
  'DV': {
    fullName: 'Dogmatic Constitution on Divine Revelation',
    latinName: 'Dei Verbum',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_en.html',
    type: 'constitution'
  },
  'LG': {
    fullName: 'Dogmatic Constitution on the Church',
    latinName: 'Lumen Gentium',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_en.html',
    type: 'constitution'
  },
  'SC': {
    fullName: 'Constitution on the Sacred Liturgy',
    latinName: 'Sacrosanctum Concilium',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
    type: 'constitution'
  },
  'GS': {
    fullName: 'Pastoral Constitution on the Church in the Modern World',
    latinName: 'Gaudium et Spes',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651207_gaudium-et-spes_en.html',
    type: 'constitution'
  },
  
  // Decrees
  'PO': {
    fullName: 'Decree on the Ministry and Life of Priests',
    latinName: 'Presbyterorum Ordinis',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651207_presbyterorum-ordinis_en.html',
    type: 'decree'
  },
  'OT': {
    fullName: 'Decree on Priestly Training',
    latinName: 'Optatam Totius',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651028_optatam-totius_en.html',
    type: 'decree'
  },
  'PC': {
    fullName: 'Decree on the Adaptation and Renewal of Religious Life',
    latinName: 'Perfectae Caritatis',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651028_perfectae-caritatis_en.html',
    type: 'decree'
  },
  'AA': {
    fullName: 'Decree on the Apostolate of the Laity',
    latinName: 'Apostolicam Actuositatem',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651118_apostolicam-actuositatem_en.html',
    type: 'decree'
  },
  'UR': {
    fullName: 'Decree on Ecumenism',
    latinName: 'Unitatis Redintegratio',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_unitatis-redintegratio_en.html',
    type: 'decree'
  },
  'OE': {
    fullName: 'Decree on the Catholic Churches of the Eastern Rite',
    latinName: 'Orientalium Ecclesiarum',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19641121_orientalium-ecclesiarum_en.html',
    type: 'decree'
  },
  'CD': {
    fullName: 'Decree on the Pastoral Office of Bishops',
    latinName: 'Christus Dominus',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651028_christus-dominus_en.html',
    type: 'decree'
  },
  'AG': {
    fullName: 'Decree on the Mission Activity of the Church',
    latinName: 'Ad Gentes',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19651207_ad-gentes_en.html',
    type: 'decree'
  },
  'IM': {
    fullName: 'Decree on the Media of Social Communications',
    latinName: 'Inter Mirifica',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decree_19631204_inter-mirifica_en.html',
    type: 'decree'
  },
  
  // Declarations
  'GE': {
    fullName: 'Declaration on Christian Education',
    latinName: 'Gravissimum Educationis',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decl_19651028_gravissimum-educationis_en.html',
    type: 'declaration'
  },
  'NAE': {
    fullName: 'Declaration on the Relation of the Church to Non-Christian Religions',
    latinName: 'Nostra Aetate',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decl_19651028_nostra-aetate_en.html',
    type: 'declaration'
  },
  'DH': {
    fullName: 'Declaration on Religious Freedom',
    latinName: 'Dignitatis Humanae',
    url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_decl_19651207_dignitatis-humanae_en.html',
    type: 'declaration'
  }
};

// Alternative names and patterns for detection
const DOCUMENT_PATTERNS: Record<string, string[]> = {
  'DV': ['dei verbum', 'divine revelation', 'revelación divina'],
  'LG': ['lumen gentium', 'light of nations', 'luz de las naciones'],
  'SC': ['sacrosanctum concilium', 'sacred liturgy', 'sagrada liturgia'],
  'GS': ['gaudium et spes', 'joy and hope', 'gozo y esperanza'],
  'PO': ['presbyterorum ordinis', 'priests'],
  'OT': ['optatam totius', 'priestly training'],
  'PC': ['perfectae caritatis', 'religious life'],
  'AA': ['apostolicam actuositatem', 'apostolate of laity'],
  'UR': ['unitatis redintegratio', 'ecumenism'],
  'OE': ['orientalium ecclesiarum', 'eastern churches'],
  'CD': ['christus dominus', 'bishops'],
  'AG': ['ad gentes', 'mission'],
  'IM': ['inter mirifica', 'social communications'],
  'GE': ['gravissimum educationis', 'education'],
  'NAE': ['nostra aetate', 'non-christian religions'],
  'DH': ['dignitatis humanae', 'religious freedom']
};

/**
 * Detect Vatican II document references in text
 * Patterns: "DV 12", "Dei Verbum 12", "Dei Verbum, 12"
 */
export function extractVaticanReferences(text: string): VaticanDocumentReference[] {
  const references: VaticanDocumentReference[] = [];
  
  // Pattern 1: Abbreviation with paragraph (DV 12, DV. 12, DV, 12)
  const abbrevPattern = /\b([A-Z]{2,3})[,.\s]+(\d+)\b/gi;
  let match;
  
  while ((match = abbrevPattern.exec(text)) !== null) {
    const [, abbrev, paragraph] = match;
    const upperAbbrev = abbrev.toUpperCase();
    
    if (VATICAN_II_DOCUMENTS[upperAbbrev]) {
      const doc = VATICAN_II_DOCUMENTS[upperAbbrev];
      references.push({
        abbreviation: upperAbbrev,
        fullName: doc.fullName,
        latinName: doc.latinName,
        paragraph: parseInt(paragraph),
        url: `${doc.url}#${paragraph}`
      });
    }
  }
  
  // Pattern 2: Full Latin names (Dei Verbum 12, Lumen Gentium 8)
  for (const [abbrev, doc] of Object.entries(VATICAN_II_DOCUMENTS)) {
    const latinName = doc.latinName.toLowerCase();
    const pattern = new RegExp(`\\b${latinName}[,\\s]+(\\d+)\\b`, 'gi');
    
    while ((match = pattern.exec(text.toLowerCase())) !== null) {
      references.push({
        abbreviation: abbrev,
        fullName: doc.fullName,
        latinName: doc.latinName,
        paragraph: parseInt(match[1]),
        url: `${doc.url}#${match[1]}`
      });
    }
  }
  
  return references;
}

/**
 * Generate markdown link for Vatican document reference
 */
export function formatVaticanReference(ref: VaticanDocumentReference): string {
  if (ref.paragraph) {
    return `[${ref.abbreviation} ${ref.paragraph}](${ref.url})`;
  }
  return `[${ref.latinName}](${ref.url})`;
}

/**
 * Replace Vatican document references with markdown links
 */
export function linkifyVaticanDocuments(text: string): string {
  // Skip if already has vatican.va links
  if (text.includes('vatican.va')) {
    return text;
  }
  
  const references = extractVaticanReferences(text);
  let linkedText = text;
  
  // Sort by length (longest first)
  references.sort((a, b) => {
    const aText = a.paragraph ? `${a.abbreviation} ${a.paragraph}` : a.latinName;
    const bText = b.paragraph ? `${b.abbreviation} ${b.paragraph}` : b.latinName;
    return bText.length - aText.length;
  });
  
  for (const ref of references) {
    const markdownLink = formatVaticanReference(ref);
    
    // Pattern with paragraph number
    if (ref.paragraph) {
      const patterns = [
        `${ref.abbreviation} ${ref.paragraph}`,
        `${ref.abbreviation}, ${ref.paragraph}`,
        `${ref.abbreviation}. ${ref.paragraph}`,
        `${ref.latinName} ${ref.paragraph}`,
        `${ref.latinName}, ${ref.paragraph}`
      ];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'gi');
        if (!linkedText.includes(markdownLink)) {
          linkedText = linkedText.replace(regex, markdownLink);
        }
      }
    }
  }
  
  return linkedText;
}

/**
 * Check if text mentions Vatican II documents (for RAG triggering)
 */
export function mentionsVaticanDocuments(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Check abbreviations
  for (const abbrev of Object.keys(VATICAN_II_DOCUMENTS)) {
    if (new RegExp(`\\b${abbrev}\\b`, 'i').test(text)) {
      return true;
    }
  }
  
  // Check Latin names and patterns
  for (const patterns of Object.values(DOCUMENT_PATTERNS)) {
    if (patterns.some(pattern => lowerText.includes(pattern))) {
      return true;
    }
  }
  
  return false;
}
