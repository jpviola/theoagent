import { getTheoAgentRAG, initializeWithCatholicDocuments } from './langchain-rag';
import fs from 'fs/promises';
import path from 'path';

// Test utility to validate RAG functionality
export class RAGTestUtils {
  static async initializeTestInstance() {
    try {
      const publicDir = path.join(process.cwd(), 'public', 'data');
      
      // Load sample documents for testing
      const documents = [];
      
      // Load a small subset for testing
      const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
      const catechismEntries = JSON.parse(catechismData).slice(0, 10); // Just first 10 for testing
      
      documents.push(...catechismEntries.map((entry: any) => ({
        id: `catechism-${entry.id}`,
        title: `Catechism ${entry.id}`,
        content: entry.text,
        source: 'Catechism of the Catholic Church',
        category: 'catechism' as const
      })));
      
      console.log(`🧪 Loaded ${documents.length} test documents`);
      
      // Initialize TheoAgent RAG with test data
      const rag = await initializeWithCatholicDocuments(documents);
      return rag;
    } catch (error) {
      console.error('❌ Failed to initialize test RAG instance:', error);
      throw error;
    }
  }
  
  static async runTestQueries(rag: any) {
    const testQueries = [
      'What is prayer in Catholic teaching?',
      'Tell me about the Trinity',
      'What does the Church teach about salvation?',
      'How should Catholics approach the Bible?',
      'What is the purpose of the Mass?'
    ];
    
    console.log('🧪 Running test queries...\n');
    
    for (const query of testQueries) {
      console.log(`🔍 Query: "${query}"`);
      
      try {
        const startTime = Date.now();
        
        const response = await rag.generateResponse(query, {
          userId: 'test-user',
          mode: 'standard' as const,
          language: 'en' as const
        });
        
        const endTime = Date.now();
        
        console.log(`✅ Response (${endTime - startTime}ms):`);
        console.log(response.substring(0, 200) + '...\n');
        console.log('---\n');
        
      } catch (error) {
        console.error(`❌ Error with query "${query}":`, error);
      }
    }
  }
  
  static async testConversationFlow(rag: any) {
    console.log('🧪 Testing conversation flow...\n');
    
    const userId = 'test-conversation-user';
    const context = {
      userId,
      mode: 'standard' as const,
      language: 'en' as const
    };
    
    const conversationFlow = [
      'What is the Catholic Church?',
      'How does the Church view Scripture?',
      'Can you explain more about biblical interpretation?',
      'What about the relationship between Scripture and Tradition?'
    ];
    
    for (let i = 0; i < conversationFlow.length; i++) {
      const query = conversationFlow[i];
      console.log(`💬 Message ${i + 1}: "${query}"`);
      
      try {
        const response = await rag.generateResponse(query, context);
        console.log(`Response: ${response.substring(0, 150)}...\n`);
        
        // Test conversation insights after a few messages
        if (i >= 2) {
          const insights = await rag.getConversationInsights(userId);
          console.log(`📊 Conversation insights: ${insights.totalMessages} messages, Topics: [${insights.dominantTopics.join(', ')}]\n`);
        }
        
      } catch (error) {
        console.error(`❌ Error in conversation flow:`, error);
      }
    }
  }
  
  static async benchmarkPerformance(rag: any) {
    console.log('🏃‍♂️ Performance benchmark...\n');
    
    const queries = [
      'What is prayer?',
      'Trinity doctrine',
      'Catholic salvation teaching',
      'Mass significance',
      'Scripture interpretation'
    ];
    
    const times: number[] = [];
    
    for (const query of queries) {
      const startTime = Date.now();
      
      try {
        await rag.generateResponse(query, {
          userId: 'benchmark-user',
          mode: 'standard' as const,
          language: 'en' as const
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        times.push(duration);
        
        console.log(`⏱️ "${query}": ${duration}ms`);
        
      } catch (error) {
        console.error(`❌ Benchmark error for "${query}":`, error);
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n📈 Performance Summary:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Min: ${minTime}ms`);
      console.log(`   Max: ${maxTime}ms`);
    }
  }
}

// Main test function
export async function runRAGTests() {
  console.log('🚀 Starting TheoAgent RAG Tests...\n');
  
  try {
    // Initialize test instance
    const rag = await RAGTestUtils.initializeTestInstance();
    
    // Run different test suites
    await RAGTestUtils.runTestQueries(rag);
    await RAGTestUtils.testConversationFlow(rag);
    await RAGTestUtils.benchmarkPerformance(rag);
    
    console.log('✅ All RAG tests completed successfully!');
    
  } catch (error) {
    console.error('❌ RAG tests failed:', error);
  }
}