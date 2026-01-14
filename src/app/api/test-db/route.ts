import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Simple database connection test endpoint
export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (connectionError) {
      throw connectionError
    }

    // Test 2: Check theological sources
    const { data: sourcesTest, error: sourcesError } = await supabase
      .from('theological_sources')
      .select('count', { count: 'exact', head: true })

    if (sourcesError) {
      throw sourcesError
    }

    // Test 3: Check daily gospel
    const { data: gospelTest, error: gospelError } = await supabase
      .from('daily_gospel_readings')
      .select('count', { count: 'exact', head: true })

    if (gospelError) {
      throw gospelError
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful! ✅',
      tables: {
        profiles: connectionTest?.length ?? 0,
        theological_sources: sourcesTest?.length ?? 0,
        daily_gospel_readings: gospelTest?.length ?? 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database test error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed ❌',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}