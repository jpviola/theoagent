'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  return supabaseClient
}

// Export a getter function instead of the client directly
export const supabase = getSupabaseClient()

// Export as default for backward compatibility
export default supabase