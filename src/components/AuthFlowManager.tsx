'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
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

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export default function AuthFlowManager({ 
  children, 
  requireMFA = false, 
  requireVerification = true 
}: AuthFlowManagerProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('loading')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin')

  useEffect(() => {
    // Pure Guest Mode: Check localStorage for onboarding completion
    // No Supabase Auth required for the main flow
    try {
      const isGuestOnboarded = localStorage.getItem('sp_guest_onboarding_completed') === 'true';
      
      if (isGuestOnboarded) {
        console.log('AuthFlowManager: Guest onboarding completed (localStorage) -> Authenticated');
        setCurrentStep('authenticated');
      } else {
        console.log('AuthFlowManager: Guest onboarding NOT completed -> Onboarding');
        setCurrentStep('onboarding');
      }
    } catch (err) {
      console.error('AuthFlowManager: Error checking guest status', err);
      setCurrentStep('onboarding');
    }
  }, []);

  const handleOnboardingComplete = () => {
    // Mark as completed in localStorage
    localStorage.setItem('sp_guest_onboarding_completed', 'true');
    setCurrentStep('authenticated');
  }

  const handleSkipOnboarding = () => {
    localStorage.setItem('sp_guest_onboarding_completed', 'true');
    setCurrentStep('authenticated');
  }

  // Render content based on current step
  if (currentStep === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando experiencia...</p>
        </div>
      </div>
    )
  }

  if (currentStep === 'onboarding') {
    return (
      <OnboardingFlow 
        user={{} as User} // Mock user for interface compatibility
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    )
  }

  // Authenticated (or Guest Authenticated) - Show App
  return (
    <>
      {children}
      {/* AuthModal is kept in case we want to offer optional login later, but hidden by default */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  )
}
