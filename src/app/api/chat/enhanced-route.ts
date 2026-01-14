import { NextRequest } from 'next/server';
import { getSantaPalabraRAG, initializeWithCatholicDocuments } from '@/lib/langchain-rag';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-db';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

// Service role client for bypassing RLS when creating profiles
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

// Cache for document loading
let documentsLoaded = false;
let theoAgent: any = null;

async function loadCatholicDocuments() {
  if (documentsLoaded && theoAgent) return theoAgent;

  try {
    const publicDir = path.join(process.cwd(), 'public', 'data');
    
    // Load all Catholic documents
    const documents = [];
    
    // Load Catechism
    const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
    const catechismEntries = JSON.parse(catechismData);
    documents.push(...catechismEntries.map((entry: any) => ({
      id: `catechism-${entry.id}`,
      title: `Catechism ${entry.id}`,
      content: entry.text,
      source: 'Catechism of the Catholic Church',
      category: 'catechism' as const
    })));

    // Load Papal Documents
    const papalData = await fs.readFile(path.join(publicDir, 'papal_magisterium.json'), 'utf-8');
    const papalEntries = JSON.parse(papalData);
    documents.push(...papalEntries.map((entry: any, index: number) => ({
      id: `papal-${index}`,
      title: entry.title || `Papal Document ${index}`,
      content: entry.content,
      source: entry.source || 'Papal Magisterium',
      category: 'papal' as const
    })));

    // Load Scripture Passages
    const scriptureData = await fs.readFile(path.join(publicDir, 'gospel_passages_greek.json'), 'utf-8');
    const scriptureEntries = JSON.parse(scriptureData);
    documents.push(...scriptureEntries.map((entry: any, index: number) => ({
      id: `scripture-${index}`,
      title: entry.citation || `Scripture Passage ${index}`,
      content: `${entry.greek}\n\n${entry.english}`,
      source: entry.citation || 'Sacred Scripture',
      category: 'scripture' as const
    })));

    // Load Custom Teachings
    const customData = await fs.readFile(path.join(publicDir, 'custom_teachings.json'), 'utf-8');
    const customEntries = JSON.parse(customData);
    documents.push(...customEntries.map((entry: any, index: number) => ({
      id: `custom-${index}`,
      title: entry.title || `Teaching ${index}`,
      content: entry.content,
      source: entry.source || 'Church Teaching',
      category: 'custom' as const
    })));

    console.log(`📚 Loaded ${documents.length} Catholic documents for RAG system`);

    // Initialize TheoAgent RAG with LangChain
    const { initializeWithCatholicDocuments } = await import('@/lib/langchain-rag');
    theoAgent = await initializeWithCatholicDocuments(documents);
    documentsLoaded = true;
    
    return theoAgent;
  } catch (error) {
    console.error('❌ Failed to load Catholic documents:', error);
    throw new Error('Failed to initialize Catholic knowledge base');
  }
}

// Helper function to get documents array for other implementations
async function getCatholicDocuments() {
  const publicDir = path.join(process.cwd(), 'public', 'data');
  
  const documents = [];
  
  // Load Catechism
  const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
  const catechismEntries = JSON.parse(catechismData);
  documents.push(...catechismEntries.map((entry: any) => ({
    id: `catechism-${entry.id}`,
    title: `Catechism ${entry.id}`,
    content: entry.text,
    source: 'Catechism of the Catholic Church',
    category: 'catechism' as const
  })));

  // Load other documents similarly...
  const papalData = await fs.readFile(path.join(publicDir, 'papal_magisterium.json'), 'utf-8');
  const papalEntries = JSON.parse(papalData);
  documents.push(...papalEntries.map((entry: any, index: number) => ({
    id: `papal-${index}`,
    title: entry.title || `Papal Document ${index}`,
    content: entry.content,
    source: entry.source || 'Papal Magisterium',
    category: 'papal' as const
  })));

  return documents;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Enhanced Chat route with RAG called');
    const { messages, mode = 'standard', userId, language = 'en', ragImplementation = 'LangChain' } = await req.json();
    console.log('📝 Chat request:', { messagesCount: messages?.length, mode, userId, language, ragImplementation });
    
    // Authenticate and validate user
    if (!userId) {
      console.log('❌ No userId provided');
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check/create user profile
    console.log('👤 Checking user profile for:', userId);
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log('📊 Profile query result:', { profile: !!profile, error: !!error });
    
    let userProfile = profile;
    if (error || !profile) {
      console.log('📋 Profile error details:', error);
      
      // Create profile if it doesn't exist
      if (error?.code === 'PGRST116') {
        console.log('➕ Creating new profile for user:', userId);
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            subscription_tier: 'free',
            usage_count_today: 0
          })
          .select()
          .single();
          
        if (createError) {
          console.log('❌ Failed to create profile:', createError);
          return new Response('Failed to create user profile', { status: 500 });
        }
        
        userProfile = newProfile;
        console.log('✅ Successfully created new profile');
      } else {
        return new Response('User not found', { status: 404 });
      }
    }
    
    // Check subscription limits
    const limits = SUBSCRIPTION_TIERS[userProfile.subscription_tier as 'free' | 'plus' | 'expert'];
    
    // Check daily usage limits
    if (limits.limits.dailyMessages !== -1 && userProfile.usage_count_today >= limits.limits.dailyMessages) {
      return new Response('Daily usage limit exceeded', { status: 429 });
    }
    
    // Check mode access
    if (!limits.limits.modesAccess.includes(mode)) {
      return new Response('Mode not available for your subscription tier', { status: 403 });
    }
    
    // Get user's last message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';
    
    if (!userQuery) {
      return new Response('No user message provided', { status: 400 });
    }

    // Set advanced mode based on subscription
    const useAdvanced = userProfile.subscription_tier === 'plus' || userProfile.subscription_tier === 'expert';

    // Initialize RAG system based on user preference
    console.log(`🧠 Initializing ${ragImplementation} RAG system...`);
    let response: string;
    
    // Generate enhanced response using selected RAG implementation
    console.log('💭 Generating response with enhanced RAG system...');
    const startTime = Date.now();
    
    if (ragImplementation === 'LlamaIndex') {
      // LlamaIndex temporarily disabled - using LangChain fallback
      console.log('🦙➡️🦜 LlamaIndex disabled, falling back to LangChain');
      const rag = await loadCatholicDocuments();
      await rag.setAdvancedMode(useAdvanced);
      
      console.log(`🦜 Using LangChain with ${useAdvanced ? 'advanced' : 'standard'} model (LlamaIndex fallback)`);
      response = await rag.generateResponse(userQuery, {
        userId,
        mode,
        language
      });
    } else {
      // Use LangChain (default)
      const rag = await loadCatholicDocuments();
      await rag.setAdvancedMode(useAdvanced);
      console.log(`🔗 Using LangChain with ${useAdvanced ? 'advanced' : 'standard'} model`);
      
      response = await rag.generateResponse(userQuery, {
        userId,
        mode,
        language
      });
    }
    
    const endTime = Date.now();
    console.log(`⚡ Response generated in ${endTime - startTime}ms using ${ragImplementation}`);
    
    // Update usage count
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ usage_count_today: userProfile.usage_count_today + 1 })
      .eq('id', userId);
    
    if (updateError) {
      console.error('❌ Error updating usage:', updateError);
    }
    
    // Create conversation record
    const { error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        mode_used: mode,
        message_count: 1,
        model_used: useAdvanced ? 'claude-3-5-sonnet' : 'claude-3-haiku',
        processing_time_ms: endTime - startTime
      });
      
    if (conversationError) {
      console.error('❌ Error creating conversation:', conversationError);
    }
    
    console.log('✅ Enhanced response delivered successfully');
    
    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const chunks = response.split(' ');
          
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk + ' '));
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
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
    console.error('❌ Error in enhanced chat route:', error);
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