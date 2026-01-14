'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase'
import { AuthProvider } from '@/lib/auth-context'
import AuthModal from './AuthModal'
import OnboardingFlow from './OnboardingFlow'
import MFASetup from './MFASetup'
import EmailVerificationBanner from './EmailVerificationBanner'

// Debug environment variables
console.log('AuthFlowManager: Environment check:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  urlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  anonKeyStart: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)
});

interface AuthFlowManagerProps {
  children: React.ReactNode
  requireMFA?: boolean // Whether MFA is required for this app
  requireVerification?: boolean // Whether email verification is required
}

type AuthStep = 'loading' | 'unauthenticated' | 'verification' | 'mfa' | 'onboarding' | 'authenticated'

export default function AuthFlowManager({ 
  children, 
  requireMFA = false, 
  requireVerification = true 
}: AuthFlowManagerProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('loading')
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin')

  // User status flags
  const [emailVerified, setEmailVerified] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  useEffect(() => {
    initializeAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('AuthFlowManager: Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        console.log('AuthFlowManager: User found in session, setting user and checking status')
        setUser(session.user)
        setSession(session)
        await checkUserStatus(session.user)
      } else {
        console.log('AuthFlowManager: No user in session, setting to unauthenticated')
        setUser(null)
        setSession(null)
        setCurrentStep('unauthenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    console.log('AuthFlowManager: Initializing authentication...');
    
    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      console.log('AuthFlowManager: Supabase connection test:', { success: !error, error: error?.message });
    } catch (connError) {
      console.log('AuthFlowManager: Supabase connection failed:', connError);
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('AuthFlowManager: Session check result:', { session: !!session, error, userId: session?.user?.id });
      
      if (error) {
        console.error('Session error:', error)
        setCurrentStep('unauthenticated')
        return
      }

      if (session?.user) {
        setUser(session.user)
        setSession(session)
        await checkUserStatus(session.user)
      } else {
        console.log('AuthFlowManager: No session found, setting to unauthenticated');
        setCurrentStep('unauthenticated')
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      setCurrentStep('unauthenticated')
    }
  }

  const checkUserStatus = async (user: any) => {
    console.log('AuthFlowManager: Checking user status for:', user.id)
    try {
      // Check email verification
      const isEmailVerified = !!user.email_confirmed_at
      setEmailVerified(isEmailVerified)
      console.log('AuthFlowManager: Email verified:', isEmailVerified, 'requireVerification:', requireVerification)

      // Check MFA status
      let mfaVerified = false
      if (requireMFA) {
        try {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          const activeFactor = factors?.totp?.find((f: any) => f.status === 'verified')
          mfaVerified = !!activeFactor
          setMfaEnabled(mfaVerified)
        } catch (error) {
          console.error('MFA check error:', error)
          mfaVerified = false
        }
      } else {
        mfaVerified = true // Skip MFA check if not required
        setMfaEnabled(true)
      }

      // Check onboarding status
      let onboardingDone = false
      try {
        // Check user metadata first
        onboardingDone = user.user_metadata?.onboarding_completed || false
        
        // If not in metadata, check the profiles table
        if (!onboardingDone) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single()
          
          onboardingDone = (profile as any)?.onboarding_completed || false
        }
      } catch (error) {
        console.log('Onboarding check error:', error)
        onboardingDone = false
      }
      
      setOnboardingCompleted(onboardingDone)
      console.log('AuthFlowManager: Onboarding status - completed:', onboardingDone)

      // Determine auth step
      console.log('AuthFlowManager: Determining auth step with:', {
        isEmailVerified,
        requireVerification,
        mfaVerified,
        requireMFA,
        onboardingDone
      })
      
      if (!isEmailVerified && requireVerification) {
        console.log('AuthFlowManager: Moving to verification step')
        setCurrentStep('verification')
      } else if (!mfaVerified && requireMFA) {
        console.log('AuthFlowManager: Moving to MFA step')
        setCurrentStep('mfa')
      } else if (!onboardingDone) {
        console.log('AuthFlowManager: Moving to onboarding step - onboardingDone:', onboardingDone)
        setCurrentStep('onboarding')
      } else {
        console.log('AuthFlowManager: User fully authenticated - moving to authenticated step')
        setCurrentStep('authenticated')
      }
    } catch (error) {
      console.error('User status check error:', error)
      setCurrentStep('authenticated') // Fail open
    }
  }

  const handleSignUp = () => {
    console.log('AuthFlowManager: handleSignUp called');
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    console.log('AuthFlowManager: handleSignIn called');
    setAuthMode('signin')
    setShowAuthModal(true)
  }

  const handlePasswordReset = () => {
    setAuthMode('reset')
    setShowAuthModal(true)
  }

  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    // User status will be checked via auth state change
  }

  const handleVerificationComplete = async () => {
    if (user) {
      await checkUserStatus(user)
    }
  }

  const handleMFAComplete = async () => {
    if (user) {
      await checkUserStatus(user)
    }
  }

  const handleOnboardingComplete = async () => {
    if (user) {
      await checkUserStatus(user)
    }
  }

  const handleSkipOnboarding = async () => {
    console.log('AuthFlowManager: Skipping onboarding for testing...')
    try {
      // Mark onboarding as completed even if skipped
      await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      })
      
      console.log('AuthFlowManager: Updated user metadata with onboarding_completed: true')
      
      if (user) {
        await checkUserStatus(user)
      }
    } catch (error) {
      console.error('Skip onboarding error:', error)
      console.log('AuthFlowManager: Forcing move to authenticated state due to skip error')
      setCurrentStep('authenticated') // Continue anyway
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setCurrentStep('unauthenticated')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Render loading state
  if (currentStep === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#F4B400] to-[#FFCC00] rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <div className="animate-spin">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">SantaPalabra Cargando...</h2>
          <p className="text-gray-600">Preparando tu asistente teológico...</p>
        </div>
      </div>
    )
  }

  // Render unauthenticated state
  if (currentStep === 'unauthenticated') {
    console.log('AuthFlowManager: Rendering unauthenticated state, showAuthModal:', showAuthModal);
    console.log('AuthFlowManager: About to pass handlers:', { 
      handleSignUp: typeof handleSignUp, 
      handleSignIn: typeof handleSignIn,
      handlePasswordReset: typeof handlePasswordReset
    });
    
    const authContextValue = {
      onSignUp: handleSignUp,
      onSignIn: handleSignIn,
      onPasswordReset: handlePasswordReset,
      user: null,
      session: null
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-amber-50">
        {/* Auth modals */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            initialMode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* Pass auth handlers via context */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </div>
    )
  }

  // Render email verification step
  if (currentStep === 'verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-amber-50">
        <EmailVerificationBanner
          user={user}
          onVerified={handleVerificationComplete}
        />
        
        <div className="pt-20">
          <div className="max-w-2xl mx-auto p-8 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Email</h1>
            <p className="text-lg text-gray-600 mb-8">
              We've sent a verification email to <strong>{user?.email}</strong>. 
              Please check your inbox and click the verification link to continue.
            </p>
            
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Why verify your email?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Secure your account</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Receive important notifications</span>
                </div>
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Access all santaPalabra features</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Sign out and use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render MFA step
  if (currentStep === 'mfa') {
    return (
      <MFASetup
        user={user}
        onClose={handleMFAComplete}
        onSuccess={handleMFAComplete}
        enforced={requireMFA}
      />
    )
  }

  // Render onboarding step
  if (currentStep === 'onboarding') {
    return (
      <OnboardingFlow
        user={user}
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    )
  }

  // Render authenticated state
  if (currentStep === 'authenticated') {
    console.log('AuthFlowManager: Rendering authenticated state with user:', user?.id)
    
    const authContextValue = {
      user,
      session,
      onSignOut: handleSignOut,
      onSignIn: handleSignIn,
      onSignUp: handleSignUp,
      onPasswordReset: handlePasswordReset
    };
    
    return (
      <AuthProvider>
        {/* Show email verification banner if not verified but not required */}
        {!emailVerified && !requireVerification && (
          <EmailVerificationBanner
            user={user}
            onVerified={handleVerificationComplete}
          />
        )}
        {children}
      </AuthProvider>
    )
  }

  return null
}