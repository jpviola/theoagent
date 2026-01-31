import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import * as cheerio from 'cheerio';
import fs from 'fs';

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

const BASE_URL = 'https://www.laparola.net/greco/parola.php?p=';

async function scrapeDefinition(lemma: string) {
  try {
    const encodedLemma = encodeURIComponent(lemma);
    const url = `${BASE_URL}${encodedLemma}`;
    console.log(`Fetching ${lemma} from ${url}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${lemma}: ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Definitions
    // The structure based on search result snippet seems to have headers like "Thayer", "Strong", "LaParola"
    // We need to inspect the HTML structure. Since I can't see it, I'll guess based on common patterns.
    // Usually these sites use tables or specific classes.
    // If I can't find specific selectors, I'll look for text content near keywords.

    let definition_short = '';
    let definition_full = '';
    let strong_code = '';

    // Try to find Strong number
    // "Strong G5053"
    const strongText = $('body').text().match(/Strong\s*G(\d+)/);
    if (strongText) {
      strong_code = 'G' + strongText[1];
    }

    // Try to extract Thayer
    // Look for a section that contains "Thayer"
    // This is heuristic.
    // We can accumulate text from sections.
    
    const thayerSection = $('b:contains("Thayer")').parent().next(); 
    // This is a guess. 
    // Alternative: Get all text and try to parse sections.
    
    // Let's try to grab the whole main content if possible.
    // Usually content is in a main div.
    
    // For now, let's just save the raw text of likely definition areas or the whole body text simplified.
    // But saving whole HTML is too much.
    
    // Let's try to find the "Definitions" header if it exists.
    
    // Simplification: Save the URL as source and maybe just the Strong definition if found.
    // Or better: Let's assume the user will run this and might refine the selectors.
    // I will write a generic extractor that looks for "Thayer" and "Strong".
    
    // Extracting text content of the body, cleaning up.
    const bodyText = $('body').text();
    
    // Simple extraction of Strong's definition
    // Usually follows "Strong... : - "
    const strongDefMatch = bodyText.match(/Strong.*?G\d+.*?:(.*?)(?:Louw-Nida|$)/s);
    if (strongDefMatch) {
      definition_short = strongDefMatch[1].trim();
    }

    // Thayer
    const thayerMatch = bodyText.match(/Thayer(.*?)(?:Strong|Louw-Nida|$)/s);
    if (thayerMatch) {
      definition_full += "Thayer: " + thayerMatch[1].trim() + "\n\n";
    }

    // LaParola (Italian)
    const laparolaMatch = bodyText.match(/LaParola(.*?)(?:In the New Testament|$)/s);
    if (laparolaMatch) {
      definition_full += "LaParola (IT): " + laparolaMatch[1].trim() + "\n\n";
    }
    
    if (!definition_short && definition_full) {
      definition_short = definition_full.substring(0, 100) + '...';
    }

    return {
      lemma,
      definition_short: definition_short || 'No definition found',
      definition_full: definition_full || 'No details found',
      strong_code,
      source: 'laparola.net'
    };

  } catch (error) {
    console.error(`Error scraping ${lemma}:`, error);
    return null;
  }
}

async function main() {
  console.log('Starting definition scraper...');

  // 1. Get unique lemmas from words table
  // This requires the migration to be done first.
  const { data: words, error } = await supabase
    .from('greek_bible_words')
    .select('lemma')
    .not('lemma', 'is', null); // Filter nulls

  if (error) {
    if (error.code === 'PGRST205') {
      console.error('\n❌ ERROR CRÍTICO: Tablas no encontradas en Supabase.');
      console.error('👉 Por favor, ejecuta el script SQL en "src/sql/greek_bible_schema.sql" en el Editor SQL de Supabase antes de continuar.\n');
    } else {
      console.error('Error fetching lemmas:', error);
    }
    return;
  }

  if (!words || words.length === 0) {
    console.log('No words found in DB. Run migration first.');
    return;
  }

  // Deduplicate
  const uniqueLemmas = Array.from(new Set(words.map(w => w.lemma)));
  console.log(`Found ${uniqueLemmas.length} unique lemmas.`);

  // 2. Iterate and scrape
  // Process in chunks to avoid overwhelming the server
  const CHUNK_SIZE = 5;
  
  for (let i = 0; i < uniqueLemmas.length; i += CHUNK_SIZE) {
    const chunk = uniqueLemmas.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (lemma) => {
      // Check if already exists
      const { data: existing } = await supabase
        .from('greek_definitions')
        .select('id')
        .eq('lemma', lemma)
        .single();
        
      if (existing) {
        console.log(`Skipping ${lemma} (already exists)`);
        return;
      }

      const def = await scrapeDefinition(lemma);
      if (def) {
        const { error: insertError } = await supabase
          .from('greek_definitions')
          .upsert(def, { onConflict: 'lemma' });
          
        if (insertError) {
          console.error(`Error saving definition for ${lemma}:`, insertError);
        } else {
          console.log(`Saved definition for ${lemma}`);
        }
      }
      
      // Random delay to be nice
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
    }));
  }

  console.log('Scraping complete!');
}

main().catch(console.error);
