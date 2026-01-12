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
    
    const scoredDocs = this.documents.map(doc => {
      const content = doc.pageContent.toLowerCase();
      const title = doc.metadata.title?.toLowerCase() || '';
      
      // Calculate score based on multiple factors
      let score = 0;
      
      queryWords.forEach(word => {
        // Title matches are weighted higher
        const titleMatches = (title.match(new RegExp(word, 'gi')) || []).length;
        score += titleMatches * 3;
        
        // Content matches
        const contentMatches = (content.match(new RegExp(word, 'gi')) || []).length;
        score += contentMatches;
        
        // Exact phrase bonus
        if (content.includes(word)) {
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

// Text splitter for documents
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// In-memory conversation storage (in production, use Redis or database)
const conversationStore = new Map<string, ChatMessageHistory>();
const conversationSummaries = new Map<string, ConversationSummary>();

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

export class TheoAgentRAG {
  private vectorStore: EnhancedVectorStore | null = null;
  private llm: BaseChatModel;
  private conversationManager: ConversationManager;
  private isInitialized = false;

  constructor() {
    // Initialize LLM with Vercel AI Gateway support
    this.llm = this.initializeLLM();
    this.conversationManager = new ConversationManager(this.llm);
  }

  /**
   * Initialize LLM with Vercel AI Gateway support
   * Falls back to direct API calls if gateway is not available
   */
  private initializeLLM(): BaseChatModel {
    const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    
    // Try Vercel AI Gateway first
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
    
    // Last resort - throw error
    throw new Error(`
🚨 No AI model configuration found!
Please set one of:
- AI_GATEWAY_API_KEY + (OPENAI_API_KEY or ANTHROPIC_API_KEY) for Vercel AI Gateway
- ANTHROPIC_API_KEY for direct Anthropic access  
- OPENAI_API_KEY for direct OpenAI access

For Vercel deployment, AI Gateway is recommended: https://vercel.com/docs/ai-gateway
    `);
  }

  async initialize(documents: CatholicDocument[]): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing TheoAgent RAG system...');
      
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
      
      // Create enhanced vector store with embeddings
      this.vectorStore = new EnhancedVectorStore();
      await this.vectorStore.initialize(allDocs);

      this.isInitialized = true;
      console.log(`✅ TheoAgent RAG initialized with ${allDocs.length} document chunks`);
    } catch (error) {
      console.error('❌ Failed to initialize TheoAgent RAG:', error);
      throw error;
    }
  }

  private getConversationHistory(userId: string): ChatMessageHistory {
    if (!conversationStore.has(userId)) {
      conversationStore.set(userId, new ChatMessageHistory());
    }
    return conversationStore.get(userId)!;
  }

  private async retrieveRelevantContext(query: string, topK: number = 5): Promise<RetrievalResult> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initialize() first.');
    }

    return await this.vectorStore.enhancedSearch(query, topK);
  }

  private createSystemPrompt(context: ChatContext): PromptTemplate {
    const systemMessage = context.language === 'es' 
      ? `Eres TheoAgent, un asistente de IA católico especializado en teología, doctrina y enseñanzas de la Iglesia Católica.

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

Responde a la siguiente pregunta del usuario de manera útil y doctrinalmente correcta:`
      : `You are TheoAgent, a Catholic AI assistant specialized in theology, doctrine, and Church teachings.

IDENTITY & PURPOSE:
- Provide accurate answers based on official Catholic doctrine
- Cite specific sources when possible (Catechism, papal documents, Scripture)
- Maintain a respectful, pastoral, and accessible tone
- Help both Catholics and those interested in learning about Catholicism

RESPONSE GUIDELINES:
1. Base responses on official Catholic teachings from the provided context
2. Pay special attention to HIGHLY RELEVANT sources marked with 🎯
3. Cite specific sources when referencing teachings (e.g., "According to CCC 123...")
4. If context doesn't fully address the question, acknowledge limitations humbly
5. Offer practical spiritual guidance when appropriate
6. Keep responses comprehensive yet accessible
7. When multiple sources conflict, explain the nuances

CONTEXT SOURCES (use these as your primary references):
{context}

CONVERSATION CONTEXT:
{chat_history}

USER QUESTION:
{input}

Provide a helpful, doctrinally sound response based on the sources above:`;

    return PromptTemplate.fromTemplate(systemMessage);
  }

  async generateResponse(
    userMessage: string,
    context: ChatContext
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('TheoAgent RAG not initialized');
      }

      console.log('💭 Generating response for:', userMessage.substring(0, 100) + '...');

      // Retrieve relevant documents with enhanced search
      const retrievalResult = await this.retrieveRelevantContext(userMessage);
      const { documents, sources, relevanceScores } = retrievalResult;
      
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
        const summary = await this.conversationManager.summarizeConversation(messages);
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

      // Create the chain
      const chain = RunnableSequence.from([
        systemPrompt,
        this.llm,
        new StringOutputParser()
      ]);

      // Generate response
      const response = await chain.invoke({
        context: contextText,
        chat_history: chatHistory,
        input: userMessage
      });

      console.log('✅ Response generated successfully');

      // Store conversation in memory
      await conversationHistory.addMessage(new HumanMessage(userMessage));
      await conversationHistory.addMessage(new AIMessage(response));

      return response;
    } catch (error) {
      console.error('❌ Error generating response:', error);
      throw error;
    }
  }

  async clearConversationHistory(userId: string): Promise<void> {
    const history = this.getConversationHistory(userId);
    await history.clear();
    console.log(`🗑️ Cleared conversation history for user ${userId}`);
  }

  async getConversationCount(userId: string): Promise<number> {
    const history = conversationStore.get(userId);
    if (!history) return 0;
    const messages = await history.getMessages();
    return messages.length;
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
let theoAgentRAG: TheoAgentRAG | null = null;

export async function getTheoAgentRAG(): Promise<TheoAgentRAG> {
  if (!theoAgentRAG) {
    theoAgentRAG = new TheoAgentRAG();
  }
  return theoAgentRAG;
}

export async function initializeWithCatholicDocuments(documents: CatholicDocument[]): Promise<TheoAgentRAG> {
  const rag = await getTheoAgentRAG();
  await rag.initialize(documents);
  return rag;
}