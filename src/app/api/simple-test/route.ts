import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, implementation, mode, language } = await req.json();
    
    console.log('🧪 Simple test query received:', { query, implementation, mode, language });
    
    // For now, return a simple response to test if the API is working
    const mockResponse = `This is a test response for your query: "${query}". The Catholic Church teaches that this is an important theological question. [Implementation: ${implementation}, Mode: ${mode}, Language: ${language}]`;
    
    return NextResponse.json({
      success: true,
      query,
      implementation,
      response: mockResponse,
      responseTime: 150, // mock response time
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Simple test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test endpoint error: ' + (error instanceof Error ? error.message : 'Unknown error')
      }, 
      { status: 500 }
    );
  }
}