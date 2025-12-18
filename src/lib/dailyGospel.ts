// Daily Gospel Reading with Catholic Biblical Reflection
import fs from 'fs';
import path from 'path';

export interface DailyGospelReflection {
  date: string;
  liturgical_day: string;
  gospel_citation: string;
  gospel_text: string;
  context: {
    historical: string;
    literary: string;
    liturgical: string;
    canonical: string;
  };
  philology: {
    greek_terms: Array<{
      word: string;
      transliteration: string;
      meaning: string;
      insight: string;
    }>;
    hebrew_background: string;
  };
  old_testament_connections: Array<{
    passage: string;
    text: string;
    connection: string;
    type: string;
  }>;
  traditional_interpretation: {
    church_fathers: Array<{
      father: string;
      quote: string;
      source: string;
    }>;
    modern_exegesis: string;
    magisterial_teaching: string;
  };
  personal_reflection: {
    questions: string[];
    prayer_prompt: string;
  };
  scholars: {
    ratzinger: string;
    hahn: string;
    wright: string;
  };
  liturgical_connection: string;
  practical_application: string;
  tags: string[];
}

// Cache for loaded reflections
let cachedReflections: DailyGospelReflection[] | null = null;

function loadDailyGospelReflections(): DailyGospelReflection[] {
  if (cachedReflections) return cachedReflections;
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'daily_gospel_reflections.json');
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    cachedReflections = JSON.parse(fileContents);
    return cachedReflections || [];
  } catch (error) {
    console.error('Error loading daily Gospel reflections:', error);
    return [];
  }
}


// Format today's date for API calls (YYYY-MM-DD)
export function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getDailyGospelReflection(date: string): DailyGospelReflection | null {
  const reflections = loadDailyGospelReflections();
  const reflection = reflections.find(r => r.date === date);
  return reflection || null;
}

export function getTodaysGospelReflection(): DailyGospelReflection | null {
  return getDailyGospelReflection(getTodayDate());
}

export function searchDailyGospelByKeyword(keyword: string): DailyGospelReflection[] {
  const reflections = loadDailyGospelReflections();
  const lowerKeyword = keyword.toLowerCase();
  
  return reflections.filter(r => 
    r.gospel_text.toLowerCase().includes(lowerKeyword) ||
    r.gospel_citation.toLowerCase().includes(lowerKeyword) ||
    r.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
    r.liturgical_day.toLowerCase().includes(lowerKeyword)
  );
}

export function formatDailyGospelContext(reflection: DailyGospelReflection): string {
  let context = `\n\n📖 **DAILY GOSPEL REFLECTION**\n`;
  context += `**${reflection.liturgical_day}** - ${reflection.gospel_citation}\n\n`;
  
  context += `**Gospel Text:**\n"${reflection.gospel_text}"\n\n`;
  
  context += `**Context:**\n`;
  context += `- Historical: ${reflection.context.historical}\n`;
  context += `- Literary: ${reflection.context.literary}\n`;
  context += `- Liturgical: ${reflection.context.liturgical}\n\n`;
  
  if (reflection.philology.greek_terms.length > 0) {
    context += `**Key Greek Terms:**\n`;
    reflection.philology.greek_terms.forEach(term => {
      context += `- **${term.word}** (${term.transliteration}): ${term.meaning} - ${term.insight}\n`;
    });
    context += `\n`;
  }
  
  if (reflection.old_testament_connections.length > 0) {
    context += `**Old Testament Connections:**\n`;
    reflection.old_testament_connections.forEach(conn => {
      context += `- ${conn.passage}: ${conn.connection}\n`;
    });
    context += `\n`;
  }
  
  if (reflection.traditional_interpretation.church_fathers.length > 0) {
    context += `**Church Fathers:**\n`;
    reflection.traditional_interpretation.church_fathers.slice(0, 2).forEach(father => {
      context += `- ${father.father}: "${father.quote}"\n`;
    });
    context += `\n`;
  }
  
  context += `**For Personal Reflection:**\n`;
  reflection.personal_reflection.questions.slice(0, 3).forEach((q, i) => {
    context += `${i + 1}. ${q}\n`;
  });
  
  return context;
}
