import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { OpenAIEmbeddings } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type SupportedChatModel = 'anthropic' | 'openai' | 'llama';

// Types
interface CatholicDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'catechism' | 'papal' | 'scripture' | 'custom';
}

interface ChatContext {
  userId: string;
  mode: 'standard' | 'advanced';
  language: 'en' | 'es';
  model?: SupportedChatModel;
  studyTrack?: string;
}

interface RetrievalResult {
  documents: Document[];
  sources: string[];
  relevanceScores: number[];
}

interface ConversationSummary {
  summary: string;
  keyTopics: string[];
  lastUpdated: Date;
}

// Enhanced vector store with proper embeddings
class EnhancedVectorStore {
  private vectorStore: HNSWLib | null = null;
  private embeddings: OpenAIEmbeddings | null = null;
  private documents: Document[] = [];
  private useEmbeddings: boolean = false;
  
  constructor() {
    // Only initialize embeddings if OpenAI API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        this.embeddings = new OpenAIEmbeddings({
          modelName: "text-embedding-3-small",
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        this.useEmbeddings = true;
        console.log('🔑 OpenAI embeddings initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize OpenAI embeddings, falling back to keyword search:', error);
        this.useEmbeddings = false;
      }
    } else {
      console.log('⚠️ No OpenAI API key found, using enhanced keyword search');
      this.useEmbeddings = false;
    }
  }
  
  async initialize(documents: Document[]): Promise<void> {
    this.documents = documents;
    
    // Safety check: Disable embeddings for large datasets to prevent timeouts and high costs
    // 3000 documents is a reasonable limit for in-memory vector store generation during dev
    if (documents.length > 3000) {
      console.log(`⚠️ Large dataset detected (${documents.length} docs). Disabling embeddings to prevent timeout/cost issues.`);
      this.useEmbeddings = false;
    }
    
    if (this.useEmbeddings && this.embeddings) {
      try {
        console.log('🔍 Creating embeddings for documents...');
        this.vectorStore = await HNSWLib.fromDocuments(documents, this.embeddings);
        console.log('✅ Vector store initialized with embeddings');
        return;
      } catch (error) {
        console.warn('⚠️ Failed to create embeddings, falling back to keyword search:', error);
        this.useEmbeddings = false;
      }
    }
    
    console.log('📝 Using enhanced keyword-based search');
  }
  
  async similaritySearchWithScore(query: string, topK: number = 5): Promise<[Document, number][]> {
    if (this.useEmbeddings && this.vectorStore) {
      return await this.vectorStore.similaritySearchWithScore(query, topK);
    }
    
    // Fallback to enhanced keyword search
    return this.keywordSearchWithScore(query, topK);
  }
  
  async similaritySearch(query: string, topK: number = 5): Promise<Document[]> {
    const results = await this.similaritySearchWithScore(query, topK);
    return results.map(([doc]) => doc);
  }
  
  // Enhanced keyword-based search as fallback
  private keywordSearchWithScore(query: string, topK: number = 5): [Document, number][] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    // Pre-compile regexes for performance
    const regexes = queryWords.map(word => new RegExp(escapeRegExp(word), 'gi'));
    
    const scoredDocs = this.documents.map(doc => {
      const content = doc.pageContent; // Avoid toLowerCase() copy
      const title = doc.metadata.title || '';
      
      // Calculate score based on multiple factors
      let score = 0;
      
      regexes.forEach((regex, index) => {
        const word = queryWords[index];
        
        // Title matches are weighted higher
        const titleMatches = (title.match(regex) || []).length;
        score += titleMatches * 3;
        
        // Content matches
        const contentMatches = (content.match(regex) || []).length;
        score += contentMatches;
        
        // Bonus if found at least once (replaces exact phrase check which was redundant/expensive)
        if (contentMatches > 0) {
          score += 0.5;
        }
        
        // Category-specific boosts
        if (doc.metadata.category === 'catechism' && word.includes('catechism')) {
          score += 2;
        }
        if (doc.metadata.category === 'scripture' && (word.includes('bible') || word.includes('scripture'))) {
          score += 2;
        }
      });
      
      // Length normalization (prefer more relevant shorter passages)
      const lengthPenalty = Math.log(content.length / 1000 + 1) * 0.1;
      score = Math.max(0, score - lengthPenalty);
      
      return [doc, score] as [Document, number];
    });
    
    // Sort by score and return top K
    return scoredDocs
      .sort(([, a], [, b]) => b - a)
      .slice(0, topK);
  }
  
  // Advanced query expansion using synonyms and related terms
  private expandQuery(query: string): string[] {
    const expansions: string[] = [query];
    
    // Catholic-specific term expansions
    const expansionMap: Record<string, string[]> = {
      'prayer': ['pray', 'praying', 'prayers', 'devotion', 'meditation'],
      'mass': ['eucharist', 'liturgy', 'communion', 'holy sacrifice'],
      'church': ['ecclesia', 'catholic church', 'magisterium', 'teaching'],
      'pope': ['papal', 'pontiff', 'holy father', 'vatican'],
      'mary': ['virgin mary', 'blessed mother', 'our lady', 'mother of god'],
      'jesus': ['christ', 'lord', 'savior', 'son of god'],
      'bible': ['scripture', 'word of god', 'sacred text', 'gospel'],
      'saint': ['saints', 'holy', 'blessed', 'canonized'],
      'sin': ['sins', 'sinful', 'transgression', 'offense'],
      'salvation': ['redemption', 'saved', 'eternal life', 'grace']
    };
    
    const queryLower = query.toLowerCase();
    Object.entries(expansionMap).forEach(([key, synonyms]) => {
      if (queryLower.includes(key)) {
        expansions.push(...synonyms);
      }
    });
    
    return expansions;
  }
  
  async enhancedSearch(query: string, topK: number = 5): Promise<RetrievalResult> {
    const expandedQueries = this.expandQuery(query);
    const allResults: [Document, number][] = [];
    
    // Search with expanded queries
    for (const expandedQuery of expandedQueries) {
      const results = await this.similaritySearchWithScore(expandedQuery, Math.ceil(topK / 2));
      allResults.push(...results);
    }
    
    // Remove duplicates and sort by score
    const uniqueResults = new Map<string, [Document, number]>();
    allResults.forEach(([doc, score]) => {
      const key = doc.pageContent.substring(0, 100); // Use first 100 chars as key
      if (!uniqueResults.has(key) || uniqueResults.get(key)![1] < score) {
        uniqueResults.set(key, [doc, score]);
      }
    });
    
    const sortedResults = Array.from(uniqueResults.values())
      .sort(([, a], [, b]) => b - a)
      .slice(0, topK);
    
    return {
      documents: sortedResults.map(([doc]) => doc),
      sources: sortedResults.map(([doc]) => doc.metadata.source || 'Unknown'),
      relevanceScores: sortedResults.map(([, score]) => score)
    };
  }
}

// In-memory conversation storage (in production, use Redis or database)
const conversationStore = new Map<string, ChatMessageHistory>();
const conversationSummaries = new Map<string, ConversationSummary>();
const modelUsageStore = new Map<
  string,
  {
    requestedModel?: SupportedChatModel;
    actualModel: SupportedChatModel | 'default';
    fallbackUsed: boolean;
  }
>();

// Conversation summarization utility
class ConversationManager {
  private summarizationPrompt = PromptTemplate.fromTemplate(`
Summarize the following Catholic theological conversation, focusing on:
1. Main theological topics discussed
2. Key doctrinal questions asked
3. Important teachings referenced
4. User's apparent interests/concerns

Conversation:
{conversation}

Provide a concise summary (2-3 sentences) and list 3-5 key topics:

Summary: [Your summary here]
Key Topics: [topic1, topic2, topic3, etc.]
`);

  constructor(private llm: BaseChatModel) {}

  async summarizeConversation(messages: BaseMessage[]): Promise<ConversationSummary> {
    if (messages.length < 6) {
      return {
        summary: 'New conversation',
        keyTopics: [],
        lastUpdated: new Date()
      };
    }

    const conversationText = messages
      .slice(-20) // Last 20 messages
      .map(msg => `${msg._getType() === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const chain = RunnableSequence.from([
      this.summarizationPrompt,
      this.llm,
      new StringOutputParser()
    ]);

    const result = await chain.invoke({ conversation: conversationText });
    
    // Parse the result to extract summary and topics
    const summaryMatch = result.match(/Summary: (.+?)(?=\nKey Topics:|$)/);
    const topicsMatch = result.match(/Key Topics: \[(.+?)\]/);
    
    const summary = summaryMatch?.[1]?.trim() || 'Conversation summary unavailable';
    const topicsStr = topicsMatch?.[1] || '';
    const keyTopics = topicsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);

    return {
      summary,
      keyTopics,
      lastUpdated: new Date()
    };
  }
}

export class SantaPalabraRAG {
  private vectorStore: EnhancedVectorStore | null = null;
  private documents: Document[] = [];
  private llm: BaseChatModel | null;
  private conversationManager: ConversationManager | null;
  private isInitialized = false;
  private isMock = false;

  constructor() {
    // Initialize LLM with Vercel AI Gateway support
    this.llm = this.initializeLLM();
    this.conversationManager = this.llm ? new ConversationManager(this.llm) : null;
  }

  private getGatewayApiKey(): string | undefined {
    return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  }

  private createOpenAILLM(): BaseChatModel {
    if (this.isMock) return null as any;
    const gatewayApiKey = this.getGatewayApiKey();

    // Prefer direct OpenAI locally (simplest + most reliable)
    if (process.env.OPENAI_API_KEY && !process.env.VERCEL) {
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.3,
      });
    }

    // If gateway is configured, use it (works well on Vercel)
    if (gatewayApiKey) {
      return new ChatOpenAI({
        apiKey: gatewayApiKey,
        modelName: 'openai/gpt-4o-mini',
        temperature: 0.3,
        configuration: {
          baseURL: 'https://ai-gateway.vercel.sh/v1',
        },
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.3,
    });
  }

  private createAnthropicLLM(): BaseChatModel {
    const gatewayApiKey = this.getGatewayApiKey();

    // Use direct Anthropic locally when available
    if (process.env.ANTHROPIC_API_KEY && !process.env.VERCEL) {
      return new ChatAnthropic({
        model: 'claude-3-haiku-20240307',
        temperature: 0.3,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // If gateway is configured, use it
    if (gatewayApiKey) {
      return new ChatAnthropic({
        apiKey: gatewayApiKey,
        modelName: 'anthropic/claude-3-5-haiku-20241022',
        temperature: 0.3,
        clientOptions: {
          defaultHeaders: {
            Authorization: `Bearer ${gatewayApiKey}`,
          },
        },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    return new ChatAnthropic({
      model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private createLLMForModel(model?: SupportedChatModel): BaseChatModel | null {
    if (this.isMock) return null;
    if (!model) return this.llm;

    try {
      switch (model) {
        case 'openai':
          return this.createOpenAILLM();
        case 'anthropic':
          return this.createAnthropicLLM();
        case 'llama':
          return this.createLlamaOpenAICompatibleLLM();
        default: {
          const exhaustiveCheck: never = model;
          throw new Error(`Unsupported model: ${exhaustiveCheck}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to initialize requested model ${model}:`, error);
      
      // Fallback Strategy:
      // 1. Try Groq/Llama (Fastest/Cheapest fallback)
      if (process.env.GROQ_API_KEY) {
        console.log(`🔄 Fallback: Switching to Groq/Llama from ${model}`);
        try { return this.createLlamaOpenAICompatibleLLM(); } catch (e) { console.warn('Groq fallback failed', e); }
      }

      // 2. Try OpenAI (Reliable standard)
      if (process.env.OPENAI_API_KEY && model !== 'openai') {
        console.log(`🔄 Fallback: Switching to OpenAI from ${model}`);
        try { return this.createOpenAILLM(); } catch (e) { console.warn('OpenAI fallback failed', e); }
      }

      // 3. Try Anthropic
      if (process.env.ANTHROPIC_API_KEY && model !== 'anthropic') {
        console.log(`🔄 Fallback: Switching to Anthropic from ${model}`);
        try { return this.createAnthropicLLM(); } catch (e) { console.warn('Anthropic fallback failed', e); }
      }

      // If all fail, rethrow (which will trigger Mock Mode in generateResponse)
      throw error;
    }
  }

  private createLlamaOpenAICompatibleLLM(): BaseChatModel {
    const baseURL =
      process.env.VLLM_BASE_URL ||
      process.env.LLAMA_OPENAI_COMPAT_BASE_URL ||
      (process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : undefined) ||
      (process.env.TOGETHER_API_KEY ? 'https://api.together.xyz/v1' : undefined);

    const apiKey =
      process.env.VLLM_API_KEY ||
      process.env.LLAMA_OPENAI_COMPAT_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.TOGETHER_API_KEY ||
      'dummy-key';

    const model =
      process.env.VLLM_MODEL ||
      process.env.LLAMA_OPENAI_COMPAT_MODEL ||
      process.env.GROQ_MODEL ||
      process.env.TOGETHER_MODEL;

    if (!baseURL) {
      throw new Error(
        'Missing VLLM_BASE_URL or LLAMA_OPENAI_COMPAT_BASE_URL (or set GROQ_API_KEY / TOGETHER_API_KEY).'
      );
    }

    if (!model) {
      throw new Error(
        'Missing VLLM_MODEL or LLAMA_OPENAI_COMPAT_MODEL (or GROQ_MODEL / TOGETHER_MODEL).'
      );
    }

    return new ChatOpenAI({
      apiKey,
      modelName: model,
      temperature: 0.3,
      configuration: {
        baseURL,
      },
    });
  }

  /**
   * Initialize LLM with Vercel AI Gateway support
   * Falls back to direct API calls if gateway is not available
   */
  private initializeLLM(): BaseChatModel | null {
    // For local development, use OpenAI directly (bypassing Vercel AI Gateway)
    if (process.env.OPENAI_API_KEY && !process.env.VERCEL) {
      console.log('🔥 Using OpenAI directly (local development)');
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.3,
      });
    }
    
    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    
    // Try Vercel AI Gateway first (for production)
    if (gatewayApiKey) {
      console.log('🔥 Using Vercel AI Gateway');
      
      // Try OpenAI through gateway first (often more reliable for deployment)
      if (process.env.OPENAI_API_KEY) {
        try {
          return new ChatOpenAI({
            apiKey: gatewayApiKey,
            modelName: 'openai/gpt-4o-mini',
            temperature: 0.3,
            configuration: {
              baseURL: 'https://ai-gateway.vercel.sh/v1',
            },
          });
        } catch (error) {
          console.warn('⚠️ Failed to initialize OpenAI through AI Gateway:', error);
        }
      }
      
      // Try Anthropic through gateway
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          return new ChatAnthropic({
            apiKey: gatewayApiKey,
            modelName: 'anthropic/claude-3-5-haiku-20241022',
            temperature: 0.3,
            clientOptions: {
              defaultHeaders: {
                'Authorization': `Bearer ${gatewayApiKey}`,
              },
            },
          });
        } catch (error) {
          console.warn('⚠️ Failed to initialize Anthropic through AI Gateway:', error);
        }
      }
    }
    
    // Fallback to direct API calls
    console.log('🔄 Falling back to direct API calls');
    
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('🤖 Using Anthropic Claude directly');
      return new ChatAnthropic({
        model: "claude-3-haiku-20240307",
        temperature: 0.3,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Using OpenAI directly');
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.3,
      });
    }

    // Check for Groq / VLLM / OpenRouter
    if (process.env.GROQ_API_KEY || process.env.VLLM_API_KEY) {
      console.log('⚡ Using Groq / OpenRouter / VLLM compatible model');
      
      const apiKey = process.env.GROQ_API_KEY || process.env.VLLM_API_KEY;
      const baseURL = process.env.GROQ_API_KEY 
        ? 'https://api.groq.com/openai/v1' 
        : (process.env.VLLM_BASE_URL || 'https://openrouter.ai/api/v1');
      
      const modelName = process.env.GROQ_MODEL || process.env.VLLM_MODEL || 'llama-3.3-70b-versatile';

      return new ChatOpenAI({
        apiKey,
        modelName,
        temperature: 0.3,
        configuration: {
          baseURL,
        },
      });
    }
    
    // No keys found - Enable Mock Mode
    console.warn('⚠️ No AI model configuration found - Enabling MOCK MODE');
    this.isMock = true;
    return null;
  }

  async initialize(documents: CatholicDocument[]): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing santaPalabra RAG system...');
      
      // Initialize text splitter
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      // Convert documents to LangChain Document format
      const langchainDocs = await Promise.all(
        documents.map(async (doc) => {
          const chunks = await textSplitter.splitText(doc.content);
          return chunks.map((chunk: string) => new Document({
            pageContent: chunk,
            metadata: {
              id: doc.id,
              title: doc.title,
              source: doc.source,
              category: doc.category
            }
          }));
        })
      );

      const allDocs = langchainDocs.flat();
      
      // Create enhanced vector store with embeddings (DISABLED for faster startup - using keyword search)
      // this.vectorStore = new EnhancedVectorStore();
      // await this.vectorStore.initialize(allDocs);
      
      // Store documents for keyword-based search
      this.documents = allDocs;

      this.isInitialized = true;
      console.log(`✅ santaPalabra RAG initialized with ${allDocs.length} document chunks (keyword search mode)`);
    } catch (error) {
      console.error('❌ Failed to initialize santaPalabra RAG:', error);
      throw error;
    }
  }

  private getConversationHistory(userId: string): ChatMessageHistory {
    if (!conversationStore.has(userId)) {
      conversationStore.set(userId, new ChatMessageHistory());
    }
    return conversationStore.get(userId)!;
  }

  private async retrieveRelevantContext(query: string, topK: number = 5, studyTrack?: string): Promise<RetrievalResult> {
    // Use keyword-based search with stored documents
    if (this.documents.length === 0) {
      throw new Error('Documents not initialized. Call initialize() first.');
    }

    // Filter documents based on study track if provided
    let searchableDocs = this.documents;
    
    if (studyTrack) {
      console.log(`🔍 Filtering documents for study track: ${studyTrack}`);
      switch (studyTrack) {
        case 'dogmatic-theology':
          searchableDocs = this.documents.filter(doc => 
            doc.metadata.category === 'catechism' || 
            doc.metadata.category === 'papal' ||
            doc.metadata.category === 'dogmatic'
          );
          break;
        case 'church-history':
          searchableDocs = this.documents.filter(doc => 
            doc.metadata.category === 'papal' || 
            doc.metadata.category === 'custom' ||
            doc.metadata.category === 'history' ||
            doc.metadata.source === 'church_history'
          );
          break;
        case 'biblical-theology':
          searchableDocs = this.documents.filter(doc => 
            doc.metadata.category === 'scripture' ||
            doc.metadata.source === 'biblical_theology'
          );
          break;
        case 'bible-study-plan':
          searchableDocs = this.documents.filter(doc => 
            doc.metadata.category === 'scripture' || 
            doc.metadata.source === 'daily_gospel_reflections' ||
            doc.metadata.source === 'bible_study_plan'
          );
          break;
      }
      console.log(`📚 Filtered to ${searchableDocs.length} documents (from ${this.documents.length})`);
    }

    // Special handling for "Gospel of the Day"
    const queryLower = query.toLowerCase();
    const isDailyGospelQuery = 
      queryLower.includes('evangelio del día') || 
      queryLower.includes('daily gospel') || 
      queryLower.includes('evangelio de hoy') ||
      queryLower.includes('lectura de hoy');

    let dailyGospelDoc: Document | null = null;

    if (isDailyGospelQuery) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      console.log(`📅 Searching for Gospel of the Day: ${today}`);
      
      dailyGospelDoc = this.documents.find(doc => {
        const isGospelSource = doc.metadata.source === 'daily_gospel_reflections';
        const hasTodayDate = doc.pageContent.includes(`"date":"${today}"`) || doc.pageContent.includes(`"date": "${today}"`);
        return isGospelSource && hasTodayDate;
      }) || null;

      if (dailyGospelDoc) {
        console.log('✨ Found Gospel of the Day document');
      } else {
        console.log('⚠️ Gospel of the Day not found for date:', today);
      }
    }

    // If vector store exists, use it; otherwise use keyword search
    let results: [Document, number][] = [];
    if (this.vectorStore && !studyTrack) { // Disable vector store when filtering for now, or implement filtering in vector store
      const vectorResults = await this.vectorStore.enhancedSearch(query, topK);
      results = vectorResults.documents.map((doc, i) => [doc, vectorResults.relevanceScores[i]]);
    } else {
      // Fallback to keyword search
      const expandedQuery = this.expandQueryTerms(query);
      const queryWords = expandedQuery.flatMap(q => 
        q.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      );
      
      // Score documents based on keyword matching
      results = searchableDocs.map(doc => {
        const content = doc.pageContent.toLowerCase();
        const title = doc.metadata.title?.toLowerCase() || '';
        
        let score = 0;
        queryWords.forEach(word => {
          const titleMatches = (title.match(new RegExp(word, 'gi')) || []).length;
          score += titleMatches * 3;
          const contentMatches = (content.match(new RegExp(word, 'gi')) || []).length;
          score += contentMatches;
        });
        
        return [doc, score] as [Document, number];
      })
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topK);
    }

    // If we found a daily gospel doc, inject it at the top with max score
    if (dailyGospelDoc) {
      // Remove it from results if it's already there to avoid duplicate
      results = results.filter(([doc]) => doc.metadata.id !== dailyGospelDoc!.metadata.id);
      // Add to top
      results.unshift([dailyGospelDoc, 100]); // High score to ensure it's "HIGHLY RELEVANT"
    }
    
    // Normalize scores to 0-1 range
    const maxScore = results[0]?.[1] || 1;
    const normalizedResults = results.map(([doc, score]) => 
      [doc, Math.min(1, score / maxScore)] as [Document, number]
    );
    
    return {
      documents: normalizedResults.map(([doc]) => doc),
      sources: normalizedResults.map(([doc]) => doc.metadata.source || 'Unknown'),
      relevanceScores: normalizedResults.map(([, score]) => score)
    };
  }
  
  private expandQueryTerms(query: string): string[] {
    const expansions: string[] = [query];
    const queryLower = query.toLowerCase();
    
    // Basic term expansions for common Catholic terms
    if (queryLower.includes('oración') || queryLower.includes('prayer')) {
      expansions.push('rezar', 'pray', 'devotion');
    }
    if (queryLower.includes('trinidad') || queryLower.includes('trinity')) {
      expansions.push('padre hijo espiritu', 'father son spirit', 'three persons');
    }
    if (queryLower.includes('evangelio') || queryLower.includes('gospel')) {
      expansions.push('buena nueva', 'good news', 'scripture');
    }
    
    return expansions;
  }

  private isRetriableLLMError(error: unknown): boolean {
    if (!error) return false;
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      const maybeToString = (error as { toString?: () => string }).toString;
      if (typeof maybeToString === 'function') {
        message = maybeToString.call(error);
      }
    }
    const lower = message.toLowerCase();
    return (
      lower.includes('rate limit') ||
      lower.includes('model_rate_limit') ||
      lower.includes('429') ||
      lower.includes('too many requests') ||
      lower.includes('overloaded') ||
      lower.includes('temporarily unavailable')
    );
  }

  private createSystemPrompt(context: ChatContext): PromptTemplate {
    const systemMessage = context.language === 'es' 
      ? `Eres santaPalabra, un asistente de IA católico especializado en teología, doctrina y enseñanzas de la Iglesia Católica.

IDENTIDAD Y PROPÓSITO:
- Proporcionas respuestas precisas basadas en la doctrina católica oficial
- Citas fuentes específicas cuando sea posible (Catecismo, documentos papales, Escrituras)
- Mantienes un tono respetuoso, pastoral y accesible
- Ayudas tanto a católicos como a personas interesadas en aprender sobre el catolicismo

PAUTAS DE RESPUESTA:
1. Base tus respuestas en las enseñanzas católicas oficiales
2. Usa el contexto proporcionado como referencia principal
3. Si no tienes información suficiente, admítelo humildemente
4. Ofrece orientación práctica cuando sea apropiado
5. Mantén las respuestas concisas pero completas

CONTEXTO RELEVANTE:
{context}

HISTORIAL DE CONVERSACIÓN:
{chat_history}

PREGUNTA DEL USUARIO:
{input}

Responde a la siguiente pregunta del usuario de manera útil y doctrinalmente correcta:`
      : `You are santaPalabra, a Catholic AI assistant specialized in theology, doctrine, and Church teachings.

IDENTITY & PURPOSE:
- Provide accurate answers based on official Catholic doctrine
- Cite specific sources when possible (Catechism, papal documents, Scripture)
- Maintain a respectful, pastoral, and accessible tone
- Help both Catholics and those interested in learning about Catholicism

RESPONSE GUIDELINES:
1. Base responses on official Catholic teachings from the provided context
2. Pay special attention to HIGHLY RELEVANT sources marked with 🎯
3. If context contains "Daily Gospel" (daily_gospel_reflections):
   - Explain the passage using 'philology' and 'context' sections
   - Connect with Old Testament using 'old_testament_connections'
   - Provide pastoral reflection based on 'personal_reflection' and 'practical_application'
4. Cite specific sources when referencing teachings (e.g., "According to CCC 123...")
5. If context doesn't fully address the question, acknowledge limitations humbly
6. Offer practical spiritual guidance when appropriate
7. Keep responses comprehensive yet accessible
8. When multiple sources conflict, explain the nuances

CONTEXT SOURCES (use these as your primary references):
{context}

CONVERSATION CONTEXT:
{chat_history}

USER QUESTION:
{input}

Provide a helpful, doctrinally sound response based on the sources above:`;

    return PromptTemplate.fromTemplate(systemMessage);
  }

  private generateMockResponse(context: ChatContext, documents: Document[]): string {
    console.log('⚠️ Generating MOCK response (fallback/no keys)');
    const topDocs = documents.slice(0, 3);
    const docSummary = topDocs.map(d => 
      `**${d.metadata.title || 'Document'}** (${d.metadata.category})\n"${d.pageContent.substring(0, 200)}..."`
    ).join('\n\n');

    const mockResponse = context.language === 'es' 
      ? `[MODO DEMOSTRACIÓN - Sin Claves AI Configuradas]

He encontrado estos pasajes relevantes en los documentos católicos:

${docSummary}

${documents.length === 0 ? 'No se encontraron documentos relevantes para tu búsqueda.' : ''}

Para habilitar el chat con IA completa, por favor configura OPENAI_API_KEY o ANTHROPIC_API_KEY en tu archivo .env.`
      : `[DEMO MODE - No AI Keys Configured]

I found these relevant passages in the Catholic documents:

${docSummary}

${documents.length === 0 ? 'No relevant documents found for your query.' : ''}

To enable full AI chat, please configure OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file.`;

    return mockResponse;
  }

  async generateResponse(
    userMessage: string,
    context: ChatContext
  ): Promise<string> {
    // Retrieve relevant documents with enhanced search
    // We need these available in the outer scope for error handling fallback
    let documents: Document[] = [];
    
    try {
      if (!this.isInitialized) {
        throw new Error('santaPalabra RAG not initialized');
      }

      console.log('💭 Generating response for:', userMessage.substring(0, 100) + '...');

      // Retrieve relevant documents with enhanced search
      const retrievalResult = await this.retrieveRelevantContext(userMessage, 5, context.studyTrack);
      documents = retrievalResult.documents;
      const { sources, relevanceScores } = retrievalResult;

      // Check for Mock Mode
      if (this.isMock) {
        return this.generateMockResponse(context, documents);
      }

      let llm: BaseChatModel | null = null;
      let actualModel: SupportedChatModel | 'default' = context.model ?? 'default';
      let fallbackUsed = false;

      // Try to create requested LLM, with fallback to Llama/Groq
      try {
        llm = this.createLLMForModel(context.model);
      } catch (error) {
        console.warn(`Requested model ${context.model} failed initialization:`, error);
        
        // If requested model fails (e.g. missing key), try Llama/Groq as fallback
        if (context.model !== 'llama') {
          console.log('🔄 Attempting fallback to Llama/Groq...');
          try {
            llm = this.createLLMForModel('llama');
            if (llm) {
              console.log('✅ Fallback to Llama successful');
              actualModel = 'llama';
              fallbackUsed = true;
            }
          } catch (e) {
            console.warn('⚠️ Llama fallback also failed');
          }
        }
      }

      if (!llm) {
         // Final check: if no LLM could be created, revert to Mock Mode
         console.warn('❌ All LLM attempts failed. Reverting to Mock Mode.');
         return this.generateMockResponse(context, documents);
      }

      const conversationManager = new ConversationManager(llm);
      
      // Create rich context with source attribution and relevance scores
      const contextText = documents
        .map((doc, index) => {
          const relevanceIndicator = relevanceScores[index] > 0.8 ? '🎯 HIGHLY RELEVANT' : 
                                    relevanceScores[index] > 0.6 ? '📚 RELEVANT' : '💡 RELATED';
          return `${relevanceIndicator} [${doc.metadata.category.toUpperCase()}] ${doc.metadata.title}\n` +
                 `Source: ${sources[index]}\n` +
                 `${doc.pageContent}`;
        })
        .join('\n\n---\n\n');

      console.log(`📚 Retrieved ${documents.length} relevant documents with enhanced search`);

      // Get conversation history
      const conversationHistory = this.getConversationHistory(context.userId);
      const messages = await conversationHistory.getMessages();
      
      // Use summarized conversation history for better context management
      let chatHistory = '';
      if (messages.length > 12) {
        const summary = await conversationManager.summarizeConversation(messages);
        conversationSummaries.set(context.userId, summary);
        
        chatHistory = `CONVERSATION SUMMARY: ${summary.summary}\n` +
                     `KEY TOPICS DISCUSSED: ${summary.keyTopics.join(', ')}\n\n` +
                     `RECENT MESSAGES:\n` +
                     messages.slice(-6).map((msg: BaseMessage) => 
                       `${msg._getType() === 'human' ? 'User' : 'Assistant'}: ${msg.content}`
                     ).join('\n');
      } else {
        chatHistory = messages
          .map((msg: BaseMessage) => `${msg._getType() === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
      }

      // Create prompt template
      const systemPrompt = this.createSystemPrompt(context);

      const runWithLLM = async (currentLLM: BaseChatModel): Promise<string> => {
        const chain = RunnableSequence.from([
          systemPrompt,
          currentLLM,
          new StringOutputParser()
        ]);

        const result = await chain.invoke({
          context: contextText,
          chat_history: chatHistory,
          input: userMessage
        });

        return result;
      };

      let response: string;
      // Variables actualModel and fallbackUsed are already initialized above

      if (context.model === 'llama' || actualModel === 'llama') {
        try {
          response = await runWithLLM(llm);
        } catch (primaryError) {
          if (!this.isRetriableLLMError(primaryError)) {
            throw primaryError;
          }
          console.warn('⚠️ Llama model error, attempting fallbacks:', primaryError);
          
          try {
            // First fallback: Anthropic
            const fallbackLLM = this.createLLMForModel('anthropic');
            if (!fallbackLLM) {
              throw new Error('Fallback LLM (Anthropic) not available');
            }
            response = await runWithLLM(fallbackLLM);
            actualModel = 'anthropic';
            fallbackUsed = true;
          } catch (anthropicError) {
             console.warn('⚠️ Anthropic fallback failed, attempting OpenAI:', anthropicError);
             
             // Second fallback: OpenAI
             const openaiLLM = this.createLLMForModel('openai');
             if (!openaiLLM) {
                throw new Error('Fallback LLM (OpenAI) not available');
             }
             response = await runWithLLM(openaiLLM);
             actualModel = 'openai';
             fallbackUsed = true;
          }
        }
      } else {
        response = await runWithLLM(llm);
      }

      modelUsageStore.set(context.userId, {
        requestedModel: context.model,
        actualModel,
        fallbackUsed,
      });

      console.log('✅ Response generated successfully');

      // Store conversation in memory
      await conversationHistory.addMessage(new HumanMessage(userMessage));
      await conversationHistory.addMessage(new AIMessage(response));

      return response;
    } catch (error) {
      // Handle Authentication Errors (401) by falling back to Mock Mode
      let errorMessage = '';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = String(error);
        }
      }
      
      // Combine message and stringified error for comprehensive checking
      let errorJson = '';
      try { errorJson = JSON.stringify(error); } catch {}
      const fullErrorText = (errorMessage + ' ' + errorJson).toLowerCase();
      
      if (
        fullErrorText.includes('401') || 
        fullErrorText.includes('authentication') || 
        fullErrorText.includes('invalid x-api-key') ||
        fullErrorText.includes('invalid api key') ||
        fullErrorText.includes('incorrect api key') ||
        (fullErrorText.includes('missing') && fullErrorText.includes('api_key'))
      ) {
        console.warn('⚠️ Authentication error detected (invalid API key). Falling back to Mock Mode response.');
        return this.generateMockResponse(context, documents);
      }

      console.error('❌ Error generating response:', error);
      throw error;
    }
  }

  async clearConversationHistory(userId: string): Promise<void> {
    const history = this.getConversationHistory(userId);
    await history.clear();
    modelUsageStore.delete(userId);
    console.log(`🗑️ Cleared conversation history for user ${userId}`);
  }

  async getConversationCount(userId: string): Promise<number> {
    const history = conversationStore.get(userId);
    if (!history) return 0;
    const messages = await history.getMessages();
    return messages.length;
  }

  getLastModelUsage(userId: string): {
    requestedModel?: SupportedChatModel;
    actualModel: SupportedChatModel | 'default';
    fallbackUsed: boolean;
  } | null {
    const usage = modelUsageStore.get(userId) || null;
    return usage;
  }

  // Advanced mode with better model
  async setAdvancedMode(useAdvanced: boolean): Promise<void> {
    this.llm = new ChatAnthropic({
      model: useAdvanced ? "claude-3-5-sonnet-20241022" : "claude-3-haiku-20240307",
      temperature: useAdvanced ? 0.2 : 0.3,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
    // Update conversation manager with new model
    this.conversationManager = new ConversationManager(this.llm);
  }
  
  // Get insights about user's conversation patterns
  async getConversationInsights(userId: string): Promise<{
    totalMessages: number;
    summary: ConversationSummary | null;
    dominantTopics: string[];
    suggestedFollowUps: string[];
  }> {
    const history = conversationStore.get(userId);
    if (!history) {
      return {
        totalMessages: 0,
        summary: null,
        dominantTopics: [],
        suggestedFollowUps: []
      };
    }
    
    const messages = await history.getMessages();
    const summary = conversationSummaries.get(userId) || null;
    
    // Generate follow-up suggestions based on topics
    const suggestedFollowUps = summary?.keyTopics.slice(0, 3).map(topic => 
      `Tell me more about ${topic} in Catholic teaching`
    ) || [];
    
    return {
      totalMessages: messages.length,
      summary,
      dominantTopics: summary?.keyTopics || [],
      suggestedFollowUps
    };
  }
}

// Singleton instance
let santaPalabraRAG: SantaPalabraRAG | null = null;

export async function getSantaPalabraRAG(): Promise<SantaPalabraRAG> {
  if (!santaPalabraRAG) {
    santaPalabraRAG = new SantaPalabraRAG();
  }
  return santaPalabraRAG;
}

export async function initializeWithCatholicDocuments(documents: CatholicDocument[]): Promise<SantaPalabraRAG> {
  const rag = await getSantaPalabraRAG();
  await rag.initialize(documents);
  return rag;
}
