'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase-client'
import type { Database } from '@/lib/supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, userData?: { full_name?: string, institution_name?: string }) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // Avoid noisy Next.js error overlay when the error object is empty
        // (network/CORS failures can surface as empty error objects).
        console.warn('Error fetching profile (will fallback to null):', error)
        setProfile(null)
      } else if (data) {
        setProfile(data as Profile)
      }
    } catch (error) {
      console.warn('Error fetching profile (exception):', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const result = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    return result
  }

  const signUp = async (
    email: string, 
    password: string, 
    userData?: { full_name?: string, institution_name?: string }
  ) => {
    setLoading(true)
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)
    return result
  }

  const signOut = async () => {
    setLoading(true)
    const result = await supabase.auth.signOut()
    setLoading(false)
    return result
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    setLoading(false)
    return result
  }

  const resetPassword = async (email: string) => {
    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`
    })
    return result
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Custom hooks for common auth patterns
export function useRequireAuth() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      // Redirect to sign in or show auth modal
      window.location.href = '/?auth=signin'
    }
  }, [auth.user, auth.loading])
  
  return auth
}

export function useAuthRedirect() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.loading && auth.user) {
      // User is signed in, redirect them away from auth pages
      const isAuthPage = window.location.pathname.includes('/auth/')
      if (isAuthPage) {
        window.location.href = '/'
      }
    }
  }, [auth.user, auth.loading])
  
  return auth
}