import { NextRequest, NextResponse } from 'next/server';
import { TheoAgentRAG } from '../../../lib/langchain-rag';
import fs from 'fs/promises';
import path from 'path';

// Types
interface CatholicDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'catechism' | 'papal' | 'scripture' | 'custom';
}

interface RAGResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

// Initialize RAG system once
let ragSystem: TheoAgentRAG | null = null;
let isInitialized = false;

async function initializeRAG() {
  if (isInitialized && ragSystem) {
    return ragSystem;
  }

  console.log('🚀 Initializing Catholic RAG system...');
  
  try {
    // Load Catholic documents
    const publicDir = path.join(process.cwd(), 'public', 'data');
    const documents: CatholicDocument[] = [];
    
    // Load available JSON files (limiting catechism for faster initialization)
    const files = [
      'catechism.json',
      'papal_magisterium.json', 
      'dei_verbum_passages.json',
      'custom_teachings.json',
      'daily_gospel_reflections.json',
      'gospel_parables.json',
      'celam_latinoamerica.json',
      'espiritualidad_hispanoamericana.json'
    ];
    
    for (const filename of files) {
      try {
        const filePath = path.join(publicDir, filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        if (Array.isArray(data)) {
          // Limit catechism to first 300 documents for faster loading
          const itemsToLoad = filename === 'catechism.json' ? data.slice(0, 300) : data;
          
          itemsToLoad.forEach((item: any, index: number) => {
            documents.push({
              id: `${filename}-${index}`,
              title: item.title || item.heading || item.name || `Entry ${index + 1}`,
              content: item.text || item.content || item.passage || JSON.stringify(item),
              source: filename.replace('.json', ''),
              category: filename.includes('catechism') ? 'catechism' :
                       filename.includes('papal') ? 'papal' :
                       filename.includes('scripture') || filename.includes('gospel') || filename.includes('dei_verbum') ? 'scripture' : 'custom'
            });
          });
        }
        
        console.log(`✅ Loaded ${filename}: ${Array.isArray(data) ? data.length : 1} documents`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ Could not load ${filename}:`, errorMessage);
      }
    }
    
    console.log(`📚 Total documents loaded: ${documents.length}`);
    
    // Initialize RAG system with improved error handling
    ragSystem = new TheoAgentRAG();
    await ragSystem.initialize(documents);
    
    isInitialized = true;
    console.log('✅ Catholic RAG system initialized successfully');
    
    return ragSystem;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to initialize RAG system:', errorMessage);
    throw new Error(`RAG initialization failed: ${errorMessage}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, language = 'es' } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        error: 'Query is required and must be a string',
        code: 'INVALID_QUERY'
      }, { status: 400 });
    }
    
    // Initialize RAG system
    const rag = await initializeRAG();
    
    // Generate response
    console.log(`🙏 Processing Catholic query: ${query.substring(0, 100)}...`);
    const response = await rag.generateResponse(query, {
      userId: 'anonymous',
      mode: 'standard',
      language: language as 'en' | 'es'
    }) as any; // Temporary type assertion until we fix the return type
    
    return NextResponse.json({
      response: typeof response === 'string' ? response : (response.answer || response),
      sources: response.sources || [],
      confidence: response.confidence || 0.8,
      model: 'Enhanced Catholic RAG with Vercel AI Gateway',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Catholic RAG API error:', error);
    
    // Detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError = errorMessage.includes('No AI model configuration');
    
    return NextResponse.json({
      error: isConfigError 
        ? 'AI service configuration incomplete. Please check environment variables.'
        : 'Internal server error processing your Catholic query',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      code: isConfigError ? 'CONFIG_ERROR' : 'PROCESSING_ERROR',
      timestamp: new Date().toISOString()
    }, { 
      status: isConfigError ? 503 : 500 
    });
  }
}

// Health check endpoint
export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      service: 'Catholic RAG API',
      features: [
        'Vercel AI Gateway Support',
        'Multi-provider fallback (OpenAI/Anthropic)', 
        'Enhanced Catholic document retrieval',
        'Hispanoamerican spirituality focus',
        'Catechism integration'
      ],
      initialized: isInitialized,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}