import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
// import { HuggingFaceEndpoint } from '@langchain/community/llms/hf';
// import { ChatHuggingFace } from '@langchain/community/chat_models/huggingface';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
// import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getTodaysGospelReflection, formatDailyGospelContext } from './dailyGospel';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type SupportedChatModel = 'anthropic' | 'openai' | 'llama' | 'gemma' | 'auto';

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
  specialistMode?: boolean;
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

// Enhanced vector store using Supabase
class EnhancedVectorStore {
  private vectorStore: SupabaseVectorStore | null = null;
  private client: any;
  
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const vllmKey = process.env.VLLM_API_KEY || process.env.OPENROUTER_GEMMA_API_KEY;

    if (supabaseUrl && supabaseKey && (openaiKey || vllmKey)) {
      try {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.vectorStore = new SupabaseVectorStore(
          new OpenAIEmbeddings({ 
            openAIApiKey: openaiKey || vllmKey,
            modelName: openaiKey ? "text-embedding-3-small" : "openai/text-embedding-3-small",
            configuration: openaiKey ? undefined : {
                baseURL: 'https://openrouter.ai/api/v1',
            }
          }),
          {
            client: this.client,
            tableName: 'documents',
            queryName: 'match_documents',
          }
        );
        console.log('✅ Supabase Vector Store initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Supabase store:', error);
      }
    } else {
      console.warn('⚠️ Missing Supabase/OpenAI/OpenRouter keys for vector store');
    }
  }
  
  async initialize(documents: any[]): Promise<void> {
    // No-op: Data is already in Supabase
    // We log a message to indicate we are using the external DB
    console.log(`✅ Using Supabase Vector DB (ignoring ${documents.length} local docs)`);
  }
  
  async enhancedSearch(query: string, topK: number = 5, filter?: any): Promise<RetrievalResult> {
    if (!this.vectorStore) {
        console.warn('⚠️ Vector store not available, returning empty results');
        return { documents: [], sources: [], relevanceScores: [] };
    }

    try {
        const results = await this.vectorStore.similaritySearchWithScore(query, topK, filter);
        
        return {
            documents: results.map(([doc]) => doc),
            sources: results.map(([doc]) => doc.metadata.source || 'Unknown'),
            relevanceScores: results.map(([, score]) => score)
        };
    } catch (e) {
        console.error('❌ Supabase search failed:', e);
        return { documents: [], sources: [], relevanceScores: [] };
    }
  }

  async getDailyGospel(date: string): Promise<Document | null> {
      if (!this.client) return null;
      
      try {
          // Attempt to find today's gospel in the daily_gospel_reflections source
          // We use a text search on the content since we didn't strictly structured the date in metadata
          // The format in content is usually "date": "YYYY-MM-DD"
          
          const { data, error } = await this.client
            .from('documents')
            .select('*')
            .eq('metadata->>source', 'daily_gospel_reflections')
            .ilike('content', `%${date}%`) // Simple ILIKE match for the date string
            .limit(1);
            
          if (data && data.length > 0) {
              return new Document({
                  pageContent: data[0].content,
                  metadata: data[0].metadata
              });
          }
          return null;
      } catch (e) {
          console.warn('Failed to fetch daily gospel:', e);
          return null;
      }
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

  private createOpenAILLM(): BaseChatModel | null {
    if (this.isMock) return null;
    
    // 1. Always prefer direct API key if available
    if (process.env.OPENAI_API_KEY) {
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.3,
      });
    }

    const gatewayApiKey = this.getGatewayApiKey();

    // 2. If gateway is configured, use it (fallback)
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

    throw new Error('Missing OPENAI_API_KEY');
  }

  private createAnthropicLLM(): BaseChatModel {
    // 1. Always prefer direct API key if available
    if (process.env.ANTHROPIC_API_KEY) {
      return new ChatAnthropic({
        model: 'claude-3-haiku-20240307',
        temperature: 0.3,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    const gatewayApiKey = this.getGatewayApiKey();

    // 2. If gateway is configured, use it (fallback)
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

    // Fallback (unreachable normally due to check above)
    return new ChatAnthropic({
      model: 'claude-3-haiku-20240307',
      temperature: 0.3,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  private createLLMForModel(model?: SupportedChatModel, specialistMode: boolean = false): BaseChatModel | null {
    if (this.isMock) return null;
    if (!model) return this.llm;

    try {
      switch (model) {
        case 'anthropic':
          return this.createAnthropicLLM();
        case 'llama':
          return this.createLlamaOpenAICompatibleLLM();
        case 'gemma':
          return this.createGemmaLLM(specialistMode);
        case 'auto':
          // Should have been resolved by routeQuery, but just in case:
          return this.createAnthropicLLM(); 
        case 'openai':
          console.warn('OpenAI is deprecated/removed. Falling back to Anthropic.');
          return this.createAnthropicLLM();
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

      // 2. Try Anthropic (Reliable standard)
      if (process.env.ANTHROPIC_API_KEY && model !== 'anthropic') {
        console.log(`🔄 Fallback: Switching to Anthropic from ${model}`);
        try { return this.createAnthropicLLM(); } catch (e) { console.warn('Anthropic fallback failed', e); }
      }
      
      // Removed OpenAI fallback as requested

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

  private createGemmaLLM(specialistMode: boolean = false): BaseChatModel {
    const apiKey = process.env.OPENROUTER_GEMMA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENROUTER_GEMMA_API_KEY (or OPENROUTER_API_KEY)');
    }

    // Use OpenRouter API for Gemma (Free tier)
    console.log('🤗 Using Gemma via OpenRouter');
    return new ChatOpenAI({
      apiKey: apiKey,
      modelName: process.env.OPENROUTER_GEMMA_MODEL || 'google/gemma-3-27b-it:free',
      temperature: 0.3,
      maxTokens: specialistMode ? 4096 : 2048, // Increased limits: 4k for specialists, 2k for standard
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://santapalabra.org', // Recommended by OpenRouter
          'X-Title': 'Santa Palabra',
        }
      },
    });
  }

  /**
   * Initialize LLM with Vercel AI Gateway support
   * Falls back to direct API calls if gateway is not available
   */
  private initializeLLM(): BaseChatModel | null {
    // 1. Try Anthropic (Primary High Quality Model)
    // Always prefer direct API key if available
    if (process.env.ANTHROPIC_API_KEY) {
        console.log('🤖 Using Anthropic Claude directly');
        return new ChatAnthropic({
            model: "claude-3-haiku-20240307",
            temperature: 0.3,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    
    // Fallback to Gateway if no direct key
    if (gatewayApiKey) {
         try {
            console.log('🔥 Using Anthropic via Vercel AI Gateway');
            return new ChatAnthropic({
                apiKey: gatewayApiKey,
                modelName: 'anthropic/claude-3-5-haiku-20241022',
                temperature: 0.3,
                clientOptions: {
                    defaultHeaders: { Authorization: `Bearer ${gatewayApiKey}` },
                },
            });
         } catch (e) { console.warn('Gateway Anthropic failed', e); }
    }

    // 2. Try Groq (Fast/Free Llama)
    if (process.env.GROQ_API_KEY) {
        console.log('⚡ Using Groq (Llama) directly');
        return new ChatOpenAI({
            apiKey: process.env.GROQ_API_KEY,
            modelName: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
            temperature: 0.3,
            configuration: { baseURL: 'https://api.groq.com/openai/v1' },
        });
    }
    
    // 3. Try OpenRouter (Gemma)
    if (process.env.OPENROUTER_GEMMA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.HUGGINGFACE_API_KEY) {
        console.log('🤗 Using Gemma via OpenRouter');
        return new ChatOpenAI({
            apiKey: process.env.OPENROUTER_GEMMA_API_KEY || process.env.OPENROUTER_API_KEY || process.env.HUGGINGFACE_API_KEY,
            modelName: process.env.OPENROUTER_GEMMA_MODEL || 'google/gemma-3-27b-it:free',
            temperature: 0.3,
            maxTokens: 1024,
            configuration: { 
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': 'https://santapalabra.org',
                    'X-Title': 'Santa Palabra',
                }
            },
        });
    }

    // 4. Try VLLM / OpenRouter / Custom
    if (process.env.VLLM_API_KEY) {
        console.log('🔌 Using Custom VLLM/OpenRouter');
         return new ChatOpenAI({
            apiKey: process.env.VLLM_API_KEY,
            modelName: process.env.VLLM_MODEL || 'default-model',
            temperature: 0.3,
            configuration: { baseURL: process.env.VLLM_BASE_URL || 'https://openrouter.ai/api/v1' },
        });
    }

    // No keys found - Enable Mock Mode
    console.warn('⚠️ No supported AI model keys (Anthropic, Groq, HF) found - Enabling MOCK MODE');
    this.isMock = true;
    return null;
  }

  async initialize(documents: CatholicDocument[] = []): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize vector store (connects to Supabase)
      this.vectorStore = new EnhancedVectorStore();
      await this.vectorStore.initialize([]);
      
      // We no longer keep documents in memory
      this.documents = [];

      this.isInitialized = true;
      console.log(`✅ santaPalabra RAG initialized (Supabase Mode)`);
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
    if (!this.vectorStore) {
      throw new Error('santaPalabra RAG not initialized. Call initialize() first.');
    }

    // Construct filter based on study track
    // Note: This requires the match_documents RPC to accept a filter parameter
    let filter: any = undefined;
    
    if (studyTrack) {
      console.log(`🔍 Filtering documents for study track: ${studyTrack}`);
      switch (studyTrack) {
        case 'dogmatic-theology':
          filter = { category: 'catechism' }; // Simplified for now, as complex OR filters are hard in simple metadata maps
          break;
        case 'church-history':
          filter = { category: 'history' };
          break;
        case 'biblical-theology':
          filter = { category: 'scripture' };
          break;
        case 'bible-study-plan':
          filter = { source: 'daily_gospel_reflections' };
          break;
      }
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
      
      // Try local file first (Rich structured data)
      const localReflection = getTodaysGospelReflection();
      
      if (localReflection) {
        console.log('✨ Found Gospel of the Day in local file');
        const formattedContent = formatDailyGospelContext(localReflection);
        dailyGospelDoc = new Document({
          pageContent: formattedContent,
          metadata: { 
            source: 'daily_gospel_reflections', 
            title: `Gospel for ${localReflection.date}`,
            category: 'scripture',
            date: localReflection.date
          }
        });
      } else {
        // Fallback to Supabase
        console.log('⚠️ Local file miss, falling back to Supabase');
        dailyGospelDoc = await this.vectorStore.getDailyGospel(today);
        
        if (dailyGospelDoc) {
          console.log('✨ Found Gospel of the Day in Supabase');
        } else {
          console.log('⚠️ Gospel of the Day not found for date:', today);
        }
      }
    }

    // Perform Search
    const results = await this.vectorStore.enhancedSearch(query, topK, filter);

    // If we found a daily gospel doc, inject it at the top with max score
    if (dailyGospelDoc) {
      // Remove it from results if it's already there to avoid duplicate (check by content or id)
      const newDocs: Document[] = [dailyGospelDoc];
      const newScores: number[] = [1.0];
      const newSources: string[] = [dailyGospelDoc.metadata.source || 'Daily Gospel'];
      
      results.documents.forEach((doc, i) => {
          if (doc.pageContent !== dailyGospelDoc!.pageContent) {
              newDocs.push(doc);
              newScores.push(results.relevanceScores[i]);
              newSources.push(results.sources[i]);
          }
      });
      
      return {
          documents: newDocs,
          relevanceScores: newScores,
          sources: newSources
      };
    }
    
    return results;
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
    const isSpecialist = context.specialistMode;

    const systemMessage = context.language === 'es' 
      ? `Eres Santa Palabra, un catequista digital amigable y sabio. Tu misión es acompañar a los usuarios en su caminar de fe con caridad y verdad.

IDENTIDAD Y PROPÓSITO:
- Eres un compañero de fe: cálido, cercano y respetuoso.
- Tu teología es sólida y fiel al Magisterio de la Iglesia Católica.
${isSpecialist 
  ? '- AUDIENCIA ESPECIALIZADA: Estás hablando con un sacerdote, teólogo o seminarista. Usa terminología teológica precisa, citas académicas (DS, PG, PL) y exégesis profunda.' 
  : '- AUDIENCIA GENERAL: Hablas con fieles laicos. Usa un lenguaje pastoral, accesible y claro.'}
- No eres un robot frío; usas empatía y lenguaje pastoral.

INTERACCIÓN Y TONO:
 - SALUDO: Inicia con calidez (ej. "¡La paz sea contigo!", "¡Qué alegría saludarte!", "Hola, bendiciones").
 - DESPEDIDA: Cierra siempre con una bendición o deseo de bien (ej. "Dios te bendiga", "Quedo a tu disposición", "Un abrazo en Cristo").
 - EVANGELIO DEL DÍA: Si preguntan por el evangelio de hoy, sigue ESTRICTAMENTE este orden:
   1. CITA COMPLETA: Presenta el texto completo del Evangelio tal como aparece en el contexto (no lo resumas).
   2. EXPLICACIÓN ESTRUCTURADA: Usa la información de 'DAILY GOSPEL REFLECTION' para explicar el contexto (histórico/litúrgico), filología (términos clave) y conexiones bíblicas.
   3. REFLEXIÓN: Concluye con la reflexión personal y aplicación práctica.
 - Si no sabes algo, dilo con humildad y ofrece buscarlo o rezar juntos.

PAUTAS DE RESPUESTA:
1. Base tus respuestas en las enseñanzas católicas oficiales del contexto.
2. ${isSpecialist ? 'Cita fuentes con rigor académico (Denzinger, Padres de la Iglesia, Concilios).' : 'Cita fuentes específicas (Catecismo, Biblia) de forma natural.'}
3. Ofrece consejos prácticos para la vida espiritual.
4. ${isSpecialist ? 'EXTENSIÓN: Proporciona respuestas largas, detalladas y exhaustivas. NO cortes la respuesta.' : 'ESTRUCTURA ESTÁNDAR: 1. Evangelio (si aplica) 2. Reflexión Pastoral 3. Llamado a la Acción Evangelizadora.'}

CONTEXTO RELEVANTE:
{context}

HISTORIAL DE CONVERSACIÓN:
{chat_history}

PREGUNTA DEL USUARIO:
{input}

Responde a la siguiente pregunta del usuario con tu tono de catequista amigable:`
      : `You are Santa Palabra, a friendly and wise digital catechist. Your mission is to accompany users in their faith journey with charity and truth.

IDENTITY & PURPOSE:
- You are a faith companion: warm, approachable, and respectful.
- Your theology is solid and faithful to the Catholic Church's Magisterium.
${isSpecialist 
  ? '- SPECIALIST AUDIENCE: You are speaking to a priest, theologian, or seminarian. Use precise theological terminology, academic citations, and deep exegesis.' 
  : '- GENERAL AUDIENCE: You are speaking to lay faithful. Use pastoral, accessible, and clear language.'}
- You are not a cold robot; use empathy and pastoral language.

INTERACTION & TONE:
 - GREETING: Start with warmth (e.g., "Peace be with you!", "Joy to greet you!", "Hello, blessings").
 - FAREWELL: Always close with a blessing or good wish (e.g., "God bless you", "I remain at your disposal", "Yours in Christ").
 - DAILY GOSPEL: If asked about today's Gospel, follow STRICTLY this order:
   1. FULL TEXT: Present the full text of the Gospel as it appears in the context (do not summarize).
   2. STRUCTURED EXPLANATION: Use 'DAILY GOSPEL REFLECTION' data to explain context (historical/liturgical), philology (key terms), and biblical connections.
   3. REFLECTION: Conclude with personal reflection and practical application.
 - If you don't know something, admit it humbly and offer to pray together.

RESPONSE GUIDELINES:
1. Base responses on official Catholic teachings from the provided context.
2. ${isSpecialist ? 'Cite sources with academic rigor (Denzinger, Church Fathers, Councils).' : 'Cite specific sources (Catechism, Bible) naturally.'}
3. Offer practical advice for spiritual life.
4. ${isSpecialist ? 'LENGTH: Provide long, detailed, and exhaustive responses. DO NOT cut the response short.' : 'STANDARD STRUCTURE: 1. Gospel (if applicable) 2. Pastoral Reflection 3. Call to Evangelization Action.'}

CONTEXT SOURCES (use these as your primary references):
{context}

CONVERSATION CONTEXT:
{chat_history}

USER QUESTION:
{input}

Provide a helpful, doctrinally sound response in your friendly catechist tone:`;

    return PromptTemplate.fromTemplate(systemMessage);
  }

  private generateMockResponse(context: ChatContext, documents: Document[], errorReason?: string): string {
    console.log('⚠️ Generating MOCK response (fallback/no keys)');
    const topDocs = documents.slice(0, 3);
    const docSummary = topDocs.map(d => 
      `**${d.metadata.title || 'Document'}** (${d.metadata.category})\n"${d.pageContent.substring(0, 200)}..."`
    ).join('\n\n');

    const errorMsg = errorReason ? `Error: ${errorReason}` : 'Sin Claves AI Configuradas';

    const mockResponse = context.language === 'es' 
      ? `[MODO DEMOSTRACIÓN - ${errorMsg}]

He encontrado estos pasajes relevantes en los documentos católicos:

${docSummary}

${documents.length === 0 ? 'No se encontraron documentos relevantes para tu búsqueda.' : ''}

Para habilitar el chat con IA completa, por favor configura ANTHROPIC_API_KEY o GROQ_API_KEY en tu archivo .env.`
      : `[DEMO MODE - ${errorMsg}]

I found these relevant passages in the Catholic documents:

${docSummary}

${documents.length === 0 ? 'No relevant documents found for your query.' : ''}

To enable full AI chat, please configure ANTHROPIC_API_KEY or GROQ_API_KEY in your .env file.`;

    return mockResponse;
  }

  private async routeQuery(query: string): Promise<SupportedChatModel> {
    try {
      // 1. Simple regex heuristics for speed
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.length < 20 || /^(hola|hello|hi|buenos|buenas|gracias|thanks)/.test(lowerQuery)) {
        return 'gemma'; // Simple greetings -> Gemma (Free)
      }

      // 2. Use Groq (Fastest) to classify complexity
      if (process.env.GROQ_API_KEY) {
        const routerLLM = this.createLlamaOpenAICompatibleLLM();
        const routerPrompt = PromptTemplate.fromTemplate(`
          Classify the following query into 'complex' (requires deep theological reasoning, nuance, or detailed explanation) or 'simple' (factual, greetings, straightforward questions).
          Query: {query}
          Return ONLY the word 'complex' or 'simple'.
        `);
        const chain = routerPrompt.pipe(routerLLM);
        const result = await chain.invoke({ query });
        const classification = result.content.toString().toLowerCase().trim();
        
        if (classification.includes('complex')) {
          return 'anthropic';
        } else {
          return 'gemma';
        }
      }

      // Default if no router available
      return 'anthropic'; // Default to smart model
    } catch (e) {
      console.warn('Router failed, defaulting to Anthropic:', e);
      return 'anthropic';
    }
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

      let actualModel: SupportedChatModel | 'default' = context.model ?? 'default';
      let fallbackUsed = false;
      
      // Auto-routing logic
      if (!context.model || context.model === 'auto' || (context.model as string) === 'default') {
        console.log('🔄 Auto-routing query...');
        const routed = await this.routeQuery(userMessage);
        console.log(`✅ Routed to: ${routed}`);
        actualModel = routed;
        // Update context to use routed model
        context.model = routed;
      }

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
        try {
          // Use Llama (fastest) for summarization, fallback to Anthropic
          let summaryLLM = this.createLlamaOpenAICompatibleLLM();
          if (!summaryLLM) summaryLLM = this.createAnthropicLLM();
          
          if (summaryLLM) {
            const conversationManager = new ConversationManager(summaryLLM);
            const summary = await conversationManager.summarizeConversation(messages);
            conversationSummaries.set(context.userId, summary);
            
            chatHistory = `CONVERSATION SUMMARY: ${summary.summary}\n` +
                         `KEY TOPICS DISCUSSED: ${summary.keyTopics.join(', ')}\n\n` +
                         `RECENT MESSAGES:\n` +
                         messages.slice(-6).map((msg: BaseMessage) => 
                           `${msg._getType() === 'human' ? 'User' : 'Assistant'}: ${msg.content}`
                         ).join('\n');
          } else {
             // Fallback if no LLM available for summary
             chatHistory = messages
              .map((msg: BaseMessage) => `${msg._getType() === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
              .join('\n');
          }
        } catch (e) {
          console.warn('⚠️ Summarization failed, using raw history:', e);
          chatHistory = messages
            .map((msg: BaseMessage) => `${msg._getType() === 'human' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');
        }
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

      // Define priority order based on initial selection
      let attemptOrder: SupportedChatModel[] = [];
      const initialModel = actualModel as SupportedChatModel;
      
      if (initialModel === 'anthropic') {
        attemptOrder = ['anthropic', 'llama', 'gemma'];
      } else if (initialModel === 'llama') {
        attemptOrder = ['llama', 'anthropic', 'gemma'];
      } else if (initialModel === 'gemma') {
        attemptOrder = ['gemma', 'llama', 'anthropic'];
      } else {
        // Fallback default
        attemptOrder = ['anthropic', 'llama', 'gemma'];
      }

      // Remove duplicates
      attemptOrder = [...new Set(attemptOrder)];

      let response: string | null = null;

      // Try models in order
      for (const modelToTry of attemptOrder) {
        console.log(`🔄 Attempting to generate response with model: ${modelToTry}`);
        try {
          const currentLLM = this.createLLMForModel(modelToTry, context.specialistMode);
          if (!currentLLM) {
             console.warn(`⚠️ Skipped ${modelToTry}: LLM creation returned null`);
             continue;
          }

          response = await runWithLLM(currentLLM);
          
          if (response) {
            console.log(`✅ Success with model: ${modelToTry}`);
            actualModel = modelToTry;
            if (modelToTry !== initialModel) {
              fallbackUsed = true;
            }
            break; // Stop if successful
          }
        } catch (err) {
          console.warn(`❌ Failed with model ${modelToTry}:`, err);
          // Check if it's an auth error to log specific warning, but continue trying other models
          const errMsg = String(err).toLowerCase();
          if (errMsg.includes('401') || errMsg.includes('key')) {
             console.warn(`⚠️ Auth error with ${modelToTry}, trying next model...`);
          }
        }
      }

      if (!response) {
        console.warn('❌ All LLM attempts failed. Reverting to Mock Mode.');
        return this.generateMockResponse(context, documents, 'Fallos en todos los modelos de IA');
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
        return this.generateMockResponse(context, documents, 'Clave API inválida o error de autenticación');
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
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        this.llm = new ChatAnthropic({
          model: useAdvanced ? "claude-3-5-sonnet-20241022" : "claude-3-haiku-20240307",
          temperature: useAdvanced ? 0.2 : 0.3,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
        console.log(`✅ setAdvancedMode: Switched to Anthropic ${useAdvanced ? 'Sonnet' : 'Haiku'}`);
      } else {
        // Fallback to existing logic if no Anthropic key
        // This ensures we don't crash and use whatever fallback (Groq/Gemma) is available
        console.log('⚠️ setAdvancedMode: No Anthropic key, using best available model');
        const fallbackModel = this.createLLMForModel('auto');
        if (fallbackModel) {
            this.llm = fallbackModel;
        }
      }

      // Update conversation manager with new model
      if (this.llm) {
        this.conversationManager = new ConversationManager(this.llm);
      }
    } catch (error) {
      console.error('❌ Error in setAdvancedMode:', error);
      // Ensure we have SOMETHING
      if (!this.llm) {
          try {
            this.llm = this.createLLMForModel('auto');
          } catch (e) {
            console.error('CRITICAL: Could not initialize any LLM in setAdvancedMode fallback', e);
          }
      }
    }
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
