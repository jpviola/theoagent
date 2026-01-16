// Scripture Reference Auto-Linking System
// Detects biblical references and creates clickable links to Bible Gateway or USCCB Bible

export type BibleLanguage = 'greek' | 'latin' | 'english' | 'spanish' | 'italian' | 'french' | 'german' | 'portuguese';

export interface BibleReference {
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  fullText: string;
}

// Bible book name patterns in multiple languages
const BIBLE_BOOKS: Record<string, string[]> = {
  // Old Testament
  'Genesis': ['genesis', 'gen', 'ge', 'gn', 'génesis', 'genesi', 'genèse'],
  'Exodus': ['exodus', 'exod', 'ex', 'éxodo', 'esodo', 'exode'],
  'Leviticus': ['leviticus', 'lev', 'le', 'lv', 'levítico', 'levitico'],
  'Numbers': ['numbers', 'num', 'nu', 'nm', 'números', 'numeri', 'nombres'],
  'Deuteronomy': ['deuteronomy', 'deut', 'dt', 'deuteronomio', 'deuteronomio', 'deutéronome'],
  
  'Joshua': ['joshua', 'josh', 'jos', 'josué', 'giosuè', 'josué'],
  'Judges': ['judges', 'judg', 'jdg', 'jg', 'jueces', 'giudici', 'juges'],
  'Ruth': ['ruth', 'rut', 'rt', 'rut', 'rut', 'ruth'],
  '1 Samuel': ['1 samuel', '1 sam', '1 sm', 'i samuel', '1 samuel'],
  '2 Samuel': ['2 samuel', '2 sam', '2 sm', 'ii samuel', '2 samuel'],
  '1 Kings': ['1 kings', '1 kgs', '1 ki', 'i kings', '1 reyes', '1 re'],
  '2 Kings': ['2 kings', '2 kgs', '2 ki', 'ii kings', '2 reyes', '2 re'],
  '1 Chronicles': ['1 chronicles', '1 chron', '1 chr', 'i chronicles', '1 crónicas'],
  '2 Chronicles': ['2 chronicles', '2 chron', '2 chr', 'ii chronicles', '2 crónicas'],
  
  'Ezra': ['ezra', 'ezr', 'esdras', 'esdra'],
  'Nehemiah': ['nehemiah', 'neh', 'ne', 'nehemías', 'neemia', 'néhémie'],
  'Tobit': ['tobit', 'tob', 'tb', 'tobías', 'tobia', 'tobie'],
  'Judith': ['judith', 'jdt', 'judit', 'giuditta'],
  'Esther': ['esther', 'esth', 'est', 'ester', 'ester'],
  '1 Maccabees': ['1 maccabees', '1 macc', '1 mac', '1 macabeos'],
  '2 Maccabees': ['2 maccabees', '2 macc', '2 mac', '2 macabeos'],
  
  'Job': ['job', 'jb', 'job', 'giobbe'],
  'Psalms': ['psalms', 'psalm', 'ps', 'pss', 'salmo', 'salmi', 'psaume'],
  'Proverbs': ['proverbs', 'prov', 'pr', 'prv', 'proverbios', 'proverbi', 'proverbes'],
  'Ecclesiastes': ['ecclesiastes', 'eccles', 'eccl', 'ec', 'eclesiastés', 'qohelet'],
  'Song of Solomon': ['song of solomon', 'song', 'ss', 'cantar', 'cantico'],
  'Wisdom': ['wisdom', 'wis', 'ws', 'sabiduría', 'sapienza', 'sagesse'],
  'Sirach': ['sirach', 'sir', 'si', 'eclesiástico', 'siracide'],
  
  'Isaiah': ['isaiah', 'isa', 'is', 'isaías', 'isaia', 'isaïe'],
  'Jeremiah': ['jeremiah', 'jer', 'je', 'jeremías', 'geremia', 'jérémie'],
  'Lamentations': ['lamentations', 'lam', 'la', 'lamentaciones', 'lamentazioni'],
  'Baruch': ['baruch', 'bar', 'baruc', 'baruc'],
  'Ezekiel': ['ezekiel', 'ezek', 'eze', 'ez', 'ezequiel', 'ezechiele', 'ézéchiel'],
  'Daniel': ['daniel', 'dan', 'da', 'dn', 'daniel', 'daniele'],
  
  'Hosea': ['hosea', 'hos', 'ho', 'oseas', 'osea', 'osée'],
  'Joel': ['joel', 'joe', 'jl', 'joel', 'gioele'],
  'Amos': ['amos', 'amo', 'am', 'amós', 'amos'],
  'Obadiah': ['obadiah', 'obad', 'ob', 'abdías', 'abdia'],
  'Jonah': ['jonah', 'jon', 'jnh', 'jonás', 'giona', 'jonas'],
  'Micah': ['micah', 'mic', 'mi', 'miqueas', 'michea', 'michée'],
  'Nahum': ['nahum', 'nah', 'na', 'nahúm', 'nahum'],
  'Habakkuk': ['habakkuk', 'hab', 'hb', 'habacuc', 'abacuc'],
  'Zephaniah': ['zephaniah', 'zeph', 'zep', 'sofonías', 'sofonia'],
  'Haggai': ['haggai', 'hag', 'hg', 'ageo', 'aggeo', 'aggée'],
  'Zechariah': ['zechariah', 'zech', 'zec', 'zacarías', 'zaccaria', 'zacharie'],
  'Malachi': ['malachi', 'mal', 'ml', 'malaquías', 'malachia', 'malachie'],
  
  // New Testament
  'Matthew': ['matthew', 'matt', 'mt', 'mateo', 'matteo', 'matthieu'],
  'Mark': ['mark', 'mk', 'mr', 'marcos', 'marco', 'marc'],
  'Luke': ['luke', 'lk', 'lc', 'lucas', 'luca', 'luc'],
  'John': ['john', 'jn', 'jhn', 'juan', 'giovanni', 'jean'],
  
  'Acts': ['acts', 'act', 'ac', 'hechos', 'atti', 'actes'],
  
  'Romans': ['romans', 'rom', 'ro', 'romanos', 'romani', 'romains'],
  '1 Corinthians': ['1 corinthians', '1 cor', '1 co', 'i corinthians', '1 corintios'],
  '2 Corinthians': ['2 corinthians', '2 cor', '2 co', 'ii corinthians', '2 corintios'],
  'Galatians': ['galatians', 'gal', 'ga', 'gálatas', 'galati', 'galates'],
  'Ephesians': ['ephesians', 'eph', 'ep', 'efesios', 'efesini', 'éphésiens'],
  'Philippians': ['philippians', 'phil', 'php', 'filipenses', 'filippesi'],
  'Colossians': ['colossians', 'col', 'colosenses', 'colossesi'],
  '1 Thessalonians': ['1 thessalonians', '1 thess', '1 th', 'i thessalonians', '1 tesalonicenses'],
  '2 Thessalonians': ['2 thessalonians', '2 thess', '2 th', 'ii thessalonians', '2 tesalonicenses'],
  '1 Timothy': ['1 timothy', '1 tim', '1 ti', 'i timothy', '1 timoteo'],
  '2 Timothy': ['2 timothy', '2 tim', '2 ti', 'ii timothy', '2 timoteo'],
  'Titus': ['titus', 'tit', 'ti', 'tito'],
  'Philemon': ['philemon', 'philem', 'phm', 'filemón', 'filemone'],
  'Hebrews': ['hebrews', 'heb', 'he', 'hebreos', 'ebrei', 'hébreux'],
  
  'James': ['james', 'jas', 'jm', 'santiago', 'giacomo', 'jacques'],
  '1 Peter': ['1 peter', '1 pet', '1 pe', 'i peter', '1 pedro', '1 pietro'],
  '2 Peter': ['2 peter', '2 pet', '2 pe', 'ii peter', '2 pedro', '2 pietro'],
  '1 John': ['1 john', '1 jn', '1 jhn', 'i john', '1 juan', '1 giovanni'],
  '2 John': ['2 john', '2 jn', '2 jhn', 'ii john', '2 juan', '2 giovanni'],
  '3 John': ['3 john', '3 jn', '3 jhn', 'iii john', '3 juan', '3 giovanni'],
  'Jude': ['jude', 'jud', 'judas', 'giuda'],
  'Revelation': ['revelation', 'rev', 're', 'apocalipsis', 'apocalisse', 'apocalypse'],
};

// Regex pattern to detect biblical references
// Matches patterns like: "John 3:16", "Mt 5:3-12", "Genesis 1:1-2:3", "Lucas 7,18b-23" (with commas)
// Supports both : and , as separators (English uses :, Spanish/Italian/French use ,)
const BIBLE_REFERENCE_REGEX = /\b((?:1|2|3|I|II|III)\s+)?([A-Za-zÀ-ÿ]+)\s+(\d+)(?:[:,](\d+[a-z]?))?(?:-(\d+[a-z]?))?/g;

/**
 * Parse a text string and extract all biblical references
 */
export function extractBibleReferences(text: string): BibleReference[] {
  const references: BibleReference[] = [];
  let match;
  
  while ((match = BIBLE_REFERENCE_REGEX.exec(text)) !== null) {
    const [fullText, prefix = '', bookName, chapter, verseStart, , verseEnd] = match;
    
    // Normalize book name
    const normalizedBook = normalizeBookName((prefix + bookName).trim());
    if (!normalizedBook) continue; // Not a valid book name
    
    references.push({
      book: normalizedBook,
      chapter: parseInt(chapter),
      verseStart: verseStart ? parseInt(verseStart) : undefined,
      verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
      fullText: fullText.trim()
    });
  }
  
  return references;
}

/**
 * Normalize book name to standard English form
 */
function normalizeBookName(input: string): string | null {
  const lowerInput = input.toLowerCase().trim();
  
  for (const [standardName, variants] of Object.entries(BIBLE_BOOKS)) {
    if (variants.some(v => lowerInput === v || lowerInput.startsWith(v + ' '))) {
      return standardName;
    }
  }
  
  return null;
}

/**
 * Generate Vatican Bible URL for a reference
 * Uses USCCB Bible (official Catholic Bible for English)
 * For Latin, uses Bible Gateway's Vulgate since Vatican URLs are complex
 * @param ref - Bible reference object
 * @param language - Language code (defaults to English)
 */
export function generateVaticanUrl(ref: BibleReference, language: string = 'EN'): string {
  if (language === 'LA' || language === 'LATIN') {
    // Use Bible Gateway's VULGATE version for Latin
    return generateBibleGatewayUrl(ref, 'VULGATE');
  }
  
  // For all other languages, use USCCB (official Catholic Bible)
  return generateUSCCBUrl(ref);
}

/**
 * Generate Bible Gateway URL for a reference (backup option)
 * @param ref - Bible reference object
 * @param version - Bible version (e.g., 'NABRE', 'RSVCE', 'VULGATE', 'RVR1995')
 */
export function generateBibleGatewayUrl(ref: BibleReference, version: string = 'NABRE'): string {
  const baseUrl = 'https://www.biblegateway.com/passage/';
  let passage = `${ref.book} ${ref.chapter}`;
  
  if (ref.verseStart) {
    passage += `:${ref.verseStart}`;
    if (ref.verseEnd) {
      passage += `-${ref.verseEnd}`;
    }
  }
  
  const encodedPassage = encodeURIComponent(passage);
  return `${baseUrl}?search=${encodedPassage}&version=${version}`;
}

/**
 * Generate USCCB Bible URL for a reference (English only)
 */
export function generateUSCCBUrl(ref: BibleReference): string {
  const baseUrl = 'https://bible.usccb.org/bible/';
  const bookSlug = ref.book.toLowerCase().replace(/\s+/g, '');
  
  let path = `${bookSlug}/${ref.chapter}`;
  if (ref.verseStart) {
    path += `?${ref.verseStart}`;
    if (ref.verseEnd) {
      path += `-${ref.verseEnd}`;
    }
  }
  
  return baseUrl + path;
}

/**
 * Get Bible version code based on language
 */
export function getBibleVersionByLanguage(language: BibleLanguage): string {
  const versionMap: Record<BibleLanguage, string> = {
    english: 'NABRE',      // New American Bible Revised Edition (Catholic)
    spanish: 'RVR1995',    // Reina Valera 1995
    italian: 'CEI',        // Conferenza Episcopale Italiana
    french: 'BDS',         // Bible du Semeur
    german: 'LUT',         // Luther Bible
    portuguese: 'ARC',     // Almeida Revista e Corrigida
    latin: 'VULGATE',      // Latin Vulgate
    greek: 'TR',           // Textus Receptus (Greek NT)
  };
  
  return versionMap[language];
}

/**
 * Replace biblical references in text with markdown links
 * Now uses Vatican/USCCB (official Catholic sources) instead of Bible Gateway
 */
export function linkifyScripture(text: string, language: BibleLanguage = 'english'): string {
  // If text already contains markdown links to Bible sites, don't process it
  // This prevents double-linking when Claude already included links
  if (text.includes('bible.usccb.org') || 
      text.includes('vatican.va') || 
      text.includes('biblegateway.com')) {
    return text;
  }
  
  const references = extractBibleReferences(text);
  let linkedText = text;
  
  // Sort by position (longest first to avoid partial replacements)
  references.sort((a, b) => b.fullText.length - a.fullText.length);
  
  for (const ref of references) {
    // Route to appropriate Bible source based on language
    let url: string;
    
    if (language === 'english') {
      // English: Use USCCB (official Catholic Bible)
      url = generateUSCCBUrl(ref);
    } else if (language === 'latin') {
      // Latin: Use Bible Gateway Vulgate
      url = generateBibleGatewayUrl(ref, 'VULGATE');
    } else if (language === 'greek') {
      // Greek: Use Bible Gateway Textus Receptus
      url = generateBibleGatewayUrl(ref, 'TR');
    } else {
      // All other languages: Use Bible Gateway with appropriate version
      const version = getBibleVersionByLanguage(language);
      url = generateBibleGatewayUrl(ref, version);
    }
    
    const markdownLink = `[${ref.fullText}](${url})`;
    
    // Simple replacement - only if not already a link
    if (!linkedText.includes(markdownLink)) {
      // Escape special regex characters
      const escapedRef = ref.fullText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedRef, 'g');
      linkedText = linkedText.replace(regex, markdownLink);
    }
  }
  
  return linkedText;
}

/**
 * Detect language from text (simple heuristic)
 */
export function detectLanguage(text: string): BibleLanguage {
  const lowerText = text.toLowerCase();
  
  if (/\b(génesis|éxodo|mateo|marcos|lucas|juan)\b/.test(lowerText)) {
    return 'spanish';
  } else if (/\b(genesi|esodo|matteo|marco|luca|giovanni)\b/.test(lowerText)) {
    return 'italian';
  } else if (/\b(genèse|exode|matthieu|marc|luc|jean)\b/.test(lowerText)) {
    return 'french';
  } else if (/\b(genesis|exodus|matthäus|markus|lukas|johannes)\b/.test(lowerText)) {
    return 'german';
  } else if (/\b(gênesis|êxodo|mateus|marcos|lucas|joão)\b/.test(lowerText)) {
    return 'portuguese';
  } else if (/\b(λόγος|ἀγάπη|πίστις)\b/.test(lowerText)) {
    return 'greek';
  } else if (/\b(verbum|agape|fides)\b/.test(lowerText)) {
    return 'latin';
  }
  
  return 'english'; // Default
}
