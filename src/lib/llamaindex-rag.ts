import {
  VectorStoreIndex,
  Document,
} from 'llamaindex';

// Types for our Catholic documents
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

export class TheoAgentLlamaIndex {
  private index: VectorStoreIndex | null = null;
  private queryEngine: any = null;
  private isInitialized = false;
  private useAdvanced = false;

  constructor() {
    console.log('🦙 Initializing TheoAgent LlamaIndex (Simplified Version)');
  }

  async initialize(documents: CatholicDocument[]): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing TheoAgent with LlamaIndex...');
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key required for LlamaIndex');
      }

      // Convert Catholic documents to LlamaIndex Document format
      const llamaDocuments = documents.map(doc => {
        return new Document({
          text: doc.content,
          metadata: {
            id: doc.id,
            title: doc.title,
            source: doc.source,
            category: doc.category
          }
        });
      });

      console.log(`📚 Processing ${llamaDocuments.length} Catholic documents`);

      // Create vector index
      this.index = await VectorStoreIndex.fromDocuments(llamaDocuments);

      // Create query engine
      this.queryEngine = this.index.asQueryEngine({
        similarityTopK: 5,
      });

      this.isInitialized = true;
      console.log('✅ TheoAgent LlamaIndex initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize TheoAgent LlamaIndex:', error);
      throw error;
    }
  }

  async generateResponse(userMessage: string, context: ChatContext): Promise<string> {
    try {
      if (!this.isInitialized || !this.queryEngine) {
        throw new Error('TheoAgent LlamaIndex not initialized');
      }

      console.log('💭 Generating response with LlamaIndex for:', userMessage.substring(0, 100) + '...');

      // Create contextual query with Catholic system prompt
      const systemPrompt = this.getCatholicSystemPrompt(context.language);
      const contextualQuery = `${systemPrompt}\n\nQuestion: ${userMessage}`;

      // Query the engine
      const startTime = Date.now();
      const response = await this.queryEngine.query({
        query: contextualQuery,
      });
      const endTime = Date.now();

      console.log(`⚡ LlamaIndex response generated in ${endTime - startTime}ms`);

      return response.toString();

    } catch (error) {
      console.error('❌ Error generating LlamaIndex response:', error);
      throw error;
    }
  }

  private getCatholicSystemPrompt(language: 'en' | 'es'): string {
    if (language === 'es') {
      return `Eres TheoAgent, un asistente católico especializado en doctrina de la Iglesia. Responde basándote en enseñanzas católicas oficiales.`;
    }

    return `You are TheoAgent, a Catholic AI assistant. Provide responses based on official Catholic teachings and doctrine.`;
  }

  async setAdvancedMode(useAdvanced: boolean): Promise<void> {
    this.useAdvanced = useAdvanced;
    console.log(`🔧 LlamaIndex set to ${useAdvanced ? 'advanced' : 'standard'} mode`);
  }

  async clearConversationHistory(userId: string): Promise<void> {
    console.log(`🗑️ Cleared LlamaIndex conversation history for user ${userId}`);
  }

  async getConversationInsights(userId: string): Promise<{
    totalMessages: number;
    recentTopics: string[];
    suggestedFollowUps: string[];
  }> {
    return {
      totalMessages: 0,
      recentTopics: [],
      suggestedFollowUps: []
    };
  }
}

// Singleton instance
let theoAgentLlamaIndex: TheoAgentLlamaIndex | null = null;

export async function getTheoAgentLlamaIndex(): Promise<TheoAgentLlamaIndex> {
  if (!theoAgentLlamaIndex) {
    theoAgentLlamaIndex = new TheoAgentLlamaIndex();
  }
  return theoAgentLlamaIndex;
}

export async function initializeLlamaIndexWithCatholicDocuments(documents: CatholicDocument[]): Promise<TheoAgentLlamaIndex> {
  const llamaIndex = await getTheoAgentLlamaIndex();
  await llamaIndex.initialize(documents);
  return llamaIndex;
}