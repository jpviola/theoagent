import fs from 'fs';
import path from 'path';

// Define types for our data sources
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

interface FineTuningMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FineTuningExample {
  messages: FineTuningMessage[];
}

const SYSTEM_PROMPT = "Eres santaPalabra, un asistente de IA católico experto en teología y doctrina. Responde basándote fielmente en las enseñanzas de la Iglesia.";

async function main() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const outputDir = path.join(process.cwd(), 'datasets');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const examples: FineTuningExample[] = [];

  // Process Catechism
  try {
    const catechismPath = path.join(dataDir, 'catechism.json');
    if (fs.existsSync(catechismPath)) {
      const catechismData: CatechismEntry[] = JSON.parse(fs.readFileSync(catechismPath, 'utf-8'));
      console.log(`Processing ${catechismData.length} catechism entries...`);
      
      catechismData.forEach(entry => {
        if (entry.text && entry.text.length > 50) { // Skip too short entries
          examples.push({
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `¿Qué enseña el Catecismo en el punto ${entry.id}?` },
              { role: 'assistant', content: entry.text.trim() }
            ]
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing catechism:', error);
  }

  // Process Papal Magisterium
  try {
    const papalPath = path.join(dataDir, 'papal_magisterium.json');
    if (fs.existsSync(papalPath)) {
      const fileContent = fs.readFileSync(papalPath, 'utf-8');
      const jsonContent = JSON.parse(fileContent);
      // Handle both array root or object with property
      const documents: PapalDocument[] = Array.isArray(jsonContent) ? jsonContent : (jsonContent.papal_documents || []);
      
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
  } catch (error) {
    console.error('Error processing papal documents:', error);
  }

  // Write output
  const outputPath = path.join(outputDir, 'fine_tuning_data.jsonl');
  const stream = fs.createWriteStream(outputPath, { flags: 'w' });
  
  examples.forEach(ex => {
    stream.write(JSON.stringify(ex) + '\n');
  });
  
  stream.end();
  console.log(`✅ Successfully generated ${examples.length} training examples in ${outputPath}`);
}

main();
