
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'public/data/saints_data.json');
const BASE_URL = 'https://www.santodeldia.net';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

interface Saint {
  date: string; // MM-DD
  name: string;
  type: string;
  bio: string;
  region: 'ES' | 'LATAM' | 'WORLD';
  is_primary: boolean;
}

const REGION_KEYWORDS: Record<string, string[]> = {
  'ES': ['España', 'Madrid', 'Toledo', 'Sevilla', 'Barcelona', 'Valencia', 'Ávila', 'Salamanca', 'Zaragoza', 'Santiago de Compostela', 'español', 'española'],
  'LATAM': [
    'América', 'Latinoamérica', 'Argentina', 'Buenos Aires', 'Córdoba', 'Perú', 'Lima', 'Cuzco',
    'México', 'Guadalupe', 'Chile', 'Santiago', 'Colombia', 'Bogotá', 'Venezuela', 'Caracas',
    'Ecuador', 'Quito', 'Bolivia', 'La Paz', 'Paraguay', 'Asunción', 'Uruguay', 'Montevideo',
    'Brasil', 'Rio de Janeiro', 'Sao Paulo', 'Cuba', 'La Habana', 'República Dominicana',
    'Santo Domingo', 'Puerto Rico', 'Costa Rica', 'Panamá', 'El Salvador', 'Guatemala', 'Honduras', 'Nicaragua',
    'peruano', 'peruana', 'argentino', 'argentina', 'mexicano', 'mexicana', 'chileno', 'chilena', 'colombiano', 'colombiana'
  ]
};

function detectRegion(text: string): 'ES' | 'LATAM' | 'WORLD' {
  const content = text.toLowerCase();
  for (const keyword of REGION_KEYWORDS['ES']) {
    if (content.includes(keyword.toLowerCase())) return 'ES';
  }
  for (const keyword of REGION_KEYWORDS['LATAM']) {
    if (content.includes(keyword.toLowerCase())) return 'LATAM';
  }
  return 'WORLD';
}

function getDaysInMonth(monthIndex: number, year: number = 2024): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

async function scrapeDay(monthIndex: number, day: number): Promise<Saint[]> {
  const monthName = MONTHS[monthIndex];
  const url = `${BASE_URL}/${day}/${monthName}/`;
  const dateStr = `${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  try {
    console.log(`Scraping ${url}...`);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    const saints: Saint[] = [];

    // 1. Primary Saint
    const mainName = $('.NomeSantoDiOggi').text().trim();
    const mainType = $('.TipologiaSantoDiOggi').text().trim();
    // Bio is next to Tipologia
    // Structure: <div class="TipologiaSantoDiOggi">...</div><div ...>BIO...</div>
    const bioDiv = $('.TipologiaSantoDiOggi').next('div');
    let mainBio = bioDiv.text().trim();
    // Clean up ">>> sigue" link text
    mainBio = mainBio.replace(/>>> sigue/g, '').trim();

    if (mainName) {
      saints.push({
        date: dateStr,
        name: mainName,
        type: mainType,
        bio: mainBio,
        region: detectRegion(mainBio + ' ' + mainName),
        is_primary: true
      });
    }

    // 2. Other Saints
    // Look for text "Otros santos y veneración de hoy"
    // The structure in home was a list. In day page, checking where it is.
    // Based on temp_home.html, it's under "Otros santos y veneración de hoy".
    // Let's look for elements containing that text.
    // In some pages it might be structured differently.
    // Let's try to find the container with "Otros santos y veneración de hoy"
    
    // Strategy: Find the text, then look at the next UL or list.
    // Or, look for the text "- San" or "- Beato" in the body if structured poorly.
    
    // In temp_day.html, we saw "Otros santos de hoy" link.
    // If the day page DOES NOT contain the list, we might be in trouble.
    // But earlier grep showed "Boleslava" in temp_day.html? 
    // Wait, grep showed it in temp_day.html. 
    // Let's trust that the content is there.
    
    // Let's search for the pattern "Otros santos y veneración de hoy:"
    const otherSaintsHeader = $("*:contains('Otros santos y veneración de hoy')").last();
    if (otherSaintsHeader.length > 0) {
       // The list usually follows.
       // It might be text separated by <br> or <li>
       // Let's try to grab the parent text or next element.
       const container = otherSaintsHeader.parent();
       const text = container.text();
       // Parse lines starting with "-"
       const lines = text.split('\n');
       for (const line of lines) {
         const trimmed = line.trim();
         if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            const cleanLine = trimmed.replace(/^[-•]\s*/, '').trim();
            // Parse Name and Type if possible. E.g. "San X Obispo"
            // Usually format: "San Name Type"
            if (cleanLine && !cleanLine.includes(mainName)) {
                saints.push({
                    date: dateStr,
                    name: cleanLine,
                    type: 'Unknown',
                    bio: '',
                    region: detectRegion(cleanLine),
                    is_primary: false
                });
            }
         }
       }
    }

    // Backup strategy: Look for lines starting with " - " in the whole body text if not found?
    // Too risky.

    return saints;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function main() {
  const allSaints: Saint[] = [];
  
  // We'll scrape all months.
  for (let m = 0; m < 12; m++) {
    const days = getDaysInMonth(m);
    for (let d = 1; d <= days; d++) {
       const daySaints = await scrapeDay(m, d);
       allSaints.push(...daySaints);
       // Delay to be polite
       await new Promise(r => setTimeout(r, 200)); 
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSaints, null, 2));
  console.log(`Saved ${allSaints.length} saints to ${OUTPUT_FILE}`);
}

main().catch(console.error);
