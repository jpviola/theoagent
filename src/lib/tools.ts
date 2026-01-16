import { jsonSchema } from 'ai';

// Tool 1: Bible Passage
async function* getBiblePassage({ reference }: { reference: string }) {
  yield `Fetching Bible passage: ${reference} (Douay-Rheims Challoner)...`;

  const apiKey = process.env.BIBLE_API_KEY;
  if (!apiKey) throw new Error('Missing BIBLE_API_KEY');

  // Find passages (supports ranges)
  const searchUrl = `https://api.scripture.api.bible/v1/bibles/65eec8e0b60e656b-01/search?query=${encodeURIComponent(reference)}`;
  const searchRes = await fetch(searchUrl, { headers: { 'api-key': apiKey } });
  const searchData = await searchRes.json();

  if (!searchData.data.passages?.length) {
    yield `No passage found for "${reference}".`;
    return `No results found.`;
  }

  const passageId = searchData.data.passages[0].id;

  // Get full content
  const contentUrl = `https://api.scripture.api.bible/v1/bibles/65eec8e0b60e656b-01/passages/${passageId}?content-type=text&include-verse-numbers=true&include-chapter-numbers=false`;
  const contentRes = await fetch(contentUrl, { headers: { 'api-key': apiKey } });
  const contentData = await contentRes.json();

  const text = contentData.data.content;
  const ref = contentData.data.reference;

  return `**${ref} (Douay-Rheims Challoner Revision)**\n\n${text}\n\nSource: https://api.bible`;
}

// Tool 2: Catechism Search
async function* searchCatechism({ query, limit = 5 }: { query: string; limit?: number }) {
  yield `Searching Catechism for: "${query}"...`;

  const fs = await import('fs/promises');
  const path = await import('path');
  const filePath = path.join(process.cwd(), 'public', 'data', 'catechism.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const ccc: Array<{ paragraph: number; text: string }> = JSON.parse(fileContent);

  // Simple: if query is number/range, exact; else text search
  let results: Array<{ paragraph: number; text: string }> = [];
  
  if (/^\d+$/.test(query)) {
    const para = parseInt(query);
    const item = ccc.find(c => c.paragraph === para);
    if (item) results = [item];
  } else if (/^\d+-\d+$/.test(query)) {
    const [start, end] = query.split('-').map(Number);
    results = ccc.filter(c => c.paragraph >= start && c.paragraph <= end);
  } else {
    // Text search (case-insensitive)
    const lower = query.toLowerCase();
    results = ccc
      .filter(c => c.text.toLowerCase().includes(lower))
      .slice(0, limit * 3); // broader then rank
  }

  if (results.length === 0) {
    return `No Catechism paragraphs found for "${query}".`;
  }

  // Format top results
  let output = '**Relevant Catechism Paragraphs:**\n\n';
  
  for (const item of results.slice(0, limit)) {
    output += `**¶ ${item.paragraph}**\n${item.text.trim()}\n\n`;
  }
  output += `Source: Catechism of the Catholic Church (Vatican official text)`;

  return output;
}

// Export tools for Vercel AI
export const tools = {
  get_bible_passage: {
    description: 'Retrieve exact Bible passage text from the Douay-Rheims Challoner Catholic edition. Always cite this for Scripture references.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        reference: {
          type: 'string',
          description: 'Bible reference, e.g. "John 3:16" or "Genesis 1:1-10" or "Psalm 23"',
        },
      },
      required: ['reference'],
    }),
    execute: getBiblePassage,
  },
  search_catechism: {
    description: 'Search or retrieve specific paragraphs from the Catechism of the Catholic Church. Use for doctrine, moral teaching, etc.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term or paragraph range, e.g. "salvation" or "121-125"',
        },
        limit: {
          type: 'number',
          description: 'Max paragraphs to return',
          default: 5,
        },
      },
      required: ['query'],
    }),
    execute: searchCatechism,
  },
  // NOTE: get_vatican_news tool temporarily disabled due to reliability issues
  // Users asking about Pope Leo XIV will get direct responses from the system prompt
  // Vatican news queries will be directed to vaticannews.va
  /*
  get_vatican_news: {
    description: 'Get current information about the Pope and Vatican news. Use this when users ask about the current pope, latest Vatican news, or recent papal activities.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Optional search query for specific Vatican news topics',
          default: 'pope',
        },
      },
      required: [],
    }),
    execute: getVaticanNews,
  },
  */
};
