
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

// Helper for ESM directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://liturgiadelashoras.github.io';
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data', 'liturgy');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getMonthAbbr(monthIndex: number): string {
    return months[monthIndex];
}

function getDayPadded(day: number): string {
    return day.toString().padStart(2, '0');
}

async function scrapeLiturgy() {
  console.log('Starting Liturgy of the Hours scraping...');
  
  const scrapedData: any[] = [];
  
  // Scrape today and next 2 days
  // Use environment date as "today"
  const today = new Date('2026-01-30'); // Fixed date based on env context
  
  const daysToScrape = 3;

  for (let i = 0; i < daysToScrape; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const year = date.getFullYear();
      const monthIdx = date.getMonth();
      const day = date.getDate();
      
      const monthStr = getMonthAbbr(monthIdx);
      const dayStr = getDayPadded(day);
      
      // Constructed based on calendar.js reverse engineering:
      // sync/YYYY/MMM/DD
      // We try both with and without .htm extension as static sites vary
      const candidates = [
          `/sync/${year}/${monthStr}/${dayStr}.htm`,
          `/sync/${year}/${monthStr}/${dayStr}.html`,
          `/sync/${year}/${monthStr}/${dayStr}` // directory index?
      ];

      let found = false;
      for (const pathSuffix of candidates) {
          const url = BASE_URL + pathSuffix;
          console.log(`Trying URL: ${url}`);
          try {
              const html = await fetchPage(url);
              console.log(`Successfully fetched: ${url}`);
              
              const $ = cheerio.load(html);
              const title = $('title').text() || `${year}-${monthStr}-${dayStr}`;
              
              // Extract main content
              // Heuristic: usually in body, but let's try to be specific if possible
              // If it's a raw HTML page, body might be enough.
              // We remove scripts and styles
              $('script').remove();
              $('style').remove();
              
              const content = $('body').html() || '';

              // Now parse the links to the specific hours
              const hours: Record<string, string> = {};
              const hourLinks = $('a').toArray();
              
              for (const link of hourLinks) {
                  const href = $(link).attr('href');
                  const text = $(link).text().trim().toLowerCase();
                  
                  if (href && !href.startsWith('http') && !href.startsWith('#')) {
                      // Construct sub-page URL
                      // The base for relative links is url (which might not end in slash if it's a directory index without slash, but here we likely have .../30 or .../30.htm)
                      // Actually if url is .../30, relative link "laudes.htm" becomes .../laudes.htm which is wrong?
                      // No, if url is .../30, the browser treats it as file "30". So relative link replaces "30".
                      // BUT, if it is a directory index, it should be .../30/laudes.htm.
                      // Let's check the fetched URL.
                      // If we fetched ".../sync/2026/ene/30", and it worked, maybe it redirected or served content.
                      // The HTML content has relative links like "oficio.htm".
                      // If the browser is at .../30, "oficio.htm" would resolve to .../oficio.htm (replacing 30).
                      // However, typically structure is: day index -> links to files in same dir?
                      // Wait, if the URL is .../sync/2026/ene/30, and it has links to "laudes.htm", 
                      // if "30" is treated as a file, then "laudes.htm" is a sibling.
                      // BUT looking at the pattern `sync/YYYY/MMM/DD`, it seems DD is a directory?
                      // If DD is a directory, the URL should have a trailing slash for relative links to work as children.
                      // If I fetched `.../30` (no slash), and it returned content, `fetch` might have followed a redirect to `.../30/`?
                      // Or maybe `.../30` IS the file (e.g. extensionless HTML), and "laudes.htm" is a sibling?
                      // Let's assume they are siblings or children.
                      // Actually, let's just try to construct the URL as `.../sync/2026/ene/30/laudes.htm` FIRST.
                      // If that fails, try `.../sync/2026/ene/laudes.htm` (sibling).
                      
                      // Logic: The main page acts as the index.
                      // Let's try appending the href to the "directory" of the day.
                      // If the day URL was `.../30`, let's assume `.../30/` is the base.
                      
                      let subPageUrl = '';
                      if (url.endsWith('/')) {
                          subPageUrl = url + href;
                      } else {
                          // If url ends in "30", we probably want "30/href"
                          subPageUrl = url + '/' + href;
                      }

                      console.log(`  Fetching hour: ${text} -> ${subPageUrl}`);
                      try {
                          const subHtml = await fetchPage(subPageUrl);
                          const $sub = cheerio.load(subHtml);
                          // Extract content, remove scripts/styles/nav
                          $sub('script').remove();
                          $sub('style').remove();
                          // Maybe remove the "Volver" links
                          $sub('a:contains("Volver")').remove();
                          
                          const subContent = $sub('body').html() || '';
                          hours[text] = subContent;
                      } catch (e) {
                          console.log(`  Failed to fetch hour ${text}: ${(e as Error).message}`);
                          // Try sibling assumption: .../sync/2026/ene/laudes.htm (if 30 was a file)
                          // But wait, the date is in the path. If 30 is a file, where are the hours?
                          // It's most likely 30 is a directory.
                      }
                  }
              }
              
              scrapedData.push({
                  date: date.toISOString().split('T')[0], // YYYY-MM-DD
                  url,
                  title: title.trim(),
                  hours: hours, // Store the detailed hours
                  scrapedAt: new Date().toISOString()
              });
              
              found = true;
              break; // Stop trying candidates for this day if one works
          } catch (err) {
              console.log(`Failed candidate ${url}: ${(err as Error).message}`);
          }
      }
      
      if (!found) {
          console.warn(`Could not find liturgy page for ${date.toISOString().split('T')[0]}`);
      }
      
      // Be nice to the server
      await new Promise(r => setTimeout(r, 500));
  }

  // Save index
  const outputPath = path.join(OUTPUT_DIR, 'liturgy_index.json');
  fs.writeFileSync(
      outputPath,
      JSON.stringify(scrapedData, null, 2)
  );
  
  console.log(`Saved ${scrapedData.length} pages to ${outputPath}`);
}

scrapeLiturgy();
