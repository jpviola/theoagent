import fs from 'fs';
import path from 'path';
import { 
  getDailyGospelReflection, 
  getTodaysGospelReflection, 
  searchDailyGospelByKeyword, 
  formatDailyGospelContext,
  type DailyGospelReflection as DailyGospel 
} from './dailyGospel';
import { mentionsVaticanDocuments } from './vaticanDocuments';

// Type definitions for your custom data
export interface CatechismItem {
  id: number;
  text: string;
}

export interface CustomTeaching {
  id: string;
  title: string;
  content: string;
  source: string;
  tags: string[];
}

export interface DeiVerbumPassage {
  id: string;
  document: string;
  abbreviation: string;
  paragraph: number;
  title: string;
  text: string;
  theme: string;
  biblical_foundation: string[];
  key_insights: string[];
  connection_to_scripture_study: string;
  tags: string[];
}

export interface GospelParable {
  id: string;
  title: string;
  reference: string;
  text: string;
  difficulty: string;
  interpretation: {
    literal: string;
    allegorical: string;
    moral: string;
    anagogical: string;
  };
  scholars: Record<string, string>;
  practical: string;
  tags: string[];
}

export interface GospelPassage {
  id: string;
  reference: string;
  text: string;
  difficulty: string;
  greek_key_words: Record<string, any>;
  interpretation: string;
  tags: string[];
}

export interface DifficultPassage {
  id: string;
  passage: string;
  question: string;
  difficulty: string;
  answer: string;
  canonical_connections: string[];
  practical_application: string;
  tags: string[];
}

export interface PapalDocument {
  id: string;
  pope: string;
  document_type: string;
  title: string;
  abbreviation: string;
  year: number;
  theme: string;
  key_passages: {
    paragraph: number;
    text: string;
    theme: string;
  }[];
  biblical_foundation: string[];
  tags: string[];
}

// Load catechism data
export function loadCatechism(): CatechismItem[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'catechism.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Load gospel parables
export function loadGospelParables(): GospelParable[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'gospel_parables.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
}

// Load gospel passages with Greek analysis
export function loadGospelPassages(): GospelPassage[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'gospel_passages_greek.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
}

// Load difficult passages FAQ
export function loadDifficultPassages(): DifficultPassage[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'difficult_passages.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
}

// Load Dei Verbum passages
export function loadDeiVerbumPassages(): DeiVerbumPassage[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'dei_verbum_passages.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
}

// Load papal magisterium documents
export function loadPapalMagisterium(): PapalDocument[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'papal_magisterium.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return data.papal_documents || [];
  } catch {
    return [];
  }
}


// Simple keyword search in catechism
export function searchCatechism(query: string, limit: number = 3): CatechismItem[] {
  const catechism = loadCatechism();
  const lowerQuery = query.toLowerCase();
  
  // Split query into keywords
  const keywords = lowerQuery.split(' ').filter(word => word.length > 3);
  
  // Score each paragraph based on keyword matches
  const scored = catechism.map(item => {
    let score = 0;
    const lowerText = item.text.toLowerCase();
    
    keywords.forEach(keyword => {
      // Count occurrences of each keyword
      const matches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
      score += matches;
    });
    
    return { ...item, score };
  });
  
  // Sort by score and return top results
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Format catechism results for context injection
export function formatCatechismContext(results: CatechismItem[]): string {
  if (results.length === 0) return '';
  
  let context = '\n\n--- RELEVANT CATECHISM REFERENCES ---\n';
  results.forEach((item, idx) => {
    context += `\n[CCC ${item.id}]: ${item.text}\n`;
  });
  context += '\n--- END REFERENCES ---\n\n';
  context += 'Please reference these catechism paragraphs in your response when relevant.\n';
  
  return context;
}

// Example: Add your own custom teachings
// Create a file: public/data/custom_teachings.json
export function loadCustomTeachings(): CustomTeaching[] {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'custom_teachings.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return []; // Return empty if file doesn't exist yet
  }
}

// Search custom teachings
export function searchCustomTeachings(query: string, limit: number = 2): CustomTeaching[] {
  const teachings = loadCustomTeachings();
  const lowerQuery = query.toLowerCase();
  
  return teachings
    .filter(teaching => 
      teaching.title.toLowerCase().includes(lowerQuery) ||
      teaching.content.toLowerCase().includes(lowerQuery) ||
      teaching.tags.some(tag => lowerQuery.includes(tag.toLowerCase()))
    )
    .slice(0, limit);
}

// Search gospel parables
export function searchGospelParables(query: string, limit: number = 2): GospelParable[] {
  const parables = loadGospelParables();
  const lowerQuery = query.toLowerCase();
  
  return parables
    .filter(parable => 
      parable.title.toLowerCase().includes(lowerQuery) ||
      parable.reference.toLowerCase().includes(lowerQuery) ||
      parable.text.toLowerCase().includes(lowerQuery) ||
      parable.difficulty.toLowerCase().includes(lowerQuery) ||
      parable.tags.some(tag => lowerQuery.includes(tag.toLowerCase()))
    )
    .slice(0, limit);
}

// Search gospel passages (especially for Greek word queries)
export function searchGospelPassages(query: string, limit: number = 2): GospelPassage[] {
  const passages = loadGospelPassages();
  const lowerQuery = query.toLowerCase();
  
  return passages
    .filter(passage => 
      passage.reference.toLowerCase().includes(lowerQuery) ||
      passage.text.toLowerCase().includes(lowerQuery) ||
      passage.difficulty.toLowerCase().includes(lowerQuery) ||
      passage.interpretation.toLowerCase().includes(lowerQuery) ||
      passage.tags.some(tag => lowerQuery.includes(tag.toLowerCase())) ||
      // Search Greek words
      Object.values(passage.greek_key_words || {}).some((wordData: any) =>
        lowerQuery.includes(wordData.transliteration?.toLowerCase()) ||
        lowerQuery.includes(wordData.word?.toLowerCase())
      )
    )
    .slice(0, limit);
}

// Search difficult passages
export function searchDeiVerbumPassages(query: string, limit: number = 2): DeiVerbumPassage[] {
  const passages = loadDeiVerbumPassages();
  const lowerQuery = query.toLowerCase();
  
  return passages
    .filter(passage => 
      passage.title.toLowerCase().includes(lowerQuery) ||
      passage.text.toLowerCase().includes(lowerQuery) ||
      passage.theme.toLowerCase().includes(lowerQuery) ||
      passage.connection_to_scripture_study.toLowerCase().includes(lowerQuery) ||
      passage.tags.some(tag => lowerQuery.includes(tag.toLowerCase()))
    )
    .slice(0, limit);
}

// Search papal magisterium documents
export function searchPapalMagisterium(query: string, limit: number = 2): PapalDocument[] {
  const documents = loadPapalMagisterium();
  const lowerQuery = query.toLowerCase();
  
  return documents
    .filter(doc => 
      doc.pope.toLowerCase().includes(lowerQuery) ||
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.theme.toLowerCase().includes(lowerQuery) ||
      doc.tags.some(tag => lowerQuery.includes(tag.toLowerCase()) || tag.toLowerCase().includes(lowerQuery)) ||
      doc.key_passages.some(p => p.text.toLowerCase().includes(lowerQuery) || p.theme.toLowerCase().includes(lowerQuery))
    )
    .slice(0, limit);
}


// Search difficult passages
export function searchDifficultPassages(query: string, limit: number = 1): DifficultPassage[] {
  const passages = loadDifficultPassages();
  const lowerQuery = query.toLowerCase();
  
  return passages
    .filter(passage => 
      passage.passage.toLowerCase().includes(lowerQuery) ||
      passage.question.toLowerCase().includes(lowerQuery) ||
      passage.difficulty.toLowerCase().includes(lowerQuery) ||
      passage.answer.toLowerCase().includes(lowerQuery) ||
      passage.tags.some(tag => lowerQuery.includes(tag.toLowerCase()))
    )
    .slice(0, limit);
}

// Format gospel parable context
export function formatParableContext(parables: GospelParable[]): string {
  if (parables.length === 0) return '';
  
  let context = '\n\n--- RELEVANT GOSPEL PARABLES ---\n';
  parables.forEach(parable => {
    context += `\n**${parable.title}** (${parable.reference})\n`;
    context += `Difficulty: ${parable.difficulty}\n\n`;
    context += `**Four Senses Interpretation:**\n`;
    context += `- Literal: ${parable.interpretation.literal}\n`;
    context += `- Allegorical: ${parable.interpretation.allegorical}\n`;
    context += `- Moral: ${parable.interpretation.moral}\n`;
    context += `- Anagogical: ${parable.interpretation.anagogical}\n\n`;
    
    const scholarNames = Object.keys(parable.scholars);
    if (scholarNames.length > 0) {
      context += `**Scholarly Insights:**\n`;
      scholarNames.slice(0, 2).forEach(scholar => {
        context += `- ${scholar}: ${parable.scholars[scholar]}\n`;
      });
    }
    context += `\nPractical: ${parable.practical}\n`;
  });
  context += '\n--- END PARABLES ---\n';
  
  return context;
}

// Format gospel passage with Greek analysis
export function formatPassageContext(passages: GospelPassage[]): string {
  if (passages.length === 0) return '';
  
  let context = '\n\n--- RELEVANT GOSPEL PASSAGES (WITH GREEK) ---\n';
  passages.forEach(passage => {
    context += `\n**${passage.reference}**\n`;
    context += `"${passage.text}"\n\n`;
    context += `Difficulty: ${passage.difficulty}\n\n`;
    
    const greekWords = Object.entries(passage.greek_key_words || {}).slice(0, 3);
    if (greekWords.length > 0) {
      context += `**Key Greek Words:**\n`;
      greekWords.forEach(([key, data]: [string, any]) => {
        context += `- ${data.transliteration} (${data.word}): ${data.meaning}\n`;
        context += `  Insight: ${data.insight}\n`;
      });
    }
    
    context += `\n**Interpretation:** ${passage.interpretation}\n`;
  });
  context += '\n--- END PASSAGES ---\n';
  
  return context;
}

// Format difficult passages
export function formatDifficultContext(passages: DifficultPassage[]): string {
  if (passages.length === 0) return '';
  
  let context = '\n\n--- DIFFICULT PASSAGE EXPLAINED ---\n';
  passages.forEach(passage => {
    context += `\n**${passage.passage}**: ${passage.question}\n\n`;
    context += `**Difficulty:** ${passage.difficulty}\n\n`;
    context += `**Answer:** ${passage.answer.substring(0, 1000)}...\n\n`;
    context += `**Practical:** ${passage.practical_application}\n`;
  });
  context += '\n--- END DIFFICULT PASSAGE ---\n';
  
  return context;
}

// Format Dei Verbum passages
export function formatDeiVerbumContext(passages: DeiVerbumPassage[]): string {
  if (passages.length === 0) return '';
  
  let context = '\n\n--- VATICAN II: DEI VERBUM (DIVINE REVELATION) ---\n';
  passages.forEach(passage => {
    context += `\n**${passage.abbreviation} ${passage.paragraph}: ${passage.title}**\n`;
    context += `"${passage.text}"\n\n`;
    context += `Theme: ${passage.theme}\n\n`;
    
    if (passage.key_insights.length > 0) {
      context += `**Key Insights:**\n`;
      passage.key_insights.forEach(insight => {
        context += `- ${insight}\n`;
      });
      context += `\n`;
    }
    
    context += `Biblical Foundation: ${passage.biblical_foundation.join(', ')}\n`;
  });
  context += '--- END DEI VERBUM ---\n';
  
  return context;
}

// Format papal magisterium
export function formatPapalMagisteriumContext(documents: PapalDocument[]): string {
  if (documents.length === 0) return '';
  
  let context = '\n\n--- PAPAL MAGISTERIUM (HISTORICAL DOCUMENTS) ---\n';
  context += '**IMPORTANT**: These papal teachings span from Leo XIII through Pope Leo XIV (current). Pope Leo XIV has published the apostolic exhortation "Dilexi me" (2025).\n';
  context += 'Do NOT state that Pope Francis is the current pope. He was pope from 2013-2025.\n\n';
  
  documents.forEach(doc => {
    context += `\n**${doc.title}** (${doc.abbreviation}, ${doc.year})\n`;
    context += `Pope: ${doc.pope} | Type: ${doc.document_type}\n`;
    context += `Theme: ${doc.theme}\n\n`;
    
    context += `**Key Passages:**\n`;
    doc.key_passages.slice(0, 2).forEach(passage => {
      context += `\n§${passage.paragraph}: "${passage.text}"\n`;
      context += `(Theme: ${passage.theme})\n`;
    });
    
    context += `\nBiblical Foundation: ${doc.biblical_foundation.join(', ')}\n`;
  });
  context += '--- END PAPAL MAGISTERIUM ---\n';
  
  return context;
}

// Main function to gather all relevant context
export function gatherContextForQuery(query: string): string {
  let fullContext = '';
  
  // Check for parable keywords
  const parableKeywords = ['parable', 'prodigal', 'sower', 'samaritan', 'mustard', 'pearl', 'treasure'];
  const hasParableQuery = parableKeywords.some(kw => query.toLowerCase().includes(kw));
  
  // Check for Greek/exegesis keywords  
  const greekKeywords = ['greek', 'word', 'original', 'translation', 'logos', 'agape', 'flesh', 'john', 'beatitude'];
  const hasGreekQuery = greekKeywords.some(kw => query.toLowerCase().includes(kw));
  
  // Check for papal/magisterium keywords
  const papalKeywords = [
    'pope', 'papal', 'encyclical', 'francis', 'benedict', 'john paul', 'paul vi', 'magisterium', 'church teaching', 'leo xiv', 'leo 14', 'dilexi me', 'current pope', 'actual pope', 'present pope',
    'papa', 'papales', 'encíclica', 'enseñanza', 'enseñanzas', 'francisco', 'benedicto', 'juan pablo', 'pablo vi', 'magisterio', 'león xiv', 'león 14', 'papa actual', 'papa presente', 'actividades recientes', 'noticias del papa', // Spanish
    'enciclica', 'insegnamento', 'insegnamenti', 'benedetto', 'giovanni paolo', 'paolo vi', 'leo xiv', 'papa attuale', 'papa presente', 'attività recenti', // Italian
    'encyclique', 'enseignement', 'enseignements', 'benoît', 'jean-paul', 'paul vi', 'léon xiv', 'pape actuel', 'pape présent', 'activités récentes' // French
  ];
  const hasPapalQuery = papalKeywords.some(kw => query.toLowerCase().includes(kw));
  
  // Check for difficulty keywords
  const difficultyKeywords = ['why', 'how can', 'does jesus', 'harsh', 'cruel', 'hate', 'dogs', 'unforgivable', 'blasphemy', 'pigs'];
  const hasDifficultyQuery = difficultyKeywords.some(kw => query.toLowerCase().includes(kw));
  
  // Check for daily Gospel keywords (multi-language support)
  const dailyGospelKeywords = [
    'today', 'daily', 'gospel today', 'todays gospel', "today's", 'mass today', 'liturgy',
    'hoy', 'del día', 'evangelio del día', 'evangelio de hoy', 'misa de hoy', 'liturgia de hoy', // Spanish
    'oggi', 'del giorno', 'vangelo del giorno', 'vangelo di oggi', 'messa di oggi', 'liturgia di oggi', // Italian
    "aujourd'hui", 'du jour', "évangile du jour", "évangile d'aujourd'hui", "messe d'aujourd'hui", 'liturgie du jour' // French
  ];
  const hasDailyGospelQuery = dailyGospelKeywords.some(kw => query.toLowerCase().includes(kw));
  
  // Check for Vatican II / Dei Verbum keywords
  const vaticanKeywords = ['dei verbum', 'vatican ii', 'vatican 2', 'interpretation', 'exegesis', 'how to read', 'scripture study', 'inspiration', 'inerrancy'];
  const hasVaticanQuery = vaticanKeywords.some(kw => query.toLowerCase().includes(kw)) || mentionsVaticanDocuments(query);
  
  // If asking for today's Gospel, return it immediately
  if (hasDailyGospelQuery) {
    const todaysGospel = getTodaysGospelReflection();
    if (todaysGospel) {
      fullContext += formatDailyGospelContext(todaysGospel);
      return fullContext;
    }
  }
  
  // Search Dei Verbum if asking about interpretation, exegesis, or Vatican II
  if (hasVaticanQuery) {
    const deiVerbumPassages = searchDeiVerbumPassages(query, 2);
    if (deiVerbumPassages.length > 0) {
      fullContext += formatDeiVerbumContext(deiVerbumPassages);
      // Don't return early - can combine with other context
    }
  }
  
  // Search difficult passages FIRST (they're comprehensive)
  if (hasDifficultyQuery || query.length > 30) {
    const difficultPassages = searchDifficultPassages(query, 1);
    if (difficultPassages.length > 0) {
      fullContext += formatDifficultContext(difficultPassages);
      return fullContext; // Return early if we found a difficult passage explanation
    }
  }
  
  // Search gospel parables
  if (hasParableQuery || query.length > 20) {
    const parables = searchGospelParables(query, 1);
    if (parables.length > 0) {
      fullContext += formatParableContext(parables);
    }
  }
  
  // Search gospel passages with Greek
  if (hasGreekQuery || (query.length > 20 && fullContext.length < 500)) {
    const passages = searchGospelPassages(query, 1);
    if (passages.length > 0) {
      fullContext += formatPassageContext(passages);
    }
  }
  
  // Search papal magisterium if relevant
  if (hasPapalQuery) {
    const papalDocs = searchPapalMagisterium(query, 1); // Reduced to 1 due to larger document sizes
    if (papalDocs.length > 0) {
      fullContext += formatPapalMagisteriumContext(papalDocs);
    }
  }
  
  // Search catechism (but less priority for biblical questions)
  if (fullContext.length < 500) {
    const catechismResults = searchCatechism(query, 2);
    if (catechismResults.length > 0) {
      fullContext += formatCatechismContext(catechismResults);
    }
  }
  
  // Search custom teachings
  if (fullContext.length < 1000) {
    const customResults = searchCustomTeachings(query, 1);
    if (customResults.length > 0) {
      fullContext += '\n\n--- ADDITIONAL REFERENCES ---\n';
      customResults.forEach(teaching => {
        fullContext += `\n**${teaching.title}** (${teaching.source})\n${teaching.content}\n`;
      });
    }
  }
  
  return fullContext;
}

// Usage example for your API route:
/*
import { gatherContextForQuery } from '@/lib/dataInjection';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Get user's question
  const userMessage = messages[messages.length - 1]?.content || '';
  
  // Gather relevant context
  const context = gatherContextForQuery(userMessage);
  
  // Inject context into the conversation
  const enhancedMessages = context ? [
    ...messages.slice(0, -1),
    {
      role: 'user',
      content: userMessage + context
    }
  ] : messages;
  
  // Continue with streamText...
}
*/
