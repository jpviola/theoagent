
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const BIBLE_BOOKS = [
  { code: 'GEN', chapters: 50, name: 'Genesis' },
  { code: 'EXO', chapters: 40, name: 'Exodus' },
  { code: 'LEV', chapters: 27, name: 'Leviticus' },
  { code: 'NUM', chapters: 36, name: 'Numbers' },
  { code: 'DEU', chapters: 34, name: 'Deuteronomy' },
  { code: 'JOS', chapters: 24, name: 'Joshua' },
  { code: 'JDG', chapters: 21, name: 'Judges' },
  { code: 'RUT', chapters: 4, name: 'Ruth' },
  { code: '1SA', chapters: 31, name: '1 Samuel' },
  { code: '2SA', chapters: 24, name: '2 Samuel' },
  { code: '1KI', chapters: 22, name: '1 Kings' },
  { code: '2KI', chapters: 25, name: '2 Kings' },
  { code: '1CH', chapters: 29, name: '1 Chronicles' },
  { code: '2CH', chapters: 36, name: '2 Chronicles' },
  { code: 'EZR', chapters: 10, name: 'Ezra' },
  { code: 'NEH', chapters: 13, name: 'Nehemiah' },
  { code: 'EST', chapters: 10, name: 'Esther' },
  { code: 'JOB', chapters: 42, name: 'Job' },
  { code: 'PSA', chapters: 150, name: 'Psalms' },
  { code: 'PRO', chapters: 31, name: 'Proverbs' },
  { code: 'ECC', chapters: 12, name: 'Ecclesiastes' },
  { code: 'SNG', chapters: 8, name: 'Song of Solomon' },
  { code: 'ISA', chapters: 66, name: 'Isaiah' },
  { code: 'JER', chapters: 52, name: 'Jeremiah' },
  { code: 'LAM', chapters: 5, name: 'Lamentations' },
  { code: 'EZK', chapters: 48, name: 'Ezekiel' },
  { code: 'DAN', chapters: 12, name: 'Daniel' },
  { code: 'HOS', chapters: 14, name: 'Hosea' },
  { code: 'JOE', chapters: 3, name: 'Joel' },
  { code: 'AMO', chapters: 9, name: 'Amos' },
  { code: 'OBD', chapters: 1, name: 'Obadiah' },
  { code: 'JON', chapters: 4, name: 'Jonah' },
  { code: 'MIC', chapters: 7, name: 'Micah' },
  { code: 'NAM', chapters: 3, name: 'Nahum' },
  { code: 'HAB', chapters: 3, name: 'Habakkuk' },
  { code: 'ZEP', chapters: 3, name: 'Zephaniah' },
  { code: 'HAG', chapters: 2, name: 'Haggai' },
  { code: 'ZEC', chapters: 14, name: 'Zechariah' },
  { code: 'MAL', chapters: 4, name: 'Malachi' },
  { code: 'MAT', chapters: 28, name: 'Matthew' },
  { code: 'MRK', chapters: 16, name: 'Mark' },
  { code: 'LUK', chapters: 24, name: 'Luke' },
  { code: 'JHN', chapters: 21, name: 'John' },
  { code: 'ACT', chapters: 28, name: 'Acts' },
  { code: 'ROM', chapters: 16, name: 'Romans' },
  { code: '1CO', chapters: 16, name: '1 Corinthians' },
  { code: '2CO', chapters: 13, name: '2 Corinthians' },
  { code: 'GAL', chapters: 6, name: 'Galatians' },
  { code: 'EPH', chapters: 6, name: 'Ephesians' },
  { code: 'PHP', chapters: 4, name: 'Philippians' },
  { code: 'COL', chapters: 4, name: 'Colossians' },
  { code: '1TH', chapters: 5, name: '1 Thessalonians' },
  { code: '2TH', chapters: 3, name: '2 Thessalonians' },
  { code: '1TI', chapters: 6, name: '1 Timothy' },
  { code: '2TI', chapters: 4, name: '2 Timothy' },
  { code: 'TIT', chapters: 3, name: 'Titus' },
  { code: 'PHM', chapters: 1, name: 'Philemon' },
  { code: 'HEB', chapters: 13, name: 'Hebrews' },
  { code: 'JAS', chapters: 5, name: 'James' },
  { code: '1PE', chapters: 5, name: '1 Peter' },
  { code: '2PE', chapters: 3, name: '2 Peter' },
  { code: '1JN', chapters: 5, name: '1 John' },
  { code: '2JN', chapters: 1, name: '2 John' },
  { code: '3JN', chapters: 1, name: '3 John' },
  { code: 'JUD', chapters: 1, name: 'Jude' },
  { code: 'REV', chapters: 22, name: 'Revelation' }
];

// Configuration
const VERSION_ID = '173';
const VERSION_CODE = 'TGV';
const BASE_URL = 'https://www.bible.com/bible';
const AUDIO_BASE_URL = 'https://www.bible.com/audio-bible';
const DATASET_DIR = path.join(process.cwd(), 'datasets', 'tgv');

// Ensure directory exists
if (!fs.existsSync(DATASET_DIR)) {
  fs.mkdirSync(DATASET_DIR, { recursive: true });
}

// Utility to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeChapter(bookCode: string, chapter: number) {
  const url = `${BASE_URL}/${VERSION_ID}/${bookCode}.${chapter}.${VERSION_CODE}`;
  const audioUrl = `${AUDIO_BASE_URL}/${VERSION_ID}/${bookCode}.${chapter}.${VERSION_CODE}`;
  const outputPath = path.join(DATASET_DIR, `${bookCode}_${chapter}.json`);

  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Skipping ${bookCode} ${chapter} (already exists)`);
    return;
  }

  console.log(`Processing ${bookCode} ${chapter}...`);
  const output: any = {
    book: bookCode,
    chapter: chapter,
    version: VERSION_CODE,
    url: url,
    text: '',
    audio_sources: [],
    scraped_at: new Date().toISOString()
  };

  try {
    // 1. Fetch Text Page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Page not found for ${bookCode} ${chapter}. Stopping this book.`);
        return 'STOP_BOOK';
      }
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return 'RETRY'; // Could implement retry logic
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Text
    const mainContent = $('div.yv-bible-text, div[class*="ChapterContent_chapter"]');
    if (mainContent.length > 0) {
        // Simple extraction: get all text
        // Ideally we would parse verses, but for now raw text is fine as requested
        let text = mainContent.text().trim();
        text = text.replace(/\s+/g, ' '); // Normalize whitespace
        output.text = text;
    } else {
        // Fallback
        output.text = $('body').text().replace(/\s+/g, ' ').substring(0, 5000); // Limit fallback size
    }
    
    output.title = $('title').text();

    // 2. Fetch Audio Page (often contains the audio links in scripts)
    // Sometimes audio is on the main page too, let's check scripts there first
    let audioSources: string[] = [];
    
    const extractAudioFromHtml = (htmlContent: string) => {
        const sources: string[] = [];
        const $loc = cheerio.load(htmlContent);
        
        // Check <audio> tags
        $loc('audio').each((_, el) => {
            const src = $loc(el).attr('src');
            if (src) sources.push(src);
        });

        // Check scripts for .mp3 urls
        $loc('script').each((_, el) => {
            const content = $loc(el).html();
            if (content && content.includes('.mp3')) {
                const matches = content.match(/https?:\/\/[^"']+\.mp3(\?[^"']*)?/g);
                if (matches) {
                    sources.push(...matches);
                }
            }
        });
        return sources;
    };

    // Check main page for audio
    audioSources.push(...extractAudioFromHtml(html));

    // Fetch separate audio page if no audio found or to be thorough
    // The user specifically pointed to audio-bible url
    const audioResp = await fetch(audioUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (audioResp.ok) {
        const audioHtml = await audioResp.text();
        audioSources.push(...extractAudioFromHtml(audioHtml));
    }

    output.audio_sources = [...new Set(audioSources)]; // Deduplicate

    // Save
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`Saved ${bookCode} ${chapter}`);

    // Rate limiting
    await sleep(1000 + Math.random() * 1000); 

  } catch (error) {
    console.error(`Error processing ${bookCode} ${chapter}:`, error);
  }
}

async function main() {
  console.log(`Starting Bible Scraper for ${VERSION_CODE} (${VERSION_ID})...`);
  
  for (const book of BIBLE_BOOKS) {
    console.log(`\n--- Processing Book: ${book.name} (${book.code}) ---`);
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const result = await scrapeChapter(book.code, chapter);
      if (result === 'STOP_BOOK') break;
    }
  }
  
  console.log('Scraping complete!');
}

main().catch(console.error);
