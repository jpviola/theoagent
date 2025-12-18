# TheoAgent Training & Fine-Tuning Guide

Since Claude models don't support traditional fine-tuning, here are the best approaches to customize TheoAgent with your own data:

---

## Method 1: System Prompt Engineering ⭐ (EASIEST)

**Location:** `src/app/api/chat/route.ts`

### What You Can Customize:
- **Personality & Tone:** Formal, conversational, scholarly, pastoral
- **Expertise Areas:** Emphasize specific topics (e.g., moral theology, liturgy, Church history)
- **Response Format:** How answers are structured and formatted
- **Citation Style:** How sources are referenced
- **Special Instructions:** Specific behaviors or restrictions

### Example Modifications:

```typescript
system: `You are TheoAgent, specializing in [YOUR FOCUS AREA].

Your expertise includes:
- [Topic 1]
- [Topic 2]
- [Topic 3]

When answering:
1. [Your instruction]
2. [Your instruction]
3. [Your instruction]

Special knowledge:
[Add any specific facts, teachings, or context you want the AI to prioritize]`
```

### Tips:
- Be specific and detailed in instructions
- Use examples of desired responses
- Test iteratively and refine
- Keep system prompts under ~1500 words for best performance

---

## Method 2: Context Injection (RAG - Retrieval Augmented Generation) ⭐⭐

Add your custom data to each conversation by injecting relevant context before Claude responds.

### Step 1: Prepare Your Data

Create structured data files in `public/data/`:

```json
// Example: public/data/saints.json
[
  {
    "name": "Saint Augustine",
    "feast_day": "August 28",
    "biography": "...",
    "quotes": ["..."],
    "patronage": ["..."]
  }
]

// Example: public/data/prayers.json
[
  {
    "name": "Hail Mary",
    "text": "Hail Mary, full of grace...",
    "category": "Marian"
  }
]

// Example: public/data/church_documents.json
[
  {
    "title": "Lumen Gentium",
    "type": "Vatican II Document",
    "year": 1964,
    "excerpts": [...]
  }
]
```

### Step 2: Create a Search/Retrieval Function

Create `src/lib/dataRetrieval.ts`:

```typescript
import catechism from '@/../../public/data/catechism.json';
// Import other data sources

export function searchCatechism(query: string, limit: number = 3) {
  const lowerQuery = query.toLowerCase();
  return catechism
    .filter(item => 
      item.text.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}

export function searchAllSources(query: string) {
  return {
    catechism: searchCatechism(query, 2),
    // Add other sources
  };
}
```

### Step 3: Inject Context in API Route

Modify `src/app/api/chat/route.ts`:

```typescript
import { searchAllSources } from '@/lib/dataRetrieval';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Get the user's latest question
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  
  // Search your data
  const relevantData = searchAllSources(lastUserMessage);
  
  // Build context to inject
  let contextualInfo = '';
  if (relevantData.catechism.length > 0) {
    contextualInfo += '\n\nRelevant Catechism Paragraphs:\n';
    relevantData.catechism.forEach(item => {
      contextualInfo += `[${item.paragraph}] ${item.text}\n`;
    });
  }
  
  // Inject context as a system message or append to user message
  const enhancedMessages = [
    ...messages.slice(0, -1),
    {
      role: 'user',
      content: lastUserMessage + contextualInfo
    }
  ];
  
  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    messages: enhancedMessages,
    system: `...your system prompt...
    
When provided with reference material, cite it in your response.`,
  });
  
  // ... rest of code
}
```

---

## Method 3: Vector Database (Advanced RAG) ⭐⭐⭐

For larger datasets, use semantic search with embeddings.

### Step 1: Install Dependencies

```bash
npm install @pinecone-database/pinecone openai
# OR
npm install @upstash/vector
```

### Step 2: Generate Embeddings

```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}
```

### Step 3: Index Your Data

Create a script to process your data:

```typescript
// scripts/indexData.ts
import catechism from '../public/data/catechism.json';

async function indexAllData() {
  for (const item of catechism) {
    const embedding = await createEmbedding(item.text);
    // Store in vector database
    await vectorDB.upsert({
      id: `catechism-${item.paragraph}`,
      values: embedding,
      metadata: item
    });
  }
}
```

### Step 4: Semantic Search

```typescript
async function semanticSearch(query: string, topK: number = 5) {
  const queryEmbedding = await createEmbedding(query);
  const results = await vectorDB.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true
  });
  return results.matches;
}
```

---

## Method 4: Few-Shot Examples in System Prompt

Add example Q&A pairs to guide responses:

```typescript
system: `You are TheoAgent...

Here are examples of ideal responses:

Q: What is the Trinity?
A: The Trinity is the central mystery of Christian faith. It refers to the belief that God is **one divine essence in three distinct Persons**: the Father, the Son (Jesus Christ), and the Holy Spirit.

> "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit" (Matthew 28:19)

According to the **Catechism of the Catholic Church** (paragraphs 232-267), the Trinity reveals that...

Q: [Another example]
A: [Another ideal response]

Follow this style and depth in your responses.`
```

---

## Method 5: Pre-Processing and Caching

Cache frequently accessed information to improve response time:

```typescript
// src/lib/knowledgeCache.ts
const commonTopics = {
  trinity: "Detailed explanation of the Trinity...",
  eucharist: "Detailed explanation of the Eucharist...",
  // Add more
};

export function getCommonTopic(query: string) {
  const lowerQuery = query.toLowerCase();
  for (const [key, value] of Object.entries(commonTopics)) {
    if (lowerQuery.includes(key)) {
      return value;
    }
  }
  return null;
}
```

---

## Adding Your Own Data

### 1. Prepare Your Content

Organize in structured formats:
- **JSON** for structured data (catechism, saints, prayers)
- **Markdown** for longer documents (Church documents, homilies)
- **CSV** for tabular data (feast days, liturgical calendar)

### 2. Convert to JSON

```javascript
// Example script: scripts/convertData.js
const fs = require('fs');

// Read your source file
const rawData = fs.readFileSync('mydata.txt', 'utf-8');

// Parse and structure
const structured = rawData.split('\n\n').map((section, idx) => ({
  id: idx,
  content: section,
  // Add metadata
}));

// Save as JSON
fs.writeFileSync(
  'public/data/mydata.json',
  JSON.stringify(structured, null, 2)
);
```

### 3. Quality Guidelines

- **Clean text:** Remove formatting artifacts
- **Chunk appropriately:** 100-500 words per item
- **Add metadata:** Source, date, author, topic
- **Verify accuracy:** Double-check doctrinal content
- **Cite sources:** Include original references

---

## Recommended Data Sources to Add

### Catholic Resources:
1. **Bible translations** (Douay-Rheims, NAB, RSV-CE)
2. **Catechism of the Catholic Church** (full text) ✅ You have this!
3. **Compendium of the Catechism**
4. **Papal encyclicals** (Rerum Novarum, Laudato Si, etc.)
5. **Vatican II documents**
6. **Code of Canon Law**
7. **Roman Missal prayers**
8. **Lives of the Saints** (Butler's Lives)
9. **Church Fathers writings** (Augustine, Aquinas, etc.)
10. **Liturgical calendar**

### Where to Get Data:
- **Vatican.va** - Official Church documents
- **USCCB.org** - U.S. Catholic Bishops resources
- **NewAdvent.org** - Catholic Encyclopedia, Church Fathers
- **Catholic Answers** - Apologetics content
- **EWTN.com** - Various Catholic resources

---

## Testing Your Customizations

1. **Start simple:** Modify system prompt first
2. **Test edge cases:** Controversial topics, complex questions
3. **Verify accuracy:** Check responses against authoritative sources
4. **Iterate:** Refine based on results
5. **Document changes:** Keep track of what works

---

## Limitations & Considerations

### What Claude CANNOT Do:
- ❌ True fine-tuning/retraining on custom data
- ❌ Memorize specific facts permanently
- ❌ Update its base knowledge cutoff (April 2024)
- ❌ Learn from conversations over time

### What You CAN Do:
- ✅ Shape behavior through prompting
- ✅ Provide context for each conversation
- ✅ Guide tone and style comprehensively
- ✅ Add unlimited custom data via RAG
- ✅ Create domain-specific expertise

---

## Next Steps

1. **Start with system prompt:** Modify `src/app/api/chat/route.ts`
2. **Add data files:** Create JSON files in `public/data/`
3. **Implement basic RAG:** Use context injection
4. **Test and refine:** Iterate on prompts and data
5. **Scale up:** Add vector search if needed

Need help with any specific implementation? Let me know!
