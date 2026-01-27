'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import OnboardingFlow from './OnboardingFlow'
import MFASetup from './MFASetup'
import EmailVerificationBanner from './EmailVerificationBanner'

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

  useEffect(() => {
    // Pure Guest Mode: Check localStorage for onboarding completion
    // No Supabase Auth required for the main flow
    try {
      const isGuestOnboarded = localStorage.getItem('santapalabra_beta_onboarding_completed') === 'true';
      
      if (isGuestOnboarded) {
        setCurrentStep('authenticated');
      } else {
        setCurrentStep('onboarding');
      }
    } catch (err) {
      console.error('AuthFlowManager: Error checking guest status', err);
      setCurrentStep('onboarding');
    }
  }, []);

  const handleOnboardingComplete = () => {
    // Mark as completed in localStorage
    localStorage.setItem('santapalabra_beta_onboarding_completed', 'true');
    setCurrentStep('authenticated');
  }

  const handleSkipOnboarding = () => {
    localStorage.setItem('santapalabra_beta_onboarding_completed', 'true');
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
    </>
  )
}
