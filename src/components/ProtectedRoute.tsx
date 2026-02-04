'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Profile {
  subscription_tier: 'free' | 'plus' | 'expert'
  subscription_status: 'active' | 'canceled' | 'past_due'
}

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  requireEmailVerified?: boolean
  requiredSubscriptionTier?: 'free' | 'plus' | 'expert'
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  fallback,
  requireEmailVerified = false,
  requiredSubscriptionTier,
  redirectTo = '/'
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile if needed for subscription checks
          if (requiredSubscriptionTier) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('subscription_tier, subscription_status')
              .eq('id', session.user.id)
              .single()
            
            if (profileError) {
              console.error('Error fetching profile:', profileError)
            } else {
              setProfile(profileData as Profile)
            }
          }
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Authentication check failed')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (!session?.user) {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [requiredSubscriptionTier])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto dark:bg-red-900">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Authentication Error</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // User not authenticated
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto dark:bg-slate-800">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white">Authentication Required</h2>
            <p className="text-gray-600 mb-6 dark:text-gray-300">You need to be signed in to access this page.</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = redirectTo}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors dark:bg-transparent dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Email verification required
  if (requireEmailVerified && !user.email_confirmed_at) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7]">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
            <p className="text-gray-600 mb-6">
              Please verify your email address to access this feature. Check your inbox for the verification link.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={async () => {
                const { error } = await supabase.auth.resend({
                  type: 'signup',
                  email: user.email!,
                })
                if (error) {
                  alert('Error resending email: ' + error.message)
                } else {
                  alert('Verification email sent!')
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Subscription tier check
  if (requiredSubscriptionTier && profile) {
    const tierHierarchy = { free: 0, plus: 1, expert: 2 }
    const userTier = tierHierarchy[profile.subscription_tier]
    const requiredTier = tierHierarchy[requiredSubscriptionTier]
    
    if (userTier < requiredTier || profile.subscription_status !== 'active') {
      if (fallback) {
        return <>{fallback}</>
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-t from-[#a4becf] via-[#d0dce6] to-[#f0f4f7]">
          <div className="text-center space-y-6 max-w-md px-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Required</h2>
              <p className="text-gray-600 mb-6">
                You need a <strong>{requiredSubscriptionTier}</strong> subscription or higher to access this feature.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/?pricing=true'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                View Pricing
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking auth status
export function useRequireAuth(options: {
  requireEmailVerified?: boolean
  requiredSubscriptionTier?: 'free' | 'plus' | 'expert'
} = {}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (!currentUser) {
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      // Check email verification
      if (options.requireEmailVerified && !currentUser.email_confirmed_at) {
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      // Check subscription tier if required
      if (options.requiredSubscriptionTier) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_status')
          .eq('id', currentUser.id)
          .single()
        
        if (profileData) {
          setProfile(profileData as Profile)
          const tierHierarchy = { free: 0, plus: 1, expert: 2 }
          const userTier = tierHierarchy[profileData.subscription_tier as keyof typeof tierHierarchy]
          const requiredTier = tierHierarchy[options.requiredSubscriptionTier]
          
          if (userTier < requiredTier || profileData.subscription_status !== 'active') {
            setIsAuthorized(false)
            setLoading(false)
            return
          }
        }
      }

      setIsAuthorized(true)
      setLoading(false)
    }

    checkAuth()
  }, [options.requireEmailVerified, options.requiredSubscriptionTier])

  return { user, profile, isAuthorized, loading }
}