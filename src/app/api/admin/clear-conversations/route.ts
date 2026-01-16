import { getSantaPalabraRAG } from '@/lib/langchain-rag';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 30;

export async function POST() {
  try {
    console.log('🗑️ Admin: Clearing all conversation histories');
    
    // Get all user IDs
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id');
      
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No users found to clear' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Clear conversation history for all users
    const rag = await getSantaPalabraRAG();
    let clearedCount = 0;
    
    for (const user of users) {
      try {
        await rag.clearConversationHistory(user.id);
        clearedCount++;
      } catch (error) {
        console.error(`Failed to clear history for user ${user.id}:`, error);
      }
    }
    
    // Also clear conversation records from database
    const { error: dbError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
    if (dbError) {
      console.error('Failed to clear database conversations:', dbError);
    }
    
    console.log(`✅ Cleared conversation histories for ${clearedCount}/${users.length} users`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully cleared conversation histories for ${clearedCount} users`,
      clearedCount,
      totalUsers: users.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error clearing conversations:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to clear conversations',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
