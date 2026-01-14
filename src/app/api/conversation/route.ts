import { getTheoAgentRAG } from '@/lib/langchain-rag';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { action, userId } = await req.json();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Verify user exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
      
    if (!profile) {
      return new Response('User not found', { status: 404 });
    }
    
    const rag = await getTheoAgentRAG();
    
    switch (action) {
      case 'clear_history':
        await rag.clearConversationHistory(userId);
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Conversation history cleared successfully' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'get_stats':
        const messageCount = await rag.getConversationCount(userId);
        return new Response(JSON.stringify({
          success: true,
          data: {
            messageCount,
            subscriptionTier: profile.subscription_tier
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Invalid action', { status: 400 });
    }
    
  } catch (error) {
    console.error('Error in conversation management:', error);
    return new Response('Internal server error', { status: 500 });
  }
}