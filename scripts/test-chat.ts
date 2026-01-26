
import * as dotenv from 'dotenv';
import { getSantaPalabraRAG } from '../src/lib/langchain-rag';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testChat() {
  console.log('🚀 Starting Chat Test (RAG + Supabase)...');
  
  // Initialize RAG system
  const rag = await getSantaPalabraRAG();
  
  // Force initialization (normally handled by singleton or first request)
  await rag.initialize([]);

  const testQueries = [
    {
      query: "¿Quién es Dios?",
      track: "dogmatic-theology"
    },
    {
      query: "¿Qué pasó en el Concilio de Trento?",
      track: "church-history"
    },
    {
        query: "¿Qué dice el CELAM sobre la pobreza?",
        track: "custom"
    }
  ];

  for (const item of testQueries) {
    console.log(`\n\n📝 Testing Query: "${item.query}" [Track: ${item.track}]`);
    try {
      const response = await rag.generateResponse(item.query, {
        userId: 'test-user-dev',
        mode: 'standard',
        language: 'es',
        model: 'auto',
        studyTrack: item.track
      });
      
      console.log('\n🤖 AI Response:');
      console.log('---------------------------------------------------');
      console.log(response);
      console.log('---------------------------------------------------');
      
    } catch (error) {
      console.error('❌ Error generating response:', error);
    }
  }
}

testChat().catch(console.error);
