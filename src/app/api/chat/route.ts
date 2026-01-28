import { NextRequest } from 'next/server';
import { initializeWithCatholicDocuments } from '@/lib/langchain-rag';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-db';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CatholicDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  category: 'catechism' | 'papal' | 'scripture' | 'custom';
}

export const maxDuration = 60;

let documentsLoaded = false;
let theoAgent: Awaited<ReturnType<typeof initializeWithCatholicDocuments>> | null = null;

async function loadCatholicDocuments() {
  if (documentsLoaded && theoAgent) return theoAgent;

  try {
    const publicDir = path.join(process.cwd(), 'public', 'data');
    const documents: CatholicDocument[] = [];

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

    console.log(`📚 Loaded ${documents.length} Catholic documents for RAG system`);

    // Initialize TheoAgent RAG
    theoAgent = await initializeWithCatholicDocuments(documents);
    documentsLoaded = true;
    
    return theoAgent;
  } catch (error) {
    console.error('❌ Failed to load Catholic documents:', error);
    throw new Error('Failed to initialize Catholic knowledge base');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode = 'standard', userId, language = 'en', model } = await req.json();
    
    // Authenticate and validate user
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check/create user profile
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    let userProfile = profile;
    if (error || !profile) {
      // Create profile if it doesn't exist
      if (error?.code === 'PGRST116') {
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
          console.error('❌ Failed to create profile:', createError);
          return new Response('Failed to create user profile', { status: 500 });
        }
        
        userProfile = newProfile;
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
    
    // Initialize TheoAgent RAG system
    const rag = await loadCatholicDocuments();
    
    // Set advanced mode based on subscription
    const useAdvanced = userProfile.subscription_tier === 'plus' || userProfile.subscription_tier === 'expert';
    await rag.setAdvancedMode(useAdvanced);
    
    // Get user's last message
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage?.content || '';
    
    if (!userQuery) {
      return new Response('No user message provided', { status: 400 });
    }
    
    // Generate enhanced response using LangChain RAG
    const response = await rag.generateResponse(userQuery, {
      userId,
      mode,
      language,
      model
    });
    
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
        processing_time_ms: 0
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
