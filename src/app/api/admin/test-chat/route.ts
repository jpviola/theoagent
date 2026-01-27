import { NextRequest, NextResponse } from 'next/server';
import { initializeWithCatholicDocuments } from '@/lib/langchain-rag';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

interface CatholicDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'catechism' | 'papal' | 'scripture' | 'custom';
}

let documentsLoaded = false;
let theoAgent: Awaited<ReturnType<typeof initializeWithCatholicDocuments>> | null = null;

async function loadCatholicDocuments() {
  if (documentsLoaded && theoAgent) return theoAgent;

  try {
    const publicDir = path.join(process.cwd(), 'public', 'data');
    const documents: CatholicDocument[] = [];

    // Load Catechism
    try {
      const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
      const catechismEntries = JSON.parse(catechismData) as Array<{ id: string | number; text: string }>;
      documents.push(
        ...catechismEntries.map((entry) => ({
          id: `catechism-${entry.id}`,
          title: `Catechism ${entry.id}`,
          content: entry.text,
          source: 'Catechism of the Catholic Church',
          category: 'catechism' as const,
        }))
      );
    } catch (e) { console.warn('Failed to load catechism.json', e); }

    // Load Papal Docs
    try {
      const papalData = await fs.readFile(path.join(publicDir, 'papal_magisterium.json'), 'utf-8');
      const papalEntries = JSON.parse(papalData) as Array<{ title?: string; content: string; source?: string }>;
      documents.push(
        ...papalEntries.map((entry, index) => ({
          id: `papal-${index}`,
          title: entry.title || `Papal Document ${index}`,
          content: entry.content,
          source: entry.source || 'Papal Magisterium',
          category: 'papal' as const,
        }))
      );
    } catch (e) { console.warn('Failed to load papal_magisterium.json', e); }

    // Load Scripture
    try {
      const scriptureData = await fs.readFile(path.join(publicDir, 'gospel_passages_greek.json'), 'utf-8');
      const scriptureEntries = JSON.parse(scriptureData) as Array<{
        citation?: string;
        greek: string;
        english: string;
      }>;
      documents.push(
        ...scriptureEntries.map((entry, index) => ({
          id: `scripture-${index}`,
          title: entry.citation || `Scripture Passage ${index}`,
          content: `${entry.greek}\n\n${entry.english}`,
          source: entry.citation || 'Sacred Scripture',
          category: 'scripture' as const,
        }))
      );
    } catch (e) { console.warn('Failed to load gospel_passages_greek.json', e); }

    // Load Custom
    try {
      const customData = await fs.readFile(path.join(publicDir, 'custom_teachings.json'), 'utf-8');
      const customEntries = JSON.parse(customData) as Array<{ title?: string; content: string; source?: string }>;
      documents.push(
        ...customEntries.map((entry, index) => ({
          id: `custom-${index}`,
          title: entry.title || `Teaching ${index}`,
          content: entry.content,
          source: entry.source || 'Church Teaching',
          category: 'custom' as const,
        }))
      );
    } catch (e) { console.warn('Failed to load custom_teachings.json', e); }

    console.log(`📚 Admin Test: Loaded ${documents.length} Catholic documents`);

    // Initialize TheoAgent RAG
    theoAgent = await initializeWithCatholicDocuments(documents);
    documentsLoaded = true;
    
    return theoAgent;
  } catch (error) {
    console.error('❌ Failed to load Catholic documents for Admin Test:', error);
    throw new Error('Failed to initialize Catholic knowledge base');
  }
}

export async function POST(req: NextRequest) {
  // Check Admin Session
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');

  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages, mode = 'standard', userId = 'admin-tester', language = 'es', model } = await req.json();
    console.log('🧪 Admin Test Chat:', { mode, model });
    
    // Initialize TheoAgent RAG system
    const rag = await loadCatholicDocuments();
    
    // Set advanced mode (always true for admin test)
    await rag.setAdvancedMode(true);
    
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';
    
    if (!userQuery) {
      return new Response('No user message provided', { status: 400 });
    }
    
    // Generate response
    const response = await rag.generateResponse(userQuery, {
      userId,
      mode,
      language,
      model
    });
    
    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const chunks = response.split(' ');
          
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk + ' '));
            await new Promise(resolve => setTimeout(resolve, 20)); // Fast stream for test
          }
          
          controller.close();
        }
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked'
        }
      }
    );
    
  } catch (error) {
    console.error('❌ Error in admin test chat route:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
