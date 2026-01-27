import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with Service Role Key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback if service key missing (but anon key might be blocked by RLS)
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, ...profileData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing guest ID' }, { status: 400 });
    }

    // Check if we have the service role key to write securely
    // If not, we rely on the public RLS policy we just created
    
    const { error } = await supabaseAdmin
      .from('guest_profiles')
      .upsert({
        id,
        ...profileData,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving guest profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Guest API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
