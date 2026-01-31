import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map of MorphGNT book codes to our DB IDs
const bookMap: Record<string, string> = {
  'Mt': 'Mt', 'Mk': 'Mk', 'Lk': 'Lk', 'Jn': 'Jn', 'Ac': 'Ac',
  'Ro': 'Ro', '1Co': '1Co', '2Co': '2Co', 'Ga': 'Ga', 'Eph': 'Eph',
  'Php': 'Php', 'Col': 'Col', '1Th': '1Th', '2Th': '2Th', '1Ti': '1Ti',
  '2Ti': '2Ti', 'Tit': 'Tit', 'Phm': 'Phm', 'Heb': 'Heb', 'Jas': 'Jas',
  '1Pe': '1Pe', '2Pe': '2Pe', '1Jn': '1Jn', '2Jn': '2Jn', '3Jn': '3Jn',
  'Jud': 'Jud', 'Re': 'Re'
};

// Files to fetch from MorphGNT/SBLGNT GitHub repo
// Using raw.githubusercontent.com
const BASE_URL = 'https://raw.githubusercontent.com/morphgnt/sblgnt/master';

const files = [
  '61-Mt-morphgnt.txt', '62-Mk-morphgnt.txt', '63-Lk-morphgnt.txt', '64-Jn-morphgnt.txt',
  '65-Ac-morphgnt.txt', '66-Ro-morphgnt.txt', '67-1Co-morphgnt.txt', '68-2Co-morphgnt.txt',
  '69-Ga-morphgnt.txt', '70-Eph-morphgnt.txt', '71-Php-morphgnt.txt', '72-Col-morphgnt.txt',
  '73-1Th-morphgnt.txt', '74-2Th-morphgnt.txt', '75-1Ti-morphgnt.txt', '76-2Ti-morphgnt.txt',
  '77-Tit-morphgnt.txt', '78-Phm-morphgnt.txt', '79-Heb-morphgnt.txt', '80-Jas-morphgnt.txt',
  '81-1Pe-morphgnt.txt', '82-2Pe-morphgnt.txt', '83-1Jn-morphgnt.txt', '84-2Jn-morphgnt.txt',
  '85-3Jn-morphgnt.txt', '86-Jud-morphgnt.txt', '87-Re-morphgnt.txt'
];

async function migrateBook(filename: string) {
  console.log(`Processing ${filename}...`);
  const response = await fetch(`${BASE_URL}/${filename}`);
  if (!response.ok) {
    console.error(`Failed to fetch ${filename}: ${response.statusText}`);
    return;
  }
  
  const content = await response.text();
  const lines = content.split('\n');

  let currentBookId = '';
  let currentChapter = 0;
  let currentVerse = 0;
  let verseWords: any[] = [];
  let verseText = '';

  for (const line of lines) {
    if (!line.trim()) continue;

    // Line format: book/chapter/verse pos parsing text word normalized lemma
    // Example: 610101 N- NGM Πίβλος βίβλος βίβλος βίβλος
    // Actually, based on README:
    // book/chapter/verse part-of-speech parsing-code text word normalized lemma
    // Columns are space-separated? Let's check a real line example if possible or assume standard split
    // The columns seem to be fixed width or space separated.
    // Let's try splitting by space.
    
    const parts = line.trim().split(/\s+/);
    if (parts.length < 7) continue;

    const bcv = parts[0]; // e.g. 610101 (Book 61, Chap 01, Verse 01)
    
    // Parse BCV
    const bookNum = bcv.substring(0, 2);
    const chapterNum = parseInt(bcv.substring(2, 4));
    const verseNum = parseInt(bcv.substring(4, 6));

    // Determine Book ID
    // 61=Mt, 62=Mk, etc.
    // We can use the filename or the code.
    // Let's assume the order in 'files' array matches bookMap order roughly?
    // Actually better to map standard IDs.
    // SBLGNT numbering: 61=Mt ... 87=Re.
    
    const bookId = getBookIdFromNum(bookNum);
    
    if (!bookId) {
        console.warn(`Unknown book number ${bookNum}`);
        continue;
    }

    if (bookId !== currentBookId || chapterNum !== currentChapter || verseNum !== currentVerse) {
      // New verse detected, save previous verse if exists
      if (currentBookId) {
        await saveVerse(currentBookId, currentChapter, currentVerse, verseText, verseWords);
      }
      
      currentBookId = bookId;
      currentChapter = chapterNum;
      currentVerse = verseNum;
      verseWords = [];
      verseText = '';
    }

    const pos = parts[1];
    const parsing = parts[2];
    const text = parts[3];
    const word = parts[4];
    const normalized = parts[5];
    const lemma = parts[6];

    verseText += text + ' ';
    
    verseWords.push({
      text,
      lemma,
      normalized,
      part_of_speech: pos,
      morphology: parsing,
      word_order: verseWords.length + 1
    });
  }

  // Save last verse
  if (currentBookId) {
    await saveVerse(currentBookId, currentChapter, currentVerse, verseText, verseWords);
  }
}

function getBookIdFromNum(num: string): string | undefined {
  const map: Record<string, string> = {
    // MorphGNT / SBLGNT Standard
    '61': 'Mt', '62': 'Mk', '63': 'Lk', '64': 'Jn', '65': 'Ac',
    '66': 'Ro', '67': '1Co', '68': '2Co', '69': 'Ga', '70': 'Eph',
    '71': 'Php', '72': 'Col', '73': '1Th', '74': '2Th', '75': '1Ti',
    '76': '2Ti', '77': 'Tit', '78': 'Phm', '79': 'Heb', '80': 'Jas',
    '81': '1Pe', '82': '2Pe', '83': '1Jn', '84': '2Jn', '85': '3Jn',
    '86': 'Jud', '87': 'Re',
    // Alternative numbering (1-27)
    '01': 'Mt', '02': 'Mk', '03': 'Lk', '04': 'Jn', '05': 'Ac',
    '06': 'Ro', '07': '1Co', '08': '2Co', '09': 'Ga', '10': 'Eph',
    '11': 'Php', '12': 'Col', '13': '1Th', '14': '2Th', '15': '1Ti',
    '16': '2Ti', '17': 'Tit', '18': 'Phm', '19': 'Heb', '20': 'Jas',
    '21': '1Pe', '22': '2Pe', '23': '1Jn', '24': '2Jn', '25': '3Jn',
    '26': 'Jud', '27': 'Re'
  };
  return map[num];
}

async function saveVerse(bookId: string, chapter: number, verse: number, textContent: string, words: any[]) {
  // 1. Insert Verse
  const { data: verseData, error: verseError } = await supabase
    .from('greek_bible_verses')
    .upsert({
      book_id: bookId,
      chapter,
      verse,
      text_content: textContent.trim()
    }, { onConflict: 'book_id,chapter,verse' })
    .select('id')
    .single();

  if (verseError) {
    if (verseError.code === 'PGRST205') {
      console.error('\n❌ ERROR CRÍTICO: Tablas no encontradas en Supabase.');
      console.error('👉 Por favor, ejecuta el script SQL en "src/sql/greek_bible_schema.sql" en el Editor SQL de Supabase antes de continuar.\n');
      process.exit(1);
    }
    console.error(`Error saving verse ${bookId} ${chapter}:${verse}:`, verseError);
    return;
  }

  const verseId = verseData.id;

  // 2. Prepare words
  const wordsToInsert = words.map(w => ({
    verse_id: verseId,
    ...w
  }));

  // 3. Batch insert words (first delete existing to avoid dupes on re-run)
  await supabase.from('greek_bible_words').delete().eq('verse_id', verseId);
  
  const { error: wordsError } = await supabase
    .from('greek_bible_words')
    .insert(wordsToInsert);

  if (wordsError) {
    console.error(`Error saving words for ${bookId} ${chapter}:${verse}:`, wordsError);
  }
}

async function main() {
  console.log('Starting Greek Bible migration...');
  
  for (const file of files) {
    await migrateBook(file);
  }
  
  console.log('Migration complete!');
}

main().catch(console.error);
