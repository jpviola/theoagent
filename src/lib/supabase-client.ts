'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

type MockResult = {
  data: null
  error: Error
}

interface MockQueryBuilder {
  select: () => Promise<MockResult>
  insert: () => Promise<MockResult>
  upsert: () => Promise<MockResult>
  update: () => MockQueryBuilder
  delete: () => MockQueryBuilder
  eq: () => MockQueryBuilder
  single: () => Promise<MockResult>
  order: () => MockQueryBuilder
  limit: () => MockQueryBuilder
}

const createMockSupabase = () => {
  const asyncError = async (action: string): Promise<MockResult> => ({
    data: null,
    error: new Error(`Supabase no configurado: ${action}`)
  })
  const subscription = { unsubscribe: () => {} }

  const mockResult: MockResult = { data: null, error: new Error('Supabase no configurado') }

  const createQueryBuilder = (): MockQueryBuilder => {
    const builder: MockQueryBuilder = {
      select: async () => mockResult,
      insert: async () => mockResult,
      upsert: async () => mockResult,
      update: () => builder,
      delete: () => builder,
      eq: () => builder,
      single: async () => mockResult,
      order: () => builder,
      limit: () => builder
    }
    return builder
  }

  return {
    from: () => createQueryBuilder(),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      refreshSession: async () => asyncError('refreshSession'),
      resend: async () => asyncError('resend'),
      onAuthStateChange: () => ({ data: { subscription } }),
      signInWithPassword: async () => asyncError('signInWithPassword'),
      signInWithOAuth: async () => asyncError('signInWithOAuth'),
      signUp: async () => asyncError('signUp'),
      signOut: async () => asyncError('signOut'),
      resetPasswordForEmail: async () => asyncError('resetPasswordForEmail'),
      setSession: async () => asyncError('setSession'),
      updateUser: async () => asyncError('updateUser'),
      mfa: {
        listFactors: async () => asyncError('mfa.listFactors'),
        enroll: async () => asyncError('mfa.enroll'),
        challengeAndVerify: async () => asyncError('mfa.challengeAndVerify'),
        challenge: async () => asyncError('mfa.challenge')
      }
    }
  } as unknown as ReturnType<typeof createClient<Database>>
}

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase environment variables, using mock Supabase client')
      supabaseClient = createMockSupabase()
      return supabaseClient
    }

    try {
      supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        }
      })
    } catch (error) {
      console.error('Error creating Supabase client:', error)
      return null
    }
  }

  return supabaseClient
}

// Export a getter function instead of the client directly
export const supabase = getSupabaseClient() as ReturnType<typeof createClient<Database>>

// Export as default for backward compatibility
export default supabase
