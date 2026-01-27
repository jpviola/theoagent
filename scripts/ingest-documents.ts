
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import mammoth from 'mammoth';

let pdfLib = require('pdf-parse');
// Handle potential default export in CommonJS/ESM interop
if (!pdfLib.PDFParse && pdfLib.default && pdfLib.default.PDFParse) {
  pdfLib = pdfLib.default;
}
const { PDFParse } = pdfLib;

let EPub = require('epub2');
// Handle potential default export or named export
if (typeof EPub !== 'function') {
  if (typeof EPub.default === 'function') {
    EPub = EPub.default;
  } else if (typeof EPub.EPub === 'function') {
    EPub = EPub.EPub;
  }
}


const RAW_DIR = path.join(process.cwd(), 'documents/raw');
const OUTPUT_DIR = path.join(process.cwd(), 'public/data');

// Map folders to output filenames
const TRACK_MAP: Record<string, string> = {
  'dogmatic': 'dogmatic_theology.json',
  'biblical': 'biblical_theology.json',
  'history': 'church_history.json',
  'general': 'custom_library.json',
  'bible_study': 'bible_study_plan.json'
};

interface DocEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
}

async function processPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  // Using the new pdf-parse 2.x API
  const pdf = new PDFParse({ data: dataBuffer });
  const result = await pdf.getText();
  return result.text || '';
}

async function processDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
}

function processEpub(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const epub = new EPub(filePath);
    let fullText = '';

    epub.on('end', async () => {
      try {
        // Iterate over chapters and get text
        // EPub2 doesn't give simple text extraction out of the box easily without flow
        // We will try to iterate flow
        let textAccumulator: string[] = [];
        for (const chapter of epub.flow) {
           // This is a simplified approach. Getting text from epub correctly is complex.
           // For now we might just get the raw ID/href. 
           // Actually epub2 gives access to chapter text via getChapter
           if (!chapter.id) continue;
           
           await new Promise<void>((res, rej) => {
             epub.getChapter(chapter.id!, (err: any, text?: string) => {
               if (err) {
                 // ignore error or log
                 res(); 
                 return;
               }
               // Strip HTML tags
               const plain = (text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
               textAccumulator.push(plain);
               res();
             });
           });
        }
        resolve(textAccumulator.join('\n\n'));
      } catch (e) {
        reject(e);
      }
    });

    epub.on('error', (err: any) => {
      reject(err);
    });

    epub.parse();
  });
}

function chunkText(text: string, title: string, source: string, category: string): DocEntry[] {
  const chunks: DocEntry[] = [];
  const MAX_CHUNK_SIZE = 1500; // characters
  const OVERLAP = 200;
  
  // Normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  let i = 0;
  let chunkIndex = 0;
  
  while (i < cleanText.length) {
    const end = Math.min(i + MAX_CHUNK_SIZE, cleanText.length);
    let chunkContent = cleanText.slice(i, end);
    
    // Try to break at a sentence
    if (end < cleanText.length) {
      const lastPeriod = chunkContent.lastIndexOf('.');
      if (lastPeriod > MAX_CHUNK_SIZE * 0.5) {
        chunkContent = chunkContent.slice(0, lastPeriod + 1);
        i += lastPeriod + 1; // Move past the period
      } else {
        i += MAX_CHUNK_SIZE - OVERLAP; // Hard break with overlap
      }
    } else {
      i = end;
    }

    chunks.push({
      id: `${source}-${chunkIndex++}`,
      title: `${title} (Part ${chunkIndex})`,
      content: chunkContent.trim(),
      source: source,
      category: category
    });
  }
  
  return chunks;
}

async function main() {
  console.log('📚 Iniciando procesamiento de biblioteca...');
  
  // Ensure raw directory exists
  if (!fs.existsSync(RAW_DIR)) {
    console.log(`Creando estructura de directorios en ${RAW_DIR}...`);
    fs.mkdirSync(RAW_DIR, { recursive: true });
    Object.keys(TRACK_MAP).forEach(track => {
      const dir = path.join(RAW_DIR, track);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    console.log('✅ Estructura creada. Coloca tus archivos y vuelve a ejecutar.');
    return;
  }

  for (const [trackFolder, outputFilename] of Object.entries(TRACK_MAP)) {
    const trackPath = path.join(RAW_DIR, trackFolder);
    if (!fs.existsSync(trackPath)) continue;

    const files = fs.readdirSync(trackPath);
    const allDocs: DocEntry[] = [];

    console.log(`\n📂 Procesando carpeta: ${trackFolder}`);

    for (const file of files) {
      const filePath = path.join(trackPath, file);
      const ext = path.extname(file).toLowerCase();
      const filename = path.basename(file, ext);
      
      let text = '';
      try {
        if (ext === '.pdf') {
          console.log(`  📄 Leyendo PDF: ${file}`);
          text = await processPdf(filePath);
        } else if (ext === '.epub') {
          console.log(`  📖 Leyendo EPUB: ${file}`);
          text = await processEpub(filePath);
        } else if (ext === '.docx') {
          console.log(`  📝 Leyendo DOCX: ${file}`);
          text = await processDocx(filePath);
        } else if (ext === '.txt' || ext === '.md') {
          console.log(`  📝 Leyendo Texto: ${file}`);
          text = fs.readFileSync(filePath, 'utf-8');
        } else {
          continue; // Skip non-supported files
        }

        if (text) {
          const chunks = chunkText(text, filename, filename, 'custom_library');
          allDocs.push(...chunks);
          console.log(`     ✅ Extraídos ${chunks.length} fragmentos.`);
        }
      } catch (err) {
        console.error(`     ❌ Error procesando ${file}:`, err);
      }
    }

    if (allDocs.length > 0) {
      const outputPath = path.join(OUTPUT_DIR, outputFilename);
      fs.writeFileSync(outputPath, JSON.stringify(allDocs, null, 2));
      console.log(`💾 Guardados ${allDocs.length} documentos en ${outputFilename}`);
    } else {
      console.log(`⚠️ No se encontraron documentos válidos en ${trackFolder}`);
    }
  }
  
  console.log('\n✨ Proceso completado.');
}

main().catch(console.error);
