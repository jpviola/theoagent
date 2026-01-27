import fs from 'fs';
import path from 'path';

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  source: string;
  ingestedAt: string;
}

const VATICAN_NEWS_RSS_URL = 'https://www.vaticannews.va/es.rss.xml';

export async function ingestVaticanNews(): Promise<{ success: boolean; count: number; items: RSSItem[]; message?: string }> {
  try {
    console.log(`📡 Connecting to Vatican News RSS Feed: ${VATICAN_NEWS_RSS_URL}`);
    const response = await fetch(VATICAN_NEWS_RSS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const items = parseRSS(xmlText);

    if (items.length === 0) {
      return { success: true, count: 0, items: [], message: 'No items found in RSS feed.' };
    }

    // Save to disk (Simulating Data Lake storage)
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `vatican_news_${dateStr}.json`;
    const outputDir = path.join(process.cwd(), 'public', 'data', 'ingested');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, fileName);
    
    // Merge with existing if exists to avoid duplicates
    let existingItems: RSSItem[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      try {
        existingItems = JSON.parse(fileContent);
      } catch (e) {
        console.warn('Error reading existing ingested file, overwriting.');
      }
    }

    // Deduplicate based on GUID or Link
    const allItems = [...existingItems];
    let newCount = 0;
    
    items.forEach(item => {
      const exists = allItems.some(existing => existing.link === item.link);
      if (!exists) {
        allItems.push(item);
        newCount++;
      }
    });

    fs.writeFileSync(filePath, JSON.stringify(allItems, null, 2));

    console.log(`✅ Ingested ${newCount} new items from Vatican News. Total items: ${allItems.length}`);

    return { 
      success: true, 
      count: newCount, 
      items: items.slice(0, 5), // Return recent items for preview
      message: `Successfully synced. ${newCount} new items added to ${fileName}` 
    };

  } catch (error) {
    console.error('❌ RSS Ingestion Error:', error);
    return { 
      success: false, 
      count: 0, 
      items: [], 
      message: error instanceof Error ? error.message : 'Unknown error during ingestion' 
    };
  }
}

function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Basic regex parser for RSS 2.0
  // Note: Production-grade ingestion should use a proper XML parser like 'fast-xml-parser'
  // But this suffices for the simulation requirement without adding dependencies
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    
    const title = extractTag(itemContent, 'title');
    const link = extractTag(itemContent, 'link');
    const description = extractTag(itemContent, 'description');
    const pubDate = extractTag(itemContent, 'pubDate');
    const guid = extractTag(itemContent, 'guid');

    if (title && link) {
      items.push({
        title: cleanText(title),
        link,
        description: cleanText(description),
        pubDate,
        guid: guid || link,
        source: 'Vatican News',
        ingestedAt: new Date().toISOString()
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'is');
  const match = regex.exec(xml);
  // Handle CDATA
  if (match && match[1]) {
    const content = match[1];
    const cdataMatch = /<!\[CDATA\[([\s\S]*?)\]\]>/.exec(content);
    return cdataMatch ? cdataMatch[1] : content;
  }
  return '';
}

function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
