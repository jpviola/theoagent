
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'public/data/regional_church_data_full.json');

interface RegionalSource {
  url: string;
  region: 'LATAM' | 'AR' | 'PE' | 'ES' | 'BR';
  type: 'official' | 'informational';
  title_hint?: string;
}

const SOURCES: RegionalSource[] = [
  // LATAM / CELAM / CAL
  { url: 'https://www.americalatina.va/content/americalatina/es/quienes-somos.html', region: 'LATAM', type: 'official', title_hint: 'Pontificia Comisión para América Latina - Quiénes Somos' },
  { url: 'https://es.wikipedia.org/wiki/Pontificia_Comisi%C3%B3n_para_Am%C3%A9rica_Latina', region: 'LATAM', type: 'informational', title_hint: 'Wikipedia - Pontificia Comisión para América Latina' },
  { url: 'https://www.vatican.va/content/romancuria/es/pontificie-commissioni/pontificia-america-latina/profilo.html', region: 'LATAM', type: 'official', title_hint: 'Vaticano - Perfil CAL' },
  { url: 'https://celam.org/', region: 'LATAM', type: 'official', title_hint: 'CELAM Home' },
  { url: 'https://es.wikipedia.org/wiki/Consejo_Episcopal_Latinoamericano', region: 'LATAM', type: 'informational', title_hint: 'Wikipedia - CELAM' },
  
  // Argentina
  { url: 'https://episcopado.org/', region: 'AR', type: 'official', title_hint: 'Conferencia Episcopal Argentina' },
  
  // Brazil
  { url: 'https://www.cnbb.org.br/', region: 'BR', type: 'official', title_hint: 'CNBB Brasil' },
  
  // Peru
  { url: 'https://www.iglesiacatolica.org.pe/', region: 'PE', type: 'official', title_hint: 'Conferencia Episcopal Peruana' },
  { url: 'https://noticias.iglesia.org.pe/', region: 'PE', type: 'informational', title_hint: 'Noticias Iglesia Perú' },
  
  // Spain
  { url: 'https://www.conferenciaepiscopal.es/', region: 'ES', type: 'official', title_hint: 'Conferencia Episcopal Española' },
  { url: 'https://jornadasconferenciaepiscopal.es/', region: 'ES', type: 'official', title_hint: 'Jornadas CEE' }
];

interface ScrapedData {
  url: string;
  title: string;
  content: string;
  region: string;
  source_type: string;
  scraped_at: string;
}

async function scrapeUrl(source: RegionalSource): Promise<ScrapedData | null> {
  try {
    console.log(`Scraping ${source.url}...`);
    const { data } = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      timeout: 30000 // 30s timeout
    });

    const $ = cheerio.load(data);
    
    // Remove scripts, styles, navs, footers to clean up
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    $('header').remove();
    $('.menu').remove();
    $('.sidebar').remove();
    $('.cookie-notice').remove();
    
    let title = $('title').text().trim() || source.title_hint || 'No Title';
    
    // Extract main content
    // Priority: main > article > #content > .content > body
    let content = '';
    const selectors = ['main', 'article', '#content', '.content', '.entry-content', 'body'];
    
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        content = $(selector).text();
        break;
      }
    }
    
    if (!content) content = $('body').text();
    
    // Clean whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    // Limit length if too huge (e.g. 50k chars)
    if (content.length > 50000) {
        content = content.substring(0, 50000) + '... (truncated)';
    }

    return {
      url: source.url,
      title,
      content,
      region: source.region,
      source_type: source.type,
      scraped_at: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Error scraping ${source.url}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function main() {
  let results: ScrapedData[] = [];
  
  // Load existing data if available
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      results = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      console.log(`Loaded ${results.length} existing documents.`);
    } catch (e) {
      console.warn('Could not parse existing file, starting fresh.');
    }
  }

  for (const source of SOURCES) {
    // Check if already scraped (and content is valid/not empty)
    const existingIndex = results.findIndex(r => r.url === source.url);
    if (existingIndex >= 0 && results[existingIndex].content.length > 100) {
      console.log(`Skipping ${source.url} (already scraped)`);
      continue;
    }

    const data = await scrapeUrl(source);
    if (data) {
      if (existingIndex >= 0) {
        results[existingIndex] = data; // Update
      } else {
        results.push(data); // Append
      }
      // Save incrementally
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    }
    // Polite delay
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`Final count: ${results.length} documents in ${OUTPUT_FILE}`);
}

main().catch(console.error);
