'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance to be shared across components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export as default for backward compatibility
export default supabase