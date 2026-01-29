
import fs from 'fs';
import path from 'path';

// --- Interfaces ---

interface FineTuningMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FineTuningExample {
  messages: FineTuningMessage[];
}

interface CatechismEntry {
  id: number | string;
  text: string;
}

interface PapalDocument {
  id: string;
  pope: string;
  title: string;
  theme: string;
  key_passages: {
    paragraph: number;
    text: string;
    theme: string;
  }[];
}

interface DailyGospelReflection {
  date: string;
  liturgical_day: string;
  gospel_citation: string;
  gospel_text: string;
  context?: {
    historical?: string;
    literary?: string;
    liturgical?: string;
  };
  philology?: {
    greek_terms?: { word: string; meaning: string; insight: string; transliteration?: string }[];
    hebrew_background?: string;
  };
  traditional_interpretation?: {
    church_fathers?: { father: string; quote: string }[];
    magisterial_teaching?: string;
  };
  practical_application?: string;
}

interface GenericContentEntry {
  id?: string;
  title?: string;
  heading?: string; // Alternative to title
  content?: string;
  text?: string; // Alternative to content
  source?: string;
}

// --- Configuration ---

const SYSTEM_PROMPT = "Eres santaPalabra, un asistente de IA católico experto en teología, historia de la Iglesia y doctrina. Responde con fidelidad al Magisterio y a la Tradición.";

// --- Processors ---

function processCatechism(data: CatechismEntry[], examples: FineTuningExample[]) {
  console.log(`Processing ${data.length} catechism entries...`);
  data.forEach(entry => {
    if (entry.text && entry.text.length > 50) {
      // Direct Question
      examples.push({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `¿Qué enseña el Catecismo en el numeral ${entry.id}?` },
          { role: 'assistant', content: entry.text.trim() }
        ]
      });
      
      // Reverse Query (Explanation -> Source)
      examples.push({
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Explícame la siguiente enseñanza católica: "${entry.text.substring(0, 70)}..."` },
            { role: 'assistant', content: `Este texto corresponde al numeral ${entry.id} del Catecismo de la Iglesia Católica: "${entry.text.trim()}"` }
        ]
      });
    }
  });
}

function processPapalDocuments(data: any, examples: FineTuningExample[]) {
  const documents: PapalDocument[] = Array.isArray(data) ? data : (data.papal_documents || []);
  console.log(`Processing ${documents.length} papal documents...`);
  
  documents.forEach(doc => {
    if (doc.key_passages) {
      doc.key_passages.forEach(passage => {
        examples.push({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `¿Qué dice el Papa ${doc.pope} sobre "${passage.theme}" en la encíclica ${doc.title}?` },
            { role: 'assistant', content: passage.text.trim() }
          ]
        });
      });
    }
  });
}

function processDailyGospel(data: DailyGospelReflection[], examples: FineTuningExample[]) {
  console.log(`Processing ${data.length} gospel reflections...`);
  data.forEach(entry => {
    // 1. Liturgical Context
    if (entry.context?.liturgical) {
      examples.push({
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `¿Cuál es el contexto litúrgico de ${entry.liturgical_day} (${entry.gospel_citation})?` },
            { role: 'assistant', content: entry.context.liturgical }
        ]
      });
    }

    // 2. Philology / Greek Terms
    if (entry.philology?.greek_terms) {
        entry.philology.greek_terms.forEach(term => {
            examples.push({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `¿Cuál es el significado teológico del término griego "${term.word}" (${term.transliteration || ''}) en el Evangelio?` },
                    { role: 'assistant', content: `El término "${term.word}" significa "${term.meaning}". Insight teológico: ${term.insight}` }
                ]
            });
        });
    }

    // 3. Church Fathers
    if (entry.traditional_interpretation?.church_fathers) {
        entry.traditional_interpretation.church_fathers.forEach(father => {
            examples.push({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `¿Qué comenta ${father.father} sobre el pasaje de ${entry.gospel_citation}?` },
                    { role: 'assistant', content: `"${father.quote}"` }
                ]
            });
        });
    }

    // 4. Practical Application
    if (entry.practical_application) {
        examples.push({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Dame una aplicación práctica para el Evangelio de ${entry.liturgical_day}.` },
                { role: 'assistant', content: entry.practical_application }
            ]
        });
    }
  });
}

function processGenericContent(data: any[], examples: FineTuningExample[], sourceName: string) {
    console.log(`Processing ${data.length} entries from ${sourceName}...`);
    data.forEach(entry => {
        const title = entry.title || entry.heading || "Enseñanza Católica";
        const content = entry.content || entry.text;
        
        if (content && content.length > 20) {
            examples.push({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Explícame sobre: ${title}` },
                    { role: 'assistant', content: content }
                ]
            });
             examples.push({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `¿Qué dice la teología católica acerca de "${title}"?` },
                    { role: 'assistant', content: content }
                ]
            });
        }
    });
}


// --- Main ---

async function main() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const outputDir = path.join(process.cwd(), 'datasets');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const examples: FineTuningExample[] = [];

  // 1. Catechism
  try {
    const catechismData = JSON.parse(fs.readFileSync(path.join(dataDir, 'catechism.json'), 'utf-8'));
    processCatechism(catechismData, examples);
  } catch (e) { console.error("Skipping catechism (not found or invalid)"); }

  // 2. Papal Magisterium
  try {
    const papalData = JSON.parse(fs.readFileSync(path.join(dataDir, 'papal_magisterium.json'), 'utf-8'));
    processPapalDocuments(papalData, examples);
  } catch (e) { console.error("Skipping papal magisterium"); }

  // 3. Daily Gospel Reflections
  try {
    const gospelData = JSON.parse(fs.readFileSync(path.join(dataDir, 'daily_gospel_reflections.json'), 'utf-8'));
    processDailyGospel(gospelData, examples);
  } catch (e) { console.error("Skipping daily gospel"); }

  // 4. Generic Collections (Theology, History, etc.)
  const genericFiles = [
      { file: 'biblical_theology.json', name: 'Teología Bíblica' },
      { file: 'dogmatic_theology.json', name: 'Teología Dogmática' },
      { file: 'church_history.json', name: 'Historia de la Iglesia' },
      { file: 'celam_latinoamerica.json', name: 'Documentos CELAM' },
      { file: 'custom_teachings.json', name: 'Enseñanzas Particulares' },
      { file: 'espiritualidad_hispanoamericana.json', name: 'Espiritualidad Hispana' }
  ];

  for (const item of genericFiles) {
      try {
          const filePath = path.join(dataDir, item.file);
          if (fs.existsSync(filePath)) {
              const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              if (Array.isArray(data)) {
                  processGenericContent(data, examples, item.name);
              }
          }
      } catch (e) {
          console.error(`Skipping ${item.name} (error reading)`);
      }
  }

  // --- Output ---
  const outputPath = path.join(outputDir, 'fine_tuning_data.jsonl');
  const stream = fs.createWriteStream(outputPath);

  examples.forEach(ex => {
    stream.write(JSON.stringify(ex) + '\n');
  });

  stream.end();
  console.log(`\n✅ Generated ${examples.length} fine-tuning examples at ${outputPath}`);
}

main().catch(console.error);
