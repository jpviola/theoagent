'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { authAnalytics } from '../lib/auth-analytics'

interface VerificationUser {
  email?: string | null
  email_confirmed_at?: string | null
}

interface EmailVerificationBannerProps {
  user: VerificationUser | null
  onVerified?: () => void
  autoRefreshInterval?: number // Auto-refresh interval in seconds (default: 30)
  className?: string
}

// Email provider detection for better UX
const getEmailProvider = (email: string) => {
  const domain = email.split('@')[1]?.toLowerCase()
  const providers: Record<string, { name: string; url: string; color: string }> = {
    'gmail.com': { name: 'Gmail', url: 'https://mail.google.com', color: 'text-red-600' },
    'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com', color: 'text-blue-600' },
    'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com', color: 'text-blue-600' },
    'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com', color: 'text-purple-600' },
    'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', color: 'text-gray-600' },
  }
  return providers[domain] || null
}

export default function EmailVerificationBanner({ 
  user, 
  onVerified, 
  autoRefreshInterval = 30,
  className = ''
}: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [isResent, setIsResent] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [error, setError] = useState('')
  const [resendCount, setResendCount] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

  const emailProvider = user?.email ? getEmailProvider(user.email) : null
  const maxResends = 3
  const cooldownTime = 60 // seconds

  // Load dismissal state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const dismissalKey = `email-verification-dismissed-${user.email}`
      const isDismissedStored = localStorage.getItem(dismissalKey) === 'true'
      setIsDismissed(isDismissedStored)
      
      // Load last resend time
      const lastResendKey = `email-verification-last-resend-${user.email}`
      const storedLastResend = localStorage.getItem(lastResendKey)
      if (storedLastResend) {
        const lastResend = parseInt(storedLastResend, 10)
        
        // Check if still in cooldown
        const timeSinceLastResend = (Date.now() - lastResend) / 1000
        if (timeSinceLastResend < cooldownTime) {
          setCooldownSeconds(Math.ceil(cooldownTime - timeSinceLastResend))
        }
      }
    }
  }, [user?.email])

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownSeconds])

  // Auto-refresh verification status
  useEffect(() => {
    if (!user?.email_confirmed_at && !isDismissed && autoRefreshInterval > 0) {
      const interval = setInterval(async () => {
        setIsCheckingStatus(true)
        try {
          const { data: { user: refreshedUser } } = await supabase.auth.getUser()
          if (refreshedUser?.email_confirmed_at && onVerified) {
            onVerified()
          }
        } catch (error) {
          console.error('Error checking verification status:', error)
        } finally {
          setIsCheckingStatus(false)
        }
      }, autoRefreshInterval * 1000)
      
      return () => clearInterval(interval)
    }
  }, [user?.email_confirmed_at, isDismissed, autoRefreshInterval, onVerified])

  // Don't show if user is verified or banner is dismissed
  if (user?.email_confirmed_at || isDismissed) {
    return null
  }

  const handleResendVerification = async () => {
    if (!user?.email || cooldownSeconds > 0 || resendCount >= maxResends) return

    setIsResending(true)
    setError('')

    // Analytics: Track email verification resend
    authAnalytics.emailVerificationSent(user.email)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        // Enhanced error handling
        if (error.message?.includes('rate limit')) {
          setError('Too many requests. Please wait before trying again.')
          setCooldownSeconds(cooldownTime)
        } else if (error.message?.includes('invalid')) {
          setError('Invalid email address. Please contact support.')
        } else {
          setError(`Failed to resend verification email: ${error.message}`)
        }
        throw error
      }

      // Success - update state and localStorage
      const newCount = resendCount + 1
      setResendCount(newCount)
      setIsResent(true)
      setCooldownSeconds(cooldownTime)
      
      const currentTime = Date.now()
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(`email-verification-last-resend-${user.email}`, currentTime.toString())
      }
      
      // Auto-hide success message
      setTimeout(() => setIsResent(false), 5000)
      
    } catch (err) {
      console.error('Resend verification error:', err)
    } finally {
      setIsResending(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    if (typeof window !== 'undefined' && user?.email) {
      localStorage.setItem(`email-verification-dismissed-${user.email}`, 'true')
    }
  }

  const handleOpenEmailProvider = () => {
    if (emailProvider) {
      window.open(emailProvider.url, '_blank')
    }
  }

  return (
    <div 
      className={`bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 md:p-6 mb-4 shadow-sm ${className}`}
      role="alert"
      aria-live="polite"
      aria-label="Email verification required"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            <svg 
              className="w-6 h-6 text-amber-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-amber-800">
                Please verify your email address
              </h3>
              {isCheckingStatus && (
                <div className="flex items-center">
                  <svg className="animate-spin h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs text-amber-600 ml-1">Checking...</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-amber-700">
                We sent a verification link to{' '}
                <span className="font-semibold break-all">{user?.email}</span>.
              </p>
              
              {emailProvider && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-amber-600">Check your inbox in</span>
                  <button
                    onClick={handleOpenEmailProvider}
                    className={`text-xs font-medium underline hover:no-underline ${emailProvider.color}`}
                    aria-label={`Open ${emailProvider.name}`}
                  >
                    {emailProvider.name}
                  </button>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700" role="alert">{error}</p>
                </div>
              </div>
            )}
            
            {isResent && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700" role="status">
                    ✅ Verification email resent! Please check your inbox and spam folder.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-500 hover:text-amber-700 ml-2 p-1 rounded-full hover:bg-amber-100 transition-colors"
          aria-label="Dismiss email verification banner"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-4 pt-4 border-t border-amber-200">
        <button
          onClick={handleResendVerification}
          disabled={isResending || cooldownSeconds > 0 || resendCount >= maxResends}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-amber-100 hover:bg-amber-200 text-amber-800"
          aria-describedby={cooldownSeconds > 0 ? 'cooldown-message' : undefined}
        >
          {isResending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : cooldownSeconds > 0 ? (
            `Wait ${cooldownSeconds}s`
          ) : resendCount >= maxResends ? (
            'Max attempts reached'
          ) : isResent ? (
            'Email Sent!'
          ) : (
            `Resend Email${resendCount > 0 ? ` (${resendCount}/${maxResends})` : ''}`
          )}
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-amber-700 hover:text-amber-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded px-2 py-1"
          aria-label="Refresh page to check if email is already verified"
        >
          Already verified? Refresh page
        </button>
        
        {cooldownSeconds > 0 && (
          <span id="cooldown-message" className="text-xs text-amber-600">
            Please wait before trying again
          </span>
        )}
      </div>
      
      {resendCount > 0 && (
        <div className="mt-3 text-xs text-amber-600">
          💡 Tip: Check your spam folder. Having trouble? Contact support.
        </div>
      )}
    </div>
  )
}
