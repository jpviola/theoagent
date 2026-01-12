import { NextRequest, NextResponse } from 'next/server';
import { ragComparison } from '@/lib/rag-comparison';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Starting RAG comparison API...');
    
    const { searchParams } = new URL(req.url);
    const testType = searchParams.get('test') || 'full';
    const implementation = searchParams.get('impl') as 'LangChain' | 'LlamaIndex' | null;
    
    if (testType === 'quick' && implementation) {
      await ragComparison.quickTest(implementation);
      return NextResponse.json({
        success: true,
        message: `Quick test of ${implementation} completed`,
        type: 'quick',
        implementation
      });
    }

    // Run full comparison
    const report = await ragComparison.runFullComparison();
    
    return NextResponse.json({
      success: true,
      message: 'RAG comparison completed successfully',
      type: 'full',
      report: {
        timestamp: report.timestamp,
        totalQueries: report.totalQueries,
        performance: report.performance,
        qualityHighlights: {
          langchain: report.qualityAssessment.langchain.slice(0, 5),
          llamaindex: report.qualityAssessment.llamaindex.slice(0, 5)
        },
        summary: {
          langchainAvgTime: report.performance.langchain.avgTime,
          llamaindexAvgTime: report.performance.llamaindex.avgTime,
          langchainSuccessRate: report.performance.langchain.successRate,
          llamaindexSuccessRate: report.performance.llamaindex.successRate,
          winner: report.performance.langchain.avgTime < report.performance.llamaindex.avgTime ? 'LangChain' : 'LlamaIndex'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ RAG comparison API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'RAG comparison failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, implementation = 'LangChain', mode = 'standard', language = 'en' } = await req.json();
    
    if (!query) {
      return NextResponse.json({
        success: false,
        message: 'Query is required'
      }, { status: 400 });
    }

    console.log(`🔍 Simple test query: "${query}" with ${implementation}`);
    
    const startTime = Date.now();
    
    // For now, return a simple Catholic response without complex RAG
    const mockResponse = `Regarding your question "${query}": 

The Catholic Church teaches that this is an important matter of faith. According to the Catechism of the Catholic Church, all Catholic teaching is grounded in Sacred Scripture and Sacred Tradition. 

For questions about the Trinity, the Church teaches that God is one in essence but three in persons: Father, Son, and Holy Spirit. For questions about prayer, Catholics are encouraged to pray regularly, especially the Mass and the Liturgy of the Hours.

This is a simplified response for testing purposes. (Mode: ${mode}, Language: ${language})`;
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      query,
      implementation: implementation === 'LlamaIndex' ? 'LangChain (fallback)' : implementation,
      response: mockResponse,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple query test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Query test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}