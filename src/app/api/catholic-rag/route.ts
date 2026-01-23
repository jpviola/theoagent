import { NextRequest, NextResponse } from 'next/server';
import { SantaPalabraRAG } from '../../../lib/langchain-rag';
import fs from 'fs/promises';
import path from 'path';

interface CatholicDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'catechism' | 'papal' | 'scripture' | 'custom';
}

// Initialize RAG system once
let ragSystem: SantaPalabraRAG | null = null;
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
      'espiritualidad_hispanoamericana.json',
      'church_history.json',
      'biblical_theology.json',
      'dogmatic_theology.json',
      'bible_study_plan.json',
      'custom_library.json'
    ];
    
    for (const filename of files) {
      try {
        const filePath = path.join(publicDir, filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        if (Array.isArray(data)) {
          // Limit catechism to first 300 documents for faster loading
          const itemsToLoad = filename === 'catechism.json' ? data.slice(0, 300) : data;
          
          itemsToLoad.forEach((item: { title?: string; heading?: string; name?: string; text?: string; content?: string; passage?: string } | unknown, index: number) => {
              const typedItem = item as { title?: string; heading?: string; name?: string; text?: string; content?: string; passage?: string; source?: string };
            
            // Determine category based on filename
            let category: 'catechism' | 'papal' | 'scripture' | 'custom' | 'dogmatic' | 'history' = 'custom';
            if (filename.includes('catechism')) category = 'catechism';
            else if (filename.includes('papal')) category = 'papal';
            else if (filename.includes('scripture') || filename.includes('gospel') || filename.includes('dei_verbum') || filename.includes('biblical_theology') || filename.includes('bible_study')) category = 'scripture';
            else if (filename.includes('dogmatic_theology')) category = 'dogmatic';
            else if (filename.includes('church_history')) category = 'history';
            
            documents.push({
              id: `${filename}-${index}`,
              title: typedItem.title || typedItem.heading || typedItem.name || `Entry ${index + 1}`,
              content: typedItem.text || typedItem.content || typedItem.passage || JSON.stringify(typedItem),
              source: typedItem.source || filename.replace('.json', ''),
              category: category as any
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
    ragSystem = new SantaPalabraRAG();
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
    const { query, language = 'es', model, studyTrack } = await request.json();
    
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
    const userId = request.headers.get('x-user-id') || 'anonymous';

    const response = await rag.generateResponse(query, {
      userId,
      mode: 'standard',
      language: language as 'en' | 'es',
      model: model as 'anthropic' | 'openai' | 'llama' | undefined,
      studyTrack,
    });
    
    const modelUsage = rag.getLastModelUsage
      ? rag.getLastModelUsage(userId)
      : null;

    return NextResponse.json({
      response,
      sources: [],
      confidence: 0.8,
      model: model || 'default',
      actualModel: modelUsage?.actualModel || (model || 'default'),
      fallbackUsed: modelUsage?.fallbackUsed ?? false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Catholic RAG API error:', error);
    
    // Detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError =
      errorMessage.includes('No AI model configuration') ||
      errorMessage.includes('Missing OPENAI_API_KEY') ||
      errorMessage.includes('Missing ANTHROPIC_API_KEY') ||
      errorMessage.includes('Missing GOOGLE_API_KEY') ||
      errorMessage.includes('Missing LLAMA_OPENAI_COMPAT_') ||
      errorMessage.includes('Missing GROQ_') ||
      errorMessage.includes('Missing TOGETHER_') ||
      errorMessage.includes('not configured yet');

    const isRateLimitError =
      errorMessage.includes('MODEL_RATE_LIMIT') ||
      errorMessage.includes('429') ||
      errorMessage.toLowerCase().includes('rate limit');
    
    return NextResponse.json({
      error: isConfigError
        ? (process.env.NODE_ENV === 'development'
          ? errorMessage
          : 'AI service configuration incomplete. Please check environment variables.')
        : isRateLimitError
        ? 'The selected AI model is temporarily rate limited. Please wait a moment, or switch to another model (e.g. Anthropic or OpenAI).'
        : 'Internal server error processing your Catholic query',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      code: isConfigError ? 'CONFIG_ERROR' : isRateLimitError ? 'RATE_LIMIT' : 'PROCESSING_ERROR',
      timestamp: new Date().toISOString()
    }, { 
      status: isConfigError ? 503 : isRateLimitError ? 429 : 500 
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
