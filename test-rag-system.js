// Quick RAG Test Script
console.log('🚀 Testing TheoAgent Dual RAG System...\n');

const testQuery = 'What is the Trinity in Catholic teaching?';
console.log(`❓ Query: ${testQuery}\n`);

async function testRAG() {
  try {
    console.log('🔗 Testing LangChain Implementation...');
    
    const langchainResponse = await fetch('http://localhost:3000/api/compare-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        implementation: 'LangChain',
        mode: 'standard',
        language: 'en'
      }),
    });
    
    const langchainData = await langchainResponse.json();
    
    if (langchainData.success) {
      console.log(`✅ LangChain Success: ${langchainData.responseTime}ms`);
      console.log(`📝 Response: ${langchainData.response.substring(0, 150)}...\n`);
    } else {
      console.log(`❌ LangChain Error: ${langchainData.message}\n`);
    }
    
    // Test LlamaIndex
    console.log('🦙 Testing LlamaIndex Implementation...');
    
    const llamaResponse = await fetch('http://localhost:3000/api/compare-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        implementation: 'LlamaIndex',
        mode: 'standard',
        language: 'en'
      }),
    });
    
    const llamaData = await llamaResponse.json();
    
    if (llamaData.success) {
      console.log(`✅ LlamaIndex Success: ${llamaData.responseTime}ms`);
      console.log(`📝 Response: ${llamaData.response.substring(0, 150)}...\n`);
    } else {
      console.log(`❌ LlamaIndex Error: ${llamaData.message}\n`);
    }
    
    console.log('🎉 RAG System Test Completed!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testRAG();