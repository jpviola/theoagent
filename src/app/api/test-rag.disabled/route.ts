import { NextRequest, NextResponse } from 'next/server';
import { runRAGTests } from '@/lib/rag-test-utils';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Running RAG tests via API...');
    
    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[LOG] ${message}`);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`[ERROR] ${message}`);
      originalError(...args);
    };
    
    // Run the tests
    await runRAGTests();
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    
    return NextResponse.json({
      success: true,
      message: 'RAG tests completed successfully',
      logs: logs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'RAG tests failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}